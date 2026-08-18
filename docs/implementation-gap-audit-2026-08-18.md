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
