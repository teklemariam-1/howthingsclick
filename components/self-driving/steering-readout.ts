import type { SteeringSample } from '@/lib/self-driving/steering';
import {
  motorDriverAt,
  type ControlDetail,
} from '@/lib/self-driving/motor-driver';
export function drawSteeringReadout(
  c: CanvasRenderingContext2D,
  s: SteeringSample,
  width: number,
  height: number,
  detail: ControlDetail = 'mechanism',
  time = 0,
) {
  if (detail === 'electronics') {
    drawPowerStage(c, s, width, height, time);
    return;
  }
  const scale = Math.min(1.35, Math.max(0.63, width / 1350));
  c.save();
  c.translate(24, height - 172 * scale - 24);
  c.scale(scale, scale);
  c.fillStyle = '#0b1827eb';
  c.beginPath();
  c.roundRect(0, 0, 470, 172, 14);
  c.fill();
  c.font = '600 17px Arial';
  c.fillStyle = '#e5efed';
  c.fillText('STEERING FEEDBACK · EDUCATIONAL BENCH', 18, 29);
  const cells = [
    ['TARGET', s.target, '#d5ef78'],
    ['MEASURED', s.measured, '#f08c81'],
    ['ERROR', s.error, '#71dceb'],
  ] as const;
  cells.forEach(([name, value, color], i) => {
    c.fillStyle = color;
    c.font = '500 13px Arial';
    c.fillText(name, 18 + i * 154, 56);
    c.font = '600 25px Arial';
    c.fillText(((value * 180) / Math.PI).toFixed(1) + '°', 18 + i * 154, 87);
  });
  c.fillStyle = '#f08c81';
  c.font = '500 14px Arial';
  c.fillText('Command → actuator → rack → wheels', 18, 119);
  c.fillStyle = '#71dceb';
  c.fillText('Measured angle → controller → correction', 18, 144);
  if (s.disturbed) {
    c.fillStyle = '#e9b563';
    c.fillRect(344, 110, 110, 38);
    c.fillStyle = '#0b1827';
    c.font = '600 12px Arial';
    c.fillText('DISTURBANCE', 352, 134);
  }
  c.restore();
}

function drawPowerStage(
  c: CanvasRenderingContext2D,
  s: SteeringSample,
  width: number,
  height: number,
  time: number,
) {
  const scale = Math.min(1.25, Math.max(0.6, width / 1350)),
    d = motorDriverAt(time, s.effort);
  c.save();
  c.translate(24, height - 224 * scale - 24);
  c.scale(scale, scale);
  c.fillStyle = '#0b1827ef';
  c.beginPath();
  c.roundRect(0, 0, 530, 224, 14);
  c.fill();
  c.fillStyle = '#e5efed';
  c.font = '600 17px Arial';
  c.fillText('DIGITAL COMMAND → MOTOR POWER', 18, 28);
  c.fillStyle = '#a99aff';
  c.font = '500 14px Arial';
  c.fillText('Steering ECU → gate driver → six MOSFET switches', 18, 52);
  const colors = ['#edac62', '#77dbea', '#bca1ff'];
  d.phases.forEach((p, i) => {
    const y = 78 + i * 32;
    c.fillStyle = colors[i];
    c.font = '600 14px Arial';
    c.fillText('PHASE ' + ['A', 'B', 'C'][i], 18, y + 5);
    c.font = '500 12px Arial';
    c.fillText(Math.round(p.duty * 100) + '% duty', 100, y + 5);
    c.strokeStyle = colors[i];
    c.lineWidth = 2;
    c.beginPath();
    for (let n = 0; n < 3; n++) {
      const x = 178 + n * 66,
        on = 66 * p.duty;
      c.moveTo(x, y + 8);
      c.lineTo(x, y - 8);
      c.lineTo(x + on, y - 8);
      c.lineTo(x + on, y + 8);
      c.lineTo(x + 66, y + 8);
    }
    c.stroke();
    c.fillStyle = p.high ? colors[i] : '#33434c';
    c.fillRect(397, y - 10, 38, 20);
    c.fillStyle = p.low ? colors[i] : '#33434c';
    c.fillRect(444, y - 10, 38, 20);
    c.fillStyle = '#e8f0ed';
    c.font = '600 11px Arial';
    c.fillText('HIGH', 401, y + 4);
    c.fillText('LOW', 450, y + 4);
  });
  c.fillStyle = '#71dceb';
  c.font = '500 13px Arial';
  c.fillText(
    'Position + current measurements return to the controller',
    18,
    181,
  );
  c.fillStyle = '#aabcbf';
  c.font = '500 12px Arial';
  c.fillText(
    'Slowed switching illustration · duty cycle is not a torque percentage',
    18,
    206,
  );
  c.restore();
}
