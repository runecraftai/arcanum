import type { UserConfig } from "@commitlint/types";
import type { Options as CzGitOptions } from "cz-git";

const config: UserConfig & { prompt: CzGitOptions } = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["summon", "spells", "familiar", "guild", "grimoire", "deps", "release"],
    ],
    "scope-case": [2, "always", "kebab-case"],
  },
  prompt: {
    alias: { fd: "docs: fix typos" },
    messages: {
      type: "Select the type of change that you're committing:",
      scope: "Denote the SCOPE of this change (optional):",
      customScope: "Denote the SCOPE of this change:",
      subject: "Write a SHORT, IMPERATIVE tense description of the change:\n",
      body: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
      breaking: 'List any BREAKING CHANGES (optional). Use "|" to break new line:\n',
      footerPrefixesSelect: "Select the ISSUES type of changeList by this change (optional):",
      footer: "List any ISSUES by this change. E.g.: #31, #34:\n",
      confirmCommit: "Are you sure you want to proceed with the commit above?",
    },
    types: [
      { value: "feat", name: "feat:     ✨  A new feature", emoji: "✨" },
      { value: "fix", name: "fix:      🐛  A bug fix", emoji: "🐛" },
      { value: "docs", name: "docs:     📝  Documentation only changes", emoji: "📝" },
      { value: "style", name: "style:    💄  Markup, white-space, formatting", emoji: "💄" },
      { value: "refactor", name: "refactor: ♻️   A code change that neither fixes nor adds", emoji: "♻️" },
      { value: "perf", name: "perf:     ⚡️  A code change that improves performance", emoji: "⚡️" },
      { value: "test", name: "test:     ✅  Adding missing tests", emoji: "✅" },
      { value: "build", name: "build:    📦️  Changes affecting build system or deps", emoji: "📦️" },
      { value: "ci", name: "ci:       🎡  Changes to CI configuration", emoji: "🎡" },
      { value: "chore", name: "chore:    🔧  Other changes that don't modify src", emoji: "🔧" },
      { value: "revert", name: "revert:   ⏪️  Reverts a previous commit", emoji: "⏪️" },
    ],
    useEmoji: false,
    allowCustomScopes: true,
    allowBreakingChanges: ["feat", "fix"],
    breaklineNumber: 100,
    breaklineChar: "|",
    confirmColorize: true,
  },
};

export default config;
