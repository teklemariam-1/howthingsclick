import * as THREE from 'three';

// Ten sculpted vanes form five paired spokes, matching the LE's silver cover.
// The relief has a crowned face and rolled edges instead of flat extrusions.
export function corollaWheelCoverGeometry(radius: number) {
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const radial = 44,
    across = 12;
  function point(
    t: number,
    q: number,
    branch: number,
    sector: number,
    back: boolean,
  ) {
    const r = THREE.MathUtils.lerp(0.047, radius, t);
    const center =
      (sector * Math.PI * 2) / 5 +
      branch * (0.08 + 0.16 * t + 0.055 * Math.sin(Math.PI * t));
    const halfWidth = 0.01 + 0.008 * Math.sin(Math.PI * t) + 0.019 * t ** 3;
    const angle = center + (q * halfWidth) / r;
    const rolled = 0.006 * (1 - q * q) * Math.sin(Math.PI * t);
    const z =
      0.085 +
      0.018 * (1 - t) ** 2 -
      0.004 * t ** 4 +
      rolled +
      branch * 0.006 * q * Math.sin(Math.PI * t) -
      (back ? 0.006 : 0);
    return [r * Math.cos(angle), r * Math.sin(angle), z];
  }
  for (let sector = 0; sector < 5; sector++)
    for (const branch of [-1, 1]) {
      const start = positions.length / 3,
        layer = (radial + 1) * (across + 1);
      for (const back of [false, true]) {
        const offset = positions.length / 3;
        for (let i = 0; i <= radial; i++)
          for (let j = 0; j <= across; j++) {
            positions.push(
              ...point(i / radial, (j / across) * 2 - 1, branch, sector, back),
            );
            uv.push(i / radial, j / across);
            if (i < radial && j < across) {
              const a = offset + i * (across + 1) + j,
                b = a + across + 1;
              if (back) indices.push(a, a + 1, b, b, a + 1, b + 1);
              else indices.push(a, b, a + 1, b, b + 1, a + 1);
            }
          }
      }
      for (const j of [0, across])
        for (let i = 0; i < radial; i++) {
          const a = start + i * (across + 1) + j,
            b = a + across + 1;
          if (j === 0) indices.push(a, a + layer, b, a + layer, b + layer, b);
          else indices.push(a, b, a + layer, b, b + layer, a + layer);
        }
      for (const i of [0, radial])
        for (let j = 0; j < across; j++) {
          const a = start + i * (across + 1) + j,
            b = a + 1;
          if (i === 0) indices.push(a, b, a + layer, b, b + layer, a + layer);
          else indices.push(a, a + layer, b, a + layer, b + layer, b);
        }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
