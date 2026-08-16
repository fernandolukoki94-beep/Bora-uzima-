# Fernando Lucoco Music

**Fernando Lucoco Music** é um estúdio vocal web-first para transformar ideias em demos com um fluxo simples, claro e local-first. A primeira versão foi desenhada para funcionar directamente no navegador, sem custos externos e sem enviar áudio automaticamente para um servidor.

> A tua voz. A tua demo. O teu próximo take.

## Site online

A versão pública está disponível em [fernandolukoki94-beep.github.io/Bora-uzima-](https://fernandolukoki94-beep.github.io/Bora-uzima-/). O repositório mantém o nome técnico `Bora-uzima-` para não quebrar o histórico e os links existentes, mas a identidade pública do produto passa a ser **Fernando Lucoco Music**.

## O que está implementado

| Área | Estado | Descrição |
|---|---:|---|
| Landing page | Pronto | Experiência responsiva com posicionamento do produto e autoria de Fernando Lucoco. |
| Gravação vocal | Pronto | Usa `MediaRecorder` e `getUserMedia` quando o navegador suporta acesso ao microfone. |
| Feedback de gravação | Pronto | Estado de gravação, temporizador, botão de parar e feedback visual. |
| Sessões locais | Pronto | Nome, direcção, duração, data e estado são guardados no `localStorage` deste navegador. |
| Upload e sincronização | Planeado | Não é activado nesta versão; evita custos e mantém o controlo local do áudio. |
| Processamento musical | Planeado | A próxima etapa adicionará presets de mistura/masterização com estados honestos de processamento. |

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
- **Publicação:** GitHub Pages; preparação para alias Vercel na fase de estabilização.

## Roadmap

1. Adicionar reprodução real às takes guardadas, mantendo os blobs de áudio de forma controlada.
2. Implementar estados de processamento para presets de demo vocal, mistura e masterização.
3. Validar permissões, interrupções e recuperação em Safari iOS e Chrome Android.
4. Publicar a versão estabilizada no Vercel e registar o URL público no portfólio.
5. Retomar a versão mobile depois da experiência web cumprir os critérios de qualidade.

## Licença

Este projecto é disponibilizado sob a licença MIT.

---

**Fernando Lucoco Music · 2026**
