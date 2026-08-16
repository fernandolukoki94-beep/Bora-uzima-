# Avaliação de armazenamento local

## Estado actual

A V1 usa `localStorage` para guardar metadados e dados de áudio serializados em Data URLs. Esta abordagem é simples, transparente e suficiente para demos curtas, mas não é adequada para uma biblioteca maior de takes porque o áudio aumenta rapidamente o volume de dados e cada escrita pode bloquear o fio principal do navegador.

## Recomendação

A próxima evolução deve usar **IndexedDB** para guardar blobs de áudio, metadados e versões processadas. O `localStorage` deve permanecer temporariamente como fallback de migração e para preferências pequenas, não como armazenamento principal de áudio.

| Área | localStorage actual | IndexedDB recomendado |
|---|---|---|
| Metadados | JSON serializado | Object store `takes` |
| Áudio original | Data URL | Blob no campo `originalBlob` |
| Áudio processado | Data URL | Blob no campo `processedBlob` |
| Migração | Não existente | Migração lazy na leitura |
| Recuperação | Simples, mas limitada | Transacções e índices por data/estado |
| Compatibilidade | Ampla | Ampla em browsers modernos; requer fallback explícito |

## Plano de migração sem regressão

A migração deve ser incremental. Primeiro, criar uma interface assíncrona `storageAdapter` com métodos `list`, `save`, `update` e `remove`. Depois, implementar um adaptador IndexedDB e manter o adaptador actual como fallback. Na primeira leitura, detectar takes antigas no `localStorage`, migrar uma por uma para IndexedDB e só remover a cópia antiga depois de uma leitura de confirmação.

O site não deve activar uma migração silenciosa destrutiva. Se IndexedDB estiver indisponível, bloqueado ou em modo privado com erro de quota, a aplicação deve continuar em modo localStorage e mostrar uma mensagem curta ao utilizador. A migração deve também revogar Object URLs quando os players forem substituídos ou eliminados.

## Decisão desta iteração

Nesta iteração, a aplicação **não muda ainda o armazenamento principal**. Foi adicionada documentação e uma faixa de ajuda no estúdio. A implementação IndexedDB fica como a próxima alteração técnica isolada, porque requer testes de quota, migração, reload, limpeza e recuperação em Safari iOS e Chrome Android.

## Critérios de aceitação futuros

A migração só será considerada pronta quando preservar takes originais e processadas, sobreviver a reload, não bloquear a interface, recuperar após falha de quota, manter os downloads WAV e passar testes físicos nos dois browsers móveis prioritários.


## Adaptador experimental criado nesta iteração

Foi criado `src/js/indexeddb-storage.js` com um object store `audio-blobs`, chaves separadas para `original` e `processed`, operações de leitura, escrita e remoção por projecto, e detecção explícita de indisponibilidade. O adaptador ainda não substitui `storage.js`: a aplicação continua a usar o caminho estável actual até existirem testes de migração lazy, quota, reload, modo privado, recuperação e compatibilidade física. Não há migração destrutiva nem remoção automática de dados do utilizador.
