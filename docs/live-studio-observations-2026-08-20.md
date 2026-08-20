# Observações do Studio publicado — 2026-08-20

URL: https://fernando-lucoco-music.vercel.app/#studio-home

A sessão protegida carregou com conta Firebase já autenticada. A shell mostra navegação para Home, Projects, Criar, Sons, AI Producer, Studio, Mix, Community, Profile e Exportar.

A página pública apresenta os controlos reais visíveis: Nova sessão, Abrir Criar, Abrir AI Producer, Abrir Sons, Começar a gravar, input de ficheiro para My Sounds, Guardar em My Sounds, Sincronizar cloud, timeline, mixer e exportação.

A área de gravação mostra campos de nome, preset, género, brief de produção, botão Começar a gravar, monitorização de entrada, volume, microfone, autosave local e IndexedDB activo.

A área My Sounds mostra input de ficheiro, nome, pasta, tags, filtros e estado vazio. Ainda falta testar com um ficheiro WAV/MP3 real se o som é materializado e reproduzido.

Limitação observada: a página inicial não prova que os controlos internos executam acções reais; a reprodução deve ser feita clicando em Sons, AI Producer, Studio e Mix e observando consola, estados de loading, erros e alterações na timeline.
