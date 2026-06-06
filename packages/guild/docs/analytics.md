# Analytics

Guild can record lightweight, on-disk analytics about your sessions: per-session summaries, project fingerprints, and per-step metrics. Analytics are **opt-in** and never transmitted off your machine. This page documents how to enable them, what gets written, and how to read it.

For the schema field, see [Configuration](configuration.md#analytics). For the commands that read these files, see [Commands](commands.md).

## Opt-in model

Analytics are disabled by default. Turn them on with:

```jsonc
{ "analytics": { "enabled": true } }
```

When `enabled` is `false`:

- The `.guild/analytics/` directory is not created.
- No summary, fingerprint, or metrics files are written.
- The `/metrics` command refuses to run and prints a hint.
- `/token-report` still works because it does not depend on analytics storage.

## What gets written

Guild writes to a project-local directory at `.guild/analytics/`. The directory and its files are created on first use and updated as the session progresses.

| File | Format | When it is written |
| --- | --- | --- |
| `session-summaries.jsonl` | One JSON object per line. | Finalized at session end (or on `/start-work` plan completion). |
| `fingerprint.json` | Single JSON object. | Updated when the project is fingerprinted. |
| `metrics-reports.jsonl` | One JSON object per line. | Appended as steps complete. |

The directory and files are created on the first run after analytics is enabled. Removing the directory is safe; Guild will recreate it on the next event.

### `session-summaries.jsonl`

Each line is a summary of a single session: agents used, the high-level tasks attempted, durations, and a short narrative the agent wrote for the session. Lines are append-only.

### `fingerprint.json`

A single object that describes the project: detected languages, key directories, primary framework, and a small list of files Guild considers central. Used to surface "you are working in a TypeScript monorepo" context in subsequent sessions. Updated periodically, not every session.

### `metrics-reports.jsonl`

Per-step metrics: tokens in/out, model used, tool calls, and timing. Appended as steps complete, including in-progress reports for long-running steps. This is the file `/metrics` reads from.

## Fingerprinting

Fingerprinting is gated behind `analytics.use_fingerprint`. The dependency is strict: `use_fingerprint: true` requires `analytics.enabled: true` as well. If you set `use_fingerprint: true` while leaving `enabled: false`, the config validator rejects the file.

```jsonc
{
  "analytics": {
    "enabled": true,
    "use_fingerprint": true
  }
}
```

When `use_fingerprint` is true, Guild updates `.guild/analytics/fingerprint.json` periodically. When it is false, the fingerprint file is never created or updated, and downstream commands that benefit from fingerprinting fall back to live detection.

## Commands

| Command | Requires analytics? | What it does |
| --- | --- | --- |
| `/metrics` | Yes | Summarizes tokens, model usage, and tool call counts from `metrics-reports.jsonl`. |
| `/token-report` | No | Reports token usage for the current session without writing or reading analytics files. |
| `/guild-health` | No | Reports the configured state of analytics (enabled/disabled, fingerprint on/off) without reading file contents. |

For command syntax, see [Commands](commands.md).

## Privacy

Guild never sends analytics data anywhere. Everything stays under `.guild/analytics/` in your project. The package does not include any network call that reads these files.

Because the directory is project-local:

- Add `.guild/` to your `.gitignore` to keep summaries and metrics out of version control.
- If you want to inspect a single record, open the file in your editor; lines are valid JSON.
- To clear history, delete the directory. The next session starts fresh.

## Inspecting the data

Two easy options:

1. **Read in your editor.** The JSONL files are line-delimited JSON. Most editors handle them without extra plugins.
2. **Run `/metrics`.** Summarizes the totals from `metrics-reports.jsonl` for the current project.

For long-term inspection (e.g. weekly review), pipe the JSONL files through `jq`:

```sh
# Tokens-out total across all recorded steps
jq -s 'map(.tokens.out // 0) | add' .guild/analytics/metrics-reports.jsonl

# Sessions grouped by primary agent
jq -r '.agent' .guild/analytics/session-summaries.jsonl | sort | uniq -c
```

## See also

- [Configuration — Analytics](configuration.md#analytics)
- [Commands](commands.md) — `/metrics`, `/token-report`, `/guild-health`.
- [Troubleshooting](troubleshooting.md)
