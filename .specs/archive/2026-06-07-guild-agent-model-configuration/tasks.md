# Tasks: guild-agent-model-configuration

**Design**: `.specs/features/guild-agent-model-configuration/design.md`
**Status**: Completed ✅

---

## Execution Plan

### Phase 1: Evidence Consolidation (Sequential)

```text
T01 -> T02 -> T03
```

### Phase 2: Strategy Definition (Sequential)

```text
T03 -> T04 -> T05
```

### Phase 3: Configuration and Operational Guidance (Sequential)

```text
T05 -> T06 -> T07
```

---

## Task Breakdown

### T01: Consolidate available model inventory and constraints

**What**: Consolidar a lista real de modelos disponiveis e as restricoes explicitamente aprovadas pelo time.
**Where**: docs da feature e notas de apoio
**Depends on**: None
**Reuses**: inventario de `opencode models`, docs de `go` e `zen`, decisoes da conversa atual
**Requirement**: GUILD-MODEL-01, GUILD-MODEL-04

**Done when**:

- [x] Os providers realmente disponiveis estao listados
- [x] Os modelos gratuitos relevantes estao identificados
- [x] As restricoes aprovadas (`qwen3.7-plus` fora, cuidado com free, etc.) estao capturadas

### T02: Capture operating evidence from current project usage

**What**: Consolidar a leitura dos stats recentes para ancorar a estrategia em consumo real.
**Where**: docs da feature e notas de apoio
**Depends on**: T01
**Reuses**: `opencode stats --days 7 --models 20 --project ""`
**Requirement**: GUILD-MODEL-03

**Done when**:

- [x] O uso recente de OpenAI versus Go foi resumido
- [x] Os modelos que mais consumiram custo Go ficaram explicitos
- [x] A leitura diferenciou custo monetario de consumo de janela OpenAI

### T03: Define model classes by agent role

**What**: Classificar quais papeis merecem OpenAI, quais devem usar Go barato e quais podem usar free.
**Where**: `design.md`
**Depends on**: T02
**Reuses**: inventario + stats + restricoes
**Requirement**: GUILD-MODEL-01, GUILD-MODEL-03

**Done when**:

- [x] Os agentes foram agrupados por perfil de consumo/criticidade
- [x] Existe justificativa para OpenAI, Go barato e free por papel
- [x] A classificacao evita improviso por agente

### T04: Produce the official agent-to-model matrix

**What**: Definir a matriz oficial agente -> modelo principal.
**Where**: `design.md` e `spec.md`
**Depends on**: T03
**Reuses**: classificacao por papel
**Requirement**: GUILD-MODEL-01

**Done when**:

- [x] Os oito built-ins possuem modelo oficial recomendado
- [x] O racional por agente foi registrado
- [x] A matriz esta coerente com custo e janela OpenAI

### T05: Define the pressure-release policy for OpenAI window usage

**What**: Registrar a ordem oficial de agentes a mover quando a janela OpenAI apertar.
**Where**: `design.md`
**Depends on**: T04
**Reuses**: matriz oficial
**Requirement**: GUILD-MODEL-03

**Done when**:

- [x] Existe uma ordem explicita de alivio da janela OpenAI
- [x] `bard` e `wizard` sao preservados ate o fim por default
- [x] Review e execucao aparecem como primeiros candidatos de corte

### T06: Write the reference `guild-opencode.jsonc` snippet

**What**: Gerar o snippet de configuracao de referencia com `agents.<name>.model` explicito.
**Where**: doc final da feature ou documentacao de apoio a implementar
**Depends on**: T05
**Reuses**: matriz oficial
**Requirement**: GUILD-MODEL-02

**Done when**:

- [x] Existe snippet completo para os built-ins
- [x] O snippet e compativel com o schema atual
- [x] A matriz e o snippet batem 1:1

### T07: Document the weekly review loop

**What**: Registrar o procedimento minimo de revisao continua com `opencode stats`.
**Where**: docs da feature
**Depends on**: T06
**Reuses**: politica de balanceamento definida
**Requirement**: GUILD-MODEL-03

**Done when**:

- [x] O comando de revisao esta documentado
- [x] O time sabe o que observar em OpenAI e Go
- [x] A feature termina com um loop operacional, nao so uma foto estatica
