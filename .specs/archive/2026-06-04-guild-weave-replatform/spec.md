# Guild Weave Replatform Specification

## Problem Statement

`@runecraft/guild` existe hoje como um plugin OpenCode menor, com superfície funcional limitada e arquitetura diferente da visão de produto desejada. Em paralelo, `opencode-weave` já implementa a base técnica mais completa que queremos adotar, mas com identidade, paths, schema, docs e convenções próprias.

Precisamos transformar o `weave` no novo `guild` sem perder a identidade histórica do pacote atual, sem quebrar o monorepo `arcanum`, e com uma ordem de execução segura que permita validar cada etapa de forma incremental.

## Goals

- [ ] Substituir a base técnica de `packages/guild` pela implementação do `opencode-weave`
- [ ] Preservar o `guild` atual em backup versionado fora do workspace ativo
- [ ] Renomear todas as superfícies públicas de `weave` para `guild` na primeira passagem
- [ ] Manter `@runecraft/guild` como pacote publicado e integrante do monorepo
- [ ] Deixar nomes internos de arquitetura do Weave intactos nesta primeira etapa para reduzir risco

## Out of Scope

Explicitamente fora do escopo desta migração inicial.

| Feature | Reason |
| --- | --- |
| Renomear agentes internos (`loom`, `thread`, `weft`, etc.) | Alto risco sem ganho imediato |
| Redesenhar a arquitetura do plugin após a absorção | Primeiro precisamos concluir o port 1:1 funcional |
| Compatibilidade longa com config antigo do `guild` atual | Pode ser avaliada depois da migração base |
| Reaproveitar obrigatoriamente todos os tools do `guild` atual | O objetivo inicial e adotar o runtime do Weave |
| Rebranding visual completo do ecossistema ao redor do pacote | Pode vir em etapa posterior |

---

## User Stories

### P1: Substituir a base do pacote mantendo a identidade de produto ⭐ MVP

**User Story**: Como mantenedor do `arcanum`, eu quero que `@runecraft/guild` passe a usar a base técnica do `weave` para que eu possa evoluir o plugin a partir de uma fundação mais completa sem perder meu namespace e minha identidade de pacote.

**Why P1**: Sem isso, continuamos com duas linhas de produto concorrentes e não chegamos ao objetivo principal.

**Acceptance Criteria**:

1. WHEN a migração começar THEN o conteúdo atual de `packages/guild` SHALL ser preservado em backup rastreável fora do workspace ativo.
2. WHEN a nova base for instalada THEN `packages/guild` SHALL refletir a implementação do `opencode-weave` adaptada ao monorepo `arcanum`.
3. WHEN o pacote for inspecionado THEN seu `package.json` SHALL continuar usando o nome `@runecraft/guild`.
4. WHEN o pacote for construído THEN ele SHALL continuar emitindo artefatos válidos em `dist/`.

**Independent Test**: Comparar o backup preservado com o novo `packages/guild`, validar que o pacote compila e continua publicável sob `@runecraft/guild`.

---

### P1: Renomear superfícies públicas de Weave para Guild ⭐ MVP

**User Story**: Como dono do plugin, eu quero que referências públicas de `weave` passem a falar `guild` para que o pacote entregue a identidade correta já na primeira versão migrada.

**Why P1**: A migração não cumpre o objetivo se continuar expondo a marca antiga na superfície principal.

**Acceptance Criteria**:

1. WHEN configs forem documentadas e carregadas THEN o sistema SHALL usar `guild-opencode.jsonc` e `guild-opencode.json` como nomes canônicos.
2. WHEN o runtime registrar logs e relatórios THEN ele SHALL usar prefixos e service name `guild`.
3. WHEN o pacote expuser schema, docs e README THEN eles SHALL referenciar `guild`, não `weave`.
4. WHEN comandos builtin de health forem expostos THEN o comando SHALL usar a identidade `guild`.

**Independent Test**: Rodar busca por `weave` nas superfícies públicas do pacote e confirmar apenas referências internas deliberadamente preservadas.

