# Grimoire

Shared configurations for Arcanum packages. This package centralizes linting, formatting, and TypeScript settings used across the monorepo.

## Biome Configuration

The `biome.json` file provides unified formatting and linting rules. To extend it in other packages:

```jsonc
// packages/<other>/biome.json
{
  "extends": ["@runecraftai/grimoire/biome.json"]
}
```

## TypeScript Configuration

The `tsconfig.base.json` file defines the base compiler options. Extend it from other packages:

```jsonc
// packages/<other>/tsconfig.json
{
  "extends": "@runecraftai/grimoire/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

## Features

- **Biome Linter**: Recommended rule set with organizing imports
- **Biome Formatter**: Tabs for indentation, 100-character line width
- **TypeScript**: Strict mode, ESNext target, Bun types included

---

## License

MIT
