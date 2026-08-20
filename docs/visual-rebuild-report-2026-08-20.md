# Fernando Lucoco Music — Relatório de reedificação visual

**Data:** 20 de Agosto de 2026  
**Escopo:** primeira experiência, landing e consola visual de produto; sem alterar o motor de áudio.

## Decisão de produto

A nova composição segue o contrato do ficheiro master: a landing vende o produto e não substitui o produto. A primeira impressão passou a apresentar explicitamente **waveform, mixer, projectos, autosave e Studio**, com uma linguagem visual de ferramenta de criação musical em vez de uma página editorial genérica.

A reedificação manteve os contratos funcionais existentes. Os pontos de entrada continuam a utilizar os mesmos mecanismos de onboarding, autenticação Firebase, criação de sessão e navegação para o Studio. Não foram introduzidos atalhos para contornar autenticação nem estados falsos de processamento.

## Alterações visíveis

| Área | Alteração |
|---|---|
| Hero | Mensagem alinhada com o produto: criação musical, gravação vocal e produção num só espaço. |
| Identidade | Fundo escuro premium com azul nocturno, violeta, coral e dourado; grelha discreta e contraste de estúdio. |
| Consola de produto | Nova secção visível com três módulos: waveform, mixer com medidores e projectos com autosave. |
| Waveform | Visualização de take com duração, tipo de track e estado de edição. |
| Mixer | Medidores de Vocal, Beat e FX, leitura de pico e estados VOL/PAN/MUTE/SOLO. |
| Projects | Cartões de sessões recentes e CTA funcional para criar novo projecto. |
| Mobile | Grelha reorganizada para uma coluna e botões de largura total em 390px. |

## QA determinística

A suite foi executada depois das alterações:

```text
# tests 193
# pass 193
# fail 0
# cancelled 0
# skipped 0
# todo 0
duration_ms 1559.325231
real 0m2.197s
```

O log completo encontra-se em [`qa-rebuild-2026-08-20.log`](./qa-rebuild-2026-08-20.log).

## Métricas de carregamento no browser

Medição recolhida no preview local `http://127.0.0.1:4180/` em viewport desktop de 1280×1100:

| Métrica | Valor observado |
|---|---:|
| DOMContentLoaded | 339 ms |
| Load event | 344 ms |
| Recursos carregados | 48 |
| Scripts | 47 entradas de recurso |
| CSS principal | 1 entrada de recurso |
| Transfer size reportado | 149 000 bytes |
| IndexedDB | Disponível |
| AudioContext | Disponível |
| MediaRecorder | Disponível |
| Erros de runtime recolhidos | 0 |

Estas métricas são de um preview local e não substituem a medição de produção no Vercel, onde CDN, compressão, cache e rede do utilizador alteram os valores.

## Evidência responsive

A landing foi capturada em viewport simulada de 390×844. A captura confirma:

1. título e subtítulo legíveis;
2. CTA primário e login com largura adequada ao toque;
3. hero reorganizado em coluna;
4. cartão de gravação visível sem overflow horizontal aparente;
5. identidade visual distinta da versão anterior.

Evidência: [`qa-rebuild-mobile-390.png`](./qa-rebuild-mobile-390.png).

## Ficheiros alterados

| Ficheiro | Motivo |
|---|---|
| `index.html` | Novo texto do hero e nova consola de waveform/mixer/projectos. |
| `src/css/styles.css` | Tokens visuais, composição, responsividade e estilos da consola. |

O código funcional de áudio, autenticação e persistência não foi reescrito nesta etapa; foi preservado para reduzir o risco de regressão.

## Estado de publicação

A versão local está pronta para ser sincronizada com o repositório de produção e submetida ao Vercel. A URL pública só deve ser considerada actualizada depois de existir um novo deployment Vercel associado ao commit desta reedificação. A verificação local não é apresentada como prova de publicação.

## Próximo passo

O próximo passo é criar o commit limitado à reedificação visual, sincronizar a branch de produção e verificar o deployment público. Depois disso, deve-se repetir a medição de performance no URL Vercel e executar o fluxo autenticado no dispositivo Android físico.
