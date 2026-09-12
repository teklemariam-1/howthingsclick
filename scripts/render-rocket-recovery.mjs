import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_PACKAGE ||
    'C:/Users/tekke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
);
const root = process.cwd(),
  output = resolve(root, 'work/rocket-recovery/renders'),
  publicRoot = resolve(root, 'public');
await mkdir(output, { recursive: true });
const bundle = await build({
  stdin: {
    contents:
      "export {createRecoveryScene,tourDisplay} from './components/rocket-recovery/scene'; export {createRocket,poseRocket} from './components/rocket-recovery/model'; export {Vector3} from 'three';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false,
  target: 'es2022',
});
const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET') {
      res.writeHead(405).end();
      return;
    }
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(
        '<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Rocket production render</title><style>html,body,#stage{margin:0;width:100%;height:100%;overflow:hidden}canvas{display:block}</style></head><body><div id="stage"></div></body></html>',
      );
      return;
    }
    if (path === '/scene.js') {
      res.setHeader('Content-Type', 'text/javascript');
      res.end(bundle.outputFiles[0].contents);
      return;
    }
    const asset = resolve(publicRoot, '.' + decodeURIComponent(path));
    if (!asset.startsWith(publicRoot + sep)) {
      res.writeHead(403).end();
      return;
    }
    const mime = {
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }[extname(asset)];
    if (!mime) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader('Content-Type', mime);
    res.end(await readFile(asset));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: [
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
  ],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.exposeFunction('progress', (frame) =>
    console.log('Rendered ' + frame + ' / 1800 frames'),
  );
  await page.goto('http://127.0.0.1:' + server.address().port);
  const geometry = await page.evaluate(async () => {
    const mod = await import('/scene.js'),
      scene = mod.createRecoveryScene(
        document.getElementById('stage'),
        () => {},
      );
    await scene.ready;
    if (scene.assetErrors.length)
      throw Error('Missing imagery: ' + scene.assetErrors.join(', '));
    globalThis.renderScene = scene;
    globalThis.renderModule = mod;
    const rocket = mod.createRocket('falcon9');
    rocket.root.position.y = 3.4;
    mod.poseRocket(rocket, 1, 0, 0, 0, 0, 0);
    rocket.root.updateMatrixWorld(true);
    const sweep = [];
    for (let n = 0; n <= 40; n++) {
      mod.poseRocket(rocket, n / 40, 0, 0, 0, 0, 0);
      rocket.root.updateMatrixWorld(true);
      sweep.push(
        rocket.legs.map((l) =>
          l.userData.foot.getWorldPosition(new mod.Vector3()).toArray(),
        ),
      );
    }
    mod.poseRocket(rocket, 1, 0, 0, 0, 0, 0);
    rocket.root.updateMatrixWorld(true);
    const feet = rocket.legs.map((l) =>
      l.userData.foot.getWorldPosition(new mod.Vector3()).toArray(),
    );
    const pads = rocket.legs.map((l) =>
      l.userData.foot.localToWorld(new mod.Vector3(0, -0.18, 0)).toArray(),
    );
    scene.update(
      { ...mod.tourDisplay(59), guided: false, shot: undefined, labels: false },
      0,
    );
    const mounts = [];
    for (const gimbal of [-0.2, 0, 0.2]) {
      mod.poseRocket(rocket, 1, 0, gimbal, 0.6, 0, 0);
      rocket.root.updateMatrixWorld(true);
      mounts.push(rocket.engines.getWorldPosition(new mod.Vector3()).toArray());
    }
    for (let i = 0; i < 1800; i++) {
      const d = mod.tourDisplay(i / 30);
      if (d.explode !== 0)
        throw Error('The Short must never detach a firing engine');
    }
    return { feet, pads, sweep, mounts };
  });
  for (const mount of geometry.mounts)
    assert.ok(
      Math.hypot(mount[0], mount[1] - 6.4, mount[2]) < 1e-8,
      'Upper engine attachment stays fixed during gimbal motion',
    );
  for (let i = 0; i < 4; i++) {
    const [x, y, z] = geometry.feet[i],
      opposite = geometry.feet[(i + 2) % 4];
    assert.ok(
      Math.abs(geometry.pads[i][1] - 0.27) < 1e-6,
      'Actual rendered foot pad meets deck',
    );
    assert.ok(
      Math.hypot(x + opposite[0], z + opposite[2]) < 1e-6,
      'Actual opposite legs balance',
    );
    assert.ok(Math.hypot(x, z) > 8);
    assert.ok(y > 0);
  }
  for (const pose of geometry.sweep)
    for (const p of pose)
      assert.ok(
        Math.hypot(p[0], p[2]) > 1.85,
        'Actual animated feet remain outside the booster throughout deployment',
      );
  const preview = await page.evaluate(() => globalThis.renderScene.snapshot());
  await writeFile(
    resolve(publicRoot, 'images/rocket-recovery-preview.png'),
    Buffer.from(preview.split(',')[1], 'base64'),
  );
  const times = [2, 5.8, 9, 16, 24, 34, 44, 51, 58];
  for (const t of times) {
    const png = await page.evaluate((time) => {
      const scene = globalThis.renderScene,
        d = globalThis.renderModule.tourDisplay(time);
      const stream = scene.startCapture(d);
      stream.getTracks().forEach((t) => t.stop());
      scene.update(d, 0);
      return scene.frameCanvas().toDataURL('image/png');
    }, t);
    await writeFile(
      resolve(output, 'shot-' + String(t).replace('.', '-') + '.png'),
      Buffer.from(png.split(',')[1], 'base64'),
    );
  }
  if (!process.argv.includes('--stills')) {
    const downloading = page.waitForEvent('download', { timeout: 1800000 });
    await page.evaluate(async () => {
      const config = {
        codec: 'avc1.420029',
        width: 1080,
        height: 1920,
        framerate: 30,
        bitrate: 18000000,
        latencyMode: 'realtime',
        avc: { format: 'annexb' },
      };
      if (!(await VideoEncoder.isConfigSupported(config)).supported)
        throw Error('H.264 encoder unavailable.');
      const chunks = [];
      let failure;
      const encoder = new VideoEncoder({
        output(chunk) {
          const bytes = new Uint8Array(chunk.byteLength);
          chunk.copyTo(bytes);
          chunks.push(bytes);
        },
        error(e) {
          failure = e;
        },
      });
      encoder.configure(config);
      try {
        for (let i = 0; i < 1800; i++) {
          if (failure) throw failure;
          while (encoder.encodeQueueSize > 5) {
            await new Promise((r) => setTimeout(r, 2));
            if (failure) throw failure;
          }
          globalThis.renderScene.update(
            globalThis.renderModule.tourDisplay(i / 30),
            i === 0 ? 0 : 1 / 30,
          );
          const frame = new VideoFrame(globalThis.renderScene.frameCanvas(), {
            timestamp: Math.round((i * 1000000) / 30),
            duration: Math.round(1000000 / 30),
          });
          encoder.encode(frame, { keyFrame: i % 60 === 0 });
          frame.close();
          if (i % 150 === 0) await globalThis.progress(i);
          if (i % 10 === 0) await new Promise((r) => setTimeout(r, 0));
        }
        await encoder.flush();
        if (failure) throw failure;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/h264' }));
        a.download = 'rocket-short.h264';
        a.click();
      } finally {
        encoder.close();
      }
    });
    const download = await downloading,
      raw = resolve(output, 'HowThingsClick-Rocket-Recovery-Short.h264');
    await download.saveAs(raw);
    const ffmpeg =
      process.env.FFMPEG_PATH || 'C:/Program Files/Shotcut/ffmpeg.exe';
    const result = spawnSync(
      ffmpeg,
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-r',
        '30',
        '-f',
        'h264',
        '-i',
        raw,
        '-c:v',
        'copy',
        '-movflags',
        '+faststart',
        resolve(output, 'HowThingsClick-Rocket-Recovery-Short.mp4'),
      ],
      { windowsHide: true, encoding: 'utf8' },
    );
    if (result.status !== 0) throw Error(result.stderr || 'FFmpeg failed');
  }
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, 'render-check.json'),
    JSON.stringify(
      {
        geometry,
        errors,
        shots: times,
        video: !process.argv.includes('--stills'),
        width: 1080,
        height: 1920,
        frameRate: 30,
        frames: 1800,
      },
      null,
      2,
    ),
  );
  console.log('Rocket render checks passed. Files: ' + output);
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
