# Fernando Lucoco Music — QA da reconstrução do Studio

## Estado desta etapa

A shell autenticada do Studio foi reorganizada como um editor DAW escuro e denso, com sidebar de áreas, barra de sessão, toolbar contextual, transporte persistente, timeline central, cabeçalhos de tracks e inspector do Mixer. A identidade visual mantém a marca Fernando Lucoco Music e não reutiliza branding externo.

## Funcionalidade ligada

A toolbar inferior alterna entre Arrangement, Instrument, FX, MIDI Editor e Lyrics/Notes através dos destinos existentes. Lyrics/Notes mantém conteúdo localmente. A timeline continua ligada ao transporte, BPM, tonalidade, undo/redo, guardar, partilhar, exportar e Mixdown. Cada cabeçalho de faixa apresenta agora Mute, Solo e Arm REC, usando o mesmo estado persistente do Mixer. O inspector continua a expor clips, FX, bypass e automação de volume, pan e FX.

## Mobile e acessibilidade

Em viewport portrait até 820px, a navegação principal passa para uma barra inferior fixa com targets maiores, a toolbar e o transporte podem ser explorados horizontalmente, e a timeline/mixer mantêm uma largura mínima navegável sem comprimir os controlos essenciais. Os botões M/S/R expõem estado com `aria-pressed` e mantêm foco visível por teclado. A regra de movimento reduzido evita comportamento de scroll suave desnecessário.

## Validação executada

| Verificação | Resultado |
|---|---:|
| `node --check src/js/app.js` | Passou |
| `node --check src/js/studio-shell.js` | Passou |
| Suite Node/Vitest | 193 passou, 0 falhas |
| `git diff --check` | Passou |
| Preview local da rota `#timeline` | Confirmado |

## Pendências honestas

A validação em Chrome Android num Samsung Galaxy A06 e Safari iPhone continua pendente porque exige dispositivos físicos. A vista de instrumento/Piano Roll avançada, Harmony e alguns blocos técnicos do ficheiro de requisitos permanecem itens separados e não foram declarados concluídos nesta etapa. A publicação em Vercel deve ocorrer somente depois da revisão autenticada final.
