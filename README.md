# Fernando Lucoco Music

**Fernando Lucoco Music** é um estúdio musical web-first, local-first e orientado à privacidade, criado por **Fernando Lucoco**. A plataforma começa pela gravação vocal no navegador e evolui para um Music Engine modular com projectos, tracks, clips, timeline, instrumentos e Beat Maker. A V1 funciona sem custos externos e não envia media automaticamente para servidores: o upload cloud só ocorre por acção explícita do utilizador autenticado.

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
| Community/Profile | Primeira fatia operacional autenticada | Feed Firestore de songs, projects, beats, videos e clips; Novo/Trending; likes, comentários, partilha; perfil artístico; descoberta de perfis e follows persistentes. Mensagens, stories e colaboração continuam pendentes. |
| Media Storage | Primeira fatia operacional autenticada | My Sounds mantém IndexedDB offline-first e permite sincronizar media áudio, vídeo ou imagem até 80 MB no Firebase Storage, com path isolado por utilizador e metadados na subcolecção Firestore `users/{uid}/media`. Message Storage, stories e colaboração continuam pendentes. |
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

### V2.1 — prova de integração ponta a ponta

A V2.1 transforma o plano numa consequência musical verificável: `materializeProducerPlan()` converte o Producer Plan em tracks e clips reais de drums, bass, piano, guitarra, cordas e synth na timeline. A aplicação é determinística e reexecutável: clips gerados por um plano anterior são substituídos, enquanto clips manuais e a gravação vocal original permanecem intactos. A QA cobre sessão, plano, clips, variantes Enhanced/Pitch Corrected, serialização/reload e chegada ao Mixdown WAV. A suite local está em **115 testes aprovados e 0 falhas**. A validação física em Chrome Android e Safari iPhone continua separada e ainda requer evidência real por dispositivo.

O ficheiro de requisitos recebido foi arquivado em [`docs/pasted_content-v21-requirements.txt`](./docs/pasted_content-v21-requirements.txt), com a respectiva matriz de conformidade em [`docs/v21-requirements-compliance.md`](./docs/v21-requirements-compliance.md). Estes documentos distinguem capacidades implementadas de validações físicas e de usabilidade ainda pendentes.

## Transição V1 → V2

A V1 funcional local está consolidada com os instrumentos existentes, Beat Maker, bass validado pelo utilizador, timeline, mixer, Mixdown e Producer Plan determinístico. A V2 deixa de adicionar instrumentos e passa a transformar uma voz gravada numa produção guiada: análise, instrução de produção, arranjo, melhoria vocal reversível, mix e master local. Os critérios, limites e ordem de implementação estão em [`docs/v1-v2-transition.md`](./docs/v1-v2-transition.md).

A futura assistência IA deve interpretar intenções e propor parâmetros, sem substituir a autoria de Fernando Lucoco. Nenhum token OpenAI ou Gemini será colocado no cliente, no armazenamento local ou no repositório.

## Community/Profile

A primeira fatia social está integrada no Firebase já existente e só abre em sessão autenticada. `firebase-community.js` reutiliza o `auth` e o `db` existentes para guardar perfis artísticos, posts, likes, comentários, relações de follow e descoberta de artistas. O feed suporta os tipos `song`, `project`, `beat`, `video` e `clip`, com ordenação **Novo** ou **Trending** e filtragem por tipo. A área de descoberta pesquisa nome artístico, username e géneros e permite alternar **Seguir/A seguir** com estado persistido no Firestore.

Esta etapa partilha texto e referências de projecto; não envia automaticamente áudio para o servidor. A sincronização privada de media para Firebase Storage está agora disponível como acção explícita autenticada no My Sounds. O fluxo local continua preservado como fallback offline. Mensagens privadas, stories, notificações, repost e colaboração multi-utilizador permanecem como lacunas explícitas do `pasted_content.txt`.

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

A suite actual terminou com **114 testes aprovados, 0 falhas e 0 testes ignorados**. A cobertura inclui WAV/DSP, IndexedDB, migração, diagnóstico de quota/fallback, Project Model, histórico, timeline, transport, sequencer, eventos de áudio, notas, quantização, presets, padrões de bateria, mixing engine, integração V1.1, renderer instrumental V1.2, bass e percussão melhorados, Cordas e Synth Pad locais, estados e recuperação do Producer Plan, interpretação determinística de briefs de produção, análise local de áudio com silêncio, pitch aproximado, BPM limitado, pitch correction assistida local, integração no Producer Plan e persistência/reset das variantes Enhanced, Pitch Corrected e Mixed. O bass possui agora um contrato específico de presença móvel com fundamental, corpo médio-grave e harmónico superior.

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

