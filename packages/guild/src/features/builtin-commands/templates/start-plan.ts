export const START_PLAN_TEMPLATE = `
<command-instruction>
Wizard should run an interactive planning session with the user.
Ask clarifying questions, explore the codebase, draft the plan, and refine it until the user confirms.
Do not implement code.
At the end, offer next steps: start execution with Fighter, return to Bard, or keep refining the plan.
</command-instruction>
`
