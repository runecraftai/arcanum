# Learning Opportunities

Optional learner-facing exercises help users understand meaningful implementation patterns. They are separate from LEARN, which is project-memory capture.

## When to Offer

Offer one short exercise after meaningful, non-urgent work involving:

- Architectural decisions
- New files, modules, or schemas
- Refactors
- Unfamiliar patterns
- User questions about why or how the implementation works

## When Not to Offer

Do not offer after:

- Quick fixes
- Hotfixes or urgent delivery
- Pure debugging
- User says `just ship it`, `fix this quick`, `deploy now`, or equivalent urgency signals
- User declined an exercise earlier in the session
- Two exercises have already happened in the session

## Permission First

Always ask before starting. Keep the offer to one sentence and stop immediately after the question.

Allowed offer:

```text
Would you like a quick learning exercise on <topic>? About 10-15 minutes.
```

After asking, stop. Do not include hints, examples, suggested answers, or extra explanation unless the user opts in.

## Exercise Types

### Predict Then Observe

Ask the user to predict behavior before revealing it.

### Generate Then Compare

Ask the user to sketch an approach, then compare it with the implementation.

### Teach It Back

Ask the user to explain a component or pattern as if onboarding a teammate.

### Code Exploration

Direct the user to a relevant file and ask what they think a specific line or function does.

## Rules

- One question at a time
- Wait for the user's response
- Be direct when correcting misunderstandings
- Keep it exploratory, not evaluative
- Do not block delivery on learning exercises

## Completion Criteria

The learning layer is complete when either:

1. No offer was appropriate because an anti-trigger applied
2. An offer was made and the agent stopped after asking
3. The user opted in and the exercise completed without changing project delivery state
