
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
- [x] Separar rotas/estados Guest, Auth Onboarding, Home protegida e Studio protegido
- [x] Reformular o produto com navegação de aplicação, não com uma página longa editorial
- [ ] Recriar o Studio inspirado na organização BandLab: transporte, timeline, tracks, instrumentos, mixer e inspector
- [x] Recolher e comparar capturas de referência fornecidas pelo utilizador antes da validação visual final

- [x] Usar a captura fornecida como referência estrutural do Studio fullscreen, sem copiar marca, textos ou identidade visual
- [ ] Implementar barra de transporte persistente com BPM, compasso, tonalidade, play, stop, record, undo/redo, guardar e publicar
- [ ] Implementar área de faixas com ícones, cores, mute/solo, FX e botão Add Track
- [ ] Implementar vista de instrumento com teclado físico/touch, oitava, sustain, escala, smart keys e inspector lateral
- [ ] Implementar navegação entre Arrangement, Instrument, FX, MIDI Editor, Lyrics/Notes e Sounds

- [x] Autorizar o domínio fernando-lucoco-music.vercel.app no Firebase Authentication
- [x] Validar Google OAuth no domínio Vercel e retorno ao fluxo onboarding/Studio

- [ ] Auditar o ficheiro de requisitos linha a linha contra o site publicado
- [ ] Produzir matriz de cobertura: implementado, parcial, ausente e bloqueado
- [ ] Reconstruir a experiência DAW em vez de continuar com ajustes cosméticos
- [ ] Validar cada requisito do ficheiro com evidência no preview antes de o considerar concluído

# Execução sequencial do ficheiro enviado

- [x] Ficheiro 01 — confirmar a entrada pública, identidade, proposta e CTA sem expor o workspace
- [ ] Ficheiro 02 — concluir cadastro, login Google/e-mail e onboarding obrigatório
- [x] Ficheiro 03 — concluir Home protegida, projectos recentes e navegação por áreas
- [ ] Ficheiro 04 — reconstruir Studio DAW fullscreen com transporte, tracks, timeline e inspector
- [ ] Ficheiro 05 — implementar gravação, importação de beat, instrumentos, beatmaker e piano roll funcionais
- [ ] Ficheiro 06 — ligar AI Producer real a arranjo, instrumentalização, Auto-Tune, mixagem e masterização
- [ ] Ficheiro 07 — concluir exportação, partilha, cloud projects e reload entre sessões
- [ ] Ficheiro 08 — implementar perfis, feed, mensagens, stories e colaboração
- [ ] Ficheiro 09 — preparar SEO, domínio, PWA, mobile e Play Store
- [ ] Ficheiro 10 — executar QA requisito a requisito e só então marcar o lançamento

# Novo ciclo — execução requisito a requisito

- [x] Reauditar o ficheiro completo de requisitos e numerar os blocos funcionais
- [x] Confirmar no código quais requisitos já estão implementados e quais são apenas parciais
- [x] Executar o próximo requisito pendente definido pela matriz, sem saltar etapas
- [x] Validar o requisito com testes determinísticos e verificação de integração
- [x] Actualizar a matriz de requisitos e o implementation gap audit
- [x] Registar cada requisito concluído e manter histórico das lacunas restantes
- [ ] Repetir o ciclo até cobrir todos os blocos funcionais possíveis no escopo actual
- [ ] Fazer verificação final do fluxo público, autenticação e Studio
- [ ] Guardar checkpoint depois de os itens desta fase estarem validados

## Ciclo seguinte — Dashboard/Projects

- [x] Renderizar até quatro projectos recentes reais na Home protegida
- [x] Mostrar nome, género, duração e estado do projecto
- [x] Abrir um projecto recente na timeline existente
- [x] Preservar o estado vazio para contas sem projectos
- [x] Validar a entrega com 155 testes aprovados
- [ ] Criar rota/superfície Projects independente
- [ ] Implementar renomear, duplicar, arquivar, restaurar e capas
- [ ] Implementar versões e estados de sincronização por projecto

