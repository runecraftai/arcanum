# Design: guild-builtin-model-fallbacks

## Overview

Esta feature precisa resolver dois gaps relacionados, mas diferentes:

1. **Fallback de resolucao inicial**: built-in agents precisam honrar `fallback_models` definidos pelo usuario.
2. **Fallback de runtime**: quando a OpenAI falhar por quota/janela/rate-limit/model-unavailable transitorio, o Guild precisa continuar a execucao com um modelo alternativo.

Resolver apenas o primeiro gap seria insuficiente. O requisito mandatorio do time e o segundo: failover automatico quando a janela OpenAI estourar.

## Current State

### Schema e tipos

- `fallback_models` existe em `AgentOverrideConfigSchema`
- `fallback_models` tambem existe no tipo de override de agente

### Resolucao atual

- built-ins leem `override.model`
- built-ins nao passam `override.fallback_models` para `resolveAgentModel()`
- `resolveAgentModel()` considera `overrideModel` como retorno terminal
- custom agents ja conseguem passar `customFallbackChain`

### Runtime atual

- o runtime do plugin aplica efeitos como `switchAgent`, `restoreAgent`, `injectPromptAsync` e `runReviewerFanOut`
- nao existe tratamento central de erro classificado para quota OpenAI
- nao existe politica de failover nem guarda anti-loop dedicada a fallback de modelo

## Target State

Ao final da feature, o Guild deve ter:

- built-in agents com suporte real a `fallback_models`
- classificador de erros elegiveis da OpenAI
- uma tentativa automatica de failover por etapa/mensagem
- logs estruturados para cada failover

## Design Decisions

### D1. Separar resolucao inicial de failover de runtime

**Decision**: tratar fallback de resolucao inicial e failover de runtime como duas camadas distintas.

**Why**:

- a cadeia de resolucao decide o modelo antes da execucao
- a cadeia de failover decide o que fazer quando o modelo escolhido falha em runtime
- misturar as duas preocupacoes gera ambiguidades e testes piores

### D2. Honrar `fallback_models` em built-ins com precedencia explicita

**Decision**: built-ins devem aceitar cadeia custom de fallback na resolucao inicial.

**Precedencia proposta**:

1. `model` definido explicitamente
2. `fallback_models` custom do built-in
3. `uiSelectedModel` para agentes `primary` ou `all` quando aplicavel e sem override explicito
4. fallback chain nativa do built-in
5. `systemDefaultModel`

**Why**:

- respeita a intencao explicita do usuario
- mantem compatibilidade com o comportamento existente

### D3. Limitar o failover automatico a erros elegiveis da OpenAI

**Decision**: acionar failover automatico apenas para:

- `quota exceeded`
- `rate limit`
- `429`
- `model unavailable` transitorio da OpenAI

**Why**:

- evita mascarar bugs de prompt, permissao ou runtime geral
- atende exatamente a regra aprovada pelo time

### D4. Fazer failover por cadeia de modelos do proprio agente

**Decision**: o failover deve usar a cadeia configurada do agente afetado, sem inventar roteamento global separado.

**Why**:

- mantem o comportamento local por agente
- reduz surpresa operacional
- permite ajustar `bard` e `wizard` de forma diferente de `fighter` e `cleric`

### D5. Anti-loop estrito

**Decision**: no maximo uma tentativa automatica de failover por etapa/mensagem.

**Why**:

- protege contra cascatas de retries
- simplifica estado e testes

### D6. Comecar pelo menor ponto de interceptacao possivel

**Decision**: tentar interceptar o erro na superficie mais proxima de onde as chamadas de sessao sao reinjetadas (`session-client` / `apply-effects`), antes de espalhar logica por varios pontos.

**Why**:

- o runtime atual centraliza reenvio de prompt via `session.promptAsync`
- um ponto de interceptacao menor reduz diff e facilita observabilidade

## Proposed Architecture

### Layer 1: Builtin fallback chain resolution

Mudancas principais:

- `builtin-agents.ts` passa `override.fallback_models` para a resolucao
- `model-resolution.ts` aceita `customFallbackChain` tambem para built-ins
- helper de parse converte strings `provider/model` em `FallbackEntry[]`

### Layer 2: OpenAI failover classifier

Criar um classificador dedicado que receba erro bruto e responda algo como:

- `eligible: true | false`
- `reason: "quota" | "rate_limit" | "model_unavailable" | "other"`
- `provider: "openai" | "other" | "unknown"`

Esse classificador precisa ser conservador: em caso de duvida, nao fazer failover.

### Layer 3: Runtime failover guard and replay

Fluxo esperado:

1. chamada com modelo principal falha
2. erro e classificado como elegivel da OpenAI
3. verificar se ja houve failover automatico para aquela etapa/mensagem
4. se nao houve, selecionar proximo modelo da cadeia do agente
5. reexecutar uma vez com esse fallback
6. logar evento de failover
7. se falhar de novo, propagar erro normal

## Data Model Considerations

Precisamos representar duas coisas:

1. cadeia declarativa por agente
2. estado de tentativa de failover por execucao

O estado de tentativa pode ser efemero em memoria se a superficie de erro ficar no mesmo processo/sessao.

## Verification Strategy

### Unit

- `model-resolution.test.ts`
  - built-in usa `fallback_models`
  - built-in com `model + fallback_models`
  - built-in sem match cai para cadeia nativa

### Runtime / integration-style

- erro OpenAI elegivel aciona fallback
- erro OpenAI nao elegivel nao aciona fallback
- erro de provider nao-OpenAI nao aciona fallback
- fallback ocorre apenas uma vez
- logs registram failover

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A superficie exata de erro do OpenCode nao ser obvia | Failover pode ser implementado no ponto errado | Investigar erro real e testar com harness controlado |
| Classificacao frouxa demais | Bugs reais mascarados | Classificador conservador e allowlist de motivos |
| Estado de anti-loop ficar preso no lugar errado | Retry infinito ou retry ausente | Guardas de tentativa por mensagem/etapa e testes dedicados |
| Cadeia custom conflitar com comportamento atual | Regressao em configs existentes | Precedencia explicita e testes de compatibilidade |

## Exit Criteria

O design estara completo quando:

1. a precedencia de `model` e `fallback_models` estiver definida
2. os erros elegiveis de OpenAI estiverem claramente classificados
3. a estrategia anti-loop estiver especificada
4. os pontos provaveis de implementacao e teste estiverem mapeados
