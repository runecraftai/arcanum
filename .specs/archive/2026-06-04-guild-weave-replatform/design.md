# Design: guild-weave-replatform

## Overview

Esta migracao sera executada como um **replatform controlado**:

1. Congelar e arquivar o `guild` atual
2. Promover o `opencode-weave` a nova base tecnica de `packages/guild`
3. Renomear apenas superfícies publicas e operacionais de `weave` para `guild`
4. Integrar a nova base ao monorepo `arcanum`
5. Validar build, typecheck e buscas de regressao por naming residual

O principio central e: **maximo reaproveitamento estrutural do Weave, minimo rename interno nesta primeira passagem**.

## Current State

### Guild atual

- Pacote leve com implementacao propria em `packages/guild/src/*`
- Build simples via `tsc` e schema gerado em `scripts/generate-schema.ts`
- Identidade publica consolidada como `@runecraft/guild`

### Weave atual

- Plugin OpenCode mais completo, com runtime maior e multiplos subsistemas
- Scripts proprios de build, verify, eval e schema
- Naming proprio para package, config, state dir, logs, schema e comandos

## Target State

`packages/guild` passa a ser:

- **base funcional:** `opencode-weave`
- **identidade publica:** `@runecraft/guild`
- **config canonica:** `guild-opencode.json(c)`
- **state dir canonico:** `.guild/`
- **schema canonico:** `schema/guild-config.schema.json`
- **surface branding:** Guild

## Design Decisions

### D1. Backup fora de `packages/*`

**Decision**: arquivar o `guild` atual em `packages/_archived/guild-legacy-YYYYMMDD/`.

**Why**:

- `arcanum/package.json` usa `workspaces: ["packages/*"]`
- Colocar o backup como `packages/guild-legacy` arrisca registrá-lo como workspace ativo
- Prefixo `_archived` evita colisão com workspaces e preserva material historico no repo

### D2. Lift-and-shift do Weave para `packages/guild`

**Decision**: substituir o conteudo funcional de `packages/guild` pela arvore relevante do `opencode-weave`, adaptando arquivos em vez de criar uma camada wrapper.

**Why**:

- O objetivo declarado e que o Weave seja o novo Guild
- Wrappers aumentariam ambiguidade de ownership e dificultariam customizacao futura
- O pacote precisa terminar controlado integralmente pelo monorepo `arcanum`

### D3. Rename inicial apenas das superfícies publicas

**Decision**: renomear package identity, config names, state dir, schema, logs, docs e comandos publicos. Nomes internos de agentes permanecem.

**Why**:

- Reduz o diff sem comprometer identidade externa
- Preserva comportamento testado do Weave
- Separa claramente migracao tecnica de rebranding arquitetural

### D4. Monorepo-first integration

**Decision**: o pacote final deve obedecer as convencoes de `arcanum` para workspace, build, publicacao e changesets, mesmo se scripts internos vierem do Weave.

**Why**:

- `@runecraft/guild` sera distribuido a partir do `arcanum`
- Fluxo de release precisa continuar coerente com `turbo`, `changesets` e estrutura do repo

## Rename Surface Map

### Rename obrigatorio nesta etapa

- Nome do pacote npm e metadata associados
- `WeavePlugin`/exports principais para identidade Guild
- `weave-opencode.json(c)` -> `guild-opencode.json(c)`
- `.weave/` -> `.guild/`
- `schema/weave-config.schema.json` -> `schema/guild-config.schema.json`
- `x-weave-version` -> `x-guild-version`
- prefixes `[weave:*]` -> `[guild:*]`
- `service: "weave"` -> `service: "guild"`
- `WEAVE_LOG_LEVEL` -> `GUILD_LOG_LEVEL`
- `weave-health` -> `guild-health`
- README, docs, examples e fixtures publicos

### Rename explicitamente adiado

- Agentes: `loom`, `tapestry`, `shuttle`, `pattern`, `thread`, `spindle`, `weft`, `warp`
- Tool id `call_weave_agent`
- Conceitos internos que nao vazam como identidade de produto

## Migration Architecture

### Phase 1: Preserve

Congelar e copiar o `guild` atual para arquivo historico.

### Phase 2: Replace

Popular `packages/guild` com a base do `opencode-weave`.

### Phase 3: Rebrand Public Surface

Aplicar rename mecanico e validado nas superfícies externas.

### Phase 4: Integrate

Adaptar scripts, package manifest, docs e caminhos ao monorepo `arcanum`.

### Phase 5: Verify

Executar build, typecheck, buscas residuais e smoke checks documentais.

## Verification Strategy

Cada fase deve encerrar com evidência objetiva:

- Fase 1: backup existe e workspace ativo nao foi afetado
- Fase 2: `packages/guild` contem base do Weave esperada
- Fase 3: buscas por `weave-opencode`, `.weave`, `weave-health` e service/log branding retornam apenas sobras deliberadas
- Fase 4: `package.json`, scripts e schema encaixam no monorepo
- Fase 5: build/typecheck/testes ou subset relevante executam sem regressões críticas

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Backup cair dentro de workspace ativo | Monorepo confuso, builds inesperados | Arquivar em `packages/_archived/...` |
| Rename incompleto de config/state paths | Plugin sobe mas persiste em paths antigos | Fazer sweep dedicado por categoria de rename |
| Scripts do Weave divergirem do `arcanum` | Build quebrado ou pipeline inconsistente | Tratar integração do manifest como fase separada |
| Docs/examples ficarem inconsistentes com runtime | Usuário configura pacote com naming errado | Fase dedicada para docs e examples |
| Rename profundo cedo demais | Regressão desnecessária | Congelar internals e focar em surface branding |

## Exit Criteria

O plano pode ser considerado pronto para execução quando:

1. O backup location estiver definido e aceito
2. O escopo de rename obrigatório estiver explícito
3. As tarefas estiverem quebradas em passos atômicos com dependências
4. Cada fase tiver comandos/checkpoints de verificação
