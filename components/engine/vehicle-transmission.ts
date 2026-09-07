import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';

// Functional layout based on Toyota's Direct Shift-CVT description. The housing
// is an educational reconstruction; it is not a measured K120 CAD model.
export function createVehicleTransmission(k: ModelKit, root: THREE.Group) {
  const { mesh, box, bar, alloy, steel, black } = k;
  const part = (
    id: string,
    name: string,
    offset: P3,
    stage: number,
    description: string,
  ) =>
    k.part(root, {
      id: `car-${id}`,
      name,
      system: 'powertrain',
      offset,
      stage,
      description,
      material: 'Cast aluminium and machined steel',
    });
  const rotors: THREE.Group[] = [];
  const spinning = (g: THREE.Group, p: P3) => {
    const r = new THREE.Group();
    r.position.set(...p);
    g.add(r);
    rotors.push(r);
    return r;
  };
  const disc = (
    g: THREE.Group,
    r: number,
    depth: number,
    x: number,
    y = 0,
    z = 0,
    mat = alloy,
  ) => {
    const geo = new THREE.CylinderGeometry(r, r, depth, 64);
    geo.rotateZ(Math.PI / 2);
    return mesh(g, geo, mat, [x, y, z]);
  };
  const outline = new THREE.Shape();
  outline.moveTo(-0.17, 0.39);
  outline.bezierCurveTo(-0.17, 0.64, 0.04, 0.64, 0.09, 0.575);
  outline.bezierCurveTo(0.28, 0.64, 0.405, 0.53, 0.365, 0.36);
  outline.quadraticCurveTo(0.32, 0.215, 0.165, 0.243);
  outline.quadraticCurveTo(-0.12, 0.2, -0.17, 0.39);
  outline.closePath();
  function extrude(shape: THREE.Shape, depth: number, x: number) {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.004,
      bevelThickness: 0.003,
      bevelSegments: 2,
      curveSegments: 24,
      steps: 1,
    });
    g.rotateY(-Math.PI / 2);
    g.translate(x, 0, 0);
    return g;
  }
  const caseGroup = part(
    'transaxle',
    'CVT main housing',
    [0.95, 0.36, -0.35],
    5,
    'The compact transverse casing supports the CVT shafts and final drive beside the engine. Remove the end cover to inspect the power paths.',
  );
  const wall = new THREE.Shape(outline.getPoints(48));
  const cavity = new THREE.Path(
    outline
      .getPoints(48)
      .map((p) => new THREE.Vector2(p.x * 0.9, (p.y - 0.43) * 0.9 + 0.43)),
  );
  wall.holes.push(cavity);
  mesh(caseGroup, extrude(wall, 0.28, 0.575), alloy);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    bar(
      caseGroup,
      [0.3, 0.44 + Math.sin(a) * 0.16, 0.1 + Math.cos(a) * 0.24],
      [0.565, 0.44 + Math.sin(a) * 0.16, 0.1 + Math.cos(a) * 0.24],
      0.006,
      alloy,
    );
  }
  const end = part(
    'cvt-cover',
    'CVT end cover',
    [1.55, 0.35, -0.35],
    3,
    'The bolted aluminium end cover closes the variator housing and supports the outer shaft bearings.',
  );
  mesh(end, extrude(outline, 0.014, 0.597), alloy);
  for (const z of [-0.04, 0.205]) {
    disc(end, 0.097, 0.007, 0.607, 0.44, z, steel);
    disc(end, 0.039, 0.012, 0.616, 0.44, z, alloy);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    disc(
      end,
      0.006,
      0.013,
      0.61,
      0.435 + Math.sin(a) * 0.16,
      0.09 + Math.cos(a) * 0.237,
      steel,
    );
  }
  const bell = part(
    'bellhousing',
    'Transmission bellhousing',
    [0.75, 0.7, -0.7],
    4,
    'The bellhousing encloses the torque converter and bolts the transmission to the engine.',
  );
  const bellGeo = new THREE.TorusGeometry(0.145, 0.012, 12, 64);
  bellGeo.rotateY(Math.PI / 2);
  mesh(bell, bellGeo, alloy, [0.29, 0.44, -0.04]);
  const flange = new THREE.CylinderGeometry(0.157, 0.135, 0.09, 64, 1, true);
  flange.rotateZ(Math.PI / 2);
  mesh(bell, flange, alloy, [0.257, 0.44, -0.04]);
  const converter = part(
    'torque-converter',
    'Torque converter',
    [0.62, 0.92, -0.75],
    4,
    'A fluid coupling transfers engine torque into the transmission and a lock-up clutch reduces slip while cruising.',
  );
  const cr = spinning(converter, [0.245, 0.44, -0.04]);
  disc(cr, 0.127, 0.047, 0, 0, 0, steel);
  disc(cr, 0.082, 0.064, 0);
  for (let j = 0; j < 24; j++) {
    const a = (j / 24) * Math.PI * 2;
    box(
      cr,
      [0.014, 0.008, 0.034],
      [0.027, Math.sin(a) * 0.095, Math.cos(a) * 0.095],
      alloy,
      0.003,
    );
  }
  for (const [which, z, r, offset] of [
    ['primary', -0.035, 0.096, [0.95, 1.03, -0.42]],
    ['secondary', 0.205, 0.105, [1.1, 0.9, 0.2]],
  ] as const) {
    const g = part(
      `cvt-${which}`,
      `${which === 'primary' ? 'Primary' : 'Secondary'} CVT pulley`,
      [...offset],
      4,
      'Two conical sheaves change the running radius of the steel belt. The paired pulleys vary the transmission ratio continuously.',
    );
    const spin = spinning(g, [0.472, 0.442, z]);
    for (const side of [-1, 1]) {
      const geo = new THREE.CylinderGeometry(r, 0.027, 0.027, 64);
      geo.rotateZ((side * Math.PI) / 2);
      mesh(spin, geo, alloy, [side * 0.027, 0, 0]);
    }
    disc(spin, 0.029, 0.15, 0, 0, 0, steel);
  }
  const belt = part(
    'cvt-belt',
    'CVT steel push belt',
    [1.35, 0.85, -0.05],
    3,
    'Closely packed steel elements run between the variable pulleys. The belt carries torque after the launch-gear phase.',
  );
  const path = new THREE.CurvePath<THREE.Vector3>();
  const points: P3[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = Math.PI / 2 + (i / 40) * Math.PI;
    points.push([
      0.472,
      0.442 + Math.sin(a) * 0.096,
      -0.035 + Math.cos(a) * 0.096,
    ]);
  }
  for (let i = 0; i <= 40; i++) {
    const a = -Math.PI / 2 + (i / 40) * Math.PI;
    points.push([
      0.472,
      0.442 + Math.sin(a) * 0.105,
      0.205 + Math.cos(a) * 0.105,
    ]);
  }
  points.push(points[0]);
  for (let i = 0; i < points.length - 1; i++)
    path.add(
      new THREE.LineCurve3(
        new THREE.Vector3(...points[i]),
        new THREE.Vector3(...points[i + 1]),
      ),
    );
  for (let i = 0; i < 150; i++) {
    const t = i / 150,
      p = path.getPointAt(t),
      tan = path.getTangentAt(t);
    const m = box(belt, [0.032, 0.004, 0.006], p.toArray() as P3, steel, 0.001);
    m.rotation.x = Math.atan2(tan.y, tan.z);
  }
  const gears = part(
    'launch-gears',
    'Launch gear pair',
    [1.03, 0.55, 0.63],
    4,
    'A dedicated gear path handles starting from rest, reducing the load on the CVT belt at low road speed.',
  );
  function gear(
    g: THREE.Group,
    r: number,
    teeth: number,
    x: number,
    y: number,
    z: number,
  ) {
    const s = new THREE.Shape();
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i / (teeth * 4)) * Math.PI * 2,
        rad = r * (i % 4 === 1 || i % 4 === 2 ? 1 : 0.91);
      const py = Math.cos(a) * rad,
        pz = Math.sin(a) * rad;
      if (i === 0) s.moveTo(py, pz);
      else s.lineTo(py, pz);
    }
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.017,
      bevelEnabled: false,
      steps: 1,
    });
    geo.rotateY(Math.PI / 2);
    geo.translate(-0.0085, 0, 0);
    return mesh(g, geo, steel, [x, y, z]);
  }
  const gr = spinning(gears, [0.36, 0.43, -0.035]);
  gear(gr, 0.048, 22, 0, 0, 0);
  const gr2 = spinning(gears, [0.36, 0.36, 0.055]);
  gear(gr2, 0.068, 30, 0, 0, 0);
  const clutch = part(
    'cvt-clutch',
    'CVT clutch and hydraulic drum',
    [0.87, 0.73, 0.75],
    4,
    'Hydraulic clutch elements transfer torque between the launch-gear path and the belt-drive path.',
  );
  const cl = spinning(clutch, [0.377, 0.44, 0.205]);
  disc(cl, 0.075, 0.055, 0);
  for (const x of [-0.025, -0.015, -0.005, 0.005, 0.015, 0.025])
    disc(cl, 0.078, 0.003, x, 0, 0, steel);
  const differential = part(
    'differential',
    'Differential and final-drive gear',
    [0.55, 0.43, 0.93],
    5,
    'The differential sends torque to both front drive shafts while allowing the wheels to turn at different speeds in a corner.',
  );
  const dr = spinning(differential, [0.325, 0.3, 0.2]);
  gear(dr, 0.087, 42, 0, 0, 0);
  disc(dr, 0.049, 0.095, 0, 0, 0, alloy);
  bar(dr, [-0.074, 0, 0], [0.074, 0, 0], 0.017, steel);
  const valve = part(
    'cvt-valve-body',
    'Transmission hydraulic valve body',
    [0.7, -0.25, 0.5],
    4,
    'Hydraulic passages and solenoids control pulley clamping pressure and the transmission clutches.',
  );
  box(valve, [0.23, 0.031, 0.28], [0.44, 0.255, 0.09], alloy, 0.014);
  for (let j = 0; j < 5; j++) {
    bar(
      valve,
      [0.35, 0.275, -0.02 + j * 0.047],
      [0.51, 0.275, -0.02 + j * 0.047],
      0.006,
      steel,
    );
    disc(valve, 0.014, 0.042, 0.548, 0.268, -0.018 + j * 0.047, black);
  }
  const pan = part(
    'cvt-pan',
    'Transmission fluid pan',
    [0.7, -0.55, 0.2],
    2,
    'The lower pan closes the transmission fluid reservoir and provides access to the hydraulic control unit.',
  );
  box(pan, [0.245, 0.025, 0.29], [0.44, 0.226, 0.09], steel, 0.012);
  return {
    setWheelAngle(angle: number) {
      rotors.forEach((r, i) => (r.rotation.x = angle * (i === 4 ? -1.3 : 1)));
    },
  };
}
