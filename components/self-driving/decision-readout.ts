import {
  decisionLayout,
  decisionReadout,
  observationCell,
} from '@/lib/self-driving/decision';
import {
  laneAt,
  type Frame,
  type Settings,
} from '@/lib/self-driving/simulation';
import { roadWheelAngle } from '@/lib/self-driving/steering';
import { routeAppearance, routeSamples } from '@/lib/self-driving/route';

type Rect = { x: number; y: number; w: number; h: number };
const COLORS = {
  observed: '#71dceb',
  prediction: '#e9b563',
  path: '#d5ef78',
  act: '#f08c81',
  text: '#edf1e9',
  muted: '#a2b6bd',
};

// One composition for the live lab and exported tour; all readouts sample the
// same road frame. These are technical annotations, never narration captions.
export function drawDecisionReadout(
  ctx: CanvasRenderingContext2D,
  f: Frame,
  settings: Settings,
  width: number,
  height: number,
) {
  const layout = decisionLayout(width, height),
    p = layout.panel;
  const u = Math.max(1, Math.min(2, width / 960)),
    pad = 16 * u;
  const text = (
    value: string,
    x: number,
    y: number,
    color = COLORS.text,
    size = 14 * u,
    weight = '500',
    max?: number,
  ) => {
    ctx.fillStyle = color;
    ctx.font = weight + ' ' + size + 'px Arial';
    if (max) ctx.fillText(value, x, y, max);
    else ctx.fillText(value, x, y);
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, p.w, p.h);
  ctx.clip();
  ctx.fillStyle = '#0d1c25';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = '#36535c';
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  text(
    'THE CAR’S INTERPRETATION',
    p.x + pad,
    p.y + 28 * u,
    COLORS.observed,
    13 * u,
    '700',
    p.w - pad * 2,
  );
  text(
    'Same moment · illustrative model',
    p.x + pad,
    p.y + 48 * u,
    COLORS.muted,
    12 * u,
    '400',
    p.w - pad * 2,
  );
  const map: Rect = layout.stacked
    ? {
        x: p.x + pad,
        y: p.y + 62 * u,
        w: p.w * 0.54 - pad * 1.5,
        h: p.h - 98 * u,
      }
    : {
        x: p.x + pad,
        y: p.y + 68 * u,
        w: p.w - pad * 2,
        h: Math.max(120, p.h * 0.51 - 45 * u),
      };
  const info: Rect = layout.stacked
    ? {
        x: p.x + p.w * 0.54 + pad * 0.4,
        y: p.y + 65 * u,
        w: p.w * 0.46 - pad * 1.4,
        h: p.h - 84 * u,
      }
    : {
        x: p.x + pad,
        y: map.y + map.h + 34 * u,
        w: p.w - pad * 2,
        h: p.h - (map.y - p.y + map.h) - 60 * u,
      };
  const data = decisionReadout(f, settings);
  drawMap(ctx, map, f, settings, u);
  const legendY = map.y + map.h + 19 * u;
  for (const [i, label, color] of [
    [0, 'Visible', COLORS.observed],
    [1, 'Unknown', '#77818b'],
    [2, 'Future', COLORS.prediction],
  ] as const) {
    const x = map.x + (i * map.w) / 3;
    ctx.fillStyle = color;
    ctx.fillRect(x, legendY - 7 * u, 5 * u, 5 * u);
    text(
      label,
      x + 9 * u,
      legendY,
      COLORS.muted,
      11 * u,
      '400',
      map.w / 3 - 10 * u,
    );
  }
  const gap = Math.min(69 * u, info.h * 0.27);
  const row = (index: number, label: string, value: string, color: string) => {
    const y = info.y + index * gap;
    text(label, info.x, y + 12 * u, color, 12 * u, '700', info.w);
    text(value, info.x, y + 34 * u, COLORS.text, 14 * u, '500', info.w);
  };
  row(0, '01  OBSERVE', data.observation, COLORS.observed);
  row(1, '02  PLAN', data.plan, COLORS.path);
  row(2, '03  ACT', data.action, COLORS.act);
  const y = info.y + gap * 2 + 58 * u;
  text(
    data.speed.toFixed(1) + ' / ' + data.targetSpeed.toFixed(1) + ' km/h',
    info.x,
    y,
    COLORS.text,
    15 * u,
    '600',
    info.w,
  );
  text(
    'Measured / requested speed',
    info.x,
    y + 18 * u,
    COLORS.muted,
    11 * u,
    '400',
    info.w,
  );
  if (y + 43 * u < p.y + p.h - 5)
    text(
      'Steering ' +
        data.angle.toFixed(1) +
        '°   ·   a ' +
        f.acceleration.toFixed(1) +
        ' m/s²',
      info.x,
      y + 41 * u,
      COLORS.act,
      12 * u,
      '500',
      info.w,
    );
  ctx.restore();
}