- [x] Implementar renomear sessão com persistência local
- [x] Implementar duplicar sessão com novo identificador e estado independente
- [x] Revalidar suite e diff depois das operações de projecto

- [x] Arquivar projecto sem apagar áudio ou manifesto
- [x] Restaurar projecto arquivado
- [x] Excluir arquivados da faixa de projectos recentes
- [x] Validar arquivar/restaurar com 155 testes aprovados

- [x] Pesquisar sessões por nome, género e estado
- [x] Filtrar sessões activas e arquivadas
- [x] Mostrar estado vazio quando não há correspondências
- [x] Validar pesquisa/filtros com 155 testes aprovados

- [x] Expor título, artista, data, duração, BPM, tonalidade, tracks, versão e estado
- [x] Expor capa visual determinística sem inventar ficheiros de áudio
- [ ] Permitir upload/escolha de capa de projecto
- [ ] Sincronizar artwork e versões entre dispositivos

- [x] Autosave cloud com debounce após edições da timeline
- [x] Persistir revisão e histórico leve do manifesto no Firestore
- [x] Expor estados Sincronizando, Salvo agora e Sincronizado
- [x] Garantir que o áudio continua apenas no IndexedDB local
- [ ] Recuperar e restaurar uma versão completa anterior
- [ ] Resolver conflitos de edição entre dispositivos
- [ ] Validar sincronização end-to-end em dois dispositivos autenticados

- [x] HEADER com salvar, compartilhar e exportar
- [x] Reutilizar autosave cloud, partilha Web Share/fallback e exportação Mixed WAV
- [x] Validar HEADER com 155 testes aprovados
- [ ] Testar partilha e download em Chrome Android e Safari iPhone

- [x] Criar Audio, MIDI, Instrument, Drum, Vocal, Bus e FX tracks
- [x] Atribuir nome, tipo e cor determinística a novas tracks
- [x] Validar criação de tracks com 155 testes aprovados
- [ ] Implementar Record Arm e selecção de Input
- [ ] Implementar routing Output entre tracks e buses
- [x] Implementar automação de volume, pan e parâmetros FX

- [x] Record Arm persistente por track
- [x] Selector de Input persistente por track
- [x] Validar Record Arm/Input com 155 testes aprovados
- [ ] Ligar o Input seleccionado à cadeia de gravação real

## Gravação Vocal — diagnóstico de entrada

- [x] Expor Input level durante a captura
- [x] Expor Peak meter com valor em dB
- [x] Expor Latency quando o browser fornece base/output latency
- [x] Enumerar e seleccionar microfone para a próxima gravação
- [x] Limpar medição e AudioContext ao parar
- [x] Validar com 155 testes aprovados
- [ ] Implementar monitorização de entrada com mute/volume separado
- [ ] Validar múltiplos microfones em Chrome Android e Safari iPhone

- [x] Monitorização de entrada opcional com mute por defeito
- [x] Volume independente de monitorização entre 0 e 100%
- [x] Libertar GainNode e AudioContext ao parar
- [x] Validar monitorização com 155 testes aprovados
- [ ] Testar monitorização com auscultadores em Chrome Android e Safari iPhone

## Multi-Take e Comped Vocal

- [x] Agrupar gravações da mesma sessão por takeGroupId
- [x] Numerar takes e mostrar Take 1–4 no projecto
- [x] Seleccionar Intro, Verso, Refrão e Outro a partir de takes diferentes
- [x] Criar e persistir manifesto Comped Vocal
- [x] Preservar todos os originais sem mutação
- [x] Validar com 155 testes aprovados
- [ ] Montar áudio real por regiões com crossfades
- [ ] Validar o fluxo de comping num dispositivo móvel

## Edição de Áudio — operações de clips

