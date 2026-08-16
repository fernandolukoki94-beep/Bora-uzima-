# Fernando Lucoco Music — Plataforma e roadmap

## Princípio de execução

O produto segue uma estratégia **web-first, local-first e segura por desenho**. O navegador processa gravações, efeitos, instrumentos e beats localmente. Blobs e metadados permanecem no dispositivo enquanto a persistência IndexedDB não tiver evidência suficiente em dispositivos físicos. Nenhum token, chave de fornecedor ou credencial deve ser colocado em HTML, JavaScript público ou ficheiros enviados ao navegador.

## Motores do produto

| Motor | Responsabilidade actual | Evolução futura controlada |
|---|---|---|
| Music Engine | Projecto normalizado, tracks, clips, timeline, undo/redo, efeitos locais, instrumentos e beat maker | Arranjo avançado, automação, exportação multitrack |
| Audio Engine | Web Audio para notas, acordes, grooves e reprodução local | Renderização de stems, análise de espectro e optimização de performance |
| Storage Engine | localStorage compatível + IndexedDB v2, blobs original/processado, histórico | IndexedDB como fonte primária após QA físico e recuperação comprovada |
| AI Engine | Contrato documentado, sem execução remota no cliente | Endpoints server-side para mix, master, producer, vocal e auto-tune |
| Social Engine | Não activado na V1 | Perfis, feed, comentários, mensagens, seguidores e colaboração |
| Creator Economy | Não activada na V1 | Marketplace de beats, presets, samples, serviços, subscrições e tips |
| Mobile Engine | Projecto separado e posterior | React Native/Expo depois da estabilidade web e dos contratos partilhados |

## Contrato seguro para IA futura

O cliente deverá enviar apenas um identificador de projecto ou um ficheiro explicitamente seleccionado pelo utilizador para um endpoint próprio. O backend valida tamanho, tipo MIME, duração, autorização e limites de utilização antes de encaminhar o trabalho para qualquer fornecedor. As chaves ficam exclusivamente em variáveis de ambiente server-side.

Exemplo conceptual de pedido:

```json
{
  "jobType": "mix|master|producer|vocal|autotune",
  "projectId": "local-project-id",
  "inputRefs": ["original-take-ref"],
  "parameters": {
    "preset": "clean-vocal",
    "intensity": 0.5
  }
}
```

O servidor deve devolver um estado assíncrono (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`) sem bloquear o navegador. A resposta nunca deve incluir credenciais. A versão local continua a funcionar quando não existe rede.

## Colaboração e cloud futura

Perfis, feed, comentários, mensagens e seguidores devem nascer como modelos de dados versionados, mas permanecem desligados até existir autenticação, política de privacidade, moderação, limites de upload e estratégia de recuperação. O projecto local não deve ser convertido em dependente de conta para gravar ou reproduzir áudio.

## Creator Economy futura

A economia do criador poderá incluir venda de beats, presets, samples, serviços de mistura, subscrições e tips. Nenhum pagamento deve ser implementado durante a V1 web-first. Antes de activar esta camada são necessários termos, gestão de direitos, recibos, protecção contra abuso, idempotência e verificação de propriedade dos ficheiros.

## Critérios de passagem

A plataforma só deve avançar para EQ avançado, cloud ou mobile quando a fase anterior tiver testes automatizados aprovados, fallback documentado, evidência de reload e recuperação e QA real em Safari iPhone e Chrome Android. O estado actual é funcional para demonstração local, mas não constitui ainda uma release de produção com cloud ou pagamentos.
