# Organização do Studio — Fernando Lucoco Music

## Objectivo

A interface foi reorganizada para que o utilizador compreenda o caminho principal sem procurar entre módulos soltos: **Gravar → Construir → Editar → Misturar → Exportar**. A referência externa serviu apenas para estudar padrões públicos de fluxo e agrupamento; não foram copiados código, identidade, textos ou componentes visuais.

## Arquitectura própria

| Etapa | Área | Acção principal |
|---|---|---|
| 01 | Gravar | Criar uma take e consultar sessões guardadas |
| 02 | Construir | Explorar teclado, acordes, guitarra e Beat Maker |
| 03 | Editar | Organizar clips na timeline e usar Undo/Redo |
| 04 | Misturar | Ajustar ganho em dB, pan, mute, solo e headroom |
| 05 | Exportar | Gerar e descarregar o Mixdown WAV |

## Decisões de UX

A barra de fluxo funciona como índice persistente para a sessão. Cada etapa aponta para o módulo real através de âncoras sem duplicar estado ou criar uma segunda navegação. Os cabeçalhos numerados tornam a ordem compreensível, enquanto os controlos existentes conservam os seus IDs e contratos.

O layout é mobile-first: os cinco passos podem deslizar horizontalmente em ecrãs pequenos, os alvos permanecem tácteis e os estados de foco são visíveis. Em desktop, a introdução do fluxo fica ao lado das etapas e os módulos mantêm uma coluna de trabalho legível.

A identidade permanece própria do Fernando Lucoco Music: tipografia editorial, creme, carvão, coral e dourado, com linguagem de estúdio local-first e sem imitar a marca de qualquer produto externo.

## Fora desta entrega

A qualidade sonora do kick, a promoção do IndexedDB para leitura primária e o Vocal Engine continuam a ser assuntos separados. Esta entrega melhora a orientação e a hierarquia do produto; não declara que todos os instrumentos já têm qualidade de produção profissional.
