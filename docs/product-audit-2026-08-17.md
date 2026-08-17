# Auditoria de produto — 17 de Agosto de 2026

## Diagnóstico confirmado

O diagnóstico existente do AI Producer indica que `OPENAI_API_KEY` está configurada apenas no servidor, que o teste leve de autenticação passou e que as execuções reais anteriores foram bloqueadas por `provider_quota_exhausted`. A aplicação não deve apresentar recomendação textual como Auto-Tune, mixagem ou masterização remota de áudio. Actualmente, o provider recomenda metadados; o motor Web Audio local executa a decisão de forma reversível.

A configuração da sessão mostra o conector OpenAI desactivado e nenhum conector customizado. Isto não prova, por si só, que o segredo do projecto Vercel esteja ausente, mas confirma que a configuração de conectores desta sessão não deve ser tratada como prova de provider activo.

## Referência de organização observada

A página oficial do BandLab apresenta o produto como uma plataforma de criação musical e, na documentação oficial, mantém áreas separadas para criação musical, mastering, perfil/feed e comunidade. A área de ajuda de `Profile & Feed` expõe explicitamente publicação no feed e limites de seguir utilizadores. Estes padrões justificam separar no Fernando Lucoco Music o workspace de criação, o perfil/feed e a comunidade, em vez de colocar tudo numa página longa.

Fontes consultadas:

- https://www.bandlab.com/?lang=en
- https://help.bandlab.com/hc/en-us/sections/48011199876121-Profile-Feed
- https://www.bandlab.com/mastering?lang=en

## Decisão de produto

O próximo corte não deve tentar implementar simultaneamente uma rede social completa e um novo motor de áudio. Primeiro deve converter a interface actual numa aplicação com rotas/estações claras: Home/Feed, Create, Studio, Sounds, AI Producer, Master/Export, Profile e Messages. A rede social deve começar por entidades e permissões bem definidas, com autenticação e backend; não deve ser simulada apenas com localStorage se a intenção é mensagens e publicação entre utilizadores reais.
