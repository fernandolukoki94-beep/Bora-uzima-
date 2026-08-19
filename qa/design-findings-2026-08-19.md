# Findings visuais — produção

A landing page publicada responde e apresenta a identidade Fernando Lucoco Music, mas a primeira dobra concentra demasiados elementos num hero alto e escuro: topbar, hero copy, cartão de take, controlos de autenticação e CTA competem pela atenção. O workspace completo existe abaixo, mas a experiência inicial ainda comunica uma página promocional longa antes de comunicar um estúdio de produção.

A composição usa imagem de fundo e cartão de preview, mas falta uma hierarquia mais clara entre entrada, sessão e produção. O produto precisa de uma transição mais directa para um workspace de estúdio: barra de transporte, sessão activa, tracks e inspector devem ser percebidos como uma unidade. O redesenho deve preservar o onboarding e a protecção de autenticação, evitando expor controlos operacionais antes da entrada.

O problema observado é principalmente de composição e densidade, não de ausência total de funcionalidades. A primeira alteração visual recomendada é reduzir a landing a um hero de entrada mais controlado e apresentar a área do Studio como uma aplicação com layout fixo de três zonas: navegação compacta, canvas/timeline central e inspector/mixer lateral. Em mobile, estas zonas devem converter-se em folhas/painéis com uma única região activa, sem scroll horizontal ou sobreposição.

## Validação do primeiro redesenho

O preview local em `https://4174-i6xyex4j7lghvqeyw2pvg-42cb0cfd.us4.manus.computer/` carregou com título e identidade Fernando Lucoco Music. Em viewport de 1280px, `document.documentElement.scrollWidth` e `window.innerWidth` ficaram ambos em 1280px, sem overflow horizontal. A primeira dobra apresentou hero visual, CTA de criação, entrada no Studio e cartão de gravação, enquanto `.studio-app-frame` existe no DOM e fica oculto até à entrada autenticada, conforme o fluxo protegido.

A suite completa manteve 193 testes aprovados e 0 falhas após a camada visual. O estado do AI Producer foi ajustado para distinguir resposta do provider server-side, quota/indisponibilidade e Producer Plan local reversível. O redesenho do workspace autenticado, instrumentos e fluxo de gravação ainda requer validação e implementação adicional antes de ser classificado como concluído.

## Reconstrução visual — validação de preview

A primeira dobra do preview local apresenta a identidade Fernando Lucoco Music, CTA de criação, entrada no Studio e cartão de captura sem overflow horizontal. A composição está mais próxima de uma aplicação musical: headline curta à esquerda, captura visual à direita e navegação reduzida. A landing pública mantém cadastro/entrada; após autenticação, as regras `body.studio-ready` ocultam hero/processo editorial e priorizam a shell do Studio. A avaliação do workspace autenticado em dispositivo real continua pendente.

Também foi reforçado o motor de kick/bass no preview Web Audio e no renderer offline, mantendo a mesma API e alinhando pré-escuta com exportação WAV. A suite permanece com 193 testes aprovados e 0 falhas.
