# Pi Build Plan
> Migração e expansão do workflow opencode → pi
> Marcar com [x] ao concluir cada item

---

## Status geral
- [ ] Fase 1 completa (party + extensão)
- [ ] Fase 2 completa (graphify aprimorado)

---

## FASE 1 — Replicar opencode

### 1a. Party files (`~/.pi/agents/`)

Formato pi: frontmatter com `name`, `description`, `model`, `tools` (whitelist csv)
Sem prefixo de provider no model (`claude-haiku-4-5`, não `anthropic/claude-haiku-4-5`)
Task() do opencode → delegate() tool da extensão

- [x] `~/.pi/agents/herald.md`
  - model: claude-sonnet-4-6
  - Orquestrador, nunca lê arquivos, só delega
  - Substituir todas chamadas Task() por delegate()
  - Manter: gates, routing table, protocolos, SAGE_STATUS, SCOUT_FINDINGS
  - Manter: graphify pós-execução via delegate(forge, archive+graph)
  - Manter: confirmação antes de executar graphify

- [x] `~/.pi/agents/sage.md`
  - model: claude-opus-4-6
  - tools: read
  - Planner TLC, retorna SAGE_STATUS block
  - NUNCA cria arquivos, retorna conteúdo embedded
  - NUNCA usa grep/bash — se precisar de contexto → NEEDS_SCOUT

- [x] `~/.pi/agents/scout.md`
  - model: claude-haiku-4-5
  - tools: read,bash (sem write,edit)
  - Explorador — graph-first no prompt (reforço)
  - Retorna SCOUT_FINDINGS estruturado
  - NOTA: graphify será injetado pela extensão (Fase 2)

- [x] `~/.pi/agents/forge.md`
  - model: claude-haiku-4-5
  - tools: read,write,edit,bash
  - Único que escreve código
  - Manter: execução por task, SUMMARY.md, FORGE_STATUS signals
  - Manter: archive + graphify update mode
  - Manter: knowledge write mode
  - Manter: vault/projects-wiki paths

- [x] `~/.pi/agents/arbiter.md`
  - model: claude-haiku-4-5
  - tools: read,bash (sem write,edit)
  - Reviewer — APPROVE/REJECT
  - Read-only

- [x] `~/.pi/agents/ward.md`
  - model: claude-haiku-4-5
  - tools: read,bash (sem write,edit)
  - Security auditor — APPROVE/REJECT
  - Read-only

- [x] `~/.pi/agents/subagents/explore.md`
  - model: claude-haiku-4-5
  - tools: read,bash (sem write,edit)
  - Busca rápida, graph-check primeiro

- [x] `~/.pi/agents/subagents/review.md`
  - model: claude-haiku-4-5
  - tools: read (sem write,edit,bash)
  - Review inline, APPROVE/NEEDS_CHANGES/BLOCKING

- [x] `~/.pi/agents/subagents/verify.md`
  - model: claude-haiku-4-5
  - tools: read,bash (sem write,edit)
  - Validação pós-task — PASS/FAIL com evidência

### 1b. Extensão `tmux-delegate` (`~/.pi/agent/extensions/tmux-delegate/`)

- [x] Setup do projeto (sem package.json — jiti resolve via pi)

- [x] `agents.ts` — Agent discovery
  - Lê `~/.pi/agents/*.md` e `.pi/agents/*.md` (project-local)
  - Parseia frontmatter: name, model, tools, system prompt
  - Mesmo padrão do exemplo oficial

- [x] `handoff.ts` — Handoff builder + digest reader
  - Formato HANDOFF fixo (from, to, id, context, task, output instructions)
  - Formato DIGEST fixo (agent, status, summary 2 frases, findings bullets, files path:line, next)
  - Escreve em /tmp/pi-handoff-<id>.md
  - Lê /tmp/pi-result-<id>.md com polling (timeout configurável)

- [x] `tmux.ts` — Layout adaptativo
  - Detecta se está dentro de sessão tmux
  - Lógica de layout:
    - 1 pane ativo: split vertical 30% (direita)
    - 2 panes ativos: split horizontal do pane vertical (baixo)
    - 3+ panes: nova coluna vertical 30% ao lado dos 2 anteriores
  - Pane fecha automaticamente ao terminar
  - Spawna: `pi --no-session --model <m> --append-system-prompt <tmp> --tools <t> -p "$(cat handoff)" > result 2>&1`

