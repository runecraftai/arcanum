# Tasks: Familiar Flow — Gates & Auto-Chain

**Feature ID**: familiar-flow  
**Status**: pending  
**Scope**: Medium  
**Created**: 2026-05-04  
**Estimativa**: 3-4 dias  
**Package**: `@runecraft/familiar`

---

## Phase 1: Foundation (Dia 1)

### 1.1 Criar Extension `flow-orchestrator.ts`

**File**: `extensions/flow-orchestrator.ts`

**Contexto**: Extension principal que adiciona `/flow` command, scope detection, e gates G1/G6.

**Tasks**:

- [ ] **Setup e imports**
  - Criar arquivo `extensions/flow-orchestrator.ts`
  - Importar `ExtensionAPI`, `Type`, `Text`, `Container`, etc.
  - Importar `fs`, `path`, `os` para ler spec-driven skill

- [ ] **Scope Detection Function**
  ```typescript
  function detectScope(input: string): 'quick' | 'medium' | 'large' {
    const lower = input.toLowerCase();
    if (/\b(architecture|redesign|migrate|overhaul|platform|system|restructure)\b/.test(lower)) return 'large';
    if (/\b(add|implement|create|feature|support|enable|refactor|build|integrate)\b/.test(lower)) return 'medium';
    if (/\b(fix|bug|typo|rename|delete|remove|update|change|tweak|adjust|correct)\b/.test(lower)) return 'quick';
    return 'medium'; // Default conservative
  }
  ```

- [ ] **Chain Mapping**
  ```typescript
  function scopeToChain(scope: string): string {
    return { quick: 'flow-quick', medium: 'flow-medium', large: 'flow-large' }[scope] || 'flow-medium';
  }
  ```

- [ ] **Register `/flow` Command**
  - Parse args: `/flow [options] <task>`
  - Options: `--scope=quick|medium|large`, `--skip-gates`
  - Chamar `detectScope()` se scope não especificado
  - Chamar `scopeToChain()`
  - Executar chain usando mecanismo existente do `agent-chain.ts`

- [ ] **Gate G1 — Approve Plan**
  - Detectar quando Sage step completa (via `agent_end` ou `tool_result`)
  - Ler `.specs/features/<slug>/spec.md` e `tasks.md`
  - Chamar `ctx.ui.confirm("🔍 Gate G1: Approve Plan", summary)`
  - Se rejeitado: reinjectar Sage com feedback

- [ ] **Gate G6 — Approve Commit**
  - Detectar quando Forge step completa
  - Rodar `git diff --stat`
  - Chamar `ctx.ui.confirm("🔒 Gate G6: Approve Commit", diff)`
  - Se aprovado: executar `git add -A && git commit -m "..."`
  - Se rejeitado: notify user, deixar unstaged

- [ ] **Inject Spec-Driven no Sage**
  - Hook `before_agent_start`
  - Se agent é `sage`, ler `~/.agents/skills/spec-driven/SKILL.md`
  - Prepend ao system prompt
  - Fallback: se skill não encontrada, notify warning e continuar

- [ ] **Status Widget**
  - Mostrar status do flow no footer ou widget
  - `familiar-flow: flow-medium (step 2/4)`

**Acceptance Criteria**:
- Extension carrega sem erros
- `/flow` command aparece em help
- Scope detection funciona para test inputs
- Gates aparecem como TUI dialogs
- Spec-driven skill é injetado no Sage

---

### 1.2 Adicionar Chains `flow-*` ao agent-chain.yaml

**File**: `.pi/agents/agent-chain.yaml` (append)

**Tasks**:

- [ ] **Chain `flow-quick`**
  ```yaml
  flow-quick:
    description: "Flow: Quick fix with gates"
    steps:
      - agent: sage
        prompt: |
          Quick scope. Write minimal spec + tasks to .specs/features/<auto-slug>/
          Keep it under 3 tasks. Be brief.
          Task: $INPUT
      - agent: forge
        prompt: |
          Read .specs/features/<auto-slug>/tasks.md and implement.
          Do NOT commit. Report when done.
          Plan: $INPUT
  ```

- [ ] **Chain `flow-medium`**
  ```yaml
  flow-medium:
    description: "Flow: Feature build with gates"
    steps:
      - agent: scout
        prompt: |
          Explore codebase for: $INPUT
          Report: structure, patterns, files to modify.
      - agent: sage
        prompt: |
          Write spec + tasks to .specs/features/<auto-slug>/
          Use scout findings for context.
          Exploration: $INPUT
          Original: $ORIGINAL
      - agent: forge
        prompt: |
          Read .specs/features/<auto-slug>/tasks.md and implement.
          Do NOT commit. Report when done.
          Plan: $INPUT
      - agent: arbiter
        prompt: |
          Quick quality review of implementation.
          Implementation: $INPUT
          Original: $ORIGINAL
  ```

- [ ] **Chain `flow-large`**
  ```yaml
  flow-large:
    description: "Flow: Large feature with full reviews"
    steps:
      - agent: scout
        prompt: |
          Deep exploration for: $INPUT
          Report: architecture, dependencies, risks.
      - agent: sage
        prompt: |
          Write comprehensive spec + design + tasks to .specs/features/<auto-slug>/
          Include architecture decisions.
          Exploration: $INPUT
          Original: $ORIGINAL
      - agent: forge
        prompt: |
          Implement all tasks from .specs/features/<auto-slug>/tasks.md
          Do NOT commit. Report when done.
          Plan: $INPUT
      - agent: arbiter
        prompt: |
          Quality review of implementation.
          Implementation: $INPUT
          Original: $ORIGINAL
      - agent: ward
        prompt: |
          Security review of implementation.
          Implementation: $INPUT
          Original: $ORIGINAL
  ```

