# Auditoria integral do pasted_content.txt — 2026-08-19

## Correcção da contagem

A versão recebida contém **65 secções numeradas**, não 46. A contagem foi obtida a partir dos títulos numerados no próprio ficheiro e guardada em `qa/pasted-requirements-headings.txt`. Os itens numerados dentro de listas da secção 4 também aparecem no padrão simples, por isso a matriz final deve usar os títulos das secções, não todas as linhas que começam por número.

## Estado documental confirmado no README

O README descreve como implementados ou operacionais o onboarding, autenticação Firebase, projectos, gravação vocal, IndexedDB/local-first, timeline, instrumentos locais, Beat Maker, mixing local, Producer Plan determinístico, Community/Profile inicial, follows, Firebase Storage para media e Message Storage em evolução. O próprio README mantém como parciais ou pendentes o provider IA real para arranjo/mix/master, QA físico em Chrome Android/Safari iPhone, cloud audio completo, stories, colaboração, notificações, Voice Character avançado, jobs Audio-to-MIDI/Stem Splitter e vários controlos profissionais do mixer.

## Problemas que devem ser verificados antes de novas features

O README e o TODO não estão completamente sincronizados. Exemplos: o README diz que Community/Profile, Firebase Storage e várias áreas estão operacionais, enquanto entradas antigas do TODO ainda aparecem como pendentes. O README também apresenta números históricos de testes que podem não corresponder à suite actual. A matriz deve separar histórico legado de estado actual e incluir evidência de código/teste/site.

O feedback do utilizador sobre rolagem, sobreposição, cabeçalho e falta de equilíbrio é um bloqueador de UX. Antes de acrescentar mais módulos, é necessário verificar o shell, `position: fixed/sticky`, alturas dos painéis, overflow dos contentores, viewport mobile e transições entre áreas autenticadas.

## Próxima acção

1. Construir a matriz dos 65 títulos com estado `concluído`, `parcial`, `ausente` ou `bloqueado`.
2. Auditar visualmente o site publicado e o preview autenticado.
3. Corrigir o layout e a navegação antes de continuar os módulos funcionais.
4. Actualizar README, QA e TODO com estados coerentes.

Fonte principal: `/home/ubuntu/upload/pasted_content.txt`, versão reenviada pelo utilizador em 2026-08-19.

## Verificação pública inicial — 2026-08-19

A homepage pública do deployment `https://fernando-lucoco-music.vercel.app/` respondeu com a identidade Fernando Lucoco Music, CTA Entrar/Começar e onboarding protegido. Não foram observadas referências ao projecto antigo. A área autenticada não pode ser validada visualmente sem sessão Firebase neste browser.

Foi identificado um risco estrutural no CSS local: `studio-app-frame` tinha apenas `min-height` e `overflow:hidden`, enquanto o `studio-main-column` não definia um scroller único; em combinação com topbar fixed e barras sticky, isto podia produzir scroll duplicado, conteúdo sobreposto e sensação de salto ao navegar. Foi aplicada uma correcção local com altura `100dvh`, coluna flex, shell como único contentor vertical e `overscroll-behavior: contain`. A correcção ainda precisa de deployment e verificação autenticada.

## Verificação Vercel — correcção de scroll

- Projecto: `fernando-lucoco-music`
- Project ID: `prj_hrW8bT8iuvBGAjI3pT1ga3rh8Jr4`
- Deployment: `dpl_BgMr9CDzQazETiKHYNdRFRxqFKD6`
- Commit publicado: `21edc2b879f76da0c6bf7b68b70d188b83cd483c`
- Mensagem: `fix: stabilize authenticated workspace scrolling`
- Estado: `READY`
- Target: `production`
- URL: https://fernando-lucoco-music-qdrky8kjt-fernandolukoki94-beeps-projects.vercel.app/
- Fetch externo: HTTP 200, HTML servido pelo Vercel.
- A resposta contém a identidade Fernando Lucoco Music, onboarding Firebase e navegação Criar/Sons/AI Producer/Studio/Mix.
- Limite da evidência: o fetch público confirma deployment e shell público; não confirma ainda a experiência autenticada nem o comportamento físico em Samsung/Safari.

## Inspecção visual pública — homepage e onboarding

A homepage pública carregou com identidade Fernando Lucoco Music, cabeçalho compacto, hero visual, CTA de entrada e cartão de preview vocal. O onboarding abriu como superfície própria em quatro passos, com formulário de identidade, escolhas musicais e botão Continuar.

Na captura do onboarding, a composição apresenta uma divisão visual muito apertada em viewport de aproximadamente 895×512: a coluna esquerda concentra título, campos e CTA, enquanto a imagem ocupa a metade direita e cria rolagem interna. O layout não está quebrado no primeiro ecrã, mas a densidade e a altura do cartão justificam uma validação dedicada em mobile estreito e em ecrã baixo. A área autenticada não foi testada por falta de sessão Firebase neste browser.

## Diagnóstico técnico do onboarding no browser

A inspecção em viewport 1280×1100 encontrou `body { overflow: hidden }`, `html { overflow: visible }` e `.onboarding-card { height: 1100px; overflow-y: auto; position: relative }`. O documento tem altura igual à viewport, logo a rolagem fica confinada ao cartão do onboarding. Os painéis internos do Studio possuem overflow próprio legítimo, mas a combinação pública do body bloqueado com o cartão de onboarding cria a sensação de página presa e pode explicar o comportamento relatado pelo utilizador em ecrãs baixos.

Correcção recomendada: permitir que o shell de onboarding use `min-height: 100dvh`, `height: auto` quando o conteúdo exceder o viewport, e um único scroll previsível no modal/card em ecrãs estreitos, sem remover os overflow internos necessários do Piano Roll, timeline, Community e Messages.

## Evidência adicional — Voice Character — 2026-08-19

Estado: **implementado localmente / validação física pendente**.

A lógica local de Voice Character já existente em `src/js/effects.js` e `src/js/app.js` ficou ligada à interface principal em `index.html`, imediatamente depois do painel Harmony. O painel expõe os perfis `Natural`, `Warm`, `Bright`, `Intimate` e `Radio`, intensidade 0–100%, preview, aplicação e reversão. Os ids verificados são `voice-character-profile`, `voice-character-intensity`, `voice-character-intensity-value`, `voice-character-preview`, `voice-character-apply`, `voice-character-reset` e `voice-character-status`.

A operação mantém o Original preservado e segue a arquitectura de variantes local; a transformação é DSP orientado por perfil, não clonagem de voz nem Voice Character generativo. A etapa avançada de formant-preserving dedicado continua pendente. Foram validados `node --check` em `src/js/effects.js` e `src/js/app.js` e os 3 testes de contrato Harmony (`node --test tests/harmony.test.mjs`), todos aprovados.
