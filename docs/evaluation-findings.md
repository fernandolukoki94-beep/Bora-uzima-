# Achados do ficheiro de avaliação

## Prioridade imediata

O ficheiro identifica três correcções críticas: reconhecer `audio/wav` e `audio/x-wav` na extensão do download; separar `originalAudioData` de `processedAudioData` para que a gravação original não desapareça depois de um efeito; e medir pico/headroom antes do ganho para reduzir clipping. Recomenda também renomear `processProject()` para `simulateProductionPipeline()`, porque o pipeline visual continua simulado.

## Próximo ciclo técnico

A recomendação seguinte é migrar áudio de `localStorage` com Base64 para IndexedDB com Blobs, criar testes automatizados do DSP verificando MIME, RIFF, duração, sample rate, canais, silêncio, diferença entre original e processado e clipping, e só depois adicionar mais efeitos DSP.

## Organização e publicação

As páginas legadas `manutencao.html`, `python.html`, `redes.html` e `web.html` devem ser movidas para `legacy/` com redireccionamentos compatíveis, evitando confusão visual na raiz do produto musical. A URL oficial deve ser `fernando-lucoco-music.vercel.app`; GitHub Pages fica como alternativa técnica.

## Validação móvel

O ficheiro não autoriza declarar compatibilidade física completa. Continua necessário testar Android Chrome e iPhone Safari com microfone, negar/permitir, gravação longa, bloqueio de ecrã, retorno à página, reprodução e download WAV.

## Ordem recomendada

1. Corrigir WAV, preservação original/processado e clipping.
2. Migrar para IndexedDB + Blob.
3. Criar testes DSP automatizados.
4. Consolidar efeitos locais, começando por ganho e fade.
5. Executar testes físicos.
6. Só depois avançar para EQ, compressor, noise gate, reverb, pitch, mix, master e eventual IA.

**Estado:** este documento regista requisitos do ficheiro; não significa que todos estejam implementados.


## Achados finais da nova avaliação

A avaliação confirma que a modularização está activa no navegador através de `src/js/app.js`, `recorder.js`, `storage.js`, `player.js`, `production.js` e `effects.js`. O ganho local de +3 dB utiliza Web Audio API e exporta WAV PCM, pelo que é uma operação DSP real e tecnicamente defensável, mas ainda experimental.

| Área | Acção | Estado recomendado |
|---|---|---|
| Pipeline DSP | Manter TAKE → ORIGINAL / PROCESSING → +3 dB → LIMITER → OUTPUT | Prioridade imediata |
| Validação WAV | Testar MIME, RIFF/WAVE, duração, sample rate e canais | Cobertura automática a completar |
| Storage | Evoluir localStorage + Base64 para IndexedDB com projects, blobs, effects e metadata | Migração progressiva |
| Modelo de take | Preservar `originalAudioData` e `processedAudioData` em paralelo | Obrigatório |
| Mobile | Executar checklist física Safari iPhone e Chrome Android | Pendente de dispositivo real |
| Legacy | Organizar páginas antigas como `legacy/`, preservando histórico e redireccionamentos quando necessário | Pendente |

No Chrome Android, a checklist deve cobrir permitir/negar microfone, gravação de 30 segundos e 5 minutos, reprodução, ganho, download WAV e recuperação. No Safari iPhone, deve cobrir permissão, gravação, reprodução, ganho, download WAV e bloqueio/desbloqueio do ecrã.

A ordem de evolução preservada é: V1 gravação, storage, playback e DSP simples; V2 EQ, compressor e reverb; depois backend, contas e cloud; só posteriormente V4/V5 IA. Não adicionar login, PostgreSQL, cloud, IA ou aplicação nativa antes de estabilizar a pipeline DSP local.

A conclusão da avaliação é que o produto deve evoluir de um site de gravação para uma aplicação web de processamento de áudio com uma pequena pipeline DSP real, mantendo honestidade sobre mixing, mastering e IA ainda não concluídos.

## Veredicto da avaliação complementar

A avaliação confirma que a V1 já possui uma base forte de portfólio: MediaRecorder, Web Audio API, DSP inicial, WAV, persistência local, QA automatizado, modularização e CI. A prioridade seguinte não é adicionar IA: é fechar IndexedDB, testar recuperação e executar validação física em Android Chrome e iPhone Safari.

### Ordem adoptada

1. IndexedDB com `projects`, `takes`, `blobs`, `metadata` e `effects`.
2. Testes de reload, fechar/reabrir, quota, armazenamento cheio, apagar, recuperar e modo privado.
3. Teste físico real em Android Chrome e iPhone Safari; não declarar “mobile fully tested” antes da evidência.
4. V1.1: fade, comparação original/processado, undo/reset e histórico de efeitos.
5. DSP avançado: EQ, compressor, noise gate, reverb e limiter.
6. Backend, contas e cloud apenas depois da V1 local estar comprovada.
7. IA apenas quando existir uma necessidade concreta do produto.

### Posicionamento público recomendado

> Local-first vocal recording and audio-processing web studio built with Web Audio API.

Este posicionamento é mais preciso do que apresentar o projecto apenas como um site de música e não afirma funcionalidades futuras como concluídas.
