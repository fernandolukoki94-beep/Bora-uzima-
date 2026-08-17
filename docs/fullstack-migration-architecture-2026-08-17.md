# Fernando Lucoco Music — arquitectura de migração full-stack

## Decisão

O projecto deixa de ser tratado como uma página HTML estática com módulos locais independentes. A direcção aprovada é uma aplicação full-stack funcional, mantendo o motor Web Audio API, a persistência local de sessão e o princípio de que o áudio pode ser produzido imediatamente no dispositivo.

A migração será incremental. O Studio local não será reescrito para depender da rede: gravação, preview, Auto-Tune, efeitos, Sound Library, timeline, mix e exportação continuam a funcionar offline. A camada de produto acrescentará identidade, sincronização selectiva, publicação e colaboração através de uma API autenticada.

## Estado técnico auditado

| Área | Estado actual | Risco | Decisão |
|---|---|---|---|
| Interface | HTML, CSS e ES Modules | Alto acoplamento entre DOM e estado | Migrar para shell de aplicação por áreas, preservando módulos de áudio |
| Testes | `node:test`, 148 testes no último checkpoint | Regressões durante a migração | Manter suite e acrescentar testes de contrato/API |
| Áudio | Web Audio local, IndexedDB e WAV | Upload de ficheiros grandes e diferenças de browser | Continuar local-first; sincronizar artefactos explicitamente |
| AI Producer | Endpoint Vercel `/api/v1/production/advice` | Provider anterior bloqueado por quota | Manter proxy server-side, validar quota/status e não expor chaves |
| Backend | Apenas função serverless isolada para recomendação IA | Sem auth, DB, storage social ou mensagens | Criar fundação full-stack real antes da camada social |
| Deploy | Vercel, deployment de produção READY | Projecto sem framework declarado | Evoluir para runtime/framework com rotas tipadas e migrações controladas |

## Limites e não-negociáveis

Nenhuma chave OpenAI, Gemini, storage ou sessão será colocada no browser, no HTML, em IndexedDB, em `localStorage` ou no repositório. O browser recebe apenas sessões, tokens de sessão protegidos por cookie seguro e respostas de API filtradas.

O servidor deve impor autenticação, autorização por recurso, validação de payload, limites de tamanho, rate limiting, logs sem segredos, protecção contra abuso e eliminação de dados. O sistema deve distinguir claramente funcionalidades locais de operações de rede. Uma falha de rede não pode apagar ou substituir o Original local.

## Ordem de implementação

Primeiro será criado o shell de aplicação e a fundação de autenticação. Em seguida serão implementados perfil, projectos e sincronização de manifestos sem upload obrigatório de áudio. Depois entra storage de media e publicação de faixas. Feed, comentários e follows dependem desse modelo. Mensagens privadas só entram depois de existir autorização, bloqueio, denúncia, rate limiting e testes de acesso cruzado.

A integração AI Producer será ligada ao novo backend como um serviço de recomendação de metadados. Um provider real será considerado activo apenas quando um pedido controlado produzir um JSON validado e rastreável com estado `ready`. Auto-Tune, mixagem e masterização continuarão a ser executados pelo motor local, salvo se for posteriormente criado um pipeline remoto de áudio com jobs, storage, custos e autorização próprios.

## Capacidade para mais de mil utilizadores

“Mais de mil utilizadores” exige testes de carga e observabilidade; não é uma propriedade que possa ser garantida apenas pela interface. A fundação deve separar sessões, base de dados, storage e funções stateless, usar índices para consultas de feed e mensagens, paginação por cursor, limites de upload e filas para processamento pesado. Antes de abertura pública, será necessário medir latência, erros, consumo de storage, limites do provider IA e comportamento em concorrência.

## Primeiro marco verificável

O primeiro marco da migração não é o feed social. É o seguinte fluxo real:

```text
Criar conta → iniciar sessão → criar projecto → guardar manifesto
→ sair → voltar a entrar → reabrir projecto → continuar no Studio local
```

Quando esse fluxo estiver testado, o segundo marco será:

```text
Publicar uma faixa → outro utilizador autenticado vê o post
→ reproduz o media → comenta → o autor pode apagar a publicação
```

Só depois será implementada a conversação privada.

## Referências

[1]: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety "OpenAI — Best Practices for API Key Safety"

[2]: https://help.bandlab.com/hc/en-us/sections/48011199876121-Profile-Feed "BandLab Help Center — Profile & Feed"