- [x] Copiar clip para clipboard local
- [x] Colar clip após o clip alvo com novo ID
- [x] Preservar eventos MIDI, offsets, ganho e fades durante a cópia
- [x] Integrar colagem no histórico undo/redo e autosave
- [x] Validar com 155 testes aprovados
- [ ] Silêncio não destrutivo no clip
- [ ] Reverse de áudio com processamento local
- [ ] Stretch/tempo com processamento local
- [ ] Transpose de áudio com processamento local

## Piano/Teclado Virtual e MIDI

- [x] Teclas naturais e pretas
- [x] Suporte mouse/toque pelo mesmo handler
- [x] Suporte teclado físico com mapeamento de notas
- [x] Selector de oitava 3–6
- [x] Velocity ajustável
- [x] Sustain opcional
- [x] Quantização seleccionável 1/4, 1/8, 1/16, 1/32 e triplet
- [x] Validar com 155 testes aprovados
- [ ] Gravar notas do teclado como eventos MIDI na timeline
- [ ] Mover e redimensionar notas no Piano Roll
- [ ] Apagar e duplicar notas individualmente
- [ ] Quantizar notas existentes e editar velocity/duração

- [x] Gravar notas do teclado virtual/físico em eventos temporizados
- [x] Aplicar velocity, sustain e quantização aos eventos gravados
- [x] Inserir take MIDI como clip reversível na timeline
- [x] Validar com 155 testes aprovados

- [x] Editar altura da nota por duplo clique
- [x] Ajustar duração com Shift e velocity com Alt
- [x] Usar os parâmetros editados na pré-escuta e materialização MIDI
- [x] Validar com 155 testes aprovados
- [ ] Editar notas MIDI já materializadas fora da grelha de 16 passos

## Voice Cleaner local — etapa seguinte da especificação

- [x] Analisar vocal localmente com pico, RMS e duração
- [x] Noise Removal independente
- [x] DeReverb local aproximado e reversível
- [x] AutoEQ vocal independente
- [x] Pré-escuta sem substituir o Original
- [x] Aplicar variante Voice Cleaned no IndexedDB
- [x] Reset individual sem apagar Auto-Tune, reverb ou delay
- [x] Validar Voice Cleaner com 155 testes aprovados
- [ ] Melhorar DeReverb com um modelo DSP dedicado e comparação A/B específica

## AI Voice Tools — Voice Changer

- [x] Perfis Deep, Bright e Robot
- [x] Preview local sem substituir o Original
- [x] Aplicar como variante voiceChanged no IndexedDB
- [x] Reverter apenas o Voice Changer
- [x] Integrar no resolver de variantes e no Mixdown
- [x] Validar Voice Changer com 155 testes aprovados
- [ ] Voice Changer com processamento formant-preserving dedicado
- [ ] Harmony local com vozes adicionais
- [ ] Voice Character avançado e preview A/B multi-variante

## AutoMix e Masterização

- [x] Proposta AutoMix local por género
- [x] Preview sem mutar o projecto
- [x] Aplicação reversível de volume e panorama por track
- [x] Reutilização do plano determinístico e autosave existente
- [x] Validar AutoMix local com 155 testes aprovados
- [ ] AutoMix IA com provider real e plano contextual
- [x] Mastering dedicado com cadeia local e perfis de processamento
- [ ] Automação editável de volume, pan e parâmetros FX

## Mastering local — entrega validada

- [x] Ligar presets, intensidade, loudness, dynamics, stereo e EQ ao painel Mastering
- [x] Implementar Preview Before/After sobre o Mixed sem mutação
- [x] Aplicar Mastering local como variante reversível `mastered` em IndexedDB
- [x] Reverter Mastering removendo apenas a variante final e o efeito persistido
- [x] Corrigir o estado Producer para distinguir Mixed de Mastered
- [x] Actualizar contrato de testes e validar 156 testes aprovados
- [x] Corrigir erro de sintaxe no mapa de géneros AutoMix
- [ ] Medir LUFS integrado/short-term real no output
- [ ] Ligar exportação final preferencial à variante Mastered

