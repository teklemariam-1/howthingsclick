import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('work/rocket-recovery', { recursive: true });
await build({
  entryPoints: ['tests/rocket-recovery.test.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'work/rocket-recovery/tests.cjs',
});
const r = spawnSync(process.execPath, ['work/rocket-recovery/tests.cjs'], {
  stdio: 'inherit',
  windowsHide: true,
});
process.exitCode = r.status ?? 1;
