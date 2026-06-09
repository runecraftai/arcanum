# Guild Agent Handoff

## Goal
Enable Bard to hand off planning to a foreground Wizard session with a rich initial context, let the user continue speaking directly with Wizard, and provide a final Wizard handoff toward Fighter or Bard.

## Requirements

### R1: Interactive planning handoff
- Bard must offer planning choices with the OpenCode question tool.
- When the user chooses interactive planning, Bard must spawn Wizard in foreground.
- Wizard must receive a rich handoff payload from Bard, including goal, summary, open questions, and relevant context.
- The user must be able to continue speaking directly with Wizard after the handoff.

### R2: Non-interactive delegation remains available
- Bard must still support non-interactive Wizard delegation.
- The delegation path must remain a distinct option from foreground planning.

### R3: Wizard search delegation
- Wizard in foreground may delegate read-only search/research work to Rogue and Warlock.
- Wizard must not implement code directly.

### R4: Final Wizard handoff
- At the end of planning, Wizard must use the OpenCode question tool to offer next actions.
- The options must include starting Fighter execution, returning to Bard, continuing refinement, and review where relevant.

### R5: Tool naming and compatibility
- The code must use the OpenCode `ask_user` tool id.
- Prompts and documentation may refer to it as the question tool.

## Acceptance Criteria
- Bard can start Wizard foreground with a context payload, not an empty shell.
- The Wizard session remains interactive after the handoff.
- Wizard can still use Rogue/Warlock for research.
- The question tool is available consistently across Bard and Wizard prompts.
- Existing execution flow with Fighter remains intact.
