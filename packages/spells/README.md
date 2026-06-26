<p align="center">
  <img src="https://img.shields.io/badge/Package-%40runecraft%2Fspells-blue?style=for-the-badge" alt="package badge" />
  <img src="https://img.shields.io/badge/Skills-Catalog-green?style=for-the-badge" alt="catalog" />
   <img src="https://img.shields.io/badge/Version-0.11.0-purple?style=for-the-badge" alt="version" />
</p>

<h1 align="center">🪄 @runecraft/spells</h1>

<p align="center">
  <strong>Agent skill definitions for Arcanum. Markdown skills consumed by AI coding agents to perform specialized tasks.</strong>
</p>

---

## ✨ What Is This?

Skills are `SKILL.md` markdown files loaded by AI agents (Claude, Cursor, GitHub Copilot, Opencode, and others) as custom instructions. Think of them as specialized rulesets that teach agents how to execute complex, multi-phase workflows with precision and clarity.

This package is the distributable catalog of production-ready skills for the Arcanum ecosystem. Each skill encodes battle-tested processes for software development phases: planning, specification, implementation, testing, review, and deployment.

---

## 📦 Available Skills

| Skill | Version | Description | Main Trigger | Docs |
|-------|---------|-------------|--------------|------|
| **spec-driven** | 4.1.0 | Full lifecycle dev pipeline — INIT, MAP, QUICK, SPEC, PLAN, BUILD, TEST, VALIDATE, REVIEW, SIMPLIFY, SHIP, PAUSE/RESUME | `/spec` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/spec-driven/README.md) |
| **git-commit-learning** | 1.0.0 | RPI model: analyze git log for patterns and write AI-learnable commits (Research → Plan → Implement → Verify). PT/EN. | `/commit` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/git-commit-learning/README.md) |
| **using-agent-skills** | 1.0.0 | Meta-skill: discover and dispatch to the right Arcanum skill for the current task. | `/skill` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/using-agent-skills/README.md) |
| **idea-refine** | 1.0.0 | Refine raw ideas through divergent/convergent thinking — expand options, stress-test assumptions. | `/plan` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/idea-refine/README.md) |
| **interview-me** | 1.0.0 | One-question-at-a-time interview until ~95% confidence about user intent. | `/interview` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/interview-me/README.md) |
| **test-driven-development** | 1.0.0 | TDD with the 80/15/5 pyramid and Beyonce Rule. Fail first, then make it pass. | `/test` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/test-driven-development/README.md) |
| **doubt-driven-development** | 1.0.0 | Adversarial review of non-trivial decisions: CLAIM → EXTRACT → DOUBT → RECONCILE → STOP. | `/harden` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/doubt-driven-development/README.md) |
| **debugging-and-error-recovery** | 1.0.0 | Five-step root-cause triage: reproduce → localize → reduce → fix → guard. | `/debug` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/debugging-and-error-recovery/README.md) |
| **code-review-and-quality** | 1.0.0 | Five-axis code review (correctness, readability, architecture, security, performance) with severity labels. | `/review` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/code-review-and-quality/README.md) |
| **code-simplification** | 1.0.0 | Reduce complexity while preserving behavior — Chesterton's Fence, Rule of 500. | `/simplify` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/code-simplification/README.md) |
| **security-and-hardening** | 1.0.0 | OWASP Top 10 and a three-tier boundary system for security-first development. | `/security` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/security-and-hardening/README.md) |
| **deprecation-and-migration** | 1.0.0 | Retire old systems, APIs, and features; migrate users safely. Treats code as liability. | `/deprecate` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/deprecation-and-migration/README.md) |
| **shipping-and-launch** | 1.0.0 | Pre-launch checklist, staged rollout, feature flag lifecycle, monitoring, rollback. | `/ship` | [→ README](https://github.com/runecraftai/arcanum/tree/main/packages/spells/skills/shipping-and-launch/README.md) |

## 📚 References

| File | Description |
|------|-------------|
| [testing-patterns.md](https://github.com/runecraftai/arcanum/tree/main/packages/spells/references/testing-patterns.md) | Common testing patterns across the stack with 80/15/5 pyramid, Beyonce Rule, and 8 anti-patterns. |
| [definition-of-done.md](https://github.com/runecraftai/arcanum/tree/main/packages/spells/references/definition-of-done.md) | Project-wide standing bar that complements per-task acceptance criteria. |

---

## 🚀 Installation

#### npm
```bash
npm install @runecraft/spells
```

#### bun
```bash
bun add @runecraft/spells
```

#### pnpm
```bash
pnpm add @runecraft/spells
```

#### yarn
```bash
yarn add @runecraft/spells
```

### Using a Skill

After installation, copy the desired `SKILL.md` file to your agent's skills or rules directory:

**Cursor:**
```bash
cp node_modules/@runecraft/spells/skills/spec-driven/SKILL.md .cursor/rules/spec-driven.mdc
```

**Claude Code:**
```bash
cp node_modules/@runecraft/spells/skills/spec-driven/SKILL.md ~/.claude/skills/spec-driven.md
```

**Other agents:** Refer to your agent's documentation for the correct skills directory path.

For slash command installation, see [@runecraft/summon](https://www.npmjs.com/package/@runecraft/summon) — `summon install-commands` generates `/review`, `/test`, `/ship`, etc. for Claude Code, OpenCode, and Cursor.

---

## 📁 Package Anatomy

```
@runecraft/spells/
├── package.json
├── README.md
├── skills/
│   ├── spec-driven/                 (13 skills total)
│   │   ├── SKILL.md
│   │   ├── README.md
│   │   └── references/
│   ├── git-commit-learning/
│   ├── using-agent-skills/
│   ├── idea-refine/
│   ├── interview-me/
│   ├── test-driven-development/
│   ├── doubt-driven-development/
│   ├── debugging-and-error-recovery/
│   ├── code-review-and-quality/
│   ├── code-simplification/
│   ├── security-and-hardening/
│   ├── deprecation-and-migration/
│   └── shipping-and-launch/
└── references/
    ├── testing-patterns.md
    └── definition-of-done.md
```

Each skill contains a `SKILL.md` file — the core agent instructions — and (optionally) a `references/` folder with detailed documentation for each phase. Agents load references on-demand as they execute the workflow.

---

## 🤖 Compatibility

| Agent | Status |
|-------|--------|
| Claude Code | ✅ Tested |
| Cursor | ✅ Tested |
| Opencode | ✅ Tested |
| GitHub Copilot | ✅ Tested |
| Antigravity (Gemini) | ✅ Tested |

Works with any agent that supports custom instructions, skills, or rules directories.

---

## 📄 License

MIT

<p align="center"><sub>Part of the <a href="https://github.com/runecraft-dev/arcanum">Arcanum</a> ecosystem</sub></p>
