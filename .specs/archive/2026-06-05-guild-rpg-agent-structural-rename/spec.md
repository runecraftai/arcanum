# Guild RPG Agent Structural Rename Specification

## Problem Statement

`@runecraft/guild` ja usa display names RPG para seus agentes, mas a estrutura interna ainda carrega os nomes herdados do Weave: diretorios como `loom/`, `tapestry/`, `pattern/`, `thread/`, `spindle/`, `shuttle/`, `weft/` e `warp/`, factories como `createLoomAgent`, e referencias de codigo/testes baseadas nesses nomes.

Isso cria uma identidade incompleta: a superficie visual fala Guild/RPG, enquanto a manutencao do codigo continua exigindo vocabulário antigo. Precisamos completar o rebrand estrutural sem quebrar desnecessariamente configuracoes existentes.

## Goals

- [ ] Renomear os diretorios internos de agentes em `packages/guild/src/agents/` para classes RPG
- [ ] Renomear factories, defaults, exports e imports para nomes RPG
- [ ] Manter compatibilidade para config keys antigas por enquanto, salvo decisao explicita em contrario
- [ ] Atualizar prompt builders, metadata, testes e docs para usar classes RPG como linguagem primaria
- [ ] Documentar aliases tecnicos restantes como compatibilidade deliberada
- [ ] Preservar o tool id `call_weave_agent` como excecao tecnica ate uma spec propria decidir sua troca

## Non-Goals

| Item | Reason |
| --- | --- |
| Renomear `call_weave_agent` | Tool id pode estar acoplado ao runtime OpenCode e precisa de analise propria |
| Migrar automaticamente configs de usuario | Esta spec nao deve modificar arquivos fora do pacote nem assumir estado de usuarios |
| Remover suporte imediato a `loom/tapestry/...` em config | Quebraria overrides, disabled agents, categories e testes existentes sem necessidade |
| Alterar `packages/spells` | Fora do escopo; a mudanca pertence ao pacote `guild` |

---

## User Stories

### P1: Estrutura interna com classes RPG

**User Story**: Como mantenedor do Guild, eu quero que diretorios e arquivos de agentes usem as classes RPG para que navegar o codigo reflita a identidade atual do produto.

**Acceptance Criteria**:

1. WHEN eu listar `packages/guild/src/agents/` THEN os agentes builtin SHALL aparecer como `bard/`, `fighter/`, `wizard/`, `rogue/`, `warlock/`, `ranger/`, `cleric/`, e `paladin/`.
2. WHEN eu buscar por imports de `./loom`, `./tapestry`, `./pattern`, `./thread`, `./spindle`, `./shuttle`, `./weft`, `./warp` THEN nao SHALL haver imports ativos para agentes builtin.
3. WHEN testes forem lidos THEN os arquivos de teste dos agentes SHALL seguir os novos nomes fisicos ou importar dos novos caminhos.

**Independent Test**: Rodar busca residual de imports/diretorios antigos em `packages/guild/src/agents`.

### P1: Simbolos TypeScript com nomes RPG

**User Story**: Como desenvolvedor do pacote, eu quero factories e defaults nomeados por classes RPG para que APIs internas nao propaguem o vocabulário antigo.

**Acceptance Criteria**:

1. WHEN o codigo importar factories builtin THEN ele SHALL usar `createBardAgent`, `createFighterAgent`, `createWizardAgent`, `createRogueAgent`, `createWarlockAgent`, `createRangerAgent`, `createClericAgent`, e `createPaladinAgent`.
2. WHEN defaults forem exportados THEN eles SHALL usar nomes como `BARD_DEFAULTS` e `FIGHTER_DEFAULTS`.
3. WHEN tipos principais forem exportados THEN o nome primario SHALL ser `GuildAgentName` ou equivalente, nao `WeaveAgentName`.
4. WHEN aliases forem mantidos THEN eles SHALL ter anotacao de compatibilidade/deprecacao.

**Independent Test**: Rodar `bun run typecheck` em `packages/guild`.

### P1: Compatibilidade de config keys antigas

**User Story**: Como usuario existente, eu quero que minhas configuracoes com `loom`, `tapestry`, `pattern`, `thread`, `spindle`, `shuttle`, `weft`, e `warp` continuem funcionando enquanto o codigo interno e renomeado.

