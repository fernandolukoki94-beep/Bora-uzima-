# Matriz de conformidade do ficheiro de avaliação

Esta matriz é a referência de execução do Fernando Lucoco Music. **Concluído** significa que existe no código ou na documentação publicada. **Pendente** significa que ainda não deve ser apresentado como funcionalidade pronta. **Futuro** significa que pertence ao roadmap e exige decisões de produto ou infra-estrutura adicionais.

| Requisito do ficheiro | Estado | Evidência ou decisão |
|---|---|---|
| Identidade pública Fernando Lucoco Music | Concluído | `index.html`, `README.md` e metadados públicos usam a marca. |
| Gravação vocal no browser | Concluído | `MediaRecorder`, permissões, fallback MIME e feedback de estado. |
| Reprodução, download e eliminação locais | Concluído | Player inline, links de download e confirmação de eliminação. |
| Presets honestos | Concluído | Presets marcados como visuais/em desenvolvimento; não alegam DSP. |
| LocalStorage como MVP | Concluído | Persistência local documentada com limitações de dispositivo/navegador. |
| QA automatizado e documentação | Concluído | Relatórios web/mobile, índice QA e matriz física pendente. |
| Compatibilidade física iPhone/Android | Pendente | Requer teste manual com hardware, microfone, bloqueio de ecrã e takes longas. |
| Arquitectura modular HTML/CSS/JavaScript | Concluído parcialmente | CSS e módulos `app`, `recorder`, `storage`, `player` e `production` estão separados. |
| Separação de `src/audio` e pipeline DSP | Pendente | Será criada quando o primeiro efeito real tiver critérios e testes definidos. |
| Primeiro efeito áudio real | Concluído em V1 experimental | Ganho local de +3 dB com Web Audio API, `OfflineAudioContext` e exportação WAV PCM. |
| Contas e autenticação | Futuro V2 | Não fazem parte da V1 local-first. |
| Upload, cloud, backup e sincronização | Futuro V3 | Exigem backend, storage e política de privacidade. |
| Exportação WAV local | Concluído em V1 experimental | Disponível apenas após o ganho local; MP3 continua fora da V1. |
| EQ, compressor, reverb, pitch correction e mastering | Futuro V4 | Exigem pipeline DSP real e testes de áudio. |
| Assistência IA para pitch, BPM, tonalidade e recomendações | Futuro V5 | Deve ser server-side ou baseada em processamento local; nunca com chave no browser. |
| Projecto musical completo com beats, vocals e masters | Futuro V6 | Evolução de produto após validação das fases anteriores. |
| Chave OpenAI ou Expo Dev no site | Não será feito desta forma | Credenciais não serão colocadas no HTML/JavaScript público. |
