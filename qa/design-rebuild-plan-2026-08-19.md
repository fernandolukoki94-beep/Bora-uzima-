# Plano de reconstrução visual — Fernando Lucoco Music

## Diagnóstico

A produção actual tem autenticação e módulos funcionais, mas a landing page comunica uma página editorial antes de comunicar um estúdio. O hero usa muito espaço, o preview parece um cartão isolado e o workspace completo aparece depois de várias secções. A densidade e a hierarquia tornam difícil perceber onde começa a sessão musical.

## Decisão de produto

Preservar autenticação Firebase, onboarding, projectos, IndexedDB, Firebase Storage, social, AI Voice, Mixer, automação e exportação. Reconstruir a camada visual e a navegação para que a aplicação tenha duas experiências claras: uma entrada curta e visual; depois um workspace de estúdio com zonas fixas e uma única área activa.

## Nova estrutura visual

1. **Landing curta**: barra de marca, promessa, dois CTAs, visual de sessão e três provas funcionais. Nenhum painel operacional exposto antes da entrada.
2. **Onboarding em passos**: mantém os dados e validação existentes, mas passa a usar composição de estúdio, progresso discreto, cartões de escolha consistentes e foco acessível.
3. **Studio shell**: barra lateral estreita com Home, Criar, Sons, AI Producer, Studio, Mix, Community e Profile; barra superior de sessão com nome do projecto, BPM, tonalidade, estado de gravação, undo/redo e exportação.
4. **Transport bar**: play, stop, record, tempo, metronome, loop e posição de sessão num único eixo, sempre visível dentro do Studio.
5. **Área central**: timeline/tracks como superfície principal. Cada track tem nome, cor, waveform/clip, mute/solo/arm e acesso a automação.
6. **Inspector contextual**: painel direito para propriedades da track, Voice Character, FX e automation. No mobile torna-se uma folha activa, nunca uma coluna comprimida.
7. **Instrument Lab**: biblioteca com categorias e preview real de kick, bass, drums, keys e textures; cada item deve ter estado de carregamento, preview e adicionar à sessão.
8. **AI Producer**: brief, contexto da sessão, estado explícito do provider, plano recebido, aplicar plano, retry e fallback claramente separados. Nunca mostrar “IA pronta” quando o endpoint está em quota/unavailable.
9. **Mix Session**: strips por canal, meters, inserts, sends, buses e automação numa hierarquia visual única.

## Direcção visual

Fundo quase preto `#0d0f12`, superfícies `#151920` e `#1c222b`, linhas `#2a323d`, texto `#f4f7fb`, muted `#8d98a6`. Coral `#ff6b57` é reservado para record/primary; âmbar `#f3b84b` para AI/automation; azul `#6da8ff` para playback/selection; verde `#55d68a` para ready/success. Tipografia deve privilegiar legibilidade, tamanhos moderados e contraste; eliminar grandes blocos de texto e espaçamento editorial.

## Critérios de sucesso

- A primeira dobra explica criação e entrada sem parecer documentação.
- Após entrar, o utilizador vê sessão, transporte e timeline sem procurar no scroll.
- Desktop usa sidebar + canvas + inspector; mobile usa uma zona activa por vez.
- Nenhum controlo funcional é removido ou substituído por mock.
- Os controlos AI mostram sempre estado real: ready, loading, quota, auth, unavailable ou fallback local.
- Instrumentos têm preview e inserção real; não são apenas cards.
- A mesma sessão mantém dados após reload e exportação.
- Lighthouse/QA visual não apresenta overflow horizontal, sobreposição de sticky elements ou focus perdido.
