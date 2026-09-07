import * as THREE from 'three';

// Interpolates all attributes where a body triangle crosses an assembly seam.
// Unlike centroid classification this produces straight, gap-free panel edges.
export function clipPanelGeometry(
  source: THREE.BufferGeometry,
  limits: { axis: 0 | 1 | 2; value: number; greater: boolean }[],
) {
  const geometry = source.index ? source.toNonIndexed() : source;
  const attributes = Object.entries(geometry.attributes);
  const offsets: number[] = [];
  let stride = 0;
  for (const [, a] of attributes) {
    offsets.push(stride);
    stride += a.itemSize;
  }
  const positionOffset =
    offsets[attributes.findIndex(([name]) => name === 'position')];
  const output: number[][] = attributes.map(() => []);
  for (
    let triangle = 0;
    triangle < geometry.getAttribute('position').count;
    triangle += 3
  ) {
    let polygon: number[][] = [];
    for (let i = 0; i < 3; i++) {
      const vertex: number[] = [];
      for (const [, a] of attributes)
        for (let c = 0; c < a.itemSize; c++)
          vertex.push(a.array[(triangle + i) * a.itemSize + c]);
      polygon.push(vertex);
    }
    for (const limit of limits) {
      const clipped: number[][] = [];
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i],
          b = polygon[(i + 1) % polygon.length];
        const da =
            (a[positionOffset + limit.axis] - limit.value) *
            (limit.greater ? 1 : -1),
          db =
            (b[positionOffset + limit.axis] - limit.value) *
            (limit.greater ? 1 : -1);
        if (da >= -1e-8) clipped.push(a);
        if (da >= 0 !== db >= 0) {
          const t = da / (da - db);
          clipped.push(a.map((v, j) => v + (b[j] - v) * t));
        }
      }
      polygon = clipped;
      if (!polygon.length) break;
    }
    for (let i = 1; i < polygon.length - 1; i++)
      for (const vertex of [polygon[0], polygon[i], polygon[i + 1]])
        attributes.forEach(([, a], j) =>
          output[j].push(...vertex.slice(offsets[j], offsets[j] + a.itemSize)),
        );
  }
  const result = new THREE.BufferGeometry();
  attributes.forEach(([name, a], i) =>
    result.setAttribute(
      name,
      new THREE.Float32BufferAttribute(output[i], a.itemSize),
    ),
  );
  if (source.index) geometry.dispose();
  return result;
}
