# Fernando Lucoco Music — Proposta de Mini-Produtor Assistido por IA

## Decisão de produto

A mudança de conceito é boa: o utilizador grava a voz e o produto passa a funcionar como um mini-produtor que sugere e executa etapas de produção. No entanto, a V1 não deve prometer que um LLM, sozinho, faz Auto-Tune, mistura e masterização profissional. O LLM pode analisar a intenção, escolher parâmetros, sugerir acordes, criar um arranjo estruturado e coordenar o pipeline; a transformação do áudio continua a precisar de DSP local ou de um serviço especializado.

O fluxo recomendado é:

> Gravar → analisar → criar plano de produção → gerar instrumental local/assistido → aplicar cadeia vocal reversível → misturar → masterizar → exportar.

O original vocal deve permanecer intacto. Cada resultado processado deve ser uma nova versão com parâmetros, estado e possibilidade de reset.

## Opções de arquitectura

| Abordagem | Resultado | Custos | Complexidade | Recomendação |
|---|---|---:|---:|---|
| Local-first com IA simulada/assistida por regras | Sem chaves, sem upload e sem custo por execução; o motor local cria beats e aplica DSP determinístico | Muito baixos | Baixa | Melhor para fechar a V1 gratuita |
| Backend protegido com um fornecedor IA | O servidor envia análise ou áudio ao fornecedor; o browser nunca vê a chave | Variáveis por utilização | Média | Melhor caminho para uma V2 real |
| Dois fornecedores, OpenAI + Gemini | Pode dividir análise multimodal, planeamento e fallback, mas duplica custos, limites, observabilidade e pontos de falha | Mais elevados | Alta | Não começar por aqui |

A opção mais segura é fechar primeiro uma V1 local com um “Producer Plan” estruturado. Depois, adicionar um único fornecedor server-side para uma tarefa bem delimitada, por exemplo análise vocal ou criação de arranjo. Só devemos adicionar um segundo fornecedor quando existir uma vantagem medida, não apenas porque há duas chaves disponíveis.

## Segurança das chaves

As chaves OpenAI e Gemini **não podem** entrar no HTML, JavaScript público, bundle Vite, localStorage, IndexedDB, README, GitHub ou configuração do browser. A documentação oficial da OpenAI recomenda não colocar chaves em browsers ou aplicações móveis e encaminhar pedidos através de um servidor próprio [1]. A documentação oficial do Gemini também trata a chave como palavra-passe, recomenda variáveis de ambiente e indica um proxy backend para proteger chamadas client-side [2].

Se forem utilizadas, as credenciais devem existir apenas no servidor, por exemplo `OPENAI_API_KEY` e `GEMINI_API_KEY`, através do sistema de secrets. O cliente chamaria apenas um endpoint próprio, com validação de tamanho, tipo e duração do áudio, limites de frequência, `trace_id`, timeout e mensagens de erro sem revelar detalhes da chave.

A integração de duas chaves também deixa de cumprir o requisito “sem custos externos”. A utilização de APIs pode consumir quota ou gerar cobrança. Por isso, as chaves não devem ser adicionadas antes de existir uma decisão explícita sobre orçamento, fornecedor principal e limite de utilização.

## Pipeline recomendado

### V1.3 — Producer local

O utilizador grava ou importa uma take. O sistema mede duração, pico, RMS aproximado, silêncio e clipping. Em seguida, um plano determinístico selecciona BPM, tonalidade estimada quando possível, género, densidade rítmica e preset vocal. O Beat Maker e os instrumentos locais renderizam o acompanhamento; a cadeia vocal local aplica passa-alto, presença, compressor suave, de-esser aproximado e limiter. O resultado fica disponível como original, processado e Mixdown.

Nesta fase, “Auto-Tune” deve ser apresentado honestamente como **correcção de pitch experimental/local** quando existir um algoritmo testado. Não deve ser usado o nome Auto-Tune para um simples ganho, EQ ou mudança de frequência.

### V2 — Assistência server-side

Um endpoint protegido recebe somente o necessário e pede ao modelo uma resposta estruturada: intenção musical, género, BPM, tonalidade, instrumentos, padrão de bateria, cadeia vocal e parâmetros sugeridos. O servidor valida o JSON contra um schema e o motor local executa os parâmetros. Assim, a IA decide e o motor de áudio reproduz de forma determinística.

Uma primeira integração pode usar um único modelo multimodal para análise de áudio e planeamento. A documentação de áudio da OpenAI descreve entrada de áudio, transcrição, áudio gerado e sessões realtime, mas isso não equivale automaticamente a uma ferramenta de Auto-Tune ou masterização musical [3]. A etapa de DSP continua a ser responsabilidade do nosso pipeline ou de um serviço especializado.

### V3 — Processamento áudio especializado

Só depois de a V2 demonstrar valor devemos avaliar um serviço ou modelo específico para separação de stems, pitch correction avançado, remoção de ruído e masterização. Cada operação deve ser assíncrona, ter progresso real, preservar o original, poder ser cancelada e produzir um resultado verificável. A arquitectura deve continuar a funcionar em modo local quando a rede ou o fornecedor estiver indisponível.

## O que entra e não entra na V1

| Entra na V1 | Fica para V2/V3 |
|---|---|
| Gravar/importar vocal localmente | Auto-Tune profissional baseado em modelo especializado |
| Producer Plan determinístico | Geração de vocal ou voz cantada |
| Beats e arranjos locais melhorados | Separação de stems por IA |
| Cadeia vocal DSP reversível | Masterização IA de referência comercial |
| Mixer, Mixdown WAV e histórico | Comunidade, feed, partilha cloud e marketplace |
| Estados honestos de processamento | Dois fornecedores IA em paralelo |
| Modo offline e recuperação | MIDI avançado, colaboração realtime e pagamentos |

## Critérios para considerar o mini-produtor válido

A primeira versão do mini-produtor só deve ser aceite quando uma gravação consegue percorrer o fluxo completo sem destruir o original; quando cada operação mostra estado de execução, sucesso e erro recuperável; quando o plano de produção reproduz o mesmo resultado com os mesmos parâmetros; quando o Mixdown inclui vocal e instrumental; e quando o utilizador consegue ouvir uma diferença mensurável sem clipping excessivo.

Também é obrigatório testar o cenário sem rede, o cenário sem microfone, um áudio silencioso, um áudio demasiado alto, uma take longa, reload durante a sessão e falha durante exportação. O critério de sucesso não é a palavra “IA” no interface; é o resultado audível, repetível e compreensível.

## Recomendação final

A ideia deve avançar, mas com uma alteração: não colocar já os dois tokens nem tentar fazer toda a produção através de dois LLMs. Primeiro devemos transformar o Fernando Lucoco Music num **AI-assisted local producer**: a aplicação entende a intenção e gera um plano, enquanto o motor local cria e processa o áudio. Depois, com a V1 estável, adicionamos um backend protegido e um único fornecedor IA para uma tarefa medida. OpenAI e Gemini podem ser avaliados separadamente; a escolha deve depender de qualidade, latência, privacidade e custo observados nos testes.

## Referências

[1]: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety "OpenAI — Best Practices for API Key Safety"

[2]: https://ai.google.dev/gemini-api/docs/api-key "Google — Using Gemini API keys"

[3]: https://developers.openai.com/api/docs/guides/audio "OpenAI — Audio and speech"