---

### P1: Preservar segurança operacional da migração ⭐ MVP

**User Story**: Como mantenedor, eu quero executar a migração em fases pequenas e verificáveis para que eu consiga detectar regressões cedo e corrigir sem perder contexto.

**Why P1**: O escopo cruza código, docs, schema, runtime e testes; sem fases atômicas o risco operacional fica alto.

**Acceptance Criteria**:

1. WHEN o plano for executado THEN cada fase SHALL ter tarefas atômicas com critérios claros de pronto.
2. WHEN uma fase terminar THEN ela SHALL ter comandos de verificação explícitos.
3. WHEN a migração terminar THEN deverá existir rastreabilidade entre requisitos, design e tarefas.

**Independent Test**: Executar uma fase por vez e verificar se cada checkpoint produz evidência objetiva antes da próxima fase.

---

### P2: Limitar o rename inicial ao que e externo

**User Story**: Como mantenedor, eu quero evitar renomear internals do Weave na primeira passagem para que a migração fique menor e mais previsível.

**Why P2**: O rename profundo de agentes e conceitos internos pode ser feito depois, com menos risco.

**Acceptance Criteria**:

1. WHEN o código for migrado THEN nomes internos de agentes SHALL permanecer intactos nesta etapa.
2. WHEN o runtime usar conceitos arquiteturais internos THEN eles SHALL poder continuar com naming legado se isso reduzir diffs e risco.

**Independent Test**: Revisar diffs e confirmar que a maioria dos renames atingiu apenas package identity, paths, docs, schema, logs e comandos públicos.

---

## Edge Cases

- WHEN o backup for criado dentro de `packages/*` THEN o monorepo SHALL evitar registrar esse backup como workspace ativo.
- WHEN o Weave depender de paths como `.weave/` e `weave-opencode.jsonc` THEN a migração SHALL renomear esses pontos de persistência de forma consistente.
- WHEN existirem references residuais de `weave` em testes ou docs THEN a verificação SHALL tratá-las como pendências explícitas.
- WHEN o build do Weave divergir do build atual do `guild` THEN a fase de integração SHALL ajustar scripts e verificar o pipeline do pacote.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| GUILD-MIG-01 | Preservar backup do guild atual fora do workspace ativo | Design | Pending |
| GUILD-MIG-02 | Substituir a base de `packages/guild` pela implementação do Weave | Design | Pending |
| GUILD-MIG-03 | Manter `@runecraft/guild` como identidade do pacote | Design | Pending |
| GUILD-MIG-04 | Renomear config paths `weave-opencode` para `guild-opencode` | Design | Pending |
| GUILD-MIG-05 | Renomear state paths `.weave` para `.guild` | Design | Pending |
| GUILD-MIG-06 | Renomear logs, schema e docs públicos de `weave` para `guild` | Design | Pending |
| GUILD-MIG-07 | Renomear comando/health e envelopes públicos de `weave` para `guild` | Design | Pending |
| GUILD-MIG-08 | Adaptar o pacote à estrutura de workspace/build do `arcanum` | Design | Pending |
| GUILD-MIG-09 | Verificar que nomes internos de agentes permanecem intactos nesta etapa | Design | Pending |
| GUILD-MIG-10 | Fornecer plano faseado, atômico e verificável | Design | Pending |

**Coverage:** 10 total, 0 mapped to tasks, 10 unmapped.

---

## Success Criteria

- [ ] Existe backup íntegro do `guild` atual em diretório arquivado fora do workspace ativo
- [ ] `packages/guild` passa a conter a base técnica do `weave`
- [ ] `packages/guild/package.json` continua sendo `@runecraft/guild`
- [ ] Config canônica e paths persistentes usam `guild`, não `weave`
- [ ] README, schema e superfícies públicas do pacote refletem a identidade `guild`
- [ ] O plano de execução pode ser seguido fase a fase com checkpoints objetivos
