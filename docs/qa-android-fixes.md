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
