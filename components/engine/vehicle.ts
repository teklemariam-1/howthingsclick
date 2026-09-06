import * as THREE from 'three';
import { createRoadWheel } from './road-wheel';
import { createVehicleChassis } from './vehicle-chassis';
import { createVehicleBody } from './vehicle-body';
import { createEngineBay } from './engine-bay';
import {
  VEHICLE_DIMENSIONS as D,
  VEHICLE_GROUND_Y,
  VEHICLE_UNITS_PER_METRE,
  TIRE_RADIUS,
} from '../../lib/engine/vehicle-dimensions';
type Point = [number, number, number];

export function createVehicleContext() {
  const group = new THREE.Group();
  group.name = 'vehicle-context';
  group.scale.setScalar(VEHICLE_UNITS_PER_METRE);
  group.position.y = VEHICLE_GROUND_Y;
  // Transverse engine: crankshaft across the car, radiator ahead of it.
  group.rotation.y = Math.PI / 2;
  const chassis = createVehicleChassis(),
    bodywork = createVehicleBody(),
    bay = createEngineBay();
  group.add(chassis.group, bodywork.group, bay.group);
  let view: 'bay' | 'chassis' | 'body' = 'bay',
    hoodAmount = 1,
    hoodTarget = 1;
  bodywork.setHood(1);
  const outline = new THREE.LineBasicMaterial({
    color: '#a0c6d3',
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const detail = new THREE.LineBasicMaterial({
    color: '#8baabb',
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  const body: number[] = [],
    details: number[] = [];
  function path(points: Point[], secondary = false, smooth = true) {
    const p = points.map((p) => new THREE.Vector3(...p));
    const vertices = smooth
      ? new THREE.CatmullRomCurve3(p, false, 'centripetal').getPoints(64)
      : p;
    const target = secondary ? details : body;
    for (let i = 1; i < vertices.length; i++)
      target.push(...vertices[i - 1].toArray(), ...vertices[i].toArray());
  }
  const halfWidth = D.width / 2,
    rear = D.length - D.frontOverhang;
  for (const side of [-1, 1]) {
    const x = halfWidth * side;
    path([
      [x, 0.25, -0.93],
      [x, 0.61, -0.87],
      [x, 0.8, -0.63],
      [x, 0.87, 0.6],
      [x, 0.83, 2.65],
      [x, 0.78, 3.4],
      [x, 0.58, rear],
      [x, 0.23, rear],
    ]);
    path([
      [x, 0.87, 0.6],
      [side * 0.7, 1.39, 1.18],
      [side * 0.69, 1.43, 2.11],
      [x, 0.88, 2.9],
    ]);
    path(
      [
        [x, 0.25, -0.93],
        [x, 0.2, -0.37],
      ],
      false,
      false,
    );
    path(
      [
        [x, 0.2, 0.37],
        [x, 0.2, 2.33],
      ],
      false,
      false,
    );
    path(
      [
        [x, 0.2, 3.07],
        [x, 0.23, rear],
      ],
      false,
      false,
    );
    for (const z of [0, D.wheelbase]) {
      const arch: Point[] = [];
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI;
        arch.push([x, 0.25 + Math.sin(a) * 0.407, z - Math.cos(a) * 0.37]);
      }
      path(arch, false, false);
    }
    path(
      [
        [side * 0.85, 0.94, 0.79],
        [side * 0.685, 1.34, 1.24],
        [side * 0.675, 1.375, 2.07],
        [side * 0.855, 0.94, 2.67],
        [side * 0.85, 0.94, 0.79],
      ],
      true,
      false,
    );
    path(
      [
        [side * 0.69, 1.405, 1.81],
        [side * 0.87, 0.92, 1.81],
        [x, 0.24, 1.81],
      ],
      true,
      false,
    );
    path(
      [
        [x, 0.86, 0.65],
        [x, 0.28, 0.68],
        [x, 0.24, 1.81],
        [x, 0.28, 2.3],
        [x, 0.86, 2.8],
      ],
      true,
      false,
    );
    for (const z of [1.58, 2.31])
      path(
        [
          [x, 0.79, z],
          [x, 0.79, z + 0.14],
        ],
        true,
        false,
      );
    path(
      [
        [x, 0.89, 0.77],
        [side * 1.035, 0.925, 0.72],
        [side * 1.045, 0.9, 0.86],
        [x, 0.87, 0.88],
      ],
      true,
    );
    path(
      [
        [side * 0.45, 0.65, -0.925],
        [side * 0.78, 0.64, -0.887],
        [side * 0.82, 0.57, -0.899],
        [side * 0.45, 0.585, -0.938],
        [side * 0.45, 0.65, -0.925],
      ],
      true,
      false,
    );
  }
  for (const [z, y, w] of [
    [-0.93, 0.25, 0.9],
    [-0.87, 0.61, 0.9],
    [-0.63, 0.8, 0.9],
    [0.6, 0.87, 0.9],
    [1.18, 1.39, 0.7],
    [2.11, 1.43, 0.69],
    [2.9, 0.88, 0.9],
    [3.4, 0.78, 0.9],
    [rear, 0.58, 0.9],
    [rear, 0.23, 0.9],
  ])
    path(
      [
        [-w, y, z],
        [0, y + 0.02, z - 0.015],
        [w, y, z],
      ],
      z === -0.63 || z === 2.9,
    );
  path(
    [
      [-0.36, 0.52, -0.944],
      [0.36, 0.52, -0.944],
      [0.34, 0.33, -0.949],
      [-0.34, 0.33, -0.949],
      [-0.36, 0.52, -0.944],
    ],
    true,
    false,
  );
  for (const x of [-0.61, 0.61])
    path(
      [
        [x, 0.635, -0.86],
        [x, 0.83, -0.55],
        [x, 0.89, 0.57],
      ],
      true,
    );
  path(
    [
      [-0.68, 0.22, 0.7],
      [-0.68, 0.85, 0.7],
      [0.68, 0.85, 0.7],
      [0.68, 0.22, 0.7],
    ],
    true,
    false,
  );
  for (const [segments, material] of [
    [body, outline],
    [details, detail],
  ] as const) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(segments, 3),
    );
    group.add(new THREE.LineSegments(geometry, material));
  }
  const template = createRoadWheel();
  const solidMaterials = [
    ...template.materials,
    ...chassis.materials,
    ...bodywork.materials,
    ...bay.materials,
  ];
  solidMaterials.forEach((m) => {
    m.userData.vehicleOpacity = m.opacity;
    m.userData.vehicleTransparent = m.transparent;
  });
  const wheels: { spin: THREE.Object3D; side: number }[] = [];
  for (const side of [-1, 1])
    for (const z of [0, D.wheelbase]) {
      const wheel = template.group.clone(true);
      wheel.name = `road-wheel-${side}-${z}`;
      wheel.position.set((side * D.track) / 2, TIRE_RADIUS, z);
      wheel.rotation.y = (side * Math.PI) / 2;
      group.add(wheel);
      wheels.push({ spin: wheel.getObjectByName('wheel-rotor')!, side });
    }
  const contactMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { opacity: { value: 0.3 } },
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'varying vec2 vUv;uniform float opacity;void main(){float r=length((vUv-.5)*2.);gl_FragColor=vec4(0.,0.,0.,opacity*(1.-smoothstep(.1,1.,r)));}',
  });
  const contactGeometry = new THREE.PlaneGeometry(0.38, 0.65);
  contactGeometry.rotateX(-Math.PI / 2);
  for (const side of [-1, 1])
    for (const z of [0, D.wheelbase]) {
      const contact = new THREE.Mesh(contactGeometry, contactMaterial);
      contact.position.set((side * D.track) / 2, 0.003, z);
      group.add(contact);
    }
  return {
    group,
    setView(next: 'bay' | 'chassis' | 'body', hoodOpen: boolean) {
      view = next;
      hoodTarget = next === 'bay' || hoodOpen ? 1 : 0;
      bodywork.group.visible = view !== 'chassis';
    },
    update(dt: number) {
      hoodAmount = THREE.MathUtils.damp(hoodAmount, hoodTarget, 5, dt);
      bodywork.setHood(hoodAmount);
      return Math.abs(hoodAmount - hoodTarget) > 0.002;
    },
    dispose() {
      template.textures.forEach((texture) => texture.dispose());
    },
    setOpacity(amount: number) {
      outline.opacity = (view === 'chassis' ? 0.23 : 0) * amount;
      detail.opacity = (view === 'chassis' ? 0.09 : 0) * amount;
      contactMaterial.uniforms.opacity.value = 0.3 * amount;
      for (const material of solidMaterials) {
        const transparent =
          amount < 0.995 || material.userData.vehicleTransparent;
        if (material.transparent !== transparent) {
          material.transparent = transparent;
          material.needsUpdate = true;
        }
        material.opacity =
          material.userData.vehicleOpacity * (amount < 0.995 ? amount : 1);
        material.depthWrite = !transparent;
      }
      group.visible = amount > 0.005;
    },
    setWheelAngle(angle: number) {
      wheels.forEach(({ spin, side }) => (spin.rotation.z = angle * side));
      chassis.setWheelAngle(angle);
    },
  };
}
