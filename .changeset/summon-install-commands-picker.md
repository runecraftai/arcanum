---
"@runecraft/summon": minor
---

feat(summon): per-runtime local/global picker for `install-commands`

`install-commands` now asks which project roots to target (multi-path) and,
for each detected runtime (Claude Code, OpenCode, Cursor), which location to
write to (`local` = the project, `global` = `$HOME`). Cursor stays
project-only. Generates files for every (projectRoot, runtime, location) pair
in a single run. The `CommandGenerator` interface now exposes
`supportedLocations`, `detectLocal`, `detectGlobal`, and a
`location`-parameterized `generate`.

Also rewrites the README to drop the stale "Scaffold" status, document the
method × scope orthogonality, and add copy-pasteable examples for installing
both skills and slash commands.