## Correcção da associação do preview web

- [ ] Identificar e confirmar o repositório web Fernando Lucoco Music activo
- [ ] Separar a associação WebDev do projecto mobile `bora-uzima-mobile`
- [ ] Gerar preview correcto sem referências a MemoryOS
- [ ] Validar identidade visual, título e rota inicial do site no preview

## Auditoria integral do pasted_content.txt

- [x] Extrair os blocos funcionais completos do ficheiro de requisitos
- [x] Comparar cada bloco com implementação, testes e documentação reais
- [x] Classificar cada requisito como concluído, parcial, ausente ou bloqueado
- [x] Produzir matriz de cobertura com evidência por ficheiro e fluxo
- [x] Definir a sequência de implementação para as lacunas críticas

## Próxima fase de implementação — lacunas do pasted_content.txt

- [x] Confirmar associação do repositório web Fernando Lucoco Music e preview correcto (Vercel READY, commit 0b289d1)
- [x] Implementar medição LUFS integrada e short-term no Mastering
- [x] Ligar exportação final e partilha preferencial à variante Mastered
- [x] Completar FX modular: EQ, compressor, limiter, chorus, flanger, saturation, de-esser e gate
- [x] Aplicar FX modular por track no renderizador WAV com bypass e intensidade
- [ ] Completar Mixer profissional por canais, master, VU/peak e routing
- [x] Calcular métricas peak/RMS por faixa no motor de Mixdown (pré-FX)
- [x] Criar estado Master persistente com ganho, pan, limiter e bypass no motor de mistura
- [x] Ligar controlos visuais do Master ao projecto e ao motor de mistura
- [ ] Implementar automação editável de volume, pan e parâmetros FX
- [x] Implementar núcleo Drum Machine com kits, swing, velocity, pattern e loop no sequenciador
- [x] Ligar controlos visuais de kit, swing, velocity e loop ao painel Beat Maker
- [ ] Implementar Looper com camadas e undo de camadas
- [x] Criar modelo de camadas, overdub, mute, flatten e undo do Looper
- [x] Materializar camadas activas do Looper num clip persistível da timeline
- [ ] Ligar captura/preview do Looper à interface e à timeline
- [ ] Implementar Sampler com corte, mapeamento, pitch, reverse, loop, ADSR e filtro
- [x] Criar modelo de região, playback rate, reverse, loop, ADSR e filtro do Sampler
- [x] Renderizar voz do Sampler em OfflineAudioContext sem mutar a fonte
- [x] Reproduzir voz do Sampler em AudioContext com pitch, reverse, loop, envelope e filtro
- [x] Ligar Sampler a fonte de áudio persistida, teclado e interface
- [x] Expandir contrato MIDI/Piano Roll para edição de notas, duração, velocity, snapping 1/16, triplet e transposição
- [x] Ligar edição visual do Piano Roll ao estado local persistido por projecto
- [ ] Sincronizar edições do Piano Roll com IndexedDB/Firestore dedicado
- [ ] Implementar provider IA real para Producer, Music AI, Voice AI e FX Preset Generator
- [ ] Implementar Harmony e Voice Character avançados
- [ ] Implementar Sounds/My Sounds com pesquisa, filtros, tags e armazenamento
- [ ] Implementar Audio-to-MIDI e Stem Splitter como jobs reais
- [ ] Implementar Community, Profiles, Followers, Likes, Comments e Collaboration
- [ ] Implementar Distribution, Artist Services, Marketplace, Subscriptions e Notifications
- [ ] Consolidar segurança, acessibilidade, estados offline e responsividade dedicada
- [ ] Executar QA desktop, Chrome Android/Samsung Galaxy A06 e Safari iPhone

## Estado actualizado — Looper e Sampler

