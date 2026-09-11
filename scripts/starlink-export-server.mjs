// Optional local production helper. Never part of the static website.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../work/starlink/renders',
);
await mkdir(root, { recursive: true });
createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (!['http://localhost:3000', 'http://127.0.0.1:3000'].includes(origin)) {
    res.writeHead(403);
    res.end();
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  const kind =
    req.url === '/exports/full'
      ? 'Full'
      : req.url === '/exports/short'
        ? 'Short'
        : req.url === '/exports/still'
          ? 'Still'
          : null;
  if (req.method !== 'POST' || !kind) {
    res.writeHead(404);
    res.end();
    return;
  }
  const type = req.headers['content-type'] ?? '';
  if (
    kind === 'Still'
      ? type !== 'image/png'
      : !type.startsWith('video/mp4') &&
        !type.startsWith('video/webm') &&
        type !== 'video/h264'
  ) {
    res.writeHead(415);
    res.end();
    return;
  }
  let file = resolve(
    root,
    'HowThingsClick-Starlink-' +
      kind +
      (kind === 'Still'
        ? '.png'
        : type === 'video/h264'
          ? '.h264'
          : type.startsWith('video/mp4')
            ? '.mp4'
            : '.webm'),
  );
  const partial = file + '.partial';
  let count = 0;
  req.on('data', (c) => {
    count += c.length;
    if (count > 600 * 1024 * 1024) req.destroy(Error('Export too large'));
  });
  try {
    await pipeline(req, createWriteStream(partial));
    await rename(partial, file);
    if (type === 'video/h264') {
      const output = file.replace(/\.h264$/, '.mp4');
      await new Promise((resolve, reject) => {
        const job = spawn(
          'C:/Program Files/Shotcut/ffmpeg.exe',
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
            file,
            '-c:v',
            'copy',
            '-movflags',
            '+faststart',
            output,
          ],
          { windowsHide: true },
        );
        let error = '';
        job.stderr.on('data', (d) => (error += d));
        job.on('error', reject);
        job.on('close', (code) =>
          code === 0 ? resolve() : reject(Error(error)),
        );
      });
      file = output;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ path: file, bytes: count }));
    console.log('Saved', kind, count, 'bytes');
  } catch (err) {
    await unlink(partial).catch(() => {});
    if (!res.destroyed) {
      res.writeHead(500);
      res.end('Export failed');
    }
    console.error(err.message);
  }
}).listen(4319, '127.0.0.1', () =>
  console.log('Local Starlink export helper: 127.0.0.1:4319 → ' + root),
);
