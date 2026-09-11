# Loop Encore trailer

A 32-second widescreen trailer, cut around the rainbow loop mechanic. The export lives in `promo/runicorn-trailer.mp4`; its upload copy and association instructions are in `promo/TRAILER-UPLOAD.md`.

## Edit

| Time | Beat |
| --- | --- |
| 0-4s | Zombies meet rainbows |
| 4-12s | Draw a trail, close a loop, catch the herd |
| 12-16s | Megacorn aim and Requiem dash spread |
| 16-20s | Rare Nyan-Unicorn |
| 20-24s | Loops and musical payoffs |
| 24-28s | Warden confrontation and death gag |
| 28-32s | Title and play links |

The recorder uses the current game engine with controlled starting positions and automated steering. It arranges clear encounter shots and restores health during the demonstrations. Movement, projectile behavior, trail intersection, loop rewards, enemy behavior, and death rendering run through the actual game functions. Recording hooks are injected into a local browser response; the production game files are unchanged. Camera crops, titles, and wipes are added by the trailer compositor.

The stereo soundtrack is a separate original 120 BPM synth-funk arrangement: syncopated bass, kick, snare, hats, minor chord stabs, melodic echoes, and a record-stop transition. Six actual loop events drive matching reward accents. No external songs or audio samples are used. The arrangement is not presented as a recording of the adaptive runtime music.

## Rebuild

Requires the project's installed Playwright Chromium and FFmpeg on PATH.

```sh
npm run dev
```

In another terminal from the game repository:

```sh
node scripts/trailer/render.mjs
```

The recorder writes intermediate frames, event timestamps, a WAV mix, and the video master into ignored `release/trailer/`. The finished MP4 and thumbnail are copied to `promo/`. `--preview` generates review stills and audio without encoding a video.

## Verification

- All 960 frames rendered without browser page errors.
- Complete MP4 decode passed without errors.
- H.264, 1920 x 1080, 30 fps; stereo AAC, 48 kHz; 32.000 seconds.
- Encoded audio measured approximately -14.9 LUFS integrated and -1.3 dBFS true peak.
- Reviewed twelve timeline stills, including each headline, the loop payoffs, Nyan, the Warden, death, and the closing card.
- Production game source and the 13,290-byte competition ZIP are unchanged.