## Indicador de origem na timeline
A timeline distingue explicitamente a proveniência de cada faixa. Tracks materializadas pelo **Producer Plan** apresentam o badge `Producer Plan`, uma borda violeta e uma descrição acessível que informa que a faixa foi gerada pelo plano. Tracks criadas ou editadas manualmente apresentam o badge `Manual`. A distinção é derivada dos metadados dos clips, não do nome visível, e permanece segura para reexecução e reload.

A suite de QA desta iteração alcançou **115 testes aprovados e 0 falhas**. O indicador é apenas uma representação visual: não altera o áudio, o Mixdown, a persistência ou a propriedade dos clips.

### Feedback de teste A/B e exportação

As acções A/B e Exportar música têm feedback visual e acessível para os estados **a preparar**, **concluído** e **erro**. Durante a preparação, o controlo mostra um indicador de actividade e impede cliques duplicados; no sucesso, apresenta confirmação persistente até à próxima acção; em erro, comunica uma instrução de recuperação. A região `aria-live` mantém a informação disponível para tecnologias assistivas e o CSS respeita `prefers-reduced-motion`. A suite local passou a **118 testes aprovados e 0 falhas**.

### Marco E2E real V2.1

A regressão ponta a ponta agora prova que uma sessão pode criar a gravação vocal, aplicar a análise e o Producer Plan, materializar clips na timeline, receber um clip manual, reaplicar o plano sem remover o clip manual, preservar as variantes vocais, chegar ao Mixdown e sobreviver à serialização/reload. Esta cobertura automatizada não substitui a validação física no Samsung Galaxy A06, Chrome Android e Safari iPhone; esses testes continuam explicitamente pendentes. A suite mantém **118 testes aprovados e 0 falhas**.

O commit `9305105` misturou documentação e implementação por ter sido criado durante a sincronização da matriz V2.1. A partir daí, as alterações passaram a usar mensagens semânticas separadas, como `feat: integrate producer studio v2 flow` e `feat: add visual feedback for ab and export`, sem reescrever o histórico público.

### QA Chrome e início da V2.2 AI Producer
A validação física comunicada nesta iteração foi concluída no Chrome Android. O Beat Maker e os instrumentais receberam um reforço moderado de ganho no Producer Plan, com headroom preservado e cobertura determinística; esta alteração não modifica o Original vocal.

A V2.2 introduz a primeira assistência IA **server-side** através de `POST /api/v1/production/advice`. O browser envia apenas metadados da take e recebe uma recomendação estruturada; não envia áudio nem contém tokens. Sem fornecedor configurado, a API responde `503 provider_unavailable` e o fluxo local continua disponível. A documentação técnica está em [`docs/v22-ai-producer-progress.md`](docs/v22-ai-producer-progress.md). A suite desta etapa terminou com **121 testes aprovados e 0 falhas**. Safari iPhone e processamento IA de áudio permanecem pendentes.

### V2.2 — AI Recommendation → Producer Plan
A recomendação IA validada agora pode ser convertida de forma determinística numa intenção compatível com o Producer Plan local. A conversão preserva `localOnly` e `originalPreserved`, guarda a proposta no projecto e não aplica áudio automaticamente; a execução continua a exigir acção explícita do utilizador. A suite passou a **127 testes aprovados e 0 falhas**.

A repetição com OpenAI permanece bloqueada por `insufficient_quota`, apesar da credencial server-side autenticar correctamente no endpoint leve de modelos. Não é tratado como sucesso do provider real. A validação Safari iPhone continua pendente e requer teste físico no dispositivo.


## V2.2 — instrumental externo e mini-produtor local

O Producer Studio passou a aceitar um beat de áudio escolhido no dispositivo através de um selector local com validação de formato e limite de 80 MB. O ficheiro é convertido para dados persistidos na sessão local, pode ser pré-escutado no navegador e fica associado ao projecto sem upload automático.

A acção **Vocal + beat** materializa duas faixas de áudio na timeline: o vocal processado disponível (Pitch Corrected, Enhanced ou Original) e o beat importado. O resultado é renderizado para WAV através do Mixdown local, guardado como variante **Mixed** e exportável pela interface. O original vocal continua preservado e as variantes anteriores permanecem reversíveis.

