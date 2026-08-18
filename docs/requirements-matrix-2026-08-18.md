# Fernando Lucoco Music — Matriz de requisitos da especificação enviada

Fonte principal: `/home/ubuntu/upload/pasted_content.txt`, enviada pelo utilizador em 18-08-2026. A referência BandLab deve servir apenas como categoria e padrão de experiência; a identidade, marca, textos, imagens, código e layout pixel-perfect devem ser originais.

## Visão e UX

A plataforma pretendida combina rede social musical, estúdio de gravação, DAW simplificada, gravador vocal, instrumentos virtuais, teclado, bateria electrónica, sampler, loops/samples, efeitos, Auto-Tune, IA, mixagem, masterização, distribuição, perfil artístico, colaboração, descoberta e cloud projects. O princípio é esconder complexidade com **Modo Fácil** e **Modo Profissional**.

## Entrada, conta e onboarding

A landing deve ser cinematográfica e mostrar waveform, piano roll, microfone, mixer, instrumentos, efeitos, IA e projectos, com CTAs para começar, entrar e explorar o Studio. O cadastro deve suportar email/password e Google, com perfil de nome, username, nome artístico, foto, género, localização opcional e objectivos. O onboarding deve perguntar género musical e intenção inicial: gravar voz, criar beat, usar instrumental, criar música com IA, usar instrumento ou abrir projecto.

O acesso público deve ser limitado à landing e demonstração controlada. Gravações, instrumentais, biblioteca, projectos e Studio devem permanecer protegidos até autenticação e onboarding concluídos.

## Dashboard, projectos e cloud

Após login, o dashboard deve ter Home, Studio, Projects, Sounds, Beats, Instruments, AI, Mastering, Community, Profile e Settings; no mobile, navegação inferior. Deve mostrar continuar a criar, projectos recentes, novo projecto, gravar agora, sons, instrumentos e projectos da comunidade.

Cada projecto precisa de título, capa, artista, data, duração, BPM, tonalidade, tracks, versão e estado, com abrir, duplicar, renomear, partilhar, exportar, arquivar, excluir e restaurar. Cloud projects devem suportar autosave, sincronização, continuidade noutro dispositivo, versões e estados “Salvo agora”, “Sincronizando...” e “Sincronizado”.

## Studio DAW

O Studio deve ser uma aplicação fullscreen, não uma página editorial. O header precisa de nome da música, BPM, key, play/pause/stop, record, undo/redo, guardar, partilhar e exportar. O centro é timeline com tracks, waveforms, MIDI e markers; o lado contém controlos da track; o transporte deve permanecer acessível.

Tracks previstas: Audio, MIDI, Instrument, Drum, Vocal, Bus e FX. Cada uma precisa de volume, pan, mute, solo, record arm, input, output, FX e automação.

## Gravação e edição

A gravação deve pedir microfone, mostrar input level, peak meter, latência, microfone seleccionado, monitor e countdown, gerar waveform em tempo real e permitir múltiplos takes com Keep, Delete e Re-record, incluindo comped vocal. A edição deve suportar cortar, dividir, mover, duplicar, apagar, copiar, colar, fades, normalizar, ganho, silêncio, reverse, stretch e transpose, com waveform interactiva.

## Instrumentos e MIDI

O teclado virtual deve suportar touch, rato, teclado físico e MIDI, com instrumento, oitava, velocity, sustain e quantização. Instrumentos: piano, electric piano, organ, synth, bass, strings, guitar, brass, pads e leads. O MIDI editor/piano roll deve permitir criar, mover, redimensionar, apagar, duplicar, quantizar, alterar velocity/duração, snapping e grids 1/4, 1/8, 1/16, 1/32 e triplets.

A Drum Machine deve ter kick, snare, clap, hi-hat, open hat, percussion, tom, crash e cymbal, com BPM, swing, velocity, pattern, loop e kits. O Looper deve gravar, duplicar, combinar e desfazer camadas, com BPM ajustável. O Sampler deve importar áudio, cortar, mapear, alterar pitch, reverse, loop, ADSR e filtro.

## Sons e instrumentos

A biblioteca deve ter Drums, Bass, Melody, Keys, Guitar, Vocals, FX, Percussion, One Shots, Loops, Samples e Instrumentals, com pesquisa e filtros por género, BPM, key, instrumento, mood e duração. My Sounds deve permitir uploads privados de samples, loops, beats, vocals e instrumentais, pastas, favoritos, tags e pesquisa. Instrumentos virtuais devem ter interface, presets, controlos, teclado, MIDI, volume e efeitos.

## Voz e IA

Autopitch deve ter key, scale, correction, speed, humanize, formant e mix, com presets Natural, Pop, Trap, Rap, Afrobeats, R&B, Hyperpop, Robot e Extreme e preview não destrutivo. Voice Cleaner IA deve analisar ruído, eco, frequência e dinâmica e oferecer Noise Removal, DeReverb e AutoEQ com bypass individual.

AI Voice Tools previstas: Voice Cleaner, Voice Changer, Pitch Correction, Harmony, Vocal Enhancement, DeNoise, DeReverb, AutoEQ e Voice Character, sempre com preview antes de aplicar. Music AI deve gerar ideia, melodia, acordes, baixo e bateria e permitir Extend, Recompose e Layer. Palette deve combinar loops por género, mood, BPM e key, com regenerar, favoritar, apagar e adicionar ao Studio. Audio-to-MIDI deve converter voz, instrumento ou bateria em MIDI. Stem Splitter deve produzir vocals, drums, bass, piano, guitar e other com solo/mute e exportação individual.

## FX, mixer, automação e mastering

FX previstos: EQ, compressor, limiter, reverb, delay, chorus, flanger, distortion, saturation, de-esser, noise gate, auto filter, pitch e vocal FX. Cada efeito precisa de presets, on/off, controlos, reset e preview. O FX Preset Generator deve converter uma descrição textual numa cadeia, permitindo preview, apply, modify e save preset.

O Mixer deve ter canais com volume, pan, mute, solo, FX, input, output, meter, master channel, VU e peak meters. Automação deve suportar volume, pan, FX, pitch e parâmetros. AutoMix deve analisar tracks, ajustar volume/pan/equilíbrio por género e permitir preview, apply e edição manual.

Mastering separado com presets Clean, Loud, Warm, Bright, Punch, Cinematic, Spatial e Natural; controlos intensity, loudness, dynamics, stereo e EQ; comparação Before/After.

## Player, exportação e publicação

Player persistente com play, pause, previous, next, seek, volume, progresso, waveform e mini-player no dashboard. Exportação prevista em MP3, WAV, FLAC e stems, com qualidades MP3 128/192/256/320 kbps e WAV 16/24-bit, mostrando Preparing, Rendering, Mixing, Mastering, Exporting e Completed.

Projectos devem ser Private, Unlisted ou Public, com link partilhável, likes, comentários, follows, partilha e Remix/Fork opcional.

## Comunidade e plataforma artística

Feed com songs, projects, videos, beats e short clips; likes, comentários, repost, share e follow; descoberta por Trending, New, Recommended e Following. Perfil com foto, nome artístico, username, bio, géneros, músicas, projectos, seguidores, seguindo, banner, fotos e Artist Highlights. Fases futuras: distribuição de singles/EP/álbuns, oportunidades, fan reach, promoção, analytics, monetização e marketplace.

## Critério de execução

Cada requisito deve ser classificado como **implementado**, **parcial**, **ausente** ou **bloqueado**, com evidência no preview/teste. O próximo trabalho deve priorizar arquitectura de ecrãs e Studio fullscreen antes de adicionar novas funcionalidades isoladas.
