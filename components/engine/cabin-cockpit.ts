import * as THREE from 'three';
import type { ModelKit, P3 } from './vehicle-model';
import type { CabinMaterials } from './cabin-materials';
import { bodyOutline, bodyPatch } from './body-surface';
import { mouldedPanel } from './cabin-geometry';

export function createCabinCockpit(
  k: ModelKit,
  root: THREE.Group,
  m: CabinMaterials,
) {
  const { mesh, box, surface, tube, bar, steel } = k;
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
      system: 'cabin',
      offset,
      stage,
      description,
      material: 'Moulded polymer, textile, glass and metal',
    });
  const dash = part(
    'dashboard',
    'Dashboard assembly',
    [0, 0.82, -0.55],
    3,
    'The upper dashboard has a sculpted instrument hood, sweeping two-tone passenger fascia and separate vents. Removing it exposes the reinforcement beam and ventilation units.',
  );
  const shell = (u: number, v: number): P3 => {
    const x = (u * 2 - 1) * 0.697,
      edge = Math.abs(u * 2 - 1);
    const z = 0.666 + v * 0.353 - 0.075 * edge ** 5;
    const roll = 0.088 * THREE.MathUtils.smoothstep(v, 0.58, 1);
    return [
      x,
      0.87 + 0.012 * Math.sin(v * Math.PI) - roll - 0.029 * edge ** 4,
      z,
    ];
  };
  surface(dash, shell, m.dark, 96, 48);
  // Rolled leading edge closes the small gap between the padded top and fascia.
  surface(
    dash,
    (u, v) => {
      const p = shell(u, 1);
      return [
        p[0],
        THREE.MathUtils.lerp(p[1], 0.774, v),
        p[2] + 0.002 * Math.sin(v * Math.PI),
      ];
    },
    m.dark,
    96,
    8,
  );
  surface(
    dash,
    (u, v) => {
      const x = (u * 2 - 1) * 0.694;
      return [
        x,
        0.774 - v * 0.11,
        1.018 -
          0.075 * Math.abs(u * 2 - 1) ** 5 -
          0.018 * Math.sin(v * Math.PI),
      ];
    },
    m.pale,
    96,
    28,
  );
  for (const side of [-1, 1])
    surface(
      dash,
      (u, v) => {
        const p = shell(side < 0 ? 0 : 1, u);
        return [p[0], THREE.MathUtils.lerp(p[1], 0.665, v), p[2]];
      },
      m.dark,
      36,
      18,
    );
  // The driver knee bolster wraps under the steering column into the footwell.
  // Without this return the dash appears to be an unsupported sheet.
  surface(
    dash,
    (u, v) => {
      const x = -0.691 + u * 0.542;
      return [
        x,
        0.665 - v * 0.158,
        1.007 - 0.055 * Math.abs(x / 0.697) ** 5 - 0.097 * v ** 2,
      ];
    },
    m.pale,
    48,
    28,
  );
  surface(
    dash,
    (u, v) => [-0.691 + u * 0.542, 0.507 + v * 0.012, 0.91 - v * 0.145],
    m.dark,
    40,
    12,
  );
  // Curved binnacle, opening toward the driver.
  surface(
    dash,
    (u, v) => {
      const x = -0.379 + (u * 2 - 1) * 0.19;
      const crown = Math.sqrt(Math.max(0, 1 - (u * 2 - 1) ** 6));
      return [
        x,
        0.853 + crown * (0.089 + 0.004 * Math.sin(v * Math.PI)),
        0.777 + v * 0.224,
      ];
    },
    m.dark,
    64,
    30,
  );
  for (const side of [-1, 1])
    surface(
      dash,
      (u, v) => [-0.379 + side * 0.19, 0.838 + v * 0.016, 0.78 + u * 0.217],
      m.dark,
      24,
      4,
    );
  const cluster = part(
    'instrument-cluster',
    'Instrument cluster',
    [-0.35, 0.94, -0.28],
    2,
    'The LE-style cluster combines analogue gauges with a central information display under a shaded instrument hood.',
  );
  // The curved instrument hood meets a recessed bezel around the cluster;
  // this closes the exposed edge without covering the gauge opening.
  const surround = new THREE.Shape();
  surround.moveTo(-0.569, 0.799);
  surround.lineTo(-0.569, 0.853);
  surround.bezierCurveTo(-0.557, 0.93, -0.481, 0.943, -0.379, 0.943);
  surround.bezierCurveTo(-0.277, 0.943, -0.201, 0.93, -0.189, 0.853);
  surround.lineTo(-0.189, 0.799);
  surround.closePath();
  const aperture = new THREE.Path();
  aperture.moveTo(-0.548, 0.813);
  aperture.lineTo(-0.21, 0.813);
  aperture.lineTo(-0.211, 0.872);
  aperture.bezierCurveTo(-0.236, 0.917, -0.301, 0.925, -0.379, 0.925);
  aperture.bezierCurveTo(-0.457, 0.925, -0.522, 0.917, -0.547, 0.872);
  aperture.closePath();
  surround.holes.push(aperture);
  mouldedPanel(
    k,
    dash,
    surround,
    m.dark,
    (x, y) => [x, y, 1.002],
    [0, 0, -0.014],
    2,
  );
  const face = box(
    cluster,
    [0.329, 0.115, 0.022],
    [-0.379, 0.86, 0.973],
    m.gloss,
    0.03,
  );
  face.rotation.x = -0.16;
  for (const [x, r] of [
    [-0.468, 0.044],
    [-0.28, 0.044],
  ]) {
    const ring = mesh(
      cluster,
      new THREE.TorusGeometry(r, 0.0018, 8, 64),
      m.silver,
      [x, 0.861, 0.989],
    );
    ring.rotation.x = -0.16;
    for (let i = 0; i < 25; i++) {
      const a = THREE.MathUtils.lerp(-Math.PI * 0.22, Math.PI * 1.22, i / 24);
      const tick = box(
        cluster,
        [0.0012, i % 2 ? 0.004 : 0.007, 0.001],
        [x + Math.cos(a) * r * 0.84, 0.861 + Math.sin(a) * r * 0.84, 0.991],
        m.pale,
        0.0002,
      );
      tick.rotation.z = a - Math.PI / 2;
    }
    const needle = box(
      cluster,
      [0.03, 0.0014, 0.001],
      [x - 0.012, 0.843, 0.993],
      m.red,
      0.0002,
    );
    needle.rotation.z = 0.58;
  }
  box(cluster, [0.06, 0.07, 0.001], [-0.375, 0.857, 0.991], m.screen, 0.003);
  const screen = part(
    'infotainment',
    'Centre display',
    [0, 1.25, -0.35],
    2,
    'The eight-inch-style freestanding display rises above the centre vents. Its tapered rear housing, bezel and physical controls follow the reference cabin.',
  );
  const mount = new THREE.Group();
  mount.position.set(0, 0.937, 0.993);
  mount.rotation.x = -0.105;
  screen.add(mount);
  box(mount, [0.224, 0.149, 0.031], [0, 0, 0], m.dark, 0.014);
  box(mount, [0.219, 0.143, 0.005], [0, 0, 0.018], m.gloss, 0.011);
  box(mount, [0.192, 0.109, 0.001], [0, 0.006, 0.0215], m.screen, 0.006);
  for (const x of [-0.094, 0.094]) {
    const knob = mesh(
      mount,
      new THREE.CylinderGeometry(0.0073, 0.0078, 0.006, 24),
      m.dark,
      [x, -0.054, 0.026],
    );
    knob.rotation.x = Math.PI / 2;
  }
  // Use small original interface textures, not a screenshot of another product.
  function displayTexture(
    w: number,
    h: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ) {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    draw(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    m.textures.push(texture);
    return texture;
  }
  const ui = displayTexture(768, 432, (c) => {
    c.fillStyle = '#101b24';
    c.fillRect(0, 0, 768, 432);
    c.fillStyle = '#cad8df';
    c.font = '24px Arial';
    c.fillText('Home', 32, 43);
    c.fillText('9:41', 671, 43);
    c.fillStyle = '#1e303d';
    c.fillRect(26, 78, 430, 306);
    c.strokeStyle = '#324b59';
    c.lineWidth = 7;
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(40, 90 + i * 54);
      c.lineTo(436, 138 + i * 37);
      c.stroke();
    }
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(55 + i * 89, 85);
      c.lineTo(26 + i * 90, 375);
      c.stroke();
    }
    c.strokeStyle = '#80b5bb';
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(235, 342);
    c.lineTo(249, 240);
    c.lineTo(384, 263);
    c.stroke();
    c.fillStyle = '#def0ed';
    c.beginPath();
    c.moveTo(244, 211);
    c.lineTo(232, 245);
    c.lineTo(258, 245);
    c.fill();
    c.fillStyle = '#c8d6dc';
    c.font = '22px Arial';
    c.fillText('Audio', 490, 115);
    c.font = '17px Arial';
    c.fillStyle = '#8dabb8';
    c.fillText('Select a source', 490, 146);
    c.fillText('Phone', 490, 241);
    c.fillText('Connect device', 490, 270);
  });
  if (ui) {
    const material = new THREE.MeshBasicMaterial({
      map: ui,
      toneMapped: false,
    });
    k.materials.push(material as unknown as THREE.MeshStandardMaterial);
    mesh(
      mount,
      new THREE.PlaneGeometry(0.191, 0.108),
      material,
      [0, 0.006, 0.022],
    );
  }
  const info = displayTexture(256, 320, (c) => {
    c.fillStyle = '#071018';
    c.fillRect(0, 0, 256, 320);
    c.fillStyle = '#c7e0df';
    c.font = '70px Arial';
    c.textAlign = 'center';
    c.fillText('0', 128, 126);
    c.font = '22px Arial';
    c.fillText('MPH', 128, 159);
    c.fillText('P', 128, 229);
    c.fillStyle = '#7baca9';
    c.fillRect(47, 272, 162, 3);
  });
  if (info) {
    const material = new THREE.MeshBasicMaterial({
      map: info,
      toneMapped: false,
    });
    k.materials.push(material as unknown as THREE.MeshStandardMaterial);
    mesh(
      cluster,
      new THREE.PlaneGeometry(0.057, 0.069),
      material,
      [-0.375, 0.857, 0.993],
    );
  }
  function vent(
    id: string,
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    z: number,
    side = 0,
  ) {
    const g = part(
      id,
      name,
      [x * 0.4, 0.9, -0.3],
      2,
      'Horizontal direction vanes and an adjustable shutoff sit inside the shaped vent bezel. A dedicated duct connects the outlet to the HVAC distributor.',
    );
    const s = bodyOutline([
      [-w * 0.5, -h * 0.32],
      [-w * 0.39, -h * 0.5],
      [w * 0.43, -h * 0.5],
      [w * 0.5, -h * 0.22],
      [w * 0.44, h * 0.4],
      [-w * 0.37, h * 0.5],
      [-w * 0.5, h * 0.26],
    ]);
    mouldedPanel(
      k,
      g,
      s,
      m.silver,
      (a, b) => [x + a, y + b, z + side * a * 0.22],
      [0, 0, -0.026],
      1,
    );
    bodyPatch(
      k,
      g,
      s,
      m.dark,
      (a, b) => [x + a * 0.9, y + b * 0.81, z + 0.002 + side * a * 0.22],
      1,
    );
    for (let j = -2; j <= 2; j++)
      box(
        g,
        [w * 0.8, 0.0035, 0.013],
        [x, y + j * h * 0.126, z + 0.009],
        m.soft,
        0.001,
      );
    box(
      g,
      [0.021, 0.008, 0.016],
      [x + (side ? -0.012 : 0), y, z + 0.016],
      m.silver,
      0.002,
    );
    return g;
  }
  vent(
    'left-dash-vent',
    'Left dashboard air vent',
    -0.614,
    0.8,
    0.128,
    0.068,
    0.991,
    -1,
  );
  vent(
    'right-dash-vent',
    'Right dashboard air vent',
    0.614,
    0.8,
    0.128,
    0.068,
    0.991,
    1,
  );
  vent(
    'centre-dash-vents',
    'Centre dashboard air vents',
    0,
    0.81,
    0.25,
    0.045,
    1.023,
  );
  const controls = part(
    'climate-controls',
    'Climate control panel',
    [0, 0.7, 0.06],
    3,
    'Two rotary controls flank the temperature display. The slim climate panel sits below the centre air outlets, above the storage shelf.',
  );
  box(controls, [0.266, 0.056, 0.043], [0, 0.728, 1.009], m.gloss, 0.019);
  for (const x of [-0.097, 0.097]) {
    const knob = mesh(
      controls,
      new THREE.CylinderGeometry(0.019, 0.019, 0.013, 40),
      m.dark,
      [x, 0.732, 1.036],
    );
    knob.rotation.x = Math.PI / 2;
    mesh(controls, new THREE.TorusGeometry(0.0179, 0.0014, 8, 40), m.silver, [
      x,
      0.732,
      1.044,
    ]);
    for (let j = 0; j < 20; j++) {
      const a = (j / 20) * Math.PI * 2;
      box(
        controls,
        [0.0011, 0.002, 0.003],
        [x + Math.cos(a) * 0.0184, 0.732 + Math.sin(a) * 0.0184, 1.045],
        m.silver,
        0.0002,
      );
    }
  }
  box(controls, [0.076, 0.02, 0.002], [0, 0.737, 1.035], m.screen, 0.004);
  for (let i = 0; i < 7; i++)
    box(
      controls,
      [0.019, 0.009, 0.003],
      [-0.063 + i * 0.021, 0.717, 1.034],
      m.soft,
      0.002,
    );
  const glove = part(
    'glovebox',
    'Glove compartment',
    [0.35, 0.55, 0.13],
    3,
    'The broad curved glovebox door follows the passenger-side lower fascia. The cabin filter and blower housing sit behind it.',
  );
  const gloveShape = bodyOutline([
    [0.16, 0.756],
    [0.58, 0.748],
    [0.657, 0.712],
    [0.612, 0.59],
    [0.2, 0.596],
  ]);
  mouldedPanel(
    k,
    glove,
    gloveShape,
    m.pale,
    (x, y) => [
      x,
      y,
      0.988 + 0.022 * Math.sin((x - 0.16) * 6) + (y - 0.68) * 0.1,
    ],
    [0, 0, -0.027],
    3,
  );
  // Open-topped glove compartment bin remains attached to the detachable door.
  box(glove, [0.415, 0.014, 0.153], [0.411, 0.605, 0.899], m.dark, 0.007);
  for (const x of [0.211, 0.611])
    box(glove, [0.012, 0.125, 0.153], [x, 0.661, 0.899], m.dark, 0.007);
  box(glove, [0.415, 0.124, 0.012], [0.411, 0.661, 0.828], m.dark, 0.007);
  box(glove, [0.066, 0.018, 0.009], [0.397, 0.731, 1.018], m.dark, 0.006);
  const console = part(
    'console',
    'Centre console and shifter',
    [0, 0.78, 0.3],
    3,
    'The tapered console carries a leather-booted CVT selector, two recessed cup holders, electric parking-brake switches and a separate padded armrest.',
  );
  const consoleTop = (x: number, z: number): P3 => [
    x,
    0.436 +
      0.099 * Math.exp(-Math.pow((z - 1.03) / 0.2, 2)) -
      0.008 * (z - 1.2),
    z,
  ];
  const outline = bodyOutline([
    [-0.143, 0.98],
    [0.143, 0.98],
    [0.112, 1.47],
    [0.115, 1.69],
    [-0.115, 1.69],
    [-0.112, 1.47],
  ]);
  const gearHole = new THREE.Path();
  gearHole.absellipse(0, 1.135, 0.058, 0.09, 0, Math.PI * 2, true, 0);
  outline.holes.push(gearHole);
  for (const z of [1.385, 1.491]) {
    const hole = new THREE.Path();
    hole.absellipse(0, z, 0.041, 0.047, 0, Math.PI * 2, true, 0);
    outline.holes.push(hole);
  }
  mouldedPanel(k, console, outline, m.gloss, consoleTop, [0, -0.008, 0], 3);
  for (const side of [-1, 1])
    surface(
      console,
      (u, v) => {
        const z = 0.98 + u * 0.71,
          x = side * (0.114 + 0.029 * Math.exp(-Math.pow((z - 0.98) / 0.2, 2)));
        const p = consoleTop(x, z);
        return [x, v * p[1] + (1 - v) * 0.303, z];
      },
      m.dark,
      50,
      20,
    );
  for (const z of [1.385, 1.491]) {
    const h = consoleTop(0, z)[1];
    mesh(
      console,
      new THREE.CylinderGeometry(0.041, 0.036, 0.076, 48, 1, true),
      m.dark,
      [0, h - 0.038, z],
    );
    mesh(console, new THREE.CylinderGeometry(0.036, 0.036, 0.002, 48), m.dark, [
      0,
      h - 0.076,
      z,
    ]);
    const ring = mesh(
      console,
      new THREE.TorusGeometry(0.042, 0.002, 8, 48),
      m.soft,
      [0, h + 0.001, z],
    );
    ring.rotation.x = Math.PI / 2;
  }
  for (const side of [-1, 1])
    tube(
      console,
      [
        [side * 0.133, 0.514, 0.997],
        [side * 0.12, 0.472, 1.151],
        [side * 0.103, 0.442, 1.275],
      ],
      0.003,
      m.silver,
    );
  const bootY = 0.498;
  surface(
    console,
    (u, v) => {
      const a = u * Math.PI * 2,
        r = THREE.MathUtils.lerp(0.057, 0.018, v);
      return [
        Math.cos(a) * r * (1 + 0.06 * Math.sin(v * 24)),
        bootY + v * 0.068 + 0.003 * Math.sin(a * 8) * (1 - v),
        1.125 + Math.sin(a) * r * 1.34,
      ];
    },
    m.dark,
    64,
    22,
  );
  bar(console, [0, 0.558, 1.125], [0, 0.616, 1.125], 0.012, m.silver);
  const knob = box(
    console,
    [0.044, 0.056, 0.054],
    [0, 0.619, 1.124],
    m.dark,
    0.018,
  );
  knob.rotation.x = -0.21;
  box(console, [0.025, 0.009, 0.027], [0, 0.645, 1.119], m.silver, 0.006);
  for (let i = 0; i < 4; i++)
    box(
      console,
      [0.013, 0.0015, 0.008],
      [-0.077, 0.49 - i * 0.007, 1.078 + i * 0.028],
      m.pale,
      0.001,
    );
  for (const x of [-0.054, 0.045])
    box(console, [0.029, 0.009, 0.026], [x, 0.439, 1.299], m.dark, 0.006);
  const arm = part(
    'console-armrest',
    'Centre armrest and storage lid',
    [0, 0.95, 0.47],
    2,
    'A padded cloth armrest forms the lid of the central storage bin behind the cup holders.',
  );
  box(arm, [0.207, 0.063, 0.222], [0, 0.512, 1.646], m.cloth, 0.025);
  tube(
    arm,
    [
      [-0.086, 0.543, 1.557],
      [-0.091, 0.544, 1.714],
      [0, 0.544, 1.737],
      [0.091, 0.544, 1.714],
      [0.086, 0.543, 1.557],
    ],
    0.0009,
    m.stitch,
  );
  const column = part(
    'steering-column',
    'Steering column',
    [-0.34, 0.45, -0.3],
    4,
    'The adjustable column, universal joints and electric assistance connect the steering wheel to the rack through the firewall.',
  );
  bar(column, [-0.374, 0.83, 1.12], [-0.374, 0.488, 0.7], 0.021, steel);
  box(column, [0.116, 0.085, 0.165], [-0.374, 0.815, 1.036], m.dark, 0.027);
  for (const z of [0.785, 0.882])
    mesh(column, new THREE.SphereGeometry(0.027, 16, 12), steel, [
      -0.374,
      0.56 + (z - 0.785) * 1.1,
      z,
    ]);
  for (const side of [-1, 1]) {
    bar(
      column,
      [-0.374 + side * 0.039, 0.845, 1.052],
      [-0.374 + side * 0.151, 0.862, 1.07],
      0.008,
      m.dark,
    );
    box(
      column,
      [0.05, 0.025, 0.031],
      [-0.374 + side * 0.161, 0.863, 1.071],
      m.dark,
      0.011,
    );
  }
  const steering = part(
    'steering-wheel',
    'Steering wheel',
    [-0.32, 0.95, -0.1],
    2,
    'The three-spoke wheel has contoured thumb grips, integrated controls, a satin lower spoke and a separately removable driver-airbag module.',
  );
  const wheel = new THREE.Group();
  wheel.position.set(-0.374, 0.843, 1.142);
  wheel.rotation.x = -0.4;
  steering.add(wheel);
  surface(
    wheel,
    (u, v) => {
      const a = u * Math.PI * 2,
        b = v * Math.PI * 2;
      const r = 0.169 + 0.001 * Math.cos(a * 2);
      const grip =
        0.0153 +
        0.004 * Math.exp(-Math.pow((Math.abs(Math.sin(a)) - 0.42) / 0.18, 2));
      return [
        Math.cos(a) * (r + Math.cos(b) * grip),
        Math.sin(a) * (r + Math.cos(b) * grip),
        Math.sin(b) * grip,
      ];
    },
    m.dark,
    128,
    20,
  );
  for (const side of [-1, 1]) {
    const shape = bodyOutline([
      [side * 0.047, 0.031],
      [side * 0.147, 0.06],
      [side * 0.143, 0.002],
      [side * 0.062, -0.048],
    ]);
    mouldedPanel(
      k,
      wheel,
      shape,
      m.dark,
      (x, y) => [x, y, 0.001],
      [0, 0, -0.018],
      1,
    );
    const switches = k.part(wheel, {
      id: `car-${side < 0 ? 'left' : 'right'}-steering-switches`,
      name: `${side < 0 ? 'Left' : 'Right'} steering-wheel switch pack`,
      system: 'cabin',
      offset: [side * 0.06, 0.015, 0.115],
      stage: 1,
      material: 'Moulded polymer and electrical switches',
      description:
        side < 0
          ? 'The left switch pack contains the multi-information display, audio and phone controls. It can be removed separately from the wheel and central airbag module.'
          : 'The right switch pack groups the cruise-control and driving-assistance controls. Its housing and buttons separate from the steering-wheel spoke.',
    });
    const switchShape = new THREE.Shape();
    switchShape.moveTo(side * 0.073, 0.047);
    switchShape.quadraticCurveTo(side * 0.135, 0.071, side * 0.139, 0.044);
    switchShape.lineTo(side * 0.133, 0.001);
    switchShape.lineTo(side * 0.077, -0.029);
    switchShape.quadraticCurveTo(side * 0.065, -0.02, side * 0.068, 0.011);
    switchShape.closePath();
    mouldedPanel(
      k,
      switches,
      switchShape,
      m.soft,
      (x, y) => [x, y, 0.009],
      [0, 0, -0.008],
      1,
    );
    for (let j = 0; j < 3; j++)
      box(
        switches,
        [0.019, 0.008, 0.004],
        [side * (0.078 + j * 0.012), 0.007 - j * 0.012, 0.014],
        m.dark,
        0.003,
      );
    mesh(switches, new THREE.TorusGeometry(0.012, 0.002, 8, 32), m.dark, [
      side * 0.108,
      0.029,
      0.016,
    ]);
    mesh(switches, new THREE.CircleGeometry(0.008, 32), m.dark, [
      side * 0.108,
      0.029,
      0.017,
    ]);
  }
  const lower = bodyOutline([
    [-0.057, -0.022],
    [0.057, -0.022],
    [0.024, -0.151],
    [-0.024, -0.151],
  ]);
  mouldedPanel(
    k,
    wheel,
    lower,
    m.silver,
    (x, y) => [x, y, 0.002],
    [0, 0, -0.014],
    1,
  );
  const lowerInset = bodyOutline([
    [-0.045, -0.034],
    [0.045, -0.034],
    [0.014, -0.14],
    [-0.014, -0.14],
  ]);
  bodyPatch(k, wheel, lowerInset, m.dark, (x, y) => [x, y, 0.004], 1);
  const airbag = k.part(wheel, {
    id: 'car-driver-airbag',
    name: 'Driver airbag module',
    system: 'cabin',
    offset: [0, 0, 0.24],
    stage: 1,
    material: 'Padded polymer cover, steel and folded fabric',
    description:
      'The padded central module contains the folded airbag and inflator. It detaches from the wheel hub as one service assembly; deployment is not simulated.',
  });
  const pad = new THREE.Shape();
  pad.moveTo(-0.065, 0.058);
  pad.quadraticCurveTo(-0.09, 0.053, -0.087, 0.021);
  pad.quadraticCurveTo(-0.086, -0.008, -0.076, -0.028);
  pad.quadraticCurveTo(-0.05, -0.066, -0.026, -0.079);
  pad.quadraticCurveTo(0, -0.091, 0.026, -0.079);
  pad.quadraticCurveTo(0.05, -0.066, 0.076, -0.028);
  pad.quadraticCurveTo(0.086, -0.008, 0.087, 0.021);
  pad.quadraticCurveTo(0.09, 0.053, 0.065, 0.058);
  pad.quadraticCurveTo(0, 0.065, -0.065, 0.058);
  pad.closePath();
  mouldedPanel(
    k,
    airbag,
    pad,
    m.soft,
    (x, y) => [
      x,
      y,
      0.018 + 0.014 * (1 - (x / 0.1) ** 2) * (1 - (y / 0.1) ** 2),
    ],
    [0, 0, -0.033],
    2,
  );
  for (const [rx, ry, y] of [
    [0.02, 0.013, 0],
    [0.009, 0.012, 0],
    [0.017, 0.005, 0.006],
  ]) {
    const emblem = mesh(
      airbag,
      new THREE.TorusGeometry(1, 0.048, 8, 64),
      m.silver,
      [0, y + 0.014, 0.035],
    );
    emblem.scale.set(rx, ry, 0.011);
  }
  const pedals = part(
    'pedals',
    'Accelerator and brake pedals',
    [-0.5, 0.1, -0.45],
    4,
    'A wide brake pedal operates the assisted hydraulic circuit. The narrow electronic accelerator pedal sends a torque request to the engine controller.',
  );
  for (const [x, w] of [
    [-0.43, 0.082],
    [-0.29, 0.039],
  ]) {
    bar(pedals, [x, 0.54, 0.81], [x, 0.334, 1.019], 0.009, steel);
    const p = box(pedals, [w, 0.086, 0.019], [x, 0.332, 1.024], m.dark, 0.006);
    p.rotation.x = -0.2;
    for (let j = 0; j < 6; j++)
      box(
        pedals,
        [w * 0.81, 0.002, 0.002],
        [x, 0.302 + j * 0.012, 1.036 - j * 0.0024],
        m.soft,
        0.0005,
      );
  }
}
