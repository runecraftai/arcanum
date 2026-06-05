# Guild RPG Agent Skills Specification

## Problem Statement

`@runecraft/guild` ainda carrega parte da identidade herdada do Weave e seus agentes ainda nao refletem a fantasia desejada de uma guilda RPG. Ao mesmo tempo, o fluxo de planejamento deve incorporar a disciplina do `spec-driven`, mas sem modificar `packages/spells` nem depender da skill monolitica `spec-driven` como fonte direta.

Precisamos criar mini-skills builtin no proprio pacote `guild`, ligar essas skills aos agentes existentes conforme seus papeis, renomear completamente a identidade de Weave para Guild, e fazer os agentes gerarem novos artefatos em `.specs/*` de acordo com o escopo do trabalho.

## Goals

- [ ] Criar mini-skills builtin locais em `packages/guild/skills/` com prefixo `guild-*`
- [ ] Manter `packages/spells` e a skill `spec-driven` intactos
- [ ] Renomear os agentes para classes RPG nos display names e prompts
- [ ] Associar mini-skills aos agentes builtin conforme o papel de cada classe
- [ ] Fazer novos artefatos gerados por agentes usarem `.specs/*`, com estrutura adaptada ao escopo
- [ ] Adicionar mini-skill de setup/bootstrap de projeto equivalente ao init do fluxo spec-driven
- [ ] Remover completamente mencoes a Weave em favor de Guild, incluindo branding interno

## Non-Goals

| Item | Reason |
| --- | --- |
| Modificar `packages/spells` | As mini-skills desta iniciativa pertencem ao `guild` |
| Alterar a skill `spec-driven` existente | Ela serve como referencia conceitual, nao como artefato editavel nesta feature |
| Migrar artefatos historicos existentes | O objetivo e mudar a geracao futura, nao reescrever historico |
| Criar uma meta-skill `guild-spec-driven` | O design aprovado usa skills focadas por papel |
| Renomear o tool id `call_weave_agent` sem analise separada | Pode ser acoplado ao runtime OpenCode e requer verificacao propria |

---

## User Stories

### P1: Builtin mini-skills do Guild

**User Story**: Como mantenedor do `guild`, eu quero que o pacote carregue mini-skills builtin locais para que seus agentes tenham instrucoes especializadas sem depender de `packages/spells`.

**Acceptance Criteria**:

1. WHEN o skill loader rodar THEN ele SHALL incluir skills em `packages/guild/skills/` como `scope: "builtin"`.
2. WHEN uma skill builtin tiver o mesmo nome de uma skill de projeto/usuario THEN a skill de projeto/usuario SHALL poder sobrescrever a builtin.
3. WHEN `disabled_skills` contiver uma skill builtin THEN ela SHALL ser filtrada como qualquer outra skill.
4. WHEN o pacote for publicado THEN as skills builtin SHALL estar incluidas nos arquivos publicados.

**Independent Test**: Adicionar testes de loader cobrindo builtin skills, precedencia e `disabled_skills`.

### P1: Catalogo `guild-*` focado por papel

**User Story**: Como autor do fluxo, eu quero mini-skills pequenas e focadas para que cada agente receba apenas o comportamento necessario ao seu papel.

**Acceptance Criteria**:

1. WHEN o catalogo for criado THEN ele SHALL conter `guild-init`, `guild-load`, `guild-scope`, `guild-spec`, `guild-plan`, `guild-execute`, `guild-verify`, `guild-review`, `guild-security`, `guild-research`, `guild-handoff`, `guild-ship`, e `guild-commit-learning`.
2. WHEN uma mini-skill for lida THEN ela SHALL ter frontmatter valido com `name` e `description`.
3. WHEN uma mini-skill for aplicada THEN seu conteudo SHALL ser enxuto e especifico ao papel declarado.

**Independent Test**: Rodar descoberta de skills e verificar que todas as skills `guild-*` sao carregadas.

### P1: Agentes como classes RPG

**User Story**: Como usuario do `guild`, eu quero ver agentes com nomes de classes RPG para que o produto tenha identidade propria e coerente com a ideia de guilda.

**Acceptance Criteria**:

1. WHEN os agentes builtin forem registrados THEN seus display names SHALL usar o roster aprovado.
2. WHEN prompts mencionarem agentes THEN eles SHALL usar linguagem de Guild, nao Weave.
3. WHEN agentes forem desabilitados THEN a remocao de referencias SHALL continuar funcionando com os novos display names.

**Independent Test**: Atualizar testes de display name, prompt composition e disabled-agent stripping.

### P1: Geracao futura de artefatos em `.specs/*`

