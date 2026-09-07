import type { SystemId } from './catalog';
export type TourVariant = 'full' | 'teaser';
type V3 = [number, number, number];
export type TourCamera = {
  target: V3;
  distance: number;
  yaw: number;
  elevation: number;
};
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
    | 'inspect'
    | 'assemble'
    | 'mechanics'
    | 'timing'
    | 'air'
    | 'burn'
    | 'exhaust'
    | 'oil'
    | 'cooling'
    | 'close'
    | 'invite';
  narration: string;
  camera: [TourCamera, TourCamera];
};
const pose = (
  target: V3,
  distance: number,
  yaw: number,
  elevation = 0.36,
): TourCamera => ({ target, distance, yaw, elevation });
// One editorial timeline drives the site, camera, video, captions and voice script.
export const ENGINE_TOUR: TourShot[] = [
  {
    id: 'exterior',
    title: 'What turns a spark into motion?',
    duration: 8,
    system: 'all',
    part: null,
    view: 'exterior',
    narration:
      'A tiny spark. A moving piston. A car pulling away. Let’s open this engine and connect the dots.',
    camera: [pose([0, 1.5, 0], 16, -0.9), pose([0, 1.7, 0], 13, -0.55)],
  },
  {
    id: 'peel',
    title: 'Lift the covers.',
    duration: 12,
    system: 'all',
    part: 'cam-intake',
    view: 'peel',
    narration:
      'First, lift the covers. Above the cylinders sit two camshafts. Along the end, a chain links them to the crankshaft. Below, the sump holds the oil.',
    camera: [pose([0, 3.5, 0], 26, -0.65, 0.6), pose([0, 4, 0], 24, -1.1, 0.5)],
  },
  {
    id: 'explode',
    title: 'Take the engine apart.',
    duration: 16,
    system: 'all',
    part: null,
    view: 'explode',
    narration:
      'Now pull the assemblies apart. Covers, cylinder head, pistons, crankshaft: each has a place. Look between the big pieces. Those thin gaskets and small bearings are just as important. This is an exploded explanation, not a repair sequence.',
    camera: [pose([0, 2.8, 0], 37, -0.9, 0.45), pose([0, 2.8, 0], 35, -0.25, 0.4)],
  },
  {
    id: 'inspect',
    title: 'A closer look at one piston.',
    duration: 12,
    system: 'mechanics',
    part: 'piston-1',
    view: 'inspect',
    narration:
      'Pick one piston and look closer. Its crown receives the force from expanding gas. The skirt helps guide its travel inside the cylinder. A small component, carrying a remarkable load.',
    camera: [
      pose([-1.6, 4.1, -4.294], 6, -0.75, 0.3),
      pose([-1.6, 4.1, -4.294], 4.2, -0.15, 0.22),
    ],
  },
  {
    id: 'assemble',
    title: 'Put every assembly back.',
    duration: 10,
    system: 'all',
    part: null,
    view: 'assemble',
    narration:
      'Bring the pieces home. The head seals the cylinders, the covers close the engine, and the mechanism is ready to move again.',
    camera: [
      pose([0, 2.8, 0], 36, -0.65, 0.45),
      pose([0, 1.7, 0], 15, -0.6, 0.35),
    ],
  },
  {
    id: 'mechanics',
    title: 'Up and down becomes rotation.',
    duration: 16,
    system: 'mechanics',
    part: 'crank',
    view: 'mechanics',
    narration:
      'Watch the connecting rods follow the crankpins. Each piston moves up and down, while the crankshaft turns. The cylinders take turns firing: one, three, four, two. Their power strokes keep handing the motion from one cylinder to the next.',
    camera: [
      pose([0, 1.1, 0], 12, -0.65, 0.25),
      pose([0, 0.8, -0.8], 8.5, -0.25, 0.18),
    ],
  },
  {
    id: 'timing',
    title: 'The valves have to keep time.',
    duration: 14,
    system: 'timing',
    part: 'timing',
    view: 'timing',
    narration:
      'Zoom in on the timing chain. In this four-stroke engine, the crankshaft turns twice for every camshaft revolution. The cam lobes open the valves; springs close them. Timing makes the whole sequence possible.',
    camera: [
      pose([0, 2, -2.2], 11, -1.4, 0.25),
      pose([0, 1.8, -2.7], 9, -1.1, 0.3),
    ],
  },
  {
    id: 'air',
    title: 'Follow the fresh charge.',
    duration: 14,
    system: 'combustion',
    part: 'throttle',
    view: 'air',
    narration:
      'Follow the cyan air through the intake. The throttle controls the opening, and the intake valves admit the fresh charge. Pink traces the fuel paths. Air and fuel must meet before combustion can do useful work.',
    camera: [
      pose([-1, 2, 1.5], 13, -2.7, 0.5),
      pose([-0.8, 2.3, 1.4], 10, -2.25, 0.4),
    ],
  },
  {
    id: 'burn',
    title: 'One cylinder. Four strokes.',
    duration: 18,
    system: 'combustion',
    part: 'piston-1',
    view: 'burn',
    narration:
      'Let’s slow down and stay with one cylinder. Intake draws the fresh charge in. Compression squeezes it. Near the top, the spark begins combustion. Expanding gas pushes the piston down: the power stroke. Finally, exhaust clears the cylinder for the next cycle.',
    camera: [
      pose([0, 2, -1.7], 10, -0.9, 0.3),
      pose([0, 2.2, -1.965], 7.4, -0.4, 0.22),
    ],
  },
  {
    id: 'exhaust',
    title: 'Clear the cylinder. Start again.',
    duration: 12,
    system: 'combustion',
    part: 'exhaust',
    view: 'exhaust',
    narration:
      'The exhaust valve opens and the rising piston pushes spent gas out. Follow the violet path toward the exhaust manifold. Then the next intake stroke starts the cycle again.',
    camera: [
      pose([1, 2.4, 0], 12, -0.2, 0.4),
      pose([1.1, 2.4, -0.7], 9, 0.25, 0.3),
    ],
  },
  {
    id: 'oil',
    title: 'The moving parts need an oil film.',
    duration: 18,
    system: 'oil',
    part: 'oil-pump',
    view: 'oil',
    narration:
      'Now switch to the amber oil circuit. The pump draws oil from the sump and sends it through the filter. Galleries carry it to the bearings and cylinder head. The oil film reduces contact between moving surfaces before the oil drains back down.',
    camera: [
      pose([0.3, 0.4, 0], 12, -0.8, 0.2),
      pose([0.3, 1.2, 0], 9.5, -0.15, 0.3),
    ],
  },
  {
    id: 'cooling',
    title: 'Give the heat a route out.',
    duration: 20,
    system: 'cooling',
    part: 'thermostat',
    view: 'cooling',
    narration:
      'Combustion also produces heat. Follow the blue coolant around the cylinders and through the head. While the engine is cold, the bypass keeps coolant circulating. As it warms, the thermostat opens the radiator route. Heat can then pass from the coolant into the surrounding air.',
    camera: [
      pose([-1.5, 1.4, 0.5], 15, -2.55, 0.5),
      pose([-2, 1.1, 0.5], 12.5, -2.05, 0.38),
    ],
  },
  {
    id: 'close',
    title: 'Separate systems. One working engine.',
    duration: 14,
    system: 'all',
    part: null,
    view: 'close',
    narration:
      'Pull back and close the covers. The engine works because its systems work together: timed motion, a fresh charge, combustion, lubrication and cooling. We have slowed and simplified their behavior so you can see the relationships.',
    camera: [
      pose([0, 3.5, 0], 26, -0.55, 0.5),
      pose([0, 1.6, 0], 14, -0.95, 0.35),
    ],
  },
  {
    id: 'invite',
    title: 'Now change something yourself.',
    duration: 16,
    system: 'combustion',
    part: 'throttle',
    view: 'invite',
    narration:
      'But what changes when you move the throttle? That part is yours to explore. Open How Things Click, rotate the engine, remove a part, and trace the flows yourself. The link to the interactive is in the description.',
    camera: [
      pose([-0.4, 1.8, 0], 14, -0.95, 0.4),
      pose([-0.4, 1.8, 0], 12, -0.6, 0.34),
    ],
  },
];
const teaser = [
  {
    ...ENGINE_TOUR[0],
    duration: 6,
    narration:
      'What turns a tiny spark into motion? Let’s pull an engine apart.',
  },
  {
    ...ENGINE_TOUR[2],
    duration: 12,
    narration:
      'The covers lift. The cylinder head separates. Pistons, rods and crankshaft come into view. Every assembly has a job. Now bring them together and look inside.',
  },
  {
    ...ENGINE_TOUR[4],
    duration: 8,
    narration:
      'The parts return to their places. Ready? Watch the motion, then follow the colors.',
  },
  {
    ...ENGINE_TOUR[8],
    duration: 18,
    narration:
      'Cyan air enters. Pink marks the fuel. Compression squeezes the charge, a spark starts combustion, and expanding gas pushes the piston down. Violet shows the exhaust leaving. Four strokes, repeated across four cylinders.',
  },
  {
    ...ENGINE_TOUR[13],
    duration: 11,
    narration:
      'What happens when you move the throttle? Try the interactive at How Things Click. Rotate it, remove a part, and follow the flow. Link in the description.',
  },
] satisfies TourShot[];
export const tourShots = (variant: TourVariant) =>
  variant === 'full' ? ENGINE_TOUR : teaser;
