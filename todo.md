
- [x] Auditar a integração server-side do provider IA e identificar quota, autenticação, timeout, fallback e execução real no Producer Studio
- [ ] Redesenhar a navegação para um workspace funcional de estúdio, substituindo a experiência longa e textual por áreas/sessões accionáveis
- [ ] Definir e documentar a arquitectura de contas, perfil, feed, partilha de música/vídeo, stories e mensagens entre utilizadores
- [ ] Definir limites de segurança e privacidade para uploads, conteúdo publicado, moderação e credenciais de IA
- [ ] Implementar o primeiro corte funcional do novo workspace depois da auditoria e validação do fluxo IA

- [ ] Migrar a aplicação web estática para uma fundação full-stack sem perder o motor Web Audio local
- [ ] Definir autenticação real, sessões, autorização e recuperação de conta
- [ ] Definir schema de base de dados para utilizadores, perfis, projectos, media, feed e mensagens
- [ ] Integrar storage seguro para áudio, vídeo, imagens e exportações com limites de upload
- [ ] Criar API tipada para contas, projectos, publicação, feed, comentários, follows e mensagens
- [ ] Migrar o Studio existente para o novo shell full-stack mantendo os fluxos locais e IndexedDB
- [x] Integrar AI Producer server-side com logs seguros, quota, timeout, validação e execução local (OpenAI opcional + adaptador Gemini + fallback local)
- [ ] Executar testes de segurança, autorização, uploads, regressão de áudio e QA de produção para 1000+ utilizadores

- [x] Configurar `GEMINI_API_KEY` no ambiente Produção do Vercel e fazer redeploy
- [x] Testar o AI Producer com briefing real e distinguir resposta `ready` de fallback local (provider Gemini respondeu `provider_quota_exhausted`; fallback local preservado no cliente)
- [x] Preparar a fundação full-stack para contas, projectos e perfis
- [x] Implementar contas, projectos e perfis funcionais
- [ ] Testar segurança, persistência e fluxos de utilizador da migração full-stack

- [ ] Criar schema inicial Supabase para perfis, projectos e manifestos do Studio
- [ ] Definir políticas RLS para isolamento por utilizador e leitura pública controlada
- [ ] Criar contrato server-side para criar, listar, guardar e reabrir projectos
- [ ] Validar o fluxo conta → projecto → manifesto → reload sem afectar o Studio local

- [ ] Congelar a tentativa Supabase sem aplicar migrações remotas
- [ ] Criar projecto Firebase para Fernando Lucoco Music
- [ ] Activar Firebase Authentication, Cloud Firestore e Firebase Storage
- [ ] Definir regras Firestore e Storage para isolamento por utilizador
- [ ] Integrar Firebase no site web sem expor credenciais administrativas
- [ ] Migrar a persistência de projectos e perfis para Firebase

- [ ] Cancelar a alternativa Firebase neste projecto e manter Supabase como único backend
- [ ] Executar a migração SQL Supabase no projecto fernando-lucoco-music

- [ ] Pausar a aplicação da migração SQL Supabase devido ao bloqueio do editor móvel
- [ ] Retomar a configuração Firebase como backend escolhido para este projecto

- [ ] Registar que a execução Supabase foi bloqueada por erro de extensão do navegador
- [ ] Abandonar a execução da migração SQL Supabase neste projecto
- [x] Retomar a configuração Firebase para Auth, Firestore e persistência
- [x] Integrar a configuração pública do Firebase Web no projecto Fernando Lucoco Music
- [x] Implementar autenticação Firebase por e-mail/password
- [x] Implementar camada inicial de persistência Firestore para perfis e projectos
- [x] Definir e documentar regras de segurança Firestore
- [x] Validar a integração Firebase com testes e actualizar README

- [x] Reformular a entrada pública para onboarding antes do estúdio, com preferências musicais e cadastro em fluxo guiado
- [x] Reorganizar a navegação em áreas separadas: Criar, Sons, AI Producer, Studio, Mix e Exportar
- [x] Substituir a apresentação longa por um workspace visual com sidebar, área central e inspector contextual
- [x] Rever o fluxo de autenticação para exigir conta antes de associar projectos cloud, mantendo preview público controlado
- [x] Validar o redesign em desktop e mobile, preservando gravação, IndexedDB, AI Producer, timeline, mix e exportação

- [x] Remover todas as referências visuais e textuais a MemoryOS, cofre digital e memórias do projecto Fernando Lucoco Music
- [x] Corrigir a associação do preview/checkpoint para o projecto web musical correcto
- [x] Validar que o site apresenta apenas onboarding, Studio, AI Producer, áudio, projectos e identidade Fernando Lucoco Music

- [x] Diagnosticar associação incorrecta do checkpoint/preview que mostra MemoryOS em vez de Fernando Lucoco Music
- [x] Confirmar que o projecto Vercel e o domínio público usam o repositório web Bora-uzima- correcto
- [ ] Criar checkpoint do projecto web correcto, separado de bora-uzima-mobile

- [ ] Definir direcção visual premium própria, inspirada na organização de DAWs modernas sem copiar identidade alheia
- [ ] Transformar o Studio num fluxo DAW por ecrãs: Home, Criar, Sons, Producer, Timeline, Mix e Exportar
- [ ] Melhorar waveform, teclado/piano roll, mixer, medidores, transições e feedback de interacção
- [ ] Criar sistema visual de identidade Fernando Lucoco Music com tokens, tipografia, estados e componentes reutilizáveis
- [ ] Preparar SEO técnico, sitemap, robots, Open Graph e ligação do domínio personalizado
- [ ] Definir base de PWA e plano de empacotamento para aplicação móvel
- [ ] Validar o novo design em desktop e mobile antes de avançar para funcionalidades sociais

- [x] Bloquear gravações, instrumentais, biblioteca e Studio até autenticação/onboarding concluídos
- [x] Criar entrada pública curta com proposta, demonstração visual limitada e CTA de cadastro/login
- [ ] Separar rotas/estados Guest, Auth Onboarding, Home protegida e Studio protegido
- [x] Reformular o produto com navegação de aplicação, não com uma página longa editorial
- [ ] Recriar o Studio inspirado na organização BandLab: transporte, timeline, tracks, instrumentos, mixer e inspector
- [x] Recolher e comparar capturas de referência fornecidas pelo utilizador antes da validação visual final

- [x] Usar a captura fornecida como referência estrutural do Studio fullscreen, sem copiar marca, textos ou identidade visual
- [ ] Implementar barra de transporte persistente com BPM, compasso, tonalidade, play, stop, record, undo/redo, guardar e publicar
- [ ] Implementar área de faixas com ícones, cores, mute/solo, FX e botão Add Track
- [ ] Implementar vista de instrumento com teclado físico/touch, oitava, sustain, escala, smart keys e inspector lateral
- [ ] Implementar navegação entre Arrangement, Instrument, FX, MIDI Editor, Lyrics/Notes e Sounds
