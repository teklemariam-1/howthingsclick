import * as THREE from 'three';

type Point = [number, number, number];

// A deliberately quiet context drawing: the engine remains the detailed object.
export function createVehicleContext() {
  const group = new THREE.Group();
  group.name = 'vehicle-context';
  const outline = new THREE.LineBasicMaterial({
    color: '#a0c6d3',
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
  });
  const detail = new THREE.LineBasicMaterial({
    color: '#8baabb',
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  const wheelMaterial = new THREE.LineBasicMaterial({
    color: '#c1dce4',
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
  });
  const bodySegments: number[] = [],
    detailSegments: number[] = [];
  function path(points: Point[], secondary = false, smooth = true) {
    const vertices = smooth
      ? new THREE.CatmullRomCurve3(
          points.map((p) => new THREE.Vector3(...p)),
          false,
          'centripetal',
        ).getPoints(64)
      : points.map((p) => new THREE.Vector3(...p));
    const target = secondary ? detailSegments : bodySegments;
    for (let i = 1; i < vertices.length; i++)
      target.push(...vertices[i - 1].toArray(), ...vertices[i].toArray());
  }
  for (const side of [-1, 1]) {
    const x = 4.05 * side;
    // Hood, belt line, cabin and trunk form a readable sedan silhouette.
    path([
      [x, 1.15, -5.2],
      [x, 3.0, -5],
      [x, 4.05, -3.7],
      [x, 4.28, 2.9],
      [x, 4.05, 11.6],
      [x, 3.35, 15.4],
      [x, 1.15, 16],
    ]);
    path([
      [x, 4.28, 2.9],
      [side * 3.18, 6.22, 5.6],
      [side * 3.12, 6.45, 9.05],
      [x, 4.05, 12.4],
    ]);
    path(
      [
        [x, 1.15, -5.2],
        [x, 0.35, -3.1],
      ],
      false,
      false,
    );
    path(
      [
        [x, 0.35, 1.55],
        [x, 0.35, 9.65],
      ],
      false,
      false,
    );
    path(
      [
        [x, 0.35, 14.35],
        [x, 1.15, 16],
      ],
      false,
      false,
    );
    for (const z of [-0.8, 12]) {
      const arch: Point[] = [];
      for (let i = 0; i <= 32; i++) {
        const a = (Math.PI * i) / 32;
        arch.push([x, 0.35 + Math.sin(a) * 2.28, z - Math.cos(a) * 2.28]);
      }
      path(arch, false, false);
    }
    // Glazing, pillars and door seams stay a level fainter than the silhouette.
    path(
      [
        [side * 3.85, 4.5, 3.7],
        [side * 3.12, 6.02, 5.85],
        [side * 3.06, 6.13, 8.85],
        [side * 3.85, 4.4, 11.6],
        [side * 3.85, 4.5, 3.7],
      ],
      true,
      false,
    );
    path(
      [
        [side * 3.14, 6.15, 7.9],
        [side * 3.88, 4.42, 7.9],
        [x, 0.75, 7.9],
      ],
      true,
      false,
    );
    path(
      [
        [x, 4.2, 3.15],
        [x, 1.0, 3.15],
        [x, 0.75, 7.9],
        [x, 1.0, 9.55],
        [x, 4.1, 11.85],
      ],
      true,
      false,
    );
    path(
      [
        [x, 3.68, 6.6],
        [x, 3.68, 7.35],
      ],
      true,
      false,
    );
    path(
      [
        [x, 3.6, 9.9],
        [x, 3.6, 10.6],
      ],
      true,
      false,
    );
    path(
      [
        [x, 4.05, 3.4],
        [side * 4.75, 4.22, 3.1],
        [side * 4.9, 4.13, 3.65],
        [x, 4.05, 3.85],
      ],
      true,
    );
    path(
      [
        [side * 1.8, 3.03, -5.04],
        [side * 3.62, 3.06, -4.92],
        [side * 3.75, 2.61, -5.04],
        [side * 1.8, 2.64, -5.15],
        [side * 1.8, 3.03, -5.04],
      ],
      true,
      false,
    );
  }
  for (const [z, y, w] of [
    [-5.2, 1.15, 4.05],
    [-5, 3, 4.05],
    [-3.7, 4.05, 4.05],
    [2.9, 4.28, 4.05],
    [5.6, 6.22, 3.18],
    [9.05, 6.45, 3.12],
    [12.4, 4.05, 4.05],
    [15.4, 3.35, 4.05],
    [16, 1.15, 4.05],
  ])
    path(
      [
        [-w, y, z],
        [0, y + 0.14, z - 0.06],
        [w, y, z],
      ],
      z === -3.7 || z === 12.4,
    );
  path(
    [
      [-1.7, 2.5, -5.15],
      [1.7, 2.5, -5.15],
      [1.6, 1.65, -5.2],
      [-1.6, 1.65, -5.2],
      [-1.7, 2.5, -5.15],
    ],
    true,
    false,
  );
  function lines(
    segments: number[],
    material: THREE.LineBasicMaterial,
    parent: THREE.Group,
  ) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(segments, 3),
    );
    parent.add(new THREE.LineSegments(geometry, material));
  }
  lines(bodySegments, outline, group);
  lines(detailSegments, detail, group);
  const wheels: THREE.Group[] = [];
  for (const side of [-1, 1])
    for (const z of [-0.8, 12]) {
      const wheel = new THREE.Group();
      wheel.position.set(side * 4.05, 0.35, z);
      group.add(wheel);
      const segments: number[] = [];
      const segment = (a: Point, b: Point) => segments.push(...a, ...b);
      const circle = (x: number, r: number) => {
        for (let i = 0; i < 72; i++) {
          const a = (i * Math.PI) / 36,
            b = ((i + 1) * Math.PI) / 36;
          segment(
            [x, Math.cos(a) * r, Math.sin(a) * r],
            [x, Math.cos(b) * r, Math.sin(b) * r],
          );
        }
      };
      for (const x of [-0.49, 0.49]) circle(x, 1.73);
      circle(side * 0.51, 1.21);
      circle(side * 0.52, 0.26);
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        for (const offset of [-0.075, 0.075])
          segment(
            [
              side * 0.52,
              Math.cos(a + offset) * 0.3,
              Math.sin(a + offset) * 0.3,
            ],
            [
              side * 0.52,
              Math.cos(a + offset + 0.22) * 1.18,
              Math.sin(a + offset + 0.22) * 1.18,
            ],
          );
      }
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12;
        segment(
          [-0.47, Math.cos(a) * 1.73, Math.sin(a) * 1.73],
          [0.47, Math.cos(a + 0.075) * 1.73, Math.sin(a + 0.075) * 1.73],
        );
      }
      lines(segments, wheelMaterial, wheel);
      wheels.push(wheel);
    }
  return {
    group,
    setOpacity(amount: number) {
      outline.opacity = 0.26 * amount;
      detail.opacity = 0.14 * amount;
      wheelMaterial.opacity = 0.44 * amount;
      group.visible = amount > 0.005;
    },
    setWheelAngle(angle: number) {
      wheels.forEach((w) => (w.rotation.x = angle));
    },
  };
}
