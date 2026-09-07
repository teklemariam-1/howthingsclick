import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';

export function headlampProjector(
  k: ModelKit,
  parent: THREE.Group,
  center: P3,
  side: number,
) {
  const { mesh, black } = k;
  const alloy = new THREE.MeshStandardMaterial({
    color: '#303b41',
    metalness: 0.65,
    roughness: 0.28,
  });
  k.materials.push(alloy);
  const optics = new THREE.Group();
  optics.position.set(...center);
  optics.rotation.y = -side * 0.16;
  parent.add(optics);
  const origin: P3 = [0, 0, 0];
  const optical = new THREE.MeshPhysicalMaterial({
    color: '#39474b',
    metalness: 0,
    roughness: 0.065,
    transparent: true,
    opacity: 0.72,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    ior: 1.5,
    envMapIntensity: 0.45,
  });
  k.materials.push(optical);
  const bowl = new THREE.CylinderGeometry(0.032, 0.022, 0.037, 48, 1, true);
  bowl.rotateX(Math.PI / 2);
  mesh(optics, bowl, alloy, [0, 0, 0.015]);
  const back = new THREE.CircleGeometry(0.022, 40);
  back.rotateY(Math.PI);
  mesh(optics, back, black, [0, 0, 0.035]);
  const bezel = new THREE.TorusGeometry(0.0305, 0.0021, 10, 64);
  mesh(optics, bezel, alloy, origin);
  const lens = mesh(
    optics,
    new THREE.SphereGeometry(1, 40, 24),
    optical,
    [0, 0, -0.002],
  );
  lens.scale.set(0.0275, 0.0275, 0.009);
  for (let j = 0; j < 12; j++) {
    const a = (j / 12) * Math.PI * 2;
    const rib = mesh(
      optics,
      new THREE.BoxGeometry(0.0012, 0.006, 0.027),
      alloy,
      [Math.cos(a) * 0.026, Math.sin(a) * 0.026, 0.015],
    );
    rib.rotation.z = a - Math.PI / 2;
  }
}