Esta etapa ainda não representa Auto-Tune avançado nem masterização IA profissional. Esses blocos continuam explicitamente marcados como próximos passos: Auto-Tune DSP validado em áudio real, blob dedicado em IndexedDB para beats grandes, provider IA com quota disponível e validação física em Samsung Galaxy A06, Chrome Android e Safari iPhone. A suite determinística passou de 127 para **131 testes**, sem falhas.

## V2.3 — IndexedDB dedicado, Auto-Tune local e waveform

A camada de armazenamento agora inclui a store IndexedDB `beats`, separada dos blobs vocais e preparada para ficheiros instrumentais maiores. Cada beat é associado ao projecto por uma chave estável, com MIME, nome, tamanho e data de actualização. Sessões antigas que ainda contenham `data` inline continuam a ser lidas através de fallback compatível; a limpeza de projecto remove também os beats dedicados.

O Producer Studio expõe uma forma de onda local para o vocal e outra para o beat. A visualização usa a Web Audio API no dispositivo, apresenta duração e estados de indisponibilidade honestos, e não envia o áudio para um serviço externo.

Foi acrescentado Auto-Tune local assistido. A intensidade de 0–100% é convertida deterministicamente numa correcção máxima de 0–50 cents, com passa-alto, presença e compressão ligeira para manter uma saída audível. O processamento cria uma variante `pitchCorrected` identificada como `local-autotune`; o Original e o Enhanced não são substituídos. O botão de reversão remove apenas essa variante e o seu blob, preservando as restantes versões.

Esta implementação é um **assistente tonal local**, não um Auto-Tune profissional nota-a-nota. A detecção detalhada de pitch, edição de escala, formant correction e AI Mastering permanecem fases futuras. A suite determinística desta etapa terminou com **134 testes aprovados e 0 falhas**. A validação física no Samsung Galaxy A06, Chrome Android e Safari iPhone continua necessária.

## V2.4 — exportação final, escala e pitch

O Producer Studio permite agora preparar a faixa final com vocal e beat importado e descarregá-la como WAV através da acção **Exportar música**. O ficheiro exportado corresponde à variante `Mixed`, criada pelo Mixdown local, com nome seguro e feedback de preparação, sucesso ou erro. O beat guardado na store dedicada IndexedDB é resolvido antes do render, incluindo sessões que já não mantêm o áudio inline.

O Auto-Tune local expõe tonalidade (C–B), escala (maior, menor ou cromática), intensidade e reversão. A análise de pitch nota-a-nota usa autocorrelação local, apresenta quantidade de notas detectadas, correcção média e confiança e é tratada como estimativa: ruído, silêncio, polifonia e voz sem fundamental estável podem reduzir a confiança. A variante avançada continua separada de `Original`, `Enhanced` e `Mixed` até o utilizador aplicar o processamento.

A integração foi coberta por **135 testes determinísticos aprovados e 0 falhas**. A validação física de exportação, escala e pitch no Samsung Galaxy A06, Chrome Android e Safari iPhone continua necessária antes de considerar esta fase pronta para produção.


## V2.5 — edição de afinação e partilha

O Producer Studio permite editar manualmente as notas detectadas antes de aplicar Auto-Tune. Cada nota apresenta o tempo e o MIDI alvo, com limites seguros, e a alteração recalcula a correcção tonal sem modificar a gravação Original.

Foi adicionado um editor visual da curva de afinação sobre o waveform vocal. O utilizador pode tocar ou clicar num ponto para ajustar a nota mais próxima; os campos numéricos continuam disponíveis para edição precisa e acessível.

A faixa Mixed pode ser partilhada directamente através da Web Share API quando o dispositivo suporta partilha de ficheiros. Em browsers sem essa capacidade, o sistema mantém o download WAV como fallback. Nenhum áudio ou credencial é enviado para um serviço externo por este fluxo.

A suite determinística desta versão terminou com 137 testes aprovados e 0 falhas. A validação física no Samsung Galaxy A06, Chrome Android e Safari iPhone continua necessária para confirmar a folha nativa de partilha e os gestos de edição.

## V2.6 — edição persistente e efeitos espaciais

A V2.6 acrescenta uma store IndexedDB `pitchEdits` dedicada às notas de pitch editadas por projecto. As edições são restauradas depois de recarregar a página e são removidas de forma controlada ao fazer reset ou apagar o projecto; a gravação Original permanece intacta.

