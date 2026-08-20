# Matriz funcional do Studio — auditoria 20/08/2026

## Estado reproduzido

| Componente | Estado | Evidência | Prioridade |
|---|---|---|---|
| My Sounds / IndexedDB | REAL | `test-audio/voice.wav` foi guardado com metadados e reapareceu com Ouvir/Timeline/Edit/Apagar. | Alta |
| My Sounds → Timeline | REAL | O WAV criou uma sessão `Beat Studio`, uma Audio Track e um clip local. | Alta |
| Producer Plan local | REAL | Aplicou arranjo local e criou seis instrumentos/10 clips no projecto de QA. | Alta |
| Beat Maker → Timeline | REAL após await | Beat Afrobeat foi materializado como clip WAV de 2.3s; o chamador precisava de aguardar a Promise. | Alta |
| Mixer master | REAL | Ganho `+3.0 dB` e bypass persistiram no projecto. | Alta |
| Mixdown WAV | REAL | `audioVariants.mixed` foi criado e o toast confirmou WAV guardado localmente. | Alta |
| Keyboard preview | PARTIAL | O teclado existe e chama Web Audio, mas a pré-escuta não foi ainda validada com gesto humano/AudioContext real. | Alta |
| Keyboard MIDI → Timeline | BROKEN antes da correcção | A UI dizia “3 notas inseridas” antes da persistência; `insertInstrumentClip` era async e o handler não aguardava. A correcção foi aplicada localmente e o clip passou a persistir. | Crítica |
| Piano Roll / acordes / guitarra / looper | BROKEN antes da correcção | Vários chamadores também não aguardavam `insertInstrumentClip`; devem ser tratados pelo mesmo patch. | Crítica |
| AI Producer — Producer Plan | REAL | O plano local foi executado no projecto de QA e materializou o arranjo. | Crítica |
| AI Producer — recomendação generativa | BLOCKED | Browser local e endpoint público respondem `provider_unavailable`/HTTP 503; o endpoint funciona e devolve fallback honesto, mas nenhum provider generativo está disponível. | Crítica |
| AI Producer — DSP local / Mixed / Mastering | PARTIAL/REAL | Mixed e processamento local existem; pitch, cleaner, harmony e mastering ainda requerem uma take válida e validação dedicada. | Alta |
| Gravação de microfone | NÃO VERIFICADA | Não foi pedido acesso ao microfone; deve ser validada com uma conta/sessão real ou takeover autorizado. | Crítica |
| Exportação/partilha | REAL/PARTIAL | Mixdown local verificado; share/export final depende de variante Mixed/Mastered e de browser/dispositivo. | Alta |

## Falha estrutural encontrada

`insertInstrumentClip` gera o WAV local, aguarda IndexedDB, faz `commitTimelineProject` e renderiza a timeline. Os chamadores de teclado MIDI, acordes, guitarra, Piano Roll, Beat Maker, Looper e Sound Library tratavam a Promise como valor imediato. Isso permitia mensagens de sucesso antes da conclusão. O patch passa a usar `await` nos chamadores e transforma os handlers necessários em `async`.

## Bloqueio do provider

O endpoint `api/v1/production/advice.js` valida metadados, não recebe áudio e mapeia falhas do provider para estados seguros. Em produção, um POST sintético devolveu HTTP 503 com `{"status":"provider_unavailable"}`. Não é correcto inventar uma resposta generativa local e apresentá-la como provider; a solução deve manter o fallback local e, para IA generativa real, corrigir a configuração/quota do provider no Vercel.

## Ordem de implementação

Primeiro devem ser corrigidos e testados os chamadores assíncronos de materialização. Depois deve ser criado um fluxo de sessão de produção mais claro, com Control Room, transportes e estados reais. Em seguida devem ser validados DSP, exportação, gravação e provider. Só depois se deve finalizar a camada visual profissional, pois uma maqueta bonita sobre acções assíncronas partidas viola o master prompt.
