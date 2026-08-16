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
| Instrument Lab | V1.3 local | Piano, guitarra, bass, drums, cordas e Synth Pad através de Web Audio e renderer local determinístico. |
| Piano roll | V1 visual/local | Grelha de 16 passos com notas e quantização no núcleo de instrumentos. |
| Beat Maker | V1 local | 16 passos, seis canais, presets e padrões Afrobeat, Amapiano, Kuduro, Afro House e Rumba; preview e Mixdown com síntese dedicada para bass e percussão. |
| Mixing local | V1 com painel e exportação | Soma estéreo pura com ganho por faixa, pan, mute, solo e headroom master; o painel persiste controlos e o Mixdown exporta WAV local com headroom. Clips instrumentais são renderizados localmente quando não existe blob externo. |
| Producer Plan local | V1.1/V2 inicial funcional | Plano determinístico por género, BPM, tonalidade, estrutura, instrumentos, cadeia vocal e mix; aceita intenção de produção e análise local sem API externa. |
| Mastering e IA externa | V2 planeada | A V1 mantém DSP local e original preservado; o Producer Studio V2 terá primeiro uma cadeia vocal local reversível e só depois poderá receber um provider IA server-side protegido. |

## Producer Plan local

A V1.1 introduz o `Producer Plan` em `src/js/producer-plan.js`. O plano é determinístico e local: recebe género, BPM, tonalidade e duração; escolhe um preset de Beat Maker, define a estrutura, selecciona instrumentos, descreve uma cadeia vocal e aplica um plano de mix com prioridade vocal e headroom. O botão **Aplicar Producer Plan local** grava o plano no projecto, preserva o original vocal e adiciona clips locais de bateria, bass, piano, guitarra, cordas ou Synth Pad conforme o género. A sessão também aceita uma **intenção de produção** em linguagem natural, guardada com a take e interpretada localmente por regras determinísticas (género, energia, instrumentos e objectivos de pitch/master), sem chamada externa. O processamento apresenta estados de preparação, arranjo e mix; pode ser cancelado sem destruir o original e pode ser repetido depois de uma falha.

O fluxo actual é:

```text
Gravar → Analisar regras locais → Producer Plan JSON
       → Clips instrumentais locais → Vocal DSP reversível
       → Mixer/Mixdown → Exportar WAV
```

A análise local V2 estima BPM, tonalidade aproximada e um perfil vocal básico a partir da gravação original, sem a substituir. O resultado inclui confiança e pode recuar para valores manuais quando o navegador não consegue descodificar o áudio. A cadeia vocal também dispõe de pitch correction assistida local, limitada a uma alteração controlada de cents e sempre exportada como nova versão; não é Auto-Tune completo nem substitui um afinador dedicado.

Esta V1 não afirma que um LLM faz Auto-Tune, masterização profissional ou geração de áudio. O Producer Plan orquestra o motor local existente. Uma futura integração IA deve usar backend server-side, esquema JSON validado, limites de utilização e segredos fora do browser. Nunca devem ser colocados tokens OpenAI ou Gemini no HTML, JavaScript público, armazenamento local ou GitHub. As fontes e decisões estão em [`docs/ai-producer-architecture-proposal.md`](./docs/ai-producer-architecture-proposal.md), [`docs/ai-sources-notes.md`](./docs/ai-sources-notes.md) e [`docs/ai-backend-contract.md`](./docs/ai-backend-contract.md).

A cadeia vocal reversível V2 está agora ligada ao fluxo principal: **Original** é a única fonte de processamento individual; **Enhanced** e **Pitch Corrected** são WAVs locais separados; **Mixed** é o resultado WAV do Mixdown da timeline. Cada variante recebe uma chave própria no IndexedDB (`original`, `enhanced`, `pitch-corrected`, `mixed`) e pode ser reproduzida ou descarregada sem substituir a gravação original. O campo legacy `Processada` continua apenas para compatibilidade com sessões antigas. Quando o Mixed existe, o cartão do projecto mostra também **Exportar Mixed WAV**, que cria um download local com o nome `<take>-mixed.wav`, sem enviar o áudio para um servidor.

O painel **Producer Studio V2** unifica agora a experiência: **Gravar → Analisar → Producer Plan → Vocal → Mix → Master → A/B → Exportar**. Mostra BPM e tonalidade estimados, confiança heurística, permite editar BPM/tom, apresenta o estado do arranjo, vocal e Mixdown e oferece pré-escuta A/B do Original e Mixed. A etapa Master é apresentada honestamente como preparação local de headroom; não afirma mastering profissional externo nem IA.

## Transição V1 → V2

A V1 funcional local está consolidada com os instrumentos existentes, Beat Maker, bass validado pelo utilizador, timeline, mixer, Mixdown e Producer Plan determinístico. A V2 deixa de adicionar instrumentos e passa a transformar uma voz gravada numa produção guiada: análise, instrução de produção, arranjo, melhoria vocal reversível, mix e master local. Os critérios, limites e ordem de implementação estão em [`docs/v1-v2-transition.md`](./docs/v1-v2-transition.md).

A futura assistência IA deve interpretar intenções e propor parâmetros, sem substituir a autoria de Fernando Lucoco. Nenhum token OpenAI ou Gemini será colocado no cliente, no armazenamento local ou no repositório.

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
        Producer Plan local V1.1
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

