# Auditoria de requisitos — Fernando Lucoco Music

**Data:** 20-08-2026  
**Fonte principal:** `pasted_content.txt`, especificação de 65 áreas e 5 fases de implementação.  
**Workspace auditado:** `/home/ubuntu/fernando-lucoco-music-workspace`  
**Repositório:** `fernandolukoki94-beep/Bora-uzima-`  
**Branch:** `main`  
**Commit auditado:** `576344a feat: publish high fidelity studio workspace`

## Resultado da verificação inicial

A pasta local corresponde ao repositório GitHub seleccionado e não apresenta alterações pendentes no momento da auditoria. A suite determinística foi executada depois de sincronizar as dependências declaradas no lockfile: **193 testes aprovados, 0 falhas**. A falha inicial não era uma regressão do produto; resultava de `node_modules` incompleto, que não tinha instalado `fake-indexeddb`, embora a dependência estivesse correctamente declarada em `package.json` e `pnpm-lock.yaml`.

## Classificação da prioridade de implementação

| Fase | Áreas | Estado auditado | Observação |
|---|---|---|---|
| Fase 1 | Landing, cadastro, login, dashboard, projectos, Studio, gravação, waveform, tracks, upload e exportação | **Parcial avançado** | A base funcional existe e está protegida por autenticação, mas a arquitectura ainda está concentrada numa shell web única. Há operações locais reais, IndexedDB, Firebase para manifestos/perfil, gravação vocal, timeline, tracks, waveform e exportação WAV. |
| Fase 2 | Piano, MIDI, Drum Machine, Sampler, Loops, FX e AutoPitch | **Parcial avançado** | Piano, MIDI local, sampler, sequenciador, loops, efeitos locais e Auto-Tune mensurável já existem; permanecem lacunas de edição MIDI livre, cadeia FX completa e alguns controlos avançados. |
| Fase 3 | IA, Voice Cleaner, AutoMix, Mastering, Stem Splitter e Audio-to-MIDI | **Parcial** | Existe AI Producer server-side com fallback local e AutoMix local. Provider real continua dependente de quota/configuração; Voice Cleaner, Stem Splitter e Audio-to-MIDI ainda não são pipelines completos. |
| Fase 4 | Comunidade, perfis, seguidores, likes, comentários e colaboração | **Parcial inicial** | Existem bases Firebase e módulos de comunidade/mensagens, mas não há ainda uma experiência social completa separada por ecrãs. |
| Fase 5 | Distribuição, Artist Services, Marketplace e subscrições | **Pendente** | Não deve ser iniciada antes de estabilizar a Fase 1 e definir limites de produto, pagamentos e distribuição. |

## O que já está funcional na Fase 1

A autenticação por e-mail/password e Google está integrada no cliente Firebase, com protecção do workspace antes do login. O onboarding já recolhe identidade artística, género, intenção inicial e preferências adicionais. O produto tem uma landing própria, uma Home com projectos recentes, criação/abertura de sessões, operações de renomear, duplicar, arquivar, restaurar, pesquisa e filtros. O Studio possui transporte, undo/redo, timeline, tracks tipadas, inspector/mixer, clips, waveform, gravação vocal, multi-take, monitorização opcional, copy/paste, importação local e exportação Mixed WAV.

O subsistema de instrumentos inclui teclado virtual, velocity, sustain, quantização, mapeamento de teclado físico, gravação MIDI local, Piano Roll inicial, drum/sequencer, sampler e biblioteca de sons local. O processamento local inclui variantes reversíveis, Auto-Tune local com análise de pitch, curva editável, reverb, delay, presets, bypass A/B, medidores e AutoMix local baseado em regras. O áudio original não é substituído durante estas operações.

## Lacunas confirmadas contra a regra final

A maior lacuna continua a ser estrutural, não cosmética: a especificação pede uma plataforma com áreas próprias para Dashboard, Studio, Projects, Sounds, Beats, Instruments, AI, Mastering, Community, Profile e Settings. O código actual tem módulos e estados correspondentes, mas ainda não apresenta todas essas áreas como superfícies de produto independentes, com navegação consistente e estados reais por rota/área.

Também permanecem incompletos o upload persistente de artwork, versões cloud recuperáveis com áudio, selector de dispositivos validado fisicamente, edição DSP por regiões e comping com crossfades, catálogo cloud de sons, cadeia profissional de EQ/compressor/limiter/chorus/gate/saturação, mastering separado, exportação MP3/FLAC/stems, PWA instalável, rate limiting/RBAC e a experiência social completa.

