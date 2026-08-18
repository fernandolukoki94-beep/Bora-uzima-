# Fernando Lucoco Music — Studio vNext

## Direcção

O Studio vNext deixa de ser uma página de conteúdo e passa a ser uma superfície de produção fullscreen. A referência estrutural é uma DAW moderna: barra superior de transporte, faixa de ferramentas, timeline central, lista de tracks, instrumento activo em primeiro plano, inspector lateral e navegação inferior contextual. A marca, linguagem, ícones, cores e componentes serão próprios do Fernando Lucoco Music.

## Regra de acesso

Um visitante não autenticado vê apenas a landing pública, uma demonstração visual limitada e os CTAs `Começar gratuitamente` e `Entrar`. Não pode abrir gravações, instrumentais, biblioteca, teclado, projectos ou ferramentas de produção. O Studio só é montado depois de autenticação e onboarding concluídos.

## Ecrãs

| Ecrã | Função | Conteúdo principal |
|---|---|---|
| Landing | Apresentar o produto e converter para cadastro | Hero cinematográfico, waveform, piano, CTA, benefícios e demonstração curta |
| Auth | Entrar ou criar conta | Email/password, Google, recuperação e estados de erro |
| Onboarding | Personalizar o ponto de partida | Nome artístico, género, papel musical e intenção inicial |
| Home | Continuar a criação | Projectos recentes, `Novo projecto`, `Gravar agora`, sons e actividade |
| Projects | Gerir trabalho cloud/local | Cards com BPM, tonalidade, duração, estado e acções |
| Sounds | Encontrar material | Pesquisa, filtros, categorias, preview e adicionar ao Studio |
| Studio / Arrangement | Organizar a música | Transporte, timeline, markers, tracks, waveform e Add Track |
| Studio / Instrument | Tocar e gravar instrumentos | Teclado, oitava, sustain, escala, smart keys e inspector |
| Studio / FX | Processar o track | Auto-Tune, reverb, delay, presets, bypass e preview |
| Studio / MIDI | Editar notas | Piano roll, snapping, velocity, quantização e edição |
| Mix & Master | Finalizar | Canais, peak/loudness, AutoMix, presets e before/after |
| Export | Renderizar e partilhar | WAV/MP3/stems, progresso e partilha |
| Profile / Community | Identidade e publicação | Perfil artístico, posts, projectos públicos e colaboração |

## Layout do Studio desktop

O viewport é ocupado pelo Studio, sem aparência de documento. A barra superior tem marca reduzida, nome da sessão, estado de autosave, BPM, compasso, tonalidade, transporte, ganho master e acções de colaboração/partilha. A segunda linha contém `Add Track`, undo/redo, ferramentas de edição, zoom e snapping.

A coluna esquerda contém as tracks com cor, ícone, nome, mute, solo, record arm e acesso a FX. A área central contém a régua de compassos, playhead e regiões coloridas. A área inferior ou central muda conforme a vista activa: teclado, waveform, piano roll ou mixer. O inspector direito mostra apenas o contexto do elemento seleccionado, evitando menus que ocupam a aplicação inteira.

## Layout mobile

No mobile, a navegação usa tabs inferiores: Home, Projects, Create, Sounds e Profile. O Studio usa um cabeçalho compacto, transporte fixo inferior e uma única superfície activa por vez. A timeline aparece em modo arrangement; tocar numa track abre Track View; tocar no instrumento abre o teclado; tocar em FX abre uma sheet. Gestos suportados: swipe, pinch e drag, com alvos de toque grandes.

## Identidade visual

A base é `#090A0D` com superfícies `#12151A` e `#1A1F27`. Coral `#FF5A4F` é a acção de gravação e energia vocal; âmbar `#F6B73C` sinaliza instrumentos; violeta `#A855F7` sinaliza loops/IA; azul `#35A7FF` sinaliza MIDI e edição; verde `#33D69F` sinaliza áudio vocal e estados concluídos. O uso de cor deve codificar função na timeline, não ser decoração.

## Interacções prioritárias

O playhead deve mover-se durante playback; medidores devem responder ao áudio; regiões devem poder ser seleccionadas e arrastadas; `Add Track` deve abrir uma escolha funcional de Audio, Vocal, Instrument, Drum, MIDI e Beat; o teclado deve responder a touch, mouse e teclado físico; o inspector deve actualizar conforme a track seleccionada; todos os processos devem mostrar loading, sucesso, erro e offline.

## Primeira entrega técnica

A primeira entrega não tenta construir todas as funcionalidades do documento de 2.358 linhas de uma vez. Ela substitui a shell visual e o fluxo de acesso, cria as vistas reais do Studio e liga os controlos que já existem: gravação, IndexedDB, waveform, Auto-Tune, FX, Mixdown, exportação e AI Producer. Depois serão adicionados MIDI avançado, drum machine, sampler, stems, AutoMix, comunidade e distribuição.
