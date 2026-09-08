import * as T from 'three';
import { box, cylinder, material, tube } from './geometry';
import {
  roadWheelAngle,
  type SteeringSample,
} from '@/lib/self-driving/steering';
/** Generic electromechanical rack and pinion; actual Cybercab packaging is not public. */
export function createSteeringRig(parent: T.Group) {
  const group = new T.Group();
  group.name = 'Steering actuator, rack and tie rods';
  parent.add(group);
  const metal = material('#b9c8cc', 0.78, 0.28),
    dark = material('#22343b', 0.5, 0.45),
    command = material('#f08c81', 0.45, 0.3),
    feedback = material('#71dceb', 0.35, 0.35),
    brass = material('#c5a664', 0.75, 0.28);
  const housing = cylinder(group, 0.07, 0.07, 0.66, [0.99, 0.4, 0], dark, 32);
  housing.rotation.x = Math.PI / 2;
  const sliding = new T.Group();
  sliding.position.set(0.99, 0.4, 0);
  group.add(sliding);
  const rod = cylinder(sliding, 0.022, 0.022, 1.06, [0, 0, 0], metal, 24);
  rod.rotation.x = Math.PI / 2;
  for (let i = 0; i < 18; i++)
    box(
      sliding,
      [0.026, 0.025, 0.017],
      [0.026, 0.022, -0.22 + i * 0.026],
      brass,
      0.002,
    );
  const motor = cylinder(
    group,
    0.069,
    0.069,
    0.24,
    [0.84, 0.46, -0.2],
    command,
    32,
  );
  motor.rotation.z = Math.PI / 2;
  box(group, [0.16, 0.12, 0.17], [0.94, 0.46, -0.08], dark, 0.025);
  const gear = new T.Group();
  gear.position.set(0.99, 0.475, 0);
  group.add(gear);
  const hub = cylinder(gear, 0.044, 0.044, 0.032, [0, 0, 0], brass, 24);
  hub.rotation.z = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const tooth = box(
      gear,
      [0.032, 0.016, 0.016],
      [0, Math.sin(a) * 0.047, Math.cos(a) * 0.047],
      brass,
      0.002,
    );
    tooth.rotation.x = -a;
  }
  // A real feedback route has the opposite direction to outgoing control commands.
  const routes = [
    {
      color: '#f08c81',
      points: [
        [0.87, 0.9, 0.02],
        [0.7, 0.79, 0.24],
        [0.79, 0.52, 0.18],
        [0.84, 0.46, -0.2],
      ],
      back: false,
    },
    {
      color: '#71dceb',
      points: [
        [1.4, 0.41, 0.73],
        [1.18, 0.57, 0.65],
        [0.77, 0.72, 0.48],
        [0.87, 0.9, 0.02],
      ],
      back: true,
    },
  ].map((r) => {
    const curve = new T.CatmullRomCurve3(
      r.points.map((v) => new T.Vector3(...(v as [number, number, number]))),
    );
    const wire = new T.Mesh(
      new T.TubeGeometry(curve, 32, 0.006, 6, false),
      new T.MeshBasicMaterial({
        color: r.color,
        transparent: true,
        opacity: 0.55,
      }),
    );
    group.add(wire);
    const dots = Array.from({ length: 4 }, () => {
      const m = new T.Mesh(
        new T.SphereGeometry(0.018, 10, 8),
        new T.MeshBasicMaterial({ color: r.color }),
      );
      group.add(m);
      return m;
    });
    return { ...r, curve, wire, dots };
  });
  const rods: { side: number; mesh: T.Mesh; knuckle: T.Group }[] = [];
  for (const side of [-1, 1]) {
    const boot = cylinder(
      group,
      0.049,
      0.037,
      0.14,
      [0.99, 0.4, side * 0.4],
      dark,
      16,
    );
    boot.rotation.x = Math.PI / 2;
    for (let i = 0; i < 7; i++) {
      const ring = new T.Mesh(new T.TorusGeometry(0.045, 0.004, 6, 24), dark);
      ring.position.set(0.99, 0.4, side * (0.34 + i * 0.018));
      group.add(ring);
    }
    const knuckle = new T.Group();
    knuckle.position.set(1.4, 0.385, side * 0.73);
    group.add(knuckle);
    cylinder(knuckle, 0.035, 0.035, 0.23, [0, 0, 0], metal, 20);
    tube(
      knuckle,
      [
        [0, 0, 0],
        [-0.16, 0.015, 0],
        [-0.21, 0.015, -side * 0.035],
      ],
      0.025,
      metal,
    );
    box(
      knuckle,
      [0.07, 0.055, 0.045],
      [-0.13, 0.065, -side * 0.06],
      feedback,
      0.008,
    );
    const mesh = cylinder(group, 0.016, 0.016, 1, [0, 0, 0], metal, 20);
    rods.push({ side, mesh, knuckle });
  }
  const yAxis = new T.Vector3(0, 1, 0);
  return {
    group,
    update(
      angle: number,
      time: number,
      active: boolean,
      sample?: SteeringSample,
    ) {
      const travel = Math.sin(angle) * 0.19;
      sliding.position.z = travel;
      gear.rotation.x = -travel / 0.044;
      housing.material = active ? metal : dark;
      rods.forEach(({ side, mesh, knuckle }) => {
        knuckle.rotation.y = -roadWheelAngle(angle, side);
        const a = new T.Vector3(0.99, 0.4, side * 0.53 + travel);
        const b = new T.Vector3(-0.21, 0.015, -side * 0.035)
          .applyAxisAngle(yAxis, knuckle.rotation.y)
          .add(knuckle.position);
        const direction = b.clone().sub(a);
        mesh.position.copy(a).add(b).multiplyScalar(0.5);
        mesh.scale.y = direction.length();
        mesh.quaternion.setFromUnitVectors(yAxis, direction.normalize());
      });
      routes.forEach((r) => {
        r.wire.visible = active;
        r.dots.forEach((dot, i) => {
          dot.visible = active;
          dot.position.copy(r.curve.getPoint((time * 0.42 + i / 4) % 1));
        });
      });
      command.emissive.set('#f08c81');
      command.emissiveIntensity = active
        ? 0.15 + Math.abs(sample?.effort ?? 0) * 0.65
        : 0;
    },
  };
}
