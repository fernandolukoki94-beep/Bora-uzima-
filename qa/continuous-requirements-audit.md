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

## Marco executado — Firebase Storage para media

A matriz do `pasted_content.txt` coloca upload, validação de formato, limite e permissões de media antes de Message Storage. Por isso, o próximo passo escolhido foi **Firebase Storage para media privada**.

### Implementado

- `src/js/firebase-client.js` exporta o Storage da mesma instância Firebase já usada por Auth e Firestore.
- `src/js/firebase-media.js` valida áudio, vídeo e imagem; aplica limite de 80 MB; normaliza nome, pasta e tags; usa o path privado `users/{uid}/media/{mediaId}`; faz upload explícito; obtém URL; e guarda metadados na subcolecção `users/{uid}/media`.
- My Sounds mantém o botão local IndexedDB e recebeu uma acção separada **Sincronizar no Firebase**, exigindo sessão autenticada.
- O README foi actualizado para distinguir media cloud operacional de Message Storage, stories e colaboração ainda pendentes.

### Limites e segurança

O upload não é automático e não substitui o fallback offline. A segurança efectiva depende das regras Firebase Storage/Firestore do projecto, que devem permitir apenas `request.auth.uid == userId` e limitar o conteúdo ao path do próprio utilizador. Não foram introduzidas credenciais administrativas no cliente.

### Validação

`node --check` passou em `firebase-client.js`, `firebase-media.js` e `app.js`; `git diff --check` passou; os testes seleccionados terminaram com 24 testes aprovados, 0 falhas, incluindo o contrato de limite, MIME, isolamento por UID e persistência Firestore.

### Próxima lacuna

Message Storage continua como próximo bloco social possível, seguido de stories, notificações e colaboração. A sincronização cloud não foi declarada como concluída para mensagens.


## Marco executado — Message Storage

A auditoria do `pasted_content.txt` indicou Message Storage como a etapa seguinte após Firebase Storage para media. Foi implementado o contrato Firestore privado em `conversations/{conversationId}` com subcolecção `messages`, ID determinístico para o par de utilizadores, mensagens limitadas a 2.000 caracteres, até 50 conversas/mensagens carregadas, validação do destinatário e isolamento por participantes.

A interface autenticada Messages inclui lista de conversas, thread privada, composer, estados vazio/sincronização/erro e entrada directa a partir do botão **Mensagem** nos resultados de descoberta da Community. O feed público não consulta conversas. Foram validados `firebase-messages.js`, `messages-ui.js`, `community-ui.js` e `firebase-community.js` com `node --check`; os contratos seleccionados terminaram com **13 testes aprovados e 0 falhas**.

A implementação cliente não substitui as regras remotas: o Firebase Console ainda deve confirmar regras Firestore que permitam leitura/escrita apenas aos dois participantes da conversa. Anexos, notificações, stories e colaboração continuam pendentes e não foram declarados como concluídos.
