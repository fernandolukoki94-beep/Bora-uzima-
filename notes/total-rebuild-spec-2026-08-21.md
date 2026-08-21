# Especificação da reconstrução total do Bora Uzima

## Decisão

O design público actual será removido como direcção visual. Não será feita outra sobreposição incremental sobre o hero existente. A nova experiência deve apresentar o Bora Uzima como uma estação de produção musical desde o primeiro contacto, com uma entrada visual mais próxima de um workspace e menos próxima de uma página editorial.

## O que permanece

O motor local-first de áudio, a captura com MediaRecorder, o retorno de monitorização, a resolução de clips persistidos em IndexedDB, o modelo de projectos/tracks/clips, o transporte, a Timeline, o Piano Roll, o teclado, o Beat Maker, o Mixer, o Producer Plan local, a exportação WAV, o Firebase e os endpoints server-side permanecem como contratos funcionais.

## O que será substituído

Será substituída a composição pública actual: hero com grande headline editorial, cartão de pré-visualização isolado, excesso de espaço vazio, navegação pública genérica e secções de marketing que escondem a ferramenta. Também será substituída a aparência de módulos separados dentro do Studio por uma shell de produção única, com barra de transporte, browser contextual, editor principal e mixer persistente.

## Nova direcção visual

A direcção será **Control Room / Tape Desk**: fundo quase preto, cinza carvão, branco quente, amarelo de medidor e um único acento coral/cobre reservado a Record e estados activos. Tipografia sans condensada para labels técnicos e sans legível para conteúdo. Sem gradientes grandes, sem glow, sem cartões flutuantes excessivos e sem decoração que pareça gerada por IA.

A primeira viewport deverá mostrar: nome da sessão e estado no topo; transporte e tempo; browser de sons/inputs à esquerda; Arrangement central com quatro tracks preparadas e ruler; Piano Roll/MIDI dock inferior; Mixer vertical à direita; e um CTA de gravação evidente. A entrada pública poderá manter autenticação, mas deve explicar o workspace através de uma composição visual de consola, não através de uma promessa abstracta.

## Critério de aceite

Uma pessoa deve conseguir perceber a relação entre gravar, editar, tocar MIDI, misturar e exportar sem atravessar uma sequência de páginas. Cada botão visível deve manter um handler real ou ser removido. A reconstrução só será publicada depois de validação sintáctica, suite focada, teste de produção HTTP e verificação visual no primeiro viewport.

## Verificação visual Control Room v2

A página pública anterior foi substituída com sucesso. A primeira viewport agora apresenta uma Control Room com browser de sources à esquerda, Arrangement no centro, Mixer à direita, transport e estados de sessão. O headline foi reduzido a uma função de orientação e a preview mostra tracks vocal/drums/MIDI, em vez de uma placa decorativa isolada.

A composição local parece mais próxima de um produto de produção musical. O preview ainda pode ganhar escala vertical em monitores grandes, mas a hierarquia já comunica imediatamente browser/editor/mixer e a página deixou de ser um hero editorial vazio.

## Verificação visual Control Room autenticada

A shell autenticada foi aplicada aos docks reais. O padding vertical herdado da regra global `section` foi removido, eliminando o grande espaço vazio acima da Timeline. A composição agora inicia directamente após a barra de sessão e os tabs, com Browser à esquerda, Arrangement central, Mixer à direita e MIDI/Piano Roll no dock inferior. O aspecto ainda precisa de validação funcional, mas a estrutura deixou de parecer uma sequência de cartões empilhados.
