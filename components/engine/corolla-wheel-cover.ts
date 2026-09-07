import * as THREE from 'three';

// Eight broad faceted spokes, checked against the original 42602-02540 cover.
// The dated close-up reference is recorded in docs/corolla-reference-register.md.
// The relief has a crowned face and rolled edges instead of flat extrusions.
export function corollaWheelCoverGeometry(radius: number) {
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const radial = 44,
    across = 12;
  function point(t: number, q: number, sector: number, back: boolean) {
    const r = THREE.MathUtils.lerp(0.064, radius, t);
    const center = (sector * Math.PI * 2) / 8 + Math.PI / 8;
    const halfWidth = 0.01 + 0.005 * Math.sin(Math.PI * t) + 0.033 * t ** 1.65;
    const angle = center + (q * halfWidth) / r;
    const rolled = 0.009 * (1 - Math.abs(q)) * Math.sin(Math.PI * t);
    const z =
      0.085 +
      0.018 * (1 - t) ** 2 -
      0.004 * t ** 4 +
      rolled +
      0.003 * q * Math.sin(Math.PI * t) -
      (back ? 0.006 : 0);
    return [r * Math.cos(angle), r * Math.sin(angle), z];
  }
  for (let sector = 0; sector < 8; sector++) {
    const start = positions.length / 3,
      layer = (radial + 1) * (across + 1);
    for (const back of [false, true]) {
      const offset = positions.length / 3;
      for (let i = 0; i <= radial; i++)
        for (let j = 0; j <= across; j++) {
          positions.push(
            ...point(i / radial, (j / across) * 2 - 1, sector, back),
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
