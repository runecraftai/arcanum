# Phase 5 Spec: Complete Weave to Guild Rebrand

## Objective

Remove Weave branding from `packages/guild` and make Guild the complete product and internal identity, except for explicitly justified technical exceptions.

## Requirements

- [ ] Rename public and internal type names from `Weave*` to `Guild*` where safe
- [ ] Rename version helpers from Weave language to Guild language
- [ ] Rename comments, logs, docs, tests, schema text and prompt text
- [ ] Remove `.weave` artifact instructions
- [ ] Review any remaining `weave` identifiers as technical exceptions

## Known Sensitive Area

- `call_weave_agent` may be a runtime/tool identifier and must not be renamed blindly.

## Verification

- [ ] `bun run typecheck` passes in `packages/guild`
- [ ] Search for `Weave|weave|.weave` is reviewed
- [ ] Remaining matches, if any, are documented as intentional exceptions