A suite actual terminou com **111 testes aprovados, 0 falhas e 0 testes ignorados**. A cobertura inclui WAV/DSP, IndexedDB, migração, diagnóstico de quota/fallback, Project Model, histórico, timeline, transport, sequencer, eventos de áudio, notas, quantização, presets, padrões de bateria, mixing engine, integração V1.1, renderer instrumental V1.2, bass e percussão melhorados, Cordas e Synth Pad locais, estados e recuperação do Producer Plan, interpretação determinística de briefs de produção, análise local de áudio com silêncio, pitch aproximado, BPM limitado, pitch correction assistida local, integração no Producer Plan e persistência/reset das variantes Enhanced, Pitch Corrected e Mixed. O bass possui agora um contrato específico de presença móvel com fundamental, corpo médio-grave e harmónico superior.

## Estado de QA e limites

A validação desktop e a suite determinística estão aprovadas. A compatibilidade física em Safari iPhone e Chrome Android ainda precisa de execução num dispositivo real, incluindo permissões de microfone, bloqueio de ecrã, retorno à aplicação, reprodução e reload. Por isso, não é afirmada compatibilidade perfeita em todos os telemóveis.

IndexedDB permanece em **beta interna**. A promoção para fonte principal só deve ocorrer depois de testar reload, fechar/reabrir, quota, modo privado, armazenamento cheio, recuperação e remoção. O relatório consolidado está em [`qa-web-findings.md`](./qa-web-findings.md), a auditoria do Music Engine está em [`docs/engine-v11-audit.md`](./docs/engine-v11-audit.md) e o índice de QA está em [`docs/qa-index.md`](./docs/qa-index.md).

## Music Engine V1.1 e mixing local

O marco V1.1 adicionou timeline funcional com Play, Pause, Stop, Beginning, relógio e playhead; Beat Maker com sequências locais; piano e guitarra ligados a notas e acordes sonoros; eventos inseridos como clips; controlos rápidos não destrutivos de mover, trim, split, resize, fade, ganho, duplicação e remoção; um painel Mixer visual com ganho, pan, mute, solo e headroom; e Mixdown WAV local com protecção de headroom. O processamento é local e mensurável, sem afirmar qualidade de estúdio profissional. O renderer instrumental foi introduzido na V1.2 e está descrito abaixo.

O Mixdown local já está disponível como primeira exportação verificável. A V1.2 adiciona um renderer determinístico local de Piano, Guitarra e Beat, permitindo que clips instrumentais sem blob externo entrem no Mixdown através do scheduler offline. A iteração instrumental seguinte reforça o bass com corpo e harmónicos, melhora a diferenciação de kick/snare/clap/hi-hat/percussão e adiciona timbres locais de Cordas e Synth Pad. A suite prova áudio não silencioso, duração, determinismo e inclusão no mix. O Real-World QA local acrescentou fixtures PCM controladas, um cenário Vocal/Beat/Piano/Guitarra e benchmarks de 10 segundos a 5 minutos; os resultados estão em [`docs/qa-real-world-v12.md`](./docs/qa-real-world-v12.md). O renderer usa síntese local simples, não pretende substituir instrumentos de estúdio e ainda precisa de validação física antes de ser considerado produção móvel. Cloud, colaboração, social, Creator Economy e a aplicação mobile permanecem fases posteriores documentadas em [`docs/platform-roadmap.md`](./docs/platform-roadmap.md). Nenhuma credencial é colocada no HTML ou JavaScript público.

## Documentação e legado

As decisões de produto, a transição V1→V2, contratos futuros e estratégia mobile estão em `docs/`. A passagem de estúdio instrumental para Producer Studio está descrita em [`docs/v1-v2-transition.md`](./docs/v1-v2-transition.md). O contrato de IA server-side está em [`docs/ai-backend-contract.md`](./docs/ai-backend-contract.md). As páginas do portfólio anterior foram preservadas em [`legacy/`](./legacy/) para manter a história sem misturar identidades.

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

## Correcção Beat Maker pós-QA Android

O preview dos pads do Beat Maker foi corrigido para usar síntese dedicada de kick, snare, clap, hi-hat, percussion e bass, em vez de converter todos os canais em notas tonais genéricas. O sequencer reutiliza o mesmo caminho de síntese e o ruído de percussão permanece determinístico para facilitar QA e reprodução consistente.

A suite local alcançou **80 testes aprovados e 0 falhas**. O reteste no Samsung Galaxy A06 com Android 16 e Chrome ainda é necessário antes de declarar esta correcção aprovada fisicamente.


### Correcção de audibilidade pós-QA Android

Após a validação no Samsung Galaxy A06, o ganho vocal foi ajustado para aplicar o ganho solicitado antes de um limiter suave, em vez de reduzir silenciosamente a diferença para cumprir o headroom. O preview e o renderer offline reforçam agora kick e bass de forma controlada; o bass acrescenta harmónicos de 130 Hz e 195 Hz para permanecer perceptível em altifalantes móveis. A suite local está em **90 testes aprovados**; a percepção final do bass e dos novos timbres ainda deve ser confirmada novamente no dispositivo real.

### Correcção do drum e dos padrões personalizados

O renderer do Beat Maker passou a respeitar os canais personalizados guardados no grid quando um padrão é adicionado à timeline. Antes, esse caminho podia ignorar `event.channels` e regenerar apenas o preset nominal, fazendo com que uma configuração personalizada parecesse não tocar correctamente no Mixdown. Foi também adicionado um alias seguro para `drum`, encaminhado para uma síntese de kick audível, sem alterar os canais canónicos `kick`, `snare`, `clap`, `hihat`, `percussion` e `bass`.

Foram adicionados testes determinísticos para o preview de drum genérico, canais personalizados e percurso completo até ao Mixdown. O problema de audibilidade ainda deve ser retestado no Samsung Galaxy A06, porque a suite confirma o sinal produzido pelo motor, mas não substitui a percepção acústica no dispositivo físico.
