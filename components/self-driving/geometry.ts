import * as T from 'three';
import { createRoadWheel, WHEEL_RADIUS } from './wheel';
import { createCabinMaterials } from './cabin-materials';
import { cybercabDoorRotation } from './door-motion';
import { roadWheelAngle } from '@/lib/self-driving/steering';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export const material = (color: string, metalness = 0, roughness = 0.7) =>
  new T.MeshStandardMaterial({ color, metalness, roughness });
export function box(
  parent: T.Object3D,
  size: [number, number, number],
  pos: [number, number, number],
  mat: T.Material,
  radius = 0.025,
) {
  const mesh = new T.Mesh(
    radius
      ? new RoundedBoxGeometry(
          ...size,
          2,
          Math.min(radius, ...size.map((n) => n / 3)),
        )
      : new T.BoxGeometry(...size),
    mat,
  );
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function surface(
  parent: T.Object3D,
  points: number[][],
  indices: number[],
  mat: T.Material,
) {
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(points.flat(), 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new T.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function line(
  parent: T.Object3D,
  points: number[][],
  color: string,
  opacity = 1,
) {
  const geo = new T.BufferGeometry().setFromPoints(
    points.map((p) => new T.Vector3(...(p as [number, number, number]))),
  );
  const mesh = new T.Line(
    geo,
    new T.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
  parent.add(mesh);
  return mesh;
}
export function tube(
  parent: T.Object3D,
  points: number[][],
  radius: number,
  mat: T.Material,
) {
  const curve = new T.CatmullRomCurve3(
    points.map((p) => new T.Vector3(...(p as [number, number, number]))),
  );
  const mesh = new T.Mesh(
    new T.TubeGeometry(curve, Math.max(8, points.length * 4), radius, 6, false),
    mat,
  );
  parent.add(mesh);
  return mesh;
}
export function cylinder(
  parent: T.Object3D,
  top: number,
  bottom: number,
  height: number,
  pos: number[],
  mat: T.Material,
  segments = 24,
) {
  const mesh = new T.Mesh(
    new T.CylinderGeometry(top, bottom, height, segments),
    mat,
  );
  mesh.position.set(...(pos as [number, number, number]));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function createCybercab() {
  const group = new T.Group();
  group.name = 'Cybercab-inspired educational model';
  const doors: { hinge: T.Group; side: number }[] = [];
  const gold = new T.MeshPhysicalMaterial({
    color: '#bca276',
    metalness: 0.76,
    roughness: 0.29,
    clearcoat: 0.45,
    clearcoatRoughness: 0.28,
    side: T.DoubleSide,
  });
  const black = material('#111a1d', 0.12, 0.4);
  black.side = T.DoubleSide;
  const glass = new T.MeshPhysicalMaterial({
    color: '#243d33',
    metalness: 0.12,
    roughness: 0.12,
    transmission: 0.22,
    thickness: 0.004,
    ior: 1.52,
    clearcoat: 1,
    side: T.DoubleSide,
  });
  const cabin = material('#34363a', 0, 0.92),
    seatMat = material('#77736c', 0, 0.85),
    chrome = material('#b7b9b5', 0.9, 0.2);
  const white = new T.MeshStandardMaterial({
    color: '#e7faff',
    emissive: '#d1f5ff',
    emissiveIntensity: 2.8,
    side: T.DoubleSide,
  });
  const red = new T.MeshStandardMaterial({
    color: '#ff3936',
    emissive: '#fa1919',
    emissiveIntensity: 2,
    side: T.DoubleSide,
  });
  box(group, [3.94, 0.19, 1.65], [0, 0.25, 0], black, 0.055);
  box(group, [1.95, 0.1, 1.51], [-0.15, 0.43, 0], cabin, 0.055).name =
    'legacy_cabin_floor';
  let skinIndex = 0;
  function skin(rows: number[][], mat: T.Material) {
    const pts: number[][] = [],
      ind: number[] = [];
    rows.forEach(([x, y, w, bulge]) => {
      for (let k = 0; k <= 20; k++) {
        const v = k / 10 - 1;
        pts.push([x, y + bulge * (1 - v * v), v * w]);
      }
    });
    for (let i = 0; i < rows.length - 1; i++)
      for (let k = 0; k < 20; k++) {
        const n = i * 21 + k;
        ind.push(n, n + 1, n + 21, n + 1, n + 22, n + 21);
      }
    const mesh = surface(group, pts, ind, mat);
    mesh.name = ['body_hood', 'body_hatch', 'body_windshield'][skinIndex++];
    return mesh;
  }
  // Compound-curved front, a compact passenger canopy, and a descending gold hatch.
  skin(
    [
      [0.7, 1.005, 0.755, 0.014],
      [1.0, 0.95, 0.8, 0.045],
      [1.35, 0.87, 0.858, 0.056],
      [1.75, 0.8, 0.875, 0.045],
      [2.12, 0.735, 0.82, 0.016],
      [2.22, 0.69, 0.72, 0.012],
    ],
    gold,
  );
  skin(
    [
      [-2.2, 0.9, 0.82, 0.014],
      [-1.95, 0.98, 0.872, 0.015],
      [-1.5, 1.065, 0.86, 0.018],
      [-1.05, 1.19, 0.78, 0.022],
      [-0.64, 1.34, 0.68, 0.025],
      [-0.24, 1.39, 0.647, 0.018],
      [0.04, 1.386, 0.643, 0.012],
    ],
    gold,
  );
  skin(
    [
      [0.72, 1.003, 0.755, 0],
      [0.59, 1.13, 0.725, 0.004],
      [0.28, 1.365, 0.641, 0.01],
      [0.04, 1.39, 0.643, 0.01],
    ],
    glass,
  );
  for (const side of [-1, 1]) {
    const shape = new T.Shape();
    shape.moveTo(-2.2, 0.87);
    shape.lineTo(-1.5, 1.065);
    shape.lineTo(-1.08, 1.013);
    shape.lineTo(0.75, 1.013);
    shape.lineTo(1.45, 0.88);
    shape.lineTo(2.2, 0.69);
    shape.lineTo(2.17, 0.29);
    for (const cx of [1.4, -1.39]) {
      shape.lineTo(
        cx + Math.cos(-0.39) * 0.405,
        0.385 + Math.sin(-0.39) * 0.405,
      );
      for (let i = 0; i <= 36; i++) {
        const a = -0.39 + (i * (Math.PI + 0.78)) / 36;
        shape.lineTo(cx + Math.cos(a) * 0.405, 0.385 + Math.sin(a) * 0.405);
      }
    }
    shape.lineTo(-2.17, 0.28);
    shape.closePath();
    const opening = new T.Path();
    opening.moveTo(-0.94, 0.34);
    opening.lineTo(0.86, 0.34);
    opening.lineTo(0.73, 0.96);
    opening.lineTo(-0.99, 0.96);
    opening.closePath();
    shape.holes.push(opening);
    const shell = new T.Mesh(new T.ShapeGeometry(shape, 24), gold);
    shell.geometry.translate(0, 0, side * 0.864);
    shell.name = 'body_fender_' + side;
    shell.castShadow = true;
    group.add(shell);
    const hinge = new T.Group();
    hinge.position.set(0.75, 1.01, side * 0.84);
    group.add(hinge);
    const door = new T.Group();
    door.position.set(-0.75, -1.01, -side * 0.84);
    hinge.add(door);
    door.name = 'door_' + side;
    surface(
      door,
      [
        [-0.97, 0.33, side * 0.831],
        [0.83, 0.33, side * 0.831],
        [0.74, 0.993, side * 0.868],
        [-1.04, 1.006, side * 0.868],
      ],
      [0, 1, 2, 0, 2, 3],
      gold,
    );
    surface(
      door,
      [
        [-1.04, 1.018, side * 0.86],
        [0.73, 1.012, side * 0.86],
        [0.23, 1.355, side * 0.65],
        [-0.6, 1.34, side * 0.688],
      ],
      [0, 1, 2, 0, 2, 3],
      glass,
    );
    tube(
      door,
      [
        [-0.96, 0.36, side * 0.86],
        [-1.04, 0.91, side * 0.88],
        [-1.04, 1.015, side * 0.86],
      ],
      0.008,
      black,
    );
    tube(
      door,
      [
        [0.81, 0.36, side * 0.858],
        [0.75, 0.99, side * 0.878],
        [0.23, 1.36, side * 0.65],
      ],
      0.013,
      black,
    );
    box(door, [1.43, 0.23, 0.035], [-0.06, 0.67, side * 0.8], cabin, 0.05);
    box(door, [0.34, 0.043, 0.035], [-0.5, 0.87, side * 0.813], chrome, 0.012);
    door.children[0].name = 'body_door_' + side;
    door.children[1].name = 'body_window_' + side;
    door.children[2].name = 'legacy_door_seal_a_' + side;
    door.children[3].name = 'legacy_door_seal_b_' + side;
    door.children[4].name = 'legacy_door_panel_' + side;
    door.children[5].name = 'legacy_door_handle_' + side;
    doors.push({ hinge, side });
    line(
      group,
      [
        [-1.05, 1.02, side * 0.87],
        [-0.62, 1.345, side * 0.69],
        [0.04, 1.405, side * 0.65],
      ],
      '#433c30',
    ).name = 'legacy_roof_' + side;
    box(
      group,
      [2.24, 0.057, 0.085],
      [-0.09, 0.27, side * 0.852],
      black,
      0.016,
    ).name = 'legacy_rocker_' + side;
    // Camera apertures are illustrative; exact sensor layout varies by reference revision.
    for (const x of [1.14, -1.59]) {
      const lens = cylinder(
        group,
        0.024,
        0.027,
        0.014,
        [x, 0.845, side * 0.88],
        black,
        16,
      );
      lens.rotation.x = Math.PI / 2;
      const optic = cylinder(
        group,
        0.014,
        0.014,
        0.016,
        [x, 0.845, side * 0.89],
        glass,
        16,
      );
      optic.rotation.x = Math.PI / 2;
    }
  }
  const cabinStart = group.children.length;
  for (const sx of [-0.41, 0.41]) {
    box(group, [0.62, 0.13, 0.52], [-0.13, 0.49, sx], seatMat, 0.08);
    const back = box(
      group,
      [0.14, 0.58, 0.54],
      [-0.48, 0.8, sx],
      seatMat,
      0.055,
    );
    back.rotation.z = -0.15;
    box(group, [0.14, 0.23, 0.28], [-0.53, 1.14, sx], cabin, 0.052);
    box(group, [0.66, 0.017, 0.42], [-0.15, 0.571, sx], cabin, 0.035);
  }
  box(group, [0.2, 0.12, 1.43], [0.55, 0.88, 0], cabin, 0.04);
  const screen = box(
    group,
    [0.035, 0.24, 0.53],
    [0.48, 0.995, 0],
    black,
    0.022,
  );
  screen.rotation.z = -0.15;
  box(
    group,
    [0.01, 0.196, 0.47],
    [0.454, 1.005, 0],
    material('#285563', 0.2, 0.2),
    0.007,
  );
  group.children.slice(cabinStart).forEach((o, i) => {
    o.name = 'legacy_cabin_' + i;
  });
  const frontFascia = box(
    group,
    [0.075, 0.25, 1.61],
    [2.16, 0.47, 0],
    gold,
    0.05,
  );
  frontFascia.geometry.translate(2.16, 0.47, 0);
  frontFascia.position.set(0, 0, 0);
  frontFascia.name = 'body_front';
  box(group, [0.08, 0.12, 1.59], [2.17, 0.26, 0], black, 0.025).name =
    'legacy_front_valance';
  box(group, [0.065, 0.035, 1.67], [2.181, 0.705, 0], white, 0.013).name =
    'legacy_front_light';
  const rearFascia = box(
    group,
    [0.065, 0.33, 1.62],
    [-2.18, 0.59, 0],
    gold,
    0.035,
  );
  rearFascia.geometry.translate(-2.18, 0.59, 0);
  rearFascia.position.set(0, 0, 0);
  rearFascia.name = 'body_rear';
  box(group, [0.078, 0.14, 1.62], [-2.2, 0.27, 0], black, 0.02).name =
    'legacy_rear_valance';
  box(group, [0.07, 0.055, 1.64], [-2.217, 0.875, 0], black, 0.012).name =
    'legacy_rear_applique';
  box(group, [0.075, 0.024, 1.56], [-2.226, 0.87, 0], red, 0.01).name =
    'legacy_rear_light';
  box(group, [0.087, 0.078, 0.19], [-2.23, 0.69, 0], black, 0.01).name =
    'legacy_rear_plate';
  for (const x of [-2.23, 2.23]) {
    const l = cylinder(
      group,
      0.022,
      0.022,
      0.017,
      [x, x > 0 ? 0.62 : 0.912, 0],
      glass,
      20,
    );
    l.rotation.z = Math.PI / 2;
  }
  const wheels: {
    steer: T.Group;
    roll: T.Group;
    front: boolean;
    side: number;
  }[] = [];
  const wheelCovers: T.Object3D[] = [];
  for (const x of [-1.39, 1.4])
    for (const side of [-1, 1]) {
      const steer = new T.Group();
      steer.position.set(x, WHEEL_RADIUS + 0.003, side * 0.73);
      group.add(steer);
      const roll = new T.Group();
      steer.add(roll);
      const wheel = createRoadWheel(side, gold);
      roll.add(wheel.group);
      wheelCovers.push(wheel.cover);
      steer.name = (x > 0 ? 'front' : 'rear') + '_wheel_pivot_' + side;
      wheels.push({ steer, roll, front: x > 0, side });
    }
  const wheelRoots = new Set(wheels.map((w) => w.steer));
  const bodyRoots = group.children.filter((o) => !wheelRoots.has(o as T.Group));
  const bodyBase = bodyRoots.map((o) => o.position.clone());
  const faded: T.Material[] = [];
  const cloneCache = new Map<T.Material, T.Material>();
  for (const root of bodyRoots)
    root.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.Line) {
        const originals = Array.isArray(o.material) ? o.material : [o.material];
        const copies = originals.map((m) => {
          if (!cloneCache.has(m)) {
            const c = m.clone();
            cloneCache.set(m, c);
            faded.push(c);
          }
          return cloneCache.get(m)!;
        });
        o.material = Array.isArray(o.material) ? copies : copies[0];
      }
    });
  let detailed = false;
  return {
    group,
    async loadDetailed(isCancelled: () => boolean = () => false) {
      if (detailed) return;
      detailed = true;
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const asset = await new GLTFLoader().loadAsync(
        '/models/cybercab-body.glb',
      );
      asset.scene.updateMatrixWorld(true);
      const cabinMaterials = await createCabinMaterials();
      if (!isCancelled())
        group.traverse((o) => {
          if (o.name.startsWith('legacy_')) o.visible = false;
        });
      asset.scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          const target = group.getObjectByName(o.name);
          if (!isCancelled()) {
            const refined = o.geometry.clone().applyMatrix4(o.matrixWorld);
            if (target instanceof T.Mesh) {
              target.geometry.dispose();
              target.geometry = refined;
            } else if (o.name.startsWith('detail_')) {
              const source =
                (
                  {
                    paint: gold,
                    glass,
                    trim: black,
                    headlamp: white,
                    taillamp: red,
                    ...cabinMaterials,
                  } as Record<string, T.Material>
                )[o.userData.surface] ?? black;
              let m = cloneCache.get(source);
              if (!m) {
                m = source.clone();
                cloneCache.set(source, m);
                faded.push(m);
              }
              const mesh = new T.Mesh(refined, m);
              mesh.name = o.name;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              const parent = o.userData.assembly?.startsWith('door_')
                ? (group.getObjectByName(o.userData.assembly) ?? group)
                : group;
              parent.add(mesh);
              if (parent === group) {
                bodyRoots.push(mesh);
                bodyBase.push(new T.Vector3());
              }
            } else refined.dispose();
          }
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
    },
    reveal(amount: number, exploded: number) {
      wheelCovers.forEach((o) => {
        o.visible = amount < 0.65;
      });
      for (const m of faded) {
        m.transparent = amount > 0.001;
        m.opacity = 1 - amount * 0.94;
        m.depthWrite = amount < 0.01;
      }
      bodyRoots.forEach((o, i) => {
        o.position.copy(bodyBase[i]);
        o.position.y += exploded * 1.2;
        o.traverse((child) => {
          if (child instanceof T.Mesh) child.castShadow = amount < 0.2;
        });
      });
    },
    update(distance: number, steering: number, opening: number) {
      for (const w of wheels) {
        w.roll.rotation.z = -distance / WHEEL_RADIUS;
        w.steer.rotation.y = w.front ? -roadWheelAngle(steering, w.side) : 0;
      }
      for (const d of doors) {
        d.hinge.quaternion.copy(cybercabDoorRotation(d.side, opening));
      }
      red.emissiveIntensity = 1.8;
      (cloneCache.get(red) as T.MeshStandardMaterial).emissiveIntensity = 1.8;
    },
    brake(on: boolean) {
      red.emissiveIntensity = on ? 5 : 1.8;
      (cloneCache.get(red) as T.MeshStandardMaterial).emissiveIntensity = on
        ? 5
        : 1.8;
    },
  };
}
