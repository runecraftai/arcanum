# Guild Plugin Installability Specification

## Problem Statement

`@runecraft/guild` publica no npm, e a documentacao orienta o usuario a adicionar `"@runecraft/guild"` no array `plugin` do `opencode.json`, mas o OpenCode falha ao carregar o pacote com `Plugin export is not a function` durante o startup.

O problema nao esta na sintaxe do `opencode.json` nem na existencia do pacote no npm. O log mostra que o OpenCode encontra o pacote e tenta carrega-lo, mas rejeita o artefato publicado no momento de inicializar o plugin. Isso indica uma lacuna entre o pacote que passa localmente no monorepo e o pacote efetivamente consumido pelo loader de plugins npm do OpenCode.

Ao mesmo tempo, `opencode-weave` usa o mesmo modelo de instalacao declarativa via `plugin` e funciona como a referencia tecnica mais proxima, ja que `packages/guild` foi replatformado a partir dele. Precisamos fechar essa lacuna de compatibilidade no artefato publicado, nao apenas no source local.

## Goals

- [ ] Fazer `@runecraft/guild` instalar e carregar corretamente quando referenciado em `plugin` no `opencode.json`
- [ ] Garantir que o artefato empacotado/publicado seja validado, nao apenas `dist/index.js` no workspace
- [ ] Tornar explicito e testavel o contrato de runtime esperado pelo loader de plugins do OpenCode
- [ ] Bloquear publicacoes futuras de artefatos que nao possam ser carregados pelo OpenCode
- [ ] Preservar a ergonomia atual de instalacao documentada: adicionar o nome do pacote e reiniciar o OpenCode

## Out of Scope

Fora do escopo desta feature.

| Item | Reason |
| --- | --- |
| Redesenhar a arquitetura interna dos agentes do Guild | O problema atual esta na fronteira de empacotamento e carregamento |
| Renomear novamente a identidade Guild ou retornar a Weave | A identidade publica ja foi decidida |
| Corrigir plugins nao relacionados como `list` ou `graphify.js` como parte do pacote Guild | Esses erros devem ser isolados para testes, mas nao pertencem ao runtime do pacote publicado |
| Expandir o conjunto funcional do plugin | O foco e instalabilidade e compatibilidade de carga |
| Suportar mecanismos de instalacao alternativos fora do fluxo npm do OpenCode | O caso critico e o loader nativo do OpenCode |

---

## User Stories

### P1: Carregar Guild como plugin npm do OpenCode ⭐ MVP

**User Story**: Como usuario do OpenCode, eu quero adicionar `@runecraft/guild` ao `opencode.json` e reiniciar a ferramenta para que o plugin seja carregado sem erro e os agentes do Guild fiquem disponiveis.

**Why P1**: Esse e o contrato principal prometido pelo pacote. Se falha, o pacote publicado nao cumpre sua funcao basica.

**Acceptance Criteria**:

1. WHEN `@runecraft/guild` estiver presente em `plugin` THEN o OpenCode SHALL carregar o pacote sem emitir `Plugin export is not a function`.
2. WHEN o plugin carregar com sucesso THEN o OpenCode SHALL expor configuracao e agentes do Guild via comandos de debug equivalentes.
3. WHEN o usuario seguir o README publico THEN nenhum passo extra de `npm install` manual SHALL ser necessario.

**Independent Test**: Em um projeto temporario limpo, escrever `opencode.json` minimo com `"plugin": ["@runecraft/guild"]`, reiniciar ou invocar comandos de debug do OpenCode, e confirmar que o plugin carrega e registra seus agentes.

---

### P1: Validar o artefato empacotado, nao so o source local ⭐ MVP

**User Story**: Como mantenedor do pacote, eu quero verificar o tarball empacotado e sua instalacao em ambiente limpo para que falhas de publish ou interop de modulo sejam detectadas antes do npm.

**Why P1**: O erro atual aparece na carga do pacote publicado, nao na execucao local do source dentro do monorepo.

**Acceptance Criteria**:

1. WHEN a verificacao do pacote rodar THEN ela SHALL empacotar o pacote em formato equivalente ao publish real.
2. WHEN o tarball for instalado em ambiente limpo THEN o entrypoint carregavel SHALL permanecer compativel com o contrato do OpenCode.
3. WHEN houver divergencia entre `dist/` local e artefato empacotado THEN a verificacao SHALL falhar explicitamente.

**Independent Test**: Rodar a verificacao do pacote e observar que ela cria um artefato empacotado temporario, instala esse artefato em diretario isolado e valida o shape de export/carga resultante.

