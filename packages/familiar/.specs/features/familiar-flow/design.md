# Design: Familiar Flow — Gates & Auto-Chain

**Feature ID**: familiar-flow  
**Date**: 2026-05-04  
**Package**: `@runecraft/familiar`

---

## 1. Arquitetura

### O Que Já Existe (Não Modificar)

```
@runecraft/familiar/
├── agents/
│   ├── herald.md          # ✅ Orquestrador com delegate()
│   ├── scout.md           # ✅ Explorer
│   ├── sage.md            # ✅ Planner (TLC-Spec-Driven)
│   ├── forge.md           # ✅ Executor
│   ├── arbiter.md         # ✅ Quality
│   ├── ward.md            # ✅ Security
│   └── ...                # ✅ Outros agents
├── .pi/agents/
│   ├── agent-chain.yaml   # ✅ Chains existentes
│   └── teams.yaml         # ✅ Teams existentes
├── extensions/
│   ├── ...                # ✅ Extensions existentes
└── package.json           # ✅ Package manifest
```

### O Que Será Adicionado

```
@runecraft/familiar/
├── extensions/
│   └── flow-orchestrator.ts    # ⭐ NOVO: Scope + Gates + Auto-Chain
├── .pi/agents/
│   └── agent-chain.yaml        # 📝 MODIFICADO: Adicionar chains com gates
└── .specs/features/familiar-flow/
    ├── spec.md                 # ✅ Este documento
    ├── design.md               # ✅ Este documento
    └── tasks.md                # ✅ Tasks de implementação
```

### Fluxo de Dados

```
Usuário digita: /flow "Add OAuth2 support"
  ↓
extension: flow-orchestrator.ts
  ├─ detectScope("Add OAuth2 support") → "medium"
  ├─ scopeToChain("medium") → "plan-build-review"
  ├─ ctx.ui.notify("Medium scope detected. Running plan-build-review chain.")
  ↓
Chain executa (agent-chain.ts existente):
  Step 1: scout → explora codebase
  Step 2: sage → escreve spec em .specs/features/add-oauth2-support/
  ↓
PAUSA — Gate G1:
  extension: ctx.ui.confirm("Approve Plan?", summary)
  Usuário: YES
  ↓
Chain continua:
  Step 3: forge → implementa tasks
  ↓
PAUSA — Gate G6:
  extension: ctx.ui.confirm("Approve Commit?", diff)
  Usuário: YES
  ↓
  forge: git add -A && git commit -m "feat: add OAuth2 support"
  ↓
Done
```

---

## 2. Componentes

### 2.1 Extension: `flow-orchestrator.ts`

**Localização**: `extensions/flow-orchestrator.ts`

**Responsabilidades**:
1. Registrar command `/flow`
2. Detectar scope do input
3. Selecionar chain do `agent-chain.yaml`
4. Executar chain via mecanismo existente
5. Interceptar pausas entre steps para gates G1/G6

**Hooks Utilizados**:
- `session_start` — setup, carregar chains
- `before_agent_start` — inject spec-driven skill no Sage
- `tool_call` — detectar quando Sage/Forge terminam (trigger gates)

**API da Extension**:

```typescript
interface FlowState {
  status: 'idle' | 'running' | 'g1_pending' | 'g6_pending' | 'done';
  chain: string;
  scope: 'quick' | 'medium' | 'large';
  currentStep: number;
  specPath?: string;
  skipGates: boolean;
}

// Scope detection
function detectScope(input: string): 'quick' | 'medium' | 'large';

// Chain selection
function scopeToChain(scope: string): string;

// Gates
async function gateG1(specPath: string, ctx: ExtensionContext): Promise<boolean>;
async function gateG6(ctx: ExtensionContext): Promise<boolean>;
```

**Implementação Simplificada**:

A extension NÃO reimplementa o runner de chains. Ela usa o mecanismo existente do `agent-chain.ts` (que já está no familiar) e adiciona:

1. **Command `/flow`**:
```typescript
pi.registerCommand("flow", {
  description: "Start a gated workflow: /flow <task>",
  handler: async (args, ctx) => {
    const input = args?.trim();
    if (!input) {
      ctx.ui.notify("Usage: /flow <task>", "error");
      return;
    }
    
    // Detect scope
    const scope = detectScope(input);
    const chain = scopeToChain(scope);
    
    // Notify user
    ctx.ui.notify(`Flow: ${scope} scope → ${chain} chain`, "info");
    ctx.ui.setStatus("familiar-flow", `${chain} (${scope})`);
    
    // Execute chain with gate interception
    await runChainWithGates(chain, input, ctx);
  }
});
```

