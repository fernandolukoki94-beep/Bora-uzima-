# Fernando Lucoco Music

**Fernando Lucoco Music** é um estúdio musical web-first, local-first e orientado à privacidade, criado por **Fernando Lucoco**. A plataforma começa pela gravação vocal no navegador e evolui para um Music Engine modular com projectos, tracks, clips, timeline, instrumentos e Beat Maker. A V1 funciona sem custos externos e não envia áudio automaticamente para servidores.

> A tua voz. A tua demo. O teu próximo take.

## Site online

A demonstração pública está disponível em [fernando-lucoco-music.vercel.app](https://fernando-lucoco-music.vercel.app/). O repositório técnico mantém o nome `Bora-uzima-` para preservar o histórico e os links já partilhados, mas a identidade do produto é **Fernando Lucoco Music**.

## O que funciona actualmente

| Área | Estado real | O que está disponível |
|---|---|---|
| Landing e workspace | Implementado | Interface responsiva, autoria explícita e fluxo local-first. |
| Gravação vocal | Implementado | `getUserMedia` e `MediaRecorder`, com estados de permissão, gravação, paragem e erro. |
| Persistência | Beta interna | `localStorage` continua como leitura e fallback; IndexedDB v2 recebe escrita dual, migração não destrutiva, blobs e histórico de efeitos. |
| Reprodução e exportação | Implementado | Reprodução local, download original e exportação WAV quando há áudio processado compatível. |
| DSP local | Parcial e mensurável | Ganho seguro, fade, normalização, compressor e núcleo noise gate; o original é preservado. |
| Project Engine | Implementado | Projecto normalizado com BPM, tonalidade, tracks, clips, efeitos, marcadores e timestamps. |
| Timeline | V1 funcional local | Clips, tracks, transport, playhead, operações de mover, dividir, cortar, duplicar, apagar, ganho e fade, com undo/redo; a interface expõe controlos rápidos por clip. |
| Instrument Lab | Pré-escuta local implementada | Notas, acordes de piano e pads de guitarra através de Web Audio local. |
| Piano roll | V1 visual/local | Grelha de 16 passos com notas e quantização no núcleo de instrumentos. |
| Beat Maker | V1 local | 16 passos, seis canais, presets e padrões Afrobeat, Amapiano, Kuduro, Afro House e Rumba. |
| Mixing local | V1 com painel e exportação | Soma estéreo pura com ganho por faixa, pan, mute, solo e headroom master; o painel persiste controlos e o Mixdown exporta WAV local com headroom. Clips instrumentais continuam a ser eventos sem áudio renderizado no mix final. |
| Mastering e IA | Não implementado | Não há cadeia profissional de mastering nem AI Producer. |

## Arquitectura

O produto está organizado em módulos pequenos para manter a evolução verificável:

```text
Fernando Lucoco Music
        │
        ▼
   Music Engine
        │
  ┌─────┼──────────────┐
  │     │              │
Vocal  Timeline     Instruments
  │     │              ├── Piano
  │   Tracks          ├── Guitar
  │     │              ├── Bass/futuro
  │   Clips            └── Drums
  │     │
  └─────┴──── Beat Maker
              │
              ▼
          Local DSP
              │
              ▼
       Mixing Engine local V1
              │
              ▼
        AI Producer futuro
```

O modelo de sessão está em `src/js/studio/project-model.js`. As operações não destrutivas de clips estão em `src/js/studio/timeline.js`; o histórico encontra-se em `src/js/studio/history.js`; os instrumentos, notas, quantização e padrões vivem em `src/js/studio/instruments.js`; e a pré-escuta Web Audio está em `src/js/studio/audio-engine.js`.

## Como testar localmente

O microfone deve ser utilizado através de `localhost` ou HTTPS. Para iniciar o projecto:

```bash
git clone https://github.com/fernandolukoki94-beep/Bora-uzima-.git
cd Bora-uzima-
python3 -m http.server 8000
```

Abra `http://localhost:8000`, autorize o microfone e experimente uma take curta. As sessões ficam no navegador e podem ser eliminadas pela acção **Limpar dados locais**. O comando oficial de QA é:

```bash
pnpm test
```

A suite actual terminou com **64 testes aprovados, 0 falhas e 0 testes ignorados**. A cobertura inclui WAV/DSP, IndexedDB, migração, diagnóstico de quota/fallback, Project Model, histórico, timeline, transport, sequencer, eventos de áudio, notas, quantização, presets, padrões de bateria, mixing engine, integração V1.1 e renderer instrumental V1.2.

## Estado de QA e limites

A validação desktop e a suite determinística estão aprovadas. A compatibilidade física em Safari iPhone e Chrome Android ainda precisa de execução num dispositivo real, incluindo permissões de microfone, bloqueio de ecrã, retorno à aplicação, reprodução e reload. Por isso, não é afirmada compatibilidade perfeita em todos os telemóveis.

IndexedDB permanece em **beta interna**. A promoção para fonte principal só deve ocorrer depois de testar reload, fechar/reabrir, quota, modo privado, armazenamento cheio, recuperação e remoção. O relatório consolidado está em [`qa-web-findings.md`](./qa-web-findings.md), a auditoria do Music Engine está em [`docs/engine-v11-audit.md`](./docs/engine-v11-audit.md) e o índice de QA está em [`docs/qa-index.md`](./docs/qa-index.md).

## Music Engine V1.1 e mixing local

O marco V1.1 adicionou timeline funcional com Play, Pause, Stop, Beginning, relógio e playhead; Beat Maker com sequências locais; piano e guitarra ligados a notas e acordes sonoros; eventos inseridos como clips; controlos rápidos não destrutivos de mover, trim, split, resize, fade, ganho, duplicação e remoção; um painel Mixer visual com ganho, pan, mute, solo e headroom; e Mixdown WAV local com protecção de headroom. O processamento é local e mensurável, sem afirmar qualidade de estúdio profissional. O renderer instrumental foi introduzido na V1.2 e está descrito abaixo.

O Mixdown local já está disponível como primeira exportação verificável. A V1.2 adiciona um renderer determinístico local de Piano, Guitarra e Beat, permitindo que clips instrumentais sem blob externo entrem no Mixdown através do scheduler offline. A suite prova áudio não silencioso, duração, determinismo e inclusão no mix. O Real-World QA local acrescentou fixtures PCM controladas, um cenário Vocal/Beat/Piano/Guitarra e benchmarks de 10 segundos a 5 minutos; os resultados estão em [`docs/qa-real-world-v12.md`](./docs/qa-real-world-v12.md). O renderer usa síntese local simples, não pretende substituir instrumentos de estúdio e ainda precisa de validação física antes de ser considerado produção móvel. Cloud, colaboração, social, Creator Economy e a aplicação mobile permanecem fases posteriores documentadas em [`docs/platform-roadmap.md`](./docs/platform-roadmap.md). Nenhuma credencial é colocada no HTML ou JavaScript público.

## Documentação e legado

As decisões de produto, contratos futuros e estratégia mobile estão em `docs/`. O contrato de IA server-side está em [`docs/ai-backend-contract.md`](./docs/ai-backend-contract.md). As páginas do portfólio anterior foram preservadas em [`legacy/`](./legacy/) para manter a história sem misturar identidades.

A implementação Expo em `/home/ubuntu/bora-uzima-mobile` permanece separada e não substitui o site web público. A prioridade actual é concluir e validar o estúdio web antes de retomar a transformação nativa.

## Stack

A interface usa HTML5, CSS moderno e JavaScript ES Modules. O áudio usa MediaDevices, MediaRecorder e Web Audio API. A persistência usa `localStorage` com escrita dual para IndexedDB v2. Os testes usam o runner nativo do Node e a publicação é feita através do GitHub e Vercel.

## Autoria e licença

O produto é dirigido e desenvolvido por **Fernando Lucoco**. O projecto é disponibilizado sob a licença MIT.

---

**Fernando Lucoco Music · 2026**


## Correcções pós-QA Android — Samsung Galaxy A06

A avaliação real num Samsung Galaxy A06 com Android 16 e Google Chrome confirmou que a V1.2 é utilizável, mas revelou pontos de acabamento na escala de ganho, no teclado instrumental, no Beat Maker e na resposta vocal. Esta iteração substitui os quatro níveis ambíguos de ganho por uma escala contínua de **−∞ a +6 dB**, mantendo o schema linear persistido; adiciona valores visíveis, feedback táctil e alvos maiores para mobile.

O áudio local do teclado e do Beat Maker recebeu envelopes mais suaves, filtros, queda de frequência no kick e ruído determinístico filtrado para snare/clap/hihat. Foi acrescentada uma **Melhoria vocal local** com passa-alto, presença e compressor. Esta função reduz problemas básicos de rumble e dinâmica, mas não é Vocal Engine profissional, correcção de afinação, IA ou mastering.

A suite passou para **73 testes aprovados, 0 falhas**. A promoção do IndexedDB para fonte primária continua bloqueada até nova verificação no dispositivo após estas correcções.
