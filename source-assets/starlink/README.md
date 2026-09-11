# Starlink source assets

The editable Blender scene is `starlink-hardware.blend`. It contains the original satellite and Standard 4 X terminal geometry, named assembly groups, material nodes, a studio camera and lights.

Rebuild with:
```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python scripts/blender/create-starlink.py
```

The builder writes the runtime model to `public/models/starlink-hardware.glb` and an editable scene to `work/starlink/starlink-hardware.blend`. Copy the latter here after approved model changes.

The models are educational reconstructions from the official references listed in `docs/starlink-reference-assets.md`. The internal circuit layout, routing, array element count and motion are illustrative.

## Producing the films

1. Run `npm run dev -- --host 127.0.0.1 --port 3000`.
2. In another terminal, run `node scripts/starlink-export-server.mjs`. The helper binds only to 127.0.0.1:4319 and accepts exports from the local lab.
3. Open `http://localhost:3000/starlink`. Choose Full film or Short, then **Render smooth master**. This local development control encodes every frame using WebCodecs, with exact timestamps at 30 fps. Rendering may take longer than the film's playing time.
4. The helper uses the installed Shotcut FFmpeg to mux an MP4 into `work/starlink/renders`. The production website remains a static frontend and does not use this helper.
5. Run `node scripts/export-starlink-tour.mjs` whenever the story changes. Record each narration paragraph against its timing sheet. Add the resulting audio in Shotcut, or import it locally and use Record tour.
6. **Record tour** is a real-time browser capture; performance depends on the browser/device. Use **Render smooth master** for the guaranteed frame-complete visual master. The master has no narration audio or burned narration captions.

The full edit is 1920 × 1080, 4,500 frames / 150 seconds. The Short is 1080 × 1920, 1,800 frames / 60 seconds. Both use the same models and story definitions, with dedicated framing.

