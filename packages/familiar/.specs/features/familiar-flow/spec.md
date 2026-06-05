# Spec: Familiar Flow — Gates & Auto-Scope

**Feature ID**: familiar-flow  
**Scope**: Medium  
**Status**: draft  
**Date**: 2026-05-04  
**Author**: Rehem  
**Package**: `@runecraft/familiar`

---

## 1. Context

O package `@runecraft/familiar` já tem 6 agents funcionais. Esta spec define as **modificações** necessárias para adicionar:
1. **Auto-scope detection** no Herald
2. **Approval gates G1-G6** estruturados
3. **Spec-driven integration** no Sage (skill global)
4. **Protocolo de commit gate** no Forge

### Agents Existentes (Editados, Não Novos)
- `herald.md` → Adicionado scope detection + gates padronizados
- `sage.md` → Usa spec-driven skill global, escreve specs em disco
- `forge.md` → Não commit sozinho, espera Gate G6
- `scout.md` → Retorna `scope_recommendation` + findings estruturados
- `arbiter.md` → Review quality com axes + `ARBITER_STATUS`
- `ward.md` → Security checklist + `WARD_STATUS`

---

## 2. Goals

### Must Have

1. **Herald com Scope Detection**
   - Detecta scope (Quick/Medium/Large) do input do usuário
   - Emite gates padronizados (`GATE_G1`, `GATE_G6`) para a extension interceptar

2. **Gate G1 — Approve Plan**
   - Trigger: Sage completou e escreveu specs
   - Herald emite: `GATE_G1: Approve Plan\n<summary>\n(yes/no)`
   - Extension intercepta e mostra TUI dialog

3. **Gate G6 — Approve Commit**
   - Trigger: Forge completou + reviews (se houver)
   - Herald emite: `GATE_G6: Approve Commit\n<diff>\n(yes/no)`
   - Extension intercepta e mostra TUI dialog

4. **Spec-driven no Sage**
   - Sage carrega skill do diretório global (`~/.agents/skills/spec-driven/`)
   - Escreve em `.specs/features/<slug>/spec.md` + `tasks.md`
   - Usa metodologia LOAD → SPECIFY → DESIGN → TASKS

5. **Forge com Commit Protocol**
   - Lê tasks.md do disco
   - Implementa tasks sequencialmente
   - NÃO faz commit — gera diff summary e espera G6

### Should Have

6. **Gates G4/G5 opt-in** — Security (Ward) e Quality (Arbiter) como steps opcionais
7. **SESSION_LOG.md** — Audit trail

---

## 3. Requirements

### FR-001: Scope Detection (Herald)
Herald analisa input e classifica:
- Quick: fix, bug, typo, rename, delete, update, change
- Medium: add, implement, create, feature, support, refactor
- Large: architecture, redesign, migrate, overhaul, platform, system

### FR-002: Gates Padronizados
Herald emite gates em formato que a extension pode interceptar:
```
GATE_G1: Approve Plan
Feature: <name>
Scope: <scope>
Tasks: <count>
<task summary>
(yes/no)
```

### FR-003: Spec-Driven Integration (Sage)
- Sage usa spec-driven skill global
- Escreve specs direto em disco (não retorna embedded)
- Estrutura: `.specs/features/<slug>/{spec,design,tasks}.md`

### FR-004: Commit Protocol (Forge)
- Forge não commit sozinho
- Após implementação: `git add -A` + gera diff summary
- Emite `FORGE_STATUS: ALL_TASKS_COMPLETE` com diff + commit message
- Espera Gate G6 antes de `git commit`

### FR-005: Reviews Estruturados
- Arbiter: `ARBITER_STATUS: APPROVE|REJECT` com issues por categoria
- Ward: `WARD_STATUS: APPROVE|REJECT` com checklist de segurança

---

## 4. Success Criteria

1. ✅ Herald detecta scope automaticamente
2. ✅ Herald emite `GATE_G1` e `GATE_G6` em formato padronizado
3. ✅ Sage escreve specs em `.specs/features/<name>/`
4. ✅ Forge não commit sozinho
5. ✅ Scout retorna `scope_recommendation`
6. ✅ Arbiter/Ward retornam status estruturado
7. ✅ Extension pode interceptar gates e mostrar TUI dialogs

---

## 5. Constraints

1. EDITAR agents existentes, não criar novos
2. Não modificar core do pi
3. spec-driven skill global já existe
4. Implementação em 3-4 dias
