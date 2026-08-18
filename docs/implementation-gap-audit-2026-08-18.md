# Auditoria de cobertura — Fernando Lucoco Music

Data: 18-08-2026

Esta auditoria compara o site web publicado e o repositório `bora-uzima-github` com a especificação completa enviada pelo utilizador. A classificação distingue código funcional de texto, CSS ou controlos que ainda não completam o fluxo.

| Área | Estado actual | Evidência | Lacuna principal |
|---|---|---|---|
| Landing pública | Parcial | Hero, CTAs, waveform decorativa e auth panel em `index.html` | Ainda é uma demonstração curta; falta apresentação cinematográfica de produto com preview interactivo real |
| Autenticação Firebase | Implementado | Email/password e Google; domínio Vercel já autorizado pelo utilizador | Apple e recuperação/gestão avançada ainda não estão no escopo actual |
| Protecção pré-login | Implementado | Workspace e módulos são ocultados sem sessão; onboarding abre por acção explícita | Deve ser validado com sessão expirada, deep links e cache |
| Onboarding | Parcial | Nome artístico, género e intenção inicial | Faltam username, foto, objectivos múltiplos e onboarding completo por passos da especificação |
| Dashboard | Ausente/parcial | A shell actual ainda concentra grande parte do conteúdo no mesmo documento | Falta Home protegida independente com projectos recentes, atalhos e navegação real |
| Projectos locais | Implementado/parcial | IndexedDB, takes, timeline, presets, exportação local | Faltam operações completas de projecto: duplicar, versões, arquivar, restaurar e capas |
| Cloud projects | Parcial | Manifestos Firestore e perfil sincronizável | Falta autosave robusto, histórico de versões, resolução de conflitos e reload cross-device comprovado |
| Studio DAW | Parcial | Timeline, tracks, transporte, waveform, mix panel e shell fullscreen inicial | O layout ainda é uma evolução do documento original, não uma DAW por ecrãs com painel/inspector completos |
| Gravação vocal | Implementado/parcial | Web Audio, takes e feedback | Faltam multi-take comping, input device selector e métricas de latência reais |
| Edição áudio | Parcial | Variantes, fades, ganho, reverse e processamento local | Faltam edição destrutiva/não destrutiva completa: split, mover, stretch e transpose por região |
| Teclado/instrumentos | Parcial | `src/js/studio/audio-engine.js`, teclado e instrumentos básicos | Falta catálogo real, presets, velocity, sustain completo, MIDI e piano roll editável |
| Drum machine | Parcial | Componentes/estado existentes no motor | Falta sequenciador visual completo com kits, swing, velocity e loops persistentes |
| Looper/sampler | Ausente/parcial | Importação e beat local existem | Faltam camadas de loop, mapeamento de sample, ADSR e filtro interactivos |
| Biblioteca de sons | Ausente | Não existe biblioteca cloud navegável completa | Falta pesquisa, filtros, categorias, preview e My Sounds com pastas/tags |
| AutoPitch/Auto-Tune | Implementado local/parcial | DSP local, escala, pitch notes, curva e presets | Não é ainda correcção vocal IA/provider e falta interface profissional completa |
| Voice Cleaner IA | Ausente | Não há pipeline real de denoise/de-reverb/AutoEQ | Falta serviço de processamento e preview real |
| Music AI/AI Producer | Parcial | Endpoint server-side, fallback local e arranjo determinístico | Provider real continua condicionado por quota; faltam geração de melody/chords/bass/drums e acções autorizadas |
| Stem Splitter/Audio-to-MIDI | Ausente | Não há pipeline real | Requer processamento assíncrono e storage de resultados |
| FX | Parcial | Auto-Tune, reverb, delay, bypass, medidores e presets locais | Faltam EQ, compressor, limiter, chorus, gate, saturation e cadeia modular completa |
| Mixer | Parcial | Controlos e medidores A/B no Studio | Falta mixer por canais com master, VU/peak reais e automação editável |
| AutoMix/mastering | Parcial | Mixdown local e variantes existem | Falta AutoMix IA, mastering separado e comparação Before/After completa |
| Exportação | Implementado/parcial | Mixed WAV, partilha/download e exportação local | Faltam MP3/FLAC/stems e pipeline progressivo completo |
| Comunidade | Ausente | Não há feed social completo | Faltam posts, likes, comentários, follows, partilha e descoberta |
| Colaboração | Ausente | Não há edição multi-utilizador | Requer modelo de permissões, presença e sincronização de alterações |
| Perfil artístico | Parcial | Perfil/preferências Firebase iniciais | Faltam banner, músicas, projectos públicos, seguidores e Artist Highlights |
| SEO/domínio | Parcial | Meta tags e domínio Vercel existem | Faltam sitemap, robots, JSON-LD e páginas públicas indexáveis |
| PWA/mobile | Parcial | Web responsiva e projecto Expo separado existem | Falta PWA instalável coerente e validação física no dispositivo |
| Segurança | Parcial | Firebase Auth, regras owner-only e validação de upload local | Faltam rate limiting, CSRF/CORS audit, RBAC e threat model de upload |
| Estados de produto | Parcial | Feedback de loading/success/error em várias acções | Falta cobertura consistente de empty/offline/processing em todos os módulos |