export const tourDuration = (variant: TourVariant) =>
  tourShots(variant).reduce((sum, s) => sum + s.duration, 0);
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function mixCamera(a: TourCamera, b: TourCamera, t: number): TourCamera {
  return {
    target: a.target.map((x, i) => mix(x, b.target[i], t)) as V3,
    distance: mix(a.distance, b.distance, t),
    yaw: mix(a.yaw, b.yaw, t),
    elevation: mix(a.elevation, b.elevation, t),
  };
}
export function sampleTour(seconds: number, variant: TourVariant = 'full') {
  const shots = tourShots(variant);
  let start = 0,
    index = 0;
  for (let i = 0; i < shots.length; i++) {
    index = i;
    if (seconds < start + shots[i].duration || i === shots.length - 1) break;
    start += shots[i].duration;
  }
  const shot = shots[index],
    u = clamp((seconds - start) / shot.duration),
    local = seconds - start;
  const previous = index ? shots[index - 1].camera[1] : shot.camera[0];
  // Ease into the new framing, then push closer and hold briefly for comprehension.
  const camera =
    local < 1.4
      ? mixCamera(previous, shot.camera[0], smooth(local / 1.4))
      : mixCamera(
          shot.camera[0],
          shot.camera[1],
          smooth((local - 1.4) / (shot.duration - 2.8)),
        );
  const cutaway = [
    'mechanics',
    'timing',
    'air',
    'burn',
    'exhaust',
    'oil',
    'cooling',
    'invite',
  ].includes(shot.view);
  const explode =
    shot.view === 'explode'
      ? smooth(u / 0.65)
      : shot.view === 'inspect'
        ? 1
        : shot.view === 'assemble'
          ? 1 - smooth(u / 0.76)
          : 0;
  return {
    shot,
    index,
    start,
    u,
    camera,
    done: seconds >= tourDuration(variant),
    explode,
    peel:
      shot.view === 'peel'
        ? smooth(u / 0.7)
        : shot.view === 'explode' || shot.view === 'inspect'
          ? 1
          : shot.view === 'assemble'
            ? 1 - smooth(u / 0.76)
            : shot.view === 'close'
              ? 1 - smooth(u / 0.72)
              : 0,
    isolated: shot.view === 'inspect',
    cutaway,
    warm: shot.view !== 'cooling' || u > 0.46,
    throttle: 0.32,
    // A complete, deliberately slow four-stroke cycle for the close-up.
    cycle:
      shot.view === 'burn'
        ? (360 + u * 720) % 720
        : explode > 0.001
          ? 28
          : (seconds * 110) % 720,
  };
}
export type CaptionCue = { start: number; end: number; text: string };
export function tourCaptions(variant: TourVariant): CaptionCue[] {
  let start = 0;
  const cues: CaptionCue[] = [];
  for (const shot of tourShots(variant)) {
    const words = shot.narration.split(/\s+/);
    const chunks: string[][] = [];
    for (let i = 0; i < words.length; i += 10)
      chunks.push(words.slice(i, i + 10));
    const end = start + shot.duration;
    for (const chunk of chunks) {
      const next = start + (shot.duration * chunk.length) / words.length;
      cues.push({ start, end: Math.min(next, end), text: chunk.join(' ') });
      start = next;
    }
    start = end;
  }
  return cues;
}
export function captionAt(seconds: number, variant: TourVariant) {
  return (
    tourCaptions(variant).find((c) => seconds >= c.start && seconds < c.end)
      ?.text ?? ''
  );
}
function srtTime(seconds: number) {
  const ms = Math.round(seconds * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
}
export function exportSrt(variant: TourVariant) {
  return tourCaptions(variant)
    .map(
      (c, i) =>
        `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`,
    )
    .join('\n');
}
export function exportScript(variant: TourVariant) {
  let start = 0;
  return [
    'HOW THINGS CLICK — ENGINE',
    `${tourDuration(variant)} seconds. Voice direction: warm, curious, conversational English. Clear emphasis on the mechanism; allow short pauses for the close-ups. Avoid a trailer-style shout.`,
    'Record each passage into its time window below. Leave remaining time as a visual pause. A single continuous voice file must include those pauses to stay synchronized. Captions use editorial timing; retime them to the final voice performance if needed.',
    ...tourShots(variant).map((s) => {
      const line = `[${srtTime(start)} – ${srtTime(start + s.duration)}] ${s.title}\n${s.narration}`;
      start += s.duration;
      return line;
    }),
  ].join('\n\n');
}
