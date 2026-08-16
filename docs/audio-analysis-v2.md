# Análise local de áudio V2

## Objectivo

A V2 introduz uma primeira camada de análise local para que o Producer Plan possa partir da gravação real sem enviar áudio para servidores. O módulo `src/js/audio-analysis.js` recebe amostras PCM e devolve um resultado JSON determinístico.

## Resultado

O contrato inclui duração, presença de áudio, BPM estimado, confiança do BPM, tonalidade aproximada, frequência detectada, confiança tonal e um perfil vocal básico com RMS, pico, zero-crossing rate, dinâmica e indicador de presença.

## Método

O BPM é estimado através de energia por janelas e autocorrelação de onsets, limitado ao intervalo de 60–180 BPM. A tonalidade usa autocorrelação e verificação por cruzamentos de zero, com frequência aproximada limitada ao intervalo de 70–1000 Hz. O perfil vocal é descritivo; não é diagnóstico clínico nem uma separação de voz.

## Integração

O resultado pode ser passado ao Producer Plan com `preferAnalysis: true`. Quando a preferência não é activada, os valores manuais continuam a prevalecer. Quando o navegador não consegue descodificar uma Data URL ou não dispõe de `AudioContext`, o fluxo recua de forma segura sem substituir a gravação original.

## Limitações honestas

Esta análise não promete detecção profissional de tonalidade em acordes complexos, BPM correcto em gravações sem pulso, Auto-Tune, separação vocal, masterização ou geração de áudio. É uma base determinística para orientar o arranjo local. A cadeia vocal reversível e a eventual assistência IA server-side são fases seguintes.

## QA

A suite determinística cobre silêncio, tom de referência, sinais curtos, limites de BPM, confiança e compatibilidade com o Producer Plan. A validação física continua necessária em Chrome Android e Safari iPhone com uma gravação real.