## Conclusão

O site não cumpre ainda 100% do ficheiro. A base de gravação, processamento local, autenticação e alguns manifestos cloud existe, mas a maior lacuna é estrutural: **o produto ainda não foi reconstruído como uma aplicação com Dashboard, Studio, Sounds, Instruments, AI, Mastering e Community em ecrãs próprios**. A próxima implementação deve começar pela arquitectura de rotas/estados e pelo Studio fullscreen funcional, não por mais alterações cosméticas.


## Verificação pública após c637445

Fonte: https://fernando-lucoco-music.vercel.app/?v=c637445 — verificada em 18-08-2026.

A página pública apresenta o título “Fernando Lucoco Music — O teu próximo take começa aqui”, a identidade FLM, os CTA “Entrar” e “Começar a criar” e uma pré-visualização vocal. O controlo `#hero-record` está presente apenas como elemento visual desactivado (`disabled`, com aria-label de pré-visualização); gravação, instrumentais, biblioteca e Studio continuam ocultos até autenticação. A suite local desta alteração terminou com 154 testes aprovados e 0 falhas.

## Verificação pública — commit 959c8ea

URL: https://fernando-lucoco-music.vercel.app/?v=959c8ea

A página pública servida pelo Vercel apresenta a landing “A tua voz. A tua demo.”, os CTAs “Começar a criar” e “Entrar no Studio” e uma pré-visualização de gravação explicitamente identificada como “Pré-visualização · entra para gravar”. Não foram expostos instrumentais, biblioteca, timeline ou workspace antes da autenticação. A suite determinística local permanece com 154 testes aprovados.

## Verificação pública — commit a155ce4

URL: https://fernando-lucoco-music.vercel.app/?v=a155ce4

A página pública carregou com o título “Fernando Lucoco Music — O teu próximo take começa aqui” e identidade musical FLM. Foram encontrados apenas os CTAs “Entrar”, “Começar”, “Começar a criar” e “Entrar no Studio”. O bloco de gravação aparece como “Pré-visualização · entra para gravar” e o controlo `hero-record` permanece bloqueado para visitantes. Não foram expostos Studio, instrumentais, biblioteca ou gravações reais antes da autenticação.

## Actualização da execução — Studio e Piano Roll

A selecção de tracks no canvas da timeline passou a sincronizar-se com o inspector do Mixer por clique e teclado, com estado visual de foco e selecção. Isto reduz a sensação de página editorial e mantém o painel contextual ligado ao mesmo estado normalizado de `timelineHistory`.

O Piano Roll deixou de ser apenas pré-escuta. Os 16 passos activos agora podem ser ouvidos como sequência temporizada e materializados numa track instrumental como clip de eventos melódicos. O renderer local passou a sintetizar eventos melódicos temporizados durante o Mixdown, preservando o carácter local, reversível e persistente do projecto. A suite determinística mantém 154 testes aprovados.

