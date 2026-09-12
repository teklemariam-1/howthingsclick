import { specs } from './simulation';
export const legGeometry = {
  hingeHeight: 1.25,
  length: 8.4,
  footHeight: 0.36,
  deckHeight: 0.27,
  azimuthOffset: Math.PI / 4,
};
export const deployedLegAngle = -Math.acos(
  (specs.falcon9.contactHeight +
    legGeometry.hingeHeight -
    legGeometry.deckHeight -
    legGeometry.footHeight / 2) /
    legGeometry.length,
);
export function legPitch(deployment: number) {
  const stowed = Math.PI + 0.025,
    extended = 2 * Math.PI + deployedLegAngle;
  return stowed + (extended - stowed) * Math.min(1, Math.max(0, deployment));
}
export function legFootPosition(index: number, deployment = 1) {
  const pitch = legPitch(deployment),
    a = (index * Math.PI) / 2 + legGeometry.azimuthOffset;
  const radius = specs.falcon9.radius + legGeometry.length * Math.sin(-pitch);
  return {
    x: Math.sin(a) * radius,
    y:
      specs.falcon9.contactHeight +
      legGeometry.hingeHeight -
      legGeometry.length * Math.cos(pitch),
    z: Math.cos(a) * radius,
  };
}
