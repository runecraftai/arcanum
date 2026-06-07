# Design: guild-agent-model-configuration

## Overview

Esta feature transforma a analise ad hoc de modelos em uma politica oficial do Guild.

O problema nao e tecnico no sentido de runtime; ele e de **governanca de consumo**:

1. `openai` via OAuth nao aparece como custo monetario direto no `stats`, mas consome uma janela de uso/fair-use
2. `opencode-go` tem custo e limites claros, entao drenar modelos caros ali e uma regressao operacional
3. os modelos gratuitos do provider `opencode` reduzem custo, mas nao devem ocupar papeis criticos nem ignorar caveats de privacidade

O design precisa resultar em uma matriz simples de operar, sem depender de memoria oral do time.

## Current State

### Providers e modelos disponiveis

- `openai` autenticado via OAuth com modelos GPT 5.x disponiveis
- `opencode-go` autenticado com modelos open-weight/curated de varios niveis de custo
- `opencode` com modelos gratuitos disponiveis (deepseek-v4-flash-free, mimo-v2.5-free, minimax-m3-free, nemotron-3-ultra-free, big-pickle)

### Restricoes ja conhecidas

- `qwen3.7-plus` nao deve entrar na estrategia por custo
- `qwen3.6-plus` tambem tem custo elevado (projetado ~$1.04/semana no uso atual)
- `wizard` nao deve cair para um modelo fraco demais, porque planejamento ruim gera retrabalho
- modelos gratuitos devem ser usados com cuidado em tarefas que consomem muito contexto do repositorio
- `rogue` e o melhor candidato para volume alto em modelo gratuito

### Evidencia operacional (opencode stats --days 7 --models 20 --project "")

**Sessoes:** 41 | **Mensagens:** 2,234 | **Custo total:** $1.95

| Modelo | Msgs | Custo | Obs |
|--------|------|-------|-----|
| openai/gpt-5.4-mini-fast | 573 | $0.00 | Maior volume, sem custo direto |
| opencode/deepseek-v4-flash-free | 449 | $0.00 | Segundo maior volume, custo zero |
| openai/gpt-5.4 | 372 | $0.00 | Planejamento/coordenacao |
| opencode-go/qwen3.6-plus | 199 | **$1.04** | MAIOR custo real — 53% do total |
| opencode-go/deepseek-v4-flash | 166 | $0.14 | Custo controlado |
| opencode/minimax-m3-free | 97 | $0.00 | Gratuito, uso medio |
| openai/gpt-5.5 | 65 | $0.00 | Casos mais pesados |
| opencode-go/deepseek-v4-pro | 28 | **$0.77** | 39% do total com baixo volume |

**Conclusoes da evidencia:**
- OpenAI via OAuth nao aparece como custo monetario, mas consome janela de uso
- Go models caros (qwen3.6-plus, deepseek-v4-pro) = 92% do custo total mesmo com baixo volume de chamadas
- Preservar OpenAI para papeis de maior alavancagem e mover volume mecanico para Go barato ou free reduz custo sem perder qualidade
- Modelos gratuitos do provider `opencode` sao viaveis para exploracao (deepseek-v4-flash-free ja e o segundo mais usado)

## Target State

Ao final da feature, o Guild deve ter:

- uma matriz oficial de modelo principal por agente
- uma politica de uso por classe de agente
- um snippet de configuracao pronto para aplicar
- um procedimento de revisao baseado em `opencode stats`

## Design Decisions

### D1. Preservar OpenAI para agentes de maior alavancagem

**Decision**: reservar `openai` para coordenacao, planejamento e parte da execucao/review.

**Why**:

- `bard` e `wizard` concentram mais valor por chamada
- `fighter` e `cleric` podem usar OpenAI em variante mais leve/rapida se isso preservar qualidade sem drenar custo Go
- mover tudo para OpenAI aumentaria o risco de esgotar a janela rapidamente

### D2. Fixar exploracao em modelos free ou de custo minimo

**Decision**: `rogue` deve usar modelo gratuito/default barato por padrao.

