# Workflow examples

Ready-to-copy workflow definitions. Drop the JSON file into `.opencode/workflows/<name>.json` and run it with `/run-workflow <name>`.

For the JSON schema, see [Authoring](../../workflows/authoring.md). For an overview, see [Workflows](../../workflows/overview.md).

## Available examples

| Workflow | Purpose |
| --- | --- |
| [release.json](release.json) | Bump version, test, schema-check, review, and publish a package. |
| [weekly-review.json](weekly-review.json) | Summarize last week's analytics, review issues, and post a status report. |
| [refactor-prep.json](refactor-prep.json) | Scope, plan, and open the first PR for a refactor. |

## Using an example

1. Copy the JSON file from this directory to your project's `.opencode/workflows/` directory.
2. Edit the prompts and steps to fit your environment (paths, channels, branch names).
3. Run `/run-workflow <name>` in OpenCode.

## Customizing

Each example is a starting point. Common changes:

- Add a `gate` step before any destructive operation (publishing, deleting branches, sending messages).
- Replace `default_completion.method` with `agent_signal` for steps that should finish on a custom signal.
- Add `condition` to skip steps that are not relevant in your environment.
- Adjust model overrides for high-cost steps to a cheaper default. See [Model guide](../../model-guide.md).

## Authoring your own

When you have a workflow that works for your team, consider adding it to this directory as a starting point for others. The convention is one file per workflow, with the workflow name as the filename.

For the full field reference, see [Authoring](../../workflows/authoring.md).
