import * as T from 'three';
import { box, cylinder, line, material } from './geometry';
import { motorDriverAt } from '@/lib/self-driving/motor-driver';
import type { SteeringSample } from '@/lib/self-driving/steering';
export function createMotorController(parent: T.Group) {
  const group = new T.Group();
  group.position.set(0.8, 1.8, 0);
  parent.add(group);
  group.userData.system = 'control';
  group.name =
    'Illustrative steering ECU, gate driver and three-phase power stage';
  const metal = material('#acbec4', 0.8, 0.26),
    pcb = material('#16483c', 0.3, 0.46),
    dark = material('#14242d', 0.3, 0.45);
  box(group, [1.15, 0.055, 0.7], [0, 0, 0], metal, 0.025);
  box(group, [1.1, 0.015, 0.65], [0, 0.035, 0], pcb, 0.01);
  const ecu = box(group, [0.19, 0.033, 0.19], [-0.35, 0.06, 0], dark, 0.008);
  box(
    ecu,
    [0.13, 0.004, 0.13],
    [0, 0.019, 0],
    material('#a99aff', 0.5, 0.3),
    0.002,
  );
  box(group, [0.1, 0.03, 0.14], [-0.14, 0.06, 0], dark, 0.006);
  for (let i = 0; i < 9; i++) {
    line(
      group,
      [
        [-0.25, 0.048, -0.08 + i * 0.02],
        [-0.2, 0.048, -0.08 + i * 0.02],
        [-0.19, 0.048, -0.06 + i * 0.014],
      ],
      '#c3a566',
      0.85,
    );
  }
  // Short physical labels follow the same scene in the site and recording.
  if (typeof document !== 'undefined') {
    for (const [text, position, width] of [
      ['STEERING ECU', [-0.35, 0.17, -0.17], 0.38],
      ['GATE DRIVER', [-0.12, 0.14, 0.19], 0.34],
      ['6 MOSFET SWITCHES', [0.22, 0.17, -0.34], 0.5],
      ['3-PHASE MOTOR', [0.84, 0.43, 0], 0.48],
    ] as [string, [number, number, number], number][]) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 72;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#10212ce8';
      ctx.fillRect(0, 0, 512, 72);
      ctx.font = '500 36px Arial';
      ctx.fillStyle = '#e6f1eb';
      ctx.textAlign = 'center';
      ctx.fillText(text, 256, 49);
      const map = new T.CanvasTexture(canvas);
      map.colorSpace = T.SRGBColorSpace;
      const sprite = new T.Sprite(
        new T.SpriteMaterial({ map, depthTest: false, depthWrite: false }),
      );
      sprite.position.set(...position);
      sprite.scale.set(width, (width * 72) / 512, 1);
      sprite.renderOrder = 10;
      group.add(sprite);
    }
  }
  const colors = ['#edac62', '#77dbea', '#bca1ff'];
  const switches: T.MeshStandardMaterial[][] = [];
  for (let i = 0; i < 3; i++) {
    const x = 0.055 + i * 0.165;
    const pair: T.MeshStandardMaterial[] = [];
    for (const side of [-1, 1]) {
      const m = material('#243943', 0.55, 0.35);
      m.emissive = new T.Color(colors[i]);
      box(group, [0.105, 0.028, 0.085], [x, 0.07, side * 0.17], m, 0.006);
      for (const dx of [-0.024, 0, 0.024])
        box(
          group,
          [0.009, 0.008, 0.032],
          [x + dx, 0.053, side * 0.105],
          metal,
          0.001,
        );
      line(
        group,
        [
          [x, 0.055, side * 0.17],
          [x, 0.055, side * 0.29],
          [-0.47, 0.055, side * 0.29],
        ],
        side < 0 ? '#ee9773' : '#81949d',
        0.9,
      );
      line(
        group,
        [
          [x, 0.058, side * 0.115],
          [x, 0.058, 0],
        ],
        colors[i],
        0.9,
      );
      pair.push(m);
    }
    switches.push(pair);
  }
  for (const side of [-1, 1]) {
    const cap = cylinder(
      group,
      0.045,
      0.045,
      0.1,
      [-0.44, 0.1, side * 0.22],
      dark,
      24,
    );
    cylinder(cap, 0.035, 0.035, 0.004, [0, 0.052, 0], metal, 24);
  }
  // Motor cross-section and windings, separated from the board for teaching.
  const motor = new T.Group();
  motor.position.set(0.84, 0.13, 0);
  group.add(motor);
  const stator = new T.Mesh(new T.TorusGeometry(0.18, 0.031, 10, 48), metal);
  stator.rotation.x = -Math.PI / 2;
  motor.add(stator);
  const phaseMats = colors.map(
    (color) =>
      new T.MeshStandardMaterial({
        color,
        metalness: 0.5,
        roughness: 0.35,
        emissive: color,
      }),
  );
  for (let i = 0; i < 9; i++) {
    const a = (i * Math.PI * 2) / 9;
    const winding = box(
      motor,
      [0.06, 0.1, 0.045],
      [Math.cos(a) * 0.155, 0, Math.sin(a) * 0.155],
      phaseMats[i % 3],
      0.012,
    );
    winding.rotation.y = -a;
  }
  const rotor = new T.Group();
  motor.add(rotor);
  cylinder(rotor, 0.097, 0.097, 0.1, [0, 0, 0], dark, 32);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const magnet = box(
      rotor,
      [0.025, 0.1, 0.045],
      [Math.cos(a) * 0.094, 0, Math.sin(a) * 0.094],
      material(i % 2 ? '#719ead' : '#db977b', 0.4, 0.38),
      0.006,
    );
    magnet.rotation.y = -a;
  }
  cylinder(rotor, 0.023, 0.023, 0.23, [0, 0.035, 0], metal, 24);
  for (let i = 0; i < 3; i++) {
    const x = 0.055 + i * 0.165,
      z = (i - 1) * 0.07;
    line(
      group,
      [
        [x, 0.07, 0],
        [x, 0.13, z],
        [0.65, 0.13, z],
        [0.84, 0.13, z],
      ],
      colors[i],
      0.85,
    );
  }
  const signals = [
    {
      points: [
        [-0.74, 0.065, 0],
        [-0.46, 0.065, 0],
      ],
      color: '#a99aff',
    },
    {
      points: [
        [-0.25, 0.1, 0],
        [-0.19, 0.1, 0],
      ],
      color: '#d5ef78',
    },
    {
      points: [
        [0.84, 0.13, 0.25],
        [0.3, 0.2, 0.38],
        [-0.35, 0.16, 0.38],
        [-0.35, 0.08, 0.1],
      ],
      color: '#71dceb',
    },
  ].map((r) => {
    const curve = new T.CatmullRomCurve3(
      r.points.map((v) => new T.Vector3(...(v as [number, number, number]))),
    );
    const m = new T.Mesh(
      new T.TubeGeometry(curve, 24, 0.008, 6, false),
      new T.MeshBasicMaterial({
        color: r.color,
        transparent: true,
        opacity: 0.55,
      }),
    );
    group.add(m);
    const dots = Array.from({ length: 3 }, () => {
      const d = new T.Mesh(
        new T.SphereGeometry(0.017, 8, 8),
        new T.MeshBasicMaterial({ color: r.color }),
      );
      group.add(d);
      return d;
    });
    return { curve, dots };
  });
  group.visible = false;
  return {
    group,
    update(time: number, sample: SteeringSample | undefined, visible: boolean) {
      group.visible = visible;
      if (!visible) return;
      const driver = motorDriverAt(time, sample?.effort ?? 0.7);
      switches.forEach((pair, i) =>
        pair.forEach((m, j) => {
          const on = j === 0 ? driver.phases[i].high : driver.phases[i].low;
          m.emissiveIntensity = on ? 1.35 : 0.03;
          m.color.set(on ? colors[i] : '#243943');
        }),
      );
      phaseMats.forEach((m, i) => {
        m.emissiveIntensity = 0.1 + Math.abs(driver.phases[i].current) * 0.85;
      });
      rotor.rotation.y = -(sample?.measured ?? 0) * 7;
      signals.forEach((r) =>
        r.dots.forEach((dot, i) =>
          dot.position.copy(r.curve.getPoint((time * 0.45 + i / 3) % 1)),
        ),
      );
    },
  };
}
