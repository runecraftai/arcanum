import graphify from "./setup-graphify.md" with { type: "text" };
import dcp from "./setup-dynamic-context-pruning.md" with { type: "text" };
import markitdown from "./setup-markitdown.md" with { type: "text" };
import context7 from "./setup-context7.md" with { type: "text" };
import exa from "./setup-exa.md" with { type: "text" };
import grepApp from "./setup-grep-app.md" with { type: "text" };
import agentsMd from "./setup-agents-md.md" with { type: "text" };

export const PROMPTS = {
  graphify,
  dcp,
  markitdown,
  context7,
  exa,
  grepApp,
  agentsMd,
} as const;
