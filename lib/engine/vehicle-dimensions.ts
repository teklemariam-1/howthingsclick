// Corolla LE exterior proportions and tires; local packaging is illustrative.
// The user's white LE listing supplies the body and wheel-cover reference.
export const VEHICLE_UNITS_PER_METRE = 10;
export const VEHICLE_GROUND_Y = -3.1;
export const VEHICLE_DIMENSIONS = {
  length: 182.3 * 0.0254,
  width: 70.1 * 0.0254,
  height: 56.5 * 0.0254,
  wheelbase: 106.3 * 0.0254,
  track: 1.55,
  frontOverhang: 0.93,
  tireWidth: 0.205,
  tireAspect: 0.55,
  rimDiameter: 16 * 0.0254,
};
export const TIRE_RADIUS =
  VEHICLE_DIMENSIONS.rimDiameter / 2 +
  VEHICLE_DIMENSIONS.tireWidth * VEHICLE_DIMENSIONS.tireAspect;
