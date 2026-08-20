# Decisão de arquitectura — Studio como DAW

## Problema observado

A aplicação tem módulos suficientes para um estúdio musical, mas a interface apresenta-os como uma longa página. A sidebar, a barra de seis passos, a toolbar de editor e a control room competem pelo papel de navegação principal. Além disso, a implementação de foco esconde vários painéis, mas deixa o `workspace` sempre visível, o que impede que `Criar`, `Sons`, `AI Producer`, `Studio` e `Mix` sejam modos verdadeiramente distintos.

## Decisão

O Studio passa a usar um único modelo mental: **projecto actual → modo de trabalho → centro de operação → inspector/estado → guardar/exportar**.

A sidebar será a navegação persistente dos modos. A barra de sessão será o estado do projecto actual e as acções de guardar/publicar. A toolbar inferior será o selector contextual do editor. O centro mostrará somente a área activa, sem empilhar todos os módulos. O transporte permanece acessível no modo de produção, e a timeline/mixer continuam a ser os destinos de Arrangement e Mix.

## Mapa de modos

| Modo | Conteúdo activo |
|---|---|
| Home | Estado local, projectos recentes e entrada rápida. |
| Projectos | Biblioteca, pesquisa, filtros e abertura de sessões. |
| Criar | Configuração da sessão, microfone, monitorização e lista de takes. |
| Sons | Instrument Lab, Beat Maker, Sound Library e My Sounds. |
| AI Producer | Plano, análise, vocal, instrumentalização e processamento reversível. |
| Studio | Arrangement, timeline, clips e transporte. |
| Mix | Timeline + mixer contextual, inspector e exportação. |
| Artist | Community, Profile e Messages fora do caminho principal de produção. |

## Reutilização

A alteração reutiliza `studio-shell.js`, `data-studio-area`, `studio-view-hidden`, os módulos de áudio e os testes existentes. Não será criado um segundo Studio nem uma simulação visual paralela. A mudança principal é fazer o estado `data-studio-view` controlar o conjunto de painéis visíveis e garantir que os itens da sidebar têm todos o mesmo contrato de navegação.

## Alternativa descartada

Não será feita uma reescrita integral em React nem uma cópia do BandLab. O projecto já tem uma aplicação estática funcional, persistência local, motor de áudio e testes; uma reescrita aumentaria o risco de quebrar gravação, timeline, IndexedDB e exportação.
