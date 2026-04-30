/**
 * Gate step handling for workflow pauses and approvals
 */

import type { WorkflowStepDef } from "./types.js";

export interface GateResult {
  action: "wait" | "advance" | "jump" | "end";
  targetStepId?: string;
}

/**
 * Action resolver map for gate decisions
 * Uses object literal dispatch pattern to reduce cyclomatic complexity
 */
const gateActionResolvers: Record<
  string,
  (step: WorkflowStepDef & { type: "gate" }) => GateResult
> = {
  approve: (step) =>
    step.on_approve
      ? { action: "jump", targetStepId: step.on_approve }
      : { action: "advance" },
  reject: (step) => {
    const onReject = step.on_reject || "end";
    return onReject === "end"
      ? { action: "end" }
      : { action: "jump", targetStepId: onReject };
  },
};

/**
 * Handle gate step logic
 * - No decision: wait for approval
 * - Approve: advance or jump if on_approve specified
 * - Reject: end or jump if on_reject specified
 */
export function handleGateStep(
  step: WorkflowStepDef & { type: "gate" },
  decision?: "approve" | "reject"
): GateResult {
  if (!decision) {
    return { action: "wait" };
  }

  const resolver = gateActionResolvers[decision];
  return resolver ? resolver(step) : { action: "wait" };
}
