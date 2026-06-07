# Tasks: guild-plugin-installability

**Design**: `.specs/features/guild-plugin-installability/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Reproduction and Loader Contract (Sequential)

```text
T01 -> T02 -> T03
```

### Phase 2: Packed Artifact Validation (Sequential)

```text
T03 -> T04 -> T05 -> T06
```

### Phase 3: Compatibility Fix (Sequential)

```text
T06 -> T07 -> T08
```

### Phase 4: OpenCode Smoke Coverage (Sequential)

```text
T08 -> T09 -> T10
```

### Phase 5: Release Hardening and Documentation (Sequential)

```text
T10 -> T11 -> T12 -> T13
```

---

## Task Breakdown

### T01: Capture the exact failing OpenCode load path

**What**: Consolidar a reproducao minima do erro atual de carga do Guild no OpenCode e registrar o ponto exato de falha.
**Where**: logs locais, notes de verificacao, possiveis fixtures temporarias de teste
**Depends on**: None
**Reuses**: Evidencia atual em `~/.local/share/opencode/log/*`
**Requirement**: GUILD-INSTALL-01, GUILD-INSTALL-04

**Done when**:

- [ ] Existe uma reproducao minima do erro sem depender de suposicoes
- [ ] O erro `Plugin export is not a function` foi associado a um caminho claro de carga
- [ ] O ruido de outros plugins foi separado do diagnostico do Guild

### T02: Compare Guild with Weave at the package boundary

**What**: Comparar `@runecraft/guild` e `@opencode_weave/weave` no nivel de metadata publicada, entrypoint e fluxo de instalacao.
**Where**: `packages/guild/package.json`, documentacao do Weave, artefatos publicados
**Depends on**: T01
**Reuses**: Weave como baseline tecnica
**Requirement**: GUILD-INSTALL-04

**Done when**:

- [ ] Similaridades e diferencas relevantes no boundary do pacote foram listadas
- [ ] Ficou explicito o que o Guild herda corretamente do Weave
- [ ] Ficou explicito o que ainda precisa ser provado no runtime do OpenCode

### T03: Document the expected plugin export contract

**What**: Registrar, com base em reproducao e comparacao, qual shape de export o loader do OpenCode precisa receber.
**Where**: comentarios de teste, script de verify, docs internas da feature
**Depends on**: T02
**Reuses**: Resultado das fases de analise
**Requirement**: GUILD-INSTALL-04

**Done when**:

- [ ] O contrato de export/carga foi descrito de forma testavel
- [ ] A descricao distingue import local do source versus pacote instalado
- [ ] Existe criterio objetivo para dizer se o pacote atende o contrato

### T04: Add tarball generation to Guild verification flow

**What**: Estender a verificacao do Guild para gerar o artefato empacotado equivalente ao publish real.
**Where**: `packages/guild/script/verify.ts` e scripts auxiliares necessarios
**Depends on**: T03
**Reuses**: Script atual de verify do Guild
**Requirement**: GUILD-INSTALL-03

**Done when**:

- [ ] A verificacao gera um tarball do pacote
- [ ] O tarball pode ser usado por etapas seguintes de install/smoke
- [ ] Falhas de empacotamento aparecem explicitamente no verify

### T05: Install the packed Guild artifact in a clean temp environment

**What**: Instalar o tarball do Guild em uma diretoria temporaria limpa para validar a experiencia do consumidor final.
**Where**: script de verify e workspace temporario de teste
**Depends on**: T04
**Reuses**: Artefato empacotado da etapa anterior
**Requirement**: GUILD-INSTALL-03, GUILD-INSTALL-07

**Done when**:

- [ ] O pacote e instalado sem depender do monorepo ativo
- [ ] O ambiente nao reutiliza configuracoes ruidosas do desenvolvedor
- [ ] A verificacao inspeciona o pacote instalado, nao so arquivos do repo

### T06: Validate runtime export shape from the installed artifact

**What**: Provar que o pacote instalado expoe o shape de export compativel com o contrato do OpenCode.
**Where**: verify script, testes de compatibilidade do pacote
**Depends on**: T05
**Reuses**: Contrato documentado em T03
**Requirement**: GUILD-INSTALL-03, GUILD-INSTALL-04

**Done when**:

- [ ] O teste falha no estado quebrado e passa no estado corrigido
- [ ] O resultado mostra claramente se o pacote instalado exporta uma funcao carregavel
- [ ] A verificacao nao depende apenas de `import` do `dist/` local

### T07: Apply the minimal compatibility fix to Guild entrypoint/package metadata

**What**: Ajustar entrypoint, wrapper ou metadata de export apenas no necessario para cumprir o contrato do OpenCode.
**Where**: `packages/guild/src/index.ts`, `packages/guild/package.json`, possiveis wrappers de build
**Depends on**: T06
**Reuses**: Estrutura atual herdada do Weave
**Requirement**: GUILD-INSTALL-01, GUILD-INSTALL-04

**Done when**:

- [ ] O diff de compatibilidade e o menor possivel
- [ ] O pacote continua coerente com a instalacao declarativa documentada
- [ ] O artefato empacotado passa nas verificacoes de export

### T08: Rebuild and revalidate the packed artifact after the fix

**What**: Reexecutar build, empacotamento e checks do artefato corrigido.
**Where**: `packages/guild` verify/build flow
**Depends on**: T07
**Reuses**: Pipeline de verificacao ampliada
**Requirement**: GUILD-INSTALL-01, GUILD-INSTALL-03

**Done when**:

- [ ] O build continua gerando `dist/` valido
- [ ] O pacote empacotado instalado em ambiente limpo continua compativel
- [ ] Nao houve regressao obvia nas exportacoes publicas do pacote

### T09: Create a clean OpenCode fixture for Guild-only smoke testing

**What**: Criar fixture minima de configuracao do OpenCode que carregue apenas `@runecraft/guild`.
**Where**: fixture de teste local ao pacote ou script temporario controlado
**Depends on**: T08
**Reuses**: Contrato de instalacao publico do README
**Requirement**: GUILD-INSTALL-05, GUILD-INSTALL-07

**Done when**:

- [ ] A fixture nao inclui `list`, `graphify.js` ou plugins estranhos ao Guild
- [ ] A fixture representa o caso nominal documentado ao usuario
- [ ] A fixture pode ser usada repetidamente por smoke tests

### T10: Run an OpenCode smoke test against the clean Guild fixture

**What**: Executar um smoke test com o OpenCode real, ou um harness fiel, para provar que o Guild carrega e registra seus agentes.
**Where**: teste e2e/smoke em `packages/guild`
**Depends on**: T09
**Reuses**: `opencode debug config` / `opencode debug agent` ou fluxo equivalente
**Requirement**: GUILD-INSTALL-01, GUILD-INSTALL-02, GUILD-INSTALL-05

**Done when**:

- [ ] O smoke test falha se o plugin nao carregar
- [ ] O smoke test passa quando o Guild registra sua configuracao/agentes
- [ ] O erro `Plugin export is not a function` deixa de ocorrer no caminho testado

### T11: Integrate installability checks into Guild prepublish flow

**What**: Garantir que o proprio pacote execute suas verificacoes de instalabilidade antes do publish.
**Where**: `packages/guild/package.json` e scripts relacionados
**Depends on**: T10
**Reuses**: `verify` do pacote
**Requirement**: GUILD-INSTALL-06

**Done when**:

- [ ] Existe gate local/prepublish para a verificacao ampliada
- [ ] Publicar o pacote sem passar por esse gate deixa de ser o caminho padrao
- [ ] A intencao do gate fica clara no manifest/scripts

### T12: Wire release pipeline to the effective installability gate

**What**: Conectar o fluxo real de release do monorepo ao gate de instalabilidade do Guild.
**Where**: `.changeset/publish.mjs`, workflow de release, ou outro ponto efetivo do publish
**Depends on**: T11
**Reuses**: Fluxo atual de publish com `bun publish`
**Requirement**: GUILD-INSTALL-06

**Done when**:

- [ ] O caminho efetivo usado para publicar o Guild depende do gate de verify
- [ ] Uma regressao de installability interrompe o release antes do npm
- [ ] O fluxo de release continua coerente com o monorepo `arcanum`

### T13: Update package docs and verification notes

**What**: Atualizar docs necessarias para refletir o contrato de instalacao/carga validado.
**Where**: `packages/guild/README.md`, notas de verify, talvez `STATE.md`
**Depends on**: T12
**Reuses**: Fluxo de instalacao ja documentado no Guild
**Requirement**: GUILD-INSTALL-01, GUILD-INSTALL-04, GUILD-INSTALL-06

**Done when**:

- [ ] O README continua descrevendo corretamente o fluxo de instalacao via OpenCode
- [ ] Existe nota clara sobre a verificacao de artefato/publicacao
- [ ] A feature fica rastreavel para manutencao futura
