# Transição Fernando Lucoco Music — V1 para V2

## Decisão de produto

A V1 é considerada **funcionalmente completa no núcleo instrumental local**. O estúdio já possui gravação vocal, projectos, tracks, clips, timeline, Beat Maker, Piano, Guitarra, Bass, Drums, Cordas, Synth Pad, mixer, Mixdown WAV e Producer Plan determinístico. O objectivo da V2 deixa de ser adicionar instrumentos e passa a ser transformar uma gravação vocal numa produção musical guiada.

A V2 será chamada **Producer Studio**. A inteligência assistida deve sugerir e executar decisões de produção, mas não substituir a autoria de Fernando Lucoco. O utilizador poderá fornecer instruções como “Afrobeat melódico, voz à frente, ambiente quente” e o sistema deverá converter essa intenção num plano verificável.

## Critérios de encerramento da V1

| Critério | Estado | Observação |
|---|---|---|
| Gravação e reprodução vocal | Concluído | Fluxo local com preservação do original. |
| Project Engine e timeline | Concluído | Tracks, clips e operações não destrutivas. |
| Instrumentos locais | Concluído para V1 | Piano, Guitarra, Bass, Drums, Cordas e Synth Pad. A síntese é funcional, não uma biblioteca de samples profissionais. |
| Beat Maker | Concluído para V1 | Presets e canais com preview, timeline e Mixdown. |
| Bass | Validado pelo utilizador | O fluxo foi testado no dispositivo e está a tocar. |
| Mixing e Mixdown | Concluído localmente | Ganho, pan, mute, solo, headroom e WAV local. |
| Producer Plan local | Concluído | Determinístico, persistente, cancelável e reexecutável. |
| Testes automatizados | Concluído | 96 testes aprovados, sem falhas no último ciclo. |
| QA Safari iPhone | Pendente | Deve ser registado antes de afirmar compatibilidade geral. |
| IndexedDB como leitura principal | Pendente | Continua beta até quota, modo privado e recuperação serem validados. |

Assim, a V1 pode ser apresentada como **V1 funcional local**, mas não como uma garantia de compatibilidade perfeita em todos os dispositivos. A declaração de release final depende da checklist física Safari iPhone e da decisão documentada sobre IndexedDB.

## Fluxo vertical da V2

```text
Voz gravada ou instrumental importado
                ↓
Análise local de duração, energia, BPM e tonalidade estimada
                ↓
Instrução do utilizador + Producer Plan
                ↓
Selecção de groove, estrutura e instrumentos existentes
                ↓
Melhoria vocal reversível / pitch correction assistida
                ↓
Mix vocal + instrumental com headroom
                ↓
Master local controlado
                ↓
Original, versão processada e Mixdown WAV
```

A análise inicial deve ser honesta: BPM e tonalidade são estimativas, e o utilizador deve poder corrigi-las. O plano deve apresentar as decisões antes de as aplicar, permitindo alterar género, andamento, tonalidade, intensidade vocal e instrumentos.

## Limites da V2

O Auto-Tune da primeira implementação será uma **correcção de afinação local e reversível**, não uma promessa de transformar qualquer voz numa performance perfeita. A masterização inicial será uma cadeia DSP com ganho, filtro, compressor, limiter e normalização controlados. Um LLM pode interpretar instruções, criar parâmetros e explicar decisões, mas não substitui o renderer de áudio.

A V2 não deve expor tokens OpenAI ou Gemini no browser, no HTML, em módulos JavaScript públicos, no localStorage ou no GitHub. Uma integração externa futura terá de usar um endpoint server-side, validação de schema, limites de payload, controlo de erros e segredos de ambiente. A primeira versão vertical deve permanecer utilizável sem provider externo.

## Ordem de implementação

A primeira entrega da V2 deve consolidar o Producer Plan local com entrada de instrução do utilizador e um ecrã de revisão do plano. Em seguida, deve adicionar análise de BPM/tonalidade com possibilidade de correcção manual. Depois deve aplicar uma cadeia vocal reversível, mix e master locais, mantendo sempre o original. Só após este fluxo passar testes e uma gravação real deverá ser avaliado um provider IA server-side.

Não serão adicionados novos instrumentos nesta transição. O ganho de produto virá da orquestração dos instrumentos existentes e da transformação do fluxo vocal num resultado musical coerente.

## Critérios de aceitação da V2 inicial

A V2 inicial estará pronta quando o utilizador conseguir gravar uma voz, escrever uma intenção de produção, rever um plano com BPM e tonalidade, escolher aceitar ou ajustar o plano, aplicar pelo menos dois instrumentos existentes, ouvir a voz processada separadamente, misturar os elementos, exportar um WAV e recuperar o original sem perda.

Cada etapa deve ter estado de preparação, progresso, cancelamento, erro recuperável e reexecução. O sistema deve mostrar claramente quando uma decisão é local/determinística e quando uma futura assistência server-side estiver disponível.

## Autoria

O produto é dirigido por **Fernando Lucoco**. A assistência automática deve reforçar a sua autoria, não ocultá-la.

Última actualização: 2026-08-16.