- [x] `index.ts` — Entry point da extensão
  - Registra tool `delegate` com schema:
    ```
    agent: string
    task: string
    mode: "await" | "fire"  (default: await)
    context?: string        (contexto mínimo adicional)
    parallel?: boolean      (indica ao Herald que pode paralel.)
    ```
  - Modo single: 1 agente, 1 pane
  - Modo parallel: array de delegates, spawna panes simultâneos
  - Retorna digest ao Herald (await) ou imediatamente (fire)
  - Advisa sobre paralelismo mas não decide (Herald decide, usuário confirma)

### 1c. Script de entrada

- [x] `~/bin/herald`
  - Shell script executável
  - Lê frontmatter de `~/.pi/agents/herald.md`
  - Extrai body (system prompt) para tmp file
  - Executa: `pi --model claude-sonnet-4-6 --append-system-prompt <tmp> --no-session "$@"`
  - Limpa tmp ao sair

---

## FASE 2 — Melhorar o que estava falho

### 2a. Graphify auto-injection na extensão

**Problema:** Scout tem "graph-first" no prompt mas ignora e usa grep/find.
**Solução:** Extensão intercepta ANTES de spawnar e injeta o resultado do graphify no handoff.

- [ ] Detectar se projeto tem graph (`graphify-out/graph.json` ou vault graph)
- [ ] Para agentes scout/explore: rodar `graphify query "<task>"` antes de spawnar
- [ ] Injetar output no handoff como seção `## Graph Context (auto-injected)`
- [ ] Agente recebe contexto pronto — sem precisar "lembrar" de buscar
- [ ] Fallback: se graphify não encontrar nada, prossegue sem injeção

### 2b. Auto-update do graphify pós-forge

- [ ] Detectar quando Forge emite `FORGE_STATUS: ALL_TASKS_COMPLETE`
- [ ] Perguntar ao usuário: "Atualizar graphs? (projeto + vault)"
- [ ] Se sim: rodar `graphify --update .` e vault update automaticamente
- [ ] Escrever session log em `~/Documents/dev/projets-wiki/<project>/logs/`

### 2c. Knowledge persistence melhorada

- [ ] Após Scout completar: salvar SCOUT_FINDINGS em `projects-wiki/<project>/knowledge/`
- [ ] Injetar conhecimento acumulado do projeto no handoff (resumo comprimido)
- [ ] Não só graphify — também logs anteriores relevantes

---

## FASE 3 — Commands pi (futuro)

- [ ] `/commit` — atomic commit formatado
- [ ] `/clean` — cleanup de specs/arquivos temporários
- [ ] `/context` — injetar contexto de arquivo no prompt
- [ ] `/workflow` — iniciar workflow TLC completo
- [ ] `/worktrees` — gerenciar git worktrees
- [ ] `/test` — rodar suite de testes
- [ ] `/optimize` — otimizar código selecionado
- [ ] `/prompt-enhancer` — melhorar prompt antes de enviar

---

## Notas de decisão

| Decisão | Escolha | Motivo |
|---|---|---|
| Orquestrador | Herald (sonnet-4-6) | Mesmo do opencode |
| Digest format | Markdown fixo leve | ~100-200 tokens, estruturado |
| Handoff format | Markdown fixo | from/to/id/context/task/output |
| Layout tmux | Adaptativo (vertical→baixo→coluna) | Visibilidade sem poluir |
| Paralelismo | Herald advisa, usuário decide | Controle explícito |
| Graphify | Auto-injection na extensão (Fase 2) | Não depende do agente lembrar |
| opencode-mem | Não replicar (key OpenAI quebrada de qualquer forma) | Vault + graphify cobrem |
| Commands | Fase 3 | Party primeiro |

---

## Sessão atual
> Atualizar a cada sessão de trabalho

- [x] Contexto recuperado da sessão anterior (quebrou por bug de API)
- [x] Análise do agent-skills repo (addyosmani)
- [x] Decisão: construir do zero no pi
- [x] Party inventariada do opencode
- [x] Plano consolidado com respostas do usuário
- [x] Comparação pi vs opencode — decisão mantida com consciência dos tradeoffs
- [x] Criar party files
- [x] Criar script herald
- [x] Criar extensão tmux-delegate
- [ ] Testar fluxo completo (herald → delegate → agente → digest)
