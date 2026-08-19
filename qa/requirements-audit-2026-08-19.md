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
