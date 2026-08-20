# Auditoria pública — 2026-08-20

Fonte observada: https://fernando-lucoco-music.vercel.app/

A página pública abriu no hash `#studio-home` com uma sessão autenticada já disponível no navegador de teste. O domínio serviu o shell Control Room e mostrou os controlos Home, Projectos, Criar, Sons, AI Producer, Studio, Mix e Exportar. A sessão estava vazia: `Ainda não há sessões guardadas`, `00:00 / 00:00`, Vocal Original sem waveform e Instrumental Beat sem clips.

Controlos visíveis no Studio: criar sessão, Gravar, importar ficheiro, abrir Sons, Beat Maker, abrir AI Producer, transporte Play/Pause/Stop, Guardar sessão e Exportar WAV. Ao clicar em Nova sessão, a UI mudou para `Nova sessão · Guardado localmente`, confirmando que a navegação responde. Ao clicar em Beat Maker, a área Instrument Lab ficou disponível com teclado, acordes, groove, piano roll, sampler e looper.

Não foi encontrado texto exacto `Aplicar Producer Plan` na superfície actualmente renderizada durante esta primeira passagem. O Instrument Lab expôs `＋ Timeline`, `▶ Tocar groove`, `Gravar MIDI` e o botão `Beat Maker`, mas a sessão ainda não mostrou uma Audio Track com waveform ou duração depois da abertura; é necessário continuar a reproduzir os controlos e observar o estado da timeline.

A página pública confirmou a presença visual dos componentes, mas ainda não provou que a materialização WAV, playback e autosave funcionam no domínio. Esta distinção é intencional: a auditoria não deve marcar a funcionalidade como concluída só porque o botão existe.

## Resultado funcional reproduzido

Na mesma sessão pública `Beat Studio Take 1`, foi accionado `＋ Timeline` no acorde Piano/C. O site passou de `00:00 / 00:00` para `00:00 / 00:04`, criou um manifesto com `2 tracks`, aumentou o armazenamento IndexedDB para `460.8 KB` e apresentou a confirmação `Instrumental materializado`. O Control Room passou a reconhecer uma duração de quatro segundos.

Depois foi accionado `Aplicar Producer Plan`. O site actualizou a sessão para `4 tracks`, duração `00:00 / 00:20`, mostrou `Producer Plan local aplicado`, mudou a etapa para `Arranjo local concluído` e exibiu a confirmação `Producer Plan aplicado: Afrobeat, 100 BPM, 6 instrumentos na faixa do produtor.` Isto prova que o bundle público contém e executa a materialização/arranjo local; a primeira impressão de que nada tinha sido acrescentado veio de a timeline começar vazia e exigir a acção `＋ Timeline` ou `Aplicar Producer Plan`.

Ainda falta, nesta auditoria, validar gravação de microfone, reload persistente e exportação Mixed WAV com uma take vocal real. Também é necessário confirmar se a aplicação continua a exibir as novas tracks depois de recarregar a página.


## Persistência após reload

Após recarregar `https://fernando-lucoco-music.vercel.app/#studio-home`, o domínio reconstruíu a sessão `Beat Studio Take 1` com `4 tracks` e manteve `IndexedDB activo · 460.8 KB de 10.0 GB usados localmente`. A persistência do manifesto e dos blobs instrumentais foi, portanto, confirmada no browser público de teste. O domínio não mostra a sessão como vazia depois do reload.
