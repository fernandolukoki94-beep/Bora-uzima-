# Auditoria pública do AI Producer — 2026-08-16

A deployment READY `fernando-lucoco-music-kmgvxn7sg-fernandolukoki94-beeps-projects.vercel.app` corresponde ao commit `50e1e5459963b032645f35f686631b9e538302a8`, `feat: surface ai producer in studio entry`.

A interface pública foi aberta no navegador. O texto `Estúdio vocal web · AI Producer`, `Como testar o AI Producer`, `Producer Studio · AI Producer`, `AI-assisted · local-first` e a descrição do fluxo estão visíveis.

O botão operacional `Pedir recomendação IA` permanece dentro de `#producer-studio-content`, que está oculto enquanto não existir uma take activa. O estado vazio agora explica claramente que é necessário gravar uma take para activar os controlos e materializar o plano na timeline. Isto é comportamento intencional, não ausência do markup.

A versão servida contém também o botão e o script actualizado; a execução real da recomendação depende de uma take e o provider pode continuar limitado por quota. A auditoria não autoriza o microfone nem inventa uma gravação.
