export type SystemId =
  | 'all'
  | 'mechanics'
  | 'timing'
  | 'combustion'
  | 'oil'
  | 'cooling';
export type Part = {
  id: string;
  name: string;
  system: SystemId;
  description: string;
  material: string;
  assembly: string;
  removable?: boolean;
};
export const SYSTEMS = [
  {
    id: 'all',
    name: 'Whole engine',
    eyebrow: 'THE COMPLETE ASSEMBLY',
    title: 'A little combustion. A lot of motion.',
    description:
      'Explore the mechanisms inside an inline-four petrol engine. Drag to rotate, select a part, or reveal an entire system.',
  },
  {
    id: 'mechanics',
    name: 'Moving parts',
    eyebrow: 'THE CYCLE IN MOTION',
    title: 'Follow the mixture. Watch the motion.',
    description:
      'Cyan air and pink fuel enter, orange combustion drives the piston, and violet exhaust leaves. Pause or scrub to follow one cylinder. Explore lubrication separately in Oil circulation.',
  },
  {
    id: 'timing',
    name: 'Valves & timing',
    eyebrow: 'EVERYTHING IN TIME',
    title: 'The right valve. At the right moment.',
    description:
      'The timing drive keeps the camshafts synchronized with the crankshaft. The cams open the valves against their springs.',
  },
  {
    id: 'combustion',
    name: 'Air, fuel & spark',
    eyebrow: 'THE FOUR-STROKE CYCLE',
    title: 'One cycle. Four distinct strokes.',
    description:
      'Follow intake, compression, power and exhaust. Pause the engine and move the cycle control to inspect any instant.',
  },
  {
    id: 'oil',
    name: 'Oil circulation',
    eyebrow: 'THE LUBRICATION CIRCUIT',
    title: 'Follow the oil to the moving surfaces.',
    description:
      'The pump draws oil from the sump, through the filter and into supply galleries. Branches feed the bearings and cylinder head; oil drains back to the sump.',
  },
  {
    id: 'cooling',
    name: 'Cooling circuit',
    eyebrow: 'MOVING HEAT AWAY',
    title: 'Inside the engine’s cooling passages.',
    description:
      'Coolant circulates around the cylinders and through the head. In a warm engine, the thermostat opens a route through the radiator.',
  },
] as const;
const structure: Part[] = [
  {
    id: 'block',
    name: 'Cylinder block',
    system: 'mechanics',
    assembly: 'Structure',
    material: 'Cast aluminium',
    description:
      'The structural body holds the cylinders and supports the crankshaft. The cutaway exposes the bores and internal passages.',
    removable: true,
  },
  {
    id: 'head',
    name: 'Cylinder head',
    system: 'timing',
    assembly: 'Cylinder head',
    material: 'Cast aluminium',
    description:
      'The head closes the cylinders and contains the valves, ports, spark plugs and camshaft supports.',
    removable: true,
  },
  {
    id: 'cover',
    name: 'Cam cover',
    system: 'timing',
    assembly: 'Cylinder head',
    material: 'Moulded composite / aluminium',
    description:
      'This cover encloses the camshafts and keeps lubricating oil inside the cylinder head.',
    removable: true,
  },
  {
    id: 'sump',
    name: 'Oil sump',
    system: 'oil',
    assembly: 'Lubrication',
    material: 'Cast aluminium',
    description:
      'Oil returning from the engine collects here. The pickup draws oil from this reservoir.',
    removable: true,
  },
  {
    id: 'crank',
    name: 'Crankshaft',
    system: 'mechanics',
    assembly: 'Rotating assembly',
    material: 'Forged steel',
    description:
      'Offset crankpins connect to the rods. Main journals support rotation, and counterweights help balance the moving assembly.',
    removable: true,
  },
  {
    id: 'flywheel',
    name: 'Flywheel & ring gear',
    system: 'mechanics',
    assembly: 'Rotating assembly',
    material: 'Steel',
    description:
      'Rotational inertia smooths power delivery. The outer ring gear provides a connection for the starter motor.',
    removable: true,
  },
  {
    id: 'cam-intake',
    name: 'Intake camshaft',
    system: 'timing',
    assembly: 'Valve train',
    material: 'Hardened steel',
    description:
      'The inlet cams open the intake valves. The camshaft makes one revolution for each two crankshaft revolutions.',
    removable: true,
  },
  {
    id: 'cam-exhaust',
    name: 'Exhaust camshaft',
    system: 'timing',
    assembly: 'Valve train',
    material: 'Hardened steel',
    description:
      'The exhaust cams open the exhaust valves to let the spent gases leave.',
    removable: true,
  },
  {
    id: 'timing',
    name: 'Timing chain & guides',
    system: 'timing',
    assembly: 'Valve train',
    material: 'Hardened steel / polymer guides',
    description:
      'The chain maintains the crank-to-cam relationship inside a sealed cover. Guides and a tensioner support the chain; valve timing is simplified in this model.',
    removable: true,
  },
  {
    id: 'intake',
    name: 'Intake manifold',
    system: 'combustion',
    assembly: 'Air & fuel',
    material: 'Composite / aluminium',
    description:
      'Four runners deliver intake air to the inlet ports. Port injectors introduce fuel before the inlet valves.',
    removable: true,
  },
  {
    id: 'exhaust',
    name: 'Exhaust manifold',
    system: 'combustion',
    assembly: 'Exhaust',
    material: 'Stainless steel',
    description:
      'The manifold collects exhaust flow from the cylinders into a common outlet.',
    removable: true,
  },
  {
    id: 'rail',
    name: 'Fuel rail & injectors',
    system: 'combustion',
    assembly: 'Air & fuel',
    material: 'Aluminium / steel',
    description:
      'The rail supplies the four port injectors, one upstream of each cylinder’s inlet valves.',
    removable: true,
  },
  {
    id: 'oil-pump',
    name: 'Oil pump & pickup',
    system: 'oil',
    assembly: 'Lubrication',
    material: 'Aluminium housing / steel rotors',
    description:
      'A positive-displacement pump supplies oil to the lubrication circuit. The pickup screen helps keep larger debris out of the pump.',
    removable: true,
  },
  {
    id: 'oil-filter',
    name: 'Oil filter',
    system: 'oil',
    assembly: 'Lubrication',
    material: 'Steel shell / filter medium',
    description:
      'The filter removes particles from circulating oil. The highlighted route illustrates the supply circuit.',
    removable: true,
  },
  {
    id: 'water-pump',
    name: 'Coolant pump',
    system: 'cooling',
    assembly: 'Cooling',
    material: 'Aluminium / steel',
    description:
      'The rotating impeller circulates coolant through the engine and its connected cooling circuit.',
    removable: true,
  },
  {
    id: 'radiator',
    name: 'Radiator & fan',
    system: 'cooling',
    assembly: 'Cooling',
    material: 'Aluminium / polymer',
    description:
      'Heat moves from the coolant into the radiator and then into the surrounding air. The fan supports airflow.',
    removable: true,
  },
  {
    id: 'thermostat',
    name: 'Thermostat housing',
    system: 'cooling',
    assembly: 'Cooling',
    material: 'Aluminium / brass',
    description:
      'When warm, the thermostat opens the radiator route. The cold-state view shows an illustrative bypass circuit.',
    removable: true,
  },
  {
    id: 'starter',
    name: 'Starter motor',
    system: 'mechanics',
    assembly: 'Starting',
    material: 'Steel / aluminium',
    description:
      'The starter turns the crankshaft through the flywheel ring gear during cranking. Its internal drive is not modeled in this version.',
    removable: true,
  },
];
export const PARTS: Part[] = [...structure];
for (let n = 1; n <= 4; n++)
  PARTS.push(
    {
      id: `piston-${n}`,
      name: `Cylinder ${n} · piston & rings`,
      system: 'mechanics',
      assembly: `Cylinder ${n}`,
      material: 'Aluminium / steel rings',
      description:
        'The piston slides inside the cylinder. Its rings help seal the chamber and control the oil film on the cylinder wall.',
      removable: true,
    },
    {
      id: `rod-${n}`,
      name: `Cylinder ${n} · connecting rod`,
      system: 'mechanics',
      assembly: `Cylinder ${n}`,
      material: 'Forged steel',
      description:
        'The small end pivots on the wrist pin; the big end turns on a crankpin. The rod links the piston to the crankshaft.',
      removable: true,
    },
    {
      id: `plug-${n}`,
      name: `Cylinder ${n} · spark plug`,
      system: 'combustion',
      assembly: `Cylinder ${n}`,
      material: 'Ceramic / steel',
      description:
        'An electrical spark ignites the compressed mixture. The visual pulse marks an idealized firing event.',
      removable: true,
    },
    {
      id: `inlet-${n}`,
      name: `Cylinder ${n} · inlet valves`,
      system: 'timing',
      assembly: `Cylinder ${n}`,
      material: 'Steel',
      description:
        'Two inlet valves open during the intake stroke in this simplified timing model.',
      removable: true,
    },
    {
      id: `outlet-${n}`,
      name: `Cylinder ${n} · exhaust valves`,
      system: 'timing',
      assembly: `Cylinder ${n}`,
      material: 'Heat-resistant steel',
      description:
        'Two exhaust valves open during the exhaust stroke to release the spent gases.',
      removable: true,
    },
    {
      id: `liner-${n}`,
      name: `Cylinder ${n} · bore liner`,
      system: 'mechanics',
      assembly: `Cylinder ${n}`,
      material: 'Iron liner',
      description:
        'This cylindrical running surface guides the piston. Its front sector is removed in cutaway mode.',
      removable: true,
    },
  );
