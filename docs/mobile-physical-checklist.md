# Checklist de teste físico móvel

Esta checklist deve ser executada em dispositivos reais. Os testes de preview Chromium e os testes Node não substituem esta evidência.

## Chrome Android

| Teste | Resultado | Observações |
|---|---|---|
| Abrir o site em HTTPS | Pendente | Confirmar URL Vercel oficial |
| Permitir microfone | Pendente | Deve mostrar estado pronto |
| Negar microfone | Pendente | Deve mostrar mensagem accionável |
| Gravar 30 segundos | Pendente | Confirmar timer e paragem |
| Gravar 5 minutos | Pendente | Confirmar estabilidade e espaço |
| Reproduzir take original | Pendente | Confirmar áudio inline |
| Aplicar +3 dB | Pendente | Confirmar processada separada |
| Aplicar fade | Pendente | Confirmar cadeia sem apagar original |
| Descarregar WAV original | Pendente | Confirmar extensão e ficheiro |
| Descarregar WAV processado | Pendente | Confirmar extensão e ficheiro |
| Reabrir e recuperar sessão | Pendente | Confirmar armazenamento local |

## Safari iPhone

| Teste | Resultado | Observações |
|---|---|---|
| Abrir o site em HTTPS | Pendente | Confirmar URL Vercel oficial |
| Permitir microfone | Pendente | Confirmar prompt e retorno |
| Gravar e parar | Pendente | Confirmar `playsinline` e timer |
| Reproduzir take original | Pendente | Confirmar reprodução inline |
| Aplicar +3 dB | Pendente | Confirmar WAV processado |
| Aplicar fade | Pendente | Confirmar original preservado |
| Descarregar WAV | Pendente | Confirmar download no iOS |
| Bloquear e desbloquear ecrã | Pendente | Confirmar recuperação de estado |
| Reabrir Safari | Pendente | Confirmar dados locais |

## Critério de conclusão

A compatibilidade física só deve ser marcada como **PASS** depois de cada linha ter evidência no dispositivo e navegador correspondentes. Até lá, o README deve manter o estado como pendente.
