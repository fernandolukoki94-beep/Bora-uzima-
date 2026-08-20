# Observações da inspeção pública — 20 de agosto de 2026

## Identificação

O repositório público `fernandolukoki94-beep/Bora-uzima-` apresenta o produto com a identidade visível **Fernando Lucoco Music**. O endereço publicado indicado no GitHub e no README é https://fernando-lucoco-music.vercel.app/.

## Landing page observada

A página inicial apresenta o título “Cria música. Grava tudo.”, o posicionamento “Estúdio vocal web · AI Producer” e o texto que promete gravar voz, produzir num só lugar, usar waveform, mixer e projectos persistentes. O cartão visual do hero mostra “Take 01 · sessão nova”, estado “Pronto”, a frase “Capta o momento.” e um controlo circular de gravação.

A identidade visual usa fundo escuro quase preto/azul, tipografia grande e pesada, coral/laranja para acções e destaque, amarelo para pequenos labels, e um painel fotográfico de estúdio com microfone e controlador MIDI. O cabeçalho contém a marca, “Entrar” e “Começar”.

A página pública contém mais estrutura do que o viewport inicial revela. Os títulos identificados no HTML incluem: “Uma ideia. Um sinal. Um estúdio inteiro.”; “Da ideia ao take. Sem complicar.”; “As tuas ideias, organizadas.”; “O que vais criar hoje?”; “Constrói a música por camadas.”; “Da gravação à música, num só fluxo.”; “Escolhe uma tarefa e vê onde ela acontece”; “Juntar um beat teu”; “Auto-Tune assistido”; “Limpar voz com IA”; “Criar harmonias vocais”; “Moldar o carácter da voz”; “Equilibrar volume e panorama por género”; “Preparar a versão final”; “Sons prontos para a sessão”; “A tua biblioteca privada”; “Descobre artistas e partilha música”; “O teu perfil”; “Conversa directamente com outros artistas”; e “Tecnologia ao serviço da expressão.”

## Navegação e acesso

Os atalhos de navegação encontrados no HTML ligam para `#recording-workspace` (Criar), `#instrument-lab` (Sons), `#producer-studio` (AI Producer), `#timeline` (Studio) e `#mixer-panel` (Mix). A área de autenticação informa que contas e projectos ficam associados ao Firebase e que o áudio continua local no dispositivo. O fluxo “Começar a criar” abre um onboarding de quatro passos que pede nome, username, nome artístico e localização opcional; sem preencher dados, o onboarding não foi avançado. O acesso ao Studio também apresenta a autenticação por e-mail/password e Google. Não foram introduzidas credenciais nem dados pessoais.

## Áreas funcionais identificadas no produto

O código e a estrutura HTML mostram um estúdio com gravação vocal via MediaRecorder, armazenamento local/fallback IndexedDB, projectos e sessões, timeline, instrumentos, Beat Maker, Sound Library, mixer, exportação WAV, Producer Studio com plano local/AI-assisted, análise de áudio, Auto-Tune local assistido, limpeza vocal, harmonias, alteração de carácter vocal, automix, preparação de master, perfil, community/feed, mensagens e sincronização cloud de manifestos/media autenticada.

## Limites observáveis

A visita pública sem autenticação permite avaliar a landing e o posicionamento, mas não permite abrir sessões, projectos, community, profile ou mensagens com dados reais. O README explicita que mensagens, stories e colaboração multi-utilizador continuam pendentes; a validação física em alguns dispositivos móveis também permanece separada da suite determinística local.

## Auditoria técnica da branch `audit/site-redesign`

A cópia de trabalho foi actualizada para o commit remoto `a6226c7` (`feat: expose real studio state dashboard`) e isolada na branch `audit/site-redesign`. A suite oficial executou 202 testes: 201 passaram e 1 falhou no teste de autenticação do endpoint leve OpenAI, com HTTP 401. Esta falha é externa ao fluxo local e não deve ser tratada como sucesso.

O `package.json` actual expõe apenas o script `test` com o runner nativo do Node; não existe script oficial de build, lint ou E2E. Isto deverá ser registado como lacuna de validação, não como erro inventado.

O site local abriu a mesma landing pública do Vercel. O hero apresenta uma identidade escura de estúdio, logotipo textual `FL` dentro de um quadrado coral, título forte “Cria música. Grava tudo.” e um cartão de gravação visual. A principal CTA “Começar a criar” abre um onboarding real de quatro passos com campos Nome, Username, Nome artístico e Localização opcional. Não foram introduzidos dados pessoais.

A primeira impressão visual é forte na paleta e na composição, mas o cabeçalho é muito discreto, o botão superior “Começar” apresenta contraste baixo, e a marca pública `Fernando Lucoco Music` não coincide com o nome de projecto/repositório `Bora Uzima`. A landing pública apresenta sobretudo o hero; as áreas Studio, AI Producer, timeline, Mix e Community existem no HTML/produto, mas a autenticação/onboarding impede a validação completa sem sessão autorizada.