O editor de afinação passou a suportar zoom horizontal/vertical, recentragem e arrasto contínuo com limites seguros. Foram também adicionados reverb e delay locais baseados em `OfflineAudioContext`, com intensidade ajustável, variantes reversíveis e fallback honesto quando o ambiente não disponibiliza Web Audio.

A suite determinística V2.6 terminou com **138 testes aprovados e 0 falhas**. A validação física no Samsung Galaxy A06, Chrome Android e Safari iPhone continua necessária antes de aceitar estes controlos como validados em produção.

## V2.7 — bypass A/B de efeitos

O Producer Studio inclui agora um botão **Bypass: Original** no painel final. Quando existe uma versão Mixed, o botão alterna entre a reprodução do Original e do Mixed sem apagar, reprocessar ou substituir variantes persistidas. O estado usa `aria-pressed`, muda visualmente quando o bypass está activo e mantém os botões A/B tradicionais disponíveis. A comparação é local e continua sujeita às políticas de autoplay do navegador.

QA determinística: **139 testes aprovados, 0 falhas**.

## V2.8 — bypass por efeito, medição A/B e predefinições

O Producer Studio passou a expor bypass individual para Auto-Tune, Reverb e Delay, com estado visual e acessível. A comparação A/B apresenta pico e loudness estimados para Original e Mixed, permitindo avaliar diferenças de nível sem substituir as variantes persistidas.

As configurações de Auto-Tune, Reverb, Delay e respectivos bypasses podem ser guardadas como predefinições personalizadas locais. As predefinições são normalizadas, limitadas a 30 entradas, reaplicáveis e apagáveis sem afectar áudio ou projectos.

Foi criada a competência reutilizável `fernando-lucoco-audio-studio`, que formaliza o workflow local-first, reversibilidade, IndexedDB, DSP, QA e segurança da IA server-side. A Skill foi validada pelo `quick_validate.py`. A suite web V2.8 terminou com 141 testes aprovados e 0 falhas.

Limite actual: a validação física dos bypasses, medidores e predefinições no Samsung Galaxy A06, Chrome Android e Safari iPhone continua pendente.


## V2.9 — presets iniciais, persistência e medidores A/B

A interface de efeitos inclui agora quatro predefinições base: **Voz seca**, **Sala**, **Plate** e **Eco**. Os presets base são protegidos contra eliminação acidental e permanecem separados das predefinições personalizadas.

A predefinição activa é associada ao projecto corrente e persistida localmente. Após recarregar a página, a aplicação restaura a selecção e os parâmetros sem substituir a gravação Original nem as variantes processadas. A gestão de presets também foi ajustada para reflectir a selecção activa ao criar ou reabrir um projecto.

Os medidores A/B de pico e loudness receberam barras progressivas, loading visual, shimmer de actividade, transições suaves e suporte a `prefers-reduced-motion`. A suite determinística terminou esta revisão com **141 testes aprovados e 0 falhas**. A validação física em Samsung Galaxy A06, Chrome Android e Safari iPhone continua necessária.

### AI Producer — execução dentro da faixa do produtor

A integração AI Producer foi corrigida para deixar de ser apenas uma recomendação textual. Quando o provider server-side devolve uma resposta válida, o cliente transforma-a num `Producer Plan` AI-assisted e aplica-o automaticamente na faixa do produtor. O plano materializa o arranjo e a instrumentalização em tracks/clips reais, actualiza BPM e tonalidade, carrega a cadeia vocal e avança pelos estados de processamento de vocal, mix e master local seguro.

O servidor recebe apenas metadados validados: género, preset vocal, duração, BPM, tonalidade e intenção do artista. Não recebe o áudio e nunca envia chaves para o browser. A IA define o plano de produção; o Web Audio Engine local executa o arranjo, os efeitos reversíveis, o mixdown e o master com headroom. O `Original` é preservado e o projecto guarda `producerPlanSource: "ai"`, a cadeia recomendada e o instante de aplicação para permitir auditoria e restauração.

A interface comunica agora estados distintos, incluindo “A IA está a criar o arranjo e a instrumentalização”, “A IA materializa a faixa do produtor” e “A preparar vocal, mix e master local seguro”. Se o provider estiver indisponível, expirar ou esgotar quota, nada é inventado: o fluxo local continua disponível. Isto significa que a IA actua como produtora de arranjo e decisão, mas a execução áudio é local; processamento áudio remoto por IA continua fora do escopo até existir um serviço seguro, com quota e testes reais.


