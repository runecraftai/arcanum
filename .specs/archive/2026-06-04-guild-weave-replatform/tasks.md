# Tasks: guild-weave-replatform

**Design**: `.specs/features/guild-weave-replatform/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Preservation and Workspace Safety (Sequential)

```text
T01 -> T02 -> T03
```

### Phase 2: Base Replacement (Mostly Sequential)

```text
T03 -> T04 -> T05 -> T06 -> T07
```

### Phase 3: Public Rename Sweep (Grouped, parallel inside category)

```text
           -> T08 ->
T07 -> T09 -> T10 -> T13
           -> T11 ->
           -> T12 ->
```

### Phase 4: Monorepo Integration (Sequential)

```text
T13 -> T14 -> T15 -> T16
```

### Phase 5: Verification and Closure (Sequential)

```text
T16 -> T17 -> T18 -> T19 -> T20
```

---

## Task Breakdown

### T01: Create archival destination for current guild

**What**: Definir e criar o diretório de backup seguro para o `guild` atual fora do workspace ativo.
**Where**: `packages/_archived/guild-legacy-20260604/`
**Depends on**: None
**Reuses**: Convenção já existente de conteúdo arquivado em `packages/pi-archived-*`
**Requirement**: GUILD-MIG-01

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] O diretório de backup existe
- [ ] O path não é capturado por `workspaces: ["packages/*"]`
- [ ] Existe uma nota mínima descrevendo que o conteúdo é o `guild` legado

### T02: Copy current guild package into archive

**What**: Copiar integralmente o pacote `packages/guild` atual para o diretório de arquivo.
**Where**: `packages/guild/` -> `packages/_archived/guild-legacy-20260604/`
**Depends on**: T01
**Reuses**: Estrutura atual de `packages/guild`
**Requirement**: GUILD-MIG-01

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] `package.json`, `README.md`, `CHANGELOG.md`, `src/`, `scripts/` e arquivos de suporte foram preservados
- [ ] O backup pode ser lido independentemente do pacote ativo
- [ ] Nenhum arquivo do `packages/guild` ativo foi ainda removido

### T03: Document archived identity and freeze point

**What**: Registrar no backup e em `.specs/project/STATE.md` que o `guild` atual foi congelado antes da substituição.
**Where**: `packages/_archived/guild-legacy-20260604/README.md`, `.specs/project/STATE.md`
**Depends on**: T02
**Reuses**: Histórico de features arquivadas no projeto
**Requirement**: GUILD-MIG-01, GUILD-MIG-10

**Tools**:

- MCP: filesystem
- Skill: `docs-writer`

**Done when**:

- [ ] O backup deixa claro que representa o `guild` pré-Weave
- [ ] `STATE.md` lista a feature como ativa ou em andamento
- [ ] Existe referência ao motivo do congelamento

### T04: Replace guild root files with Weave package baseline

**What**: Substituir os arquivos-raiz de `packages/guild` pela baseline do pacote `opencode-weave`, preservando apenas o nome final do pacote como decisão posterior.
**Where**: `packages/guild/package.json`, `README.md`, `.gitignore`, `tsconfig.json`
**Depends on**: T03
**Reuses**: `opencode-weave/package.json`, `README.md`, `tsconfig.json`, `.gitignore`
**Requirement**: GUILD-MIG-02, GUILD-MIG-03

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Os arquivos-raiz refletem a baseline do Weave
- [ ] O pacote ativo não depende mais da estrutura antiga do `guild`
- [ ] Ainda não há preocupação em rename completo, apenas em substituição estrutural inicial

### T05: Replace guild source tree with Weave source tree

**What**: Trocar o `src/` atual do `guild` pela árvore `src/` do `opencode-weave`.
**Where**: `packages/guild/src/`
**Depends on**: T04
**Reuses**: `opencode-weave/src/`
**Requirement**: GUILD-MIG-02

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] O `src/` antigo do `guild` foi removido do pacote ativo
- [ ] O `src/` do Weave está presente em `packages/guild/src/`
- [ ] Estrutura esperada do Weave foi preservada

### T06: Replace supporting build assets with Weave equivalents

**What**: Migrar scripts e schema relevantes do Weave para o pacote `guild`.
**Where**: `packages/guild/script/`, `packages/guild/schema/`, artefatos auxiliares necessários
**Depends on**: T05
**Reuses**: `opencode-weave/script/`, `opencode-weave/schema/`
**Requirement**: GUILD-MIG-02, GUILD-MIG-08

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Scripts de build/schema do Weave existem em `packages/guild`
- [ ] Schema baseline do Weave foi trazido
- [ ] Não sobrou dependência estrutural do script antigo do `guild`

### T07: Remove obsolete guild-only runtime code from active package

**What**: Eliminar do pacote ativo qualquer código remanescente do `guild` antigo que conflite com a nova base.
**Where**: `packages/guild/` arquivos remanescentes não presentes na baseline final
**Depends on**: T06
**Reuses**: Backup arquivado para referência histórica
**Requirement**: GUILD-MIG-02

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] O pacote ativo contém apenas a baseline desejada do novo `guild`
- [ ] Código legado do runtime antigo não interfere com imports, builds ou docs

### T08: Rename package identity and exported naming to guild

**What**: Renomear package metadata, entrypoint exports e tipos principais de identidade `weave` para `guild`.
**Where**: `packages/guild/package.json`, `src/index.ts`, `src/config/*`, `src/shared/version.ts`
**Depends on**: T07
**Reuses**: Metadata atual de `@runecraft/guild`
**Requirement**: GUILD-MIG-03, GUILD-MIG-06

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] O pacote se identifica como `@runecraft/guild`
- [ ] Exports principais usam naming Guild onde apropriado
- [ ] `version.ts` não busca mais `@opencode_weave/weave`

### T09: Rename config file conventions to guild

**What**: Trocar naming e documentação de config `weave-opencode` por `guild-opencode`.
**Where**: loaders, docs, examples, fixtures e testes relacionados a config
**Depends on**: T07
**Reuses**: Inventário de rename mapeado anteriormente
**Requirement**: GUILD-MIG-04

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Loader canônico aponta para `guild-opencode.json(c)`
- [ ] Examples e README mostram somente paths `guild-opencode`
- [ ] Testes/fixtures relevantes foram atualizados

### T10: Rename hidden state directory conventions to guild

**What**: Trocar `.weave/` por `.guild/` em constantes, fluxos de persistência, docs e fixtures.
**Where**: `src/features/work-state/*`, `src/features/workflow/*`, `.gitignore`, docs, testes
**Depends on**: T07
**Reuses**: Constantes centrais do Weave para state/workflow
**Requirement**: GUILD-MIG-05

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] State dir canônico é `.guild/`
- [ ] Persistência e testes usam `.guild/`
- [ ] `.gitignore` foi ajustado para a nova pasta

### T11: Rename public runtime branding to guild

**What**: Trocar branding público de logs, service name, env vars e mensagens de health.
**Where**: `src/shared/log.ts`, `src/features/health-report.ts`, mensagens públicas e testes associados
**Depends on**: T07
**Reuses**: Logger e health report do Weave
**Requirement**: GUILD-MIG-06

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Prefixos públicos usam `[guild:*]`
- [ ] `service: "guild"` substitui `service: "weave"`
- [ ] Env var pública é `GUILD_LOG_LEVEL`

### T12: Rename public command/protocol/schema surfaces to guild

**What**: Renomear schema artifact, schema metadata, command de health e envelopes públicos de protocolo.
**Where**: `src/config/json-schema.ts`, `schema/*`, `src/runtime/opencode/*`, `src/features/builtin-commands/*`, `src/application/commands/*`
**Depends on**: T07
**Reuses**: Arquitetura de protocolo e command router do Weave
**Requirement**: GUILD-MIG-06, GUILD-MIG-07

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Schema final chama `guild-config.schema.json`
- [ ] Metadata pública não usa mais `x-weave-version`
- [ ] Comando público `guild-health` substitui `weave-health`
- [ ] Envelope tags públicas usam `guild-*`

### T13: Update README, docs, examples and changelog surface

**What**: Revisar documentos públicos e exemplos do pacote para refletir o novo `guild`.
**Where**: `packages/guild/README.md`, `docs/`, `examples/`, `CHANGELOG.md`
**Depends on**: T08, T09, T10, T11, T12
**Reuses**: Conteúdo do README/docs do Weave como base
**Requirement**: GUILD-MIG-06

**Tools**:

- MCP: filesystem
- Skill: `docs-writer`

**Done when**:

- [ ] README do pacote fala Guild de ponta a ponta
- [ ] Examples batem com os paths reais do runtime
- [ ] Nenhuma instrução pública principal manda usar `weave` por engano

### T14: Adapt guild manifest to arcanum workspace conventions

**What**: Ajustar `package.json` final do novo `guild` para coexistir corretamente com Bun workspaces, Turbo e Changesets.
**Where**: `packages/guild/package.json`
**Depends on**: T13
**Reuses**: Manifest atual do `guild` e baseline do Weave
**Requirement**: GUILD-MIG-03, GUILD-MIG-08

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Nome final segue `@runecraft/guild`
- [ ] Scripts de build/typecheck/schema estão coerentes com o pacote real
- [ ] `publishConfig`, `repository`, `homepage` e `bugs` apontam para o destino certo

### T15: Align build and script paths with package layout

**What**: Garantir que scripts de build/schema/verify/test apontem para paths existentes dentro de `packages/guild`.
**Where**: `packages/guild/package.json`, `script/*`, `tsconfig.json`
**Depends on**: T14
**Reuses**: Scripts originais do Weave
**Requirement**: GUILD-MIG-08

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Scripts referenciam arquivos existentes
- [ ] Não há imports quebrados por rename de paths
- [ ] Schema generation continua possível

### T16: Sweep and document intentional non-renamed internals

**What**: Revisar e documentar quais referências `weave` permanecem por serem internals aceitos nesta fase.
**Where**: `tasks.md` execution notes, código remanescente e possivelmente README interno
**Depends on**: T15
**Reuses**: Inventário de rename inicial
**Requirement**: GUILD-MIG-09, GUILD-MIG-10

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Existe lista explícita do que ficou sem rename por decisão
- [ ] Não há ambiguidade entre resíduo acidental e resíduo deliberado

### T17: Run package build verification

**What**: Validar que o novo `packages/guild` constrói corretamente.
**Where**: `packages/guild`
**Depends on**: T16
**Reuses**: Scripts do próprio pacote
**Requirement**: GUILD-MIG-08, GUILD-MIG-10

**Tools**:

- MCP: terminal
- Skill: NONE

**Done when**:

- [ ] `bun run build` ou comando equivalente conclui com sucesso
- [ ] `dist/` é gerado conforme esperado

**Verification**:

- `bun run build`

### T18: Run typecheck and targeted test verification

**What**: Executar typecheck e o subset de testes viável após a migração.
**Where**: `packages/guild`
**Depends on**: T17
**Reuses**: Scripts do pacote e testes trazidos do Weave
**Requirement**: GUILD-MIG-08, GUILD-MIG-10

**Tools**:

- MCP: terminal
- Skill: NONE

**Done when**:

- [ ] Typecheck passa
- [ ] Testes críticos ligados a config/runtime naming passam ou ficam com falhas explicitadas

**Verification**:

- `bun run typecheck`
- `bun test` ou subset relevante

### T19: Run residual rename sweeps

**What**: Buscar referências residuais de `weave` nas superfícies públicas e separar erro de resíduo deliberado.
**Where**: `packages/guild/**/*`
**Depends on**: T18
**Reuses**: Grep inventory de rename
**Requirement**: GUILD-MIG-04, GUILD-MIG-05, GUILD-MIG-06, GUILD-MIG-07, GUILD-MIG-09

**Tools**:

- MCP: filesystem, terminal
- Skill: NONE

**Done when**:

- [ ] Há busca final por `weave-opencode`
- [ ] Há busca final por `.weave`
- [ ] Há busca final por `weave-health`
- [ ] Sobras de `weave` estão justificadas como internals ou corrigidas

### T20: Final migration summary and next-phase backlog

**What**: Registrar o resultado da migração inicial e separar follow-ups de segunda fase.
**Where**: `.specs/project/STATE.md`, possivelmente `SESSION_LOG.md`
**Depends on**: T19
**Reuses**: Histórico do projeto em `.specs/project/STATE.md`
**Requirement**: GUILD-MIG-09, GUILD-MIG-10

**Tools**:

- MCP: filesystem
- Skill: `docs-writer`

**Done when**:

- [ ] O estado do projeto registra o que foi feito
- [ ] Follow-ups como rename de agentes e compat de config antiga ficam explícitos
- [ ] O próximo ciclo de trabalho pode começar sem reexplorar tudo

---

## Parallel Execution Map

```text
Phase 1:
  T01 -> T02 -> T03

Phase 2:
  T03 -> T04 -> T05 -> T06 -> T07

Phase 3:
  T07 complete, then:
    ├── T08
    ├── T09
    ├── T10
    ├── T11
    └── T12
  T08, T09, T10, T11, T12 -> T13

Phase 4:
  T13 -> T14 -> T15 -> T16

Phase 5:
  T16 -> T17 -> T18 -> T19 -> T20
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T01 Create archival destination | 1 directory decision | OK |
| T02 Copy current guild package | 1 copy operation | OK |
| T05 Replace guild source tree | 1 source-tree swap | OK |
| T09 Rename config conventions | 1 rename category | OK |
| T13 Update docs/examples | 1 documentation surface group | OK |
| T17 Run build verification | 1 verification command group | OK |

---

## Suggested Execution Notes

- Preferir commits por fase, não por task individual minúscula, para manter histórico legível.
- Tratar Phase 3 como sweep por categorias de rename, com busca e correção imediata após cada categoria.
- Se build ou typecheck falharem antes de T17 por razões estruturais, registrar a falha e voltar à menor task responsável.
