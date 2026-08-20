# Refinamento visual público — 20 de agosto de 2026

## Problema

A landing pública apresentava uma identidade já coerente, mas com um logotipo `FL` demasiado genérico, um cabeçalho com pouca hierarquia e uma CTA superior com contraste insuficiente. O hero comunicava o produto, mas não tornava imediatamente visíveis alguns princípios reais do Studio.

## Decisão

Foi aplicado um refinamento localizado apenas à camada pública, preservando os selectors, IDs, atributos de acessibilidade e handlers existentes. O símbolo `FL` recebeu geometria, gradiente, contorno e um detalhe visual inspirado em waveform. A marca passou a ter uma segunda linha discreta, `Vocal studio · local-first`, e o botão `Começar` recebeu contraste e presença equivalentes à CTA principal.

O hero recebeu uma textura de grelha muito subtil, iluminação radial, espaçamento mais equilibrado, tratamento de profundidade no cartão de gravação e uma linha de prova com três capacidades que já existem no produto: `Local-first`, `Original preservado` e `Export WAV`. Esta linha é apenas comunicação; não simula uma operação nem altera o estado da aplicação.

## Alternativas descartadas

Não foi gerado um novo ficheiro de imagem para o logotipo porque o símbolo existente podia ser melhorado com CSS determinístico, reduzindo peso e risco de inconsistência entre o cabeçalho, o Studio e o onboarding. Não foi alterada a marca textual para `Bora Uzima` porque o site publicado e o produto activo usam actualmente `Fernando Lucoco Music`; uma mudança de naming deve ser uma decisão de produto explícita, não uma consequência acidental do redesign.

## Validação

A landing local foi verificada em desktop e numa captura Chromium de 390×844. A CTA `Começar a criar` continuou a abrir o Passo 1 de 4 do onboarding após a alteração. A suite funcional manteve 201 testes aprovados em 202; o único teste falhado continua a ser a autenticação do endpoint OpenAI com HTTP 401, já existente antes do redesign.

## Limites

Este documento não declara validação de Firebase com uma conta real, gravação física de microfone, exportação física num dispositivo móvel, provider IA externo ou deployment de produção. Essas verificações permanecem unidades separadas do ciclo de QA.
