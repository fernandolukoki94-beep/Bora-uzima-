# Auditoria AI Producer, Voice Character e Automação — 2026-08-19

## AI Producer

O endpoint `api/v1/production/advice.js` é server-side e não expõe chaves ao cliente. O provider prioritário é Gemini quando `GEMINI_API_KEY` existe, usando `GEMINI_MODEL` ou `gemini-2.0-flash`; na ausência dessa chave, o endpoint tenta OpenAI através de `AI_PROVIDER_KEY` ou `OPENAI_API_KEY`, com `AI_MODEL` ou `gpt-4o-mini`. A resposta é limitada por schema JSON, validada e sanitizada.

O endpoint não inventa uma resposta pronta quando o provider falha. Sem chave devolve `provider_unavailable`; HTTP 429 é convertido em `provider_quota_exhausted`; 401/403 em `provider_auth_failed`; respostas inválidas em `invalid_provider_response`; timeout ou falha de rede em `provider_unavailable`. O timeout é de 15 segundos. O áudio não é enviado: o payload declara explicitamente `metadata-only; no audio uploaded`. A recomendação server-side define o plano, enquanto arranjo, DSP, mix e master são materializados localmente.

**Conclusão:** a integração é real e segura, mas a execução real depende de uma chave/provider disponível no ambiente Vercel. O fallback local é deliberado e deve ser mostrado como local, nunca apresentado como resposta generativa do provider.

## Voice Character

O Voice Character não utiliza provider externo. É DSP local baseado em Web Audio e `OfflineAudioContext`. Os perfis actuais são `natural`, `intimate`, `powerful` e `radio`. O processamento combina high-pass, warmth peaking, presence peaking, air high-shelf, compressão e ganho de saída. A variante é reversível e preserva o original.

**Limite importante:** não existe clonagem vocal, modelo generativo nem formant-preserving dedicado. O módulo altera o carácter espectral/dinâmico percebido; não transforma uma identidade vocal em outra identidade real.

## Plugins e produção

Os plugins actuais são implementados localmente com nós Web Audio: compressor/gate/de-esser, limiter, EQ, saturation, chorus/flanger, delay/reverb e cadeias vocais. O Mixer agora calcula peak/RMS por canal e master. A nova automação agenda volume e pan em `AudioParam` durante Mixdown e agenda intensidade para parâmetros contínuos dos plugins suportados, como threshold/ratio/release, limiter threshold, EQ gain e wet gain de chorus/flanger. Saturation e alguns parâmetros não contínuos permanecem estáticos durante o render.

## Automação

Foi criado `src/js/studio/automation.js` com normalização, limites, ordenação, deduplicação, inserção, substituição, remoção e interpolação linear de pontos. O projecto persiste lanes por track com os alvos `volume`, `pan` e `fx`; o toggle global `enabled` é respeitado pelo avaliador e pelo Mixdown.

O Mix Session expõe alvo, tempo, valor, índice FX, adição de pontos, remoção de pontos e reprodução/desactivação de lanes. A interface utiliza os mesmos contratos persistidos do modelo de projecto; não existe estado paralelo decorativo.

## Validação

- Contratos de automação: 5 aprovados, 0 falhas.
- Suite completa após a integração: 193 aprovados, 0 falhas.
- `node --check` em `automation.js`, `mixdown.js` e `app.js`: aprovado.
- O teste físico em Samsung Galaxy A06, Android Chrome e Safari iPhone continua pendente e não é substituído por uma simulação.

## Próximas lacunas

As próximas prioridades são routing por buses, lanes gráficas sobre a timeline, automação de parâmetros adicionais de FX, mastering com LUFS mensurável, jobs reais de Audio-to-MIDI/Stem Splitter, Stories, notificações e colaboração. A activação de um provider real do AI Producer em produção deve ser verificada por resposta `status=ready` e `provider=gemini` ou `provider=openai`, nunca por aparência da interface.

## Verificação de produção após automação — deployment fa201d2

O Vercel criou o deployment `dpl_Ee78LKKzA7MdRRyMr3HaM7BTd7o5` a partir do commit `fa201d2b028a4f31e15060d8d37280df4423dd3a`, com target `production` e estado `READY`. O URL imutável é `https://fernando-lucoco-music-k5nnhpr5t-fernandolukoki94-beeps-projects.vercel.app`.

A verificação HTTP directa devolveu 200 para HTML, `app.js`, `automation.js`, `mixdown.js` e `effects.js`. Os bundles publicados contêm 52 referências de automação e 2 selectors de meter em `app.js`, 35 referências no módulo `automation.js` e 27 no `mixdown.js`. `app.js` mantém referências a Voice Character e aos estados de fallback do provider. Isto confirma que a implementação não ficou apenas no repositório local: os módulos essenciais estão a ser servidos pelo deployment de produção.
