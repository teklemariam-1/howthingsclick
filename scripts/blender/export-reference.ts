import { createCybercab } from '../../components/self-driving/geometry';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFileSync } from 'node:fs';
class Reader {
  onloadend: ((e: unknown) => void) | null = null;
  result: unknown;
  async readAsArrayBuffer(blob: Blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.({ target: this });
  }
  async readAsDataURL(blob: Blob) {
    this.result =
      'data:' +
      blob.type +
      ';base64,' +
      Buffer.from(await blob.arrayBuffer()).toString('base64');
    this.onloadend?.({ target: this });
  }
}
Object.assign(globalThis, { FileReader: Reader });
async function main() {
  const car = createCybercab();
  const data = await new GLTFExporter().parseAsync(car.group, { binary: true });
  writeFileSync('work/cybercab-base.glb', Buffer.from(data as ArrayBuffer));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
