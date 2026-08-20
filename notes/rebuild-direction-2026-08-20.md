# Direcção de reconstrução do Studio

A reconstrução não vai copiar BandLab nem importar a sua identidade. Vai usar apenas princípios espaciais comuns a DAWs profissionais: browser persistente, editor central, canal/master à direita, transport fixo e edição MIDI junto da Timeline.

## Estrutura visual

O Studio autenticado será uma consola contínua, sem cartões grandes, gradientes decorativos ou blocos de landing page. A barra superior terá nome da sessão, estado de armazenamento local, undo/redo, guardar e exportar. A segunda barra será um transport compacto com play, pause, stop, posição, BPM e tom. O workspace será dividido em três zonas estáveis: browser de sons à esquerda, editor central e mixer/channel strip à direita. A faixa inferior do editor conterá teclado e Piano Roll reais.

## Linguagem visual

A base será graphite quase preto, superfícies cinza-carvão, linhas finas e tipografia compacta. O único acento de marca será cobre/âmbar, reservado para playhead, REC, foco e estados activos. Tracks terão cores semânticas discretas: vocal turquesa, drums âmbar, MIDI violeta e FX azul. Não serão usados halos neon, glassmorphism, sombras exageradas ou gradientes no workspace.

## Interacção

Cada zona terá uma responsabilidade clara. Arrangement mostra clips, lanes e comandos de edição. Instrument mostra o laboratório instrumental completo. Beat Maker mostra a grelha e materializa o groove. Mixer mostra canais, meters, faders, mute/solo/arm e inspector. Record mostra captura, monitorização explícita para fones, meter e takes. O AI Producer mostrará sempre o estado real do provider ou o plano local determinístico.

## Critérios de aceitação

A gravação deve produzir um clip audível na Timeline e no Mixdown mesmo quando o áudio está apenas no IndexedDB. O Play deve resolver blobs persistidos antes de criar elementos Audio. O layout deve parecer uma ferramenta de produção contínua no primeiro viewport, e não uma página de marketing com caixas empilhadas. Todas as alterações devem continuar no repositório e ser publicadas no Vercel.

## Verificação visual local

A consola local foi aberta com o estado de sessão preparado. A nova hierarquia ficou visível: browser de sons estreito à esquerda, editor central, Mixer vertical à direita e faixa MIDI inferior. A superfície deixou de parecer uma sequência de cartões de landing page e passou a ter linhas contínuas, superfícies graphite e acento cobre.

Ainda foi observada uma limitação de densidade: em viewport de 895px, muitos labels e controlos do Timeline/MIDI ficam comprimidos. A próxima passagem deve reduzir texto repetido, aumentar a área útil do editor quando possível e assegurar que os comandos prioritários permanecem legíveis. A arquitectura está correcta, mas o acabamento precisa de uma ronda de legibilidade/responsividade antes do deploy.

## Verificação visual v3

A segunda passagem de legibilidade foi carregada correctamente. Em Arrangement, os nomes das tracks e os switches M/S/R continuam visíveis, enquanto a descrição repetida da origem foi reduzida em larguras compactas. A Timeline permanece dominante e os elementos funcionais do MIDI e Mixer continuam presentes. A edição detalhada usa scroll horizontal na lane, comportamento aceitável para uma DAW compacta. O layout está pronto para validação funcional e commit, sem alegar que esta viewport substitui um monitor grande.
