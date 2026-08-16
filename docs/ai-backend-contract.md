# Contrato backend seguro para assistência IA

## Estado

Este documento define uma interface futura. **Nenhuma rota IA está activa na V1**, nenhuma credencial é enviada para o browser e nenhum ficheiro de áudio é actualmente carregado para um servidor.

## Objectivo

Permitir que o estúdio peça recomendações de produção baseadas em metadados da take e, numa fase posterior, em áudio explicitamente enviado pelo utilizador. A assistência IA deverá recomendar; não deverá ser apresentada como substituta automática de DSP, mistura ou masterização.

## Rota proposta

`POST /api/v1/production/advice`

Pedido mínimo:

```json
{
  "takeId": "local-project-id",
  "genre": "Afrobeat",
  "vocalPreset": "Natural",
  "durationSeconds": 42,
  "locale": "pt-PT",
  "intent": "demo vocal"
}
```

Resposta de sucesso:

```json
{
  "requestId": "server-generated-id",
  "status": "ready",
  "advice": {
    "summary": "Sugestão de preparação vocal para revisão humana.",
    "chain": ["ganho", "fade", "revisão de ruído"],
    "confidence": "low"
  },
  "disclaimer": "Recomendação assistida; não é mixagem ou masterização automática."
}
```

## Regras de segurança

A rota deve exigir autenticação quando houver contas. O servidor deve validar o schema, limitar o tamanho do pedido, rejeitar campos desconhecidos e aplicar rate limiting por utilizador e endereço. Qualquer chave de fornecedor deve existir apenas em variável de ambiente server-side e nunca em `index.html`, `src/js`, logs do browser ou respostas HTTP.

A versão inicial deve aceitar apenas metadados. Upload de áudio só deve ser adicionado depois de existir uma política de retenção, consentimento explícito, limite de tamanho, limpeza automática e uma decisão documentada sobre armazenamento. O servidor não deve guardar áudio por defeito.

## Estados e erros

| Código | Estado | Uso |
|---|---|---|
| 200 | `ready` | Recomendação produzida |
| 400 | `invalid_request` | Schema ou limites inválidos |
| 401 | `unauthorized` | Sessão ausente ou inválida |
| 413 | `payload_too_large` | Pedido acima do limite |
| 429 | `rate_limited` | Limite de utilização atingido |
| 503 | `provider_unavailable` | Serviço de IA temporariamente indisponível |

A UI deve distinguir “recomendação indisponível” de “áudio processado”. Em caso de erro, a take local não pode ser apagada nem substituída.

## Decisão de custo

Não activar uma API externa ou solicitar uma chave OpenAI nesta fase. A V1 continua sem custo externo e usa efeitos locais verificáveis. A integração IA só deve ser activada quando houver necessidade concreta, backend configurado e uma política de privacidade aprovada.

## Fora deste contrato

Auto-Tune, remoção de ruído, equalização, compressão, reverb, mixing, masterização e exportação MP3 exigem componentes áudio próprios e testes específicos. Uma LLM pode orientar ou descrever, mas não deve ser usada como alegação de que esses processos já foram executados.
