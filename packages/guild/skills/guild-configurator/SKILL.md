---
name: guild-configurator
description: "Configure Guild/OpenCode: agents, custom_agents, categories, prompts, skills, validation and docs; use when the context is Guild/OpenCode and the request is to configurar um workflow, montar um agente, ajustar a configuração do Guild, arrumar a config do OpenCode, criar agente customizado, adicionar custom agent, nova categoria, corrigir config, update docs, fix invalid JSONC; do not use for app features, runtime logic, or non-config tasks outside Guild/OpenCode."
license: CC-BY-4.0
---

# guild-configurator

Escopo: orientar e validar configuração do Guild sem mexer em runtime.

## O que entra

- `agents` — overrides de agentes built-in
- `custom_agents` — criação e ajuste de agentes novos
- `categories` — roteamento por categoria e especialização de Ranger
- `prompt` / `prompt_file` / `prompt_append` — texto de prompt e variações
- `skills` — associação de skills existentes a agentes
- validação de `guild-opencode.jsonc` / `guild-opencode.json`
- documentação de configuração, exemplos e troubleshooting relacionados

## Dependências explícitas

- `guild-scope` — para classificar a solicitação como tarefa de configuração
- `guild-load` — para carregar contexto, estado e handoff antes de alterar config
- `guild-plan` — para quebrar ajustes maiores em passos verificáveis
- `guild-verify` — para confirmar schema, merge e resultado final
- `guild-spec` e `guild-handoff` — apenas quando a mudança exigir especificação ou passagem de contexto

## Fronteiras

Esta skill cobre a superfície de configuração do Guild e sua documentação associada.
Ela não decide implementação interna do app; apenas ajusta como o Guild é configurado,
validado e documentado.

## Arquitetura da skill

- **Padrão principal**: workflow sequencial orientado por intenção, com decisão
  contextual antes de editar qualquer arquivo.
- **Padrão secundário**: lookup curto em referências auxiliares para mapa de schema,
  exemplos e validação; o corpo principal não repete o catálogo completo.
- **Regra de leitura**: carregar referências só quando o tipo de solicitação exigir.

### Quando ler cada referência

- `references/config-map.md`: quando a tarefa mencionar chaves, campos, relação entre
  conceitos e o formato exato da configuração.
- `references/validation.md`: quando a tarefa envolver validação, erro de schema,
  JSONC inválido, inconsistência de tipos ou checagem final.
- `references/examples.md`: quando a tarefa pedir exemplos, reescrita de docs ou
  comparação com um fluxo real.

### Mapa de progressive disclosure

1. **Nível 1 — SKILL.md**: objetivo, fronteiras, gatilhos, fluxos primários e regras
   de decisão.
2. **Nível 2 — referências curtas**: `config-map.md` para mapeamento de configuração
   e `validation.md` para regras de validação.
3. **Nível 3 — exemplos**: `examples.md` para casos curtos de uso e troubleshooting.

O corpo principal deve bastar para orientar a ação; os detalhes finos ficam fora dele.

## O que não fazer

- não alterar runtime em `packages/guild/src/`
- não implementar features do app ou mudar comportamento interno do plugin
- não editar config do usuário em `~/.config/opencode/` sem pedido explícito
- não disparar para dúvidas genéricas sobre Guild/OpenCode sem relação com configuração, validação ou documentação
- não disparar para pedidos fora do domínio Guild/OpenCode, mesmo que mencionem agentes, prompts ou skills de forma genérica
- não substituir o papel de planning, load, verify ou handoff
- não virar uma skill genérica para “qualquer coisa do Guild”

## Fluxos primários

### 1) Adicionar um agente customizado

- **Gatilhos**: "criar agente customizado", "adicionar custom agent", "novo agente para Guild", "registrar agente novo", "montar um agente", "setup a custom agent", "create a new agent for Guild", "add an agent config".
- **Sequência**:
  1. Confirmar nome, papel e categoria alvo do agente.
  2. Definir `custom_agents` com o menor conjunto de campos necessário.
  3. Se houver especialização, vincular prompt/skills/categoria sem tocar em runtime.
  4. Validar o trecho de configuração e atualizar exemplos relacionados.
