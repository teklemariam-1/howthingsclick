import * as THREE from 'three';

// The visible shut line and the actual detachable panel use the same profile.
export function trunkShutLine() {
  const line = new THREE.Path();
  line.moveTo(-0.725, 0.943);
  line.bezierCurveTo(-0.726, 0.8, -0.702, 0.65, -0.655, 0.608);
  line.quadraticCurveTo(-0.631, 0.576, -0.565, 0.575);
  line.quadraticCurveTo(0, 0.57, 0.565, 0.575);
  line.quadraticCurveTo(0.631, 0.576, 0.655, 0.608);
  line.bezierCurveTo(0.702, 0.65, 0.726, 0.8, 0.725, 0.943);
  return line;
}
