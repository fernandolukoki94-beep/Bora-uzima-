# Auditoria de estrutura do Studio — 20 de agosto de 2026

## Site publicado

A landing pública do Fernando Lucoco Music mostra essencialmente um hero, uma pré-visualização de gravação e duas CTAs. O visitante não percebe imediatamente o espaço de trabalho completo; o Studio e os módulos de produção ficam depois de onboarding/autenticação. A primeira leitura é de landing page, não de DAW.

## Estrutura encontrada no repositório

O `index.html` já contém uma base extensa: sidebar do Studio, Projectos, Home, barra de sessão, toolbar de Arrangement/Instrument/FX/MIDI/Lyrics, control room, gravação, projectos locais, Producer Studio, timeline, mixer, Instrument Lab, Beat Maker, Sampler, Looper, Sound Library, My Sounds, Community, Profile e Messages.

O problema principal não é ausência de módulos. É a falta de uma hierarquia operacional única. Há uma sidebar, uma barra inferior, um fluxo de seis passos, uma control room e uma grande sequência vertical de módulos; vários sistemas de navegação apontam para a mesma sessão, mas não deixam claro qual é o centro de trabalho actual.

## Comparação de referência

A pesquisa por “Bad Lab” devolveu principalmente o BandLab, cuja promessa pública é criar, gravar, misturar e colaborar num projecto musical de início ao fim. A página BandLab abriu sem conteúdo interactivo renderizado nesta sessão, por isso não vou declarar detalhes visuais que não pude observar directamente. A referência conceptual útil confirmada é a organização por projecto/Studio/fluxo de produção, não a cópia de código ou de identidade.

## Hipótese de reorganização

A experiência deve ter um único centro: `Projecto actual → Control Room`. A sidebar deve representar áreas de trabalho persistentes; a barra superior deve representar estado da sessão e transporte; o centro deve alternar entre Arrangement, Record, Instruments, Vocal, Mix e Export; o painel direito deve funcionar como Inspector contextual. Community/Profile/Messages devem sair do caminho principal de produção e ficar numa área secundária.

## Verificação local do shell

Sem iniciar sessão, foi activado apenas o evento de auditoria local `fernando-authenticated` para observar o Studio. O modo `studio-home` ficou activo e o shell ocultou `projects-panel`, `recording-workspace`, `control-room`, `workspace`, `producer-studio`, `instrument-lab`, `sound-library`, `my-sounds`, `beat-maker`, `timeline`, `mixer-panel`, `community-panel`, `profile-panel` e `messages-panel`. Isto confirma que a nova lógica está a isolar modos em vez de empilhar módulos.

## Verificação do modo Studio

A navegação local abriu `Studio` e confirmou a nova composição: barra de sessão com modo `Studio`, tabs editoriais, Control Room com transporte e tracks, Signal Chain/inspector, Timeline e Mixer. Os módulos de Sons, AI Producer, Community e Profile não aparecem nesse modo. A CTA `Exportar WAV` aponta agora para o modo `Studio`/Mix, não para o botão isolado `timeline-mixdown`.

## Verificação dos modos Sons e AI Producer

`Sons` mostrou Instrument Lab, Sound Library, My Sounds e Beat Maker como uma área única de criação sonora. `AI Producer` mostrou apenas o cabeçalho do Producer Studio e o seu estado vazio contextual, sem arrastar a timeline e o mixer para dentro da área. A barra de sessão manteve o rótulo de modo correcto em ambos os casos.

## Verificação do modo Mix

`Mix` mostrou a mesma Control Room com Signal Chain, Timeline e Mixer. O modo conserva os controlos reais de ganho, pan, limiter, bypass, undo/redo, save e exportação, mas removeu as áreas de instrumentos e AI Producer da apresentação activa.

## Verificação do modo Criar

`Criar` mostrou apenas a configuração de nova sessão, direcção de produção, briefing, gravação, monitorização de entrada, métricas e lista de sessões. Sons, AI Producer, timeline e mixer ficaram fora da apresentação activa. O formulário mantém os controlos reais existentes (`record-main`, input device, monitorização e persistência local).

## Verificação do modo Projectos

`Projectos` mostrou uma biblioteca independente com pesquisa, filtros Todos/Activos/Arquivados, CTA Novo projecto e estado vazio explícito. O editor e as áreas de áudio ficaram escondidos, mantendo apenas a barra de sessão e as acções de conta.

## Falha encontrada — modo Criar

A asserção E2E local encontrou que `recording-workspace` ainda era o `id` do help strip. Como o modo focado esconde help strips, o alvo da navegação `Criar` ficava invisível, embora o formulário `workspace` aparecesse. Classificação: **BROKEN**. Correcção necessária: mover o id `recording-workspace` para o workspace real e renomear o help strip para `studio-help-strip`, actualizando o grupo de vistas sem remover a funcionalidade de gravação.

## Correcção confirmada — modo Criar

Depois de mover o id e recarregar a aplicação, a verificação local confirmou `active: recording-workspace`, classe `workspace studio-focus-target`, `display: grid` e `visible: true`. A falha BROKEN foi corrigida.

## Verificação mobile

A captura real de 390×844 da landing pública mostrou o logotipo, o hero, os dois CTAs, os indicadores de privacidade/exportação e o cartão de gravação sem cortes horizontais ou overflow visível. A nova arquitectura está limitada ao estado autenticado, por isso a landing mobile permanece independente.

## Produção Vercel

O Vercel criou o deployment de produção `dpl_4xCM79C2Jvn82tazaeyQPXt5wXro` para o commit `26820a49f94af494bfb2c58bca4a426751b66f59`, com estado `READY`. O domínio `https://fernando-lucoco-music.vercel.app/` respondeu e carregou a landing pública com cache-buster. A verificação pública não autentica no Studio; por isso a validação do shell autenticado foi feita localmente sem credenciais reais.
