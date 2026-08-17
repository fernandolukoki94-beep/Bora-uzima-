# Fernando Lucoco Music — Roadmap BandLab-like

## Princípio

O produto será evoluído pela mesma lógica de organização de uma plataforma de criação musical completa, sem copiar a marca, o código, os assets ou a identidade visual do BandLab.

## Módulos de produto

| Módulo | Estado actual | Próxima implementação |
|---|---|---|
| Criar | Gravação e importação local | Onboarding de sessão e escolha de ponto de partida |
| Studio | Timeline e transporte locais | Workspace multifaixa com inspector persistente, zoom e drag-to-timeline |
| Sons | Instrument Lab e Beat Maker sintéticos | Biblioteca de loops/one-shots, preview, favoritos e importação para tracks |
| AI Producer | Plano server-side + execução local | Tarefas IA separadas: arranjo, vocal, mix, master e feedback por etapa |
| Vocal | Auto-Tune, pitch, reverb e delay locais | Cadeias vocais salvas, comparação e automação por secção |
| Mix | Mixdown e medidores A/B | Mixer de tracks com volume, pan, mute, solo e buses |
| Master | Compressor/limiter local mensurável | Presets de master, alvo de loudness e validação de clipping |
| Exportar | WAV, manifesto e partilha | Exportação por stems, instrumental, vocal e projecto completo |

## Regra de honestidade da IA

A IA textual server-side deve decidir e explicar planos. O motor local deve executar DSP e manter reversibilidade. Processamento remoto de áudio só será anunciado quando existir provider de áudio, upload seguro, job assíncrono, retorno verificável e testes com ficheiro real.

## Diagnóstico actual do provider

A chave server-side passou o teste de autenticação leve. As execuções anteriores foram bloqueadas por quota do provider, não por falta de ligação na interface. O cliente agora comunica quota, autenticação, indisponibilidade e resposta inválida sem expor a chave.

## Ordem de execução

Primeiro será consolidado o Studio multifaixa e o inspector. Depois será criada a biblioteca de sons com preview e materialização na timeline. Em seguida serão separadas as tarefas do AI Producer e, por fim, serão aprofundados mixer, master e exportação por stems.
