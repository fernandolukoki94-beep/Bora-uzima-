# Matriz de auditoria — Bora Uzima / Fernando Lucoco Music

Data: 20 de agosto de 2026
Branch: `audit/site-redesign`
Base: `a6226c7` sincronizada com `origin/main`

## Classificação funcional

| Área | Estado | Evidência actual | Próxima verificação |
|---|---|---|---|
| Landing pública | REAL | Abre no Vercel e localmente com hero, marca, CTA e cartão de gravação | Revalidar após redesign visual |
| CTA “Começar a criar” | REAL | Abre onboarding; Passos 1–4 foram percorridos com dados sintéticos | Revalidar após alterações |
| Onboarding | PARTIAL | Transições e selecções funcionam localmente; conclusão encaminha para Firebase Auth | Teste completo com sessão autorizada do utilizador |
| Firebase Auth | BLOCKED | Formulário e Google Auth presentes; sem credenciais de teste autorizadas | Validar com conta/ambiente autorizado |
| Studio, timeline, mixer e instrumentos | PARTIAL | Código integrado e suite determinística cobre o núcleo; acesso público protegido | Executar fluxo browser autenticado |
| Gravação real | PARTIAL | Implementação `MediaRecorder` e testes de contrato existem | Verificar microfone físico em desktop e mobile |
| Persistência local | REAL/PARTIAL | IndexedDB/localStorage e reload documentados; suite cobre armazenamento | Repetir browser E2E com sessão vocal real |
| Exportação WAV | PARTIAL | Mixdown/exportação cobertos por testes locais | Confirmar download e áudio não silencioso no browser |
| AI Producer | PARTIAL | Fallback local e endpoint server-side implementados; provider externo sem quota/401 | Validar estados de provider indisponível e sessão real |
| Community/Profile/Messages | PARTIAL | Módulos e regras presentes; não validados com utilizador autenticado | Validar ownership, permissões e estados vazios |
| Suite automática | PARTIAL | 201/202 testes passaram | Isolar teste externo OpenAI 401 e documentar como bloqueado |
| Build/lint/E2E oficiais | MISSING | `package.json` só expõe `test`; não há scripts oficiais | Não inventar sucesso; documentar e/ou criar validações mínimas reais |

## Problemas de UX/design prioritários

| Prioridade | Problema | Direcção segura |
|---|---|---|
| P0 | O valor do produto é forte, mas a landing pública não revela a profundidade do Studio | Melhorar narrativa do hero e dar mais evidência de fluxo real sem criar demos falsas |
| P0 | O logotipo `FL` é genérico e pequeno | Refinar o símbolo com geometria consistente e melhor leitura em tamanhos pequenos, mantendo a marca textual |
| P1 | O botão superior “Começar” tem contraste e presença insuficientes | Tornar a CTA inequívoca, acessível e coerente com o botão hero |
| P1 | O hero tem grandes áreas vazias e pouca textura de produto | Reequilibrar grelha, contraste, detalhe de waveform e metadados reais sem sobrecarregar |
| P1 | O sistema visual foi acumulado em muitas camadas CSS | Fazer alterações localizadas e tokens/override controlados; evitar reescrever módulos funcionais |
| P1 | A landing não deixa claro que o acesso ao Studio requer conta | Explicar o percurso sem bloquear a descoberta nem prometer acesso anónimo ao Studio |
| P2 | Estado do botão de gravação é uma pré-visualização desactivada | Tornar visualmente explícito que é preview e manter a acção real no onboarding/auth |
| P2 | Mobile precisa de verificação física e visual | Testar largura reduzida, targets, scroll e densidade depois do redesign |

## Critério de conclusão desta unidade

A melhoria visual só passa quando o site local inicia, o onboarding continua a funcionar, os CTA continuam ligados, nenhum módulo funcional é removido, a suite não perde cobertura, a landing é validada em desktop e mobile, e todas as limitações externas permanecem explicitamente documentadas.
