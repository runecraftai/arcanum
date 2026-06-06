# Design: guild-plugin-installability

## Overview

Esta feature trata `@runecraft/guild` como um problema de **compatibilidade do artefato publicado com o loader de plugins npm do OpenCode**, nao como um problema de configuracao do usuario ou de logica interna dos agentes.

O plano e:

1. Reproduzir e documentar o contrato de carga do OpenCode
2. Validar o artefato empacotado do Guild em ambiente limpo
3. Ajustar o entrypoint/export do pacote apenas se a reproducao mostrar incompatibilidade real
4. Adicionar smoke tests que cubram o caminho de consumo do OpenCode
5. Fechar a porta de regressao no pipeline de verificacao e release

## Current State

### Evidencia do erro atual

- O OpenCode encontra `@runecraft/guild` no startup, tenta carregar o pacote e falha com `Plugin export is not a function`
- O erro nao indica `404`, `package not found` ou JSON invalido
- O source local de `packages/guild` exporta `default` como funcao de plugin
- A verificacao atual do pacote prova apenas que `dist/index.js` e importavel via Bun no workspace

### Como `opencode-weave` instala

`opencode-weave` usa exatamente o fluxo desejado:

- o usuario adiciona o nome do pacote em `plugin`
- o OpenCode instala plugins npm automaticamente no startup
- o pacote expoe `main: dist/index.js`, `type: module` e `exports.import: ./dist/index.js`
- o entrypoint publica `default export` como funcao de plugin

### O que isso implica para o Guild

`packages/guild` foi replatformado a partir do Weave e mantem praticamente o mesmo modelo de build e metadata. Portanto:

- a documentacao de instalacao do Guild nao esta conceitualmente errada
- o problema esta muito provavelmente no artefato final consumido pelo OpenCode, ou em uma diferenca de interop entre o Guild publicado e o caminho real de carga do loader

## Target State

Ao final da feature, `@runecraft/guild` deve ter:

- entrypoint carregavel pelo OpenCode em ambiente limpo
- verificacao do tarball empacotado, nao so do source local
- smoke test que modela ou usa o proprio OpenCode para validar carga
- pipeline de release que bloqueia publicacoes de artefatos nao carregaveis
- documentacao minima que explique o contrato de runtime testado

## Design Decisions

### D1. Tratar o problema como falha de artefato publicado

**Decision**: o foco principal sera o pacote empacotado e instalado em ambiente limpo.

**Why**:

- o erro aparece na carga do plugin instalado pelo OpenCode
- checks do `dist/` no monorepo podem passar mesmo com artefato final quebrado
- o caminho real de consumo e `package -> tarball -> install -> load`, nao apenas `src -> dist`

### D2. Usar `opencode-weave` como baseline comportamental, nao como verdade absoluta

**Decision**: comparar Guild com Weave para identificar lacunas, mas validar Guild pelos requisitos reais do OpenCode.

**Why**:

- Weave e a referencia tecnica mais proxima
- Guild espelha o modelo de build/export do Weave
- mesmo assim, a compatibilidade precisa ser provada no runtime alvo

### D3. Preferir a menor correcao possivel de export/entrypoint

**Decision**: so introduzir wrapper, dual export ou ajuste de `package.json` se a reproducao mostrar necessidade concreta.

**Why**:

- o plugin ja exporta `default` como funcao no source atual
- adicionar camadas de compatibilidade sem evidencia aumenta risco de comportamento inesperado
- a prioridade e corrigir a fronteira de carga com o menor diff funcional

### D4. Validar dois niveis de compatibilidade

**Decision**: criar verificacao em dois niveis.

**Nivel 1**: compatibilidade de modulo do artefato empacotado
- importa/resolve o pacote instalado em ambiente limpo
- prova o shape do entrypoint final

**Nivel 2**: compatibilidade de host OpenCode
- executa smoke test usando fixture minima e o proprio OpenCode, ou um harness que modele o loader com fidelidade suficiente

**Why**:

- Nivel 1 captura problemas de empacotamento
- Nivel 2 captura problemas de integracao real com o host

### D5. Isolar fixtures de verificacao do ambiente do desenvolvedor

