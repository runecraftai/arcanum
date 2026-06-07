# Design: changeset-publish

## 1. Decisões Técnicas

### D1: Token Strategy — Single User Token

**Decisão:** Usar um único npm Automation Token do usuário que tem acesso a ambos os orgs (`@runecraft` e `@runecraftai`).

**Razão:** Tokens de automação npm são por usuário, não por org. Um usuário membro de ambos os orgs gera um token que autentica publicação em ambos os scopes. Não é necessário dois tokens.

**Alternativa rejeitada:** Granular Access Token por org — complexidade desnecessária, requer dois secrets no GitHub.

### D2: .npmrc Location — Project Root

**Decisão:** `.npmrc` no root do projeto (versionado), usando variável de ambiente para o token.

```
//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
```

**Razão:**
- Changesets Action usa `NODE_AUTH_TOKEN` por convenção
- `.npmrc` no projeto garante que CI e local usam a mesma config
- Variável de ambiente evita leak de token no repo

**Nota:** O `~/.npmrc` do dev local com token pessoal continua funcionando — npm faz merge de configs (project `.npmrc` + user `.npmrc`). A variável `${NODE_AUTH_TOKEN}` fica undefined localmente (sem efeito) e o token do `~/.npmrc` é usado.

### D3: Bun + Changesets Compatibility

**Decisão:** Usar `bun run` para scripts locais. Changesets Action recebe comandos customizados via `version` e `publish`.

**Implementação no workflow:**
```yaml
- uses: changesets/action@v1
  with:
    version: bun changeset:version
    publish: bun changeset:publish
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

O `bun changeset:publish` no `package.json` vai chamar `changeset publish` que internamente usa `npm publish` — que respeita o `.npmrc`.

### D4: Turborepo Pipeline — No Special Config Needed

**Decisão:** Não adicionar tasks de changeset ao `turbo.json`.

**Razão:** Changesets opera no root level, não per-package. Os comandos `changeset version` e `changeset publish` já entendem workspaces nativamente. Apenas o `build` precisa de Turborepo (e já está configurado).

O workflow faz `bun run build` (que usa turbo) ANTES do changeset publish, garantindo que `summon` tem o `dist/` pronto.

### D5: Ignore Strategy for `familiar`

**Decisão:** Adicionar ao array `ignore` no `.changeset/config.json`.

```json
{
  "ignore": ["@runecraftai/familiar"]
}
```

**Razão:** Dupla proteção — `familiar` já é `"private": true` no seu `package.json` (npm não publica privados), mas `ignore` no changeset config evita que ele seja incluído em version bumps e changelogs desnecessariamente.

### D6: Build Step no CI

**Decisão:** Rodar `bun run build` antes do Changesets Action.

**Razão:** `@runecraft/summon` tem `prepublishOnly: "bun run build"`, mas depender apenas de lifecycle scripts é frágil no CI. Build explícito via Turborepo garante que todos os packages com build step estão prontos.

Packages sem build (`spells`, `grimoire`, `guild`) simplesmente não têm build task — Turborepo os ignora.

### D7: Node Version no CI

**Decisão:** Node 20 LTS via `actions/setup-node@v4`.

**Razão:** Changesets Action requer Node. Mesmo usando Bun como package manager, npm publish (usado pelo changeset internamente) precisa de Node. Node 20 é LTS atual (suporte até 2026-10).

### D8: Workflow Trigger

**Decisão:** `push` to `main` only.

**Razão:**
- Changesets Action cria um PR automaticamente quando há changesets pendentes
- Quando o Version PR é merged (push to main sem changesets pendentes), o action publica
- Não precisa de `workflow_dispatch` — o fluxo é 100% automático

## 2. Fluxo de Publicação

```
Developer → cria changeset → PR → merge to main
                                       ↓
                            GitHub Actions trigger
                                       ↓
                            Changesets pendentes?
                            ├── SIM → Cria/atualiza Version PR
                            │         (bumps versions, updates CHANGELOGs)
                            └── NÃO → Publica packages alterados no npm
```

## 3. File Map

| File | Action | Purpose |
|------|--------|---------|
| `.npmrc` | CREATE | Auth config para npm registry |
| `package.json` (root) | EDIT | Adicionar scripts changeset |
| `.changeset/config.json` | EDIT | Adicionar ignore array |
| `packages/guild/package.json` | EDIT | Adicionar publishConfig |
| `packages/grimoire/package.json` | EDIT | Adicionar publishConfig |
| `.github/workflows/release.yml` | CREATE | CI/CD pipeline |
| `CONTRIBUTING.md` | CREATE | Guia para contribuidores |
