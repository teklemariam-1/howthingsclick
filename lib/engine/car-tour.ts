import type { VehicleSystem } from './vehicle-parts';
export type CarCamera = 'home' | 'nose' | 'rear' | 'front' | 'top';
export const CAR_TOUR = [
  {
    start: 0,
    end: 7,
    title: 'A familiar shape. A hidden world.',
    body: 'Orbit the Corolla and look closely at the body, glass and wheel openings.',
    camera: 'home',
    system: 'all',
    explode: 0,
  },
  {
    start: 7,
    end: 13,
    title: 'The face of the car',
    body: 'The swept lamps, upper trim and broad intake form the front of the LE.',
    camera: 'nose',
    system: 'all',
    explode: 0,
  },
  {
    start: 13,
    end: 20,
    title: 'Open the outer layers',
    body: 'The glass, lamps and exterior panels separate in stages.',
    camera: 'home',
    system: 'all',
    explode: 0.48,
  },
  {
    start: 20,
    end: 29,
    title: 'Inside the passenger cell',
    body: 'Seats, controls, restraints and trim fit inside the welded body structure.',
    camera: 'top',
    system: 'cabin',
    explode: 0.62,
  },
  {
    start: 29,
    end: 38,
    title: 'Keep the tires on the road',
    body: 'MacPherson front struts and an LE torsion beam locate the wheels.',
    camera: 'home',
    system: 'suspension',
    explode: 0.66,
  },
  {
    start: 38,
    end: 45,
    title: 'Turn motion into heat',
    body: 'Wheel covers, tires, discs and calipers separate to reveal their roles.',
    camera: 'front',
    system: 'brakes',
    explode: 0.82,
  },
  {
    start: 45,
    end: 53,
    title: 'Follow the supporting systems',
    body: 'Fuel storage, exhaust, electrical equipment and climate hardware serve the car.',
    camera: 'home',
    system: 'all',
    explode: 1,
  },
  {
    start: 53,
    end: 62,
    title: 'Bring it all together',
    body: 'Every assembly returns to its original place. Select a part to explore it yourself.',
    camera: 'home',
    system: 'all',
    explode: 0,
  },
] satisfies {
  start: number;
  end: number;
  title: string;
  body: string;
  camera: CarCamera;
  system: VehicleSystem;
  explode: number;
}[];
export const CAR_TOUR_DURATION = 62;
export function carTourAt(time: number) {
  return (
    CAR_TOUR.find((s) => time >= s.start && time < s.end) ??
    CAR_TOUR[CAR_TOUR.length - 1]
  );
}
export function carTourSrt() {
  const stamp = (v: number) =>
    `00:${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')},000`;
  return CAR_TOUR.map(
    (s, i) => `${i + 1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.body}\n`,
  ).join('\n');
}
