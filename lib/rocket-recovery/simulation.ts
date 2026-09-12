export type Vehicle = 'falcon9' | 'superheavy';
export type View = 'recovery' | 'fins' | 'engines' | 'hardware' | 'earth';
export type Outcome =
  | 'descending'
  | 'landed'
  | 'caught'
  | 'hard-contact'
  | 'missed';
export type Settings = {
  vehicle: Vehicle;
  automatic: boolean;
  ignitionHeight: number;
  wind: number;
  guidance: boolean;
};
export type Frame = {
  t: number;
  altitude: number;
  velocity: number;
  x: number;
  vx: number;
  throttle: number;
  fuel: number;
  gimbal: number;
  fin: number;
  outcome: Outcome;
};
export type Flight = {
  frames: Frame[];
  duration: number;
  contactTime: number;
  ignition: number;
  outcome: Outcome;
  impactSpeed: number;
  missDistance: number;
};
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const specs = {
  falcon9: {
    name: 'Falcon 9',
    subtitle: 'Drone-ship landing',
    mass: 30000,
    dryMass: 25600,
    maxThrust: 820000,
    minThrottle: 0.4,
    radius: 1.85,
    bodyHeight: 42,
    contactHeight: 3.4,
    tolerance: 4,
    engines: 9,
  },
  superheavy: {
    name: 'Super Heavy',
    subtitle: 'Tower catch · Flight 5 reference',
    mass: 220000,
    dryMass: 189000,
    maxThrust: 6800000,
    minThrottle: 0.4,
    radius: 4.5,
    bodyHeight: 71,
    contactHeight: 12.2,
    tolerance: 0.9,
    engines: 33,
  },
} as const;
export const defaultSettings: Settings = {
  vehicle: 'superheavy',
  automatic: true,
  ignitionHeight: 180,
  wind: 0,
  guidance: true,
};

/** Reduced-order final-approach teaching model. Values are illustrative, not SpaceX telemetry.
 * Metres, seconds, kg, N. Positive altitude is distance above the final support interface.
 * A feed-forward deceleration plus velocity feedback guides a powered descent; thrust saturates.
 * The resolved contact speed is interpolated to the support plane, not measured after penetration.
 */
