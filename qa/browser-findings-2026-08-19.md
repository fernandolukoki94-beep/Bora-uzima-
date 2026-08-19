# QA público — 2026-08-19

## Observações

A landing page de produção abriu com HTTP 200 no domínio Fernando Lucoco Music, com título e marca correctos. O botão `Começar` abriu o onboarding obrigatório com quatro passos e os campos de identidade musical.

Ao submeter o primeiro passo sem preencher os campos, o onboarding permaneceu aberto. A mensagem textual esperada de erro (`Falta...`) não foi encontrada pelo extractor do navegador. Esta observação precisa de confirmação através do DOM/console e deve ser tratada como possível lacuna de feedback, não como falha definitiva sem uma segunda leitura.

O screenshot em viewport 893x512 mostra o onboarding em composição dividida com scroll vertical; a estabilidade em mobile estreito ainda requer validação dedicada.

## Confirmação DOM

A leitura directa do DOM confirmou que a validação está funcional: `#onboarding-summary` contém `Falta um detalhe` e `Preenche nome, username e nome artístico para continuar.`; o passo activo permanece `1`, o onboarding continua visível e não foram encontrados erros na consola. O extractor textual não tinha exposto o conteúdo dinâmico, mas o controlo não falhou.

## Teclado e foco

Depois de pressionar `Tab` no onboarding, a leitura do DOM mostrou `document.activeElement` como `BODY`, sem id nem tabindex. A validação de conteúdo funciona, mas a sequência de foco não é previsível neste estado. Isto deve entrar como correcção de acessibilidade/interacção antes de considerar o onboarding finalizado.

## Pós-deployment `722390b`

O Vercel criou o deployment `dpl_HmWwtb3fedb5Coo3QCBZVXeuLKdn` a partir do commit `722390b`, estado `READY`, com os aliases de produção activos. No domínio principal, ao abrir o onboarding, `document.activeElement` é `#onboarding-name`, confirmando que o foco inicial foi corrigido. Os oito ids do painel Voice Character estão presentes no DOM publicado.
