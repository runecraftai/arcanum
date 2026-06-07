# Guild Agent Model Configuration Specification

## Problem Statement

O Guild hoje possui defaults de modelos e aceita `agents.<name>.model` no `guild-opencode.jsonc`, mas o repositorio nao possui uma especificacao dedicada para a estrategia de distribuicao de modelos entre `openai`, `opencode-go` e modelos gratuitos do provider `opencode`.

Isso gera dois riscos:

1. o time pode configurar agentes de forma inconsistente, drenando rapido a janela do `openai`
2. o time pode empurrar agentes criticos para modelos caros do `opencode-go`, aumentando custo real sem necessidade

Ja levantamos os modelos realmente disponiveis no ambiente, os custos do `opencode-go`, a existencia de modelos gratuitos do `opencode`, e o fato de que a assinatura `openai` via OAuth nao aparece como custo monetario no `stats`, mas ainda consome uma janela de uso/fair-use. Precisamos transformar essa analise em uma estrategia documentada, configuravel e verificavel.

## Goals

- [x] Definir uma estrategia oficial de distribuicao de modelos por agente para equilibrar janela `openai`, custo `opencode-go` e uso de modelos gratuitos
- [x] Documentar o racional por papel de agente (`bard`, `wizard`, `fighter`, `cleric`, `paladin`, `ranger`, `rogue`, `warlock`)
- [x] Criar uma configuracao de referencia para `guild-opencode.jsonc`
- [x] Tornar explicita a politica operacional de revisao semanal via `opencode stats`
- [x] Evitar defaults caros ou inconsistentes como parte da recomendacao oficial do time

## Out of Scope

Fora do escopo desta feature.

| Item | Reason |
| --- | --- |
| Implementar fallback automatico de runtime | Isso pertence a feature separada de fallback obrigatorio |
| Alterar o comportamento do runtime de execucao do OpenCode | Aqui definimos estrategia/configuracao, nao failover de provider |
| Redesenhar os prompts dos agentes | O foco e selecao de modelo |
| Adicionar novos providers externos ao ambiente atual | A estrategia deve partir dos providers ja autenticados |
| Fazer benchmark formal de qualidade de resposta por benchmark synthetic | Podemos usar validacao pratica e stats do projeto |

---

## User Stories

### P1: Definir a distribuicao oficial de modelos por agente ⭐ MVP ✅

**User Story**: Como mantenedor do Guild, eu quero uma distribuicao oficial de modelos por agente para que o time nao configure cada agente no improviso.

**Why P1**: Sem uma estrategia oficial, custo e consumo da janela OpenAI ficam erraticos.

**Acceptance Criteria**:

1. WHEN a feature terminar THEN a documentacao SHALL listar o modelo principal recomendado para cada built-in agent.
2. WHEN a recomendacao citar `openai` THEN ela SHALL justificar por que aquele agente merece consumir a janela.
3. WHEN a recomendacao citar `opencode-go` ou modelos gratuitos THEN ela SHALL justificar por que o papel suporta custo ou qualidade menor.

**Independent Test**: Ler a especificacao e confirmar que os oito agentes built-in possuem modelo recomendado e justificativa coerente.

---

### P1: Gerar configuracao de referencia para `guild-opencode.jsonc` ⭐ MVP ✅

**User Story**: Como usuario do Guild, eu quero um snippet de configuracao de referencia para aplicar a estrategia sem ter que reconstruir a matriz manualmente.

**Why P1**: A estrategia so vira pratica operacional quando existe uma configuracao clara e reutilizavel.

**Acceptance Criteria**:

1. WHEN a feature terminar THEN ela SHALL produzir um bloco de configuracao de referencia em formato compativel com `agents.<name>.model`.
2. WHEN o snippet for aplicado THEN os modelos SHALL refletir exatamente a distribuicao oficial aprovada.
3. WHEN houver agentes que usam modelos gratuitos ou baratos THEN isso SHALL ficar visivel no snippet, nao apenas no texto descritivo.

**Independent Test**: Revisar o snippet e comparar agente por agente com a matriz recomendada.

---

### P1: Registrar a politica de balanceamento entre janela OpenAI e custo Go ⭐ MVP ✅

**User Story**: Como time, eu quero um criterio operacional de balanceamento para que ajustes futuros nao destruam a economia obtida.

**Why P1**: A estrategia so se sustenta se houver regra de operacao e revisao continua.

**Acceptance Criteria**:

1. WHEN a feature terminar THEN ela SHALL descrever quais agentes podem consumir OpenAI por default e quais devem ficar fora da janela.
2. WHEN o consumo da janela OpenAI apertar THEN a politica SHALL indicar quais agentes mover primeiro para modelos mais baratos.
3. WHEN o time revisar stats periodicamente THEN a politica SHALL indicar um comando e um criterio de revisao minima.

**Independent Test**: Revisar a politica e confirmar que ela responde como reduzir consumo OpenAI sem reabrir a discussao inteira.

---

### P2: Consolidar as restricoes explicitas da escolha de modelos ✅

**User Story**: Como mantenedor, eu quero capturar restricoes explicitas ja decididas para que a estrategia futura nao recoloque modelos rejeitados.