**Decision**: testes de instalabilidade devem rodar com fixture limpa, sem depender do `opencode.json` atual do repo nem da configuracao global poluida.

**Why**:

- o ambiente atual possui erros paralelos como `list` e `graphify.js`
- esses erros nao pertencem ao Guild e mascaram diagnosticos
- o teste precisa responder apenas: `@runecraft/guild` carrega ou nao carrega?

### D6. Subir a garantia para o fluxo de release

**Decision**: o fluxo de publicacao deve depender da verificacao de instalabilidade.

**Why**:

- a regressao atual chegou ao npm
- o pacote ja tem `verify`, mas essa verificacao ainda nao cobre o caminho critico
- release sem gate de instalabilidade continua arriscado

## Comparison With Weave

## Similarities relevantes

- Mesmo padrao de instalacao via `plugin` no `opencode.json`
- Mesmo tipo de entrypoint `default export` de funcao async
- Mesmo estilo de `package.json` com `main`, `type: module` e `exports.import`
- Mesmo stack principal de dependencias (`@opencode-ai/plugin`, `@opencode-ai/sdk`, `jsonc-parser`, `zod`)

## Diferenca operacional importante

Weave serve como baseline de intencao, mas o Guild precisa de verificacao adicional porque:

- houve replatform com rename de identidade
- o pacote esta sendo publicado por pipeline propria do monorepo
- o fluxo atual valida import do `dist/` local, nao a experiencia do consumidor final

## Architecture

### Phase 1: Reproduction and Contract Discovery

Objetivo: descobrir o contrato de carga que o OpenCode realmente usa e reproduzir o erro com ambiente controlado.

Saidas esperadas:

- reproducao minima confiavel
- nota tecnica sobre export shape esperado pelo host

### Phase 2: Artifact Compatibility Verification

Objetivo: criar verificacao do pacote empacotado.

Saidas esperadas:

- tarball do Guild instalado em diretoria temporaria limpa
- checks de import/interop do artefato instalado

### Phase 3: Runtime Compatibility Fix

Objetivo: ajustar entrypoint/export/package metadata apenas se os testes mostrarem incompatibilidade.

Saidas esperadas:

- correcao minima de compatibilidade
- testes atualizados provando o comportamento

### Phase 4: OpenCode Smoke Coverage

Objetivo: validar o plugin por um caminho o mais proximo possivel do host real.

Saidas esperadas:

- fixture limpa de `opencode.json`
- comando de debug ou smoke run do OpenCode bem-sucedido

### Phase 5: Release Hardening

Objetivo: impedir que a regressao reapareca no publish.

Saidas esperadas:

- `verify` ampliado
- `prepublishOnly` ou gate equivalente
- pipeline de release dependente desse gate

## Verification Strategy

Cada fase precisa produzir evidencia objetiva.

- Fase 1: reproducao minima mostra falha atual e documenta o contrato de carga investigado
- Fase 2: tarball instalado em ambiente limpo prova ou refuta a compatibilidade do artefato
- Fase 3: depois da correcao, checks de export/interop passam
- Fase 4: OpenCode smoke test carrega o Guild sem `Plugin export is not a function`
- Fase 5: caminho de release nao consegue publicar sem passar pelas verificacoes

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| O loader do OpenCode ter comportamento dificil de observar diretamente | Pode levar a correcao errada de export | Criar reproducao empirica e smoke test com o host |
| `bun pack/publish` produzir artefato diferente do esperado | Verificacao local enganosa | Validar o tarball real gerado antes do publish |
| Adicionar wrappers sem necessidade | Complexidade e ambiguidade | So introduzir compatibilidade extra com evidencia concreta |
| Ambiente local continuar poluido por plugins invalidos | Falsos negativos | Rodar fixture isolada do Guild |
| Gate de release ser contornado por script customizado | Regressao volta ao npm | Integrar a verificacao no caminho efetivo usado por `.changeset/publish.mjs` |

## Exit Criteria

O design estara completo quando:

1. O caminho de reproducao do erro estiver definido
2. O plano de validacao do artefato empacotado estiver explicito
3. As possiveis correcoes de export/entrypoint estiverem limitadas ao necessario
4. O fluxo de release estiver coberto por um gate de instalabilidade