export const findPart = (id: string | null) =>
  PARTS.find((part) => part.id === id);

const extras: [string, string, SystemId, string, string, string][] = [
  [
    'lower-case',
    'Lower crankcase',
    'mechanics',
    'Structure',
    'Cast aluminium',
    'The lower crankcase encloses the rotating crankshaft and joins the cylinder block to the sump.',
  ],
  [
    'bellhousing',
    'Flywheel housing',
    'mechanics',
    'Structure',
    'Cast aluminium',
    'This housing joins the crankshaft side of the engine to the compact transverse transmission case.',
  ],
  [
    'timing-cover',
    'Timing chain cover',
    'timing',
    'Covers & seals',
    'Cast aluminium',
    'The sealed front cover encloses the lubricated timing chain and integrates the front seals and mounting bosses.',
  ],
  [
    'head-gasket',
    'Head gasket',
    'mechanics',
    'Covers & seals',
    'Multi-layer steel',
    'Seals the combustion chambers and separates the oil and coolant passages between the block and head.',
  ],
  [
    'cover-gasket',
    'Cam cover gasket',
    'timing',
    'Covers & seals',
    'Elastomer',
    'Seals the cam cover perimeter to keep oil inside the cylinder head.',
  ],
  [
    'sump-gasket',
    'Sump gasket',
    'oil',
    'Covers & seals',
    'Elastomer',
    'Seals the lower crankcase to the sump. Some real engines use liquid sealant instead.',
  ],
  [
    'cover-bolts',
    'Cam cover fasteners',
    'timing',
    'Fasteners',
    'Steel',
    'The perimeter fasteners clamp the cam cover and compress its gasket.',
  ],
  [
    'head-bolts',
    'Cylinder head bolts',
    'mechanics',
    'Fasteners',
    'High-strength steel',
    'These long bolts clamp the head, gasket and block together. The exploded view is an explanation, not a tightening sequence.',
  ],
  [
    'sump-bolts',
    'Sump fasteners',
    'oil',
    'Fasteners',
    'Steel',
    'Fasteners secure the oil reservoir to the lower crankcase.',
  ],
  [
    'exhaust-shield',
    'Exhaust heat shield',
    'combustion',
    'Exhaust',
    'Formed aluminium',
    'A stand-off shield reduces radiant heat reaching nearby components.',
  ],
  [
    'airbox',
    'Air filter & airbox',
    'combustion',
    'Air & fuel',
    'Polymer / pleated filter',
    'Air enters through the filter before reaching the throttle. The filter catches airborne particles.',
  ],
  [
    'throttle',
    'Electronic throttle body',
    'combustion',
    'Air & fuel',
    'Aluminium / steel butterfly',
    'A rotating butterfly controls the intake opening. The throttle control here changes this opening and illustrates flow; it does not predict torque or engine speed.',
  ],
  [
    'coolant-hoses',
    'Radiator hoses',
    'cooling',
    'Cooling',
    'Reinforced rubber',
    'The upper hose carries heated coolant to the radiator. The lower hose returns cooled liquid to the pump.',
  ],
  [
    'expansion-tank',
    'Coolant expansion tank',
    'cooling',
    'Cooling',
    'Translucent polymer',
    'A reservoir accommodates changes in coolant volume. This model shows its connection to the cooling circuit.',
  ],
  [
    'oil-cap',
    'Oil filler cap',
    'oil',
    'Lubrication',
    'Polymer',
    'The filler opening provides access for adding engine oil. It is sealed while the engine runs.',
  ],
  [
    'dipstick',
    'Oil level dipstick',
    'oil',
    'Lubrication',
    'Steel / polymer handle',
    'The dipstick reaches into the sump to indicate the oil level when checked according to the vehicle procedure.',
  ],
  [
    'pcv',
    'Crankcase ventilation',
    'combustion',
    'Air & fuel',
    'Polymer / rubber',
    'The ventilation path returns blow-by gases from the crankcase to the intake. Its route is illustrative; separator internals are simplified.',
  ],
  [
    'alternator',
    'Alternator',
    'mechanics',
    'Accessories',
    'Aluminium / copper / steel',
    'The accessory belt turns the alternator to generate electrical power. Its electrical output is not calculated.',
  ],
  [
    'accessory-belt',
    'Accessory belt & pulleys',
    'mechanics',
    'Accessories',
    'Reinforced rubber / steel',
    'A separate belt transfers crankshaft rotation to the alternator and coolant pump in this representative layout.',
  ],
];
PARTS.push(
  ...extras.map(([id, name, system, assembly, material, description]) => ({
    id,
    name,
    system,
    assembly,
    material,
    description,
    removable: true,
  })),
);
for (let n = 1; n <= 4; n++) {
  PARTS.find((p) => p.id === `piston-${n}`)!.name = `Cylinder ${n} · piston`;
  for (const [id, name, system, material, description] of [
    [
      'coil',
      'ignition coil',
      'combustion',
      'Polymer / copper',
      'The coil provides the high voltage for its spark plug. Electrical waveforms are not simulated.',
    ],
    [
      'rings',
      'piston ring pack',
      'mechanics',
      'Steel',
      'Two compression rings and an oil-control ring fit the piston grooves. They are separated here as a ring pack for inspection.',
    ],
    [
      'pin',
      'wrist pin & clips',
      'mechanics',
      'Hardened steel',
      'The hollow wrist pin joins the small end of the connecting rod to the piston. Retaining clips locate it laterally.',
    ],
    [
      'rod-cap',
      'rod bearing cap',
      'mechanics',
      'Forged steel / bearing alloy',
      'The detachable big-end cap closes the rod around the crankpin. Its bearing shell supports the oil film.',
    ],
  ] as const)
    PARTS.push({
      id: `${id}-${n}`,
      name: `Cylinder ${n} · ${name}`,
      system,
      material,
      description,
      assembly: `Cylinder ${n}`,
      removable: true,
    });
}
for (let n = 1; n <= 5; n++)
  PARTS.push({
    id: `main-cap-${n}`,
    name: `Main bearing cap ${n}`,
    system: 'mechanics',
    material: 'Aluminium / bearing alloy',
    description:
      'A main bearing cap retains the crankshaft at a main journal. The bearing shell supports a thin film of pressurized oil.',
    assembly: 'Rotating assembly',
    removable: true,
  });
