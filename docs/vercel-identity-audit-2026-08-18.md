# Auditoria de identidade Vercel — 2026-08-18

## Evidência consultada

A equipa Vercel auditada é `team_jBg1xrPwh4DtgSCEqpGyOpzy`, denominada `fernandolukoki94-beep's projects`.

## Projecto web correcto

- Nome: `fernando-lucoco-music`
- Project ID: `prj_hrW8bT8iuvBGAjI3pT1ga3rh8Jr4`
- Domínio: `https://fernando-lucoco-music.vercel.app`
- Último deployment: `dpl_C94hqrYLGpS74YcHtposTQ2SvTiA`
- Estado: `READY`, produção
- Repositório Git indicado pelo deployment: `fernandolukoki94-beep/Bora-uzima-`
- Commit publicado: `66e2311f9e5b5e923d73fd48e52055f0e1abeae2`
- Mensagem do commit: `feat: add firebase authentication foundation`

## Projecto diferente MemoryOS

- Nome: `luko-memoryos`
- Project ID: `prj_RGrSlajufj6oX5c9y4pwpxRwI9mO`
- Domínio: `https://luko-memoryos.vercel.app`
- Último deployment: `dpl_5rPPinJgwQXAQmuywPGoTwURH58n`

## Diagnóstico actual

O domínio `fernando-lucoco-music.vercel.app` não está associado ao projecto `luko-memoryos` segundo a API Vercel. O problema observado no checkpoint/pré-visualização é separado: o ambiente de checkpoint está associado ao projecto móvel `bora-uzima-mobile` (`version a9c29f46`), cuja pré-visualização mostrou MemoryOS. Além disso, o clone local do repositório web tem alterações não commitadas e o último commit publicado no Vercel é anterior a essas alterações (`66e2311`). Portanto, as alterações locais mais recentes ainda não foram demonstradas como publicadas no domínio web.

## Consequência

Não se deve publicar o checkpoint `a9c29f46` como se fosse Fernando Lucoco Music. É necessário criar/usar um checkpoint do projecto web correcto e publicar um commit web actualizado no projecto Vercel `prj_hrW8bT8iuvBGAjI3pT1ga3rh8Jr4`.
