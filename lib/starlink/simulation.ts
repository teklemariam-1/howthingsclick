export type View =
  | 'overview'
  | 'terminal'
  | 'beam'
  | 'satellite'
  | 'lasers'
  | 'gateway'
  | 'handoff'
  | 'obstruction';
export type Format = 'full' | 'short';
export const EARTH_RADIUS_KM = 6371;
export const LIGHT_KM_S = 299792.458;
export const ORBIT_ALTITUDE_KM = 480;
export const views: { id: View; label: string; subtitle: string }[] = [
  {
    id: 'overview',
    label: 'The whole network',
    subtitle: 'Follow a packet from your home to the internet.',
  },
  {
    id: 'terminal',
    label: 'Your terminal',
    subtitle: 'Radio to space. Wi-Fi inside your home.',
  },
  {
    id: 'beam',
    label: 'Steer the beam',
    subtitle: 'Change the timing. Change the direction.',
  },
  {
    id: 'satellite',
    label: 'Inside the satellite',
    subtitle: 'Antennas, computing, solar power and optical links.',
  },
  {
    id: 'lasers',
    label: 'Laser backbone',
    subtitle: 'A different way across an ocean.',
  },
  {
    id: 'gateway',
    label: 'Back to the internet',
    subtitle: 'Space still connects to infrastructure on Earth.',
  },
  {
    id: 'handoff',
    label: 'The handoff',
    subtitle: 'Satellites move. Your connection changes with them.',
  },
  {
    id: 'obstruction',
    label: 'What blocks the signal?',
    subtitle: 'Your terminal needs an unobstructed view of the sky.',
  },
];
export function clamp(n: number, a = 0, b = 1) {
  return Math.min(b, Math.max(a, n));
}
export function smooth(n: number) {
  n = clamp(n);
  return n * n * (3 - 2 * n);
}
export function orbitalSpeed(altitude = ORBIT_ALTITUDE_KM) {
  return Math.sqrt(398600.4418 / (EARTH_RADIUS_KM + altitude));
}
export function orbitalPeriod(altitude = ORBIT_ALTITUDE_KM) {
  return (2 * Math.PI * (EARTH_RADIUS_KM + altitude)) / orbitalSpeed(altitude);
}
export function propagationMs(distanceKm: number) {
  return (Math.max(0, distanceKm) / LIGHT_KM_S) * 1000;
}
export function phaseDelay(index: number, angleDeg: number) {
  return -Math.PI * index * Math.sin((angleDeg * Math.PI) / 180);
}
export function arrayGain(
  angleDeg: number,
  steeringDeg: number,
  elements = 16,
) {
  const d =
    Math.PI *
    (Math.sin((angleDeg * Math.PI) / 180) -
      Math.sin((steeringDeg * Math.PI) / 180));
  if (Math.abs(d) < 1e-8) return 1;
  return Math.pow(
    Math.sin((elements * d) / 2) / (elements * Math.sin(d / 2)),
    2,
  );
}
export function handoffAt(time: number) {
  const cycle = ((time % 12) + 12) % 12;
  const blend = smooth((cycle - 4) / 3);
  return { blend, active: blend < 0.5 ? 'A' : 'B', cycle };
}
export type Shot = {
  id: string;
  view: View;
  duration: number;
  title: string;
  kicker: string;
  narration: string;
  explode?: number;
  blocked?: boolean;
};
export const fullShots: Shot[] = [
  {
    id: 'hook',
    view: 'overview',
    duration: 9,
    title: 'Your internet. In orbit.',
    kicker: 'HOW STARLINK ACTUALLY WORKS',
    narration:
      'Tap play in the middle of nowhere. Your request can leave Earth, cross space, and come back before you notice. Here is the journey.',
  },
  {
    id: 'terminal',
    view: 'terminal',
    duration: 12,
    title: 'It starts with this flat panel.',
    kicker: '01 / YOUR TERMINAL',
    narration:
      'Your device talks to a Wi-Fi router. A cable connects that router to the outdoor Starlink terminal. The flat panel uses radio waves to reach a satellite moving overhead.',
  },
  {
    id: 'beam',
    view: 'beam',
    duration: 17,
    title: 'The beam moves. The dish stays still.',
    kicker: '02 / ELECTRONIC BEAM STEERING',
    explode: 1,
    narration:
      'The clever part is hidden under the surface: a phased array. Many small antenna elements transmit with carefully shifted timing. Their waves reinforce each other in a chosen direction. Change that timing, and the beam follows the satellite without physically turning the panel.',
  },
  {
    id: 'orbit',
    view: 'overview',
    duration: 12,
    title: 'Closer to Earth. Less distance to travel.',
    kicker: '03 / LOW EARTH ORBIT',
    narration:
      'Starlink operates in low Earth orbit. These satellites move at roughly seven and a half kilometres per second. Shorter signal paths help reduce delay, but routing, congestion and processing also matter.',
  },
  {
    id: 'satellite',
    view: 'satellite',
    duration: 16,
    title: 'A flying network node.',
    kicker: '04 / INSIDE THE SATELLITE',
    explode: 1,
    narration:
      'On the satellite, antennas receive the radio signal. Onboard electronics process and route the traffic. Solar arrays provide electrical power. Optical terminals can send data to other satellites using tightly pointed laser links.',
  },
  {
    id: 'lasers',
    view: 'lasers',
    duration: 16,
    title: 'Some packets take the space route.',
    kicker: '05 / OPTICAL INTER-SATELLITE LINKS',
    narration:
      'Traffic can head down to a gateway, or travel across laser links first. That is especially useful over oceans and remote regions. These glowing lines show the route; the real radio and laser beams are invisible to your eyes.',
  },
  {
    id: 'gateway',
    view: 'gateway',
    duration: 13,
    title: 'The internet is still on Earth.',
    kicker: '06 / GATEWAY + FIBER',
    narration:
      'A ground gateway connects the satellite network to terrestrial networks. Fiber carries the request onward to an internet service. The reply comes back through the network to your terminal, router and device.',
  },
  {
    id: 'handoff',
    view: 'handoff',
    duration: 17,
    title: 'A new satellite takes over.',
    kicker: '07 / KEEPING THE LINK',
    narration:
      'One satellite does not hover above your house. As the sky changes, the network must move your connection between satellites and radio resources. Watch the incoming link take over. This is an illustrative handoff, not a view of Starlink’s private control software.',
  },
  {
    id: 'obstruction',
    view: 'obstruction',
    duration: 16,
    title: 'A tree can break the first link.',
    kicker: '08 / WHY CLEAR SKY MATTERS',
    blocked: true,
    narration:
      'Now put a tree in the signal path. A blocked terminal can lose connectivity even when the satellites and laser network are working. Another visible satellite may help, but clear sky, installation, weather and network conditions all affect service.',
  },
  {
    id: 'round-trip',
    view: 'lasers',
    duration: 12,
    title: 'Radio. Lasers. Fiber. And back.',
    kicker: '09 / ONE CONNECTED NETWORK',
    narration:
      'That is the complete idea: steer a radio beam, route a packet through moving satellites, reach the internet on Earth, and return the response. A coordinated network makes all those moving pieces useful.',
  },
  {
    id: 'explore',
    view: 'overview',
    duration: 10,
    title: 'Now you control the connection.',
    kicker: 'HOWTHINGSCLICK.COM / STARLINK',
    narration:
      'Try it yourself at How Things Click. Open the satellite, steer the beam, and test what happens when you block the sky.',
  },
];
export const shortShots: Shot[] = [
  {
    id: 'hook',
    view: 'overview',
    duration: 5,
    title: 'How does THIS give you internet?',
    kicker: 'STARLINK, IN 60 SECONDS',
    narration:
      'Your next click could go to space. Here is how Starlink makes that happen.',
  },
  {
    id: 'terminal',
    view: 'terminal',
    duration: 7,
    title: 'First stop: your terminal.',
    kicker: 'RADIO TO SPACE',
    narration:
      'Your router sends the request to this flat outdoor terminal. Its radio beam reaches a satellite moving overhead.',
  },
  {
    id: 'beam',
    view: 'beam',
    duration: 10,
    title: 'Steer the waves. Not the dish.',
    kicker: 'PHASED ARRAY',
    explode: 1,
    narration:
      'Under the surface, antenna elements shift their timing. Their waves combine into a beam that follows a satellite, while the panel stays still.',
  },
  {
    id: 'satellite',
    view: 'satellite',
    duration: 9,
    title: 'A router in orbit.',
    kicker: 'ANTENNAS + COMPUTING + POWER',
    explode: 1,
    narration:
      'A few hundred kilometres up, the satellite receives and routes your data. Solar arrays power its electronics. Optical terminals reach other satellites.',
  },
  {
    id: 'lasers',
    view: 'lasers',
    duration: 9,
    title: 'Across space by laser.',
    kicker: 'OPTICAL LINKS',
    narration:
      'Some traffic crosses oceans and remote regions through laser links. Radio then carries it down to a ground gateway.',
  },
  {
    id: 'gateway',
    view: 'gateway',
    duration: 7,
    title: 'Back to the internet.',
    kicker: 'GATEWAY → FIBER → SERVER',
    narration:
      'The gateway connects to networks on Earth. Your reply travels back through the system.',
  },
  {
    id: 'handoff',
    view: 'handoff',
    duration: 8,
    title: 'Moving satellites. Changing links.',
    kicker: 'HANDOFF',
    narration:
      'Satellites keep moving, so your connection changes between them. Clear sky at the terminal still matters.',
  },
  {
    id: 'explore',
    view: 'overview',
    duration: 5,
    title: 'Try the interactive version.',
    kicker: 'HOWTHINGSCLICK.COM / STARLINK',
    narration:
      'Open the satellite and steer the beam yourself at How Things Click.',
  },
];
export const shotsFor = (format: Format) =>
  format === 'short' ? shortShots : fullShots;
