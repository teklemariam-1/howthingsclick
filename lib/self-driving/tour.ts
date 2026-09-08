import {
  DEFAULT_SETTINGS,
  type CameraView,
  type Settings,
  type View,
} from './simulation';
import type { Assembly, SystemId } from './engineering';
import { steeringExperimentAt } from './steering';
import type { ControlDetail } from './motor-driver';

export const TOUR_DURATION = 270;
type Vec3 = [number, number, number];
export interface TourPose {
  target: Vec3;
  distance: number;
  yaw: number;
  elevation: number;
  fov: number;
  anchor: 'vehicle' | 'system';
  reveal: number;
  explode: number;
  doors: number;
  lid: number;
}
interface Keyframe {
  at: number;
  pose: TourPose;
}
export interface Chapter {
  controlDetail?: ControlDetail;
  at: number;
  end: number;
  title: string;
  body: string;
  narration: string;
  voiceAt: number;
  voiceEnd: number;
  view: View;
  camera: CameraView;
  scenario: Settings['scenario'];
  from: number;
  to: number;
  engineering: boolean;
  system: SystemId;
  assembly: Assembly;
  motion: Keyframe[];
}
function pose(overrides: Partial<TourPose> = {}): TourPose {
  return {
    target: [0, 0.7, 0],
    distance: 6.7,
    yaw: 0.68,
    elevation: 0.28,
    fov: 42,
    anchor: 'vehicle',
    reveal: 0,
    explode: 0,
    doors: 0,
    lid: 0,
    ...overrides,
  };
}
const key = (at: number, overrides: Partial<TourPose>): Keyframe => ({
  at,
  pose: pose(overrides),
});
const inside = { reveal: 1, elevation: 0.55 };
const board = {
  ...inside,
  anchor: 'system' as const,
  target: [0, 0.02, 0] as Vec3,
  explode: 1,
  lid: 0.3,
};
const BASE_TOUR: Chapter[] = [
  {
    at: 0,
    end: 12,
    title: 'How does a car drive itself?',
    body: 'Start with the vehicle, then follow the engineering beneath its surface.',
    narration:
      'No steering wheel. No pedals. So how does this car know when to turn, when to stop, and what might step into its path?',
    voiceAt: 0.6,
    voiceEnd: 11.5,
    view: 'street',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 0,
    to: 0,
    engineering: true,
    system: 'overview',
    assembly: 'assembled',
    motion: [
      key(0, { distance: 6.7, yaw: 0.55 }),
      key(12, { distance: 6.1, yaw: 0.9 }),
    ],
  },
  {
    at: 12,
    end: 24,
    title: 'A cabin built for passengers',
    body: 'Open the doors and look inside the two-seat cabin.',
    narration:
      'These butterfly doors swing outward and upward. Inside, both seats are for passengers. The driving happens elsewhere. Let’s follow an image all the way to movement.',
    voiceAt: 0.5,
    voiceEnd: 11.5,
    view: 'street',
    camera: 'cabin',
    scenario: 'crossing',
    from: 0,
    to: 0,
    engineering: false,
    system: 'overview',
    assembly: 'assembled',
    motion: [
      key(0, {
        distance: 6.2,
        yaw: 2.15,
        elevation: 0.12,
        target: [0, 1.15, 0],
      }),
      key(3, {
        distance: 6.1,
        yaw: 2.15,
        elevation: 0.12,
        target: [0, 1.15, 0],
        doors: 1,
      }),
      key(7, {
        distance: 1.8,
        yaw: 1.32,
        elevation: 0.22,
        target: [-0.22, 0.84, -0.08],
        doors: 1,
        fov: 60,
      }),
      key(12, {
        distance: 1.65,
        yaw: 1.17,
        elevation: 0.22,
        target: [-0.22, 0.84, -0.08],
        doors: 1,
        fov: 60,
      }),
    ],
  },
  {
    at: 24,
    end: 42,
    title: 'Peel back the body',
    body: 'Separate the shell, computer and drive hardware to reveal the complete loop.',
    narration:
      'Beneath the body, cameras feed an onboard computer. The computer interprets the scene and commands the car. Measurements return, closing the loop. This is a simplified engineering model, not a reconstruction of Tesla’s private software.',
    voiceAt: 1,
    voiceEnd: 17,
    view: 'street',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 0,
    to: 4,
    engineering: true,
    system: 'overview',
    assembly: 'exploded',
    motion: [
      key(0, { distance: 7.4, yaw: 0.85, elevation: 0.4 }),
      key(4, { ...inside, distance: 7.4, yaw: 0.9 }),
      key(9, {
        ...inside,
        distance: 8,
        yaw: 1.1,
        explode: 1,
        target: [0, 0.95, 0],
      }),
      key(14, {
        ...inside,
        distance: 7.6,
        yaw: 1.24,
        explode: 1,
        target: [0, 0.95, 0],
      }),
      key(18, { ...inside, distance: 6.8, yaw: 0.78 }),
    ],
  },
  {
    at: 42,
    end: 62,
    title: 'Start with light',
    body: 'Follow camera measurements and the car’s own motion signals into the computer.',
    narration:
      'A camera begins with light, focused onto an image sensor. Successive frames carry clues about depth and motion. Measurements of the car’s own movement add context. But cameras cannot see through a parked van. Hidden space remains uncertain.',
    voiceAt: 0.8,
    voiceEnd: 19,
    view: 'vision',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 0,
    to: 6,
    engineering: true,
    system: 'sensors',
    assembly: 'cutaway',
    motion: [
      key(0, {
        ...inside,
        anchor: 'system',
        target: [0, 0, 0],
        distance: 4.6,
        yaw: 0.78,
      }),
      key(20, {
        ...inside,
        anchor: 'system',
        target: [0, 0, 0],
        distance: 3.2,
        yaw: 1.04,
      }),
    ],
  },
  {
    at: 62,
    end: 86,
    title: 'Inside the onboard computer',
    body: 'Lift the thermal cover and move in close to the processors and memory.',
    narration:
      'Lift the cover. Processors run a model trained before the journey. Memory holds its learned parameters and recent information. Training changes the model; inference applies it to new observations. These calculations run onboard, fast enough to keep updating as the world changes.',
    voiceAt: 1,
    voiceEnd: 22,
    view: 'vision',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 3,
    to: 8,
    engineering: true,
    system: 'compute',
    assembly: 'exploded',
    motion: [
      key(0, { ...board, distance: 2.5, yaw: 0.8, lid: 0, explode: 0 }),
      key(5, { ...board, distance: 1.9, yaw: 0.92 }),
      key(24, { ...board, distance: 1.4, yaw: 1.38, elevation: 0.87 }),
    ],
  },
  {
    at: 86,
    end: 108,
    title: 'Build a picture of the world',
    body: 'Separate visible observations from predictions and unknown space.',
    narration:
      'The system needs a useful picture of the world: road boundaries, moving objects, and its own position. Watch the pedestrian appear as the view clears. The colored map makes those ideas visible. Our demonstration uses known geometry; a real vehicle must estimate it.',
    voiceAt: 0.8,
    voiceEnd: 21,
    view: 'vision',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 2,
    to: 8,
    engineering: true,
    system: 'perception',
    assembly: 'cutaway',
    motion: [
      key(0, {
        ...inside,
        target: [0.55, 1.15, 0],
        distance: 4,
        yaw: 1.2,
        elevation: 0.6,
      }),
      key(22, {
        ...inside,
        target: [0.55, 1.15, 0],
        distance: 3.4,
        yaw: 1.45,
        elevation: 0.66,
      }),
    ],
  },
  {
    at: 108,
    end: 130,
    title: 'Choose where—and when—to move',
    body: 'Connect predictions to a path and a target speed.',
    narration:
      'Seeing an object is only the beginning. Where might it go next? Planning combines that prediction with a path and a speed. Passing behind a pedestrian can be reasonable; arriving at the same place at the same time is the problem.',
    voiceAt: 0.8,
    voiceEnd: 21,
    view: 'prediction',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 6,
    to: 16,
    engineering: true,
    system: 'planning',
    assembly: 'cutaway',
    motion: [
      key(0, {
        ...inside,
        target: [0.55, 1.15, 0],
        distance: 3.6,
        yaw: 1.42,
        elevation: 0.62,
      }),
      key(22, {
        ...inside,
        target: [0.55, 1.15, 0],
        distance: 4,
        yaw: 1.02,
        elevation: 0.6,
      }),
    ],
  },
  {
    at: 130,
    end: 152,
    title: 'Turn commands into forces',
    body: 'Watch a requested wheel angle become rack movement, then see feedback correct a disturbance.',
    narration:
      'The planned trajectory becomes a target wheel angle. The controller compares it with the measured angle and commands the steering actuator. Watch the rack and tie rods turn the wheels. Now disturb their angle. Feedback reveals the error, and the controller corrects it.',
    voiceAt: 0.8,
    voiceEnd: 21,
    view: 'planning',
    camera: 'vehicle',
    scenario: 'roadworks',
    from: 1,
    to: 19,
    engineering: true,
    system: 'control',
    assembly: 'cutaway',
    motion: [
      key(0, {
        ...inside,
        anchor: 'system',
        target: [0, 0, 0],
        distance: 4.3,
        yaw: 2.3,
        explode: 0,
      }),
      key(5, {
        ...inside,
        anchor: 'system',
        target: [0, 0, 0],
        distance: 3.5,
        yaw: 2.12,
        explode: 0,
      }),
      key(22, {
        ...inside,
        anchor: 'system',
        target: [0, 0, 0],
        distance: 3.1,
        yaw: 1.86,
        explode: 0,
      }),
    ],
  },
  {
    at: 152,
    end: 174,
    title: 'Supply power. Carry heat away.',
    body: 'Trace the battery, drive electronics, low-voltage supply and cooling.',
    narration:
      'Steering sets direction. Propulsion needs torque. The inverter controls current in the drive motor. Magnetic forces turn its rotor. Gears and a differential pass torque through the shafts to the wheels. Speed feedback adjusts the demand. The battery supplies energy, while cooling carries heat away.',
    voiceAt: 0.8,
    voiceEnd: 21,
    view: 'street',
    camera: 'vehicle',
    scenario: 'roadworks',
    from: 4,
    to: 13,
    engineering: true,
    system: 'power',
    assembly: 'cutaway',
    motion: [
      key(0, { ...inside, distance: 6.2, yaw: 0.9, elevation: 0.75 }),
      key(22, { ...inside, distance: 5.4, yaw: 1.3, elevation: 0.95 }),
    ],
  },
  {
    at: 174,
    end: 196,
    title: 'The hidden pedestrian',
    body: 'Watch the view clear, the pedestrian become visible, and the vehicle yield.',
    narration:
      'Put the loop on the road. The van hides part of the pavement. In this experiment, the car approaches cautiously. As the pedestrian becomes visible, watch the decision change: slow down, yield, then continue when the crossing is clear.',
    voiceAt: 0.8,
    voiceEnd: 20.5,
    view: 'linked',
    camera: 'follow',
    scenario: 'crossing',
    from: 0,
    to: 17,
    engineering: false,
    system: 'perception',
    assembly: 'assembled',
    motion: [
      key(0, {
        target: [3, 0.55, 0],
        distance: 16,
        yaw: 0.95,
        elevation: 0.62,
      }),
      key(22, {
        target: [3, 0.55, 0],
        distance: 14,
        yaw: 1.08,
        elevation: 0.65,
      }),
    ],
  },
  {
    at: 196,
    end: 218,
    title: 'Watch the wheels follow the path',
    body: 'Look down on the trajectory, then move closer to the steering wheels.',
    narration:
      'Now the lane is blocked. With the neighboring lane clear in our scenario, the path bends around the cones. Watch the front wheels: turn into the bend, then unwind. The route, speed, and physical steering have to agree throughout the maneuver.',
    voiceAt: 0.8,
    voiceEnd: 21,
    view: 'linked',
    camera: 'overhead',
    scenario: 'roadworks',
    from: 0,
    to: 18,
    engineering: false,
    system: 'control',
    assembly: 'assembled',
    motion: [
      key(0, { target: [3, 0.4, 0], distance: 18, yaw: 1.3, elevation: 1.18 }),
      key(14, {
        target: [2, 0.45, 0],
        distance: 12,
        yaw: 0.86,
        elevation: 0.63,
      }),
      key(22, { target: [1, 0.5, 0], distance: 9, yaw: 0.8, elevation: 0.42 }),
    ],
  },
  {
    at: 218,
    end: 240,
    title: 'Your turn to experiment',
    body: 'Reassemble the vehicle, then try a different speed or pedestrian timing.',
    narration:
      'Bring it all back together: sense, interpret, plan, act, and measure again. But what changes if the pedestrian steps out later? Or the target speed goes up? Try it yourself at How Things Click dot com, slash self-driving. Subscribe for the next thing we take apart.',
    voiceAt: 0.8,
    voiceEnd: 21.5,
    view: 'street',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 0,
    to: 0,
    engineering: true,
    system: 'overview',
    assembly: 'exploded',
    motion: [
      key(0, {
        ...inside,
        explode: 1,
        target: [0, 0.95, 0],
        distance: 8.2,
        yaw: 1.08,
      }),
      key(5, {
        ...inside,
        explode: 1,
        target: [0, 0.95, 0],
        distance: 8.2,
        yaw: 0.95,
      }),
      key(10, { ...inside, distance: 6.8, yaw: 0.7 }),
      key(14, { distance: 6.7, yaw: 0.6 }),
      key(22, { distance: 6.3, yaw: 0.82 }),
    ],
  },
];
const electronics: Chapter = {
  at: 130,
  end: 160,
  title: 'A small command controls motor power',
  body: 'Follow the steering ECU, gate driver, six switching transistors and three motor phases. Switching is slowed down for explanation.',
  narration:
    'A digital command cannot power a motor. It tells a steering controller what movement is wanted. A gate driver switches six power transistors in a typical three-phase inverter. Changing the pulses regulates winding current and motor torque. Position and current measurements return to the controller. We’ve slowed the switching down so you can see it.',
  voiceAt: 1,
  voiceEnd: 28.5,
  view: 'street',
  camera: 'vehicle',
  scenario: 'roadworks',
  from: 0,
  to: 22,
  engineering: true,
  system: 'control',
  assembly: 'cutaway',
  controlDetail: 'electronics',
  motion: [
    key(0, {
      ...inside,
      anchor: 'system',
      target: [0.14, 0, 0],
      distance: 3.3,
      yaw: 0.95,
      elevation: 0.8,
    }),
    key(30, {
      ...inside,
      anchor: 'system',
      target: [0.14, 0, 0],
      distance: 2.7,
      yaw: 1.38,
      elevation: 0.95,
    }),
  ],
};
export const TOUR: Chapter[] = [
  ...BASE_TOUR.slice(0, 7),
  electronics,
  ...BASE_TOUR.slice(7).map((s) => ({ ...s, at: s.at + 30, end: s.end + 30 })),
];
const smooth = (v: number) => v * v * (3 - 2 * v);
export function samplePose(motion: Keyframe[], seconds: number): TourPose {
  const right = motion.findIndex((k) => k.at > seconds);
  if (right === 0) return motion[0].pose;
  if (right < 0) return motion[motion.length - 1].pose;
  const a = motion[right - 1],
    b = motion[right];
  const u = smooth((seconds - a.at) / (b.at - a.at));
  const mix = (x: number, y: number) => x + (y - x) * u;
  return {
    target: a.pose.target.map((v, i) => mix(v, b.pose.target[i])) as Vec3,
    anchor: a.pose.anchor,
    distance: mix(a.pose.distance, b.pose.distance),
    yaw: mix(a.pose.yaw, b.pose.yaw),
    elevation: mix(a.pose.elevation, b.pose.elevation),
    fov: mix(a.pose.fov, b.pose.fov),
    reveal: mix(a.pose.reveal, b.pose.reveal),
    explode: mix(a.pose.explode, b.pose.explode),
    doors: mix(a.pose.doors, b.pose.doors),
    lid: mix(a.pose.lid, b.pose.lid),
  };
}
export function tourAt(seconds: number) {
  const t = Math.max(
    0,
    Math.min(TOUR_DURATION, Number.isFinite(seconds) ? seconds : 0),
  );
  const found = TOUR.findIndex((s) => t < s.end),
    index = found < 0 ? TOUR.length - 1 : found,
    step = TOUR[index];
  const u = Math.max(0, Math.min(1, (t - step.at) / (step.end - step.at)));
  const pose = samplePose(step.motion, t - step.at);
  return {
    step,
    index,
    time: step.from + (step.to - step.from) * u,
    view: step.view,
    camera: step.camera,
    settings: { ...DEFAULT_SETTINGS, scenario: step.scenario },
    controlDetail: step.controlDetail ?? 'mechanism',
    doors: pose.doors > 0,
    pose,
    steering:
      step.engineering && step.system === 'control'
        ? steeringExperimentAt(t - step.at)
        : undefined,
    engineering: step.engineering,
    system: step.system,
    assembly: pose.reveal < 0.001 ? ('assembled' as Assembly) : step.assembly,
  };
}
