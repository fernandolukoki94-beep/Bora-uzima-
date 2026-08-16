# Real-World QA — Music Engine V1.2

## Escopo

Este sprint valida o pipeline local com fixtures WAV controladas e sem dados pessoais. O cenário cobre **Import → Track → Clip → Trim/Gain/Fade → Mixer → Instrument Renderer → Mixdown**. A validação foi feita no núcleo determinístico Node.js; ainda não substitui a execução física em Safari iPhone e Chrome Android.

## Fixtures

Foram criadas três fixtures PCM 16-bit, 44.1 kHz em `test-audio/`: `voice.wav` mono com 2 segundos, `beat.wav` mono com 2 segundos e `stereo-test.wav` estéreo com 1 segundo. São sinais sintéticos controlados, não gravações humanas; servem para validar o pipeline sem introduzir dados pessoais ou depender de assets externos.

## Sessão completa

O cenário inclui Vocal a -2 dB, Beat a -4 dB, Piano a -6 dB e Guitarra a -5 dB. O teste confirma quatro clips no Mixdown, duração de 2 segundos, saída não silenciosa, sample rate de 44.1 kHz e headroom final máximo de 0.98. Também confirma que o buffer vocal de entrada permanece inalterado.

| Verificação | Resultado |
|---|---:|
| Fixtures PCM 16-bit | Aprovado |
| Sample rate 44.1 kHz | Aprovado |
| Vocal, Beat, Piano e Guitarra no mesmo projecto | Aprovado |
| Mixdown com quatro clips | Aprovado |
| Saída não silenciosa | Aprovado |
| Headroom máximo ≤ 0.98 | Aprovado |
| Preservação da entrada | Aprovado |
| Safari iPhone / Chrome Android | Pendente |

## Benchmark local

O benchmark usa 44.1 kHz, buffer PCM mono de entrada e saída estéreo PCM estimada. Os valores são observações deste ambiente, não garantias para telemóveis ou computadores fracos.

| Duração | Renderização | WAV estéreo PCM estimado | Pico final |
|---:|---:|---:|---:|
| 10 s | 23,80 ms | 3,36 MB | 0,084853 |
| 30 s | 28,78 ms | 10,09 MB | 0,084853 |
| 1 min | 59,32 ms | 20,19 MB | 0,084853 |
| 3 min | 196,91 ms | 60,59 MB | 0,084853 |
| 5 min | 317,78 ms | 100,94 MB | 0,084853 |

A memória RSS apresentou variação aproximada de 4–20 MB nos casos curtos e cerca de 10 MB de incremento observado nos casos longos neste processo. A métrica depende do garbage collector e não deve ser usada como medição de memória máxima num dispositivo móvel.

## Decisão

A V1.2 está **aprovada no QA automatizado e controlado de desktop**, mas ainda não deve ser declarada pronta para produção móvel. O próximo bloqueio é físico: permissões de microfone, AudioContext, MediaRecorder, OfflineAudioContext, IndexedDB, reload, fechar/reabrir, modo privado e comportamento com armazenamento limitado em Safari iPhone e Chrome Android.

O Vocal Engine, IA, cloud, social, pagamentos e novas famílias de instrumentos permanecem fora deste sprint. Só devem começar depois da QA física e da decisão sobre IndexedDB primário.
