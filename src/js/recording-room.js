function initRecordingRoomMode() {
  const params = new URLSearchParams(window.location.search);
  if (!['studio', 'recording-room'].includes(params.get('room'))) return;
  document.body.classList.add('recording-room-mode');
  document.querySelectorAll('.topbar, #processo, .studio, #sobre, .footer').forEach((node) => node?.setAttribute('hidden', ''));
  const entry = document.querySelector('.control-room-entry');
  entry?.removeAttribute('hidden');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRecordingRoomMode, { once: true });
else initRecordingRoomMode();
