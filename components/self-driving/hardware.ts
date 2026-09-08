import * as T from 'three';
import { createSoftwareDisplay } from './software-display';
import { createSteeringRig } from './steering-rig';
import { createMotorController } from './motor-controller';
import type { ControlDetail } from '@/lib/self-driving/motor-driver';
import type { SteeringSample } from '@/lib/self-driving/steering';
import { box, cylinder, line, material, tube } from './geometry';
import {
  engineeringTelemetry,
  type Assembly,
  type SystemId,
} from '@/lib/self-driving/engineering';
import type { Frame, Settings } from '@/lib/self-driving/simulation';
type V3 = [number, number, number];
export function createAutonomyHardware() {
  const group = new T.Group();
  group.name = 'Educational autonomy hardware cutaway';
  const electronics = createMotorController(group);
  const software = createSoftwareDisplay();
  group.add(software.group);
  const picks: T.Object3D[] = [];
  const modules: Record<string, T.Group> = {};
  const metal = material('#a9b8bf', 0.8, 0.3),
    dark = material('#19262d', 0.45, 0.45),
    pcb = material('#153e37', 0.3, 0.52),
    copper = material('#bd9860', 0.8, 0.27);
  const accent: Record<string, string> = {
    sensors: '#71dceb',
    compute: '#a99aff',
    perception: '#71dceb',
    planning: '#e9b563',
    control: '#f08c81',
    power: '#f3ac55',
  };
  const mats: Record<string, T.MeshStandardMaterial> = {};
  for (const id of ['sensors', 'compute', 'control', 'power'])
    mats[id] = new T.MeshStandardMaterial({
      color: accent[id],
      metalness: 0.5,
      roughness: 0.35,
      emissive: accent[id],
      emissiveIntensity: 0.18,
    });
  function module(id: string, pos: V3) {
    const m = new T.Group();
    m.position.set(...pos);
    m.userData.system = id;
    group.add(m);
    modules[id] = m;
    return m;
  }
  function screws(parent: T.Object3D, xs: number[], zs: number[], y: number) {
    for (const x of xs)
      for (const z of zs) {
        const b = cylinder(parent, 0.012, 0.012, 0.012, [x, y, z], metal, 12);
        line(
          b,
          [
            [-0.008, 0.007, 0],
            [0.008, 0.007, 0],
          ],
          '#22353b',
        );
      }
  }
  function label(parent: T.Object3D, text: string, pos: V3, color: string) {
    if (typeof document === 'undefined') return;
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 96;
    const x = c.getContext('2d')!;
    x.fillStyle = '#101e28e8';
    x.fillRect(0, 0, 640, 96);
    x.fillStyle = color;
    x.fillRect(0, 0, 5, 96);
    x.font = '500 30px Arial';
    x.fillStyle = '#e5f0ed';
    x.fillText(text, 23, 59);
    const map = new T.CanvasTexture(c);
    map.colorSpace = T.SRGBColorSpace;
    const sprite = new T.Sprite(
      new T.SpriteMaterial({ map, depthTest: false, depthWrite: false }),
    );
    sprite.position.set(...pos);
    sprite.scale.set(1.18, 0.177, 1);
    sprite.renderOrder = 20;
    parent.add(sprite);
    return sprite;
  }
  const labels: { id: string; sprite: T.Sprite }[] = [];
  function tag(parent: T.Object3D, id: string, text: string, pos: V3) {
    const s = label(parent, text, pos, accent[id]);
    if (s) labels.push({ id, sprite: s });
  }
  const sensors = module('sensors', [0, 0, 0]);
  const lensMat = new T.MeshPhysicalMaterial({
    color: '#12364c',
    metalness: 0.7,
    roughness: 0.06,
    clearcoat: 1,
  });
  const cameras: V3[] = [
    [2.23, 0.69, 0],
    [0.49, 1.22, 0],
    [1.18, 0.83, 0.879],
    [1.18, 0.83, -0.879],
    [-0.91, 1.025, 0.84],
    [-0.91, 1.025, -0.84],
    [-2.24, 0.84, 0],
  ];
  cameras.forEach((p, i) => {
    const housing = new T.Group();
    housing.position.set(...p);
    sensors.add(housing);
    if (i === 0 || i === 1) housing.rotation.z = -Math.PI / 2;
    else if (i === 6) housing.rotation.z = Math.PI / 2;
    else housing.rotation.x = (Math.sign(p[2]) * Math.PI) / 2;
    cylinder(housing, 0.055, 0.07, 0.04, [0, 0, 0], dark, 32);
    cylinder(housing, 0.038, 0.041, 0.045, [0, 0.013, 0], mats.sensors, 32);
    cylinder(housing, 0.027, 0.03, 0.049, [0, 0.02, 0], lensMat, 32);
    const ring = new T.Mesh(
      new T.TorusGeometry(0.051, 0.003, 8, 40),
      mats.sensors,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.026;
    housing.add(ring);
  });
  tag(sensors, 'sensors', 'CAMERAS · illustrated positions', [2.1, 1.04, 0.18]);
  const field = new T.Group();
  sensors.add(field);
  for (const p of [cameras[0], cameras[2], cameras[3]]) {
    const side = Math.sign(p[2]),
      dir = side ? 0 : 1;
    for (const offset of [-1, 1])
      line(
        field,
        [
          p,
          [
            p[0] + (dir ? 1.4 : offset * 0.8),
            0.12,
            p[2] + (dir ? offset * 1.1 : side * 1.1),
          ],
        ],
        accent.sensors,
        0.32,
      );
  }

  const compute = module('compute', [0.87, 0.87, 0.02]);
  box(compute, [0.61, 0.044, 0.5], [0, 0, 0], metal, 0.025);
  box(compute, [0.56, 0.016, 0.445], [0, 0.03, 0], pcb, 0.012);
  // A generic board illustrates compute, memory, signal connectors and thermal packaging.
  for (const x of [-0.14, 0.14]) {
    box(compute, [0.115, 0.03, 0.125], [x, 0.055, 0], dark, 0.008);
    box(compute, [0.094, 0.009, 0.104], [x, 0.075, 0], mats.compute, 0.004);
    for (const z of [-0.144, 0.144])
      for (let i = 0; i < 3; i++)
        box(
          compute,
          [0.054, 0.022, 0.029],
          [x + (i - 1) * 0.065, 0.049, z],
          dark,
          0.003,
        );
    for (let i = 0; i < 14; i++) {
      const z = -0.064 + i * 0.01;
      box(compute, [0.011, 0.006, 0.004], [x - 0.063, 0.047, z], copper, 0.001);
      box(compute, [0.011, 0.006, 0.004], [x + 0.063, 0.047, z], copper, 0.001);
    }
    for (let i = 0; i < 9; i++)
      line(
        compute,
        [
          [x - 0.043 + i * 0.01, 0.04, 0.07],
          [x - 0.043 + i * 0.01, 0.04, 0.095],
          [x + 0.035 + i * 0.012, 0.04, 0.126],
        ],
        '#648768',
        0.85,
      );
  }
  for (let i = 0; i < 6; i++) {
    box(
      compute,
      [0.055, 0.043, 0.046],
      [-0.212 + i * 0.084, 0.038, 0.238],
      dark,
      0.006,
    );
    box(
      compute,
      [0.03, 0.019, 0.013],
      [-0.212 + i * 0.084, 0.04, 0.263],
      mats.sensors,
      0.003,
    );
  }
  screws(compute, [-0.28, 0.28], [-0.22, 0.22], 0.035);
  const lid = new T.Group();
  compute.add(lid);
  box(lid, [0.61, 0.039, 0.5], [0, 0.105, 0], metal, 0.018);
  for (let i = 0; i < 18; i++)
    box(
      lid,
      [0.013, 0.055, 0.414],
      [-0.255 + i * 0.03, 0.143, 0],
      metal,
      0.002,
    );
  screws(lid, [-0.28, 0.28], [-0.22, 0.22], 0.13);
  tag(compute, 'compute', 'ONBOARD COMPUTER', [0, 0.45, 0]);

  const power = module('power', [-0.22, 0.27, 0]);
  box(power, [2.48, 0.155, 1.41], [0, 0, 0], dark, 0.035);
  box(power, [2.4, 0.016, 1.33], [0, 0.088, 0], mats.power, 0.025);
  for (let i = 0; i < 12; i++)
    box(
      power,
      [0.014, 0.035, 1.32],
      [-1.09 + i * 0.198, 0.11, 0],
      metal,
      0.003,
    );
  screws(
    power,
    [-1.19, -0.78, -0.38, 0.04, 0.45, 0.86, 1.19],
    [-0.67, 0.67],
    0.11,
  );
  tag(power, 'power', '400 V · FLOOR BATTERY', [-0.4, 0.36, -0.4]);
  const lv = box(power, [0.33, 0.23, 0.24], [0.93, 0.57, -0.55], dark, 0.018);
  box(lv, [0.25, 0.014, 0.15], [0, 0.122, 0], mats.power, 0.009);
  for (const side of [-1, 1])
    cylinder(lv, 0.015, 0.015, 0.016, [side * 0.103, 0.127, 0], copper, 12);
  tag(power, 'power', '48 V · LOW-VOLTAGE SUPPLY', [1.06, 1, -0.5]);
  // Generic EV thermal packaging, recessed behind the nose; not Cybercab factory CAD.
  const cooler = box(power, [0.085, 0.22, 0.86], [2.08, 0.18, 0], dark, 0.018);
  cooler.name = 'EV coolant heat exchanger (illustrative)';
  for (let i = 0; i < 13; i++)
    box(
      cooler,
      [0.009, 0.004, 0.76],
      [0.048, -0.087 + i * 0.014, 0],
      metal,
      0.001,
    );
  tag(power, 'power', 'EV COOLING · illustrative layout', [1.95, 0.54, 0.35]);
  const thermal = material('#55b7ac', 0.45, 0.4);
  tube(
    power,
    [
      [0.3, 0.11, -0.5],
      [1.2, 0.18, -0.58],
      [2.1, 0.15, -0.48],
      [2.1, 0.15, 0.5],
      [1.2, 0.16, 0.52],
      [0.3, 0.11, 0.5],
    ],
    0.014,
    thermal,
  );

  const control = module('control', [0, 0, 0]);
  const motor = new T.Group();
  motor.position.set(1.43, 0.42, 0);
  control.add(motor);
  const casing = cylinder(motor, 0.165, 0.165, 0.51, [0, 0, 0], metal, 48);
  casing.rotation.x = Math.PI / 2;
  const rotor = cylinder(motor, 0.1, 0.1, 0.54, [0, 0, 0], copper, 32);
  rotor.rotation.x = Math.PI / 2;
  const motorCaps: T.Mesh[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const bar = box(
      rotor,
      [0.014, 0.43, 0.011],
      [Math.cos(a) * 0.102, 0, Math.sin(a) * 0.102],
      mats.power,
      0.002,
    );
    bar.rotation.y = -a;
  }
  for (const z of [-0.28, 0.28]) {
    const cap = cylinder(motor, 0.158, 0.158, 0.021, [0, 0, z], dark, 32);
    cap.rotation.x = Math.PI / 2;
    motorCaps.push(cap);
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      const b = cylinder(
        motor,
        0.011,
        0.011,
        0.028,
        [Math.cos(a) * 0.136, Math.sin(a) * 0.136, z],
        metal,
        12,
      );
      b.rotation.x = Math.PI / 2;
    }
  }
  const inverter = box(
    motor,
    [0.36, 0.115, 0.39],
    [-0.07, 0.18, 0],
    metal,
    0.027,
  );
  for (let i = 0; i < 10; i++)
    box(
      inverter,
      [0.025, 0.018, 0.34],
      [-0.14 + i * 0.031, 0.067, 0],
      dark,
      0.002,
    );
  tag(control, 'control', 'FRONT DRIVE · INVERTER', [1.5, 0.98, -0.5]);
  const steeringRig = createSteeringRig(control);
  for (const side of [-1, 1]) {
    const axle = cylinder(
      control,
      0.022,
      0.022,
      0.88,
      [1.43, 0.385, side * 0.16],
      metal,
      20,
    );
    axle.rotation.x = Math.PI / 2;
    for (const x of [-1.39, 1.4]) {
      const disc = cylinder(
        control,
        0.246,
        0.246,
        0.023,
        [x, 0.385, side * 0.697],
        metal,
        48,
      );
      disc.rotation.x = Math.PI / 2;
      const caliper = box(
        control,
        [0.12, 0.23, 0.077],
        [x - 0.18, 0.385, side * 0.707],
        mats.control,
        0.025,
      );
      caliper.userData.brake = true;
      for (let i = 0; i < 18; i++) {
        const a = (i * Math.PI) / 9;
        const hole = cylinder(
          control,
          0.006,
          0.006,
          0.028,
          [x + Math.cos(a) * 0.205, 0.385 + Math.sin(a) * 0.205, side * 0.697],
          dark,
          8,
        );
        hole.rotation.x = Math.PI / 2;
      }
      box(control, [0.12, 0.05, 0.15], [x, 0.27, side * 0.53], dark, 0.012);
    }
  }
  tag(control, 'control', 'STEERING & BRAKE ACTUATORS', [0.82, 0.9, 0.92]);
  // Functional signal routes. These are not a factory wiring-harness map.
  const wireMeshes: T.Mesh[] = [];
  const links: { curve: T.CatmullRomCurve3; dots: T.Mesh[]; kind: string }[] =
    [];
  const paths: { points: V3[]; kind: string }[] = [
    {
      points: [
        [2.23, 0.69, 0],
        [1.8, 0.79, 0.25],
        [1.4, 0.87, 0.27],
        [0.87, 0.93, 0.24],
      ],
      kind: 'sensors',
    },
    {
      points: [
        [1.18, 0.83, 0.879],
        [1.17, 0.9, 0.68],
        [0.95, 0.9, 0.42],
        [0.87, 0.93, 0.24],
      ],
      kind: 'sensors',
    },
    {
      points: [
        [1.18, 0.83, -0.879],
        [1.17, 0.9, -0.68],
        [0.95, 0.9, -0.42],
        [0.87, 0.93, -0.24],
      ],
      kind: 'sensors',
    },
    {
      points: [
        [-2.24, 0.84, 0],
        [-1.3, 0.4, -0.67],
        [0.4, 0.48, -0.67],
        [0.87, 0.93, -0.24],
      ],
      kind: 'sensors',
    },
    {
      points: [
        [0.87, 0.92, 0],
        [1.1, 0.83, 0.3],
        [1.04, 0.55, 0.38],
        [0.96, 0.43, 0.26],
      ],
      kind: 'control',
    },
    {
      points: [
        [0.87, 0.92, 0],
        [1.2, 0.82, -0.15],
        [1.43, 0.62, -0.15],
      ],
      kind: 'control',
    },
    {
      points: [
        [1.4, 0.38, 0.69],
        [0.9, 0.38, 0.62],
        [0.55, 0.68, 0.48],
        [0.73, 0.93, 0.13],
      ],
      kind: 'compute',
    },
    {
      points: [
        [-0.1, 0.31, 0.6],
        [0.6, 0.32, 0.6],
        [1.14, 0.4, 0.42],
        [1.38, 0.57, 0.18],
      ],
      kind: 'power',
    },
  ];
  for (const p of paths) {
    const curve = new T.CatmullRomCurve3(
      p.points.map((v) => new T.Vector3(...v)),
    );
    const m = new T.MeshBasicMaterial({
      color: accent[p.kind],
      transparent: true,
      opacity: 0.5,
    });
    const wire = new T.Mesh(new T.TubeGeometry(curve, 32, 0.008, 6, false), m);
    group.add(wire);
    wireMeshes.push(wire);
    const dots = Array.from({ length: 5 }, () => {
      const d = new T.Mesh(
        new T.SphereGeometry(0.02, 8, 8),
        new T.MeshBasicMaterial({ color: accent[p.kind] }),
      );
      group.add(d);
      return d;
    });
    links.push({ curve, dots, kind: p.kind });
  }
  group.traverse((o) => {
    if (o instanceof T.Mesh) {
      let p: T.Object3D | null = o;
      while (p && !p.userData.system) p = p.parent;
      if (p) {
        o.userData.system = p.userData.system;
        picks.push(o);
      }
    }
  });
  let explode = 0;
  const bases = new Map(
    Object.values(modules).map((m) => [m, m.position.clone()]),
  );
  const shifts: Record<string, V3> = {
    sensors: [0, 0.28, 0.05],
    compute: [0.18, 1.15, 0],
    power: [0, 0, 0],
    control: [0.42, 0.48, 0],
  };
  return {
    group,
    picks,
    anchor(id: SystemId, detail: ControlDetail = 'mechanism') {
      if (id === 'control' && detail === 'electronics')
        return electronics.group.getWorldPosition(new T.Vector3());
      const m =
        modules[id === 'perception' || id === 'planning' ? 'compute' : id];
      if (id === 'control')
        return modules.control.localToWorld(new T.Vector3(1.24, 0.43, 0));
      if (id === 'sensors')
        return modules.sensors.localToWorld(new T.Vector3(1, 0.78, 0));
      if (id === 'perception' || id === 'planning')
        return group.localToWorld(new T.Vector3(0.55, 1.15, 0));
      return m
        ? m.getWorldPosition(new T.Vector3())
        : group.localToWorld(new T.Vector3(0, 0.6, 0));
    },
    update(
      f: Frame,
      s: Settings,
      id: SystemId,
      assembly: Assembly,
      delta: number,
      pose?: { explode: number; lid: number },
      steering?: SteeringSample,
      detail: ControlDetail = 'mechanism',
    ) {
      group.visible = assembly !== 'assembled';
      const electronicsOnly = id === 'control' && detail === 'electronics';
      for (const m of Object.values(modules)) m.visible = !electronicsOnly;
      software.update(f, s, id);
      electronics.update(
        f.time,
        steering,
        id === 'control' && detail === 'electronics',
      );
      explode =
        pose?.explode ??
        T.MathUtils.damp(explode, assembly === 'exploded' ? 1 : 0, 5, delta);
      for (const [key, m] of Object.entries(modules))
        m.position
          .copy(bases.get(m)!)
          .addScaledVector(new T.Vector3(...shifts[key]), explode);
      const active = id === 'perception' || id === 'planning' ? 'compute' : id;
      for (const [key, m] of Object.entries(mats))
        m.emissiveIntensity = key === active ? 0.5 : 0.12;
      lid.position.y =
        pose?.lid ??
        T.MathUtils.damp(
          lid.position.y,
          id === 'compute' ? 0.24 : assembly === 'exploded' ? 0.16 : 0,
          5,
          delta,
        );
      lid.visible = id !== 'perception' && id !== 'planning';
      field.visible = id === 'sensors';
      labels.forEach(({ id: key, sprite }) => {
        sprite.visible = key === active && id !== 'control';
        if (key === 'compute') sprite.scale.set(0.45, 0.0675, 1);
      });
      const telemetry = engineeringTelemetry(f, s);
      rotor.rotation.y = f.x / 0.382;
      casing.material = metal;
      casing.visible =
        id !== 'power' && (id !== 'control' || assembly !== 'exploded');
      motorCaps.forEach((cap) => {
        cap.visible = id !== 'power';
      });
      steeringRig.update(
        steering?.measured ?? telemetry.steering,
        f.time,
        id === 'control',
        steering,
      );
      mats.control.emissiveIntensity =
        active === 'control' ? 0.3 + telemetry.brake * 0.8 : 0.12;
      wireMeshes.forEach((w) => {
        w.visible = assembly !== 'exploded' && !electronicsOnly;
      });
      for (const link of links) {
        link.dots.forEach((dot, i) => {
          dot.visible =
            !electronicsOnly &&
            assembly !== 'exploded' &&
            (id === 'overview' || link.kind === active || active === 'compute');
          dot.position.copy(
            link.curve.getPoint((f.time * 0.3 + i / link.dots.length) % 1),
          );
        });
      }
    },
  };
}