function drawMap(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  f: Frame,
  s: Settings,
  u: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.fillStyle = '#112b34';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const sx = r.w / 16,
    sy = r.h / 33;
  const point = (x: number, z: number): [number, number] => [
    r.x + r.w / 2 + z * sx,
    r.y + r.h - (x - f.x + 5) * sy,
  ];
  for (let i = 0; i < 33; i++)
    for (let j = 0; j < 16; j++) {
      const x = f.x - 5 + i,
        z = j - 8,
        q = point(x, z);
      const state = observationCell(f, s, x + 0.5, z + 0.5);
      ctx.fillStyle =
        state === 'visible'
          ? '#1a414a'
          : state === 'occluded'
            ? '#49515b'
            : '#25343d';
      ctx.fillRect(q[0] + 0.5, q[1] - sy + 0.5, sx - 1, sy - 1);
    }
  const stroke = (
    coords: [number, number][],
    color: string,
    lineWidth = 1.5 * u,
    dashed = false,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed ? [5 * u, 4 * u] : []);
    ctx.beginPath();
    coords.forEach(([x, z], i) => {
      const q = point(x, z);
      if (i) ctx.lineTo(...q);
      else ctx.moveTo(...q);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  };
  for (const z of [-4.15, 0, 4.15])
    stroke(
      [
        [f.x - 5, z],
        [f.x + 28, z],
      ],
      '#78949c',
      u,
      z === 0,
    );
  const rectangle = (
    x: number,
    z: number,
    length: number,
    breadth: number,
    fill: string,
  ) => {
    const q = point(x + length / 2, z - breadth / 2);
    ctx.fillStyle = fill;
    ctx.fillRect(q[0], q[1], breadth * sx, length * sy);
  };
  if (s.scenario === 'crossing') {
    rectangle(1, -3.4, 3.6, 2.1, '#8899a6');
    const q = point(1, -3.4);
    ctx.fillStyle = '#14212c';
    ctx.fillRect(q[0] - sx * 0.8, q[1] - sy, sx * 1.6, sy * 0.3);
    for (let z = -3.8; z < 4.3; z += 0.8) rectangle(5, z, 2, 0.35, '#56727b');
  }
  if (s.scenario === 'signal') {
    stroke(
      [
        [2.05, 0.2],
        [2.05, 4],
      ],
      '#a5b4b6',
      2 * u,
    );
    const q = point(7, -4.4);
    ctx.fillStyle = f.signal === 'red' ? '#ff7568' : '#9ceca7';
    ctx.beginPath();
    ctx.arc(q[0], q[1], 5 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  if (s.scenario === 'roadworks') {
    for (let x = 0; x < 9; x += 1.5) {
      const q = point(x, 1.7);
      ctx.fillStyle = COLORS.prediction;
      ctx.beginPath();
      ctx.moveTo(q[0], q[1] - 4 * u);
      ctx.lineTo(q[0] + 3.5 * u, q[1] + 3 * u);
      ctx.lineTo(q[0] - 3.5 * u, q[1] + 3 * u);
      ctx.closePath();
      ctx.fill();
    }
  }
  const boundary = s.scenario === 'signal' ? 2.05 : 3.4;
  const samples = routeSamples(f, s),
    routeColor = routeAppearance(f, s).color;
  if (samples.length) {
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const edge = side === -1 ? samples : [...samples].reverse();
      edge.forEach((p, i) => {
        const q = point(
          Math.min(samples[samples.length - 1].x, p.x + p.nx * 1.12 * side),
          p.z + p.nz * 1.12 * side,
        );
        if (side === -1 && i === 0) ctx.moveTo(...q);
        else ctx.lineTo(...q);
      });
    }
    ctx.closePath();
    const first = point(samples[0].x, samples[0].z);
    const last = point(
      samples[samples.length - 1].x,
      samples[samples.length - 1].z,
    );
    const fade = ctx.createLinearGradient(...first, ...last);
    fade.addColorStop(0, routeColor + '70');
    fade.addColorStop(0.68, routeColor + '70');
    fade.addColorStop(1, routeColor + '00');
    ctx.fillStyle = fade;
    ctx.fill();
  }
  if (f.yielding)
    stroke(
      [
        [boundary, f.z - 1.4],
        [boundary, f.z + 1.4],
      ],
      COLORS.act,
      3 * u,
    );
  if (s.scenario === 'crossing' && f.visible) {
    const q = point(5, f.pedestrianZ);
    // No marker or prediction before observation: there is no x-ray vision.
    const prediction = decisionReadout(f, s).prediction.map(
      (p) => [p.x, p.z] as [number, number],
    );
    stroke(prediction, COLORS.prediction, 2 * u, true);
    ctx.strokeStyle = COLORS.observed;
    ctx.lineWidth = 2 * u;
    ctx.strokeRect(q[0] - 5 * u, q[1] - 7 * u, 10 * u, 14 * u);
    ctx.fillStyle = COLORS.observed;
    ctx.beginPath();
    ctx.arc(q[0], q[1], 2.5 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  const ego = point(f.x, f.z),
    t = decisionReadout(f, s);
  const yaw = Math.atan2(
    laneAt(f.x + 0.1, s.scenario) - laneAt(f.x - 0.1, s.scenario),
    0.2,
  );
  ctx.save();
  ctx.translate(...ego);
  ctx.rotate(yaw);
  ctx.fillStyle = '#ddc795';
  ctx.beginPath();
  ctx.roundRect(-0.86 * sx, -2.1 * sy, 1.72 * sx, 4.2 * sy, 3 * u);
  ctx.fill();
  ctx.fillStyle = '#19333d';
  ctx.fillRect(-0.66 * sx, -1.25 * sy, 1.32 * sx, 0.8 * sy);
  for (const side of [-1, 1] as const)
    for (const front of [false, true]) {
      ctx.save();
      ctx.translate(side * sx * 0.9, (front ? -1.35 : 1.35) * sy);
      if (front) ctx.rotate(roadWheelAngle(t.steering, side));
      ctx.fillStyle = front ? COLORS.act : '#adc2c6';
      ctx.fillRect(-0.14 * sx, -0.45 * sy, 0.28 * sx, 0.9 * sy);
      ctx.restore();
    }
  ctx.restore();
  ctx.restore();
}
