import type { SystemId } from './catalog';
export type TourShot = {
  id: string;
  title: string;
  duration: number;
  system: SystemId;
  part: string | null;
  view:
    | 'exterior'
    | 'peel'
    | 'explode'
    | 'assemble'
    | 'mechanics'
    | 'air'
    | 'oil'
    | 'cooling'
    | 'invite';
  narration: string;
};
// A single shot list drives the exhibit, recording, narration and subtitle export.
export const ENGINE_TOUR: TourShot[] = [
  {
    id: 'exterior',
    title: 'One engine. Many systems.',
    duration: 9,
    system: 'all',
    part: null,
    view: 'exterior',
    narration:
      'An engine is more than four moving pistons. Inside these covers, air, fuel, oil and coolant each follow a different path.',
  },
  {
    id: 'peel',
    title: 'First, lift the covers.',
    duration: 10,
    system: 'all',
    part: null,
    view: 'peel',
    narration:
      'Lift the acoustic cover to reveal the ignition coils and cam cover. The aluminium front cover encloses the timing chain. Below, the crankcase and sump surround the crankshaft.',
  },
  {
    id: 'explode',
    title: 'Every assembly has a place.',
    duration: 12,
    system: 'all',
    part: null,
    view: 'explode',
    narration:
      'Separate the engine into its assemblies. Notice the gaskets, ring packs, wrist pins, bearing caps and fasteners between the larger parts.',
  },
  {
    id: 'assemble',
    title: 'Bring it all together.',
    duration: 9,
    system: 'all',
    part: null,
    view: 'assemble',
    narration:
      'Reassembly restores the same relationships. Motion waits until the engine is back together. This exploded view explains the structure; it is not a service procedure.',
  },
  {
    id: 'mechanics',
    title: 'Four cylinders. One crankshaft.',
    duration: 12,
    system: 'mechanics',
    part: 'piston-1',
    view: 'mechanics',
    narration:
      'Each piston connects to an offset crankpin through a connecting rod. The four cylinders fire in the order one, three, four, two.',
  },
  {
    id: 'air',
    title: 'Follow the air. Then the fuel.',
    duration: 15,
    system: 'combustion',
    part: 'throttle',
    view: 'air',
    narration:
      'Air passes through the filter and throttle. Pink fuel paths show port and direct injection. Compression prepares the mixture, a spark starts combustion, and the exhaust valves release the spent gases.',
  },
  {
    id: 'oil',
    title: 'Oil supports the moving surfaces.',
    duration: 12,
    system: 'oil',
    part: 'oil-pump',
    view: 'oil',
    narration:
      'Amber traces the oil from the sump through the pump and filter. Branches supply the bearings and cylinder head, then oil drains back to the reservoir.',
  },
  {
    id: 'cooling',
    title: 'Carry the heat away.',
    duration: 13,
    system: 'cooling',
    part: 'thermostat',
    view: 'cooling',
    narration:
      'Blue coolant circulates through the engine. When cold, the bypass supports circulation. When warm, the thermostat opens the radiator route, where heat passes into the air.',
  },
  {
    id: 'invite',
    title: 'Now you have the controls.',
    duration: 8,
    system: 'combustion',
    part: null,
    view: 'invite',
    narration:
      'What changes when you open the throttle? Take control, change the opening, and follow the flow yourself at How Things Click.',
  },
];
export type TourVariant = 'full' | 'teaser';
export function tourShots(variant: TourVariant) {
  return variant === 'full'
    ? ENGINE_TOUR
    : ENGINE_TOUR.filter((s) =>
        ['exterior', 'peel', 'explode', 'assemble', 'air', 'invite'].includes(
          s.id,
        ),
      );
}
export function tourDuration(variant: TourVariant) {
  return tourShots(variant).reduce((sum, s) => sum + s.duration, 0);
}
export function sampleTour(seconds: number, variant: TourVariant = 'full') {
  const shots = tourShots(variant);
  let start = 0;
  let index = 0;
  for (let i = 0; i < shots.length; i++) {
    index = i;
    if (seconds < start + shots[i].duration || i === shots.length - 1) break;
    start += shots[i].duration;
  }
  const shot = shots[index],
    u = Math.max(0, Math.min(1, (seconds - start) / shot.duration));
  const smooth = (t: number) => {
    const v = Math.max(0, Math.min(1, t));
    return v * v * (3 - 2 * v);
  };
  return {
    shot,
    index,
    start,
    u,
    done: seconds >= tourDuration(variant),
    explode:
      shot.view === 'explode'
        ? smooth(u * 1.6)
        : shot.view === 'assemble'
          ? 1 - smooth(u * 1.4)
          : 0,
    peel: shot.view === 'peel' ? smooth(u * 1.5) : 0,
    cutaway: ['mechanics', 'air', 'oil', 'cooling', 'invite'].includes(
      shot.view,
    ),
    warm: shot.view !== 'cooling' || u > 0.42,
    // Demonstration speed stays separate from throttle. No torque/RPM claim.
    throttle: shot.view === 'air' ? 0.32 : shot.view === 'invite' ? 0.32 : 0.22,
  };
}
function srtTime(seconds: number) {
  const ms = Math.round(seconds * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
}
export function exportSrt(variant: TourVariant) {
  let start = 0;
  let index = 0;
  return tourShots(variant)
    .flatMap((s) => {
      const sentences = s.narration.match(/[^.!?]+[.!?]+/g) || [s.narration];
      const total = sentences.reduce((n, x) => n + x.length, 0);
      return sentences.map((sentence) => {
        const end = start + (s.duration * sentence.length) / total;
        const cue = `${++index}\n${srtTime(start)} --> ${srtTime(end)}\n${sentence.trim()}\n`;
        start = end;
        return cue;
      });
    })
    .join('\n');
}
export function exportScript(variant: TourVariant) {
  return tourShots(variant)
    .map((s) => `${s.title}\n${s.narration}`)
    .join('\n\n');
}
