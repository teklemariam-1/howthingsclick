export const experiences = [
  {
    id: 'engine',
    number: '01',
    category: 'Engines',
    title: 'The four-stroke engine',
    description:
      'Follow the air, watch the spark, and see how four strokes turn fuel into motion.',
    detail: 'Combustion · Moving parts · Oil & cooling',
    image: '/images/engine-exploded.png',
    alt: 'The actual four-cylinder engine model with its assemblies separated',
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
