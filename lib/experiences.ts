export const experiences = [
  {
    id: 'starlink',
    number: '04',
    category: 'Space',
    title: 'How Starlink actually works',
    description:
      'Steer a radio beam. Open the satellite. Follow your data across space and back to Earth.',
    detail: 'Phased arrays · Laser links · Handoffs',
    image: '/images/starlink-preview.webp',
    alt: 'Original 3D Starlink satellite with two solar wings above a photographic Earth',
    href: '/starlink',
    keywords:
      'space starlink spacex satellite internet laser orbit phased array antenna communication radio gateway beam broadband',
  },
  {
    id: 'self-driving',
    number: '03',
    category: 'Vehicles',
    title: 'Inside a self-driving car',
    description:
      'Open the car. Follow camera signals through the computer to steering, braking and propulsion.',
    detail: 'Cameras · Onboard computing · Control',
    image: '/images/self-driving-thumbnail-v1.webp',
    alt: 'Who’s driving? A gold Cybercab cutaway connected to its AI computer — 3D explained.',
    href: '/self-driving',
    keywords:
      'tesla cybercab self driving driverless autonomous ai camera vision pedestrian robotaxi perception prediction planning',
  },
  {
    id: 'engine',
    number: '01',
    category: 'Engines',
    title: 'The four-stroke engine',
    description:
      'Follow the air, watch the spark, and see how four strokes turn fuel into motion.',
    detail: 'Combustion · Moving parts · Oil & cooling',
    image: '/images/engine-thumbnail-v1.webp',
    alt: 'Inside an engine: a detailed cutaway with glowing combustion and moving pistons — interactive 3D.',
    href: '/engine',
    keywords:
      'piston crankshaft intake exhaust fuel gasoline spark combustion oil cooling mechanics motor',
  },
  {
    id: 'car',
    number: '02',
    category: 'Vehicles',
    title: 'Inside the Corolla',
    description:
      'Lift the hood. Peel back the body. Discover the systems that bring a whole car to life.',
    detail: 'Body & chassis · Cabin · Under the hood',
    image: '/images/car-preview.png',
    alt: 'The interactive white Corolla model seen from the front quarter',
    href: '/car',
    keywords:
      'toyota corolla automobile car vehicle suspension brakes tire wheel interior steering',
  },
] as const;
