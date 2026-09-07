import * as THREE from 'three';

// Large studio cards produce long, continuous reflections over car paint.
// The capture is generated locally and adds no textures or network requests.
export function createVehicleStudioEnvironment(pmrem: THREE.PMREMGenerator) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#333740');
  const resources: {
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
  }[] = [];
  function card(
    width: number,
    height: number,
    position: [number, number, number],
    rotation: [number, number, number],
    intensity: number,
  ) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setScalar(intensity),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(...position);
    panel.rotation.set(...rotation);
    studio.add(panel);
    resources.push({ geometry, material });
  }
  card(11, 18, [0, 6, 0], [-Math.PI / 2, 0, 0], 2.8);
  card(17, 2.4, [-6, 2.8, 0], [0, Math.PI / 2, 0], 3.3);
  card(17, 1.6, [6, 3.4, 0], [0, -Math.PI / 2, 0], 2.5);
  card(9, 2.7, [0, 2.3, -9], [0, 0, 0], 1.25);
  card(8, 1.6, [0, 3.8, 9], [0, Math.PI, 0], 1.8);
  card(18, 20, [0, -4, 0], [-Math.PI / 2, 0, 0], 0.055);
  const target = pmrem.fromScene(studio, 0.08);
  for (const { geometry, material } of resources) {
    geometry.dispose();
    material.dispose();
  }
  return target;
}
