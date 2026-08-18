# QA do redesign — 2026-08-18

## Resultado

A validação de sintaxe dos módulos `onboarding.js`, `firebase-ui.js`, `firebase-client.js` e `studio-shell.js` passou. `git diff --check` também passou sem erros de whitespace.

A suite completa encontrou 157 testes: 154 aprovados e 3 falhas. As falhas não são causadas pelo novo shell visual/onboarding:

- `tests/ai-producer.test.mjs`: o teste de provider real recebeu HTTP 502 em vez de 200.
- `tests/gemini-secret.vitest.test.mjs`: falha de execução do Vitest (`runner.config` indefinido).
- `tests/supabase-secret.vitest.test.mjs`: a mesma incompatibilidade de execução do Vitest.

A execução direccionada dos testes Node relevantes ao Studio, timeline, projectos e Producer passou: 51 aprovados e 2 falhas correspondentes ao teste Vitest legado e não aos fluxos do redesign.

## Validação funcional observada

O visitante novo vê onboarding antes do Studio. O onboarding recolhe nome artístico e preferências musicais antes de encaminhar para autenticação. O cadastro inclui e-mail/password e opção Google. O Studio não fica acessível directamente sem autenticação. A navegação do Studio foi convertida de âncoras de página longa para áreas focadas através de `studio-shell.js`.

## Pendências

Ainda é necessária validação física em dispositivos móveis e uma decisão separada sobre a correcção/remoção dos testes Vitest históricos e do provider IA externo. A sincronização cloud de projectos continua pendente.