---

### P1: Tornar explicito o contrato de export do plugin ⭐ MVP

**User Story**: Como mantenedor, eu quero entender e codificar o shape de export que o loader do OpenCode espera para que o Guild nao dependa de suposicoes sobre ESM, default export ou interoperabilidade entre runtimes.

**Why P1**: O erro `Plugin export is not a function` indica que o problema esta precisamente no contrato de modulo/loader.

**Acceptance Criteria**:

1. WHEN a feature terminar THEN o repositorio SHALL documentar qual contrato de export do OpenCode esta sendo atendido.
2. WHEN o pacote for carregado pelos checks de compatibilidade THEN o teste SHALL provar esse contrato com evidencia automatizada.
3. WHEN ajustes de wrapper/export forem necessarios THEN eles SHALL ser minimos e restritos a compatibilidade de carga.

**Independent Test**: Executar checks de compatibilidade que provem como o entrypoint se comporta quando consumido pelo caminho de carga modelado para o OpenCode.

---

### P2: Impedir regressao no pipeline de release

**User Story**: Como mantenedor, eu quero que a pipeline de release falhe antes do publish se o pacote nao puder ser carregado pelo OpenCode para que uma versao quebrada nao chegue ao npm novamente.

**Why P2**: Uma correcao manual local nao e suficiente se o pipeline ainda permitir artefatos invalidos.

**Acceptance Criteria**:

1. WHEN `@runecraft/guild` for publicado THEN verificacoes de instalabilidade SHALL ter sido executadas antes do publish.
2. WHEN uma regressao quebrar o entrypoint carregavel THEN a pipeline SHALL falhar antes de `bun publish`.
3. WHEN o pacote passar pela pipeline THEN a evidenia de compatibilidade SHALL incluir o artefato empacotado.

**Independent Test**: Revisar o fluxo de scripts e release para confirmar que o caminho de publish depende da verificacao de instalabilidade do pacote.

---

## Edge Cases

- WHEN o pacote continuar funcionando com `import` local mas quebrar quando empacotado THEN a verificacao SHALL distinguir claramente source local de artefato final.
- WHEN o OpenCode usar um caminho de interoperabilidade diferente de Bun puro THEN a suite SHALL modelar esse comportamento ou criar um smoke test com o proprio OpenCode.
- WHEN o cache/local install do OpenCode mascarar o problema THEN a verificacao SHALL usar ambiente limpo e isolado.
- WHEN o pacote precisar de compatibilidade adicional entre `import` e `require` THEN a decisao SHALL ser guiada por reproducoes reais, nao por suposicoes.
- WHEN houver outros plugins invalidos no `opencode.json` do desenvolvedor THEN os testes do Guild SHALL rodar em fixture limpa para evitar falso negativo.

---

## Requirement Traceability

| Requirement ID | Story | Planned Artifact | Status |
| --- | --- | --- | --- |
| GUILD-INSTALL-01 | Carregar `@runecraft/guild` sem erro no OpenCode | `src/index.ts` — `server` named export | ✅ |
| GUILD-INSTALL-02 | Expor agentes/config do Guild apos carga bem-sucedida | `script/smoke-install.ts` factory smoke test | ✅ |
| GUILD-INSTALL-03 | Validar tarball empacotado em ambiente limpo | `script/verify.ts` packed artifact checks | ✅ |
| GUILD-INSTALL-04 | Provar o contrato de export esperado pelo OpenCode | `script/verify.ts` export contract checks | ✅ |
| GUILD-INSTALL-05 | Adicionar smoke test com carga real ou modelada do OpenCode | `script/smoke-install.ts` | ✅ |
| GUILD-INSTALL-06 | Integrar verificacao de instalabilidade ao fluxo de release | `prepublishOnly` + `.changeset/publish.mjs` verify gate | ✅ |
| GUILD-INSTALL-07 | Isolar o Guild de ruido de outros plugins na verificacao | Temp directory isolation in verify + smoke | ✅ |

**Coverage:** 7 total, 0 mapped to tasks, 7 unmapped.

---

## Success Criteria

- [ ] Um projeto limpo consegue carregar `@runecraft/guild` pelo `plugin` do OpenCode sem `Plugin export is not a function`
- [ ] Existe verificacao automatizada do artefato empacotado/publicado
- [ ] O contrato de export/carga do plugin esta documentado e coberto por testes
- [ ] O fluxo de publish falha antes do npm se a compatibilidade do plugin quebrar
- [ ] O README do pacote continua correto para o fluxo de instalacao declarativa via OpenCode