**Why P2**: O time ja decidiu que `qwen3.7-plus` nao deve ser usado por custo e que `wizard` nao deve cair para um modelo fraco demais.

**Acceptance Criteria**:

1. WHEN a feature terminar THEN ela SHALL registrar modelos evitados e o motivo.
2. WHEN houver modelos gratuitos com ressalva de privacidade THEN isso SHALL aparecer como caveat operacional.
3. WHEN a janela OpenAI for tratada como recurso finito THEN a estrategia SHALL refletir esse limite explicitamente.

**Independent Test**: Revisar o documento e localizar a lista de restricoes e caveats aprovados.

---

## Reference Configuration Snippet

O snippet abaixo define a estrategia oficial de distribuicao de modelos. Copie para `.opencode/guild-opencode.jsonc` ou `~/.config/opencode/guild-opencode.jsonc` para aplicar.

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/anomalyco/arcanum/main/packages/guild/schema/guild-config.schema.json",

  "agents": {
    // Coordenacao principal — melhor retorno por chamada OpenAI
    "bard":    { "model": "openai/gpt-5.4-mini" },
    // Planejamento — mesmo nivel de bard para qualidade consistente
    "wizard":  { "model": "openai/gpt-5.4-mini" },
    // Execucao — fast variant preserva qualidade sem custo Go
    "fighter": { "model": "openai/gpt-5.4-mini-fast" },
    // Review — fast variant, primeiro candidato a corte na janela OpenAI
    "cleric":  { "model": "openai/gpt-5.4-mini-fast" },
    // Seguranca — fora da janela OpenAI, custo controlado
    "paladin": { "model": "opencode-go/minimax-m2.7" },
    // Especialista mecanico — barato, volume medio
    "ranger":  { "model": "opencode-go/minimax-m2.5" },
    // Exploracao — alto volume, custo zero
    "rogue":   { "model": "opencode/deepseek-v4-flash-free" },
    // Pesquisa externa — barato, nao drena OpenAI
    "warlock": { "model": "opencode-go/deepseek-v4-flash" }
  }
}
```

## Weekly Review Loop

Procedimento minimo de revisao para manter a estrategia saudavel:

1. Rodar `opencode stats --days 7 --models 20 --project ""`
2. Verificar se `opencode-go/*` models estao concentrando custo (>$0.50/semana)
3. Verificar se `openai/*` models estao consumindo mais de 60% das mensagens
4. Se janela OpenAI apertar: mover `cleric` -> `opencode-go/minimax-m2.7` primeiro, depois `fighter` -> `opencode-go/minimax-m2.5` se necessario
5. Se `bard` ou `wizard` precisarem sair de OpenAI, reavaliar estrategia — isso e limite

**Frequencia:** Semanal, junto com revisao de custo do projeto.

## Modelos e providers evitados

| Modelo | Motivo |
|--------|--------|
| `opencode-go/qwen3.7-plus` | Custo elevado sem ganho proporcional |
| `opencode-go/qwen3.6-plus` | Custo elevado (observado $1.04/semana) |
| `opencode-go/deepseek-v4-pro` | Custo alto para volume baixo ($0.77/semana) |

## Edge Cases

- WHEN um modelo gratuito do provider `opencode` desaparecer do catalogo THEN a estrategia SHALL continuar funcional sem depender dele em agentes criticos.
- WHEN a janela OpenAI apertar no meio da semana THEN a politica SHALL indicar quais agentes mover primeiro antes de mexer em `bard` e `wizard`.
- WHEN `opencode stats` mostrar custo baixo em Go mas uso muito alto de OpenAI THEN a estrategia SHALL tratar janela e custo como recursos diferentes.
- WHEN o time quiser testar um modelo novo THEN a estrategia SHALL exigir comparacao contra o papel atual do agente, nao substituicao arbitraria.
- WHEN um agente de review comecar a consumir OpenAI demais THEN a politica SHALL permitir mover review antes de planejamento.

---

## Requirement Traceability

| Requirement ID | Story | Planned Artifact | Status |
| --- | --- | --- | --- |
| GUILD-MODEL-01 | Distribuicao oficial por agente | `.specs/features/guild-agent-model-configuration/spec.md` | ✅ Done |
| GUILD-MODEL-02 | Snippet de configuracao de referencia | `guild-opencode.jsonc` snippet in spec | ✅ Done |
| GUILD-MODEL-03 | Politica de balanceamento OpenAI vs Go | `.specs/features/guild-agent-model-configuration/design.md` | ✅ Done |
| GUILD-MODEL-04 | Restricoes e modelos evitados | `.specs/features/guild-agent-model-configuration/spec.md` | ✅ Done |

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [x] Existe uma estrategia oficial de modelos por agente
- [x] Existe um snippet de configuracao de referencia para `guild-opencode.jsonc`
- [x] A estrategia preserva OpenAI para agentes de maior alavancagem sem esvaziar a janela inteira
- [x] A estrategia reduz dependencia de modelos caros do `opencode-go`
- [x] As restricoes ja aprovadas pelo time ficam registradas para manutencao futura
