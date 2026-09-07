import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';

// Exterior contours follow the supplied LE photos; hidden motor geometry is
// illustrative, not a factory service drawing.
export function createExteriorMirror(
  k: ModelKit,
  door: THREE.Group,
  side: number,
) {
  const which = side < 0 ? 'left' : 'right';
  const label = side < 0 ? 'Left' : 'Right';
  const part = (
    suffix: string,
    name: string,
    offset: P3,
    description: string,
    parent: THREE.Group = door,
  ) =>
    k.part(parent, {
      id: `car-${which}-mirror${suffix}`,
      name: `${label} ${name}`,
      system: 'body',
      stage: 0,
      offset,
      description,
      material: 'Moulded polymer, painted cap and reflective glass',
    });
  const housing = part(
    '',
    'exterior mirror',
    [side * 0.65, 0.28, -0.15],
    'The door-mounted housing supports the cap, adjustment mechanism and reflective glass. These can be separated individually.',
  );
  const cap = part(
    '-cap',
    'mirror painted cap',
    [side * 0.12, 0.14, -0.22],
    'The body-coloured outer cover clips over the black mirror housing.',
    housing,
  );
  const motor = part(
    '-adjuster',
    'mirror adjustment unit',
    [side * 0.08, 0, 0.13],
    'An electric adjustment unit tilts the glass backing about two axes. Internal contours are illustrative.',
    housing,
  );
  const glazing = part(
    '-glass',
    'mirror glass and backing',
    [side * 0.1, 0.02, 0.27],
    'Reflective glass sits on a removable backing plate in the rear-facing opening.',
    housing,
  );
  const silver = new THREE.MeshStandardMaterial({
    color: '#d5dade',
    metalness: 1,
    roughness: 0.055,
    envMapIntensity: 0.8,
    side: THREE.DoubleSide,
  });
  k.materials.push(silver);
  const local = (x: number, y: number, z: number): P3 => [
    side * (0.926 + x),
    1.047 + y,
    0.653 + z - x * 0.13,
  ];
  const contour = new THREE.CatmullRomCurve3(
    [
      [-0.083, -0.025],
      [-0.081, 0.023],
      [-0.035, 0.044],
      [0.044, 0.041],
      [0.088, 0.017],
      [0.096, -0.015],
      [0.064, -0.039],
      [-0.043, -0.042],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    true,
    'centripetal',
  );
  const shellPoint = (u: number, v: number, inset = 0): P3 => {
    const p = contour.getPoint(u),
      r = Math.sqrt(1 - (1 - v) ** 2);
    return local(p.x * r, p.y * r, -0.123 * (1 - v) + inset);
  };
  // Closed black backing shell, with a separate upper painted cover.
  k.surface(housing, (u, v) => shellPoint(u, v), k.black, 72, 28);
  k.surface(
    cap,
    (u, v) => shellPoint(0.002 + u * 0.622, 0.035 + v * 0.965, -0.002),
    k.paint,
    56,
    28,
  );
  const stem = k.box(
    housing,
    [0.044, 0.095, 0.06],
    [side * 0.841, 0.998, 0.625],
    k.black,
    0.012,
  );
  stem.rotation.z = -side * 0.23;
  const bezel: P3[] = [];
  for (let i = 0; i <= 80; i++) {
    const p = contour.getPoint(i / 80);
    bezel.push(local(p.x, p.y, 0.004));
  }
  k.tube(housing, bezel, 0.0038, k.black);
  // Rounded glass aperture is a real planar face, not tinted window material.
  const shape = new THREE.Shape();
  for (let i = 0; i <= 80; i++) {
    const p = contour.getPoint(i / 80);
    if (i === 0) shape.moveTo(p.x * 0.91, p.y * 0.84);
    else shape.lineTo(p.x * 0.91, p.y * 0.84);
  }
  const backing = new THREE.ExtrudeGeometry(shape, {
    depth: 0.005,
    bevelEnabled: false,
    curveSegments: 64,
  });
  const glass = new THREE.ShapeGeometry(shape, 64);
  for (const g of [backing, glass]) {
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const v = local(p.getX(i), p.getY(i), 0.008 + p.getZ(i));
      p.setXYZ(i, ...v);
    }
    g.computeVertexNormals();
  }
  k.mesh(glazing, backing, k.black);
  glass.translate(0, 0, 0.006);
  k.mesh(glazing, glass, silver);
  const cylinder = new THREE.CylinderGeometry(0.028, 0.028, 0.018, 32);
  cylinder.rotateX(Math.PI / 2);
  k.mesh(motor, cylinder, k.black, local(0, 0, -0.014));
  for (const x of [-0.031, 0.031])
    k.box(motor, [0.017, 0.034, 0.019], local(x, 0, -0.023), k.black, 0.004);
  k.tube(
    housing,
    [
      local(-0.016, -0.012, -0.033),
      local(-0.056, -0.034, -0.057),
      [side * 0.842, 0.983, 0.625],
    ],
    0.003,
    k.black,
  );
  return housing;
}
