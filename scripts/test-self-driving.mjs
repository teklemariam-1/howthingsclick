import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('work', { recursive: true });
for (const test of [
  'self-driving',
  'self-driving-engineering',
  'self-driving-tour',
  'self-driving-mechanisms',
  'self-driving-pedestrian',
]) {
  const outfile = 'work/test-' + test + '.cjs';
  await build({
    entryPoints: ['tests/' + test + '.test.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
  });
  const result = spawnSync(process.execPath, [outfile], {
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    break;
  }
}
