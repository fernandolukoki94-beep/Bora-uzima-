# Fernando Lucoco Music

**Fernando Lucoco Music** é um estúdio vocal web-first para transformar ideias em demos com um fluxo simples, claro e local-first. A primeira versão foi desenhada para funcionar directamente no navegador, sem custos externos e sem enviar áudio automaticamente para um servidor.

> A tua voz. A tua demo. O teu próximo take.

## Site online

A versão pública está disponível em [fernando-lucoco-music.vercel.app](https://fernando-lucoco-music.vercel.app/) e também em [fernandolukoki94-beep.github.io/Bora-uzima-](https://fernandolukoki94-beep.github.io/Bora-uzima-/). O repositório mantém o nome técnico `Bora-uzima-` para não quebrar o histórico e os links existentes, mas a identidade pública do produto passa a ser **Fernando Lucoco Music**.

## O que está implementado

| Área | Estado | Descrição |
|---|---:|---|
| Landing page | Pronto | Experiência responsiva com posicionamento do produto e autoria de Fernando Lucoco. |
| Gravação vocal | Pronto | Usa `MediaRecorder` e `getUserMedia` quando o navegador suporta acesso ao microfone. |
| Feedback de gravação | Pronto | Estado de gravação, temporizador, botão de parar e feedback visual. |
| Sessões locais | Pronto | Nome, tratamento vocal, género, duração, data e estado são guardados no `localStorage` deste navegador. |
| Reprodução e descarregamento | Pronto | Takes novas podem ser reproduzidas e descarregadas no próprio navegador. |
| Eliminação local | Pronto | Cada sessão pode ser apagada com confirmação explícita. |
| Presets de produção | Pronto como interface | Inclui Natural, Auto-Tune leve/forte, Vocal brilhante/íntimo e géneros de produção. |
| Processamento musical real | Não feito | O fluxo PROCESSING → MIXING → MASTERING é apenas uma simulação visual local; nenhum DSP, IA ou masterização real foi executado. |
| Upload e sincronização | Não feito | Não é activado nesta versão; evita custos e mantém o controlo local do áudio. |

## Compatibilidade móvel web

A interface foi optimizada para Safari iPhone e Chrome Android com alvos touch de pelo menos 44px, campos de entrada de 16px para evitar zoom involuntário, safe-area no aviso flutuante, cartões empilhados em ecrãs pequenos, reprodução `playsinline`/`webkit-playsinline`, pausa automática de outros players, fallback MIME (`audio/mp4` → `audio/webm` → `audio/ogg`) e mensagens específicas para permissões, HTTPS, microfone ausente e interrupção ao sair da página.

A verificação automatizada foi executada no preview local com Chromium e confirmou markup, MIME candidates, reprodução, descarregamento, eliminação e limpeza de `localStorage`. **Ainda não afirmo compatibilidade perfeita em dispositivos físicos:** falta testar manualmente um iPhone com Safari e um Android com Chrome, incluindo permitir/negar microfone, bloquear o ecrã, voltar à aplicação e reproduzir uma take longa.

## QA verificado

A versão publicada foi verificada com uma take sintética no navegador: reprodução, descarregamento, eliminação com confirmação e sequência visual `PROCESSING` → `MIXING` → `MASTERING` → `COMPLETED`. O áudio sintético foi removido no final do teste. O detalhe dos testes está em [`qa-web-findings.md`](./qa-web-findings.md).

> Importante: estes estados são uma simulação honesta da experiência de produção. O projecto ainda não executa DSP, auto-tune, remoção de ruído, mixing, mastering ou IA reais.

## Como testar localmente

Clone o repositório e sirva a pasta com qualquer servidor HTTP local. O acesso ao microfone costuma exigir `localhost` ou HTTPS; abrir o ficheiro directamente pode impedir a permissão de gravação em alguns navegadores.

```bash
git clone https://github.com/fernandolukoki94-beep/Bora-uzima-.git
cd Bora-uzima-
python3 -m http.server 8000
```

Depois, abra `http://localhost:8000`, autorize o microfone e use a secção **O teu estúdio, aqui**. As sessões guardadas ficam apenas no navegador e podem ser removidas limpando os dados locais do site.

## Direcção de produto

O projecto segue uma estratégia **web-first**. Primeiro estabiliza-se a experiência de gravação e gestão local em Chrome, Safari e navegadores móveis; depois entram reprodução das takes, presets visuais de produção, exportação e sincronização opcional. Só após essa validação será retomada a transformação numa aplicação nativa para Android e iOS.

A implementação mobile em `/home/ubuntu/bora-uzima-mobile` permanece separada e em espera. Ela não substitui a experiência web pública e conserva o histórico técnico da primeira exploração com Expo/React Native.

## Identidade e autoria

O produto é dirigido e desenvolvido por **Fernando Lucoco**. O nome técnico do repositório não foi alterado nesta fase para preservar o histórico do projecto original e os endereços já partilhados.

## Stack actual

- **Frontend:** HTML5, CSS moderno e JavaScript sem dependências externas.
- **Áudio:** MediaDevices API e MediaRecorder API do navegador.
- **Persistência:** localStorage, com dados mantidos localmente por instalação/navegador.
- **Publicação:** GitHub Pages e Vercel, com alias público `fernando-lucoco-music.vercel.app`.

## Roadmap

1. Testar reprodução, descarregamento e eliminação em Chrome, Safari iOS e Chrome Android.
2. Substituir a simulação por um pipeline de áudio real apenas depois de definir processamento local ou backend sem custos inesperados.
3. Implementar análise vocal e recomendações somente quando houver testes reais de pitch, timing, ruído e dinâmica.
4. Publicar a versão estabilizada no Vercel e registar o URL público no portfólio.
5. Retomar a versão mobile depois da experiência web cumprir os critérios de qualidade.

## Licença

Este projecto é disponibilizado sob a licença MIT.

---

**Fernando Lucoco Music · 2026**
