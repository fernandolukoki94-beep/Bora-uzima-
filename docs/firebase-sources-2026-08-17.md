# Fontes oficiais Firebase consultadas

As instruções para a migração devem seguir estas referências oficiais:

1. Firebase Web setup: https://firebase.google.com/docs/web/setup — criar um projecto, registar uma aplicação web, instalar o SDK e inicializar a aplicação.
2. Firebase Authentication: https://firebase.google.com/docs/auth — configurar identidade, login e onboarding.
3. Firestore quickstart: https://firebase.google.com/docs/firestore/quickstart — activar o Cloud Firestore e validar a criação de dados.
4. Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started — definir controlo de acesso e validação dos dados.
5. Firebase Security Rules: https://firebase.google.com/docs/rules — visão geral das regras para Firestore e Cloud Storage.
6. Cloud Storage Security Rules: https://firebase.google.com/docs/storage/security — controlar leitura, escrita e validação de ficheiros no Storage.

Decisões derivadas: usar Firebase Authentication para contas, Cloud Firestore para perfis e manifestos de projectos, Cloud Storage para áudio/exportações, e manter o processamento Web Audio/IndexedDB local. Nenhuma credencial administrativa deve entrar no browser; a configuração web pública do Firebase não substitui regras de segurança.
