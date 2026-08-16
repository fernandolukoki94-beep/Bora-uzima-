# V2.2 AI Producer — progresso inicial

## Implementado

A V2.2 adiciona uma primeira camada de **recomendação IA server-side** através de `POST /api/v1/production/advice`. O browser envia apenas metadados da take: identificador, género, preset vocal, duração, locale e intenção. Nenhum áudio é carregado nesta fase.

A rota rejeita campos desconhecidos, limita o payload, não persiste áudio e devolve `503 provider_unavailable` quando as variáveis server-side ainda não estão configuradas. A interface informa o utilizador de que a recomendação é opcional e que o processamento local continua disponível.

As credenciais do fornecedor, quando forem configuradas, devem existir apenas em `AI_PROVIDER_URL` e `AI_PROVIDER_KEY` no ambiente server-side. Não podem aparecer em `index.html`, `src/js`, respostas HTTP, logs do browser ou commits.

## Ajuste de áudio

A QA Chrome indicou que o Beat Maker e os instrumentais estavam baixos. O Producer Plan foi ajustado de `-6 dB` para `-4 dB` nos instrumentais e de `-3 dB` para `-2 dB` no bass, mantendo `-1 dB` de headroom do master. O ajuste é coberto por teste e não altera a preservação do Original.

## Estado honesto

Esta é assistência de recomendação, não masterização automática nem processamento IA de áudio. O fornecedor IA permanece opcional e não configurado por defeito. A validação física registada nesta etapa cobre Chrome Android; Safari iPhone continua pendente.

## Estado da integração real — 16 de Agosto de 2026

A credencial server-side foi validada com sucesso no endpoint leve de modelos da OpenAI. O primeiro pedido real de recomendação foi executado através da rota da aplicação, mas o provider devolveu HTTP 429 com `insufficient_quota`. Por segurança, a rota converte esta situação em `503 provider_unavailable`, não expõe a mensagem do provider ao navegador e mantém o fluxo local intacto.

A validação estrutural do contrato está concluída: `summary` é string com tamanho limitado, `chain` é um array de 1 a 6 strings limitadas e `confidence` aceita exclusivamente `low`, `medium` ou `high`. O teste real de quota permanece pendente até existir disponibilidade de utilização no provider; não é tratado como falha de autenticação.

## Execução dos três passos seguintes

A suite local terminou com **127 testes aprovados e 0 falhas**. Foi adicionada uma transformação determinística e segura de recomendação validada (`summary`, `chain`, `confidence`) para uma intenção compatível com o Producer Plan local, preservando `localOnly` e `originalPreserved`. A recomendação é guardada no projecto como proposta e não aplica áudio automaticamente.

A repetição do provider real continua limitada pela quota disponível no fornecedor configurado; não foi apresentado um resultado JSON real enquanto o provider devolve bloqueio de quota. A validação Safari iPhone também não pode ser declarada a partir do ambiente Chromium da sandbox: requer execução física no Safari do dispositivo.

## Validação real actualizada — 16 de Agosto de 2026

A credencial `OPENAI_API_KEY` foi validada no endpoint leve de modelos sem expor o valor. O teste da rota de recomendações com metadados de Afrobeat, 30 segundos, preset vocal quente e intenção romântica devolveu `503` com o estado seguro `provider_quota_exhausted`. Não houve fallback silencioso nem recomendação inventada. O backend distingue agora quota insuficiente de falha de autenticação e de indisponibilidade geral, sem devolver o corpo do provider ao navegador. A integração real provider → JSON validado continua bloqueada até existir quota disponível.
