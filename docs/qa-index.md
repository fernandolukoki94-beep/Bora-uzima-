# Índice de QA

## O que foi verificado

A versão web foi verificada no preview local com Chromium através de dados sintéticos. Foram confirmados o carregamento do HTML modular, os controlos de áudio, o descarregamento com extensão baseada no MIME, a eliminação de sessões, a preparação visual e a limpeza do `localStorage` no fim do teste.

O relatório geral está em [`../qa-web-findings.md`](../qa-web-findings.md). A compatibilidade específica de gravação e reprodução móvel está em [`../qa-mobile-findings.md`](../qa-mobile-findings.md).

## O que não foi afirmado

Não foi afirmada compatibilidade perfeita em todos os dispositivos. Não foi executada gravação com microfone físico neste ambiente, nem teste real num iPhone Safari ou Android Chrome. Também não foi alegado processamento DSP, Auto-Tune, mixing, mastering, IA, cloud, contas ou sincronização.

## Roteiro de validação física

| Ambiente | Cenários obrigatórios | Resultado esperado |
|---|---|---|
| Safari iPhone | Permitir microfone, gravar, parar, bloquear e voltar, reproduzir take longa | A sessão mantém-se utilizável e o player fica inline |
| Safari iPhone | Negar microfone e tentar novamente | Mensagem clara e nova tentativa possível |
| Chrome Android | Permitir microfone, gravar, parar, reproduzir e descarregar | Take reproduzível e download com extensão correcta |
| Chrome Android | Ausência de microfone ou perda de foco | Erro compreensível sem página bloqueada |
