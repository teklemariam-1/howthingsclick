export type SystemId = 'all' | 'mechanics' | 'timing' | 'combustion' | 'oil' | 'cooling';
export type Part = { id: string; name: string; system: SystemId; description: string; material: string; assembly: string; removable?: boolean };
export const SYSTEMS = [
  { id: 'all', name: 'Whole engine', eyebrow: 'THE COMPLETE ASSEMBLY', title: 'A little combustion. A lot of motion.', description: 'Explore the mechanisms inside an inline-four petrol engine. Drag to rotate, select a part, or reveal an entire system.' },
  { id: 'mechanics', name: 'Moving parts', eyebrow: 'MECHANICAL CONNECTIONS', title: 'From up and down to round and round.', description: 'The piston pushes a connecting rod. The rod turns the crankshaft. Four cylinders take turns delivering a power stroke.' },
  { id: 'timing', name: 'Valves & timing', eyebrow: 'EVERYTHING IN TIME', title: 'The right valve. At the right moment.', description: 'The timing drive keeps the camshafts synchronized with the crankshaft. The cams open the valves against their springs.' },
  { id: 'combustion', name: 'Air, fuel & spark', eyebrow: 'THE FOUR-STROKE CYCLE', title: 'One cycle. Four distinct strokes.', description: 'Follow intake, compression, power and exhaust. Pause the engine and move the cycle control to inspect any instant.' },
  { id: 'oil', name: 'Oil circulation', eyebrow: 'THE LUBRICATION CIRCUIT', title: 'Follow the oil to the moving surfaces.', description: 'The pump draws oil from the sump, through the filter and into supply galleries. Branches feed the bearings and cylinder head; oil drains back to the sump.' },
  { id: 'cooling', name: 'Cooling circuit', eyebrow: 'MOVING HEAT AWAY', title: 'Inside the engine’s cooling passages.', description: 'Coolant circulates around the cylinders and through the head. In a warm engine, the thermostat opens a route through the radiator.' },
] as const;
const structure: Part[] = [
  {id:'block',name:'Cylinder block',system:'mechanics',assembly:'Structure',material:'Cast aluminium',description:'The structural body holds the cylinders and supports the crankshaft. The cutaway exposes the bores and internal passages.',removable:true},
  {id:'head',name:'Cylinder head',system:'timing',assembly:'Cylinder head',material:'Cast aluminium',description:'The head closes the cylinders and contains the valves, ports, spark plugs and camshaft supports.',removable:true},
  {id:'cover',name:'Cam cover',system:'timing',assembly:'Cylinder head',material:'Coated aluminium',description:'This cover encloses the camshafts and keeps lubricating oil inside the cylinder head.',removable:true},
  {id:'sump',name:'Oil sump',system:'oil',assembly:'Lubrication',material:'Cast aluminium',description:'Oil returning from the engine collects here. The pickup draws oil from this reservoir.',removable:true},
  {id:'crank',name:'Crankshaft',system:'mechanics',assembly:'Rotating assembly',material:'Forged steel',description:'Offset crankpins connect to the rods. Main journals support rotation, and counterweights help balance the moving assembly.',removable:true},
  {id:'flywheel',name:'Flywheel & ring gear',system:'mechanics',assembly:'Rotating assembly',material:'Steel',description:'Rotational inertia smooths power delivery. The outer ring gear provides a connection for the starter motor.',removable:true},
  {id:'cam-intake',name:'Intake camshaft',system:'timing',assembly:'Valve train',material:'Hardened steel',description:'The inlet cams open the intake valves. The camshaft makes one revolution for each two crankshaft revolutions.',removable:true},
  {id:'cam-exhaust',name:'Exhaust camshaft',system:'timing',assembly:'Valve train',material:'Hardened steel',description:'The exhaust cams open the exhaust valves to let the spent gases leave.',removable:true},
  {id:'timing',name:'Timing belt & pulleys',system:'timing',assembly:'Valve train',material:'Reinforced rubber / steel',description:'The toothed belt maintains the crank-to-cam phase relationship. The model uses fixed timing and simplified valve events.',removable:true},
  {id:'intake',name:'Intake manifold',system:'combustion',assembly:'Air & fuel',material:'Composite / aluminium',description:'Four runners deliver intake air to the inlet ports. Port injectors introduce fuel before the inlet valves.',removable:true},
  {id:'exhaust',name:'Exhaust manifold',system:'combustion',assembly:'Exhaust',material:'Stainless steel',description:'The manifold collects exhaust flow from the cylinders into a common outlet.',removable:true},
  {id:'rail',name:'Fuel rail & injectors',system:'combustion',assembly:'Air & fuel',material:'Aluminium / steel',description:'The rail supplies the four port injectors, one upstream of each cylinder’s inlet valves.',removable:true},
  {id:'oil-pump',name:'Oil pump & pickup',system:'oil',assembly:'Lubrication',material:'Aluminium housing / steel rotors',description:'A positive-displacement pump supplies oil to the lubrication circuit. The pickup screen helps keep larger debris out of the pump.',removable:true},
  {id:'oil-filter',name:'Oil filter',system:'oil',assembly:'Lubrication',material:'Steel shell / filter medium',description:'The filter removes particles from circulating oil. The highlighted route illustrates the supply circuit.',removable:true},
  {id:'water-pump',name:'Coolant pump',system:'cooling',assembly:'Cooling',material:'Aluminium / steel',description:'The rotating impeller circulates coolant through the engine and its connected cooling circuit.',removable:true},
  {id:'radiator',name:'Radiator & fan',system:'cooling',assembly:'Cooling',material:'Aluminium / polymer',description:'Heat moves from the coolant into the radiator and then into the surrounding air. The fan supports airflow.',removable:true},
  {id:'thermostat',name:'Thermostat housing',system:'cooling',assembly:'Cooling',material:'Aluminium / brass',description:'When warm, the thermostat opens the radiator route. The cold-state view shows an illustrative bypass circuit.',removable:true},
  {id:'starter',name:'Starter motor',system:'mechanics',assembly:'Starting',material:'Steel / aluminium',description:'The starter turns the crankshaft through the flywheel ring gear during cranking. Its internal drive is not modeled in this version.',removable:true},
];
export const PARTS: Part[] = [...structure];
for(let n=1;n<=4;n++) PARTS.push(
  {id:`piston-${n}`,name:`Cylinder ${n} · piston & rings`,system:'mechanics',assembly:`Cylinder ${n}`,material:'Aluminium / steel rings',description:'The piston slides inside the cylinder. Its rings help seal the chamber and control the oil film on the cylinder wall.',removable:true},
  {id:`rod-${n}`,name:`Cylinder ${n} · connecting rod`,system:'mechanics',assembly:`Cylinder ${n}`,material:'Forged steel',description:'The small end pivots on the wrist pin; the big end turns on a crankpin. The rod links the piston to the crankshaft.',removable:true},
  {id:`plug-${n}`,name:`Cylinder ${n} · spark plug`,system:'combustion',assembly:`Cylinder ${n}`,material:'Ceramic / steel',description:'An electrical spark ignites the compressed mixture. The visual pulse marks an idealized firing event.',removable:true},
  {id:`inlet-${n}`,name:`Cylinder ${n} · inlet valves`,system:'timing',assembly:`Cylinder ${n}`,material:'Steel',description:'Two inlet valves open during the intake stroke in this simplified timing model.',removable:true},
  {id:`outlet-${n}`,name:`Cylinder ${n} · exhaust valves`,system:'timing',assembly:`Cylinder ${n}`,material:'Heat-resistant steel',description:'Two exhaust valves open during the exhaust stroke to release the spent gases.',removable:true},
  {id:`liner-${n}`,name:`Cylinder ${n} · bore liner`,system:'mechanics',assembly:`Cylinder ${n}`,material:'Iron liner',description:'This cylindrical running surface guides the piston. Its front sector is removed in cutaway mode.',removable:true},
);
export const findPart = (id: string | null) => PARTS.find(part=>part.id===id);
