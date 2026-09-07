import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { vehiclePart, type VehicleAssembly } from './vehicle-assemblies';
import type { VehiclePart } from '../../lib/engine/vehicle-parts';
export type P3 = [number, number, number];
export function modelKit() {
  const parts: VehicleAssembly[] = [];
  const part = (
    parent: THREE.Object3D,
    info: VehiclePart,
    existing?: THREE.Group,
  ) => vehiclePart(parent, info, parts, existing);
  const paint = new THREE.MeshPhysicalMaterial({
    color: '#bac8d2',
    metalness: 0.72,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.17,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: '#505b63',
    metalness: 0.8,
    roughness: 0.48,
  });
  const alloy = new THREE.MeshStandardMaterial({
    color: '#a4afb5',
    metalness: 0.9,
    roughness: 0.32,
  });
  const black = new THREE.MeshStandardMaterial({
    color: '#11191d',
    metalness: 0.15,
    roughness: 0.7,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: '#15191c',
    metalness: 0,
    roughness: 0.94,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#263e50',
    metalness: 0.15,
    roughness: 0.12,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    clearcoat: 1,
    side: THREE.DoubleSide,
  });
  const led = new THREE.MeshStandardMaterial({
    color: '#e5f7ff',
    emissive: '#c2eaff',
    emissiveIntensity: 2,
    roughness: 0.2,
  });
  const red = new THREE.MeshStandardMaterial({
    color: '#aa0b20',
    emissive: '#cf1827',
    emissiveIntensity: 1.15,
    roughness: 0.22,
  });
  const materials = [paint, steel, alloy, black, rubber, glass, led, red];
  function mesh(
    parent: THREE.Object3D,
    g: THREE.BufferGeometry,
    m: THREE.Material,
    p: P3 = [0, 0, 0],
  ) {
    const o = new THREE.Mesh(g, m);
    o.position.set(...p);
    o.castShadow = m !== glass;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(
    parent: THREE.Object3D,
    size: P3,
    p: P3,
    m: THREE.Material = steel,
    r = 0.008,
  ) {
    return mesh(
      parent,
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(r, ...size.map((n) => n / 3)),
      ),
      m,
      p,
    );
  }
  function tube(
    parent: THREE.Object3D,
    points: P3[],
    radius: number,
    m: THREE.Material = steel,
  ) {
    return mesh(
      parent,
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        Math.max(12, points.length * 10),
        radius,
        8,
        false,
      ),
      m,
    );
  }
  function bar(
    parent: THREE.Object3D,
    a: P3,
    b: P3,
    r: number,
    m: THREE.Material = steel,
  ) {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      delta = end.clone().sub(start);
    const o = mesh(
      parent,
      new THREE.CylinderGeometry(r, r, delta.length(), 16),
      m,
      start.add(end).multiplyScalar(0.5).toArray() as P3,
    );
    o.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    return o;
  }
  function surface(
    parent: THREE.Object3D,
    sample: (u: number, v: number) => P3,
    m: THREE.Material,
    uSteps = 32,
    vSteps = 18,
  ) {
    const p: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= uSteps; i++)
      for (let j = 0; j <= vSteps; j++) {
        p.push(...sample(i / uSteps, j / vSteps));
        uv.push(i / uSteps, j / vSteps);
        if (i < uSteps && j < vSteps) {
          const a = i * (vSteps + 1) + j,
            b = a + vSteps + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return mesh(parent, g, m);
  }
  return {
    parts,
    part,
    paint,
    steel,
    alloy,
    black,
    rubber,
    glass,
    led,
    red,
    materials,
    mesh,
    box,
    tube,
    bar,
    surface,
  };
}
export type ModelKit = ReturnType<typeof modelKit>;
export function batchVehicleModel(root: THREE.Group) {
  const groups: THREE.Group[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Group) groups.push(o);
  });
  for (const group of groups) {
    const buckets = new Map<THREE.Material, THREE.Mesh[]>();
    for (const o of group.children)
      if (o instanceof THREE.Mesh && !Array.isArray(o.material)) {
        const list = buckets.get(o.material) ?? [];
        list.push(o);
        buckets.set(o.material, list);
      }
    for (const [material, list] of buckets)
      if (list.length > 1) {
        const old = new Set<THREE.BufferGeometry>();
        const geometries = list.map((o) => {
          o.updateMatrix();
          old.add(o.geometry);
          const g = o.geometry.clone().applyMatrix4(o.matrix);
          if (!g.index) return g;
          const expanded = g.toNonIndexed();
          g.dispose();
          return expanded;
        });
        const g = mergeGeometries(geometries);
        geometries.forEach((g) => g.dispose());
        if (!g) continue;
        const m = new THREE.Mesh(g, material);
        m.castShadow = list[0].castShadow;
        m.receiveShadow = true;
        group.add(m);
        list.forEach((o) => group.remove(o));
        old.forEach((g) => g.dispose());
      }
  }
}