2. **Scope Detection**:
```typescript
function detectScope(input: string): 'quick' | 'medium' | 'large' {
  const lower = input.toLowerCase();
  
  // Large signals
  if (/\b(architecture|redesign|migrate|overhaul|platform|system|restructure)\b/.test(lower))
    return 'large';
  
  // Medium signals
  if (/\b(add|implement|create|feature|support|enable|refactor|build|integrate)\b/.test(lower))
    return 'medium';
  
  // Quick signals
  if (/\b(fix|bug|typo|rename|delete|remove|update|change|tweak|adjust|correct)\b/.test(lower))
    return 'quick';
  
  // Fallback: ask user
  return 'medium'; // Default conservative
}
```

3. **Chain Selection**:
```typescript
function scopeToChain(scope: string): string {
  const mapping = {
    quick: 'quick-fix',
    medium: 'plan-build-review',
    large: 'full-pipeline'
  };
  return mapping[scope] || 'plan-build-review';
}
```

4. **Gate G1 (Approve Plan)**:
```typescript
async function gateG1(specPath: string, ctx: ExtensionContext): Promise<boolean> {
  try {
    const spec = await ctx.tools.read(`${specPath}/spec.md`);
    const tasks = await ctx.tools.read(`${specPath}/tasks.md`);
    
    // Extract summary (first 20 lines)
    const summary = spec.split('\n').slice(0, 20).join('\n');
    const taskCount = tasks.split('- [ ]').length - 1;
    
    return await ctx.ui.confirm(
      '🔍 Gate G1: Approve Plan',
      `Spec: ${specPath}\n\n${summary}\n\nTasks: ${taskCount} pending\n\nApprove this plan?`,
      { timeout: 60000 }
    );
  } catch {
    // If spec not found, skip gate
    return true;
  }
}
```

5. **Gate G6 (Approve Commit)**:
```typescript
async function gateG6(ctx: ExtensionContext): Promise<boolean> {
  try {
    const diff = await ctx.tools.bash('git diff --stat');
    const message = await generateCommitMessage(ctx);
    
    return await ctx.ui.confirm(
      '🔒 Gate G6: Approve Commit',
      `Changes:\n${diff}\n\nCommit: "${message}"\n\nApprove and commit?`,
      { timeout: 60000 }
    );
  } catch {
    // No git repo or no changes
    return true;
  }
}
```

6. **Inject Spec-Driven no Sage**:
```typescript
pi.on('before_agent_start', async (event, ctx) => {
  // Detect if current agent is Sage
  if (event.agentName === 'sage' || event.agentName?.includes('sage')) {
    try {
      const specDrivenPath = path.join(
        os.homedir(),
        '.agents', 'skills', 'spec-driven', 'SKILL.md'
      );
      
      if (fs.existsSync(specDrivenPath)) {
        const skillContent = fs.readFileSync(specDrivenPath, 'utf-8');
        
        return {
          systemPrompt: `\n\n## Skill: spec-driven\n\n${skillContent}`
        };
      }
    } catch (err) {
      ctx.ui.notify('Warning: Could not load spec-driven skill', 'warning');
    }
  }
  
  return {};
});
```

### 2.2 Chains YAML Modificadas

**Arquivo**: `.pi/agents/agent-chain.yaml` (append ao existente)

As chains existentes (`plan-build-review`, `investigate-fix`, `quick-fix`, `full-audit`) continuam funcionando. Adicionamos 3 novas chains otimizadas para o flow com gates:

```yaml
# Quick: simple fixes, direto ao ponto
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

# Medium: feature implementation
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

# Large: full pipeline with all reviews
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

### 2.3 Agent Definitions (Não Modificar — Já Existem)

Os agents do familiar já estão prontos. A única modificação é via `before_agent_start` hook da extension, que injecta o spec-driven skill no Sage dinamicamente.

**Não precisamos criar novos agents.** Usamos os existentes:
- `herald` → continua como orquestrador principal
- `scout` → explorador
- `sage` → planejador (recebe spec-driven via hook)
- `forge` → executor
- `arbiter` → qualidade
- `ward` → segurança

---

## 3. Fluxos de Dados

### Fluxo Quick

```
Usuário: /flow "Fix typo in README"
  ↓
Scope: quick → Chain: flow-quick
  ↓
Step 1: sage
  - Escreve .specs/features/fix-typo-readme/{spec,tasks}.md
  ↓
PAUSA → Gate G1
  - Dialog: "Approve Plan? 2 tasks"
  - User: YES
  ↓
Step 2: forge
  - Lê tasks.md
  - Fixa typo
  ↓
PAUSA → Gate G6
  - Dialog: "Approve Commit? README.md +1/-1"
  - User: YES
  ↓
forge: git add README.md && git commit -m "fix: typo in README"
  ↓
Done ✅
```

### Fluxo Medium

