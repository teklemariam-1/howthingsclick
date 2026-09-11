import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('work/starlink', { recursive: true });
await build({
  entryPoints: ['tests/starlink.test.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'work/starlink/tests.cjs',
});
const r = spawnSync(process.execPath, ['work/starlink/tests.cjs'], {
  stdio: 'inherit',
  windowsHide: true,
});
process.exitCode = r.status ?? 1;
