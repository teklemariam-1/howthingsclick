import * as T from 'three';
import {
  blockedByVan,
  laneAt,
  type Frame,
  type Settings,
} from '@/lib/self-driving/simulation';
import {
  engineeringTelemetry,
  type SystemId,
} from '@/lib/self-driving/engineering';
// A virtual instrument panel, not a modeled Cybercab cabin screen.
// It is rendered with the 3D scene so the same explanation appears in exports.
export function createSoftwareDisplay() {
  const group = new T.Group();
  if (typeof document === 'undefined')
    return { group, update(_f: Frame, _s: Settings, _id: SystemId) {} };
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 560;
  const ctx = canvas.getContext('2d')!,
    texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const panel = new T.Sprite(
    new T.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }),
  );
  panel.scale.set(2.38, 1.3, 1);
  panel.position.set(0.62, 1.91, -0.3);
  panel.renderOrder = 15;
  group.add(panel);
  let stamp = '';
  return {
    group,
    update(f: Frame, s: Settings, id: SystemId) {
      group.visible = id === 'perception' || id === 'planning';
      if (!group.visible) return;
      const key = id + s.scenario + s.speedKph + ':' + Math.floor(f.time * 10);
      if (key === stamp) return;
      stamp = key;
      const t = engineeringTelemetry(f, s),
        planning = id === 'planning';
      ctx.clearRect(0, 0, 1024, 560);
      ctx.fillStyle = '#0c1925f5';
      ctx.fillRect(0, 0, 1024, 560);
      ctx.strokeStyle = '#507581';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 1022, 558);
      ctx.fillStyle = planning ? '#e9b563' : '#71dceb';
      ctx.fillRect(0, 0, 5, 560);
      ctx.font = '600 27px Arial';
      ctx.fillText(
        planning
          ? 'PREDICTION → TRAJECTORY'
          : 'OBSERVATION → WORLD REPRESENTATION',
        28,
        45,
      );
      ctx.font = '17px Arial';
      ctx.fillStyle = '#a0b5c2';
      ctx.fillText('Virtual instrument · derived from this scene', 28, 76);
      ctx.save();
      ctx.beginPath();
      ctx.rect(20, 101, 445, 431);
      ctx.clip();
      const map = (x: number, z: number) => [
        245 + z * 30,
        482 - (x - f.x) * 17,
      ];
      for (let i = 0; i < 252; i++) {
        const x = f.x + Math.floor(i / 14) * 1.5,
          z = (i % 14) - 6.5,
          p = map(x, z);
        const hidden =
          s.scenario === 'crossing' && blockedByVan(f.x + 1.9, f.z, x, z);
        ctx.fillStyle = hidden ? '#484b50' : '#1a3941';
        ctx.fillRect(p[0] - 12, p[1] - 11, 24, 20);
      }
      ctx.strokeStyle = '#628082';
      ctx.setLineDash([7, 10]);
      ctx.beginPath();
      ctx.moveTo(245, 90);
      ctx.lineTo(245, 540);
      ctx.stroke();
      ctx.setLineDash([]);
      if (s.scenario === 'crossing') {
        const v = map(2.8, -4.45);
        ctx.fillStyle = '#748693';
        ctx.fillRect(v[0], v[1], 63, 61);
      }
      ctx.strokeStyle = planning ? '#d5ef78' : '#42717b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 48; i++) {
        const x = f.x + i * 0.5,
          p = map(x, laneAt(x, s.scenario));
        if (i) ctx.lineTo(...(p as [number, number]));
        else ctx.moveTo(...(p as [number, number]));
      }
      ctx.stroke();
      const car = map(f.x, f.z);
      ctx.fillStyle = '#d4bc8b';
      ctx.fillRect(car[0] - 20, car[1] - 29, 40, 58);
      if (f.visible) {
        const p = map(5, f.pedestrianZ);
        ctx.fillStyle = '#71dceb';
        ctx.beginPath();
        ctx.arc(p[0], p[1], 7, 0, Math.PI * 2);
        ctx.fill();
        if (planning) {
          ctx.strokeStyle = '#e9b563';
          ctx.setLineDash([7, 6]);
          ctx.beginPath();
          ctx.moveTo(...(p as [number, number]));
          ctx.lineTo(p[0] + t.pedestrianVelocity * 90, p[1]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      if (planning && f.yielding) {
        const p = map(s.scenario === 'signal' ? 2.05 : 3.4, f.z);
        ctx.strokeStyle = '#f08c81';
        ctx.beginPath();
        ctx.moveTo(p[0] - 45, p[1]);
        ctx.lineTo(p[0] + 45, p[1]);
        ctx.stroke();
      }
      ctx.restore();
      function row(y: number, label: string, value: string) {
        ctx.font = '17px Arial';
        ctx.fillStyle = '#91a9b6';
        ctx.fillText(label, 505, y);
        ctx.font = '500 26px Arial';
        ctx.fillStyle = '#e5eeeb';
        ctx.fillText(value, 505, y + 34);
      }
      row(
        141,
        'PEDESTRIAN OBSERVATION',
        s.scenario === 'crossing'
          ? f.visible
            ? 'Visible'
            : 'Not observed'
          : 'No pedestrian in this scenario',
      );
      row(
        239,
        planning ? 'TARGET SPEED' : 'FORWARD / LATERAL POSITION',
        planning
          ? (f.targetSpeed * 3.6).toFixed(1) + ' km/h'
          : f.visible
            ? t.forward.toFixed(1) + ' m / ' + t.lateral.toFixed(1) + ' m'
            : 'Unknown',
      );
      row(
        337,
        planning ? 'CONTROL OUTPUT' : 'VEHICLE POSITION',
        planning
          ? 'δ ' +
              ((t.steering * 180) / Math.PI).toFixed(1) +
              '°  ·  a ' +
              f.acceleration.toFixed(1) +
              ' m/s²'
          : 'x ' + f.x.toFixed(1) + ' m  ·  z ' + f.z.toFixed(1) + ' m',
      );
      ctx.fillStyle = '#7e99a7';
      ctx.font = '17px Arial';
      ctx.fillText('Gray: occluded · Amber: predicted motion', 505, 459);
      ctx.fillText('Simplified geometry and rules', 505, 490);
      ctx.fillText('No neural-network inference in this demo', 505, 518);
      texture.needsUpdate = true;
    },
  };
}
