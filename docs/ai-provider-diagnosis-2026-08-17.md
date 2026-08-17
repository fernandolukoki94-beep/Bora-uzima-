
# Diagnóstico AI Producer — 17 de Agosto de 2026

## Resultado

A chave `OPENAI_API_KEY` está configurada apenas no ambiente server-side e o teste leve de autenticação do provider passou. O cliente do navegador nunca recebe a chave nem envia áudio para o provider.

O problema observado não é a ausência do botão ou a falta de ligação entre recomendação e Producer Studio. Quando o provider responde com uma recomendação válida, a resposta é transformada em Producer Plan e materializada na timeline. O bloqueio identificado nas execuções anteriores foi `provider_quota_exhausted`, que impede provar uma recomendação real em produção.

## Limite funcional actual

O LLM actual recomenda arranjo, instrumentalização, cadeia vocal, mix e master através de metadados. O motor Web Audio local executa essas decisões de forma reversível. Isto não é o mesmo que um serviço remoto de áudio fazer Auto-Tune, mixagem ou masterização directamente sobre um ficheiro.

## Melhoria aplicada

O cliente agora traduz estados server-side para mensagens explícitas: quota esgotada, autenticação recusada, provider indisponível ou resposta inválida. Em todos os casos, o projecto permanece intacto e o Producer Plan local continua disponível.

## Próxima evolução necessária

Para alcançar uma experiência comparável em amplitude ao BandLab, ainda são necessários: uma biblioteca de loops/one-shots com preview e drag-to-timeline, Studio multifaixa com inspector persistente, tarefas IA separadas, e um provider de processamento áudio real com quota, upload seguro, jobs e retorno de WAV. Não devemos apresentar a recomendação textual como se já fosse processamento áudio remoto.

## Verificação Vercel adicional

Em 17 de Agosto de 2026, o projecto `fernando-lucoco-music` foi localizado na equipa Vercel correcta. O deployment de produção mais recente está em estado `READY`, com o domínio `fernando-lucoco-music.vercel.app`. A consulta de erros de runtime dos últimos sete dias não encontrou erros agrupados.

Este resultado confirma que o deployment está saudável, mas não prova que o provider IA tenha sido chamado: o projecto está identificado sem framework declarado e a consulta não apresentou funções server-side com erros. A ausência de erros pode significar que o fluxo está a usar fallback local, que o endpoint não está a ser chamado nessa produção ou que a função está alojada noutro projecto. Antes de alterar o design, o próximo teste técnico deve localizar o endpoint público exacto e observar um pedido controlado com estado seguro, sem expor o segredo.

## Validação segura posterior

Em 17 de Agosto de 2026, a variável `OPENAI_API_KEY` foi configurada através do gestor seguro de segredos. Um teste Vitest chamou apenas `GET /v1/models` e recebeu o estado sanitizado `authenticated`, sem imprimir a chave. Isto confirma que a credencial é aceite pela API; não confirma que o modelo seleccionado tenha quota para gerar recomendações. A rota completa `/api/v1/production/advice` ainda deve ser validada separadamente, distinguindo sucesso JSON, `provider_quota_exhausted`, falha de autenticação, timeout e resposta inválida.

## Adaptador Gemini server-side

Foi acrescentado suporte separado para Gemini em `api/v1/production/advice.js`. Quando `GEMINI_API_KEY` existe, o endpoint usa Gemini; caso contrário mantém compatibilidade com `AI_PROVIDER_KEY`/`OPENAI_API_KEY`. O adaptador envia apenas metadados do briefing, solicita JSON estruturado, valida `summary`, `chain` e `confidence`, aplica timeout de 15 segundos e sanitiza estados de autenticação, quota e indisponibilidade. A chave Gemini nunca é enviada ao cliente, escrita em logs ou guardada no código público.

Configuração necessária no Vercel: `GEMINI_API_KEY` em Produção, marcada como confidencial. `GEMINI_MODEL` é opcional e assume `gemini-2.0-flash`. O fallback local permanece disponível quando o provider não existe, falha ou esgota a quota.

A cobertura determinística inclui resposta Gemini válida, contrato JSON e tradução de erro de quota sem exposição de segredos.
