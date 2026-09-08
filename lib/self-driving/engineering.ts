import { clamp, laneAt, type Frame, type Settings } from './simulation';

export type SystemId =
  | 'overview'
  | 'sensors'
  | 'compute'
  | 'perception'
  | 'planning'
  | 'control'
  | 'power';
export type Assembly = 'assembled' | 'cutaway' | 'exploded';
export const SYSTEMS: {
  id: SystemId;
  number: string;
  title: string;
  short: string;
  color: string;
  question: string;
  body: string;
  input: string;
  process: string;
  output: string;
}[] = [
  {
    id: 'overview',
    number: '00',
    title: 'The complete loop',
    short: 'Overview',
    color: '#d5ef78',
    question: 'How does an image become motion?',
    body: 'Follow a camera signal into the onboard computer, then out to the actuators. Measurements return to the computer so it can keep correcting the movement.',
    input: 'Light + vehicle measurements',
    process: 'Interpret → plan → control',
    output: 'Steering, braking, propulsion',
  },
  {
    id: 'sensors',
    number: '01',
    title: 'Cameras & measurements',
    short: 'Sense',
    color: '#71dceb',
    question: 'The car starts with light.',
    body: 'Optics focus light onto an image sensor. Multiple views and successive frames provide evidence about the scene. Wheel and motion measurements help estimate how the car itself is moving.',
    input: 'Photons + motion',
    process: 'Sample and time-align',
    output: 'Images + vehicle state',
  },
  {
    id: 'compute',
    number: '02',
    title: 'The onboard computer',
    short: 'Compute',
    color: '#a99aff',
    question: 'The driving loop runs onboard.',
    body: 'A processor executes a trained model on incoming data. Memory holds the model and recent information. Training changes the model beforehand; inference applies it during a journey.',
    input: 'Images + recent state',
    process: 'Neural-network inference',
    output: 'Scene features / driving trajectory',
  },
  {
    id: 'perception',
    number: '03',
    title: 'Build a world representation',
    short: 'Understand',
    color: '#71dceb',
    question: 'Pixels are evidence, not certainty.',
    body: 'An autonomy system needs road geometry, visibility and the motion of other road users, together with its own position. Our map uses known scene geometry and an occlusion test; it does not run a trained vision network.',
    input: 'Camera observations + ego pose',
    process: 'Estimate space and motion',
    output: 'Road, tracked objects, unknown space',
  },
  {
    id: 'planning',
    number: '04',
    title: 'Prediction & trajectory',
    short: 'Plan',
    color: '#e9b563',
    question: 'Choose where—and when—to move.',
    body: 'Prediction considers where another road user may go. Planning chooses a route and speed that respect that possibility. Here a constant-velocity estimate and explicit rules make that decision inspectable.',
    input: 'World state + intended route',
    process: 'Predict motion → choose path + speed',
    output: 'A time-varying trajectory',
  },
  {
    id: 'control',
    number: '05',
    title: 'Steering, braking & drive',
    short: 'Act',
    color: '#f08c81',
    question: 'A path still needs physical force.',
    body: 'The controller turns a target path and speed into actuator commands. Steering changes wheel direction; propulsion and braking change speed. Measurements close the loop so commands can be corrected.',
    input: 'Target trajectory + measured state',
    process: 'Compare → command → measure again',
    output: 'Wheel angle + acceleration',
  },
  {
    id: 'power',
    number: '06',
    title: 'Power & heat',
    short: 'Power',
    color: '#f3ac55',
    question: 'Computation and motion need energy.',
    body: 'Tesla documents a floor-mounted 400 V battery, a 48 V low-voltage system and a front drive unit with an integrated inverter. Cooling removes heat. The colored routes here explain functions; their routing is illustrative.',
    input: 'Stored electrical energy',
    process: 'Convert voltage / switch motor current',
    output: 'Motion + electronics + heat',
  },
];
export function systemInfo(id: SystemId) {
  return SYSTEMS.find((s) => s.id === id)!;
}
export function steeringAt(x: number, s: Settings['scenario']) {
  const h = 0.08,
    a = laneAt(x - h, s),
    b = laneAt(x, s),
    c = laneAt(x + h, s);
  const slope = (c - a) / (2 * h),
    curvature = (c - 2 * b + a) / (h * h * Math.pow(1 + slope * slope, 1.5));
  return Math.atan(2.79 * curvature);
}
export function engineeringTelemetry(f: Frame, s: Settings) {
  const yaw = Math.atan2(
    laneAt(f.x + 0.1, s.scenario) - laneAt(f.x - 0.1, s.scenario),
    0.2,
  );
  const dx = 5 - f.x,
    dz = f.pedestrianZ - f.z;
  return {
    steering: steeringAt(f.x, s.scenario),
    forward: Math.cos(yaw) * dx + Math.sin(yaw) * dz,
    lateral: -Math.sin(yaw) * dx + Math.cos(yaw) * dz,
    wheelRpm: (f.speed / (2 * Math.PI * 0.382)) * 60,
    drive: clamp(f.acceleration / 1.65, 0, 1),
    brake: clamp(-f.acceleration / 3.5, 0, 1),
    pedestrianVelocity:
      f.time > s.pedestrianDelay && f.pedestrianZ < 6.3 ? 1.05 : 0,
    prediction: f.visible
      ? Array.from({ length: 7 }, (_, i) => ({
          x: 5,
          z:
            f.pedestrianZ +
            i *
              0.5 *
              (f.time > s.pedestrianDelay && f.pedestrianZ < 6.3 ? 1.05 : 0),
          t: i * 0.5,
        }))
      : [],
  };
}
// Independent, analytic thought experiment, not a Cybercab braking benchmark.
// Constant deceleration begins after the chosen processing/actuation delay.
export function stoppingExperiment(
  speedKph: number,
  delayMs: number,
  deceleration: number,
) {
  const v = clamp(speedKph, 0, 130) / 3.6,
    t = clamp(delayMs, 0, 2000) / 1000,
    a = clamp(deceleration, 0.5, 9);
  const reaction = v * t,
    braking = (v * v) / (2 * a);
  return { reaction, braking, total: reaction + braking, seconds: t + v / a };
}
export const ENGINEERING_SOURCES = [
  {
    title: 'Tesla: Cybercab hardware layout',
    url: 'https://digitalassets.tesla.com/tesla-contents/image/upload/2026-cybercab-emergency-response-guide.pdf',
    note: 'Pages 25–28: floor battery, 48 V system, front drive unit and inverter.',
  },
  {
    title: 'Tesla: AI & Robotics',
    url: 'https://www.tesla.com/AI',
    note: 'Computer vision, onboard inference, planning and controls.',
  },
  {
    title: 'Autoware: driving architectures',
    url: 'https://autowarefoundation.github.io/autoware-documentation/1.5.0/design/autoware-architecture-v2/roadmap/autonomous-driving-stack-architecture/',
    note: 'Modular and end-to-end approaches; teaching stages are not necessarily separate production modules.',
  },
  {
    title: 'Autoware: feedback control',
    url: 'https://autowarefoundation.gitlab.io/autoware.auto/AutowareAuto/controller-design.html',
    note: 'Following a reference trajectory using vehicle state and control commands.',
  },
];
