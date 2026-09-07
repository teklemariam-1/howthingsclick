import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';

function padPoint(size: P3, x: number, y: number, z: number): P3 {
  const round = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e;
  return [
    size[0] * 0.5 * round(x, 0.56) * (1 - 0.055 * Math.max(0, -y)),
    size[1] * 0.5 * round(y, 0.64),
    size[2] * 0.5 * round(z, 0.6) - 0.007 * (1 - y * y) * Math.max(0, -z),
  ];
}

// A closed, continuously rounded pad. The separate exponents keep the broad
// cloth faces gently crowned without flat box corners or overlapping skins.
export function upholsteredPad(
  k: ModelKit,
  parent: THREE.Object3D,
  size: P3,
  position: P3,
  material: THREE.Material,
) {
  const geometry = new THREE.SphereGeometry(1, 64, 48);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    p.setXYZ(i, ...padPoint(size, x, y, z));
  }
  geometry.computeVertexNormals();
  // Sphere UV seams duplicate positions. Average their normals after the
  // deformation so they cannot become a dark vertical stripe in reflections.
  const n = geometry.getAttribute('normal');
  const shared = new Map<
    string,
    { normal: THREE.Vector3; indices: number[] }
  >();
  for (let i = 0; i < p.count; i++) {
    const key = [p.getX(i), p.getY(i), p.getZ(i)]
      .map((v) => Math.round(v * 1e6))
      .join(',');
    let entry = shared.get(key);
    if (!entry) {
      entry = { normal: new THREE.Vector3(), indices: [] };
      shared.set(key, entry);
    }
    entry.normal.add(new THREE.Vector3().fromBufferAttribute(n, i));
    entry.indices.push(i);
  }
  for (const entry of shared.values()) {
    entry.normal.normalize();
    for (const i of entry.indices)
      n.setXYZ(i, entry.normal.x, entry.normal.y, entry.normal.z);
  }
  return k.mesh(parent, geometry, material, position);
}

export function upholsteredPadSeam(
  k: ModelKit,
  pad: THREE.Mesh,
  size: P3,
  material: THREE.Material,
) {
  const z = -0.68,
    r = Math.sqrt(1 - z * z);
  pad.updateMatrix();
  const points = Array.from({ length: 129 }, (_, i) => {
    const a = (i / 128) * Math.PI * 2;
    const p = new THREE.Vector3(
      ...padPoint(size, r * Math.cos(a), r * Math.sin(a), z),
    );
    p.z -= 0.00065;
    return p.applyMatrix4(pad.matrix).toArray() as P3;
  });
  return k.tube(pad.parent!, points, 0.00055, material);
}
