import * as T from 'three';
// Tesla's rider guide shows an outward/upward butterfly sweep with an upright open leaf.
// The axis is an artistic fit to that reference, not a measured production hinge.
export function cybercabDoorRotation(side: number, opening: number) {
  const amount = T.MathUtils.clamp(opening, 0, 1);
  const axis = new T.Vector3(0, side * 0.45, -0.893).normalize();
  return new T.Quaternion().setFromAxisAngle(axis, amount * 1.42);
}