**Acceptance Criteria**:

1. WHEN config usar `disabled_agents: ["weft"]` THEN o agente Cleric SHALL ser desabilitado.
2. WHEN config usar override em `agents.tapestry` THEN esse override SHALL aplicar ao Fighter.
3. WHEN logs ou prompts user-facing renderizarem o agente THEN eles SHOULD preferir classe RPG.
4. WHEN chaves antigas permanecerem no runtime THEN elas SHALL ser documentadas como compatibility keys.

**Independent Test**: Atualizar testes de disabled agents e overrides para provar compatibilidade key -> classe.

### P2: Caminho para futuras config keys RPG

**User Story**: Como mantenedor, eu quero uma camada de mapping clara para eventualmente suportar `bard/fighter/...` como keys sem misturar isso com o rename estrutural.

**Acceptance Criteria**:

1. WHEN o codigo resolver agentes THEN ele SHALL passar por um mapa centralizado de classe <-> compatibility key.
2. WHEN novos nomes RPG forem mencionados em docs THEN eles SHALL deixar claro se sao display/simbolo interno ou config key suportada.
3. WHEN uma futura spec quiser trocar config keys THEN ela SHALL poder reaproveitar o mapa criado aqui.

**Independent Test**: Testes unitarios do mapa de nomes, incluindo ida e volta.

### P1: Testes e verificacao verdes

**User Story**: Como mantenedor do pacote, eu quero garantir que o rename estrutural nao quebre runtime, prompt composition, skill loading ou roteamento.

**Acceptance Criteria**:

1. WHEN `bun test` rodar em `packages/guild` THEN os testes relevantes SHALL passar ou falhas env-only SHALL ser separadas.
2. WHEN `bun run typecheck` rodar em `packages/guild` THEN SHALL passar.
3. WHEN busca residual rodar THEN nomes antigos SHALL aparecer apenas como compatibility keys, fixtures historicas ou excecoes documentadas.

**Independent Test**: Rodar verificacao completa em `packages/guild`.

---

## Approved Class Mapping

| Compatibility Key | Class Name | Directory | Factory | Role |
| --- | --- | --- | --- | --- |
| `loom` | `Bard` | `bard/` | `createBardAgent` | interface primaria, roteamento e coordenacao |
| `tapestry` | `Fighter` | `fighter/` | `createFighterAgent` | execucao sequencial/paralela de planos |
| `pattern` | `Wizard` | `wizard/` | `createWizardAgent` | especificacao, design e tarefas |
| `thread` | `Rogue` | `rogue/` | `createRogueAgent` | exploracao interna de codebase |
| `spindle` | `Warlock` | `warlock/` | `createWarlockAgent` | pesquisa externa e referencias |
| `shuttle` | `Ranger` | `ranger/` | `createRangerAgent` | trabalho especializado por categoria |
| `weft` | `Cleric` | `cleric/` | `createClericAgent` | revisao de qualidade |
| `warp` | `Paladin` | `paladin/` | `createPaladinAgent` | auditoria de seguranca |

## Requirement Traceability

| Requirement ID | Requirement | Priority |
| --- | --- | --- |
| GUILD-STRUCT-01 | Rename agent directories to RPG class names | P1 |
| GUILD-STRUCT-02 | Rename factories/defaults/exports/imports to RPG class names | P1 |
| GUILD-STRUCT-03 | Preserve old config keys as compatibility keys | P1 |
| GUILD-STRUCT-04 | Add/centralize mapping between compatibility keys and class names | P2 |
| GUILD-STRUCT-05 | Update prompt/docs/test language to class-first wording | P1 |
| GUILD-STRUCT-06 | Document remaining technical exceptions | P1 |
| GUILD-STRUCT-07 | Verify tests, typecheck and residual searches | P1 |

## Success Criteria

- [ ] `packages/guild/src/agents/` uses RPG class directories for all builtins
- [ ] Internal factories/defaults use class names
- [ ] Existing config keys still work through explicit compatibility mapping
- [ ] Tests assert class-first behavior and compatibility-key behavior separately
- [ ] Residual old names are documented as compatibility keys or technical exceptions
- [ ] `packages/guild` typecheck and relevant tests pass
