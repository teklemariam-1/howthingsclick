// Representative sedan geometry in metres, converted to the engine scene.
export const VEHICLE_UNITS_PER_METRE = 10;
export const VEHICLE_GROUND_Y = -3.1;
export const VEHICLE_DIMENSIONS = {
  length: 4.6,
  width: 1.8,
  height: 1.45,
  wheelbase: 2.7,
  track: 1.55,
  frontOverhang: 0.93,
  tireWidth: 0.225,
  tireAspect: 0.45,
  rimDiameter: 17 * 0.0254,
};
export const TIRE_RADIUS =
  VEHICLE_DIMENSIONS.rimDiameter / 2 +
  VEHICLE_DIMENSIONS.tireWidth * VEHICLE_DIMENSIONS.tireAspect;