export function simulate(settings: Settings): Flight {
  const cfg = specs[settings.vehicle],
    dt = 1 / 120,
    frames: Frame[] = [];
  const wind = clamp(settings.wind, -20, 20),
    ignitionHeight = clamp(settings.ignitionHeight, 20, 250);
  let altitude = 260,
    velocity = -48,
    x = 16,
    vx = -1,
    mass: number = cfg.mass,
    t = 0,
    ignited = false,
    ignition = -1,
    throttle = 0,
    gimbal = 0,
    fin = 0;
  let outcome: Outcome = 'descending',
    impactSpeed = 0,
    contactTime = 0;
  const frame = (): Frame => ({
    t,
    altitude,
    velocity,
    x,
    vx,
    throttle,
    fuel: clamp((mass - cfg.dryMass) / (cfg.mass - cfg.dryMass)),
    gimbal,
    fin,
    outcome,
  });
  frames.push(frame());
  for (let i = 0; i < 3600; i++) {
    const previous = { altitude, velocity, x, vx, t };
    const threshold = settings.automatic
      ? (velocity * velocity) / (2 * 12) + 35
      : ignitionHeight;
    if (!ignited && altitude <= threshold) {
      ignited = true;
      ignition = altitude;
    }
    const targetVelocity = -Math.sqrt(10 * Math.max(altitude, 0) + 0.25);
    throttle =
      ignited && mass > cfg.dryMass
        ? clamp(
            (mass * (9.81 + 5 + (targetVelocity - velocity) * 3)) /
              cfg.maxThrust,
            cfg.minThrottle,
            1,
          )
        : 0;
    const windAcceleration = wind * 0.075;
    const correction = settings.guidance
      ? clamp(-0.48 * x - 1.4 * vx - windAcceleration, -3.2, 3.2)
      : 0;
    const lateral = throttle > 0 ? correction : clamp(correction, -1, 1);
    gimbal =
      throttle > 0 ? Math.atan2(lateral, (throttle * cfg.maxThrust) / mass) : 0;
    fin = clamp(correction / 3.2, -1, 1) * 0.45;
    vx += (windAcceleration + lateral) * dt;
    x += vx * dt;
    velocity +=
      (((throttle * cfg.maxThrust) / mass) * Math.cos(gimbal) - 9.81) * dt;
    altitude += velocity * dt;
    mass = Math.max(
      cfg.dryMass,
      mass - ((throttle * cfg.maxThrust) / (300 * 9.81)) * dt,
    );
    t += dt;
    if (altitude <= 0) {
      const f = clamp(previous.altitude / (previous.altitude - altitude));
      t = mix(previous.t, t, f);
      x = mix(previous.x, x, f);
      vx = mix(previous.vx, vx, f);
      velocity = mix(previous.velocity, velocity, f);
      altitude = 0;
      impactSpeed = Math.abs(velocity);
      contactTime = t;
      outcome =
        Math.abs(x) > cfg.tolerance || Math.abs(vx) > 1.8
          ? 'missed'
          : impactSpeed > 3
            ? 'hard-contact'
            : settings.vehicle === 'falcon9'
              ? 'landed'
              : 'caught';
      throttle = 0;
      frames.push(frame());
      break;
    }
    if (i % 4 === 3) frames.push(frame());
  }
  if (outcome === 'descending') {
    outcome = 'missed';
    contactTime = t;
    frames.push(frame());
  }
  frames.push({
    ...frame(),
    t: t + 2.5,
    velocity: 0,
    vx: 0,
    gimbal: 0,
    fin: 0,
  });
  return {
    frames,
    duration: t + 2.5,
    contactTime,
    ignition,
    outcome,
    impactSpeed,
    missDistance: Math.abs(x),
  };
}
export function sampleFlight(flight: Flight, time: number): Frame {
  const frames = flight.frames,
    t = clamp(time, 0, flight.duration);
  let low = 0,
    high = frames.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (frames[mid].t <= t) low = mid;
    else high = mid - 1;
  }
  const a = frames[low],
    b = frames[Math.min(low + 1, frames.length - 1)],
    f = b.t === a.t ? 0 : clamp((t - a.t) / (b.t - a.t));
  return {
    t,
    altitude: mix(a.altitude, b.altitude, f),
    velocity: mix(a.velocity, b.velocity, f),
    x: mix(a.x, b.x, f),
    vx: mix(a.vx, b.vx, f),
    throttle: mix(a.throttle, b.throttle, f),
    fuel: mix(a.fuel, b.fuel, f),
    gimbal: mix(a.gimbal, b.gimbal, f),
    fin: mix(a.fin, b.fin, f),
    outcome: a.outcome,
  };
}
export const views: { id: View; name: string; description: string }[] = [
  {
    id: 'recovery',
    name: 'Recovery',
    description:
      'Follow the final approach from falling flight to a supported booster.',
  },
  {
    id: 'fins',
    name: 'Grid fins',
    description:
      'Air through the lattice produces a steering force. Fins help orient the descending booster in the atmosphere.',
  },
  {
    id: 'engines',
    name: 'Thrust & steering',
    description:
      'A gimballed engine redirects thrust. The computer adjusts direction and power to remove velocity and position error.',
  },
  {
    id: 'earth',
    name: 'Earth & sites',
    description:
      'Explore Earth with NASA imagery. Starbase sits on the Texas coast; Falcon 9 also lands on drone ships far offshore. The Atlantic marker is illustrative, not a fixed recovery position.',
  },
  {
    id: 'hardware',
    name: 'Legs & catch',
    description:
      'Falcon 9 unfolds landing legs. The tower supports Super Heavy at dedicated catch interfaces below the fins.',
  },
];
export const shortShots = [
  {
    id: 'hook',
    start: 0,
    end: 5,
    vehicle: 'superheavy',
    view: 'recovery',
    label: 'Catch a falling rocket',
    voice: 'This tower just caught a rocket. How does it avoid disaster?',
  },
  {
    id: 'fall',
    start: 5,
    end: 12,
    vehicle: 'falcon9',
    view: 'recovery',
    label: 'First, remove the speed',
    voice:
      'Coming home means killing speed. Fire too late, and even full thrust cannot save the landing.',
  },
  {
    id: 'fins',
    start: 12,
    end: 20,
    vehicle: 'falcon9',
    view: 'fins',
    label: 'Steer through the air',
    voice:
      'These grid fins bite into the air. Sensors track every movement, and the computer keeps correcting the path.',
  },
  {
    id: 'engines',
    start: 20,
    end: 29,
    vehicle: 'falcon9',
    view: 'engines',
    label: 'Point the thrust',
    voice:
      'Near the ground, the engine tilts. Its thrust pushes the booster sideways as the landing burn bleeds off speed.',
  },
  {
    id: 'legs',
    start: 29,
    end: 37,
    vehicle: 'falcon9',
    view: 'hardware',
    label: 'Four legs. One landing.',
    voice:
      'Falcon Nine unfolds four legs. The engine does the braking. Only after touchdown do the legs carry the rocket.',
  },
  {
    id: 'catch',
    start: 37,
    end: 47,
    vehicle: 'superheavy',
    view: 'hardware',
    label: 'The tower takes the load',
    voice:
      'Super Heavy takes a different route. The tower supports two dedicated catch points, not the grid fins. The engines shut down. The tower takes the weight.',
  },
  {
    id: 'challenge',
    start: 47,
    end: 55,
    vehicle: 'falcon9',
    view: 'recovery',
    label: 'Try changing the timing',
    voice:
      'A little more wind. A later ignition. Suddenly, that perfect return becomes a missed landing. Can you get the timing right?',
  },
  {
    id: 'explore',
    start: 55,
    end: 60,
    vehicle: 'superheavy',
    view: 'recovery',
    label: 'Your turn to land it',
    voice:
      'Land it yourself. Try the interactive lab at How Things Click dot com.',
  },
] as const;
export const SHORT_DURATION = 60;
export function sampleShort(time: number) {
  const t = clamp(time, 0, SHORT_DURATION);
  const shot =
    shortShots.find((s) => t < s.end) ?? shortShots[shortShots.length - 1];
  return {
    shot,
    local: clamp((t - shot.start) / (shot.end - shot.start)),
    time: t,
  };
}
