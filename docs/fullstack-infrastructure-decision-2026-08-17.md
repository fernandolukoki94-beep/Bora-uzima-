# Decisão de infraestrutura full-stack

## Escolha recomendada

A fundação recomendada para o Fernando Lucoco Music é **Supabase via integração do Vercel Marketplace**, com Postgres para dados relacionais, Supabase Auth para identidade e Supabase Storage para media. O frontend continua publicado no Vercel, enquanto o motor de áudio local permanece no browser.

Esta escolha reduz a quantidade de serviços independentes na primeira migração. A documentação oficial descreve que o Supabase Auth suporta password, magic link, OTP e provedores sociais, e que a autorização pode ser aplicada com JWT e Row Level Security [1]. A base é Postgres completo e serve de fundação para Auth, Storage, Realtime e funções [2]. O Storage fornece controlo de acesso, API REST, compatibilidade S3 e uploads resumíveis [3]. O Vercel Marketplace permite provisionar fornecedores como Supabase e injectar credenciais no projecto [4].

## Separação de responsabilidades

| Camada | Responsabilidade | Segredo no browser? |
|---|---|---:|
| Browser | Studio, Web Audio, IndexedDB, playback, previews, edição local | Não |
| Frontend | Sessão através do SDK público, UI e chamadas autenticadas | Apenas chave pública limitada |
| API/server | Validação, autorização, criação de URLs assinados, AI Producer e webhooks | Não expõe chaves privadas |
| Postgres | Utilizadores, perfis, projectos, posts, comentários, follows e mensagens | Protegido por RLS |
| Storage | Avatares, capas, áudio publicado, vídeos e thumbnails | Buckets privados por defeito |
| Provider IA | Recomendação de produção via servidor | Nunca |

## Dados mínimos

O primeiro schema deverá conter `profiles`, `projects`, `project_members`, `project_manifests`, `media_assets`, `posts`, `comments`, `follows`, `conversations`, `conversation_members` e `messages`. Todas as tabelas terão `created_at`, identificadores UUID e políticas explícitas de leitura/escrita. O conteúdo local não será automaticamente sincronizado: o utilizador escolhe guardar um manifesto ou publicar um export.

## Storage e uploads

Os uploads serão feitos com URLs assinados ou protocolo resumível, com validação de MIME, extensão, tamanho e duração. O servidor não deve aceitar que o cliente escolha livremente um caminho de objecto. O bucket de rascunhos será privado; posts públicos usarão media derivado e URLs controlados. Vídeos e stories não entram no primeiro marco da rede social, porque exigem transcodificação, thumbnails, limites de duração e moderação.

## Autenticação inicial

A primeira versão usará email/password ou magic link através do Auth gerido, com verificação de email, refresh de sessão, logout, recuperação de conta e políticas de perfil. Social login pode ser activado depois de a base funcionar, começando por Google e GitHub se forem necessários. O frontend nunca implementará cookies ou tokens manualmente; a camada de servidor validará a sessão e aplicará autorização por recurso.

## Riscos

A solução não elimina custos ou limites. A capacidade para mais de mil utilizadores terá de ser validada por testes de carga, limites de database, storage, bandwidth, autenticação e provider IA. Backups de Postgres não substituem uma política de backup de objectos; media publicados devem ter estratégia de retenção e recuperação própria [2].

## Próxima implementação

O próximo corte funcional deve criar a ligação configurável, as tabelas de identidade e projectos, o fluxo de sessão e o primeiro teste de integração: criar conta, iniciar sessão, criar projecto, guardar manifesto, terminar sessão, voltar a entrar e reabrir o projecto no Studio local. Sem esse teste, não se deve começar pelo feed ou pelas mensagens.

## Referências

[1]: https://supabase.com/docs/guides/auth "Supabase Auth"

[2]: https://supabase.com/docs/guides/database/overview "Supabase Database"

[3]: https://supabase.com/docs/guides/storage "Supabase Storage"

[4]: https://vercel.com/docs/storage "Vercel Storage overview and Marketplace"
