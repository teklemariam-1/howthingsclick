import * as T from 'three';
import { routeAppearance, routeSamples } from '@/lib/self-driving/route';
import type { Frame, Settings } from '@/lib/self-driving/simulation';

// The ribbon shows a planned vehicle corridor, not a physical road surface.
// Three translucent bands soften the edges without a texture or extra shader.
export function createRouteRibbon() {
  const group = new T.Group();
  const count = 96,
    indices: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const k = i * 2;
    indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
  }
  const bands = [
    [1.28, 0.065],
    [1.19, 0.11],
    [1.08, 0.29],
  ].map(([halfWidth, opacity], index) => {
    const geometry = new T.BufferGeometry();
    const position = new T.BufferAttribute(new Float32Array(count * 6), 3);
    position.setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('position', position);
    geometry.setIndex(indices);
    const material = new T.MeshBasicMaterial({
      color: '#4294ff',
      transparent: true,
      opacity,
      depthWrite: false,
      side: T.DoubleSide,
      toneMapped: false,
    });
    const mesh = new T.Mesh(geometry, material);
    mesh.renderOrder = 2 + index;
    group.add(mesh);
    return {
      halfWidth,
      geometry,
      position,
      material,
      height: 0.033 + index * 0.001,
    };
  });
  return {
    group,
    update(f: Frame, s: Settings) {
      const points = routeSamples(f, s),
        appearance = routeAppearance(f, s);
      for (const band of bands) {
        band.material.color.set(appearance.color);
        band.geometry.setDrawRange(0, Math.max(0, points.length - 1) * 6);
        points.forEach((p, i) => {
          for (const side of [-1, 1] as const) {
            // Trim offset corners at a stop boundary so color never spills past it.
            const x = Math.min(
              points[points.length - 1].x,
              p.x + p.nx * band.halfWidth * side,
            );
            band.position.setXYZ(
              i * 2 + (side === 1 ? 1 : 0),
              x,
              band.height,
              p.z + p.nz * band.halfWidth * side,
            );
          }
        });
        band.position.needsUpdate = true;
        band.geometry.computeBoundingSphere();
      }
    },
  };
}
