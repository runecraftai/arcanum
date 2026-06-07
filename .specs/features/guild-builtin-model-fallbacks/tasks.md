# Tasks: guild-builtin-model-fallbacks

**Design**: `.specs/features/guild-builtin-model-fallbacks/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Resolution Gap Closure (Sequential)

```text
T01 -> T02 -> T03
```

### Phase 2: Runtime Failover Discovery (Sequential)

```text
T03 -> T04 -> T05
```

### Phase 3: Failover Implementation (Sequential)

```text
T05 -> T06 -> T07 -> T08
```

### Phase 4: Verification and Hardening (Sequential)

```text
T08 -> T09 -> T10
```

---

## Task Breakdown

### T01: Wire `fallback_models` into builtin model resolution inputs

**What**: Fazer os built-ins passarem a cadeia `fallback_models` do override para a resolucao de modelo.
**Where**: `packages/guild/src/agents/builtin-agents.ts`
**Depends on**: None
**Reuses**: padrao de `customFallbackChain` ja usado em custom agents
**Requirement**: GUILD-FALLBACK-01

**Done when**:

- [ ] Built-ins deixam de ignorar `fallback_models`
- [ ] A resolucao recebe a cadeia custom quando presente
- [ ] Nao ha regressao obvia em built-ins sem fallback custom

### T02: Extend `resolveAgentModel()` to honor custom chains for built-ins

**What**: Ajustar a precedencia e a escolha de cadeia na resolucao de modelo para built-ins.
**Where**: `packages/guild/src/agents/model-resolution.ts`
**Depends on**: T01
**Reuses**: `FallbackEntry`, fallback chain nativa e custom agent support existente
**Requirement**: GUILD-FALLBACK-01

**Done when**:

- [x] A precedencia `model` + `fallback_models` fica explicita no codigo
- [x] Built-ins com cadeia custom usam essa cadeia antes da cadeia nativa
- [x] `systemDefaultModel` continua como fallback tardio

### T03: Add unit tests for builtin fallback resolution

**What**: Cobrir com testes a nova precedencia e comportamento de built-ins com fallback custom.
**Where**: `packages/guild/src/agents/model-resolution.test.ts` e/ou testes de `builtin-agents`
**Depends on**: T02
**Reuses**: suite atual de model resolution
**Requirement**: GUILD-FALLBACK-01

**Done when**:

- [x] Existem testes para built-in com `fallback_models`
- [x] Existe teste para built-in com `model + fallback_models`
- [x] Existe teste para queda na cadeia nativa quando a custom nao casar

### T04: Discover the exact runtime error surface for OpenAI quota failures

**What**: Identificar por onde erros de quota/rate-limit/model-unavailable da OpenAI chegam ao Guild runtime.
**Where**: adaptadores runtime, harnesses, possiveis testes/instrumentacao
**Depends on**: T03
**Reuses**: `plugin-adapter.ts`, `apply-effects.ts`, `session-client.ts`
**Requirement**: GUILD-FALLBACK-02

**Done when**:

- [x] O ponto de interceptacao do erro esta identificado
- [x] Ficou claro se o erro chega como excecao, evento ou ambos
- [x] Existe evidencia suficiente para implementar sem chute

### T05: Implement a conservative OpenAI failover error classifier

**What**: Criar classificador que reconhece apenas erros elegiveis para failover automatico.
**Where**: novo helper/runtime policy file
**Depends on**: T04
**Reuses**: tipos/strings reais observados na etapa anterior
**Requirement**: GUILD-FALLBACK-02

**Done when**:

- [x] `quota exceeded`, `429`, `rate limit` e `model unavailable` OpenAI sao reconhecidos
- [x] Erros nao elegiveis retornam `false`
- [x] Em caso de duvida o classificador falha de forma conservadora

### T06: Add one-shot failover guard state

**What**: Introduzir estado efemero que impede loop de failover para a mesma etapa/mensagem.
**Where**: runtime failover policy / session client wrapper
**Depends on**: T05
**Reuses**: maps/guards semelhantes usados no runtime atual
**Requirement**: GUILD-FALLBACK-03

**Done when**:

- [x] O runtime sabe se ja tentou failover para aquela execucao
- [x] Existe no maximo uma tentativa automatica adicional
- [x] Falha repetida nao reentra em loop

### T07: Replay the failed OpenAI step using the next fallback model

**What**: Reexecutar uma vez a etapa falha usando o proximo modelo elegivel da cadeia do agente.
**Where**: `session-client.ts`, `apply-effects.ts` ou ponto equivalente definido em T04
**Depends on**: T06
**Reuses**: cadeia do agente e mecanismos existentes de prompt/session
**Requirement**: GUILD-FALLBACK-02, GUILD-FALLBACK-03

**Done when**:

- [x] O runtime escolhe o proximo fallback do agente
- [x] A etapa e reenviada uma unica vez
- [x] Se o fallback falhar, o erro segue normalmente

### T08: Add structured logging for failover events

**What**: Registrar logs claros de failover com agente, modelo original, motivo e modelo fallback.
**Where**: runtime policy / logger
**Depends on**: T07
**Reuses**: `debug`, `info`, `warn` do Guild
**Requirement**: GUILD-FALLBACK-04

**Done when**:

- [x] Cada failover gera um log estruturado
- [x] Os logs diferenciam erro elegivel de erro ignorado
- [x] O time consegue rastrear fallback sem mergulho manual profundo

### T09: Add runtime tests for fallback and non-fallback paths

**What**: Cobrir failover automatico, anti-loop e casos nao elegiveis com testes.
**Where**: testes de runtime/policy/harness
**Depends on**: T08
**Reuses**: harnesses de plugin/runtime existentes
**Requirement**: GUILD-FALLBACK-02, GUILD-FALLBACK-03, GUILD-FALLBACK-04

**Done when**:

- [x] Erro elegivel OpenAI aciona fallback em teste
- [x] Erro nao elegivel nao aciona fallback em teste
- [x] Existe teste que prova ausencia de loop

### T10: Document fallback semantics and operator expectations

**What**: Atualizar documentacao da feature e notas operacionais para refletir o comportamento final.
**Where**: docs da feature, possivel `STATE.md` ou docs do pacote depois da implementacao
**Depends on**: T09
**Reuses**: comportamento final validado
**Requirement**: GUILD-FALLBACK-04

**Done when**:

- [x] A semantica de `fallback_models` dos built-ins ficou clara
- [x] O time entende que o failover automatico vale apenas para erros OpenAI elegiveis
- [x] A feature fica pronta para execucao sem ambiguidade