## AI Producer — Direcção automática e qualidade local

A Direcção de Produção transforma género, BPM, tonalidade, preset vocal e briefing do artista num plano automático de arranjo. O plano define secções com intensidades distintas, identifica os instrumentos prioritários e materializa a paleta local na timeline sem remover opções de edição humana. Ao reaplicar o plano, os clips gerados são substituídos de forma idempotente e as faixas manuais permanecem intactas.

A produção continua local-first: a IA server-side interpreta a intenção e recomenda a cadeia, enquanto o motor Web Audio local executa a instrumentalização, o processamento vocal, o mix e a masterização. A masterização local passou a incluir compressão determinística, limiter com ceiling seguro e métricas de pico, RMS e loudness aproximado. Isto melhora headroom e consistência sem apresentar o resultado como masterização externa de estúdio.

A suite actual terminou com **143 testes aprovados, 0 falhas**. A quota do provider IA e a validação física em dispositivos reais continuam a ser limitações separadas.

## V2.10 — Sound Library e inspector multi-track

O Studio passou a incluir uma **Sound Library local** com catálogo determinístico de drums, bass, guitarra, piano, cordas e synth. Cada camada pode ser pré-escutada através do Web Audio existente, adicionada por botão à timeline ou arrastada para uma posição específica da faixa. Os clips da biblioteca são eventos instrumentais locais, preservam metadados de origem e não dependem de uploads, URLs externas ou chaves de API.

O mixer passou também a oferecer um **inspector contextual multi-track**. Ao seleccionar uma track, por toque, clique ou teclado, o painel mostra o tipo, a origem Manual/Producer Plan, o número de clips e efeitos e um resumo dos clips presentes. Os controlos de ganho, pan, mute e solo continuam não destrutivos e persistidos através do modelo de projecto existente.

Foram adicionados testes determinísticos para garantir ids únicos no catálogo, posições de clip limitadas, metadados de evento e comportamento seguro para sons desconhecidos. A suite desta revisão terminou com **148 testes aprovados e 0 falhas**. A validação física dos gestos de arrasto e dos controlos no Samsung Galaxy A06, Chrome Android e Safari iPhone continua recomendada.


## V2.2 — providers IA server-side

O AI Producer suporta agora um adaptador Gemini server-side separado do adaptador OpenAI. A selecção é feita no backend: quando `GEMINI_API_KEY` existe, o pedido é enviado para Gemini; caso contrário, o endpoint mantém compatibilidade com OpenAI e com o fallback local determinístico. O browser nunca recebe chaves, não envia áudio para o provider e só recebe uma recomendação JSON validada.

A configuração de produção usa `GEMINI_API_KEY` como variável confidencial no Vercel. `GEMINI_MODEL` é opcional e usa `gemini-2.0-flash` por defeito. A chave deve ser adicionada apenas em **Produção**, seguida de redeploy. Quota gratuita está sujeita aos limites da conta e pode produzir `provider_quota_exhausted`; nesse caso, o Studio continua funcional com o Producer Plan local. A recomendação IA descreve arranjo, instrumentalização e cadeia de produção, enquanto Auto-Tune, processamento vocal, mixagem e masterização continuam a ser executados localmente e de forma reversível.

O adaptador aplica timeout, valida `summary`, `chain` e `confidence`, limita o tamanho dos campos e converte erros de autenticação, quota, indisponibilidade e resposta inválida em estados sanitizados. A suite inclui cobertura determinística sem chamadas externas.

## Firebase — fundação full-stack

O projecto Firebase `fernando-lucoco-music` foi criado com Cloud Firestore Standard e Authentication por **E-mail/Password** activada. O site inclui agora um painel de conta com registo, login, recuperação de palavra-passe e logout através do Firebase Web SDK. A sessão usa persistência local do Firebase no navegador.

A configuração Web está isolada em `src/js/firebase-config.js` e contém apenas identificadores públicos da aplicação. Não existem chaves de Admin SDK, `privateKey` ou `clientEmail` no cliente. A camada `src/js/firebase-client.js` cria o perfil inicial em `users/{uid}` depois do registo. As regras versionadas em `firestore.rules` impedem acesso anónimo e limitam cada perfil ao respectivo proprietário.

