import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(resolve(root, 'work'), { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ['./tests/vehicle-model.test.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'work/verify-car-model.cjs',
});
const result = spawnSync(
  process.execPath,
  [resolve(root, 'work/verify-car-model.cjs')],
  { stdio: 'inherit', cwd: root },
);
process.exitCode = result.status ?? 1;
