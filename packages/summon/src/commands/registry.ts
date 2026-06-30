import type { SupportedRuntime } from "./generator";

export interface CommandMapping {
  name: string;
  skill?: string;
  description: string;
  builtinNames?: Partial<Record<SupportedRuntime, string>>;
  bodyExtras?: string;
}

export const COMMANDS: CommandMapping[] = [
  {
    name: "plan",
    skill: "idea-refine",
    description: "Plan a feature with idea-refine and interview-me",
    bodyExtras:
      "Default behavior: divergent/convergent thinking to shape a proposal. If the user responds with ambiguity, chain into interview-me for one-question-at-a-time extraction.",
  },
  {
    name: "review",
    skill: "code-review-and-quality",
    description: "Review changes with five-axis critique",
    builtinNames: {
      "claude-code": "review",
    },
  },
  {
    name: "test",
    skill: "test-driven-development",
    description: "Run or generate tests with TDD pyramid",
  },
  {
    name: "simplify",
    skill: "code-simplification",
    description: "Simplify code with Chesterton's Fence and Rule of 500",
  },
  {
    name: "ship",
    skill: "shipping-and-launch",
    description: "Pre-launch checklist and feature flag rollout",
    bodyExtras: "OpenCode also injects `git log --oneline -10` for recent context.",
  },
  {
    name: "security",
    skill: "security-and-hardening",
    description: "Security audit with OWASP and three-tier boundaries",
  },
  {
    name: "debug",
    skill: "debugging-and-error-recovery",
    description: "Five-step debugging triage",
  },
  {
    name: "harden",
    skill: "doubt-driven-development",
    description: "Adversarial review: CLAIM → EXTRACT → DOUBT → RECONCILE",
  },
];
