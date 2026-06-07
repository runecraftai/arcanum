# Learnings: Guild Docs Customization Recipes

## Task 1: Confirm schema-supported fields
- **Discrepancy**: The plan only asked to confirm supported fields, but the schema also strictly requires `review_models` entries to be provider-qualified (`provider/model`).
- **Resolution**: Documented the exact supported fields for `agents`, `categories`, and `custom_agents`, and captured the `review_models` regex requirement for examples.
- **Suggestion**: Future docs plans should call out validation constraints for example values, not just field presence.

## Task 7: Add full configuration example
- **Discrepancy**: The plan requested a full copy/paste example but did not specify provider nesting for OpenRouter-style model IDs.
- **Resolution**: Used `openrouter/<provider>/<model>` values consistently so every model string stayed provider-qualified and schema-friendly.
- **Suggestion**: If a docs example targets a specific provider wrapper, say so explicitly in the task to avoid ambiguity.

## Task 8: Add cross-links from existing docs
- **Discrepancy**: The first pass used a broken relative link in `agents.md` (`../prompt-append.md`) even though the target lives in the same directory.
- **Resolution**: Fixed the link to `prompt-append.md` and re-checked the rest of the cross-links for relative-path correctness.
- **Suggestion**: When adding cross-links across docs in the same folder, verify each target path against the source file location instead of assuming `../` is needed.

## Task 9: Validate snippets and terminology
- **Discrepancy**: Two docs had incorrect relative/example content on the first pass: `model-guide.md` used the wrong `review_models` shape, and `agents.md` linked to `README.md` with an extra `../`.
- **Resolution**: Corrected the `review_models` example to a provider-qualified string array and fixed the same-directory README link.
- **Suggestion**: Run a link-path and schema-shape pass after editorial edits; these issues are easy to miss in prose-heavy docs.

## Task 10: Run lightweight verification
- **Discrepancy**: The schema check failed because `schema/guild-config.schema.json` was stale, which meant the verification task had to include regeneration rather than just checking.
- **Resolution**: Regenerated the schema artifact with `bun run schema:config`, then reran `bun run schema:config:check` and performed a relative-link audit across the markdown docs.
- **Suggestion**: Verification tasks should distinguish between “check only” and “regen if stale” to avoid false failures in docs-only work.
