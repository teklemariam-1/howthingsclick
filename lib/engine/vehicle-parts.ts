export const VEHICLE_SYSTEMS = [
  { id: 'all', name: 'Whole car', color: '#9fd7c8' },
  { id: 'body', name: 'Body & glass', color: '#dce3e7' },
  { id: 'cabin', name: 'Cabin', color: '#bc9ad8' },
  { id: 'suspension', name: 'Suspension & steering', color: '#60c7db' },
  { id: 'brakes', name: 'Wheels & brakes', color: '#e6ab71' },
  { id: 'powertrain', name: 'Powertrain', color: '#83c99c' },
  { id: 'electrical', name: 'Electrical', color: '#e2ce73' },
  { id: 'fuel', name: 'Fuel & exhaust', color: '#d798ac' },
  { id: 'climate', name: 'Cooling & climate', color: '#7eafe8' },
] as const;
export type VehicleSystem = (typeof VEHICLE_SYSTEMS)[number]['id'];
export type VehiclePart = {
  id: string;
  name: string;
  system: VehicleSystem;
  description: string;
  material: string;
  offset: [number, number, number];
  stage: number;
};
export type VehicleAssemblyOptions = {
  explode: number;
  removed: string[];
  returned?: string[];
  selected: string | null;
  isolated: boolean;
  system: VehicleSystem;
  colors: boolean;
};
export const initialVehicleAssembly: VehicleAssemblyOptions = {
  explode: 0,
  removed: [],
  returned: [],
  selected: null,
  isolated: false,
  system: 'all',
  colors: false,
};
export function vehicleStage(progress: number, stage: number) {
  const start = Math.min(6, Math.max(0, stage)) * 0.09;
  const t = Math.max(0, Math.min(1, (progress - start) / 0.42));
  return t * t * (3 - 2 * t);
}

export const CAR_ENGINE_PART: VehiclePart = {
  id: 'car-engine',
  name: 'Inline-four engine and cooling pack',
  system: 'powertrain',
  description:
    'The existing engine exhibit contains 86 inspectable assemblies. Open the engine lab to explore pistons, valves, combustion, lubrication and cooling.',
  material: 'Aluminium, steel, polymer and rubber',
  offset: [-4, 12, -3],
  stage: 4,
};
