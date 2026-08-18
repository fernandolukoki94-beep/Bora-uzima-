# Auditoria de referência: organização do BandLab

Data: 2026-08-18

Esta auditoria usa apenas documentação e páginas oficiais do BandLab como referência de organização de produto. O objectivo é extrair padrões de fluxo e arquitectura de interface para o Fernando Lucoco Music, sem copiar marca, textos, identidade visual ou código.

## Padrões relevantes

A página pública do BandLab posiciona o produto como uma plataforma de criação, colaboração e publicação, com uma entrada clara para começar e áreas distintas para Studio, AI Tools, Effects, Mastering e Sounds. A experiência pública deve, portanto, separar descoberta e entrada no produto do trabalho profundo no DAW.

A documentação oficial descreve um fluxo em que o utilizador se regista, escolhe **Create → New Project** e só então entra no Studio. Dentro do Studio, o primeiro passo é escolher um tipo de faixa: Voice/Audio, instrumento virtual, importação Audio/MIDI ou biblioteca de sons. Isto valida a ideia de um onboarding orientado à criação, em vez de expor todos os módulos numa página única.

A documentação também descreve uma hierarquia de trabalho: criar projecto, adicionar faixa, escolher fonte de som, gravar ou importar, configurar input/metrónomo, aplicar efeitos e expandir o arranjo. O Studio é uma área própria, com timeline, tracks e controlos contextuais.

A referência oficial sobre o Studio distingue Track View, Arrangement View, Track Menu e Mix/Multi-track View. O painel de mix permite mute, solo, apagar, duplicar, recolher e renomear tracks. O produto também separa efeitos/presets, AutoPitch, instrumentos, loops, importação e masterização como acções do fluxo, não como blocos de texto na landing page.

## Aplicação ao Fernando Lucoco Music

O redesign deve ter quatro camadas: (1) landing pública curta com CTA; (2) onboarding de preferências musicais e identidade; (3) autenticação e criação de projecto; (4) workspace do Studio com navegação persistente e inspector contextual.

A navegação proposta é: **Início**, **Criar**, **Sons**, **AI Producer**, **Studio**, **Mix** e **Exportar**. No mobile, esta navegação deve converter-se numa barra inferior ou drawer; no desktop, numa sidebar compacta.

O onboarding pode recolher artista de referência, estilos, instrumento principal, objectivo da sessão e preferência vocal. Essas respostas devem ser guardadas como preferências do perfil após autenticação, não usadas como dados fictícios. O utilizador deve poder saltar ou editar as preferências mais tarde.

O Studio deve substituir a página longa por um shell de três zonas: sidebar de áreas, canvas central com timeline/recording e inspector à direita ou em bottom sheet no mobile. O motor Web Audio e o IndexedDB continuam locais; Firebase fica responsável por conta, perfil e manifestos de projecto, não por áudio bruto nesta fase.

## Fontes

[1] BandLab, página pública: https://www.bandlab.com/?lang=en

[2] BandLab Help Center, Getting Started with the BandLab Studio: https://help.bandlab.com/hc/en-us/articles/115002945153-Getting-Started-with-the-BandLab-Studio

[3] BandLab, login: https://www.bandlab.com/login?lang=en

[4] BandLab Blog, The Beginner's Guide to BandLab Studio: https://blog.bandlab.com/studio-faq/
