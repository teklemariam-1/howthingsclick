import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';

// The absorber contours follow a photograph of 52611-02500. Bracket dimensions
// are packaging reconstructions; this geometry is not an impact simulation.
export function createFrontImpactStructure(k: ModelKit, root: THREE.Group) {
  const part = (
    id: string,
    name: string,
    offset: P3,
    stage: number,
    material: string,
    description: string,
  ) =>
    k.part(root, {
      id: `car-${id}`,
      name,
      system: 'body',
      offset,
      stage,
      material,
      description,
    });
  const beam = part(
    'front-crash-beam',
    'Front bumper reinforcement',
    [0, 0.08, -0.85],
    3,
    'Structural metal',
    'The curved hollow reinforcement sits behind the foam absorber. Its mounting stays connect it to the front body rails.',
  );
  const absorber = part(
    'front-impact-absorber',
    'Front bumper foam absorber',
    [0, 0.15, -1.08],
    2,
    'Moulded energy-absorbing foam',
    'This shaped foam component fits between the cover and reinforcement. Its pockets and end openings follow the Corolla LE absorber reference.',
  );
  const fasteners = part(
    'front-impact-fasteners',
    'Front reinforcement fasteners',
    [0, 0.12, -1.32],
    2,
    'Steel',
    'Bolts and washers secure the reinforcement to the mounting stays. The set separates so the mounting faces can be inspected.',
  );

  const grainData = new Uint8Array(128 * 128 * 4);
  let seed = 441;
  for (let i = 0; i < grainData.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    grainData[i] = grainData[i + 1] = grainData[i + 2] = 90 + (seed % 160);
    grainData[i + 3] = 255;
  }
  const grain = new THREE.DataTexture(grainData, 128, 128);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(12, 12);
  grain.needsUpdate = true;
  const foam = new THREE.MeshStandardMaterial({
    color: '#1a1d20',
    roughness: 0.99,
    metalness: 0,
    bumpMap: grain,
    bumpScale: 0.00065,
  });
  k.materials.push(foam);
  const rounded = (x: number, y: number, w: number, h: number, r: number) => {
    const s = new THREE.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    s.closePath();
    return s;
  };
  const shape = new THREE.Shape();
  shape.moveTo(-0.7, -0.044);
  shape.lineTo(-0.51, -0.052);
  shape.lineTo(-0.475, -0.061);
  shape.lineTo(0.475, -0.061);
  shape.lineTo(0.51, -0.052);
  shape.lineTo(0.7, -0.044);
  shape.lineTo(0.7, 0.051);
  shape.lineTo(0.61, 0.057);
  shape.lineTo(0.58, 0.049);
  shape.lineTo(0.475, 0.057);
  shape.lineTo(-0.475, 0.057);
  shape.lineTo(-0.58, 0.049);
  shape.lineTo(-0.61, 0.057);
  shape.lineTo(-0.7, 0.051);
  shape.closePath();
  for (const side of [-1, 1])
    shape.holes.push(
      rounded(side * 0.584 - 0.041, -0.037, 0.082, 0.062, 0.013),
    );
  for (const x of [-0.145, 0.145])
    shape.holes.push(rounded(x - 0.045, -0.019, 0.09, 0.044, 0.008));
  const zAt = (x: number) => -0.825 + 0.082 * (Math.abs(x) / 0.7) ** 2;
  const body = new THREE.ExtrudeGeometry(shape, {
    depth: 0.085,
    bevelEnabled: true,
    bevelSize: 0.003,
    bevelThickness: 0.003,
    bevelSegments: 3,
    curveSegments: 28,
    steps: 12,
  });
  const bp = body.getAttribute('position');
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i);
    bp.setXYZ(i, x, 0.497 + bp.getY(i), zAt(x) + bp.getZ(i));
  }
  body.computeVertexNormals();
  k.mesh(absorber, body, foam);
  // Blind rectangular mould pockets, plus small circular impressions.
  for (const x of [-0.145, 0.145])
    k.box(
      absorber,
      [0.087, 0.042, 0.006],
      [x, 0.5, zAt(x) + 0.019],
      foam,
      0.006,
    );
  for (const x of [-0.653, -0.415, -0.247, 0, 0.247, 0.415, 0.653]) {
    const g = new THREE.CylinderGeometry(0.013, 0.013, 0.002, 24);
    g.rotateX(Math.PI / 2);
    k.mesh(absorber, g, k.black, [x, 0.497, zAt(x) - 0.0035]);
  }

  const section = rounded(-0.055, -0.043, 0.11, 0.086, 0.009);
  section.holes.push(rounded(-0.043, -0.034, 0.086, 0.068, 0.005));
  const bg = new THREE.ExtrudeGeometry(section, {
    depth: 1.34,
    steps: 72,
    bevelEnabled: false,
    curveSegments: 12,
  });
  const p = bg.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getZ(i) - 0.67,
      y = p.getX(i),
      z = p.getY(i);
    p.setXYZ(i, x, 0.49 + y, -0.699 + z + 0.08 * (x / 0.67) ** 2);
  }
  bg.computeVertexNormals();
  k.mesh(beam, bg, k.alloy);
  for (const y of [-0.033, 0.033])
    k.tube(
      beam,
      Array.from({ length: 49 }, (_, i) => {
        const x = -0.67 + (1.34 * i) / 48;
        return [x, 0.49 + y, -0.744 + 0.08 * (x / 0.67) ** 2] as P3;
      }),
      0.0024,
      k.alloy,
    );
  for (const side of [-1, 1]) {
    const x = side * 0.548,
      front = -0.602;
    const stay = part(
      `front-${side < 0 ? 'left' : 'right'}-impact-stay`,
      `${side < 0 ? 'Left' : 'Right'} front reinforcement mounting stay`,
      [side * 0.22, 0, -0.57],
      4,
      'Formed structural metal',
      'A hollow mounting stay joins the reinforcement to the front rail. Flanges, bolt seats and formed beads are visible when the cover and absorber are removed.',
    );
    const outer = rounded(-0.049, -0.048, 0.098, 0.096, 0.009);
    outer.holes.push(rounded(-0.042, -0.041, 0.084, 0.082, 0.005));
    const g = new THREE.ExtrudeGeometry(outer, {
      depth: 0.218,
      bevelEnabled: false,
      curveSegments: 12,
    });
    k.mesh(stay, g, k.steel, [x, 0.49, front]);
    for (const z of [front - 0.006, front + 0.212]) {
      const flange = rounded(-0.071, -0.066, 0.142, 0.132, 0.01);
      for (const dx of [-0.054, 0.054])
        for (const dy of [-0.047, 0.047]) {
          const hole = new THREE.Path();
          hole.absarc(dx, dy, 0.007, 0, Math.PI * 2, true);
          flange.holes.push(hole);
        }
      k.mesh(
        stay,
        new THREE.ExtrudeGeometry(flange, {
          depth: 0.006,
          bevelEnabled: false,
        }),
        k.steel,
        [x, 0.49, z],
      );
    }
    for (const z of [front + 0.073, front + 0.117, front + 0.161]) {
      const points: P3[] = [
        [x - 0.05, 0.456, z],
        [x - 0.05, 0.524, z],
        [x + 0.05, 0.524, z],
        [x + 0.05, 0.456, z],
        [x - 0.05, 0.456, z],
      ];
      k.tube(stay, points, 0.0025, k.steel);
    }
    for (const dx of [-0.054, 0.054])
      for (const dy of [-0.047, 0.047]) {
        const bolt = new THREE.CylinderGeometry(0.01, 0.01, 0.011, 6);
        bolt.rotateX(Math.PI / 2);
        k.mesh(fasteners, bolt, k.steel, [x + dx, 0.49 + dy, front - 0.015]);
        k.mesh(
          fasteners,
          new THREE.TorusGeometry(0.009, 0.0015, 6, 24),
          k.alloy,
          [x + dx, 0.49 + dy, front - 0.009],
        );
      }
  }
  return { textures: [grain] };
}