**Why**:

- exploracao gera alto volume de chamadas
- o papel e read-only/context gathering
- o custo marginal de usar modelo mais forte aqui nao compensa

### D3. Manter especialistas mecanicos fora da janela OpenAI

**Decision**: `ranger` e `warlock` devem ficar em modelos baratos do `opencode-go` ou gratuitos, salvo excecao futura bem justificada.

**Why**:

- esses agentes sao candidatos naturais para tarefas repetitivas, pesquisa externa e trabalho segmentado
- queimar OpenAI nesse papel piora o balanceamento geral

### D4. Tratar review e seguranca como camada ajustavel

**Decision**: `cleric` e `paladin` nao devem competir automaticamente pelo mesmo budget de OpenAI de `bard` e `wizard`.

**Why**:

- review e seguranca precisam de qualidade razoavel, mas sao o primeiro ponto de corte quando a janela apertar
- isso mantem planejamento estavel por mais tempo

### D5. Registrar modelos explicitamente evitados

**Decision**: a estrategia precisa listar modelos rejeitados ou caveats fortes.

**Why**:

- evita reintroducao de `qwen3.7-plus`
- evita uso default de modelos gratuitos em papeis criticos sem revisao consciente

## Recommended Matrix

### Primary recommendation

| Agent | Recommended model | Rationale |
| --- | --- | --- |
| `bard` | `openai/gpt-5.4-mini` | Coordenacao principal com alto retorno por chamada |
| `wizard` | `openai/gpt-5.4-mini` | Planejamento e o melhor uso da janela OpenAI |
| `fighter` | `openai/gpt-5.4-mini-fast` | Execucao ainda forte, mas mais contida que `bard`/`wizard` |
| `cleric` | `openai/gpt-5.4-mini-fast` | Review de qualidade boa sem usar o tier mais caro |
| `paladin` | `opencode-go/minimax-m2.7` | Seguranca fora da janela OpenAI, com custo controlado |
| `ranger` | `opencode-go/minimax-m2.5` | Especialista barato para trabalho mecanico |
| `rogue` | `opencode/deepseek-v4-flash-free` | Exploracao de alto volume com custo zero |
| `warlock` | `opencode-go/deepseek-v4-flash` | Pesquisa externa barata sem drenar OpenAI |

### First pressure-release moves

Quando a janela OpenAI apertar, mover nesta ordem:

1. `cleric` -> `opencode-go/minimax-m2.7`
2. `fighter` -> `opencode-go/minimax-m2.5`
3. `paladin` permanece fora da janela OpenAI
4. `bard` e `wizard` sao os ultimos a sair de OpenAI

## Configuration Strategy

### Reference config shape

O artefato principal desta feature e um snippet de `guild-opencode.jsonc` com `agents.<name>.model` explicito para os oito built-ins.

Esse snippet nao resolve fallback automatico. Ele so define a distribuicao principal aprovada.

### Validation loop

Revisao operacional minima:

1. rodar `opencode stats --days 7 --models 20 --project ""`
2. revisar quais modelos OpenAI estao concentrando volume
3. revisar quais modelos Go estao concentrando custo
4. ajustar primeiro `cleric` e `fighter` antes de tocar `bard` e `wizard`

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| O time mover muitos agentes para OpenAI | Janela OpenAI esgota cedo | Reservar OpenAI para poucos agentes e registrar ordem de corte |
| Modelos gratuitos mudarem ou sumirem | Instabilidade em agentes de volume | Usar free apenas em `rogue` por default |
| Reintroducao de modelos caros rejeitados | Custo Go sobe novamente | Registrar restricoes explicitas no documento |
| Review consumir OpenAI demais | Menos capacidade para planejamento | Tornar `cleric` o primeiro candidato a migrar |

## Exit Criteria

O design estara completo quando:

1. existir uma matriz oficial agente -> modelo
2. existir um snippet de configuracao de referencia
3. a ordem de alivio da janela OpenAI estiver explicita
4. os modelos rejeitados/caveats estiverem registrados
