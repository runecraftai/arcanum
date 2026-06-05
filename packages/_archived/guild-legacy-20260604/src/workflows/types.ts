/**
 * Type definitions for workflow engine
 */

import type { WorkflowStepSchema } from "../schema.js";
import { z } from "zod";

export type WorkflowStepDef = z.infer<typeof WorkflowStepSchema>;

export type WorkflowStatus = "running" | "waiting_for_gate" | "completed" | "ended" | "error";

export interface WorkflowState {
  workflowName: string;
  goal: string;
  steps: WorkflowStepDef[];
  currentStepIndex: number;
  stepOutputs: Record<string, string>;
  status: WorkflowStatus;
  resumeToken: string;
  startedAt: string;
  updatedAt: string;
}

export interface WorkflowResponse {
  status: WorkflowStatus;
  currentStep?: {
    id: string;
    type: string;
  };
  agent?: string;
  prompt?: string;
  gate?: string;
  resumeToken: string;
  progress: {
    completed: number;
    total: number;
    currentStepId: string;
  };
}

export interface StepResult {
  stepId: string;
  output?: string;
  decision?: "approve" | "reject";
}
