<p align="center">
  <img src="https://img.shields.io/badge/Package-%40runecraft%2Fspells-blue?style=for-the-badge" alt="package badge" />
  <img src="https://img.shields.io/badge/Skills-Catalog-green?style=for-the-badge" alt="catalog" />
  <img src="https://img.shields.io/badge/Version-0.0.2-purple?style=for-the-badge" alt="version" />
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
| **spec-driven** | 4.0.0 | Full lifecycle dev pipeline — MAP, SPEC, PLAN, BUILD, TEST, REVIEW, SIMPLIFY, SHIP | `/spec` | [→ README](skills/spec-driven/README.md) |

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

---

## 📁 Package Anatomy

```
@runecraft/spells/
├── package.json
├── README.md
└── skills/
    └── spec-driven/
        ├── SKILL.md              (Agent instructions — load this)
        ├── .skill-meta.json      (Metadata)
        └── references/           (35 supporting docs, loaded on-demand)
            ├── MAP.md
            ├── SPEC.md
            ├── PLAN.md
            ├── BUILD.md
            ├── TEST.md
            ├── REVIEW.md
            ├── SIMPLIFY.md
            ├── SHIP.md
            └── ...
```

Each skill contains a `SKILL.md` file — the core agent instructions — and a `references/` folder with detailed documentation for each phase. Agents load references on-demand as they execute the workflow.

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