Os estilos mostram uma arquitectura CSS grande e incremental, com múltiplas camadas de redesign no mesmo ficheiro. Há tokens coerentes (`--ink`, `--cream`, `--coral`, `--gold`, `--mint`) e breakpoints para 820/680/520 px, mas é necessário testar a hierarquia e a densidade do Studio em mobile, além de verificar se os estados visuais correspondem sempre a operações reais.

## Onboarding sintético

Na cópia local, o fluxo `Começar a criar` abriu o Passo 1 de 4. O preenchimento de dados sintéticos e a acção `Continuar` avançaram correctamente para o Passo 2 de 4, com escolhas Afrobeat, R&B, Amapiano e Pop. O fluxo inicial não está morto, mas a composição do onboarding é muito dominante e a fotografia lateral ocupa grande parte do ecrã, o que deverá ser avaliado em mobile e em termos de foco/conversão.

O onboarding local avançou do Passo 2 para o Passo 3 após seleccionar Afrobeat e continuar. O Passo 3 apresenta seis intenções seleccionáveis: cantor, rapper, produtor, compositor, beatmaker e aprender. A transição funciona; ainda falta testar a conclusão do fluxo e o destino depois do Passo 4.

O Passo 4 de 4 apresenta Vocal, Beat Maker, Piano e AI Producer, resume os dados sintéticos recolhidos e encaminha correctamente para o formulário Firebase “Criar conta no estúdio”. O encaminhamento funciona; a validação de autenticação real permanece bloqueada sem credenciais do utilizador, como esperado.

## Primeiro passe visual — resultado

A landing foi refinada apenas em `index.html` e no bloco final de `src/css/styles.css`. O logotipo mantém `FL`, mas ganhou gradiente, contorno interno e detalhe de waveform; o cabeçalho agora explicita “Vocal studio · local-first”; a CTA superior passou a ter contraste forte; o hero ganhou textura discreta, profundidade, novo espaçamento e a linha de prova `Local-first · Original preservado · Export WAV` baseada em capacidades documentadas.

A captura desktop pós-alteração mostra melhor hierarquia, contraste e equilíbrio entre copy e cartão de Studio. A captura móvel real de 390×844 mostra o título, copy e CTAs em largura confortável, prova de benefícios legível e cartão a continuar abaixo do viewport sem overflow horizontal aparente. O hero CTA continua a abrir o Passo 1 de 4 do onboarding depois da alteração.

## Rebase e regressão

Durante a preparação para publicação, o `origin/main` recebeu os commits `525e9e6` e `0e5b2b0` relacionados com a direcção contínua do DAW. A branch de redesign foi rebased sobre essa base; o conflito em `styles.css` foi resolvido mantendo ambas as camadas e restaurando explicitamente o fecho da media query remota.

Depois do rebase, a suite repetiu o mesmo resultado: 202 testes, 201 aprovados e 1 falha no teste externo OpenAI com HTTP 401. A landing recarregou com a nova marca/hero e a consola do navegador não apresentou output de erro.

## Produção Vercel

O push para `main` criou o deployment Vercel `dpl_9r8Csaf9QrhUG7KaUQXCgshfdWYJ`, com o commit `ff2cba34282309f64f736b168c0ab164dcb7011b`, target `production` e estado `READY`. O domínio público com cache-buster serviu a nova marca, hero e linha de capacidades. A CTA `Começar a criar` no domínio de produção abriu o Passo 1 de 4 do onboarding real.

## Segunda direcção visual — Calm Editorial

A nova camada editorial foi aplicada localmente sobre a branch `redesign/calm-editorial`. A captura desktop mostra fundo carvão sólido, tipografia serifada no hero, terracota discreta, brass/ocre como acento, cartão sem rotação e sem gradientes luminosos, waveform estática e bordas moderadas. O resultado é significativamente menos chamativo e mais próximo de uma página profissional de música.

O onboarding foi alinhado com a direcção editorial: superfície carvão sólida, conteúdo centrado, tipografia serifada, campos grafite, cartões de escolha planos e sem imagem/padrão de fundo. O Passo 1 de 4 continua a abrir com dados sintéticos persistidos na cópia local.

## Produção — Calm Editorial

O deployment de produção `dpl_CnU5p6XzxMTjEtcKnfXyddepFRjY` ficou READY com o commit `e36f2c5ce67ce76435644a622c93020c525cfa5a`. O domínio principal serviu o novo fundo carvão, título serifado, acentos terracota/ocre, cartão plano e waveform discreta. A CTA principal abriu o onboarding centrado e editorial no site publicado.
