# Relatório QA — correcções pós-Android

## Contexto

O teste físico foi realizado num Samsung Galaxy A06 com Android 16 e Google Chrome. O resultado do utilizador foi qualitativo: a base do site abriu e funcionou, mas ganho, teclado instrumental, Beat Maker e voz precisavam de melhorias. Como não foram fornecidos logs nem passos exactos de falha, esta iteração corrige problemas de usabilidade e de síntese que são reproduzíveis por contrato; não declara aprovação física total.

## Correcções implementadas

| Área | Correcção | Evidência local |
|---|---|---|
| Mixer | Escala contínua de −∞ a +6 dB, valor visível e conversão para o schema linear existente | Teste de contrato do Mixer |
| Teclado | Envelope mais suave, filtro low-pass, volume mais conservador e feedback táctil | Testes de contrato e revisão do audio-engine |
| Beat Maker | Kick com queda de frequência, percussão com ruído filtrado e ruído determinístico | Teste sem `Math.random` |
| Mobile UI | Alvos maiores, `touch-action: manipulation` e estado `is-playing` | Teste de contrato e CSS mobile |
| Voz | Passa-alto a 80 Hz, presença a 2,6 kHz, compressor e ganho seguro | Função `applyVocalEnhancement` e teste de contrato |

## Resultado automatizado

A suite terminou com **73 testes aprovados, 0 falhas**. A validação inclui mixing, Mixdown, renderer instrumental, preflight móvel, fixtures WAV e contratos das novas correcções.

## Limitações

A melhoria vocal é DSP local básico. Não é correcção de afinação, separação vocal, remoção avançada de ruído, IA, mastering ou Vocal Engine profissional. A alteração do audio-engine melhora a pré-escuta Web Audio, mas precisa de nova audição no Samsung Galaxy A06.

O IndexedDB continua como escrita dual e fallback, não como fonte primária. A decisão só deve ser tomada após repetir gravação, reprodução, reload, encerramento do Chrome, Mixdown e interrupções no dispositivo.

## Próximo teste físico

Repetir no mesmo Samsung Galaxy A06: ganho de −∞, −12, −6, 0 e +6 dB; uma nota no teclado; uma sequência do Beat Maker; uma take vocal curta; melhoria vocal; Mixdown; e reload. Registar qualquer diferença entre o comportamento esperado e o ouvido no dispositivo.

## Correcção do erro de ganho no navegador

Foi corrigido o caminho de processamento dos efeitos locais. O orquestrador deixava qualquer falha de `fetch(data:...)`, descodificação ou Web Audio cair na mensagem genérica “Não foi possível aplicar o efeito neste navegador”. Agora as fontes persistidas em Data URL são convertidas directamente para `Blob`, evitando a dependência de `fetch(data:...)` no Chrome Android. A mensagem de falha também inclui a causa técnica sem apagar o original.

A suite determinística passou a **76 testes aprovados e 0 falhas**, incluindo conversão base64, rejeição de Data URL inválida e preservação de Blob. A confirmação final ainda deve ser repetida no Samsung Galaxy A06 com uma take nova.

## Causa específica do erro persistente

A investigação encontrou uma incompatibilidade no parser de Data URL. As gravações do MediaRecorder Android podem ser guardadas como `data:audio/webm;codecs=opus;base64,...`; o parser anterior aceitava apenas `data:audio/webm;base64,...` e rejeitava o parâmetro `codecs=opus` antes de o áudio chegar ao processamento. Isto explica por que a correcção anterior ainda não resolvia todas as takes Android.

O parser agora separa o MIME dos parâmetros e reconhece correctamente `base64`, preservando `audio/webm` como tipo do Blob. Foi adicionado um teste específico para o formato MediaRecorder Android. A suite passou para **77 testes aprovados, 0 falhas**. Ainda é necessário repetir o fluxo no Galaxy A06 para confirmar a descodificação real do codec guardado.

## Correcção posterior do Beat Maker

O preview dos pads deixou de tratar kick, snare, clap, hi-hat, percussion e bass como notas tonais genéricas. Foi criado um caminho dedicado `playDrumHit`, com síntese específica para kick/bass e ruído filtrado determinístico para snare, clap, hi-hat e percussion. O sequencer reutiliza a mesma função, reduzindo a diferença entre o preview do pad e a reprodução do padrão.

A suite local terminou com **80 testes aprovados e 0 falhas**, incluindo contratos para os seis canais de bateria. A confirmação no Samsung Galaxy A06 com Android 16 e Chrome continua pendente; a alteração foi validada deterministicamente, mas ainda precisa de reteste físico.

## Correcção de audibilidade pós-QA — 2026-08-16

O ganho vocal deixou de ser silenciosamente reduzido pela fórmula de headroom antes da renderização. O caminho agora aplica o ganho solicitado e usa um compressor-limitador dedicado para proteger o WAV contra clipping, tornando a diferença de ganho mais mensurável e perceptível em takes baixos.

O preview e o renderer offline receberam também níveis dedicados mais fortes para kick e bass, mantendo envelopes determinísticos. A suite automatizada terminou com **82 testes aprovados e 0 falhas**. A confirmação no Samsung Galaxy A06 continua necessária para avaliar a percepção real em altifalantes e auscultadores móveis.
