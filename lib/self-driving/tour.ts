import {
  DEFAULT_SETTINGS,
  type CameraView,
  type Settings,
  type View,
} from './simulation';
import type { Assembly, SystemId } from './engineering';
export const TOUR_DURATION = 240;
interface Chapter {
  at: number;
  end: number;
  title: string;
  body: string;
  view: View;
  camera: CameraView;
  scenario: Settings['scenario'];
  from: number;
  to: number;
  engineering: boolean;
  system: SystemId;
  assembly: Assembly;
}
export const TOUR: Chapter[] = [
  {
    at: 0,
    end: 18,
    title: 'An image becomes motion',
    body: 'Peel back the body and trace the complete sensing, computing and control loop.',
    view: 'street',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 0,
    to: 3,
    engineering: true,
    system: 'overview',
    assembly: 'cutaway',
  },
  {
    at: 18,
    end: 42,
    title: 'Start with the measurements',
    body: 'Cameras capture light. Vehicle measurements help distinguish our own motion from motion around us.',
    view: 'vision',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 0,
    to: 6,
    engineering: true,
    system: 'sensors',
    assembly: 'cutaway',
  },
  {
    at: 42,
    end: 68,
    title: 'Inside the computer',
    body: 'Lift the thermal cover. Processors apply a trained model; memory holds the weights and recent observations.',
    view: 'vision',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 3,
    to: 8,
    engineering: true,
    system: 'compute',
    assembly: 'exploded',
  },
  {
    at: 68,
    end: 92,
    title: 'Represent the world',
    body: 'Locate the car, estimate road geometry and track what is visible. Occluded space remains unknown.',
    view: 'vision',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 2,
    to: 8,
    engineering: true,
    system: 'perception',
    assembly: 'cutaway',
  },
  {
    at: 92,
    end: 116,
    title: 'Plan a trajectory',
    body: 'Predict another road user’s motion, choose a route, and set a speed. A trajectory includes both space and time.',
    view: 'prediction',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 6,
    to: 16,
    engineering: true,
    system: 'planning',
    assembly: 'cutaway',
  },
  {
    at: 116,
    end: 144,
    title: 'Commands become forces',
    body: 'Steering angles and acceleration commands move the vehicle. Measured motion returns to the controller.',
    view: 'planning',
    camera: 'vehicle',
    scenario: 'roadworks',
    from: 1,
    to: 19,
    engineering: true,
    system: 'control',
    assembly: 'exploded',
  },
  {
    at: 144,
    end: 164,
    title: 'Power the loop',
    body: 'The floor battery supplies energy. The front drive inverter switches current for the motor; electronics need low-voltage power and cooling.',
    view: 'street',
    camera: 'vehicle',
    scenario: 'roadworks',
    from: 4,
    to: 13,
    engineering: true,
    system: 'power',
    assembly: 'cutaway',
  },
  {
    at: 164,
    end: 192,
    title: 'Put the loop on the road',
    body: 'The van blocks the camera view. Watch the pedestrian become visible and the vehicle yield.',
    view: 'vision',
    camera: 'follow',
    scenario: 'crossing',
    from: 0,
    to: 24,
    engineering: false,
    system: 'perception',
    assembly: 'assembled',
  },
  {
    at: 192,
    end: 218,
    title: 'Change the path',
    body: 'With the adjacent lane clear, the route bends around the cones. Watch the front wheels steer into and out of the bend.',
    view: 'planning',
    camera: 'overhead',
    scenario: 'roadworks',
    from: 0,
    to: 24,
    engineering: false,
    system: 'control',
    assembly: 'assembled',
  },
  {
    at: 218,
    end: 240,
    title: 'Now take control of the experiment',
    body: 'Select a system, open the car, and change the conditions. Explore howthingsclick.com/self-driving.',
    view: 'street',
    camera: 'vehicle',
    scenario: 'crossing',
    from: 4,
    to: 9,
    engineering: true,
    system: 'overview',
    assembly: 'exploded',
  },
];
export function tourAt(seconds: number) {
  const t = Math.max(0, Math.min(TOUR_DURATION, seconds));
  const found = TOUR.findIndex((s) => t < s.end),
    index = found < 0 ? TOUR.length - 1 : found,
    step = TOUR[index];
  const u = Math.max(0, Math.min(1, (t - step.at) / (step.end - step.at)));
  return {
    step,
    index,
    time: step.from + (step.to - step.from) * u,
    view: step.view,
    camera: step.camera,
    settings: { ...DEFAULT_SETTINGS, scenario: step.scenario },
    doors: false,
    orbit: u,
    engineering: step.engineering,
    system: step.system,
    assembly: index === 0 && t < 5 ? ('assembled' as Assembly) : step.assembly,
  };
}
