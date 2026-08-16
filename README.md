# Fernando Lucoco Music

**Fernando Lucoco Music** é um estúdio vocal web-first para transformar ideias em demos com um fluxo simples, claro e local-first. A primeira versão foi desenhada para funcionar directamente no navegador, sem custos externos e sem enviar áudio automaticamente para um servidor.

> A tua voz. A tua demo. O teu próximo take.

## Site online

A versão pública está disponível em [fernando-lucoco-music.vercel.app](https://fernando-lucoco-music.vercel.app/) e também em [fernandolukoki94-beep.github.io/Bora-uzima-](https://fernandolukoki94-beep.github.io/Bora-uzima-/). O repositório mantém o nome técnico `Bora-uzima-` para não quebrar o histórico e os links existentes, mas a identidade pública do produto passa a ser **Fernando Lucoco Music**.

## O que está implementado

| Área | Estado | Descrição |
|---|---:|---|
| Landing page | Pronto | Experiência responsiva com posicionamento do produto e autoria de Fernando Lucoco. |
| Gravação vocal | Pronto | Usa `MediaRecorder` e `getUserMedia` quando o navegador suporta acesso ao microfone. |
| Feedback de gravação | Pronto | Estado de gravação, temporizador, botão de parar e feedback visual. |
| Sessões locais | Pronto | Nome, tratamento vocal, género, duração, data e estado são guardados no `localStorage` deste navegador. |
| Reprodução e descarregamento | Pronto | Takes novas podem ser reproduzidas e descarregadas no próprio navegador. |
| Eliminação local | Pronto | Cada sessão pode ser apagada com confirmação explícita. |
| Presets de produção | Pronto como interface visual | Natural é referência; Auto-Tune, Vocal brilhante/íntimo e direcções de género ficam marcados como intenção/em desenvolvimento e não processam o áudio. |
| Efeitos locais de ganho e fade | Pronto em V1 experimental | Aplica +3 dB ou fade in/out com Web Audio API e exporta WAV PCM localmente; a take original é preservada até o utilizador aplicar o efeito. |
| Processamento musical avançado | Não feito | O fluxo PROCESSING → MIXING → MASTERING continua a ser uma simulação visual; não existe ainda EQ, compressor, reverb, Auto-Tune, IA ou masterização. Ganho e fade são os únicos efeitos reais disponíveis. |
| Upload e sincronização | Não feito | Não é activado nesta versão; evita custos e mantém o controlo local do áudio. |

## Compatibilidade móvel web

A interface foi optimizada para Safari iPhone e Chrome Android com alvos touch de pelo menos 44px, campos de entrada de 16px para evitar zoom involuntário, safe-area no aviso flutuante, cartões empilhados em ecrãs pequenos, reprodução `playsinline`/`webkit-playsinline`, pausa automática de outros players, fallback MIME (`audio/mp4` → `audio/webm` → `audio/ogg`) e mensagens específicas para permissões, HTTPS, microfone ausente e interrupção ao sair da página.

A verificação automatizada foi executada no preview local com Chromium e confirmou markup, MIME candidates, reprodução, descarregamento, eliminação e limpeza de `localStorage`. **Ainda não afirmo compatibilidade perfeita em dispositivos físicos:** falta testar manualmente um iPhone com Safari e um Android com Chrome, incluindo permitir/negar microfone, bloquear o ecrã, voltar à aplicação e reproduzir uma take longa.

## QA verificado

A versão publicada foi verificada com uma take sintética no navegador: reprodução, descarregamento, eliminação com confirmação e sequência visual `PROCESSING` → `MIXING` → `MASTERING` → `COMPLETED`. Também foram executados testes determinísticos do ganho +3 dB e do fade in/out, medindo RMS/atenuação e preservação do original. O áudio sintético foi removido no final do teste. O detalhe está em [`qa-web-findings.md`](./qa-web-findings.md).

> Importante: estes estados são uma simulação honesta da experiência de produção. O projecto ainda não executa DSP, auto-tune, remoção de ruído, mixing, mastering ou IA reais.

## Documentação do projecto

A estrutura e as decisões desta iteração estão em [`docs/site-structure.md`](./docs/site-structure.md). O roadmap V2–V6 está em [`docs/product-roadmap.md`](./docs/product-roadmap.md), e a descrição técnica recomendada para currículo/portfólio está em [`docs/portfolio-description.md`](./docs/portfolio-description.md). O índice de QA está em [`docs/qa-index.md`](./docs/qa-index.md), com os relatórios detalhados em [`qa-web-findings.md`](./qa-web-findings.md) e [`qa-mobile-findings.md`](./qa-mobile-findings.md).

As páginas `manutencao.html`, `python.html`, `redes.html` e `web.html` são legadas do portfólio anterior. Foram preservadas nesta fase para não quebrar links antigos, mas não representam funcionalidades do produto musical.

## Como testar localmente

Clone o repositório e sirva a pasta com qualquer servidor HTTP local. O acesso ao microfone costuma exigir `localhost` ou HTTPS; abrir o ficheiro directamente pode impedir a permissão de gravação em alguns navegadores.

```bash
git clone https://github.com/fernandolukoki94-beep/Bora-uzima-.git
cd Bora-uzima-
python3 -m http.server 8000
```

Depois, abra `http://localhost:8000`, autorize o microfone e use a secção **O teu estúdio, aqui**. As sessões guardadas ficam apenas no navegador e podem ser removidas limpando os dados locais do site.

## Direcção de produto

O projecto segue uma estratégia **web-first**. A V1 já inclui gravação, gestão local, reprodução e um primeiro ganho experimental local exportado como WAV. O próximo ciclo deve validar esse efeito com áudio real e depois evoluir para uma pipeline DSP testável, antes de considerar backend, contas, cloud, IA ou colaboração. Só após essa validação será retomada a transformação numa aplicação nativa para Android e iOS.

A implementação mobile em `/home/ubuntu/bora-uzima-mobile` permanece separada e em espera. Ela não substitui a experiência web pública e conserva o histórico técnico da primeira exploração com Expo/React Native.

## Identidade e autoria

O produto é dirigido e desenvolvido por **Fernando Lucoco**. O nome técnico do repositório não foi alterado nesta fase para preservar o histórico do projecto original e os endereços já partilhados.

O contrato proposto para uma futura assistência IA está em [`docs/ai-backend-contract.md`](./docs/ai-backend-contract.md). Ele define pedidos server-side apenas com metadados na primeira fase, autenticação futura, limites de payload, rate limiting, privacidade, estados de erro e a regra de que nenhuma credencial chega ao cliente.

## Stack actual

- **Frontend:** HTML5, CSS moderno e JavaScript sem dependências externas.
- **Áudio:** MediaDevices API, MediaRecorder API e Web Audio API para ganho e fade locais experimentais.
- **Persistência:** localStorage, com dados mantidos localmente por instalação/navegador.
- **Publicação:** GitHub Pages e Vercel, com alias público `fernando-lucoco-music.vercel.app`.

## Roadmap resumido

A versão web continua como prioridade. Os primeiros efeitos áudio reais locais — ganho de +3 dB e fade in/out para WAV — já existem; o próximo marco é validar ambos com takes reais e criar testes de qualidade antes de adicionar efeitos DSP adicionais. O roadmap completo e os critérios de entrada estão em [`docs/product-roadmap.md`](./docs/product-roadmap.md).

## Licença

Este projecto é disponibilizado sob a licença MIT.

---

**Fernando Lucoco Music · 2026**

## Actualização de arquitectura e IA segura

Nesta iteração, o estúdio deixou de concentrar toda a lógica áudio num único ficheiro. O browser carrega agora módulos separados para `recorder`, `storage`, `player`, `production` e o orquestrador `app`, mantendo a interface e o fluxo local existentes.

A gravação e a reprodução continuam reais no navegador. Os estados `PROCESSING`, `MIXING` e `MASTERING` continuam explicitamente visuais; ainda não existe DSP, Auto-Tune, mixagem, masterização ou IA aplicada ao áudio.

Não foi adicionada nenhuma chave OpenAI, Expo Dev ou token ao site. Essa decisão é intencional: credenciais no HTML ou JavaScript público ficam expostas. Uma futura integração IA deverá ser server-side, com variáveis de ambiente seguras, e só será activada depois de existir uma pipeline áudio real e testável. A análise está em [`docs/ai-integration.md`](./docs/ai-integration.md).

A execução passo a passo do ficheiro está consolidada em [`docs/requirements-matrix.md`](./docs/requirements-matrix.md). A matriz distingue funcionalidades concluídas, validações que ainda exigem hardware físico e fases futuras como DSP, contas, cloud e IA.

## Correcções da avaliação mais recente

A gestão de áudio passou a distinguir explicitamente `originalAudioData` de `processedAudioData`. O download original conserva o formato de origem e o download processado usa a extensão correspondente ao MIME real, incluindo `audio/wav` e `audio/x-wav`. Os efeitos locais são aplicados sem apagar a gravação original, permitindo comparar e reprocessar a take.

O ganho +3 dB mede o pico antes da conversão PCM e aplica headroom/limitação para reduzir clipping. Esta protecção não substitui um limiter de masterização profissional. O pipeline visual foi renomeado conceptualmente para **simulação de produção**, porque `PROCESSING`, `MIXING`, `MASTERING` e `COMPLETED` continuam a representar estados de interface, não processamento avançado.

Os achados completos estão em [`docs/evaluation-findings.md`](./docs/evaluation-findings.md) e a evidência deste ciclo está em [`qa-web-findings.md`](./qa-web-findings.md). O URL oficial de demonstração continua a ser [fernando-lucoco-music.vercel.app](https://fernando-lucoco-music.vercel.app/); o GitHub Pages é apenas uma alternativa estática documentada.

## Ajuda de utilização e armazenamento

A interface inclui agora uma faixa de ajuda junto ao workspace: autorizar o microfone, gravar uma take curta, ouvir o original, descarregar versões e compreender que o áudio fica local neste navegador. Em dispositivos móveis, o teste deve ser feito em HTTPS ou localhost, começando por uma take curta antes de bloquear o ecrã ou mudar de aplicação.

O fluxo de take controlada foi verificado no preview local com áudio sintético: o original é preservado, o processamento é separado e os downloads WAV mantêm extensões coerentes. O teste com voz real continua a exigir um iPhone com Safari e um Android com Chrome. A avaliação de IndexedDB está em [`docs/storage-evaluation.md`](./docs/storage-evaluation.md); nesta iteração não houve migração destrutiva, porque a aplicação precisa primeiro de um adaptador assíncrono com fallback e testes de quota.