Nesta etapa, o áudio e os blobs grandes continuam no IndexedDB local para respeitar o objectivo de orçamento de 0 €. A sincronização dos manifestos de projecto, perfis e funcionalidades sociais será ligada depois de validarmos as regras e o fluxo de autenticação; Firebase Storage não é activado automaticamente porque o custo e os requisitos de billing devem ser confirmados antes de aceitar uploads de media em produção.

A configuração Firebase Web é validada por `tests/firebase-config.test.mjs`. Os testes existentes mantêm alguns testes históricos de provider externo sujeitos ao ambiente local; falhas relacionadas com quota ou com o runner Vitest não são consideradas validação da configuração Firebase.

## Full-stack foundation — Firebase

A identidade do produto é **Fernando Lucoco Music**; não existe dependência do Manus para o utilizador final. O Firebase Authentication suporta contas por e-mail/password e Google, enquanto o onboarding sincroniza o nome artístico, género e instrumento em `users/{uid}`.

A persistência inicial de projectos usa manifestos pequenos em `projects/{projectId}`. O botão **Guardar sessão actual** grava nome, género, BPM, tonalidade, briefing, estado do Producer Plan, recomendação IA e preset activo. **Sincronizar cloud** faz merge não destrutivo com os projectos locais e permite recuperar manifestos noutra instalação. Os dados de áudio bruto, beats e variantes WAV continuam no navegador através de IndexedDB; esta decisão evita uploads silenciosos, protege a privacidade e mantém o orçamento inicial em 0 €.

As regras Firestore limitam a escrita ao proprietário autenticado. O cliente usa apenas a configuração pública da aplicação Web Firebase; não contém service-account JSON nem chaves administrativas. O Storage de media permanece deliberadamente fora desta primeira camada até haver uma decisão explícita sobre quotas e billing.

O fluxo cloud actual é:

```text
Onboarding → Firebase Auth → perfil/preferences
                         ↓
              guardar manifesto do projecto
                         ↓
          Firestore sync ↔ IndexedDB + Web Audio local
```

A sincronização está coberta por validação de sintaxe e a suite determinística actual tem **154 testes aprovados e 0 falhas**. Ainda falta executar QA real de autorização, reload entre dispositivos e regras Firestore com contas de teste antes de declarar a migração cloud pronta para produção.


### Message Storage

A área **Messages** está integrada no Firebase/Firestore existente e só funciona em sessão autenticada. As conversas privadas ficam em `conversations/{conversationId}`, com mensagens em `conversations/{conversationId}/messages`; o identificador é determinístico para o par de utilizadores. O cliente valida o destinatário, limita cada mensagem a 2.000 caracteres, mostra lista de conversas, thread, composer, estados vazios, erro e sincronização. O feed público não consulta nem expõe conversas privadas.

A implementação cliente está pronta e coberta por testes de contrato. As regras remotas do Firestore devem confirmar que apenas os dois participantes podem ler e escrever cada conversa. Anexos em mensagens, notificações, stories e colaboração continuam pendentes.


## Harmony vocal local

O AI Voice inclui Harmony local operacional. A cadeia mantém a voz original e mistura duas vozes transpostas por intervalos de quarta e quinta, com intensidade ajustável entre 0 e 100%. O utilizador pode fazer preview, aplicar a variante `harmony`, comparar e reverter sem apagar o Original, mantendo o resultado no ciclo de persistência de áudio existente.

Esta capacidade é **DSP local e reversível**, não uma afirmação de Harmony generativo por IA cloud. Voice Character avançado, formant-preserving dedicado e Harmony generativo continuam identificados como trabalho futuro na matriz de requisitos.


## Voice Character local — auditoria 2026-08-19

O painel **Voice Character** está agora exposto no AI Voice e usa perfis locais de timbre (`Natural`, `Warm`, `Bright`, `Intimate` e `Radio`) com intensidade mensurável. A pré-escuta, aplicação e reversão são não destrutivas: o Original permanece preservado e a variante pode ser reutilizada pelo fluxo local de persistência, Mixdown e exportação. Esta camada é DSP local orientado por perfil; não é clonagem de voz nem transformação generativa formant-preserving. Um modelo formant-preserving dedicado continua como etapa posterior e não é apresentado como concluído.

A validação desta etapa confirmou a presença dos ids de interface (`voice-character-profile`, `voice-character-intensity`, `voice-character-preview`, `voice-character-apply`, `voice-character-reset` e `voice-character-status`), a sintaxe dos módulos e os testes de contrato Harmony/Voice AI. A confirmação em workspace autenticado no Chrome desktop, Chrome Android/Samsung Galaxy A06 e Safari iPhone continua dependente de dispositivos reais.


