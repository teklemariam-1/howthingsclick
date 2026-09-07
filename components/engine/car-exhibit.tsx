'use client';
import './car-exhibit.css';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CarSlider as Slider } from './car-slider';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Box,
  Check,
  ChevronRight,
  Crosshair,
  Expand,
  Film,
  Layers3,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  Search,
  Tag,
  X,
} from 'lucide-react';
import {
  vehicleStage,
  initialVehicleAssembly,
  VEHICLE_SYSTEMS,
  type VehiclePart,
  type VehicleAssemblyOptions,
} from '@/lib/engine/vehicle-parts';
import {
  CAR_TOUR_DURATION,
  CAR_TOUR,
  carTourAt,
  carTourSrt,
} from '@/lib/engine/car-tour';
import type { SceneOptions } from './scene';
type Api = ReturnType<(typeof import('./scene'))['createEngineScene']>;
const base: SceneOptions = {
  playing: false,
  speed: 0.32,
  cutaway: false,
  explode: 0,
  removed: [],
  selected: null,
  isolated: false,
  labels: true,
  system: 'all',
  warm: true,
  quality: 'balanced',
  colors: false,
  flows: false,
  throttle: 0.32,
  peel: 0,
  tourTime: null,
  tourVariant: 'full',
  carContext: true,
  vehicleView: 'body',
  hoodOpen: false,
};
function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export default function CarExhibit() {
  const host = useRef<HTMLDivElement>(null),
    shell = useRef<HTMLDivElement>(null),
    api = useRef<Api | null>(null);
  const [assembly, setAssembly] = useState<VehicleAssemblyOptions>(
      initialVehicleAssembly,
    ),
    [parts, setParts] = useState<VehiclePart[]>([]),
    [error, setError] = useState('');
  const [query, setQuery] = useState(''),
    [labels, setLabels] = useState(true),
    [hood, setHood] = useState(false),
    [running, setRunning] = useState(false),
    [showParts, setShowParts] = useState(false),
    [high, setHigh] = useState(false);
  const [tour, setTour] = useState<number | null>(null),
    [tourPlaying, setTourPlaying] = useState(false),
    [recording, setRecording] = useState(false),
    [notice, setNotice] = useState('');
  const recorder = useRef<MediaRecorder | null>(null),
    lastShot = useRef(-1);
  const shot = tour === null ? null : carTourAt(tour);
  const effective = useMemo<SceneOptions>(
    () => ({
      ...base,
      playing:
        running &&
        assembly.explode === 0 &&
        !assembly.removed.length &&
        tour === null,
      labels,
      hoodOpen: hood && tour === null,
      quality: high ? 'high' : 'balanced',
      vehicleAssembly: shot
        ? {
            ...initialVehicleAssembly,
            system: shot.system,
            explode: shot.explode,
          }
        : assembly,
      carCaption: shot ? { title: shot.title, body: shot.body } : undefined,
    }),
    [running, labels, hood, high, assembly, shot, tour],
  );
  const current = useRef(effective);
  const tourClock = useRef(0);
  useEffect(() => {
    current.current = effective;
  }, [effective]);
  useEffect(() => {
    tourClock.current = tour ?? 0;
  }, [tour]);
  useEffect(() => {
    let cancelled = false;
    import('./scene')
      .then(({ createEngineScene }) => {
        if (cancelled || !host.current) return;
        const scene = createEngineScene(
          host.current,
          (id) => {
            setTour(null);
            setTourPlaying(false);
            setAssembly((s) => ({ ...s, selected: id, isolated: false }));
          },
          () => {},
        );
        api.current = scene;
        scene.setOptions(current.current);
        setParts(scene.getVehicleParts());
        scene.camera('home');
      })
      .catch((e) => setError(e.message));
    return () => {
      cancelled = true;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      api.current?.dispose();
      api.current = null;
    };
  }, []);
  useEffect(() => {
    api.current?.setOptions(effective);
  }, [effective, parts.length]);
  useEffect(() => {
    if (!shot) return;
    const index = CAR_TOUR.indexOf(shot);
    if (lastShot.current !== index) {
      lastShot.current = index;
      api.current?.camera(shot.camera);
    }
  }, [shot]);
  useEffect(() => {
    if (!tourPlaying) return;
    let frame = 0,
      previous = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - previous) / 1000);
      previous = now;
      const next = Math.min(CAR_TOUR_DURATION, tourClock.current + dt);
      tourClock.current = next;
      setTour(next);
      if (next >= CAR_TOUR_DURATION) {
        setTourPlaying(false);
        if (recorder.current?.state === 'recording') recorder.current.stop();
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [tourPlaying]);
  const selected = parts.find((p) => p.id === assembly.selected),
    filtered = parts.filter(
      (p) =>
        (assembly.system === 'all' || p.system === assembly.system) &&
        `${p.name} ${p.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  const isSeparated = (p: VehiclePart) =>
    !assembly.returned?.includes(p.id) &&
    (assembly.removed.includes(p.id) ||
      vehicleStage(assembly.explode, p.stage) > 0.01);
  function change(patch: Partial<VehicleAssemblyOptions>) {
    setTour(null);
    setTourPlaying(false);
    setAssembly((s) => ({ ...s, ...patch }));
  }
  function assemble() {
    setHood(false);
    setRunning(false);
    change({ ...initialVehicleAssembly, selected: assembly.selected });
  }
  function startTour() {
    setHood(false);
    setRunning(false);
    lastShot.current = -1;
    setTour(0);
    setTourPlaying(true);
  }
  function record() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    if (!api.current || typeof MediaRecorder === 'undefined') {
      setNotice('Recording is not supported by this browser.');
      return;
    }
    try {
      const stream = api.current.captureStream();
      const type = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ].find((t) => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(
        stream,
        type ? { mimeType: type, videoBitsPerSecond: 7000000 } : undefined,
      );
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        download(
          'how-things-click-corolla.webm',
          new Blob(chunks, { type: r.mimeType }),
        );
        api.current?.stopCapture();
        setRecording(false);
        setNotice(
          'Recording downloaded. Captions and the narration script are available below.',
        );
      };
      r.onerror = () => {
        setNotice('The browser could not finish recording.');
        setRecording(false);
        api.current?.stopCapture();
      };
      recorder.current = r;
      r.start(500);
      setRecording(true);
      startTour();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Recording could not start.');
    }
  }
  return (
    <div className="car-exhibit" ref={shell}>
      <header className="car-header">
        <Link className="car-brand" href="/">
          how things <em>click.</em>
        </Link>
        <span className="car-header-note">CURIOUS BY DESIGN</span>
        <Link className="car-engine-link" href="/engine">
          Engine lab <ArrowUpRight size={15} />
        </Link>
      </header>
      <div className="car-intro">
        <div>
          <span className="car-eyebrow">THE EVERYDAY, EXPLAINED · 001</span>
          <h1>Inside the Corolla.</h1>
        </div>
        <p>
          One car. Hundreds of connections.
          <br />
          Take it apart and see how they work together.
        </p>
      </div>
      <div className="car-workspace">
        <aside
          className={`car-library ${showParts ? 'is-open' : ''}`}
          aria-label="Car parts library"
        >
          <div className="car-library-title">
            <span>
              <Layers3 size={15} /> Explore the car
            </span>
            <Button
              className="car-mobile-close"
              aria-label="Close parts"
              onClick={() => setShowParts(false)}
            >
              <X size={17} />
            </Button>
          </div>
          <label className="car-search" htmlFor="car-part-search">
            <Search size={15} />
            <Input
              id="car-part-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a part…"
              aria-label="Search car parts"
            />
          </label>
          <div className="car-systems" aria-label="Car systems">
            {VEHICLE_SYSTEMS.map((s) => (
              <Button
                key={s.id}
                aria-pressed={assembly.system === s.id}
                onClick={() =>
                  change({ system: s.id, isolated: false, selected: null })
                }
              >
                <i style={{ background: s.color }} />
                {s.name}
                <span>
                  {
                    parts.filter((p) => s.id === 'all' || p.system === s.id)
                      .length
                  }
                </span>
              </Button>
            ))}
          </div>
          <div className="car-list-heading">
            {query ? 'SEARCH RESULTS' : 'PARTS'} <span>{filtered.length}</span>
          </div>
          <div className="car-parts-list">
            {filtered.map((p) => (
              <Button
                key={p.id}
                aria-pressed={assembly.selected === p.id}
                onClick={() => {
                  change({ selected: p.id, isolated: false });
                  setShowParts(false);
                }}
              >
                <span>{p.name}</span>
                {isSeparated(p) ? (
                  <Box size={13} />
                ) : (
                  <ChevronRight size={13} />
                )}
              </Button>
            ))}
            {parts.length > 0 && filtered.length === 0 && (
              <p>No matching parts. Try another name or system.</p>
            )}
          </div>
        </aside>
        <main className="car-main">
          <div className="car-stage" aria-label="3D car explorer">
            <div ref={host} className="car-canvas" />
            <div className="car-stage-top">
              <span className="car-status">
                <i />
                {parts.length
                  ? `COROLLA LE · ${parts.length} ASSEMBLIES`
                  : 'PREPARING YOUR EXPLORER'}
              </span>
              <Button
                onClick={() =>
                  shell.current
                    ?.requestFullscreen?.()
                    .catch(() =>
                      setNotice('Use your browser’s fullscreen command.'),
                    )
                }
                aria-label="Fullscreen"
              >
                <Maximize size={16} />
              </Button>
            </div>
            {!parts.length && !error && (
              <div className="car-loading">
                <div className="car-loader" />
                Building the car…
              </div>
            )}
            {error && (
              <div className="car-loading" role="alert">
                The 3D view could not load.<small>{error}</small>
                <Button onClick={() => location.reload()}>Reload</Button>
              </div>
            )}
            <div className="car-camera" aria-label="Camera views">
              {(['home', 'nose', 'rear', 'front', 'top'] as const).map(
                (view, i) => (
                  <Button
                    disabled={!parts.length}
                    key={view}
                    onClick={() => api.current?.camera(view)}
                  >
                    {['Perspective', 'Front', 'Rear', 'Side', 'Top'][i]}
                  </Button>
                ),
              )}
            </div>
            {shot ? (
              <div className="car-tour-caption" aria-live="polite">
                <span>
                  GUIDED TOUR · {Math.floor(tour ?? 0)} / {CAR_TOUR_DURATION}s
                </span>
                <h2>{shot.title}</h2>
                <p>{shot.body}</p>
              </div>
            ) : (
              !selected && (
                <div className="car-hint">
                  Drag to orbit · Scroll to zoom · Select a part
                </div>
              )
            )}
          </div>
          <div className="car-controls">
            <div className="car-assembly-buttons">
              <Button
                className="car-primary"
                disabled={!parts.length}
                onClick={() => {
                  setHood(false);
                  setRunning(false);
                  change({
                    explode: 1,
                    removed: [],
                    returned: [],
                    isolated: false,
                    system: 'all',
                  });
                }}
              >
                <Expand size={16} />
                Disassemble
              </Button>
              <Button disabled={!parts.length} onClick={assemble}>
                <RotateCcw size={15} />
                Assemble
              </Button>
              <Button
                className="car-mobile-parts"
                onClick={() => setShowParts((v) => !v)}
              >
                <Layers3 size={15} />
                Parts
              </Button>
            </div>
            <div className="car-separation">
              <span>
                Assembly{' '}
                <strong>
                  {Math.round((shot?.explode ?? assembly.explode) * 100)}%
                </strong>
              </span>
              <Slider
                min={0}
                max={100}
                value={[Math.round((shot?.explode ?? assembly.explode) * 100)]}
                aria-label="Car disassembly"
                onValueChange={(v) => {
                  setHood(false);
                  setRunning(false);
                  change({
                    explode: (Array.isArray(v) ? v[0] : v) / 100,
                    removed: [],
                    returned: [],
                  });
                }}
              />
            </div>
            <div className="car-view-options">
              <Button
                aria-pressed={labels}
                onClick={() => setLabels((v) => !v)}
              >
                <Tag size={14} />
                Labels
              </Button>
              <Button
                aria-pressed={assembly.colors}
                onClick={() => change({ colors: !assembly.colors })}
              >
                System colors
              </Button>
              <Button
                aria-pressed={hood}
                disabled={assembly.explode > 0 || tour !== null}
                onClick={() => setHood((v) => !v)}
              >
                Hood
              </Button>
              <Button
                aria-pressed={running}
                disabled={
                  assembly.explode > 0 ||
                  assembly.removed.length > 0 ||
                  tour !== null
                }
                onClick={() => setRunning((v) => !v)}
              >
                {running ? <Pause size={14} /> : <Play size={14} />}Run
              </Button>
              <Button aria-pressed={high} onClick={() => setHigh((v) => !v)}>
                High detail
              </Button>
            </div>
          </div>
          {selected && tour === null ? (
            <section className="car-detail" aria-label="Selected part">
              <div>
                <span className="car-eyebrow">
                  {VEHICLE_SYSTEMS.find((s) => s.id === selected.system)?.name}
                </span>
                <h2>{selected.name}</h2>
                <p>{selected.description}</p>
                <small>{selected.material}</small>
              </div>
              <div className="car-detail-actions">
                <Button onClick={() => api.current?.camera('focus')}>
                  <Crosshair size={15} />
                  Focus
                </Button>
                <Button
                  aria-pressed={assembly.isolated}
                  onClick={() => change({ isolated: !assembly.isolated })}
                >
                  Isolate
                </Button>
                <Button
                  onClick={() =>
                    change(
                      isSeparated(selected)
                        ? {
                            removed: assembly.removed.filter(
                              (id) => id !== selected.id,
                            ),
                            returned: [
                              ...(assembly.returned ?? []),
                              selected.id,
                            ],
                          }
                        : {
                            removed: [...assembly.removed, selected.id],
                            returned: assembly.returned?.filter(
                              (id) => id !== selected.id,
                            ),
                          },
                    )
                  }
                >
                  {isSeparated(selected) ? (
                    <Check size={15} />
                  ) : (
                    <Box size={15} />
                  )}
                  {isSeparated(selected) ? 'Return part' : 'Remove part'}
                </Button>
                {selected.id === 'car-engine' && (
                  <Link href="/engine">
                    Explore engine <ArrowUpRight size={14} />
                  </Link>
                )}
                <Button
                  aria-label="Clear selection"
                  onClick={() => change({ selected: null, isolated: false })}
                >
                  <X size={14} />
                </Button>
              </div>
            </section>
          ) : (
            <section className="car-tour-controls">
              <div>
                <span className="car-eyebrow">LOOK CLOSER</span>
                <h2>A guided journey through the car.</h2>
                <p>Exterior to chassis, then back together. Audio is off.</p>
              </div>
              <div>
                <Button
                  disabled={!parts.length}
                  onClick={() =>
                    tour === null || tour >= CAR_TOUR_DURATION
                      ? startTour()
                      : setTourPlaying((v) => !v)
                  }
                >
                  {tourPlaying ? <Pause size={15} /> : <Play size={15} />}
                  {tour === null
                    ? 'Play tour'
                    : tour >= CAR_TOUR_DURATION
                      ? 'Replay tour'
                      : tourPlaying
                        ? 'Pause'
                        : 'Resume'}
                </Button>
                {tour !== null && (
                  <Button
                    onClick={() => {
                      setTour(null);
                      setTourPlaying(false);
                      change(initialVehicleAssembly);
                    }}
                  >
                    Exit tour
                  </Button>
                )}
                <Button disabled={!parts.length} onClick={record}>
                  <Film size={15} />
                  {recording ? 'Stop recording' : 'Record tour'}
                </Button>
              </div>
              {tour !== null && (
                <Slider
                  className="car-tour-scrub"
                  min={0}
                  max={CAR_TOUR_DURATION}
                  step={0.1}
                  value={[tour]}
                  aria-label="Tour timeline"
                  onValueChange={(v) => setTour(Array.isArray(v) ? v[0] : v)}
                />
              )}
            </section>
          )}
        </main>
      </div>
      <footer className="car-footer">
        <span>
          Photo-referenced educational model · Geometry is being refined.
        </span>
        <div>
          <Button
            onClick={() =>
              download(
                'corolla-tour.srt',
                new Blob([carTourSrt()], { type: 'text/plain' }),
              )
            }
          >
            Tour captions
          </Button>
          <Button
            onClick={() =>
              download(
                'corolla-tour-script.txt',
                new Blob(
                  [CAR_TOUR.map((s) => `${s.title}\n${s.body}`).join('\n\n')],
                  { type: 'text/plain' },
                ),
              )
            }
          >
            Narration script
          </Button>
          <Link href="/engine">
            Explore the engine <ArrowUpRight size={13} />
          </Link>
        </div>
      </footer>
      {notice && (
        <output className="car-notice">
          {notice}
          <Button aria-label="Dismiss notice" onClick={() => setNotice('')}>
            <X size={14} />
          </Button>
        </output>
      )}
    </div>
  );
}
