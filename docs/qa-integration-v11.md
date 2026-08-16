# QA de Integração — Music Engine V1.1

## Resultado executivo

O Sprint de Integração V1.1 foi executado com **60 testes aprovados, 0 falhas e 0 testes ignorados**. O resultado confirma que os contratos determinísticos entre Project Model, Timeline, History, Sequencer, Instrument Lab, Mixing Engine e Mixdown local funcionam em ambiente Node. Isto não substitui ainda a validação física de microfone, reprodução e IndexedDB em Safari iPhone e Chrome Android.

| Área | Evidência | Estado |
|---|---|---|
| Mixer | Quatro tracks com volume, pan, mute e solo persistidos após serialização/reload | Aprovado |
| Áudio do Mixer | Gain, mute, solo, pan e headroom produzem saídas WAV diferentes ou limitadas conforme esperado | Aprovado |
| Timeline | Move → Trim → Split → Gain → Fade → Duplicate → Delete, Undo x7 e Redo x7 | Aprovado |
| Trim | start permanece em 10s, duration passa a 8s e sourceOffset passa a 2s | Aprovado |
| Split | Clip em 10s dividido em 4s + 6s com sourceOffset correcto | Aprovado |
| Beat Maker | Afrobeat, Amapiano, Kuduro, Afro House e Rumba geram eventos determinísticos | Aprovado |
| Piano/Guitarra | Eventos de acorde conservam instrumento, identidade e metadados na timeline | Aprovado |
| Reload | Projecto com tracks vocal, beat, piano e guitarra sobrevive a serialização e normalização | Aprovado |
| Transport físico | Play, Pause, Stop e reprodução em dispositivos reais | Pendente |
| IndexedDB físico | Reload, fechar/reabrir, quota e modo privado em iOS/Android | Pendente |

## Interpretação

A V1.1 pode ser considerada **fechada no núcleo lógico local**. O Mixdown actual renderiza clips de áudio persistidos e aplica os controlos do Mixer. Os clips instrumentais preservam eventos e são reproduzíveis pelo motor local, mas ainda não são sintetizados pelo renderer do Mixdown. Por essa razão, a exportação final da sessão não deve ser descrita como uma renderização completa de todos os instrumentos até esse componente existir.

A próxima decisão técnica depende da checklist física em [`qa-mobile-checklist.md`](./qa-mobile-checklist.md). Enquanto essa evidência não for recolhida, IndexedDB deve permanecer em beta interna com escrita dual e localStorage como fonte de leitura principal. O AI Producer continua deliberadamente fora da V1.1.
