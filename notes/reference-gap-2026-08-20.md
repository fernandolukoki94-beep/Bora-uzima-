# Gap de produto face à referência DAW

## Referência observada

A referência apresenta uma única janela de produção com transporte compacto no topo, browser vertical de instrumentos e efeitos à esquerda, arrangement/timeline dominante no centro, piano roll integrado na região inferior e mixer vertical persistente à direita. Os elementos partilham a mesma grelha, a mesma linguagem de controlos e o mesmo estado de sessão. O utilizador consegue perceber onde estão os instrumentos, onde se edita o MIDI, onde se mistura e onde se reproduz sem atravessar páginas de produto.

## Studio actual

O Studio Bora Uzima ainda é uma aplicação modular com vários painéis herdados: Sound Library, Instrument Lab, Timeline, Mixer, Beat Maker, My Sounds, AI Producer e Record têm regras e densidades diferentes. A composição actual consegue colocar alguns desses painéis lado a lado, mas não os transforma numa consola única. A Timeline pode aparecer vazia numa sessão nova, o Mixer pode mostrar apenas Master sem canais, o Piano Roll aparece como uma grelha de passos simplificada e o AI Producer funciona como uma página de operações separada, não como parte do mesmo projecto visual.

## Diferenças que têm de ser resolvidas

| Dimensão | Referência | Studio actual | Correcção necessária |
|---|---|---|---|
| Entrada | A aplicação abre como estação de trabalho | O utilizador atravessa uma shell de produto e pode encontrar espaços vazios | Abrir uma sessão DAW clara com estado inicial explícito |
| Navegação | Browser, editor e mixer persistem na mesma grelha | Tabs trocam módulos com estruturas diferentes | Uma consola principal com modos internos previsíveis |
| Timeline | Arrangement é o centro visual da produção | Pode ficar vazia ou abaixo de módulos | Timeline central dominante com track lane inicial e transportes claros |
| Piano roll | Editor MIDI integrado e legível | Grelha curta de passos com instruções pouco claras | Piano roll com nota seleccionada, play, record MIDI e materialização visível |
| Mixer | Canais verticais e medidores como parte do primeiro viewport | Master/Inspector ficam vazios sem projecto | Canais de sessão e estados idle/signal claramente diferenciados |
| Instrumentos | Browser contextual e consistente | Teclado, guitarra, groove e Piano Roll estão juntos como bloco heterogéneo | Browser de sons separado do editor de performance |
| Produção vocal | Gravação e processamento fazem parte do mesmo fluxo | Record está separado e depende de microfone sem preflight claro | Pré-voo de microfone, gravação, waveform e take na mesma sessão |
| AI Producer | Assistência contextual ao projecto | Página grande separada e provider indisponível | Painel contextual ligado à sessão, com fallback local honesto e acções executáveis |
| Feedback | Cada acção altera um estado editorial visível | Toasts existem, mas o estado do projecto nem sempre muda no primeiro viewport | Estados persistentes: preparado, a tocar, gravado, materializado, misturado, bloqueado |

## Critério de sucesso

A reconstrução só deve ser considerada satisfatória quando uma pessoa sem explicação consegue abrir uma sessão, identificar browser/editor/mixer, tocar uma tecla, criar uma região MIDI, gravar ou importar uma take, ver canais no mixer, executar o Producer Plan, fazer Mixdown e exportar sem descobrir a arquitectura por tentativa e erro.
