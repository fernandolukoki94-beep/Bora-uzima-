from pathlib import Path
import math
import wave

ROOT = Path(__file__).resolve().parents[1] / "test-audio"
ROOT.mkdir(exist_ok=True)
RATE = 44100


def write_wav(name, seconds, channels, tones):
    frames = int(seconds * RATE)
    path = ROOT / name
    with wave.open(str(path), "wb") as output:
        output.setnchannels(channels)
        output.setsampwidth(2)
        output.setframerate(RATE)
        for index in range(frames):
            time = index / RATE
            values = []
            for channel in range(channels):
                sample = sum(math.sin(2 * math.pi * frequency * time) * amplitude for frequency, amplitude in tones[channel % len(tones)])
                envelope = min(1.0, index / (RATE * 0.02), (frames - index) / (RATE * 0.05))
                values.append(max(-0.95, min(0.95, sample * envelope)))
            output.writeframesraw(b"".join(int(value * 32767).to_bytes(2, "little", signed=True) for value in values))


write_wav("voice.wav", 2.0, 1, [[(220, 0.22), (440, 0.08)]])
write_wav("beat.wav", 2.0, 1, [[(90, 0.24), (180, 0.08), (520, 0.03)]])
write_wav("stereo-test.wav", 1.0, 2, [[(330, 0.2)], [(660, 0.2)]])
print(f"Generated QA WAV fixtures in {ROOT}")