- [x] Looper: painel visual com duração, quantização, overdub, adicionar camada, undo, mute e materialização
- [x] Looper: camada derivada de eventos do teclado ou fonte Sampler seleccionada
- [x] Looper: clip persistível criado na timeline sem incluir camadas silenciadas
- [x] Sampler: fonte de variante IndexedDB, teclado virtual, reverse, pitch, loop, ADSR e filtro
- [x] Validação após integração: 169 testes aprovados, 0 falhas; `node --check src/js/app.js` aprovado

## Marco seguinte — Sound Library funcional

- [x] Enriquecer o catálogo local com categoria, género, BPM, tonalidade e mood
- [x] Implementar pesquisa combinável e filtros de categoria, género e mood
- [x] Implementar favoritos persistentes no navegador e filtro de favoritos
- [x] Preservar pré-escuta local, drag-and-drop e materialização na timeline
- [x] Validar Sound Library com 4 testes dedicados e suite Node limpa com 169 testes aprovados
- [ ] Migrar My Sounds para upload real com IndexedDB dedicado e organização por pastas/tags
- [x] Sincronizar biblioteca pessoal com Firebase Storage/Firestore com path por utilizador e metadados; regras finais do projecto continuam a requerer confirmação
- [ ] Implementar feed, perfis, follows, comentários, mensagens, stories e colaboração com dados reais
- [ ] Implementar Audio-to-MIDI e Stem Splitter como jobs reais, não apenas estados locais

## Estado de validação deste marco

A execução correcta separa os 169 testes Node dos dois ficheiros Vitest de secrets; os testes Vitest de Gemini e Supabase também passaram. A execução indiscriminada de `node --test tests/*.mjs` continua incompatível com esses dois módulos Vitest e não representa uma falha funcional do Sound Library.

## Verificação solicitada — deploy e continuação do ficheiro

- [x] Confirmar que o deploy público está ligado ao commit `cb1e6b4` do repositório Fernando Lucoco Music
- [x] Verificar visualmente no preview a homepage, onboarding, identidade e bloqueio público; Sounds autenticado permanece pendente
- [x] Corrigir qualquer divergência entre o código publicado e o site visível — não foi detectada divergência de identidade; o novo commit foi publicado
- [x] Seleccionar e implementar o próximo requisito ausente do pasted_content.txt depois da verificação — My Sounds local

## Marco My Sounds — biblioteca privada local

- [x] Criar biblioteca privada para samples, loops, beats, vocals e instrumentais
- [x] Upload de áudio com validação MIME e limite de 80 MB
- [x] Persistir blobs e metadados numa store IndexedDB dedicada
- [x] Organizar por pastas e tags, com pesquisa combinável
- [x] Favoritar, pré-escutar localmente, apagar e adicionar referência à timeline
- [x] Adicionar layout responsivo do painel My Sounds
- [x] Cobrir contrato com 3 testes dedicados; sintaxe e diff limpos
- [x] Sincronizar My Sounds com Firebase Storage/Firestore com path por utilizador e metadados; regras finais do projecto continuam a requerer confirmação
- [ ] Materializar reprodução dos blobs My Sounds directamente no mixdown/export final

## Correcção de rumo — continuidade sem regressão

- [ ] Auditar README, pasted_content.txt e estrutura actual apenas para identificar o próximo requisito ainda ausente
- [ ] Não repetir deploy, configuração Firebase, autenticação, base de dados, domínio ou shell do Studio já concluídos
- [ ] Implementar o próximo módulo real da especificação sobre a base existente, preservando funcionalidades anteriores
- [ ] Validar o avanço com testes, documentação e verificação do site sem o apresentar como protótipo

## Continuação exacta do ficheiro — Community/Profile

