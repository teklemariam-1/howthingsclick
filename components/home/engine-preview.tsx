'use client';
import PageLink from '@/components/page-link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  ArrowUpRight,
  Box,
  Layers3,
  LoaderCircle,
  Rotate3D,
} from 'lucide-react';
import Image from 'next/image';
import type { SceneOptions } from '@/components/engine/scene';

const subscribeToClient = () => () => {};

const initial: SceneOptions = {
  playing: false,
  speed: 0.24,
  cutaway: false,
  explode: 0,
  removed: [],
  selected: null,
  isolated: false,
  labels: false,
  system: 'all',
  warm: true,
  quality: 'balanced',
  colors: false,
  flows: false,
  throttle: 0.3,
  peel: 0,
  tourTime: null,
  tourVariant: 'full',
  carContext: false,
  vehicleView: 'bay',
  hoodOpen: true,
};
type Api = ReturnType<
  (typeof import('@/components/engine/scene'))['createEngineScene']
>;
export default function EnginePreview() {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [active, setActive] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  const [ready, setReady] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [error, setError] = useState(false);
  const options = useRef(initial);
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    import('@/components/engine/scene')
      .then(({ createEngineScene }) => {
        if (disposed || !host.current) return;
        api.current = createEngineScene(
          host.current,
          () => {},
          () => {},
        );
        api.current.setOptions(options.current);
        api.current.camera('home');
        if (options.current.explode === 0) api.current.camera('zoom-in');
        setReady(true);
      })
      .catch(() => setError(true));
    return () => {
      disposed = true;
      api.current?.dispose();
      api.current = null;
    };
  }, [active]);
  function changeAssembly(value: boolean) {
    setExploded(value);
    options.current = { ...initial, explode: value ? 0.55 : 0 };
    setActive(true);
    api.current?.setOptions(options.current);
    api.current?.camera('home');
    if (!value) api.current?.camera('zoom-in');
  }
  return (
    <div className="home-preview">
      {!ready && (
        <Image
          unoptimized
          className="home-preview-poster"
          src="/images/engine-preview.png"
          alt="A four-cylinder engine you can rotate and take apart"
          width="663"
          height="532"
          fetchPriority="high"
        />
      )}
      <div className="preview-topline">
        <span>
          <i /> YOUR CURIOSITY. YOUR CONTROLS.
        </span>
        <span>01 / ENGINE</span>
      </div>
      <div className="home-preview-host" ref={host} />
      {!active && (
        <button
          type="button"
          className="preview-activate"
          disabled={!mounted}
          aria-label="Activate interactive engine preview"
          onClick={() => changeAssembly(false)}
        />
      )}
      {active && !ready && (
        <output className="preview-loading">
          {error ? (
            <>
              <span>The 3D preview couldn’t load.</span>
              <PageLink href="/engine">
                Open the engine lab <ArrowUpRight size={16} />
              </PageLink>
            </>
          ) : (
            <>
              <LoaderCircle className="spin" size={25} />
              <span>Preparing the engine…</span>
            </>
          )}
        </output>
      )}
      <div className="preview-bottomline">
        <span>
          <Rotate3D size={17} />
          {ready ? 'Drag to look around' : 'Go on. Take it apart.'}
        </span>
        <div className="preview-modes" aria-label="Engine assembly">
          <button
            type="button"
            disabled={!mounted || (active && !ready)}
            aria-pressed={!exploded}
            onClick={() => changeAssembly(false)}
          >
            <Box size={15} /> Assembled
          </button>
          <button
            type="button"
            disabled={!mounted || (active && !ready)}
            aria-pressed={exploded}
            onClick={() => changeAssembly(true)}
          >
            <Layers3 size={15} /> Take apart
          </button>
        </div>
      </div>
    </div>
  );
}
