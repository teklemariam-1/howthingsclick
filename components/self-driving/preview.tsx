'use client';
import { useEffect, useRef, useState } from 'react';
export default function CybercabPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let dispose = () => {},
      cancelled = false,
      started = false;
    const observer = new IntersectionObserver((entries) => {
      if (started || !entries.some((e) => e.isIntersecting) || !ref.current)
        return;
      started = true;
      Promise.all([
        import('three'),
        import('./geometry'),
        import('@/components/engine/vehicle-studio'),
      ])
        .then(([T, { createCybercab }, { createVehicleStudioEnvironment }]) => {
          if (cancelled || !ref.current) return;
          const host = ref.current;
          const renderer = new T.WebGLRenderer({ antialias: true });
          renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
          renderer.toneMapping = T.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.3;
          host.appendChild(renderer.domElement);
          const scene = new T.Scene();
          scene.background = new T.Color('#26363c');
          const camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
          camera.position.set(5.7, 2.8, 5.3);
          camera.lookAt(0, 0.7, 0);
          const car = createCybercab();
          scene.add(car.group);
          scene.add(new T.HemisphereLight('#e8f1f0', '#4c594b', 2));
          const sun = new T.DirectionalLight('#ffedce', 3.2);
          sun.position.set(4, 9, 4);
          scene.add(sun);
          const pmrem = new T.PMREMGenerator(renderer),
            env = createVehicleStudioEnvironment(pmrem);
          scene.environment = env.texture;
          pmrem.dispose();
          function render() {
            renderer.setSize(host.clientWidth, host.clientHeight, false);
            camera.aspect = host.clientWidth / host.clientHeight;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
          }
          const resize = new ResizeObserver(render);
          resize.observe(host);
          render();
          void car
            .loadDetailed(() => cancelled)
            .then(() => {
              if (!cancelled) render();
            })
            .catch(() => {});
          dispose = () => {
            resize.disconnect();
            scene.traverse((o) => {
              if (o instanceof T.Mesh) {
                o.geometry.dispose();
                (Array.isArray(o.material) ? o.material : [o.material]).forEach(
                  (m) => m.dispose(),
                );
              }
            });
            env.dispose();
            renderer.dispose();
            renderer.domElement.remove();
          };
        })
        .catch(() => setFailed(true));
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      cancelled = true;
      observer.disconnect();
      dispose();
    };
  }, []);
  return (
    <figure
      ref={ref}
      className="cybercab-card-preview"
      aria-label="Gold Cybercab-inspired model from the self-driving lab"
    >
      {failed && <span>Explore the self-driving lab</span>}
    </figure>
  );
}