- [x] Adicionar Community e Profile como áreas autenticadas próprias no shell existente
- [x] Reutilizar o Firebase/Auth/Firestore já concluído, sem criar backend paralelo
- [x] Criar feed real de posts por tipo: song, project, beat, video e clip
- [x] Implementar ordenação Novo/Trending, filtro por tipo, likes, comentários e partilha
- [x] Guardar perfil artístico com nome, username, bio, géneros e localização
- [x] Mostrar estados de sincronização, erro, sessão obrigatória e privacidade
- [x] Validar o avanço com 173 testes Node aprovados, 0 falhas, sintaxe e diff limpos
- [x] Implementar follows e descoberta de perfis com contadores base
- [x] Implementar upload real de áudio/vídeo/imagem no Firebase Storage com validação, limite de 80 MB e path privado por utilizador
- [x] Implementar mensagens privadas; stories, notificações e colaboração continuam pendentes

## Auditoria contínua solicitada

- [x] Cruzar README, portfólio/QA, código publicado e pasted_content.txt antes de cada novo módulo
- [x] Confirmar no relatório o que já está operacional e não o reimplementar
- [x] Seleccionar a próxima lacuna funcional real do ficheiro — follows e descoberta de perfis
- [x] Actualizar README, documentação de portfólio e TODO após a entrega

## Próximo passo escolhido pelo utilizador — Firebase Storage ou Message Storage

- [x] Auditar no pasted_content.txt a ordem exacta entre media no Firebase Storage e Message Storage
- [x] Confirmar no README, portfólio/QA, Firestore e site publicado o que já existe e o que falta
- [x] Escolher formalmente o próximo módulo com base na matriz, sem duplicar Community/Profile ou Firebase já concluídos — Firebase Storage para media
- [x] Implementar regras de autorização, persistência e UI operacional do módulo escolhido — cliente, persistência e UI concluídos; regras finais do projecto requerem confirmação
- [x] Testar no runner correcto, actualizar README/QA/TODO e validar o deployment local; confirmação do deployment automático permanece pendente

## Próxima etapa — Message Storage

- [x] Auditar no pasted_content.txt os requisitos de mensagens privadas, conversas, permissões e estados
- [x] Confirmar contratos Firebase/Firestore existentes e evitar backend paralelo
- [x] Implementar conversas privadas e mensagens persistentes por utilizador
- [x] Integrar a área Messages no shell autenticado com estados vazios, erro e sincronização
- [x] Definir contrato de privacidade por participantes e não expor conversas no feed público; regras finais Firestore requerem confirmação no Console
- [x] Testar contratos, sintaxe e actualizar TODO/README; QA e confirmação de deployment ficam para o fecho desta etapa

## Ciclo contínuo até ao fim do pasted_content.txt

- [ ] Mapear todos os blocos restantes do ficheiro contra README, QA, portfólio e código actual
- [ ] Ordenar as lacunas por dependência funcional e risco operacional
- [ ] Implementar cada lacuna real sem repetir módulos já concluídos
- [ ] Validar cada módulo com testes determinísticos e integração Firebase/Firestore/Storage quando aplicável
- [ ] Actualizar README, matriz, auditoria QA e TODO a cada etapa
- [ ] Repetir o ciclo até não restarem requisitos implementáveis no escopo actual
- [ ] Manter bloqueios externos explicitamente documentados, incluindo regras remotas e QA físico

## Próximo bloco da especificação — Harmony

- [ ] Implementar Harmony vocal local com duas vozes adicionais e controlo de intensidade
- [ ] Permitir preview, bypass e aplicação como variante sem substituir o Original
- [ ] Integrar Harmony no painel AI Voice existente e nos estados de exportação
- [ ] Testar o processamento e actualizar README/QA/TODO

## Marco Harmony — Voice AI local

