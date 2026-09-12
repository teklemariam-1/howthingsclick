import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const result = spawnSync(
  process.execPath,
  [resolve('node_modules/vinext/dist/cli.js'), 'build'],
  {
    stdio: 'inherit',
    env: { ...process.env, HTC_STATIC_EXPORT: '1' },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
for (const route of [
  '',
  'engine',
  'car',
  'self-driving',
  'starlink',
  'rocket-recovery',
]) {
  const html = route
    ? [`dist/client/${route}.html`, `dist/client/${route}/index.html`]
    : ['dist/client/index.html'];
  if (!html.some(existsSync))
    throw new Error(`Static export is missing /${route}`);
}
console.log(
  'Vercel static build ready: homepage, engine, car, self-driving, Starlink, and rocket recovery.',
);
