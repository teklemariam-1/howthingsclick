import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import type { CabinMaterials } from './cabin-materials';
import { bodyPatch, outlineTube } from './body-surface';
import { mouldedPanel } from './cabin-geometry';
import { splitPanelRegion } from './panel-clipping';

// OM02688U pp. 114–115: each backrest releases independently; the right
// backrest carries the centre position. Surface dimensions are reconstructed.
export function createRearSeatBacks(
  k: ModelKit,
  root: THREE.Group,
  m: CabinMaterials,
) {
  const part = (
    parent: THREE.Object3D,
    id: string,
    name: string,
    offset: P3,
    stage: number,
    description: string,
  ) =>
    k.part(parent, {
      id: `car-${id}`,
      name,
      offset,
      stage,
      description,
      system: 'cabin',
      material: 'Cloth, moulded foam, polymer and steel',
    });
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
  const front = (x: number, y: number): P3 => {
    const v = (y - 0.486) / 0.463;
    const outer = Math.exp(-(((Math.abs(x) - 0.586) / 0.06) ** 2));
    const lumbar = Math.exp(-(((v - 0.29) / 0.24) ** 2));
    const roll =
      0.014 *
      (Math.exp(-((v / 0.085) ** 2)) + Math.exp(-(((v - 1) / 0.085) ** 2)));
    return [
      x,
      y,
      2.404 +
        0.092 * v -
        0.024 * lumbar -
        0.027 * outer * Math.sin(Math.PI * (0.13 + 0.76 * v)) +
        roll,
    ];
  };
  const left = part(
    root,
    'rear-seatback-left',
    'Left rear seat back (40%)',
    [-0.35, 1.05, 1.45],
    3,
    'The narrower left rear backrest has its own release and hinge mounts. Its head restraint travels with it when the backrest is removed.',
  );
  const right = part(
    root,
    'rear-seatback',
    'Right rear seat back (60%)',
    [0.25, 1.05, 1.5],
    3,
    'The wider right backrest carries the right and centre seating positions. It releases separately from the left section and contains the stowed centre armrest.',
  );
  const armOpening = rounded(-0.108, 0.606, 0.216, 0.286, 0.018);
  for (const [owner, x0, x1, insertX] of [
    [left, -0.635, -0.132, -0.568],
    [right, -0.124, 0.635, 0.247],
  ] as const) {
    const outline = rounded(x0, 0.486, x1 - x0, 0.463, 0.025);
    if (owner === right) outline.holes.push(armOpening);
    const skin = mouldedPanel(
      k,
      owner,
      outline,
      m.bolster,
      front,
      [0, 0, 0.095],
      3,
    );
    // Colour panels partition the same curved skin instead of covering it
    // with rectangular pads. Openings and surrounding volume are preserved.
    const insert = rounded(insertX, 0.523, 0.321, 0.378, 0.034);
    const split = splitPanelRegion(skin.geometry, insert.getPoints(16));
    owner.remove(skin);
    skin.geometry.dispose();
    k.mesh(owner, split.outside, m.bolster);
    k.mesh(owner, split.inside, m.cloth);
    outlineTube(
      k,
      owner,
      insert.getSpacedPoints(180).map((p) => {
        const q = front(p.x, p.y);
        q[2] -= 0.001;
        return q;
      }),
      0.0006,
      m.stitch,
    );
    const carpetOutline = rounded(
      x0 + 0.012,
      0.498,
      x1 - x0 - 0.024,
      0.439,
      0.02,
    );
    if (owner === right) carpetOutline.holes.push(armOpening);
    bodyPatch(
      k,
      owner,
      carpetOutline,
      m.carpet,
      (x, y) => {
        const p = front(x, y);
        p[2] += 0.096;
        return p;
      },
      3,
    );
    // Recessed release button with its guide bezel at the upper outer corner.
    const rx = owner === left ? -0.55 : 0.55;
    const release = part(
      owner,
      `rear-${owner === left ? 'left' : 'right'}-seat-release`,
      `${owner === left ? 'Left' : 'Right'} rear seat release button`,
      [0, 0.14, 0],
      1,
      'The push-button release and guide sit at the outer top of this backrest. They release its seatback lock before folding.',
    );
    const base = front(rx, 0.94);
    k.box(
      release,
      [0.031, 0.01, 0.04],
      [rx, 0.945, base[2] + 0.05],
      m.dark,
      0.005,
    );
    k.box(
      release,
      [0.017, 0.021, 0.023],
      [rx, 0.955, base[2] + 0.05],
      m.soft,
      0.004,
    );
    for (const hx of [x0 + 0.035, x1 - 0.035]) {
      k.box(owner, [0.047, 0.042, 0.03], [hx, 0.493, 2.51], k.steel, 0.006);
      const pin = k.mesh(
        owner,
        new THREE.CylinderGeometry(0.009, 0.009, 0.059, 24),
        k.alloy,
        [hx, 0.493, 2.507],
      );
      pin.rotation.z = Math.PI / 2;
    }
  }

  const armrest = part(
    right,
    'rear-centre-armrest',
    'Rear centre armrest',
    [0, 0.08, -0.35],
    2,
    'The padded centre armrest fits into the wider rear backrest. Its back carries a separate two-cup insert; it is shown stowed in the assembled car.',
  );
  const armOutline = rounded(-0.104, 0.61, 0.208, 0.278, 0.019);
  const armFront = (x: number, y: number): P3 => {
    const p = front(x, y);
    p[2] -=
      0.003 +
      0.01 * Math.sin(((y - 0.61) / 0.278) * Math.PI) * (1 - (x / 0.108) ** 4);
    return p;
  };
  // Cloth front and perimeter walls leave space for genuine cup recesses on
  // the reverse, rather than a solid box filling their interiors.
  bodyPatch(k, armrest, armOutline, m.bolster, armFront, 3);
  const points = armOutline.getSpacedPoints(180);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1];
    k.surface(
      armrest,
      (u, v) => {
        const p = armFront(
          THREE.MathUtils.lerp(a.x, b.x, u),
          THREE.MathUtils.lerp(a.y, b.y, u),
        );
        p[2] += 0.077 * v;
        return p;
      },
      m.bolster,
      2,
      6,
    );
  }
  outlineTube(
    k,
    armrest,
    points.map((p) => {
      const q = armFront(p.x, p.y);
      q[2] -= 0.0008;
      return q;
    }),
    0.00065,
    m.stitch,
  );
  const pull = k.box(
    armrest,
    [0.036, 0.02, 0.005],
    [0, 0.859, front(0, 0.859)[2] - 0.012],
    m.dark,
    0.004,
  );
  pull.rotation.x = 0.18;
  const cups = part(
    armrest,
    'rear-armrest-cup-insert',
    'Rear armrest cup-holder insert',
    [0, 0.02, 0.18],
    1,
    'Two circular recesses share a moulded insert on the inner face of the rear armrest. Removing it exposes the depth of the cup wells and the surrounding padded shell.',
  );
  const tray = rounded(-0.099, 0.615, 0.198, 0.268, 0.016);
  for (const x of [-0.049, 0.049]) {
    const hole = new THREE.Path();
    hole.absarc(x, 0.813, 0.038, 0, Math.PI * 2, true);
    tray.holes.push(hole);
  }
  const armRear = (x: number, y: number): P3 => {
    const p = armFront(x, y);
    p[2] += 0.077;
    return p;
  };
  mouldedPanel(k, cups, tray, m.dark, armRear, [0, 0, -0.006], 2);
  for (const x of [-0.049, 0.049]) {
    k.surface(
      cups,
      (u, v) => {
        const a = u * Math.PI * 2,
          r = THREE.MathUtils.lerp(0.038, 0.032, v);
        const p = armRear(x + Math.cos(a) * r, 0.813 + Math.sin(a) * r);
        p[2] -= v * 0.035;
        return p;
      },
      m.dark,
      64,
      12,
    );
    k.surface(
      cups,
      (u, v) => {
        const a = u * Math.PI * 2;
        const p = armRear(
          x + Math.cos(a) * 0.032 * v,
          0.813 + Math.sin(a) * 0.032 * v,
        );
        p[2] -= 0.035;
        return p;
      },
      m.dark,
      64,
      8,
    );
    outlineTube(
      k,
      cups,
      Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        const p = armRear(x + Math.cos(a) * 0.038, 0.813 + Math.sin(a) * 0.038);
        p[2] += 0.001;
        return p;
      }),
      0.0015,
      m.soft,
    );
  }
  return { left, right };
}
