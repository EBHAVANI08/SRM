# LearnX Safety — On-Prem Relay Agent

This is a small Node/Bun service that runs on a Raspberry Pi or mini-PC
**inside the school network**. It bridges the cloud-hosted LearnX Safety
module to LAN-local IP cameras + local speakers/microphones.

## Why it's needed

The cloud server (`studentrelationshipsystem.space-z.ai`) cannot reach
LAN-local camera IPs (`192.168.x.x`). Browsers cannot play RTSP natively.
Two-way audio (mic listen / PA speak) requires a local audio device.

## What it does

| Endpoint      | Method | Purpose                                                  |
|---------------|--------|----------------------------------------------------------|
| `/health`     | GET    | Health check + reports which binaries are installed      |
| `/probe`      | POST   | Pull one frame via ffmpeg, return resolution/codec/snap  |
| `/snapshot`   | POST   | Grab a fresh snapshot, return as base64                  |
| `/siren`      | POST   | Play siren sound through local speakers                  |
| `/alarm`      | POST   | Play alarm sound through local speakers                  |
| `/pa`         | POST   | Speak text via TTS through local speakers                |
| `/mic`        | POST   | Capture audio from USB mic for N seconds, return base64  |

## Deployment

### 1. Install prerequisites on the Pi

```bash
sudo apt update
sudo apt install -y ffmpeg alsa-utils espeak
# Optional: mpv as audio fallback
sudo apt install -y mpv
```

### 2. Install Bun (or Node 20+)

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 3. Copy this folder to the Pi and install deps

```bash
scp -r scripts/safety-relay-agent pi@192.168.1.10:~/
ssh pi@192.168.1.10
cd safety-relay-agent
bun install express cors  # only if you switch to express; the .ts file uses bare http
```

### 4. Provide sound files

```bash
mkdir sounds
# Place siren.wav and alarm.wav in ./sounds/
# You can generate these via:
#   ffmpeg -f lavfi -i "sine=frequency=800:duration=2" sounds/siren.wav
#   ffmpeg -f lavfi -i "sine=frequency=1200:duration=1" sounds/alarm.wav
```

### 5. Configure environment

```bash
export RELAY_PORT=8080
export RELAY_BIND=0.0.0.0           # or your LAN subnet, e.g. 192.168.1.10
export RELAY_SECRET="your-shared-secret-here"  # set in production!
export SIREN_FILE="./sounds/siren.wav"
export ALARM_FILE="./sounds/alarm.wav"
```

### 6. Run

```bash
bun run relay-agent.ts
```

### 7. Test

```bash
# Health check
curl http://localhost:8080/health

# Probe a camera (replace with your camera's RTSP URL)
curl -X POST http://localhost:8080/probe \
  -H "Content-Type: application/json" \
  -H "X-Relay-Secret: your-shared-secret-here" \
  -d '{"streamUrl":"rtsp://admin:pass@192.168.1.50/stream1","credentials":{"user":"admin","pass":"pass"}}'

# Test siren
curl -X POST http://localhost:8080/siren -H "X-Relay-Secret: your-shared-secret-here"
```

### 8. Wire to the cloud Safety module

In the LearnX Safety UI → Live Cameras tab → Add/Edit Camera → set the
**On-prem Relay URL** field to `http://192.168.1.10:8080` (your Pi's LAN IP).

The cloud will then:
- Send `/probe` when you click "Test Connection"
- Send `/snapshot` when the VLM detection sweep runs
- Send `/siren`, `/alarm`, `/pa`, `/mic` when you click those buttons in the camera focus modal

## Security

- **Bind to LAN only** — set `RELAY_BIND` to your Pi's LAN IP, not `0.0.0.0`.
- **Set `RELAY_SECRET`** — the cloud module must send this in the `X-Relay-Secret` header.
  (TODO on the cloud side: add the secret to the relay request. For now, the relay
  runs in dev mode without auth if `RELAY_SECRET` is unset.)
- **Never expose this agent to the public internet.** If you need remote access,
  use a VPN or SSH tunnel — do NOT port-forward port 8080.
- For TLS, put nginx in front with a self-signed cert + Let's Encrypt (if you
  have a domain pointing to the Pi).

## Camera compatibility

Tested RTSP URL formats (set `streamUrl` on the camera in the Safety UI):

| Brand     | RTSP URL                                                      |
|-----------|---------------------------------------------------------------|
| Hikvision | `rtsp://user:pass@IP:554/Streaming/Channels/101`             |
| Dahua     | `rtsp://user:pass@IP:554/cam/realmonitor?channel=1&subtype=0`|
| Axis      | `rtsp://user:pass@IP:554/axis-media/media.amp`               |
| Generic   | `rtsp://user:pass@IP:554/stream1`                            |

For HTTP-MJPEG cameras that expose a snapshot URL (e.g.
`http://user:pass@IP/cgi-bin/snapshot.jpg`), the cloud can probe directly
without the relay — use protocol `HTTP_MJPEG` when adding the camera.

## Troubleshooting

- **ffmpeg not found** — `sudo apt install ffmpeg`
- **aplay not found** — `sudo apt install alsa-utils`
- **No sound** — check `alsamixer` for muted channels; test with `speaker-test -c 2`
- **Mic not working** — check `arecord -l` lists your USB mic; test with `arecord -d 3 test.wav && aplay test.wav`
- **espeak not found** — `sudo apt install espeak`
- **Camera probe times out** — verify the camera is reachable from the Pi: `ping <camera-ip>` and `ffprobe rtsp://...`