## Auditoria de providers e automação — 2026-08-19

O AI Producer server-side selecciona **Gemini prioritariamente** quando `GEMINI_API_KEY` está configurada e usa OpenAI como alternativa configurada. As respostas são JSON validadas, com timeout e estados explícitos para quota, autenticação, indisponibilidade e resposta inválida. O áudio não é enviado ao provider; a IA produz um plano baseado em metadados e o Producer Studio materializa o arranjo e o processamento localmente.

O **Voice Character é DSP local**, não clonagem nem geração de identidade vocal. Os perfis actuais combinam filtros, compressão, ganho e saturação suave em variantes reversíveis. A automação do Mix Session suporta lanes persistentes de volume, pan e intensidade FX, com pontos ordenados, interpolação linear, adição, substituição, remoção e toggle global. Durante o Mixdown, volume e pan são agendados no Web Audio; parâmetros contínuos de compressor, limiter, EQ e wet gain também podem seguir pontos de FX. Os restantes parâmetros não contínuos continuam estáticos e estão documentados como limitação.


## Iteração funcional — Instrumentais materializados em WAV

Os instrumentais virtuais deixam de ser apenas eventos visuais na timeline. Ao adicionar piano, drums, guitarra, synth, cordas, bass ou uma take MIDI, o renderer local gera uma faixa PCM mono a 44.1 kHz, converte-a para WAV e associa-a a um clip com `mimeType: audio/wav`. O clip mantém os metadados de evento para edição e re-renderização, mas já possui uma fonte áudio materializada para playback, Mixdown e exportação.

Cada WAV instrumental é guardado no IndexedDB na store de blobs com uma chave dedicada no formato `<projectId>:instrument-<clipId>`. O manifesto local inclui também uma cópia Data URL como fallback de reprodução imediata; esta redundância é intencional para que uma falha temporária de IndexedDB não transforme o clip num bloco silencioso. O Mixdown reconhece as chaves `instrument-*` e resolve primeiro o blob dedicado antes de recorrer ao fallback inline.

A gravação vocal continua a usar `getUserMedia` + `MediaRecorder`: o evento `stop` aguarda todos os chunks, cria o Blob no MIME real do navegador, integra-o numa Audio Track da sessão activa e grava a take e o blob no IndexedDB. A validação física de permissões, monitorização, playback e exportação no Samsung Galaxy A06 continua pendente, porque não deve ser apresentada como concluída sem teste no dispositivo.

Nesta iteração, a suite determinística terminou com **193 testes aprovados, 0 falhas e 0 ignorados**. O repositório não define actualmente um script `build`; por isso, a compilação de produção deve ser adicionada como tarefa explícita antes de uma nova promoção automática. O comando de regressão disponível é:

```bash
npm test
```


### AI Producer — saída audível materializada

Quando o AI Producer aplica um plano local ou uma recomendação provider-backed, a fase de arranjo continua a gerar um manifesto determinístico e, adicionalmente, percorre os clips instrumentais gerados para produzir WAV PCM persistente. Assim, a frase de estado do Producer corresponde a uma operação observável: o utilizador pode reproduzir as Audio Tracks criadas, reabrir a sessão local e incluir essas fontes no Mixdown. Se a persistência IndexedDB falhar, o projecto conserva o `audioData` inline e o evento original para permitir re-renderização local; o erro não é convertido silenciosamente numa faixa vazia.


## Auditoria da especificação mestre — pipeline sem simulação

A API legada `simulateProductionPipeline` foi removida de `src/js/production.js`. Ela avançava estados com `setTimeout` sem produzir ou persistir áudio e, por isso, não cumpria o critério funcional da especificação mestre. O Producer Studio usa agora exclusivamente `beginProduction`, `setProductionPhase`, `completeProduction` e `failProduction` ligados ao fluxo real do `app.js`: construção do plano, materialização dos clips instrumentais, persistência IndexedDB e commit da timeline.

Foi acrescentado um teste regressivo que impede o reaparecimento de `simulateProductionPipeline` ou de `setTimeout` nesse módulo. Depois da restauração do ambiente, a suite real terminou com **194 testes aprovados, 0 falhas e 0 ignorados**. A dependência `fake-indexeddb` foi reinstalada a partir do lockfile para que os testes de persistência corressem realmente.


## V2.10 — gravação real ligada ao input e fallback de take

