import * as THREE from 'three';
import { modelKit, batchVehicleModel, type P3 } from './vehicle-model';
export function createVehicleChassis() {
  const group = new THREE.Group();
  group.name = 'unibody-chassis';
  const k = modelKit();
  const { box, tube, bar, steel, alloy, black, rubber } = k;
  // Stamped passenger floor with a central exhaust tunnel and seat crossmembers.
  for (const side of [-1, 1]) {
    box(group, [0.63, 0.035, 2.02], [side * 0.365, 0.21, 1.69], steel, 0.016);
    box(group, [0.105, 0.115, 2.12], [side * 0.772, 0.245, 1.66], steel, 0.02);
    for (const z of [0.86, 1.4, 2.05, 2.55])
      box(group, [0.69, 0.065, 0.09], [side * 0.385, 0.256, z], alloy, 0.014);
    for (let x = 0.12; x < 0.65; x += 0.105)
      tube(
        group,
        [
          [side * x, 0.232, 0.83],
          [side * x, 0.239, 1.19],
          [side * x, 0.232, 1.39],
        ],
        0.008,
        steel,
      );
    tube(
      group,
      [
        [side * 0.74, 0.22, 2.51],
        [side * 0.68, 0.39, 2.83],
        [side * 0.68, 0.32, 3.32],
      ],
      0.047,
      steel,
    );
    box(group, [0.075, 0.08, 0.52], [side * 0.67, 0.34, -0.48], steel, 0.015);
    // An open front subframe leaves clearance underneath the wet sump.
    tube(
      group,
      [
        [side * 0.43, 0.165, -0.25],
        [side * 0.47, 0.15, 0.1],
        [side * 0.42, 0.18, 0.39],
      ],
      0.035,
      steel,
    );
    bar(
      group,
      [side * 0.43, 0.19, -0.21],
      [side * 0.71, 0.29, 0],
      0.023,
      alloy,
    );
    bar(group, [side * 0.45, 0.19, 0.3], [side * 0.71, 0.29, 0], 0.023, alloy);
    bar(
      group,
      [side * 0.71, 0.31, 0],
      [side * 0.59, 0.69, 0.055],
      0.032,
      steel,
    );
    bar(
      group,
      [side * 0.68, 0.39, 0.015],
      [side * 0.59, 0.72, 0.055],
      0.013,
      alloy,
    );
    const spring: P3[] = [];
    for (let i = 0; i <= 112; i++) {
      const a = (i / 112) * Math.PI * 12;
      spring.push([
        side * 0.6 + Math.cos(a) * 0.056,
        0.46 + (i / 112) * 0.23,
        0.045 + Math.sin(a) * 0.056,
      ]);
    }
    tube(group, spring, 0.0085, black);
    box(group, [0.17, 0.045, 0.18], [side * 0.59, 0.731, 0.06], steel, 0.035);
    box(group, [0.105, 0.075, 0.105], [side * 0.45, 0.34, 0.1], rubber, 0.017);
    bar(
      group,
      [side * 0.32, 0.4, 0.02],
      [side * 0.46, 0.375, 0.1],
      0.033,
      alloy,
    );
    // Rear links, dampers and separate coil springs.
    bar(
      group,
      [side * 0.43, 0.24, 2.43],
      [side * 0.72, 0.31, 2.7],
      0.023,
      steel,
    );
    bar(
      group,
      [side * 0.42, 0.27, 2.89],
      [side * 0.72, 0.31, 2.7],
      0.021,
      alloy,
    );
    bar(group, [side * 0.71, 0.3, 2.7], [side * 0.6, 0.72, 2.8], 0.027, steel);
    const rearSpring: P3[] = [];
    for (let i = 0; i <= 100; i++) {
      const a = (i / 100) * Math.PI * 10;
      rearSpring.push([
        side * 0.53 + Math.cos(a) * 0.057,
        0.31 + (i / 100) * 0.24,
        2.69 + Math.sin(a) * 0.057,
      ]);
    }
    tube(group, rearSpring, 0.008, black);
    box(group, [0.18, 0.04, 0.2], [side * 0.53, 0.57, 2.69], steel, 0.03);
    // Brake/fuel lines follow the protected floor channels.
    tube(
      group,
      [
        [side * 0.51, 0.25, 0.25],
        [side * 0.65, 0.26, 0.65],
        [side * 0.65, 0.26, 2.36],
        [side * 0.69, 0.33, 2.66],
      ],
      0.0045,
      alloy,
    );
    box(group, [0.08, 0.105, 0.08], [side * 0.71, 0.318, 0], steel, 0.012);
    box(group, [0.075, 0.1, 0.08], [side * 0.71, 0.318, 2.7], steel, 0.01);
  }
  box(group, [1.43, 0.07, 0.085], [0, 0.255, 0.68], steel, 0.012);
  box(group, [0.15, 0.085, 1.92], [0, 0.265, 1.61], steel, 0.024);
  box(group, [0.88, 0.065, 0.075], [0, 0.175, 0.36], steel, 0.01);
  box(group, [1.22, 0.07, 0.095], [0, 0.285, 2.73], steel, 0.015);
  box(group, [1.26, 0.065, 0.095], [0, 0.355, -0.73], alloy, 0.017);
  box(group, [1.38, 0.08, 0.11], [0, 0.3, 3.43], alloy, 0.02);
  // Firewall is a formed panel, rather than a heavy ladder frame.
  box(group, [1.35, 0.27, 0.028], [0, 0.415, 0.685], steel, 0.013);
  for (const side of [-1, 1])
    box(group, [0.2, 0.25, 0.032], [side * 0.62, 0.615, 0.69], steel, 0.016);
  // Steering rack and tie rods are behind the front axle line.
  bar(group, [-0.49, 0.3, 0.22], [0.49, 0.3, 0.22], 0.022, alloy);
  for (const side of [-1, 1]) {
    bar(
      group,
      [side * 0.44, 0.3, 0.22],
      [side * 0.71, 0.31, 0.07],
      0.009,
      steel,
    );
    for (let j = 0; j < 7; j++)
      bar(
        group,
        [side * (0.38 + j * 0.012), 0.3, 0.22],
        [side * (0.386 + j * 0.012), 0.3, 0.22],
        0.028,
        rubber,
      );
  }
  const shafts: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const shaft = new THREE.Group();
    shaft.position.set(0, 0.325, 0.025);
    group.add(shaft);
    shafts.push(shaft);
    bar(shaft, [side * 0.43, 0, 0], [side * 0.715, 0, 0], 0.012, alloy);
    for (const x of [side * 0.46, side * 0.675])
      for (let j = 0; j < 6; j++)
        bar(
          shaft,
          [x + j * 0.006, 0, 0],
          [x + j * 0.006 + 0.004, 0, 0],
          0.025 + Math.sin((j / 5) * Math.PI) * 0.009,
          rubber,
        );
  }
  // Battery, tank, catalytic converter and underfloor exhaust complete the package.
  box(group, [0.245, 0.2, 0.185], [0.51, 0.49, 0.405], black, 0.018);
  box(group, [0.265, 0.025, 0.2], [0.51, 0.593, 0.405], rubber, 0.012);
  for (const x of [0.44, 0.58])
    box(group, [0.018, 0.024, 0.028], [x, 0.618, 0.405], alloy, 0.005);
  box(group, [0.62, 0.17, 0.57], [-0.33, 0.305, 2.23], black, 0.055);
  for (const z of [2.04, 2.42])
    box(group, [0.64, 0.014, 0.025], [-0.33, 0.219, z], steel, 0.006);
  tube(
    group,
    [
      [0.19, 0.48, 0.12],
      [0.2, 0.28, 0.35],
      [0.17, 0.19, 0.63],
      [0.03, 0.155, 1.14],
      [0.03, 0.155, 2.57],
      [0.36, 0.2, 2.93],
      [0.36, 0.23, 3.24],
    ],
    0.023,
    alloy,
  );
  box(group, [0.135, 0.095, 0.25], [0.16, 0.2, 0.63], alloy, 0.04);
  box(group, [0.54, 0.125, 0.3], [0.28, 0.23, 3.19], steel, 0.05);
  tube(
    group,
    [
      [0.48, 0.23, 3.18],
      [0.57, 0.23, 3.48],
      [0.57, 0.24, 3.66],
    ],
    0.028,
    alloy,
  );
  batchVehicleModel(group);
  return {
    group,
    materials: k.materials,
    setWheelAngle(angle: number) {
      shafts.forEach((s) => (s.rotation.x = angle));
    },
  };
}
