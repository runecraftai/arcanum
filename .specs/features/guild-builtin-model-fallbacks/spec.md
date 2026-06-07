# Guild Builtin Model Fallbacks Specification

## Problem Statement

O Guild expoe `fallback_models` no schema de configuracao de agentes, mas os built-in agents nao respeitam essa cadeia hoje. Para built-ins, `agents.<name>.model` funciona, porem o fallback configurado pelo usuario nao entra na resolucao real.

Mais grave: mesmo que a resolucao inicial passe a aceitar `fallback_models`, isso ainda nao resolve o requisito mandatorio do time. O problema real e que, quando `openai` estoura a janela/quota ou responde com rate-limit, o Guild nao possui failover automatico focado nesse caso. Ou seja, existe um gap entre a configuracao prometida e o comportamento necessario em runtime.

O time decidiu que fallback automatico deve existir, mas apenas para erros elegiveis da OpenAI relacionados a quota/janela/rate-limit/indisponibilidade transitora. Nao queremos mascarar bugs gerais de provider nem cair automaticamente em modelos diferentes para qualquer erro generico.

## Goals

- [ ] Fazer built-in agents respeitarem `fallback_models` na resolucao inicial
- [ ] Implementar failover automatico de runtime apenas para erros elegiveis da OpenAI
- [ ] Permitir definir cadeia explicita de fallback por agente built-in
- [ ] Evitar loops de fallback infinito ou mascaramento de bugs nao relacionados a quota
- [ ] Tornar o failover observavel por logs/testes

## Out of Scope

Fora do escopo desta feature.

| Item | Reason |
| --- | --- |
| Fallback automatico para qualquer provider | A prioridade do time e proteger quota/janela OpenAI |
| Fallback automatico para erros genericos de prompt, ferramenta ou permissao | Isso mascara falhas reais e dificulta debug |
| Redesenhar a arquitetura inteira de agents/runtime do Guild | Queremos correcao minima, nao replatform nova |
| Trocar prompts ou comportamento semantico dos agentes | O foco e selecao/failover de modelo |
| Benchmark de qualidade entre todos os modelos possiveis | O objetivo aqui e confiabilidade operacional do fallback |

---

## User Stories

### P1: Respeitar `fallback_models` nos built-ins ⭐ MVP

**User Story**: Como configurador do Guild, eu quero definir `fallback_models` em um built-in agent para que a cadeia personalizada seja usada na escolha inicial do modelo.

**Why P1**: O schema atual sugere essa capacidade, mas o runtime nao a honra para built-ins.

**Acceptance Criteria**:

1. WHEN um built-in agent possuir `fallback_models` THEN o Guild SHALL usar essa cadeia na resolucao inicial do modelo.
2. WHEN `model` tambem estiver definido THEN a precedencia SHALL ser deterministica e documentada.
3. WHEN nenhuma entrada custom casar THEN o Guild SHALL continuar tendo fallback para a cadeia nativa/default atual.

**Independent Test**: Configurar um built-in com cadeia custom de fallback e verificar por teste unitaria que a resolucao escolhe o primeiro modelo disponivel da cadeia custom antes de cair na cadeia nativa.

---

### P1: Fazer failover automatico apenas para quota/janela/rate-limit OpenAI ⭐ MVP

**User Story**: Como time que depende de OpenAI e Go ao mesmo tempo, eu quero que o Guild mude automaticamente para um fallback quando OpenAI estourar a janela para que o fluxo continue sem intervencao manual imediata.

**Why P1**: Esse e o requisito mandatorio que protege a operacao do time.

**Acceptance Criteria**:

1. WHEN uma chamada OpenAI falhar por quota, janela, rate limit ou indisponibilidade transitoria THEN o Guild SHALL acionar o fallback do agente.
2. WHEN o erro nao for elegivel THEN o Guild SHALL nao acionar fallback automatico.
3. WHEN o fallback for acionado THEN o fluxo SHALL continuar com no maximo uma tentativa automatica adicional por etapa/mensagem.

**Independent Test**: Simular erro elegivel de OpenAI e verificar que o runtime troca para fallback configurado e reexecuta uma vez.

---

### P1: Evitar loop e mascaramento de erro ⭐ MVP

**User Story**: Como mantenedor, eu quero que o failover seja restrito para nao esconder bugs reais nem entrar em retry infinito.

**Why P1**: Fallback sem limites e sem classificacao correta cria falhas silenciosas mais perigosas do que o erro original.

**Acceptance Criteria**:

1. WHEN o fallback automatico ja tiver sido tentado para a mesma etapa/mensagem THEN o Guild SHALL nao tentar novamente em loop.
2. WHEN o fallback tambem falhar THEN o erro SHALL seguir para o fluxo normal de falha.
3. WHEN o erro original nao for classificado como quota/rate-limit/model-unavailable OpenAI THEN o Guild SHALL nao trocar de modelo automaticamente.

**Independent Test**: Simular falha do modelo original e falha do fallback, e confirmar que existe no maximo um failover automatico.

---

### P2: Tornar o failover visivel e auditavel

**User Story**: Como time, eu quero ver quando o fallback aconteceu para que possamos ajustar a estrategia de modelos com base em evidencia.

**Why P2**: Failover invisivel atrapalha tuning da janela OpenAI e do custo Go.

**Acceptance Criteria**:

1. WHEN houver failover THEN logs estruturados SHALL registrar agente, modelo original, erro classificado e modelo fallback.
2. WHEN houver testes de runtime THEN eles SHALL cobrir o caminho de fallback e de nao-fallback.
3. WHEN o fallback ocorrer em producao/desenvolvimento THEN a manutencao SHALL conseguir identificar o evento sem inspecao manual profunda.

**Independent Test**: Executar os testes de fallback e revisar o logger/mensagens produzidas.

---

## Edge Cases

- WHEN `model` estiver definido e tambem existir `fallback_models` THEN a cadeia custom SHALL ser tratada como fallback desse modelo primario, nao como ruido ignorado.
- WHEN o modelo OpenAI falhar por erro de prompt invalido ou permissao THEN o Guild SHALL nao fazer failover.
- WHEN o fallback apontar para outro modelo OpenAI igualmente fora da janela THEN o Guild SHALL consumir apenas uma tentativa automatica e parar.
- WHEN o fallback chain estiver vazio ou mal configurado THEN o Guild SHALL falhar explicitamente, sem comportamento magico silencioso.
- WHEN o erro ocorrer em agente de review disparado por orquestracao THEN a protecao anti-loop SHALL continuar valendo.

---

## Requirement Traceability

| Requirement ID | Story | Planned Artifact | Status |
| --- | --- | --- | --- |
| GUILD-FALLBACK-01 | Built-ins respeitam `fallback_models` | `packages/guild/src/agents/builtin-agents.ts` + `model-resolution.ts` | Planned |
| GUILD-FALLBACK-02 | Failover automatico para erros elegiveis da OpenAI | runtime fallback policy | Planned |
| GUILD-FALLBACK-03 | Protecao anti-loop | runtime fallback state/guards | Planned |
| GUILD-FALLBACK-04 | Observabilidade do failover | logs + testes | Planned |

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped.

---

## Success Criteria

- [ ] `fallback_models` funciona para built-in agents na resolucao inicial
- [ ] Falhas elegiveis de OpenAI acionam fallback automatico
- [ ] Falhas nao elegiveis nao acionam fallback automatico
- [ ] O runtime nao entra em loop de failover
- [ ] Existe visibilidade suficiente para operar e ajustar a estrategia
