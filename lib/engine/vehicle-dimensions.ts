// 2025 Corolla SE exterior dimensions and tire size; local packaging is illustrative.
// Toyota's 2025 Corolla brochure: 182.5 × 70.1 × 56.5 in, 106.3 in wheelbase.
export const VEHICLE_UNITS_PER_METRE = 10;
export const VEHICLE_GROUND_Y = -3.1;
export const VEHICLE_DIMENSIONS = {
  length: 182.5 * 0.0254,
  width: 70.1 * 0.0254,
  height: 56.5 * 0.0254,
  wheelbase: 106.3 * 0.0254,
  track: 1.55,
  frontOverhang: 0.93,
  tireWidth: 0.225,
  tireAspect: 0.4,
  rimDiameter: 18 * 0.0254,
};
export const TIRE_RADIUS =
  VEHICLE_DIMENSIONS.rimDiameter / 2 +
  VEHICLE_DIMENSIONS.tireWidth * VEHICLE_DIMENSIONS.tireAspect;
