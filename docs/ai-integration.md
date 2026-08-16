# Integração de IA e processamento áudio

## Estado actual

O Fernando Lucoco Music V1 grava, guarda, reproduz e descarrega takes localmente. Os estados `PROCESSING`, `MIXING` e `MASTERING` são apenas estados visuais de preparação. Não existe ainda DSP, Auto-Tune, mixagem, masterização ou análise IA aplicada ao áudio.

## Chaves e segurança

Nenhuma chave OpenAI, Expo Dev ou outro token deve ser inserida no `index.html`, em `src/js/` ou em qualquer ficheiro entregue ao browser. Tudo o que é enviado para o cliente pode ser inspeccionado pelo utilizador e reutilizado por terceiros.

Se uma integração externa for escolhida no futuro, a credencial deverá permanecer num servidor, através de uma variável de ambiente segura. O browser enviará apenas um pedido validado ao servidor. Para uma primeira experiência sem custo externo, a prioridade é implementar efeitos locais mensuráveis antes de adicionar uma API de IA.

## O que uma LLM pode e não pode fazer

Uma LLM pode ajudar a analisar metadados, sugerir uma cadeia de produção, descrever problemas ou recomendar próximos passos. Uma LLM, por si só, não substitui um motor DSP para aplicar equalização, compressão, reverb, correcção de afinação ou masterização de áudio.

O processamento musical real precisa de uma pipeline áudio testável, com entrada, parâmetros, saída e comparação verificável. A IA só deverá ser adicionada como camada de assistência depois de a pipeline base existir.

## Ordem segura de evolução

1. Implementar um efeito local simples, como ganho ou fade, e comparar a saída.
2. Criar testes para preservar MIME, duração, reprodução e download.
3. Definir uma rota server-side para recomendações de produção sem expor credenciais.
4. Só depois avaliar análise de pitch, BPM, tonalidade ou sugestões de efeitos.
5. Nunca apresentar Auto-Tune, mixing ou mastering como concluídos sem áudio processado e QA específico.
