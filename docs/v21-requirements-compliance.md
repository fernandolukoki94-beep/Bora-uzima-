# Conformidade com os requisitos V2.1

Este documento liga o ficheiro [`pasted_content-v21-requirements.txt`](./pasted_content-v21-requirements.txt) ao estado verificável do Fernando Lucoco Music. A análise evita declarar como concluída uma capacidade que só tenha sido simulada visualmente.

| Requisito | Estado | Evidência técnica |
|---|---|---|
| Criar sessão e preservar a gravação original | Implementado | Project Model, armazenamento local e variante `original`. |
| Gravar e analisar localmente | Implementado | MediaRecorder e análise determinística de BPM, tonalidade aproximada e confiança. |
| Editar BPM e tonalidade | Implementado | Producer Studio permite substituir os valores estimados antes de aplicar o plano. |
| Aplicar Producer Plan com consequência musical | Implementado | `materializeProducerPlan()` cria tracks e clips reais na timeline. |
| Preservar clips manuais ao reaplicar o plano | Implementado | Clips marcados pelo plano são substituíveis; clips manuais e Original são preservados. |
| Enhanced e Pitch Corrected reversíveis | Implementado | Variantes separadas, com Original intocável. |
| Mixed a partir do Mixdown | Implementado | Mixdown gera e persiste a variante `mixed`. |
| Master local honesta | Implementado | A etapa é apresentada como headroom/preparação local, sem prometer mastering profissional. |
| A/B Original versus Mixed | Implementado | O Producer Studio dispõe de reprodução comparativa sem substituir a origem. |
| Exportar WAV com nome do projecto | Implementado | Exportador local gera `<take>-mixed.wav` através de Blob/Object URL. |
| Reload de projecto, plano, variantes e timeline | Coberto por QA automatizada | O teste V2.1 serializa, reabre e verifica a continuidade do projecto e dos clips. |
| Validação física no Chrome Android e Safari iPhone | Pendente | Requer execução em dispositivos reais com microfone, reprodução, A/B, exportação e reload. |
| Utilizador novo conclui o fluxo sem assistência | Pendente | Deve ser observado num teste moderado, sem intervenção do programador. |
| IA externa server-side | Fora desta fase | Só deve iniciar depois da validação Beta e nunca com tokens no cliente. |

## Critério de passagem

A V2.1 pode ser chamada **funcional localmente** porque a suite determinística prova a integração entre plano, timeline, variantes, Mixdown, exportação e reload. A promoção para **V2 Beta** exige ainda a validação física nos navegadores-alvo e uma sessão observada com uma pessoa que não conheça o código.

## QA actual

A suite local mais recente terminou com **115 testes aprovados, 0 falhas e 0 testes ignorados**. Esta contagem confirma contratos de motor e integração, mas não substitui a percepção acústica nem a usabilidade de uma pessoa real num dispositivo físico.
