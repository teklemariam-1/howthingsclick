import * as THREE from 'three';

/** Partition an existing surface along a convex outline in its UV coordinates.
 * Rejected fragments are retained, so the two results exactly cover the source.
 * Openings already present in the source remain openings in both pieces. */
export function splitPanelRegion(
  source: THREE.BufferGeometry,
  outline: THREE.Vector2[],
) {
  const points = outline.filter(
    (p, i) => i === 0 || p.distanceToSquared(outline[i - 1]) > 1e-12,
  );
  if (points[0].distanceToSquared(points[points.length - 1]) < 1e-12)
    points.pop();
  if (points.length < 3)
    throw new Error('A panel region needs at least three points');
  const orientation = Math.sign(THREE.ShapeUtils.area(points));
  const geometry = source.index ? source.toNonIndexed() : source;
  const attrs = Object.entries(geometry.attributes),
    offsets: number[] = [];
  let stride = 0;
  for (const [, a] of attrs) {
    offsets.push(stride);
    stride += a.itemSize;
  }
  const uv = offsets[attrs.findIndex(([name]) => name === 'uv')];
  if (uv === undefined) throw new Error('Panel region requires UV coordinates');
  const inside: number[][] = attrs.map(() => []),
    outside: number[][] = attrs.map(() => []);
  const emit = (polygon: number[][], out: number[][]) => {
    for (let i = 1; i < polygon.length - 1; i++)
      for (const v of [polygon[0], polygon[i], polygon[i + 1]])
        attrs.forEach(([, a], j) => {
          for (let c = 0; c < a.itemSize; c++) out[j].push(v[offsets[j] + c]);
        });
  };
  const edges = points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    return { a, dx: b.x - a.x, dy: b.y - a.y };
  });
  for (
    let triangle = 0;
    triangle < geometry.getAttribute('position').count;
    triangle += 3
  ) {
    let polygon: number[][] = [];
    for (let i = 0; i < 3; i++) {
      const v: number[] = [];
      for (const [, a] of attrs)
        for (let c = 0; c < a.itemSize; c++)
          v.push(a.array[(triangle + i) * a.itemSize + c]);
      polygon.push(v);
    }
    for (const edge of edges) {
      const accepted: number[][] = [],
        rejected: number[][] = [];
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i],
          b = polygon[(i + 1) % polygon.length];
        const da =
            orientation *
            (edge.dx * (a[uv + 1] - edge.a.y) - edge.dy * (a[uv] - edge.a.x)),
          db =
            orientation *
            (edge.dx * (b[uv + 1] - edge.a.y) - edge.dy * (b[uv] - edge.a.x));
        (da >= 0 ? accepted : rejected).push(a);
        if (da >= 0 !== db >= 0) {
          const t = da / (da - db),
            v = a.map((n, j) => n + (b[j] - n) * t);
          accepted.push(v);
          rejected.push(v);
        }
      }
      emit(rejected, outside);
      polygon = accepted;
      if (polygon.length < 3) break;
    }
    emit(polygon, inside);
  }
  const build = (out: number[][]) => {
    const g = new THREE.BufferGeometry();
    attrs.forEach(([name, a], i) =>
      g.setAttribute(
        name,
        new THREE.Float32BufferAttribute(out[i], a.itemSize),
      ),
    );
    return g;
  };
  if (source.index) geometry.dispose();
  return { inside: build(inside), outside: build(outside) };
}

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