PARTS.push(
  {
    id: 'acoustic-cover',
    name: 'Fuel pump acoustic insulator',
    system: 'mechanics',
    assembly: 'Covers & seals',
    material: 'Textured composite / rubber mounts',
    description:
      'A small moulded insulator surrounds the high-pressure fuel pump to reduce ticking noise. The Corolla reference leaves the ignition coils and cam-cover wiring exposed.',
    removable: true,
  },
  {
    id: 'transaxle',
    name: 'Compact transaxle housing',
    system: 'mechanics',
    assembly: 'Powertrain',
    material: 'Cast aluminium',
    description:
      'The transverse transmission and differential sit beside the engine and deliver drive to the front half-shafts. This exhibit models the housing; internal gear selection is not simulated.',
    removable: true,
  },
  {
    id: 'direct-injection',
    name: 'Direct-injection rail & injectors',
    system: 'combustion',
    assembly: 'Air & fuel',
    material: 'Stainless steel / injector solenoids',
    description:
      'The high-pressure rail supplies injectors that deliver fuel directly to the chambers. These supplement the port injectors; the displayed injection windows are illustrative.',
    removable: true,
  },
  {
    id: 'fuel-pump',
    name: 'High-pressure fuel pump',
    system: 'combustion',
    assembly: 'Air & fuel',
    material: 'Aluminium / steel',
    description:
      'A mechanically driven pump raises fuel pressure for the direct-injection rail. The external housing and metal feed pipe are shown.',
    removable: true,
  },
);
export const SYSTEM_COLORS: Record<SystemId, string> = {
  all: '#c6d2d8',
  mechanics: '#98b5c9',
  timing: '#b9a0ff',
  combustion: '#67d8d6',
  oil: '#ffc15e',
  cooling: '#55b7ff',
};
export const FLOW_LEGEND = [
  { id: 'air', label: 'Intake air', color: '#61e5dc' },
  { id: 'fuel', label: 'Fuel', color: '#f17ac5' },
  { id: 'burn', label: 'Combustion', color: '#ff742f' },
  { id: 'exhaust', label: 'Exhaust', color: '#b89af9' },
  { id: 'oil', label: 'Oil', color: '#ffc15e' },
  { id: 'cooling', label: 'Coolant', color: '#55b7ff' },
] as const;
