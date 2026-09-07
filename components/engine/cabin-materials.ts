import * as THREE from 'three';
import type { ModelKit } from './vehicle-model';

// Small repeating weave. Created once per car; no image requests or API calls.
export function createCabinMaterials(k: ModelKit) {
  const size = 128,
    pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const yarn = ((x >> 1) + (y >> 1)) % 2;
      const grain = ((x * 127 + y * 311 + x * y * 17) % 31) / 31;
      const v = 215 + yarn * 21 + grain * 18;
      const i = (y * size + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
      pixels[i + 3] = 255;
    }
  const weave = new THREE.DataTexture(pixels, size, size);
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(9, 14);
  weave.magFilter = THREE.LinearFilter;
  weave.minFilter = THREE.LinearMipmapLinearFilter;
  weave.generateMipmaps = true;
  weave.anisotropy = 4;
  weave.needsUpdate = true;
  const fabric = (color: string) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.92,
      map: weave,
      bumpMap: weave,
      bumpScale: 0.00032,
      side: THREE.DoubleSide,
    });
  const m = {
    cloth: fabric('#383b3d'),
    bolster: fabric('#929185'),
    headliner: fabric('#a4a296'),
    stitch: new THREE.MeshStandardMaterial({ color: '#484c4d', roughness: 1 }),
    pale: new THREE.MeshStandardMaterial({
      color: '#a4a396',
      roughness: 0.78,
      side: THREE.DoubleSide,
    }),
    dark: new THREE.MeshStandardMaterial({
      color: '#24282b',
      roughness: 0.7,
      side: THREE.DoubleSide,
    }),
    soft: new THREE.MeshStandardMaterial({
      color: '#393d3e',
      roughness: 0.86,
      side: THREE.DoubleSide,
    }),
    gloss: new THREE.MeshPhysicalMaterial({
      color: '#121619',
      roughness: 0.24,
      clearcoat: 0.65,
      side: THREE.DoubleSide,
    }),
    silver: new THREE.MeshStandardMaterial({
      color: '#949c98',
      metalness: 0.75,
      roughness: 0.36,
      side: THREE.DoubleSide,
    }),
    screen: new THREE.MeshPhysicalMaterial({
      color: '#08131b',
      roughness: 0.22,
      clearcoat: 0.8,
      side: THREE.DoubleSide,
    }),
    red: new THREE.MeshStandardMaterial({ color: '#b4251e', roughness: 0.66 }),
    carpet: fabric('#292d2b'),
  };
  k.materials.push(...Object.values(m));
  return { ...m, textures: [weave] as THREE.Texture[] };
}
export type CabinMaterials = ReturnType<typeof createCabinMaterials>;