| Área | Estado após esta execução | Lacuna restante |
|---|---|---|
| Studio DAW | Parcial avançado | Ainda falta separar completamente as superfícies por rotas/estados independentes e aprofundar automação/mixer profissional |
| Teclado/instrumentos | Implementado local/parcial | Piano Roll materializa eventos e exporta localmente; faltam velocity/sustain/MIDI externo e edição de duração/altura por nota |
| Music AI/AI Producer | Parcial | O plano já materializa arranjo determinístico; falta provider real disponível e geração contextual mais rica de melodias, acordes, baixo e bateria |

Registo técnico: alterações em `src/js/app.js`, `src/js/studio/instrument-renderer.js`, `src/css/styles.css` e `index.html`; validação local executada em 18-08-2026.


## 2026-08-18 — execução sequencial: cadastro e onboarding

O primeiro bloco incompleto encontrado após a auditoria do ficheiro foi a profundidade do cadastro/onboarding. O fluxo agora recolhe nome, username, nome artístico, localização opcional, género, objectivos múltiplos e ferramenta inicial. O resumo final é actualizado antes do cadastro, os campos mínimos de identidade são validados e os dados são sincronizados no perfil Firestore através de merge seguro, com limites de tamanho e normalização do username.

O que já está concluído neste bloco: autenticação por e-mail/password, Google OAuth, onboarding obrigatório, escolhas de género, objectivos múltiplos, ferramenta inicial e persistência de perfil. O que permanece parcial ou ausente: autenticação Apple, foto/avatar real com storage, validação de username único, recuperação de conta visualmente integrada ao onboarding e configuração completa de localização/perfil público.

A suite determinística do projecto foi executada após a alteração: 155 testes aprovados e 0 falhas.


## 2026-08-18 — execução sequencial: Dashboard/Projects, primeira entrega

A Home protegida passou a consumir os manifestos locais reais e a apresentar até quatro sessões recentes, com nome, género, duração, estado e acção Abrir. A acção selecciona o projecto no mesmo estado da timeline e abre o Studio existente, sem criar uma segunda fonte de verdade. O estado vazio continua disponível para utilizadores sem sessões.

Este requisito está classificado como **parcial avançado**: a entrada Home e projectos recentes estão funcionais, mas ainda faltam duplicar, renomear, arquivar, restaurar, capas, versões completas e uma rota Projects independente.

A suite determinística após esta entrega mantém 155 testes aprovados e 0 falhas.


### Continuação do ciclo Projects

Além da apresentação na Home, a lista principal de sessões permite agora **renomear** e **duplicar** um projecto. A renomeação actualiza o manifesto local e tenta actualizar IndexedDB; a duplicação cria um novo identificador, mantém as variantes de áudio do projecto original como dados independentes e não reutiliza a referência de beat importado. A validação mantém 155 testes aprovados e 0 falhas.

Continuam pendentes: arquivar/restaurar, capas, versões explícitas, pesquisa/filtros, rota Projects independente e testes físicos nos navegadores móveis.


### Projects — arquivar e restaurar

As sessões podem agora ser arquivadas e restauradas sem apagar o manifesto ou os dados de áudio. Projectos arquivados deixam de aparecer na faixa de recentes da Home, mas permanecem na lista principal com a acção Restaurar. A suite mantém 155 testes aprovados e 0 falhas.


### Projects — pesquisa e filtros

A lista de sessões passou a ter pesquisa local por nome, género e estado, além de filtros para Todas, Activas e Arquivadas. A pesquisa não envia áudio nem dados para fora do navegador e o estado vazio para resultados sem correspondência é explícito. A suite mantém 155 testes aprovados e 0 falhas.


### Projects — metadados obrigatórios

Os cartões de projecto passam a expor título, capa visual, artista, data, duração, BPM, tonalidade, número de tracks, versão e estado. Os fallbacks são explícitos e não inventam áudio: quando não existe uma versão Mixed, o cartão identifica Original. A capa é actualmente um glyph/gradiente determinístico; upload, escolha de artwork e capas sincronizadas continuam pendentes. A suite funcional mantém 155 testes aprovados e 0 falhas.