**User Story**: Como mantenedor, eu quero que os agentes gerem novos artefatos em `.specs/*` seguindo o escopo do trabalho para alinhar o Guild ao fluxo spec-driven sem migrar historico.

**Acceptance Criteria**:

1. WHEN o escopo for projeto/init THEN o Guild SHALL orientar criacao em `.specs/project/*`.
2. WHEN o escopo for quick task THEN o Guild SHALL orientar criacao em `.specs/quick/<nnn-slug>/*`.
3. WHEN o escopo for feature THEN o Guild SHALL orientar criacao em `.specs/features/<feature>/spec.md`, `design.md` e/ou `tasks.md` conforme complexidade.
4. WHEN houver pause/resume THEN o Guild SHALL orientar `HANDOFF.md`, `STATE.md` e sessoes sob `.specs/*`.
5. WHEN existirem artefatos antigos em `.guild` ou `.weave` THEN esta feature SHALL NOT migrate them automatically.

**Independent Test**: Atualizar testes de prompts/workflow para confirmar que novos caminhos esperados usam `.specs/*`.

### P1: Rebrand completo Weave -> Guild

**User Story**: Como dono do pacote, eu quero remover mencoes a Weave para que a identidade tecnica e publica seja Guild de ponta a ponta.

**Acceptance Criteria**:

1. WHEN o source for pesquisado THEN mencoes a `Weave`/`weave` SHALL estar removidas ou documentadas como excecoes tecnicas deliberadas.
2. WHEN tipos internos forem exportados THEN nomes principais SHALL usar `Guild*`.
3. WHEN logs, docs, schema e prompts forem renderizados THEN eles SHALL falar Guild.
4. WHEN o pacote for testado THEN o rename SHALL manter build, typecheck e testes relevantes verdes.

**Independent Test**: Executar busca residual por `Weave|weave|.weave` e revisar excecoes.

---

## Approved Roster

| Config Key | Display Name | Role |
| --- | --- | --- |
| `loom` | `Bard (Guildmaster)` | interface primaria, roteamento e coordenacao |
| `tapestry` | `Fighter (Execution Lead)` | execucao sequencial/paralela de planos |
| `pattern` | `Wizard (Planner)` | especificacao, design e tarefas |
| `thread` | `Rogue (Scout)` | exploracao interna de codebase |
| `spindle` | `Warlock (Researcher)` | pesquisa externa e referencias |
| `shuttle` | `Ranger (Specialist)` | trabalho especializado por categoria |
| `weft` | `Cleric (Reviewer)` | revisao de qualidade |
| `warp` | `Paladin (Security)` | auditoria de seguranca |

## Skill Assignment

| Agent | Skills |
| --- | --- |
| Bard | `guild-init`, `guild-load`, `guild-scope`, `guild-spec`, `guild-plan`, `guild-handoff`, `guild-ship` |
| Wizard | `guild-load`, `guild-scope`, `guild-spec`, `guild-plan` |
| Fighter | `guild-load`, `guild-execute`, `guild-verify`, `guild-handoff` |
| Rogue | `guild-research` |
| Warlock | `guild-research` |
| Ranger | `guild-execute` |
| Cleric | `guild-review`, `guild-verify` |
| Paladin | `guild-security` |

## Requirement Traceability

| Requirement ID | Requirement | Phase |
| --- | --- | --- |
| GUILD-RPG-01 | Load package-local builtin skills from `packages/guild/skills/` | Phase 1 |
| GUILD-RPG-02 | Preserve override precedence for project/user/custom skills over builtin | Phase 1 |
| GUILD-RPG-03 | Create focused `guild-*` mini-skills | Phase 2 |
| GUILD-RPG-04 | Add project setup behavior via `guild-init` | Phase 2 |
| GUILD-RPG-05 | Rename builtin agent display names to RPG roster | Phase 3 |
| GUILD-RPG-06 | Bind mini-skills to builtin agents by role | Phase 3 |
| GUILD-RPG-07 | Update generated artifact guidance to `.specs/*` by scope | Phase 4 |
| GUILD-RPG-08 | Avoid historical artifact migration | Phase 4 |
| GUILD-RPG-09 | Remove Weave branding in favor of Guild across source/docs/tests | Phase 5 |
| GUILD-RPG-10 | Verify build, typecheck, tests and residual searches | Phase 6 |

## Success Criteria

- [ ] `packages/guild/skills/` exists and contains focused `guild-*` skills
- [ ] Guild agents load role-specific builtin skills by default
- [ ] Display names use the RPG roster
- [ ] Prompt guidance creates future artifacts under `.specs/*`
- [ ] `packages/spells` remains untouched
- [ ] No automatic historical spec migration is introduced
- [ ] Weave branding is removed or explicitly justified as a technical exception
