# Spec: changeset-publish

## 1. Overview

**What:** Pipeline completo de publicação npm para o monorepo Arcanum usando Changesets + GitHub Actions — cobrindo configuração npm, scripts de root, CI/CD automatizado, e documentação para contribuidores.

**Why:** O monorepo tem 5 packages (3 públicos ativos, 1 placeholder público, 1 privado) distribuídos em dois npm orgs (`@runecraft` e `@runecraftai`), mas não possui nenhuma automação de versionamento ou publicação. Changesets já está instalado e parcialmente configurado, mas faltam scripts, CI/CD, `.npmrc`, `publishConfig` em alguns packages, e documentação.

**Who:** Maintainers do Arcanum que fazem merge em `main`.

## 2. Goals

- G1: Qualquer PR pode incluir um changeset descrevendo a mudança
- G2: Merge em `main` cria automaticamente um "Version PR" via Changesets Action
- G3: Merge do Version PR publica automaticamente no npm os packages alterados
- G4: `@runecraftai/familiar` NUNCA é publicado (privado)
- G5: Packages sem build (`spells`, `grimoire`) publicam source diretamente
- G6: Documentação clara para contribuidores sobre o workflow

## 3. Scope

**Size:** Large (multi-file config + CI/CD + docs)

**In scope:**
- `.npmrc` com auth token via env var
- Root `package.json` scripts para changesets
- `.changeset/config.json` — ignore familiar
- `publishConfig` em `guild` e `grimoire`
- `.github/workflows/release.yml` — CI/CD completo
- `CONTRIBUTING.md` — guia de changeset workflow
- Compatibilidade Turborepo + Bun

**Out of scope:**
- Conteúdo real do package `guild` (placeholder — só config)
- Migração de org npm (ambos orgs permanecem)
- Testes automatizados no CI (pode ser adicionado depois)
- Canary/snapshot releases
- Branch protection rules no GitHub

## 4. Packages Affected

| Package | Org | Status | Build | publishConfig |
|---------|-----|--------|-------|---------------|
| `@runecraft/summon` | @runecraft | ativo, v0.0.9 | `bun run build` | ✅ exists |
| `@runecraft/spells` | @runecraft | ativo, v0.0.1 | nenhum (ships source) | ✅ exists |
| `@runecraftai/guild` | @runecraftai | placeholder, v0.0.1 | nenhum | ❌ missing |
| `@runecraftai/grimoire` | @runecraftai | config sharing, v0.0.1 | nenhum (ships config) | ❌ missing |
| `@runecraftai/familiar` | @runecraftai | privado, v0.0.1 | — | N/A (never published) |

## 5. Acceptance Criteria

- AC1: `bun changeset` no root gera um changeset file
- AC2: `bun changeset:version` aplica versões e atualiza CHANGELOGs
- AC3: `bun changeset:publish` publica packages alterados no npm
- AC4: Push to `main` dispara workflow que cria Version PR ou publica
- AC5: `@runecraftai/familiar` é ignorado em todos os comandos changeset
- AC6: `.npmrc` usa `${NODE_AUTH_TOKEN}` (não hardcoded)
- AC7: CONTRIBUTING.md documenta o workflow completo
