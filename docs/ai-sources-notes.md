# Fontes externas consultadas para o mini-produtor IA

## OpenAI — segurança de API keys

Fonte: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety

A OpenAI recomenda não colocar chaves em browsers ou aplicações móveis, não fazer commit de chaves em repositórios e usar variáveis de ambiente ou gestão segura de segredos. Os pedidos devem passar por um backend controlado pelo produto. A fonte também recomenda monitorizar utilização e rodar a chave se houver suspeita de exposição.

## Google — segurança de chaves Gemini

Fonte: https://ai.google.dev/gemini-api/docs/api-key

A documentação do Gemini trata a chave como palavra-passe, recomenda variáveis de ambiente, proíbe exposição client-side em produção e recomenda um proxy backend. Também recomenda restrições, gestão de segredos e alertas de billing. A documentação indica a transição de chaves standard para authorization keys e deve ser consultada novamente antes da integração de produção.

## OpenAI — áudio e speech

Fonte: https://developers.openai.com/api/docs/guides/audio

A documentação distingue entrada de áudio, saída de áudio, transcrição, texto-para-fala, speech-to-speech e sessões realtime. Descreve APIs de áudio e análise, mas não deve ser interpretada como promessa automática de Auto-Tune, separação de stems ou masterização musical profissional. Essas operações continuam a exigir DSP ou um serviço/modelo especializado.

## Aplicação ao projecto

A V1 deve usar regras determinísticas e DSP local para o Producer Plan. Uma futura V2 pode usar um backend protegido e um único fornecedor para gerar JSON estruturado de produção. As chaves nunca devem aparecer no cliente, no bundle público, no armazenamento local, no README ou no GitHub.
