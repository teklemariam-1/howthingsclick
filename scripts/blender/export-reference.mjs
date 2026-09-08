import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
await build({
  entryPoints: ['scripts/blender/export-reference.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'work/export-cybercab.cjs',
});
const r = spawnSync(process.execPath, ['work/export-cybercab.cjs'], {
  stdio: 'inherit',
  windowsHide: true,
});
process.exitCode = r.status ?? 1;
