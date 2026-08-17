# Fernando Lucoco Music — Studio Redesign

## Direcção

O redesign adopta a organização de uma estação de produção musical moderna: navegação persistente, timeline como centro, biblioteca e instrumentos numa camada própria, AI Producer como painel de decisão e Inspector para vocal, efeitos, mix, master e exportação. A referência é a arquitectura de experiência observada no BandLab; a marca, a tipografia, as cores e o conteúdo continuam próprios do Fernando Lucoco Music.

## Arquitectura de áreas

| Área | Papel | Estado inicial |
|---|---|---|
| Criar | Nova sessão, gravação e importação de beat | Activo |
| Studio | Timeline, transporte, tracks e clips | Activo |
| Sons | Instrument Lab, Beat Maker e presets locais | Activo |
| AI Producer | Briefing, arranjo, instrumentalização, vocal, mix e master | Activo após take |
| Mix | Mixer, Auto-Tune, Reverb, Delay, bypass e medidores A/B | Activo após áudio |
| Master/Exportar | Mixdown, manifesto, partilha e restauração | Activo após Mixed |

## Layout desktop

A aplicação usa uma barra superior de navegação do Studio, uma barra de transporte contextual, um painel lateral de criação/sons, um canvas central de timeline e um inspector contextual. No protótipo existente, esta arquitectura será introduzida sem remover os IDs e handlers do motor local: os módulos existentes passam a ser apresentados como cartões de uma estação de trabalho, com a timeline e o AI Producer em maior destaque.

## Layout mobile

Em portrait, a barra superior reduz-se ao nome e estado da sessão. As áreas tornam-se tabs inferiores ou drawers: Studio, Sons, IA, FX e Exportar. A timeline permanece horizontalmente navegável, enquanto o inspector abre como sheet. Todos os alvos de toque mantêm pelo menos 44px.

## Identidade visual

A identidade mantém Obsidian `#10100F`, Paper `#FFFAF2`, Coral Bora `#FF674D`, Sun Gold `#F5BD45`, Mint `#91D5B6` e uma nova camada de superfícies de Studio em `#171A1C` / `#202528`. O resultado deve parecer um instrumento profissional nocturno com acentos quentes, não uma cópia visual do BandLab.

## Regras de experiência

A criação começa por uma take, um beat importado ou uma intenção para o AI Producer. As decisões da IA devem aparecer como tracks/clips editáveis. Original, Enhanced, Pitch Corrected e Mixed permanecem reversíveis. A interface deve comunicar claramente o que está disponível, o que depende de áudio e o que é execução local/fallback.
