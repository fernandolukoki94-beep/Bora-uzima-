# V2.2 AI Producer — progresso inicial

## Implementado

A V2.2 adiciona uma primeira camada de **recomendação IA server-side** através de `POST /api/v1/production/advice`. O browser envia apenas metadados da take: identificador, género, preset vocal, duração, locale e intenção. Nenhum áudio é carregado nesta fase.

A rota rejeita campos desconhecidos, limita o payload, não persiste áudio e devolve `503 provider_unavailable` quando as variáveis server-side ainda não estão configuradas. A interface informa o utilizador de que a recomendação é opcional e que o processamento local continua disponível.

As credenciais do fornecedor, quando forem configuradas, devem existir apenas em `AI_PROVIDER_URL` e `AI_PROVIDER_KEY` no ambiente server-side. Não podem aparecer em `index.html`, `src/js`, respostas HTTP, logs do browser ou commits.

## Ajuste de áudio

A QA Chrome indicou que o Beat Maker e os instrumentais estavam baixos. O Producer Plan foi ajustado de `-6 dB` para `-4 dB` nos instrumentais e de `-3 dB` para `-2 dB` no bass, mantendo `-1 dB` de headroom do master. O ajuste é coberto por teste e não altera a preservação do Original.

## Estado honesto

Esta é assistência de recomendação, não masterização automática nem processamento IA de áudio. O fornecedor IA permanece opcional e não configurado por defeito. A validação física registada nesta etapa cobre Chrome Android; Safari iPhone continua pendente.
