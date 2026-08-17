# Auditoria de redesign — Fernando Lucoco Music

## Ponto de partida confirmado

URL auditada: https://fernando-lucoco-music.vercel.app/#recording-workspace

A interface actual tem identidade própria forte, com a marca Fernando Lucoco Music, paleta clara com coral, dourado e fundos creme, e uma linguagem editorial/humanizada. No entanto, a experiência ainda está organizada como uma página de apresentação longa com módulos verticais empilhados.

O cabeçalho contém ligações para Como funciona, Estúdio e Sobre. O corpo começa com hero, captura e histórico de sessões, e depois apresenta Producer Studio, Instrument Lab, Beat Maker, Timeline, Mixer, efeitos e exportação em sequência vertical. Existe uma barra de fluxo Gravar → Construir → Editar → Misturar → Exportar, mas ela funciona sobretudo como âncoras da mesma página e não como uma arquitectura persistente de Studio.

## Problemas de organização

O utilizador precisa atravessar muitos módulos para encontrar a área de produção. Instrumentos, Beat Maker, timeline e mixer aparecem como blocos independentes, em vez de constituírem uma estação de trabalho com painel lateral, área central e inspector contextual. A Direcção de Produção e o AI Producer estão visíveis, mas o estado vazio e a dependência de uma take fazem a funcionalidade parecer mais uma explicação do que uma ferramenta operacional.

A timeline está mais abaixo e não ocupa o papel de centro permanente. A biblioteca de sons não existe como área separada de descoberta; os instrumentos aparecem em cartões e controlos técnicos. Os efeitos, presets, A/B e exportação também ficam dispersos pelo scroll. Esta é a principal diferença em relação à organização observada no BandLab.

## Direcção de redesign

A nova experiência deve manter a identidade Fernando Lucoco Music, mas adoptar uma arquitectura de Studio:

| Camada | Função |
|---|---|
| Navegação principal | Criar, Studio, Sons, AI Producer, Master e Projectos |
| Barra de transporte | Play, pause, stop, tempo, tonalidade, duração e estado de sessão |
| Sidebar esquerda | Biblioteca de sons, instrumentos, loops e acções de adicionar à timeline |
| Canvas central | Timeline multifaixa como centro da produção |
| Inspector direito | Track seleccionada, volume, pan, Auto-Tune, FX, bypass e edição |
| AI Producer drawer | Briefing, intenção, arranjo, instrumentalização, vocal, mix e master como acções concretas |
| Barra inferior | Original/Produced, peak/loudness, A/B, Mixdown, manifesto e partilha |

No mobile, a mesma estrutura deve converter-se em tabs inferiores e drawers/sheets: Studio, Sons, IA, FX e Exportar. Não deve ser simplesmente uma coluna desktop comprimida.