- **Resultado esperado**: o novo agente fica descrito em configuração, pronto para ser reconhecido pelo Guild, sem alterar código de execução.

### 2) Criar uma categoria

- **Gatilhos**: "criar category", "nova categoria", "separar por categoria", "rotear por categoria", "organizar por categoria", "set up a category", "create a category for Guild", "group agents by category".
- **Sequência**:
  1. Identificar o objetivo de agrupamento e os agentes afetados.
  2. Definir a categoria e seus vínculos com agentes/custom_agents.
  3. Ajustar referências de roteamento e documentação da categoria.
  4. Conferir consistência com o restante da taxonomia existente.
- **Resultado esperado**: a categoria passa a organizar e roteiar agentes de forma explícita na configuração, sem duplicar lógica de runtime.

### 3) Corrigir `guild-opencode.jsonc` inválido

- **Gatilhos**: "arquivo inválido", "schema quebrado", "jsonc inválido", "falha de validação", "corrigir config", "arrumar a config do OpenCode", "fix the config", "repair invalid JSONC", "lint/config validation failed".
- **Sequência**:
  1. Localizar o erro estrutural (chave faltando, tipo incorreto, vírgula/comentário problemático, referência inconsistente).
  2. Corrigir apenas o trecho inválido, preservando intenção original.
  3. Revalidar a sintaxe e a coerência entre agentes, categorias e prompts.
  4. Atualizar exemplo/documentação se o formato esperado mudou.
- **Resultado esperado**: `guild-opencode.jsonc` volta a validar e representa a configuração pretendida sem alterações desnecessárias.

### 4) Atualizar docs e exemplos de configuração

- **Gatilhos**: "atualizar docs", "ajustar exemplo", "sincronizar documentação", "documentar config", "exemplo de uso", "update the docs", "refresh examples", "document the config", "align docs with config".
- **Sequência**:
  1. Identificar qual trecho da documentação ou exemplo ficou desatualizado.
  2. Reescrever com foco em configuração real, não em implementação.
  3. Manter exemplos curtos, alinhados ao schema e aos fluxos desta skill.
  4. Garantir que o texto continue distinguindo esta skill de `guild-scope`, `guild-load`, `guild-plan` e `guild-verify`.
- **Resultado esperado**: docs e exemplos refletem o formato atual da configuração e ajudam a aplicar a skill sem ambiguidade.

## Arquivos-alvo e regras de edição

### Alvos primários

- `.opencode/guild-opencode.jsonc` (e o fallback `.opencode/guild-opencode.json`)
- `packages/guild/docs/configuration.md`
- `packages/guild/docs/custom-agents.md`
- `packages/guild/docs/categories.md`
- `packages/guild/docs/full-example.md`
- `packages/guild/docs/troubleshooting.md`

### Quando editar docs

- editar docs quando a mudança alterar a forma correta de configurar, explicar ou validar o Guild
- editar `full-example.md` quando a configuração exemplificar um fluxo novo ou mudar um campo usado no exemplo
- editar `troubleshooting.md` quando o sintoma, a causa ou o passo de validação mudar
- não editar docs por mudanças puramente locais no JSONC, a menos que o comportamento documentado tenha mudado

### Quando o schema entra no fluxo

- editar `packages/guild/schema/guild-config.schema.json` somente quando houver mudança estrutural de schema: campo novo, campo removido, rename, tipo, enum, restrição ou regra de validação
- não tocar no schema para ajuste de texto, exemplo, organização de docs ou correção pontual de config
- se o schema mudar, revisar junto a documentação afetada e os exemplos que mencionam o campo alterado

### Checklist curto antes de editar

1. Isto é mudança de config, de docs, ou de schema?
2. O alvo principal é `.opencode/guild-opencode.jsonc`?
3. Algum doc listado acima ficou desatualizado?
4. Há mudança estrutural que exige mexer no `guild-config.schema.json`?
5. A alteração preserva a fronteira: configuração sim, runtime não.
