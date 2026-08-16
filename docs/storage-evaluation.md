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

A aplicação adopta agora uma **escrita dual progressiva**. O localStorage continua a guardar os metadados e Data URLs usados pelo caminho de leitura estável, enquanto IndexedDB recebe, quando disponível, o projecto, a take, o blob original, o blob processado e o histórico de efeitos. Isto permite validar persistência sem remover a cópia de fallback. A leitura principal só deverá migrar para blobs IndexedDB depois dos testes físicos de reload, quota, modo privado e recuperação.

## Critérios de aceitação futuros

A migração só será considerada pronta quando preservar takes originais e processadas, sobreviver a reload, não bloquear a interface, recuperar após falha de quota, manter os downloads WAV e passar testes físicos nos dois browsers móveis prioritários.


## Adaptador experimental criado nesta iteração

Foi criado `src/js/indexeddb-storage.js` com um object store `audio-blobs`, chaves separadas para `original` e `processed`, operações de leitura, escrita e remoção por projecto, e detecção explícita de indisponibilidade. O adaptador ainda não substitui `storage.js`: a aplicação continua a usar o caminho estável actual até existirem testes de migração lazy, quota, reload, modo privado, recuperação e compatibilidade física. Não há migração destrutiva nem remoção automática de dados do utilizador.


## Adaptador IndexedDB v2

O adaptador contém cinco stores: `projects`, `takes`, `blobs`, `metadata` e `effects`. Também expõe operações de leitura e escrita, limpeza por projecto, limpeza global, estimativa de armazenamento e migração idempotente. A migração `migrateLocalStorageProjects()` copia projectos legacy, tenta materializar os Data URLs como Blobs e regista o resultado em `metadata`, sem apagar a fonte local.

A suite automatizada cobre schema, persistência original/processado, histórico de efeitos, migração concluída, migração inválida e remoção de dados. A activação da leitura principal continua deliberadamente pendente até existir evidência em browsers reais para quota, modo privado, reload, fechar/reabrir, bloqueio de transacção e recuperação.
