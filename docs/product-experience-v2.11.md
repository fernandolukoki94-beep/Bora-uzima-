# Fernando Lucoco Music — experiência de produto V2.11

## Princípio

O Fernando Lucoco Music deve comportar-se como uma aplicação de criação musical, e não como uma página explicativa sobre inteligência artificial. O utilizador deve conseguir entrar, escolher uma acção e ver uma consequência imediata: criar uma sessão, gravar, importar um beat, abrir o Studio, arrastar sons, pedir uma decisão ao AI Producer, ajustar a faixa e exportar.

A referência de organização é o padrão de produto observado no BandLab, não uma cópia visual ou de marca. A separação entre criação musical, mastering, perfil/feed e comunidade aparece também na documentação oficial do BandLab [1] [2]. A identidade permanece Fernando Lucoco Music: nome, cores, linguagem, iconografia e decisões de produto próprias.

## Navegação proposta

| Área | Função principal | Estado inicial |
|---|---|---|
| Início | Feed pessoal, projectos recentes e botão de criar | Conteúdo local e, futuramente, feed autenticado |
| Criar | Nova sessão, gravar vocal, importar beat ou abrir template | Operacional localmente |
| Studio | Timeline, transport, tracks e inspector | Centro da aplicação |
| Sons | Biblioteca, preview, favoritos e drag-to-timeline | Operacional localmente |
| AI Producer | Briefing, arranjo, vocal, mix e master como tarefas | Provider condicionado a quota; execução local disponível |
| Master | Comparação, presets, loudness e exportação | Operacional localmente |
| Comunidade | Feed, perfis, publicações, stories e colaboração | Requer backend e autenticação |
| Mensagens | Conversas privadas e partilha de projectos | Requer backend e autorização |
| Perfil | Identidade do artista, projectos publicados e definições | Requer autenticação para versão social |

## Workspace funcional

Depois de entrar no Studio, a página deve usar uma estrutura de três zonas. A barra lateral esquerda apresenta o projecto e as entradas Criar, Sons, AI Producer e Projectos. O centro contém a timeline e o transporte persistente. O painel direito funciona como inspector contextual, alternando entre Track, Vocal, FX, Mix, Master e Export. A descrição de cada módulo deve sair do caminho principal e passar para tooltips, estados vazios curtos e ajuda contextual.

No telemóvel, a mesma estrutura transforma-se em folhas inferiores: o centro continua a ser a timeline; a biblioteca, o AI Producer e o inspector abrem como drawers; o transporte permanece fixo e compacto. Nenhum fluxo essencial deve depender de scroll para encontrar o botão seguinte.

## Fluxo principal

```text
Entrar/Criar sessão
    → Gravar ou importar beat
    → Studio: timeline central
    → Sons: preview e adicionar camada
    → AI Producer: briefing e plano
    → Studio: aceitar/rejeitar tracks e cadeia
    → Vocal/FX: Auto-Tune, Reverb, Delay, bypass
    → Mix/Master: A/B, pico, loudness
    → Exportar ou publicar
```

O AI Producer deve mostrar cada decisão como uma tarefa accionável. “Arranjo” cria ou modifica tracks. “Voice Cleaner” altera a cadeia vocal local. “AutoMix” propõe ganho/pan e permite aceitar por track. “Master” propõe parâmetros locais e apresenta medição. Se o provider não responder, a interface deve dizer isso claramente e permitir continuar com o plano local; não deve mostrar texto genérico como se o áudio tivesse sido processado por IA.

## Fase social

A rede social será uma camada autenticada e não uma extensão de `localStorage`. O modelo mínimo inclui `User`, `Profile`, `Project`, `Post`, `MediaAsset`, `Follow`, `Like`, `Comment`, `Story`, `Conversation`, `ConversationMember` e `Message`. Cada projecto publicado deve ter proprietário, visibilidade, direitos de uso e possibilidade de remoção. Os uploads devem ter limites de tamanho, tipo e duração; a publicação de vídeo e stories exige storage dedicado, processamento de thumbnails e políticas de moderação.

A primeira versão social deve começar por cadastro/login, perfil, feed de posts de áudio e publicação de um projecto exportado. Mensagens privadas e stories entram depois de existir autorização, rate limiting, denúncia, bloqueio e retenção segura. Integrações de partilha para WhatsApp, Instagram, Facebook ou outras redes devem usar Web Share/deep links; não devem tentar enviar mensagens automaticamente para contas externas sem autorização explícita.

## Diagnóstico de IA

A chave não deve ser colocada no browser. O histórico de execução identifica `provider_quota_exhausted` como bloqueio anterior, e a configuração de conectores actual mostra OpenAI desactivado. O próximo teste válido precisa de executar um pedido server-side em ambiente onde a chave e o billing/quota estejam confirmados, guardar apenas status seguro e distinguir `401/403`, quota, timeout, resposta inválida e sucesso real. Só depois se deve declarar “IA activa”.

Mesmo com provider activo, um LLM de texto não faz Auto-Tune, mixagem ou masterização de áudio por si só. O contrato correcto é: IA interpreta intenção e devolve um plano JSON validado; o motor local executa DSP. Para processamento remoto real seriam necessários upload seguro, job assíncrono, storage, retorno de WAV e custos/quota próprios.

## Referências

[1]: https://help.bandlab.com/hc/en-us/sections/48011199876121-Profile-Feed "BandLab Help Center — Profile & Feed"

[2]: https://www.bandlab.com/?lang=en "BandLab — Make Music Online"