export const durationFor = (format: Format) =>
  shotsFor(format).reduce((n, s) => n + s.duration, 0);
export function sampleTour(time: number, format: Format) {
  const shots = shotsFor(format);
  let start = 0;
  let index = shots.length - 1;
  for (let i = 0; i < shots.length; i++) {
    if (time < start + shots[i].duration || i === shots.length - 1) {
      index = i;
      break;
    }
    start += shots[i].duration;
  }
  const shot = shots[index];
  const local = clamp(time - start, 0, shot.duration);
  return {
    shot,
    index,
    start,
    local,
    progress: local / shot.duration,
    explode:
      (shot.explode ?? 0) *
      smooth(local / 1.2) *
      (1 - smooth((local - shot.duration + 2) / 1.2)),
    angle: Math.sin(local * 0.65) * 33,
    blocked: !!shot.blocked && local > 3 && local < shot.duration - 3,
  };
}
export function timecode(seconds: number) {
  const ms = Math.round(Math.max(0, seconds) * 1000);
  return (
    [
      Math.floor(ms / 3600000),
      Math.floor(ms / 60000) % 60,
      Math.floor(ms / 1000) % 60,
    ]
      .map((v) => String(v).padStart(2, '0'))
      .join(':') +
    ',' +
    String(ms % 1000).padStart(3, '0')
  );
}