**Acceptance Criteria**:
- 3 novas chains aparecem em `/chain-list`
- Chains usam nomes de agents existentes no familiar
- Chains antigas continuam funcionando

---

## Phase 2: Integration & Polish (Dia 2-3)

### 2.1 Integrar com Spec-Driven Skill

**Tasks**:
- [ ] Testar se Sage recebe spec-driven skill via hook
- [ ] Verificar se specs são escritos em `.specs/features/<slug>/`
- [ ] Verificar estrutura: `spec.md` + `tasks.md` (+ `design.md` para large)
- [ ] Testar se Forge lê `tasks.md` corretamente

### 2.2 Testar Fluxo Quick

**Setup**:
```bash
cd /tmp/test-repo
git init
# Criar alguns arquivos simples
```

**Teste**:
- Input: `/flow "Fix typo in README"`
- Verificar:
  - [ ] Scope = quick detectado
  - [ ] Chain `flow-quick` selecionada
  - [ ] Sage escreve spec em `.specs/features/`
  - [ ] Gate G1 aparece como dialog
  - [ ] Forge implementa
  - [ ] Gate G6 aparece como dialog
  - [ ] Commit executado se aprovado

**Tempo Esperado**: < 2 minutos

### 2.3 Testar Fluxo Medium

**Teste**:
- Input: `/flow "Add a helper function"`
- Verificar:
  - [ ] Scope = medium detectado
  - [ ] Scout explora codebase
  - [ ] Sage escreve spec
  - [ ] Gate G1 funciona
  - [ ] Forge implementa
  - [ ] Gate G6 funciona
  - [ ] Arbiter review opcional

**Tempo Esperado**: < 10 minutos

### 2.4 Testar Rejeição de Gates

**Teste G1**:
- Sage escreve plano
- Rejeitar G1
- [ ] Sage recebe feedback no prompt
- [ ] Sage reescreve plano

**Teste G6**:
- Forge implementa
- Rejeitar G6
- [ ] Changes ficam unstaged
- [ ] Usuário pode review manualmente

### 2.5 Testar Sem Git

**Teste**:
- Ir para diretório sem git repo
- `/flow "Create hello.txt"`
- [ ] G6 mostra "No git repo detected" ou é pulado
- [ ] Changes reportados mas não commitados

---

## Phase 3: Documentation (Dia 4)

### 3.1 Atualizar README do Familiar

**File**: `README.md`

**Tasks**:
- [ ] Adicionar seção "Flow Mode"
- [ ] Documentar `/flow` command
- [ ] Documentar gates G1/G6
- [ ] Exemplos de uso:
  ```
  /flow "Fix typo"              # Quick, auto-detected
  /flow --scope=medium "Add..." # Medium, explicit
  /flow --skip-gates "Fix bug"  # Bypass gates
  ```

### 3.2 Documentar no Package

**File**: `docs/familiar-flow.md` (criar)

**Tasks**:
- [ ] Explicar arquitetura (scope → chain → gates)
- [ ] Explicar integração com spec-driven
- [ ] Troubleshooting (gates não aparecem, scope errado, etc.)

---

## Completion Criteria

- [ ] Extension `flow-orchestrator.ts` criada e funcional
- [ ] 3 chains `flow-*` adicionadas ao `agent-chain.yaml`
- [ ] `/flow` command funciona com auto-scope detection
- [ ] Gate G1 funciona como TUI dialog
- [ ] Gate G6 funciona como TUI dialog
- [ ] Spec-driven skill injetado no Sage
- [ ] Fluxo Quick testado (< 2 min)
- [ ] Fluxo Medium testado (< 10 min)
- [ ] Rejeição de gates testada
- [ ] Chains antigas continuam funcionando
- [ ] Herald existente continua funcionando
- [ ] README atualizado

---

## Notas de Implementação

### Dica 1: Reutilizar agent-chain.ts
Não reimplemente o runner de chains. O familiar já tem o mecanismo. A extension `flow-orchestrator.ts` é um **wrapper** que adiciona scope detection + gates em cima do que já existe.

### Dica 2: Não Modificar Agents Existentes
Os agents `herald.md`, `scout.md`, `sage.md`, `forge.md`, `arbiter.md`, `ward.md` já funcionam. A única modificação é o `before_agent_start` hook que injecta spec-driven no Sage — isso é feito pela extension, não editando o agent file.

### Dica 3: Fallback para Herald
Se `/flow` falhar, usuário pode sempre usar o Herald normal com `delegate()` ou usar `/chain` manualmente. Não quebre o que já existe.

### Dica 4: Git Optional
Se não houver git repo, G6 deve ser graceful — mostrar warning e continuar. Não crashar.

### Dica 5: Testar com Pi Local
Durante desenvolvimento, teste com:
```bash
pi -e extensions/flow-orchestrator.ts
```

Quando estiver pronto, o package familiar já incluirá a extension automaticamente.