A gravação vocal da sessão activa usa o `deviceId` seleccionado no selector de Input ao chamar `getUserMedia`, mantendo o Record Arm e o track alvo como fonte de verdade. Depois de `MediaRecorder.stop`, a take é adicionada como clip à timeline e tenta persistir o blob nas stores IndexedDB de áudio e de takes.

Quando IndexedDB não está disponível ou falha durante a persistência, o clip recebe `audioData` inline com a Data URL original. Esse fallback é consumido pelo transporte directo e pelo mixdown local, evitando que uma take apareça na sessão mas fique silenciosa. A variante persistida continua a ser o caminho principal; o fallback não substitui nem inventa uma sincronização cloud.

A regressão é coberta por um teste de contrato dedicado. A suite do clone Git terminou esta iteração com **195 testes aprovados e 0 falhas**. Continua pendente a validação física de permissões, múltiplos microfones, monitorização com auscultadores e exportação no Samsung Galaxy A06, Chrome Android e Safari iPhone.


## V2.11 — monitorização real e recuperação segura do recorder

A cadeia de gravação foi reforçada para ambientes Chromium Android e Safari/WebKit. O recorder selecciona o `deviceId` persistido, cria o analisador de entrada a partir do stream real e agora usa `AudioContext` ou `webkitAudioContext`, retomando o contexto após a permissão do microfone para que a monitorização não fique silenciosa por permanecer em estado `suspended`.

A monitorização continua separada da captura: o ganho, o filtro de presença, o compressor local, o delay e a ambiência são encaminhados apenas quando o monitor está activo. Ao parar, todos os nós, o `requestAnimationFrame`, o medidor e o contexto de áudio são desligados. Se `saveRecording` falhar, o recorder limpa sempre o seu estado e apresenta erro explícito, em vez de ficar preso em `recording`.

Esta etapa foi validada com **197 testes aprovados, 0 falhas**, incluindo contratos determinísticos para suporte WebKit, retomada do contexto e limpeza garantida após falha de persistência. A confirmação física do microfone, da latência percebida e da monitorização com auscultadores no Samsung Galaxy A06 continua pendente.


## V2.12 — AI Producer resiliente a falhas de IndexedDB

A materialização do AI Producer agora trata cada clip instrumental como áudio real antes de concluir o plano. O renderer gera WAV PCM a 44,1 kHz, o projecto recebe `blobKey`, `audioData` inline e `mimeType`, e o mixdown resolve a fonte persistida ou a fonte inline.

Foi corrigida uma falha de consistência: quando `putAudioBlob` rejeitava uma escrita IndexedDB, a promessa de materialização abortava o plano inteiro mesmo depois de o WAV inline já ter sido criado. O processamento agora conserva o WAV inline, emite um aviso técnico e continua com os restantes clips. Assim, o Producer Plan não termina com metadata sem áudio reproduzível apenas porque o armazenamento local falhou.

A regressão está coberta por teste determinístico. A suite actual tem **199 testes aprovados, 0 falhas**. A confirmação de provider AI externo e o QA físico de gravação, playback e Mixed WAV no Samsung Galaxy A06 permanecem pendentes e não são declarados como concluídos por esta alteração.


## V2.13 — My Sounds ligado ao áudio real da timeline

A biblioteca privada **My Sounds** está agora ligada ao fluxo de produção sem clips fictícios. Ao escolher **＋ Timeline**, a aplicação lê o Blob real do som no IndexedDB, cria uma cópia Data URL para playback imediato e grava no clip os metadados `origin: "my-sounds"`, `mySoundId` e a referência `my-sound:<id>`. Se o blob privado não existir, a operação falha com uma mensagem explícita em vez de inserir uma faixa silenciosa.

Durante o Mixdown, o resolvedor reconhece clips com origem My Sounds e procura primeiro o Blob original através do `mySoundId`. A cópia inline permanece como fallback de recuperação para playback e exportação quando o IndexedDB não puder ser lido. O áudio privado continua local ao dispositivo; não é publicado nem enviado automaticamente para a cloud.

A integração foi coberta por teste determinístico de contrato e a suite oficial terminou esta iteração com **201 testes aprovados, 0 falhas e 0 ignorados**. Este resultado não substitui a validação física: continuam pendentes a verificação no Samsung Galaxy A06 de permissões de microfone, latência, playback da biblioteca e exportação do Mixed WAV, assim como a prova do provider externo do AI Producer quando houver quota e conectividade.
