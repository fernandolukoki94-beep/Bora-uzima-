# Checklist de QA físico — Fernando Lucoco Music

## Objectivo

Validar a experiência web-first em dispositivos reais antes de promover o IndexedDB para fonte de leitura primária. Este documento não afirma compatibilidade perfeita; regista critérios reproduzíveis para Safari iOS e Chrome Android.

## Preflight automático

Antes de testar a gravação, abrir o diagnóstico local do projecto ou executar `runMobilePreflight(window)` na consola do navegador. Registar o resultado de MediaRecorder, AudioContext, OfflineAudioContext, IndexedDB, `mediaDevices.getUserMedia` e Blob URLs. Um preflight incompleto não reprova sozinho o dispositivo, mas exige registar a limitação e testar o fluxo alternativo correspondente.

## Safari iPhone

| Área | Procedimento | Critério de aprovação |
|---|---|---|
| Microfone | Abrir o site em HTTPS, conceder permissão e gravar uma take de pelo menos 5 segundos | A gravação inicia, o contador avança e a take fica disponível sem erro de permissão |
| Reprodução | Reproduzir o original e a versão processada, com o iPhone em modo silencioso e com volume audível | O áudio reproduz inline, sem navegação inesperada ou bloqueio permanente |
| Interrupção | Durante a gravação e reprodução, bloquear/desbloquear o ecrã e trocar de aplicação por alguns segundos | O estado fica coerente; se o sistema interromper o áudio, a interface comunica o estado e permite recuperar |
| Timeline | Mover, trim, split, fade, ganho, duplicar e apagar um clip | Cada operação é táctil, reversível com Undo/Redo e não altera o original persistido |
| Mixer | Alterar gain, pan, mute e solo numa sessão com duas tracks | A alteração é visível, persistida após reload e reflectida no Mixdown |
| Mixdown | Exportar Mixdown WAV com uma take de áudio | O download inicia ou o sistema apresenta uma acção de partilha/download válida; o ficheiro contém RIFF/WAVE |
| Persistência | Fechar o separador, reabrir o site e recarregar a sessão | A sessão e a take continuam recuperáveis; qualquer fallback é comunicado sem perda silenciosa |

## Chrome Android

| Área | Procedimento | Critério de aprovação |
|---|---|---|
| Microfone | Repetir a gravação com permissão concedida e negada | O caso permitido grava; o caso negado apresenta mensagem útil e não deixa o botão bloqueado |
| Reprodução | Reproduzir original, processado e timeline | O áudio toca após gesto do utilizador e respeita o controlo de volume do dispositivo |
| Memória | Gravar três takes curtas, recarregar e apagar uma com confirmação | A interface permanece responsiva e a remoção não apaga outras sessões |
| Timeline/Mixer | Repetir as operações tácteis e testar foco/teclado externo se disponível | Alvos de toque são utilizáveis, sem scroll horizontal obrigatório ou sobreposição do Mixer |
| Mixdown | Exportar a sessão e abrir o ficheiro descarregado | O ficheiro é criado localmente e pode ser aberto por um reprodutor compatível |
| IndexedDB | Repetir reload, fechar/reabrir, quota reduzida e modo privado quando possível | O diagnóstico não indica falsos sucessos; o fallback permanece seguro |

## Registo

Para cada dispositivo, registar modelo, sistema operativo, navegador/versão, data, resultado do preflight e resultado de cada linha. Usar o seguinte formato: `Dispositivo | OS | navegador/versão | preflight | gravação | reprodução | interrupção | timeline | Mixer | Mixdown | persistência | observações`. Não incluir áudio pessoal, tokens ou dados pessoais no relatório público.

A promoção de IndexedDB só é recomendada se todos os critérios de persistência e recuperação passarem em ambos os ambientes, sem perda silenciosa depois de reload, fechar/reabrir, quota reduzida ou modo privado. Caso contrário, manter a leitura primária em localStorage e continuar a escrita dual.
