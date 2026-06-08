# Troubleshooting

This page is organized by **symptom**. Find the symptom that matches what you are seeing, follow the checklist, and only then dig into config files or source.

When in doubt, start with `/guild-health`. It prints the loaded config files, the registered agents, and any validation warnings. If it returns nothing at all, Guild is not loaded — see the first section.

## Guild did not load

**Symptom**: `/guild-health` returns nothing, no Guild agents appear, OpenCode behaves as if the plugin is absent.

1. Confirm the plugin is registered in your `opencode.json`:
   ```json
   { "plugin": ["@runecraft/guild"] }
   ```
2. Confirm the **exact** package name: `@runecraft/guild` (not `guild`, not `weave`).
3. **Restart OpenCode**. Plugin loading happens at startup, not on reload.
4. Check the npm registry propagation if you just published or upgraded. Wait a few minutes and restart.
5. If you have a stale cache, remove it:
   ```bash
   rm -rf ~/.cache/opencode/node_modules/@runecraft/guild
   ```
   Then restart OpenCode to force a clean re-install.
6. Tail the OpenCode log and search for `[guild:` to see plugin boot output. Set `log_level: "DEBUG"` in your Guild config to get more detail.

## Config not applied

**Symptom**: Changes to `guild-opencode.jsonc` are not reflected at runtime.

1. Confirm the file is in the right location:
   - Project: `.opencode/guild-opencode.jsonc` (or `.json`)
   - User: `~/.config/opencode/guild-opencode.jsonc` (or `.json`)
2. Check the file extension — Guild loads `.jsonc` first, then `.json`.
3. Run `/guild-health` and look at the *Loaded files* section. If the file you expect is missing, it was not detected.
4. Validate the JSONC syntax — the loader tolerates comments and trailing commas, but a stray comma or unclosed brace still fails. Run `bunx jsonc-parser <file>` or open the file in an editor with JSONC support.
5. **Restart OpenCode** after any config change.
6. If the file is loaded but a section is dropped, look for a validation warning in the OpenCode log. Guild drops failing top-level sections one at a time and keeps the rest.

## Agents not appearing

**Symptom**: A specific agent (e.g. Wizard) does not show up in `/guild-health` or in agent routing.

1. Check `disabled_agents` in your config. The field is a union across user and project files — remove the entry from **both** files. See [Disabling features](disabling-features.md) for all five disabling keys and their merge behavior.
2. Confirm the agent name is one of the eight built-ins: `bard`, `fighter`, `ranger`, `wizard`, `rogue`, `warlock`, `cleric`, `paladin`. See [Agents](agents.md).
3. Check the OpenCode log for a `[guild:DEBUG]` line that mentions a disabled agent.

## `/start-work` not finding a plan

**Symptom**: `/start-work` reports that no plan was found or returns an error.

1. Confirm a plan was generated. Plans live in `.guild/plans/<slug>/` (canonical). The directory should contain at least `spec.md` and `state.md`.
2. If you have not generated a plan yet, ask the **Wizard** agent to plan the work first, then run `/start-work`.
3. If you supplied a plan name, verify the spelling matches the slug in `.guild/plans/<slug>/`.
4. Confirm you are running OpenCode from the project root that contains `.guild/`.
5. **Legacy fallback**: If `.guild/plans/<slug>/` does not exist but `.specs/features/<slug>/` does, Guild reads from the legacy path as a fallback. The canonical path always takes priority if both exist. See [`.guild/architecture.md`](.guild/architecture.md) for the full fallback order.

## `/run-workflow` not finding a workflow

**Symptom**: `/run-workflow <name>` reports that the workflow is not found.

1. Confirm the workflow file is in `.opencode/workflows/` (project) or `~/.config/opencode/workflows/` (user).
2. Check the `name` field in the file — it must match the name you passed and be lowercase alphanumeric with hyphens.
3. If you used `workflows.directories` in your config, confirm each entry is a relative path (no `..` segments) and exists.
4. If the workflow is in `disabled_workflows`, remove the entry and restart OpenCode.
5. Validate the workflow file against the schema — see [Workflows — authoring](workflows/authoring.md).

## `/metrics` says analytics is not enabled

**Symptom**: `/metrics` returns a short "analytics is not enabled" message.

1. Add the analytics block to your Guild config:
   ```jsonc
   { "analytics": { "enabled": true } }
   ```
2. Restart OpenCode so the new config is loaded.
3. Run a session to generate data. Metrics are written on session end; an empty project has nothing to report.

See [Analytics](analytics.md) for the privacy model and what gets recorded.

## Skills not loading

**Symptom**: A custom skill is not available to agents, or a built-in skill appears missing.

1. Confirm the skill file is in one of the expected locations:
   - Project: `.opencode/skills/<skill-name>/SKILL.md`
   - User: `~/.config/opencode/skills/<skill-name>/SKILL.md`
   - Builtin: shipped with the package under `packages/guild/skills/`.
2. Confirm the `SKILL.md` frontmatter has a `name` field — skills without a name are skipped.
3. Check `disabled_skills` in your config. The field is a union, so remove the entry from both user and project files.
4. If you use `skill_directories` in config, confirm each entry is a relative path and points to a directory that exists.
5. Set `log_level: "DEBUG"` and look for skill discovery messages in the OpenCode log.

See [Skills](skills.md) for the SKILL.md format and assignment rules.

## Failover not triggering

**Symptom**: An OpenAI error occurs but Guild does not switch to a fallback model.

1. Confirm the agent has a fallback chain defined. Check `fallback_models` in your config or rely on the built-in native chain (see [Model guide](model-guide.md#built-in-native-fallback-chains)).
2. Check the OpenAI error classification. Failover only triggers for:
   - **quota** — `quota exceeded`, `insufficient_quota`, `billing limit`
   - **rate_limit** — `rate limit`, `429`, `too many requests`
   - **model_unavailable** — `model unavailable`, `503`, `502`, `bad gateway`
3. Set `log_level: "DEBUG"` and search for `[failover:` in the OpenCode log. You will see one of:
   - `[failover:eligible_retry]` — failover was triggered
   - `[failover:error_ignored]` — error was not eligible (expected for auth/prompt/permission errors)
   - `[failover:blocked_loop]` — failover already attempted for this execution (one-shot guard)
   - `[failover:no_fallback_available]` — no next model in the chain
4. If the error is from a non-OpenAI provider (Anthropic, Google, etc.), failover is intentionally not triggered.
5. If failover already occurred once for this execution, it will not retry again (anti-loop protection).

## Logs and debugging

When the above checklists do not pin down the cause:

1. Run `/guild-health` and capture the full output.
2. Set `log_level: "DEBUG"` in your Guild config to get verbose plugin output, then restart OpenCode.
3. Open the OpenCode log and search for `[guild:` to find Guild's structured log lines. Levels are tagged `DEBUG`, `INFO`, `WARN`, `ERROR`.
4. The `GUILD_LOG_LEVEL` environment variable also controls the log level and overrides nothing; the config `log_level` field wins if set.

If you are filing an issue, include the `/guild-health` output, the relevant log lines, and the contents of your config files.