## Próximo bloco recomendado

O próximo bloco deve ser **Fase 1 — separação funcional do Studio e Dashboard**, não uma nova alteração de cor. A implementação deve criar uma shell de navegação orientada por áreas, preservando o mesmo estado normalizado de projecto e os motores existentes:

1. transformar Home/Dashboard, Projects e Studio em superfícies de navegação distintas;
2. manter autenticação e onboarding como barreira real antes do workspace;
3. manter a timeline e o mixer como fonte única de verdade, sem duplicar o modelo de áudio;
4. expor no Dashboard projectos recentes, criar projecto, gravar agora e explorar sons;
5. expor no Studio o cabeçalho, timeline, inspector e transporte em layout de trabalho, com altura controlada e sem página editorial excessivamente longa;
6. adicionar testes de contrato para navegação, protecção pré-login, selecção de projecto e retorno ao Studio.

## Critério de aceitação

A entrega seguinte só deve ser considerada concluída se os controlos forem funcionais, os estados de loading/sucesso/erro/vazio forem explícitos, o projecto seleccionado sobreviver à navegação e a suite completa permanecer verde. Não devem ser adicionados botões decorativos para funcionalidades que ainda não tenham implementação correspondente.


## Revalidação contra o novo prompt master

A nova versão torna a ordem de implementação mais restritiva. O primeiro objectivo concreto não é construir a plataforma completa; é validar o fluxo mínimo **Landing → Sign up → Login → Dashboard → New Project → Studio → Import Audio → Audio Track → Waveform → Play/Pause → Volume/Pan/Mute/Solo → Save → Export**. MIDI, Piano, Drums, Sampler, FX, AutoPitch, IA, Community, Collaboration, Distribution e Marketplace ficam explicitamente depois do MVP.

| Passo do fluxo mínimo | Estado no workspace | Evidência auditada | Decisão |
|---|---|---|---|
| Landing | Implementado | `index.html` contém hero, CTA e pré-visualização protegida | Manter; falta validação visual pública final. |
| Sign up/Login/Auth | Implementado | Painel Firebase e `firebase-ui.js` com e-mail/password e Google | Manter; Apple e rate limiting avançado ficam fora do próximo corte. |
| Dashboard | Parcial avançado | `#studio-home` mostra acções e projectos recentes | Próximo foco: confirmar que funciona como Home protegida e não apenas como secção da página. |
| New Project | Implementado/parcial | Formulário `#project-name` e criação de sessão | Adicionar/validar estados de criação, vazio e erro. |
| Studio | Parcial avançado | Shell, timeline, inspector, transporte e áreas de trabalho | Não reescrever o motor; estabilizar navegação e foco. |
| Import Audio | Implementado/parcial | `beat-import.js`, IndexedDB e controlos de importação | Validar nomenclatura Audio Track e erro de formato/tamanho. |
| Audio Track | Parcial | Tracks são tipadas e persistidas, mas os controlos são gerados dinamicamente | Cobrir contrato de volume, pan, mute e solo com testes de integração. |
| Waveform | Implementado | Renderer/timeline e análise local existentes | Validar a ligação entre clip importado e visualização. |
| Play/Pause | Implementado | Transporte `transport-play`/`transport-pause` e `studio/transport.js` | Cobrir fluxo após importação real. |
| Volume/Pan/Mute/Solo | Parcial avançado | Mixer e estado normalizado existem; não há âncoras fixas com esses nomes no HTML | Validar pelo estado e eventos, não apenas pela presença visual. |
| Save/Autosave | Implementado/parcial | `save-cloud-project`, autosave debounce e IndexedDB | Confirmar estados de loading, sucesso, erro e offline. |
| Export | Implementado/parcial | Mixed WAV, download e Web Share | O MVP pode aceitar WAV; MP3/FLAC/stems ficam posteriores. |

## Decisão de execução

A próxima alteração não deve adicionar mais IA, comunidade, marketplace ou instrumentos. O corte correcto é uma **auditoria funcional do fluxo de importação de áudio até exportação**, reforçando os contratos de track e os estados de interface que a nova especificação exige. Só depois de esse fluxo passar em desktop e mobile se deve considerar o MVP concluído e avançar para MIDI/Piano.

## Critérios de aceitação do próximo corte

A funcionalidade será considerada pronta apenas se tiver UI, lógica, persistência necessária, estados de carregamento/erro/vazio, cenário real de áudio importado, testes determinísticos e nenhuma regressão na suite. A especificação determina expressamente que um botão ou uma superfície visual isolada não constitui implementação.
