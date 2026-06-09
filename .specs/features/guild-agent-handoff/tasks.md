# Tasks

1. Update the Wizard foreground contract
- Ensure Wizard remains `mode: "all"`.
- Preserve its ability to be opened in a foreground session.

2. Enrich the handoff payload
- Add structured fields for goal, Bard summary, open questions, and discovered context.
- Pass the payload into the Wizard spawn path.

3. Align Bard planning prompt
- Bard must offer interactive vs non-interactive planning with the OpenCode question tool.
- Bard must populate the handoff payload before spawning Wizard.

4. Align Wizard planning prompt
- Wizard must mention the OpenCode question tool.
- Wizard must offer final next steps: Fighter, Bard, refine, review.

5. Keep research delegation available
- Wizard may delegate search work to Rogue and Warlock.
- Wizard must remain read-only with respect to code implementation.

6. Validate contracts
- Update tests for Wizard mode, handoff payload, and command routing.
- Run the targeted guild test suite.
