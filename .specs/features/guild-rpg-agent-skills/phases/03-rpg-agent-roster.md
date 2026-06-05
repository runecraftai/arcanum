# Phase 3 Spec: RPG Agent Roster and Skill Binding

## Objective

Apply the approved RPG guild identity to builtin agents and bind each agent to its role-specific mini-skills.

## Requirements

- [ ] `loom` displays as `Bard (Guildmaster)`
- [ ] `tapestry` displays as `Fighter (Execution Lead)`
- [ ] `pattern` displays as `Wizard (Planner)`
- [ ] `thread` displays as `Rogue (Scout)`
- [ ] `spindle` displays as `Warlock (Researcher)`
- [ ] `shuttle` displays as `Ranger (Specialist)`
- [ ] `weft` displays as `Cleric (Reviewer)`
- [ ] `warp` displays as `Paladin (Security)`

## Skill Binding

| Agent | Skills |
| --- | --- |
| Bard | `guild-init`, `guild-load`, `guild-scope`, `guild-spec`, `guild-plan`, `guild-handoff`, `guild-ship` |
| Wizard | `guild-load`, `guild-scope`, `guild-spec`, `guild-plan` |
| Fighter | `guild-load`, `guild-execute`, `guild-verify`, `guild-handoff` |
| Rogue | `guild-research` |
| Warlock | `guild-research` |
| Ranger | `guild-execute` |
| Cleric | `guild-review`, `guild-verify` |
| Paladin | `guild-security` |

## Verification

- [ ] Display-name tests pass
- [ ] Prompt composition includes the relevant skill content
- [ ] Disabled-agent reference stripping still works with class display names
- [ ] Runtime routing can still use stable config keys