- [x] Implementar Harmony vocal local com duas vozes adicionais e controlo de intensidade
- [x] Permitir preview, aplicação e reversão como variante `audioVariants.harmony`
- [x] Preservar o Original e integrar o estado no painel AI Voice e no IndexedDB existente
- [x] Validar com 16 testes Node aprovados, sintaxe limpa e `git diff --check`
- [ ] Voice Character avançado com modelos/transformações adicionais
- [ ] Harmony cloud/AI generativo; o marco actual é DSP local, explicitamente rotulado

## Auditoria integral dos 46 blocos — nova versão do ficheiro

- [x] Construir matriz bloco a bloco: concluído, parcial, ausente ou com erro — lista oficial de 65 secções criada; classificação detalhada continua em progresso
- [x] Auditar o site publicado com foco em rolagem, sobreposição, cabeçalho, equilíbrio e áreas acessíveis — homepage/onboarding auditados; workspace autenticado ainda requer teste
- [x] Comparar a matriz com README, QA, portfólio e código real; corrigir discrepâncias documentais — auditoria e mapa guardados em qa/
- [x] Corrigir primeiro os problemas de layout/navegação que afectam a operação no desktop e mobile — correcção estrutural publicada no commit `21edc2b`
- [ ] Implementar os blocos ausentes apenas depois da confirmação autenticada da correcção estrutural
- [x] Validar cada bloco com testes e evidência no preview/site publicado — deploy público READY e homepage/onboarding verificados; workspace autenticado pendente

## Correcção de estabilidade visual — 2026-08-19

- [x] Identificar a combinação problemática de topbar fixed, barras sticky, frame sem altura definida e múltiplos overflow
- [x] Fazer do shell autenticado um layout de viewport com `100dvh` e coluna principal flexível
- [x] Definir o shell como contentor vertical único com `overflow-y: auto`
- [x] Conter overscroll e preservar safe-area no mobile
- [ ] Confirmar a correcção no workspace autenticado publicado em Chrome desktop, Samsung Galaxy A06 e Safari iPhone
- [ ] Corrigir eventuais problemas residuais depois da validação física

## Próximo bloco após a auditoria — Voice Character
- [x] Implementar perfis de Voice Character locais com parâmetros mensuráveis de timbre
- [x] Disponibilizar preview, aplicação reversível e bypass multi-variante
- [x] Preservar Original e integrar com IndexedDB, Mixdown e exportação
- [x] Expor os controlos Voice Character no painel AI Voice e validar ids da interface
- [x] Documentar explicitamente os limites do DSP local face a Voice Character generativo
- [ ] Voice Character avançado com formant-preserving dedicado e modelos/transformações adicionais

- [x] Verificar deployment Vercel actual e confirmar controlos Voice Character no HTML de produção

- [x] Criar plano de evolução impressionante com critérios de sucesso e ordem por impacto
- [x] Testar controlos de erro, interacções menores, foco, teclado e estados de feedback no site publicado
- [x] Verificar logs de erro e eventos recentes do deployment Vercel actual
- [x] Auditar novamente as 65 secções do pasted_content.txt contra código, README, TODO e produção
- [x] Implementar a próxima melhoria de maior impacto após a auditoria: foco e estados de erro acessíveis no onboarding

- [x] Auditar novamente o ficheiro de requisitos, código, módulos publicados, IA e deployment antes do Mixer
- [x] Executar QA mobile disponível e registar riscos em Samsung/Android Chrome/Safari
- [x] Implementar Mixer profissional com medidores de pico por canal, estado real e controlos clicáveis
- [x] Testar meters, ganho, mute, solo, pan, persistência e acessibilidade do Mixer
- [x] Confirmar deployment Vercel e presença funcional do Mixer em produção

- [x] Auditar estado real dos providers AI Producer e Voice Character, incluindo fallback, quota e segurança
- [x] Verificar plugins de áudio e integração publicada no último deployment Vercel
- [x] Definir contrato de automação para volume, pan e parâmetros FX no Mix Session
- [x] Implementar automação persistente e funcional com lanes/pontos editáveis
- [x] Testar automação, plugins, exportação e presença no deployment de produção