```
Usuário: /flow "Add logging middleware"
  ↓
Scope: medium → Chain: flow-medium
  ↓
Step 1: scout
  - Explora codebase
  - Reporta estrutura
  ↓
Step 2: sage
  - Escreve .specs/features/add-logging-middleware/{spec,tasks}.md
  ↓
PAUSA → Gate G1
  - Dialog: "Approve Plan? 5 tasks, 3 files"
  - User: YES
  ↓
Step 3: forge
  - Implementa middleware
  ↓
PAUSA → Gate G6
  - Dialog: "Approve Commit? 3 files changed, +156/-12"
  - User: YES
  ↓
forge: git add -A && git commit -m "feat: add logging middleware"
  ↓
Step 4: arbiter (opcional, roda automaticamente)
  - Review rápido
  ↓
Done ✅
```

### Fluxo Large

```
Usuário: /flow "Migrate auth to OAuth2"
  ↓
Scope: large → Chain: flow-large
  ↓
Step 1: scout
  - Deep exploration
  ↓
Step 2: sage
  - Spec + design + tasks
  ↓
PAUSA → Gate G1
  - User: YES
  ↓
Step 3: forge
  - Implementa
  ↓
PAUSA → Gate G6
  - User: YES → commit
  ↓
Step 4: arbiter
  - Quality review
  ↓
Step 5: ward
  - Security review
  ↓
Done ✅
```

---

## 4. Estados da Extension

```typescript
interface FlowState {
  status: 'idle' | 'detecting' | 'running' | 'g1_pending' | 'g6_pending' | 'review_pending' | 'done' | 'error';
  chain: string;
  scope: 'quick' | 'medium' | 'large';
  currentStep: number;
  totalSteps: number;
  specPath?: string;
  skipGates: boolean;
  gateResults: {
    g1?: boolean;
    g6?: boolean;
  };
}
```

**State Machine**:
```
idle → detecting → running → g1_pending → running → g6_pending → done
                                      ↓ (rejected) ↓
                                      sage_rework   unstaged
```

---

## 5. UI/UX

### Gate G1 Dialog

```
┌──────────────────────────────────────────────────────┐
│ 🔍 Gate G1: Approve Plan                             │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Feature: Add logging middleware                      │
│ Scope: Medium                                        │
│                                                      │
│ Spec: .specs/features/add-logging-middleware/        │
│                                                      │
│ Tasks: 5 total                                       │
│  ○ 1. Create middleware file                         │
│  ○ 2. Add to API routes                              │
│  ○ 3. Add configuration                              │
│  ○ 4. Add tests                                      │
│  ○ 5. Update documentation                           │
│                                                      │
│ Files affected: src/middleware/, src/routes/         │
│                                                      │
│            [✅ Approve]  [❌ Reject]                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Gate G6 Dialog

```
┌──────────────────────────────────────────────────────┐
│ 🔒 Gate G6: Approve Commit                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Changes:                                             │
│  src/middleware/logging.ts   |  +89 lines            │
│  src/routes/api.ts           |  +12 lines            │
│  tests/logging.test.ts       |  +156 lines           │
│                              |  3 files changed      │
│                                                      │
│ Commit: "feat: add logging middleware"               │
│                                                      │
│         [✅ Commit]  [⏭️ Skip]                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Status Line

```
familiar-flow: flow-medium (step 2/4) — Gate G1 pending
```

---

## 6. Error Handling

| Situation | Action |
|-----------|--------|
| Scope ambiguous | `ctx.ui.select("Scope?", ["quick", "medium", "large"])` |
| Gate G1 rejected | Re-run sage step with feedback in prompt |
| Gate G6 rejected | Notify user, leave changes unstaged |
| No git repo | Skip G6, just report changes |
| Spec directory exists | Append `-2`, `-3`, etc. to slug |
| Chain step fails | Log error, continue to next step or abort |
| Spec-driven skill missing | Proceed without injection, notify user |

---

## 7. Integração com Ecosystem Existente

### Com Herald Existente
- Herald continua funcionando normalmente com `delegate()`
- `/flow` é um **modo alternativo**, não substitui Herald
- Usuário pode escolher: Herald manual ou `/flow` automatizado

### Com Chains Existentes
- Chains antigas (`plan-build-review`, etc.) continuam funcionando via `/chain`
- Novas chains (`flow-quick`, `flow-medium`, `flow-large`) são usadas apenas por `/flow`

### Com TillDone
- Se tilldone extension estiver ativa, tasks do spec-driven são independentes
- Não há conflito — tilldone traca tasks do agent, spec-driven traca tasks do projeto

### Com Damage-Control
- Ward já faz security review
- Damage-control extension já intercepta commands perigosos
- Sem conflito

---

## 8. References

- Spec-driven skill: `/home/rehem/.agents/skills/spec-driven/SKILL.md`
- Familiar agents: `~/Documents/dev/personal/arcanum/packages/familiar/agents/`
- Familiar chains: `~/Documents/dev/personal/arcanum/packages/familiar/.pi/agents/agent-chain.yaml`
- Pi extension docs: `~/.local/share/mise/installs/node/25.2.1/lib/node_modules/@mariozechner/pi-coding-agent/docs/extensions.md`
