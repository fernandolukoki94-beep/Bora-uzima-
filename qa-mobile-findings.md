# QA móvel web — Fernando Lucoco Music

Data: 16 de Agosto de 2026

A versão local abriu correctamente em `http://127.0.0.1:4173/` com o título e os controlos principais do Fernando Lucoco Music.

O teste sintético confirmou a presença de controlos de áudio, descarregamento com extensão derivada do MIME (`Mobile QA.m4a`), eliminação e preparação de produção. O browser de teste reportou suporte para `audio/mp4`, `audio/webm;codecs=opus` e `audio/webm`.

O markup final foi verificado com os atributos `playsinline` e `webkit-playsinline`, além dos controlos nativos de áudio. O Chromium continua a reportar a propriedade JavaScript `playsInline` de forma inconsistente neste teste sintético; por isso, os atributos explícitos são mantidos no HTML. Esta verificação não substitui um teste físico em iPhone e Android.

O teste usou dados sintéticos e removeu o registo do `localStorage` no final. Não foram usados ficheiros pessoais nem microfone real.
