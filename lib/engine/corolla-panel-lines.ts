import * as THREE from 'three';

// Fender-to-bumper joint: starts beneath the outer headlamp and meets the
// forward wheel arch. The geometry and visible seam share this same profile.
export function frontBumperSideLine() {
  const line = new THREE.Path();
  line.moveTo(-0.37, 0.779);
  line.quadraticCurveTo(-0.266, 0.719, -0.141, 0.636);
  return line;
}

export function frontDoorOutline() {
  const s = new THREE.Shape();
  s.moveTo(0.51, 0.94);
  s.bezierCurveTo(0.482, 0.808, 0.488, 0.539, 0.558, 0.293);
  s.quadraticCurveTo(0.574, 0.239, 0.685, 0.239);
  s.lineTo(1.551, 0.237);
  s.lineTo(1.578, 0.953);
  s.closePath();
  return s;
}

export function rearDoorOutline() {
  const s = new THREE.Shape();
  s.moveTo(1.585, 0.959);
  s.lineTo(2.65, 1.0);
  s.quadraticCurveTo(2.697, 0.984, 2.684, 0.942);
  s.bezierCurveTo(2.611, 0.81, 2.447, 0.552, 2.32, 0.316);
  s.quadraticCurveTo(2.29, 0.265, 2.244, 0.249);
  s.lineTo(1.558, 0.237);
  s.closePath();
  return s;
}

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

// The rear cover meets the wheel opening, then sweeps upward under the lamp.
// This outline also partitions the actual outer quarter-panel geometry.
export function rearBumperSideLine(rear: number) {
  const path = new THREE.Path();
  path.moveTo(2.94, 0.57);
  path.bezierCurveTo(3.075, 0.74, 3.26, 0.817, rear, 0.815);
  return path;
}
