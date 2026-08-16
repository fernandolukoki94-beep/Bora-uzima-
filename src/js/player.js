export function bindPlayerEvents(list, showToast) {
  list.addEventListener("play", (event) => {
    list.querySelectorAll("audio").forEach((audio) => {
      if (audio !== event.target) audio.pause();
    });
  }, true);

  list.addEventListener("error", (event) => {
    if (event.target.matches?.("audio")) {
      showToast("Esta take não pode ser reproduzida neste navegador. Tenta descarregar o ficheiro.");
    }
  }, true);
}
