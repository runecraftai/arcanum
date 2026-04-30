/**
 * Workflow execution engine
 * Sequential step executor with gate pauses and inter-step data flow
 */

import { join } from "path";
import { z } from "zod";
import { WorkflowSchema } from "../schema.js";
import type { WorkflowState, WorkflowResponse, WorkflowStatus } from "./types.js";
import {
  persistState,
  loadState,
  generateResumeToken,
} from "./state.js";
import { interpolateTemplate } from "./interpolation.js";
import { handleGateStep, type GateResult } from "./gates.js";

export class WorkflowEngine {
  private workflows: Record<string, z.infer<typeof WorkflowSchema>>;
  private sessionDir: string;

  constructor(
    workflows: Record<string, z.infer<typeof WorkflowSchema>> | undefined,
    sessionDir: string
  ) {
    this.workflows = workflows || {};
    this.sessionDir = sessionDir;
  }

  /**
   * Start a new workflow
   */
  async start(workflowName: string, goal: string): Promise<WorkflowResponse> {
    const workflow = this.workflows[workflowName];
    if (!workflow) {
      return {
        status: "error" as const,
        resumeToken: "",
        progress: { completed: 0, total: 0, currentStepId: "" },
      };
    }

    const resumeToken = generateResumeToken();
    const state: WorkflowState = {
      workflowName,
      goal,
      steps: workflow.steps,
      currentStepIndex: 0,
      stepOutputs: {},
      status: "running",
      resumeToken,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await persistState(state, this.sessionDir);

    return this.advanceToNextStep(state);
  }

  /**
   * Handle gate action: wait
   */
  private async handleGateActionWait(
    state: WorkflowState
  ): Promise<WorkflowResponse> {
    state.status = "waiting_for_gate";
    state.updatedAt = new Date().toISOString();
    await persistState(state, this.sessionDir);
    return this.buildResponse(state);
  }

  /**
   * Handle gate action: advance
   */
  private async handleGateActionAdvance(
    state: WorkflowState
  ): Promise<void> {
    state.currentStepIndex++;
  }

  /**
   * Handle gate action: jump
   */
  private async handleGateActionJump(
    state: WorkflowState,
    targetStepId?: string
  ): Promise<WorkflowResponse | void> {
    if (!targetStepId) return;

    const targetIdx = state.steps.findIndex((s) => s.id === targetStepId);
    if (targetIdx === -1) {
      // Invalid step ID reference (CRITICAL-8)
      console.error(`Invalid jump target: step "${targetStepId}" not found`);
      state.status = "error";
      state.updatedAt = new Date().toISOString();
      await persistState(state, this.sessionDir);
      return {
        status: "error" as const,
        resumeToken: state.resumeToken,
        progress: {
          completed: state.currentStepIndex,
          total: state.steps.length,
          currentStepId: "",
        },
      };
    }
    state.currentStepIndex = targetIdx;
  }

  /**
   * Handle gate action: end
   */
  private async handleGateActionEnd(
    state: WorkflowState
  ): Promise<WorkflowResponse> {
    state.status = "ended";
    state.updatedAt = new Date().toISOString();
    await persistState(state, this.sessionDir);
    return this.buildResponse(state);
  }

  /**
   * Gate action handlers using object literal dispatch pattern
   */
  private gateActionHandlers: Record<
    string,
    (state: WorkflowState, targetStepId?: string) => Promise<WorkflowResponse | void>
  > = {
    wait: (state) => this.handleGateActionWait(state),
    advance: (state) => this.handleGateActionAdvance(state),
    jump: (state, targetStepId) => this.handleGateActionJump(state, targetStepId),
    end: (state) => this.handleGateActionEnd(state),
  };

  /**
   * Resume a paused workflow
   */
  async resume(
    resumeToken: string,
    stepOutput?: string,
    gateDecision?: "approve" | "reject"
  ): Promise<WorkflowResponse> {
    const state = await loadState(resumeToken, this.sessionDir);
    if (!state) {
      return {
        status: "error" as const,
        resumeToken,
        progress: { completed: 0, total: 0, currentStepId: "" },
      };
    }

    // Record step output to the step that just completed (CRITICAL-7)
    if (stepOutput && state.currentStepIndex > 0) {
      const completedStep = state.steps[state.currentStepIndex - 1];
      if (completedStep) {
        state.stepOutputs[completedStep.id] = stepOutput;
      }
    }

    // Handle gate decision
    if (gateDecision && state.currentStepIndex < state.steps.length) {
      const currentStep = state.steps[state.currentStepIndex];
      if (currentStep && currentStep.type === "gate") {
        const gateResult = handleGateStep(currentStep as any, gateDecision);
        const handler = this.gateActionHandlers[gateResult.action];

        if (handler) {
          const result = await handler(state, gateResult.targetStepId);
          if (result) return result; // Return early if handler returns a response
        }
      } else if (currentStep) {
        // Warn if gateDecision provided for non-gate step (LOW-11)
        console.warn(
          `Gate decision provided for non-gate step "${currentStep.id}" (type: ${currentStep.type})`
        );
      }
    }

    state.updatedAt = new Date().toISOString();
    return this.advanceToNextStep(state);
  }

  /**
   * Handle agent step execution
   */
  private async handleAgentStep(
    step: any,
    state: WorkflowState
  ): Promise<WorkflowResponse> {
    const input = step.input
      ? interpolateTemplate(step.input, state.stepOutputs)
      : "";

    // Sanitize goal to prevent prompt injection (MEDIUM-5)
    const sanitizedGoal = state.goal.replace(/[\r\n]/g, " ").slice(0, 1000);
    const prompt = `${input}\n\nGoal: ${sanitizedGoal}`;

    state.status = "running";
    state.updatedAt = new Date().toISOString();
    await persistState(state, this.sessionDir);

    return {
      status: "running" as const,
      currentStep: { id: step.id, type: "agent" },
      agent: step.agent,
      prompt,
      resumeToken: state.resumeToken,
      progress: {
        completed: state.currentStepIndex,
        total: state.steps.length,
        currentStepId: step.id,
      },
    };
  }

  /**
   * Handle gate step waiting
   */
  private async handleGateStepWait(
    step: any,
    state: WorkflowState
  ): Promise<WorkflowResponse> {
    state.status = "waiting_for_gate";
    state.updatedAt = new Date().toISOString();
    await persistState(state, this.sessionDir);

    return {
      status: "waiting_for_gate" as const,
      currentStep: { id: step.id, type: "gate" },
      gate: step.gate,
      resumeToken: state.resumeToken,
      progress: {
        completed: state.currentStepIndex,
        total: state.steps.length,
        currentStepId: step.id,
      },
    };
  }

  /**
   * Step type handlers using object literal dispatch pattern
   */
  private stepHandlers: Record<
    string,
    (step: any, state: WorkflowState) => Promise<WorkflowResponse>
  > = {
    agent: (step, state) => this.handleAgentStep(step, state),
    gate: (step, state) => this.handleGateStepWait(step, state),
  };

  /**
   * Core step execution loop
   */
  private async advanceToNextStep(
    state: WorkflowState
  ): Promise<WorkflowResponse> {
    // Check if workflow is complete
    if (state.currentStepIndex >= state.steps.length) {
      state.status = "completed";
      state.updatedAt = new Date().toISOString();
      await persistState(state, this.sessionDir);
      return this.buildResponse(state);
    }

    const step = state.steps[state.currentStepIndex];
    const handler = this.stepHandlers[step.type];

    if (!handler) {
      // Unknown step type
      state.status = "error";
      state.updatedAt = new Date().toISOString();
      await persistState(state, this.sessionDir);
      return this.buildResponse(state);
    }

    return handler(step, state);
  }

  /**
   * Build response from current state
   */
  private buildResponse(state: WorkflowState): WorkflowResponse {
    const currentStep =
      state.currentStepIndex < state.steps.length
        ? state.steps[state.currentStepIndex]
        : undefined;

    return {
      status: state.status,
      currentStep: currentStep
        ? { id: currentStep.id, type: currentStep.type }
        : undefined,
      resumeToken: state.resumeToken,
      progress: {
        completed: state.currentStepIndex,
        total: state.steps.length,
        currentStepId: currentStep?.id || "",
      },
    };
  }
}
