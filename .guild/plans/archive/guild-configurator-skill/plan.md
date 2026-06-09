# Guild Configurator Skill

## TL;DR
> **Resumo**: Criar uma skill especializada para orientar e validar configurações do Guild — principalmente agentes, custom_agents, categories, prompts, skills e arquivos `.opencode/guild-opencode.jsonc`. A skill deve ser curta, orientada a exemplos e usar referências para não duplicar o que já existe em docs e schemas.
> **Esforço estimado**: Medium

## Context

### Original Request
Planejar uma nova skill especializada para configurar workflows, agentes e arquivos de configuração relacionados ao Guild, com foco em um design guiado por skill-architect antes da implementação.

### Key Findings
- O repositório já tem a configuração central em `.opencode/guild-opencode.jsonc` e suporte a `guild-opencode.json`.
- O schema em `packages/guild/schema/guild-config.schema.json` já cobre `agents`, `custom_agents`, `categories`, `skills`, `triggers`, `prompt_append`, `tools` e `modelOptions`.
- A documentação já separa as áreas que a skill deve dominar: `packages/guild/docs/configuration.md`, `custom-agents.md`, `categories.md`, `prompt-append.md`, `full-example.md` e `troubleshooting.md`.
- As skills atuais do Guild usam frontmatter curto + corpo enxuto + referências, o que combina com uma skill de configuração.
- Há risco de sobreposição com `guild-scope`, `guild-load`, `guild-plan` e `guild-verify`; esta nova skill deve complementar, não repetir, esses papéis.

## Objectives

### Core Objective
Definir uma skill que ajude a configurar Guild com segurança: escolher a superfície certa, aplicar mudanças mínimas, validar o JSONC/schema e manter a documentação coerente.

### Deliverables
- [ ] Escopo fechado da skill, com limites claros entre configuração, validação e docs.
- [ ] Lista de triggers PT/EN que cubra pedidos comuns sem disparar em tarefas genéricas de código.
- [ ] Estrutura de arquivos da skill planejada com progressive disclosure.
- [ ] Lista explícita de arquivos-alvo que a skill pode gerar/editar.
- [ ] Descrição de frontmatter pronta para uso.

### Definition of Done
- [ ] A skill proposta consegue ser distinguida de `guild-scope`, `guild-load`, `guild-plan` e `guild-verify`.
- [ ] O conjunto de triggers cobre os casos de uso principais sem ficar amplo demais.
- [ ] O plano deixa claro quais arquivos a skill pode tocar e quais estão fora de escopo.

### Guardrails (Must NOT)
- Não deve mexer em lógica de runtime em `packages/guild/src/`.
- Não deve editar config do usuário em `~/.config/opencode/` sem pedido explícito.
- Não deve virar skill genérica de “arrumar qualquer coisa do Guild”.
- Não deve duplicar o papel de planning, handoff ou verification já coberto por outras skills.

## TODOs

- [x] 1. Definir escopo e fronteiras da skill
  **What**: Delimitar que a skill cobre configuração do Guild (agentes, custom_agents, categories, prompts, skills, validação e docs) e não cobre implementação de features do app.
  **Files**: `packages/guild/skills/guild-configurator/SKILL.md`
  **Acceptance**: Escopo descreve claramente o que entra e o que fica fora, com dependências explícitas nas skills existentes do Guild.

- [x] 2. Mapear triggers e casos de uso principais
  **What**: Definir 2–4 fluxos primários, como adicionar um agente customizado, criar uma category, corrigir um `guild-opencode.jsonc` inválido e atualizar docs/examples.
  **Files**: `packages/guild/skills/guild-configurator/SKILL.md`, `packages/guild/skills/guild-configurator/references/examples.md`
  **Acceptance**: Cada caso de uso tem frase de gatilho, sequência de ações e resultado esperado.

- [x] 3. Escolher a arquitetura da skill e a estrutura de pastas
  **What**: Adotar workflow sequencial com seleção contextual por tipo de configuração, usando referências curtas para schema, exemplos e validação.
  **Files**: `packages/guild/skills/guild-configurator/SKILL.md`, `packages/guild/skills/guild-configurator/references/config-map.md`, `packages/guild/skills/guild-configurator/references/validation.md`
  **Acceptance**: A estrutura segue progressive disclosure e não exige carregar tudo no corpo principal.

- [x] 4. Definir os arquivos que a skill deve gerar ou editar
  **What**: Consolidar a lista de alvos primários (`.opencode/guild-opencode.jsonc`, docs de configuração, exemplos e troubleshooting) e os casos em que `guild-config.schema.json` só entra se houver mudança de schema.
  **Files**: `packages/guild/docs/configuration.md`, `packages/guild/docs/custom-agents.md`, `packages/guild/docs/categories.md`, `packages/guild/docs/full-example.md`, `packages/guild/docs/troubleshooting.md`, `packages/guild/schema/guild-config.schema.json`
  **Acceptance**: O plano distingue edição normal de config versus alteração estrutural de schema/documentação.

- [x] 5. Escrever a descrição de frontmatter e critérios de não-disparo
  **What**: Criar uma linha única de descrição com comandos reais e exclusões claras para evitar sobreposição com skills mais genéricas.
  **Files**: `packages/guild/skills/guild-configurator/SKILL.md`
  **Acceptance**: A descrição cabe em uma linha, inclui triggers reais e exclui claramente uso fora do domínio Guild.

## Verification
- [ ] Triggers cobrem PT/EN e incluem pelo menos um exemplo de agente, um de category e um de correção de config.
- [ ] A skill fica curta no corpo principal e empurra detalhes para `references/`.
- [ ] Os arquivos-alvo são coerentes com a arquitetura atual do Guild.
- [ ] A descrição final de frontmatter é específica o suficiente para não competir com outras skills.
- [ ] Nenhum arquivo de código de runtime foi incluído no escopo.
