# Plano de evolução — Fernando Lucoco Music

## Objectivo

Transformar as próximas iterações do Fernando Lucoco Music numa evolução verificável do produto, seguindo o `pasted_content.txt` por ordem, sem reimplementar o que já funciona e sem apresentar efeitos locais como inteligência artificial real.

## Critérios de sucesso

| Critério | Evidência exigida |
|---|---|
| Fidelidade ao ficheiro | Cada secção classificada como concluída, parcial, ausente ou bloqueada, com referência a código, teste ou deployment. |
| Produto impressionante | Uma melhoria de alto impacto altera um fluxo principal perceptível, reduz fricção e mantém a estética de DAW profissional. |
| Funcionalidade real | Cada controlo novo tem estado inicial, sucesso, erro, cancelamento, recuperação e persistência quando aplicável. |
| Interacção acessível | Controlos menores têm foco visível, teclado, `aria-label`/estado adequado e feedback sem depender apenas de cor. |
| Segurança e privacidade | Áudio continua local por defeito; dados sociais e credenciais permanecem protegidos; não são expostos segredos no cliente. |
| Produção verificável | O deployment Vercel usado na validação corresponde ao commit do GitHub e responde sem erros críticos. |

## Ordem de trabalho

1. Auditar as 65 secções do `pasted_content.txt` contra `index.html`, `src/js`, `src/css`, testes, README, TODO e estado público.
2. Testar os controlos de erro e as interacções menores no deployment público, incluindo foco, teclado, estados disabled/loading, mensagens de erro e recuperação.
3. Consultar logs de runtime, erros agrupados, eventos recentes e build do deployment Vercel actual.
4. Escolher uma melhoria de maior impacto com base nas lacunas reais, não em preferências abstractas de design.
5. Implementar a melhoria com testes determinísticos, persistência não destrutiva e documentação.
6. Validar localmente e em produção, actualizar a matriz, README e TODO, e só então reportar o resultado.

## Candidatos de maior impacto

| Candidato | Valor | Risco | Condição de escolha |
|---|---|---|---|
| Mixer profissional com VU/peak meters e buses | Torna o Studio imediatamente mais credível como DAW e corresponde à especificação. | Médio | Escolher se a base de routing já estiver estável. |
| Automação de parâmetros | Acrescenta edição musical profissional e torna o Mix realmente editável. | Médio/alto | Escolher se o modelo de projecto já suportar lanes sem migração destrutiva. |
| Stories e notificações sociais | Completa a camada de rede social pedida. | Médio | Escolher se Mixer e automação estiverem cobertos ou bloqueados por arquitectura. |
| Jobs Audio-to-MIDI/Stem Splitter | Cumpre uma lacuna importante, mas exige backend/background job real. | Alto | Só iniciar com contrato de job, estados e provider disponíveis. |
| Voice Character formant-preserving | Melhora o módulo vocal, mas não deve ser vendido como simples DSP. | Alto | Só iniciar quando houver implementação técnica real e critério de qualidade. |

## Regra de decisão

A próxima feature será seleccionada depois da auditoria e dos logs. Será preferida a lacuna que combine maior impacto no fluxo principal, menor risco de regressão e possibilidade de validação determinística no ambiente gratuito. Nenhuma funcionalidade será marcada como concluída apenas por existir um botão ou um painel visual.
