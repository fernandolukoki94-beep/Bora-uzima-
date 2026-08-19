# Auditoria contínua de requisitos — Fernando Lucoco Music

Data de auditoria: 2026-08-19.

## Estado confirmado

O README descreve o projecto como um estúdio web-first, local-first e orientado à privacidade, com gravação vocal, Project Engine, timeline, instrumentos, Beat Maker, mixing local, Producer Plan e exportação WAV. Também documenta que Firebase/Auth/Firestore, onboarding, projectos e navegação do workspace já fazem parte do estado operacional actual e não devem ser reimplementados.

A matriz de requisitos e o TODO confirmam como concluídos, entre outros, o shell protegido, Studio, gravação vocal, multi-take, clips, Piano Roll base, instrumentos, Drum Machine, Sampler, Looper, Sound Library, My Sounds local, Auto-Tune/reverb/delay reversíveis, Mastering/Mixer local, AI Producer com adaptadores server-side e fallback explícito, e a primeira fatia autenticada Community/Profile com posts, feed, likes e comentários.

## Lacunas seleccionáveis sem repetir trabalho

| Área | Estado actual | Próximo trabalho possível |
|---|---|---|
| Social | Community/Profile inicial implementado | Follows/descoberta, Storage de media, mensagens, stories e colaboração |
| MIDI | Piano Roll base e materialização implementados | Edição avançada fora da grelha, quantização/velocity/duração persistente dedicada |
| Mixer | Ganho, pan, mute, solo, FX e master implementados | VU/peak pós-FX por canal e routing de buses |
| Voice AI | Voice Cleaner, Voice Changer e Auto-Tune local implementados | Harmony local e Voice Character avançado |
| Jobs de áudio | Nenhum job real concluído | Audio-to-MIDI e Stem Splitter com estados, cancelamento e persistência |
| Cloud media | My Sounds IndexedDB local implementado | Firebase Storage/Firestore com autorização por utilizador |
| QA | Suite Node validada; testes físicos permanecem pendentes | QA Samsung Galaxy A06, Chrome Android e Safari iPhone |

## Regra de continuidade

O próximo marco deve ser escolhido a partir desta tabela e do `pasted_content.txt`. Não repetir Firebase, domínio, autenticação, deploy, onboarding, shell do Studio ou funcionalidades já marcadas como implementadas. Toda nova capacidade deve ter consequência operacional, testes e documentação; não deve ser apresentada como efeito visual ou protótipo.


## Marco executado — Community/Following

A revisão do README, da matriz `docs/v21-requirements-compliance.md`, do `todo.md`, do código Firebase e da estrutura do site confirmou que Firebase Auth/Firestore, domínio, onboarding, workspace Studio, Producer Plan, gravação local, instrumentos, Mixdown, Sounds e My Sounds já são partes existentes do produto e não foram reimplementados nesta etapa.

A lacuna seleccionada foi **Community/Profile — descoberta e relações**, seguindo a secção correspondente do `pasted_content.txt`.

Foi entregue pesquisa de perfis por nome artístico, username e géneros; lista de resultados no sidebar; seguir/deixar de seguir; persistência na colecção Firestore `follows`; e manutenção do feed, posts, likes, comentários, partilha e perfil artístico já existentes.

Uploads de áudio/vídeo/imagem no Firebase Storage, mensagens privadas, stories, notificações, repost e colaboração multi-utilizador continuam pendentes. `node --check` passou, `git diff --check` passou e a suite Node correcta terminou com **173 testes aprovados e 0 falhas**.
