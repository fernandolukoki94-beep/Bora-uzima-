# Conclusão de arquitectura

O repositório web actual é uma aplicação HTML/CSS/JavaScript ES Modules com testes Node e persistência local. Não existe uma camada de autenticação, API de utilizadores, feed remoto, armazenamento de media social ou transporte de mensagens entre utilizadores no código do produto.

Consequência: login, publicação, stories e mensagens reais exigem uma fase backend separada, com sessões, base de dados, storage de media, autorização, moderação e limites de upload. IndexedDB pode continuar a ser cache/offline do estúdio, mas não pode ser a fonte de verdade de uma rede social multi-utilizador.
