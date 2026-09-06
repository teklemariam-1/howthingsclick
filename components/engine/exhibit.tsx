'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Box,
  CarFront,
  ChevronRight,
  CircleHelp,
  Crosshair,
  Download,
  Droplets,
  Expand,
  Film,
  Layers3,
  Maximize,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  Tag,
  Thermometer,
  Volume2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PARTS,
  SYSTEMS,
  SYSTEM_COLORS,
  FLOW_LEGEND,
  findPart,
  type SystemId,
} from '@/lib/engine/catalog';
import { strokeAt } from '@/lib/engine/mechanics';
import {
  sampleTour,
  tourDuration,
  tourShots,
  exportScript,
  exportSrt,
  type TourVariant,
} from '@/lib/engine/tour';
import type { SceneOptions } from './scene';
type EngineApi = ReturnType<(typeof import('./scene'))['createEngineScene']>;
const initial: SceneOptions = {
  playing: true,
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
  colors: true,
  flows: false,
  throttle: 0.32,
  peel: 0,
  tourTime: null,
  tourVariant: 'full',
  carContext: true,
  vehicleView: 'bay',
  hoodOpen: true,
};
const systemIcons = [
  Box,
  Settings2,
  RotateCcw,
  Sparkles,
  Droplets,
  Thermometer,
];
const sliderValue = (v: number | readonly number[]) =>
  typeof v === 'number' ? v : v[0];
const timeLabel = (v: number) =>
  `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
function downloadFile(name: string, contents: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export default function EngineExhibit() {
  const host = useRef<HTMLDivElement>(null),
    exhibit = useRef<HTMLElement>(null),
    api = useRef<EngineApi | null>(null);
  const [controls, setControls] = useState<SceneOptions>(initial),
    [cycle, setCycle] = useState(28),
    [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const [query, setQuery] = useState(''),
    [showParts, setShowParts] = useState(false),
    [showHelp, setShowHelp] = useState(false),
    [notice, setNotice] = useState('');
  const [tourTime, setTourTime] = useState<number | null>(null),
    [tourPlaying, setTourPlaying] = useState(false),
    [variant, setVariant] = useState<TourVariant>('full'),
    [narration, setNarration] = useState(false),
    [cinema, setCinema] = useState(false),
    [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    tourTimeRef = useRef(tourTime);
  tourTimeRef.current = tourTime;
  const sample = tourTime === null ? null : sampleTour(tourTime, variant);
  const effective: SceneOptions = sample
    ? {
        ...controls,
        playing: tourPlaying,
        system: sample.shot.system,
        selected: null,
        removed: [],
        isolated: false,
        cutaway: sample.cutaway,
        explode: sample.explode,
        peel: sample.peel,
        throttle: sample.throttle,
        warm: sample.warm,
        flows: sample.cutaway,
        labels: false,
        tourTime,
        tourVariant: variant,
      }
    : controls;
  const controlRef = useRef(effective);
  controlRef.current = effective;
  const currentSystem = SYSTEMS.find((x) => x.id === effective.system)!,
    selected = findPart(effective.selected);
  const blocked = controls.removed.length > 0 || controls.explode > 0,
    touring = tourTime !== null;
  const update = (patch: Partial<SceneOptions>) =>
    setControls((p) => ({ ...p, ...patch }));
  useEffect(() => {
    let active = true,
      local: EngineApi | null = null;
    setReady(false);
    setError('');
    import('./scene')
      .then(({ createEngineScene }) => {
        if (!active || !host.current) return;
        try {
          local = createEngineScene(
            host.current,
            (id) => {
              if (tourTimeRef.current !== null) return;
              setControls((c) => ({ ...c, selected: id, isolated: false }));
            },
            setCycle,
          );
          api.current = local;
          const next = { ...controlRef.current };
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            next.playing = false;
            setControls(next);
          }
          local.setOptions(next);
          setReady(true);
        } catch (e) {
          setError(
            e instanceof Error ? e.message : 'The 3D view could not start.',
          );
        }
      })
      .catch(() => setError('The 3D view could not load. Please try again.'));
    return () => {
      active = false;
      if (recorder.current && recorder.current.state !== 'inactive')
        recorder.current.stop();
      local?.dispose();
      api.current = null;
    };
  }, [retry]);
  useEffect(() => {
    api.current?.setOptions(effective);
  }, [effective]);
  useEffect(() => {
    if (!tourPlaying) return;
    let previous = performance.now(),
      accumulated = 0,
      id = 0;
    function step(now: number) {
      const dt = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      if (!document.hidden) {
        accumulated += dt;
        if (accumulated >= 0.05) {
          const advance = accumulated;
          accumulated = 0;
          setTourTime((t) =>
            Math.min(tourDuration(variant), (t ?? 0) + advance),
          );
        }
      }
      id = requestAnimationFrame(step);
    }
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [tourPlaying, variant]);
  useEffect(() => {
    if (sample?.done) {
      setTourPlaying(false);
      if (recorder.current && recorder.current.state !== 'inactive')
        recorder.current.stop();
    }
  }, [sample?.done]);
  useEffect(() => {
    const visibility = () => {
      const media = recorder.current;
      if (document.hidden && media?.state === 'recording') media.pause();
      if (!document.hidden && media?.state === 'paused') media.resume();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (narration && tourPlaying && sample) {
      const utterance = new SpeechSynthesisUtterance(sample.shot.narration);
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
    return () => window.speechSynthesis.cancel();
  }, [narration, tourPlaying, sample?.index, variant]);
  function stopRecording() {
    if (recorder.current && recorder.current.state !== 'inactive')
      recorder.current.stop();
  }
  function takeControl() {
    stopRecording();
    setTourPlaying(false);
    setTourTime(null);
    setControls({
      ...controlRef.current,
      tourTime: null,
      peel: 0,
      explode: 0,
      playing: false,
      labels: true,
      removed: [],
    });
    setNotice(
      'Your turn. Open the throttle, inspect a part, or explore another system.',
    );
  }
  function reset() {
    stopRecording();
    setTourPlaying(false);
    setTourTime(null);
    setControls({ ...initial, playing: false });
    setNotice('Complete engine restored.');
    api.current?.seek(28);
    api.current?.camera('home');
  }
  function selectSystem(id: SystemId) {
    if (touring) takeControl();
    setControls((c) => ({
      ...c,
      system: id,
      isolated: false,
      selected: null,
      explode: 0,
      removed: [],
      peel: 0,
      cutaway: id !== 'all',
      flows: ['mechanics', 'oil', 'cooling', 'combustion'].includes(id),
      playing: true,
    }));
    setNotice('');
  }
  function choosePart(id: string) {
    if (touring) takeControl();
    setControls((c) => ({ ...c, selected: id, isolated: false }));
    setShowParts(false);
  }
  function removeSelected() {
    if (!selected) return;
    const removed = controls.removed.includes(selected.id)
      ? controls.removed.filter((id) => id !== selected.id)
      : [...controls.removed, selected.id];
    update({ removed, playing: false, isolated: false });
    setNotice(
      removed.includes(selected.id)
        ? `${selected.name} separated for inspection. Engine motion is paused.`
        : `${selected.name} returning to the engine.`,
    );
  }
  function assemble() {
    update({
      explode: 0,
      removed: [],
      peel: 0,
      isolated: false,
      cutaway: false,
      system: 'all',
      selected: null,
      playing: false,
      flows: false,
    });
    setNotice('Reassembling every part, including the exterior covers.');
  }
  function disassemble() {
    update({
      explode: 1,
      removed: [],
      peel: 0,
      isolated: false,
      cutaway: false,
      system: 'all',
      selected: null,
      playing: false,
      flows: false,
    });
    setNotice(
      'Covers first, then the internal assemblies. Drag to explore the exploded view.',
    );
  }
  function play() {
    if (blocked) {
      setNotice('Assemble the engine before running it.');
      return;
    }
    update({ playing: !controls.playing });
  }
  function startTour() {
    stopRecording();
    setTourTime(0);
    setTourPlaying(true);
    setShowHelp(false);
    setShowParts(false);
    setNotice('');
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await exhibit.current?.requestFullscreen();
    } catch {
      setCinema((c) => !c);
    }
  }
  function recordTour() {
    if (!api.current || typeof MediaRecorder === 'undefined') {
      setNotice(
        'Use a desktop Chromium browser to record, or screen-record the presentation view.',
      );
      return;
    }
    try {
      setNarration(false);
      setTourTime(0);
      setTourPlaying(true);
      setCinema(true);
      const stream = api.current.captureStream();
      const mime = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/mp4',
      ].find((x) => MediaRecorder.isTypeSupported(x));
      if (!mime) throw new Error('No supported recording format.');
      const media = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 8000000,
      });
      const chunks: Blob[] = [];
      media.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      media.onstop = () => {
        setRecording(false);
        api.current?.stopCapture();
        if (chunks.length)
          downloadFile(
            `how-things-click-engine-${variant}.${mime.includes('mp4') ? 'mp4' : 'webm'}`,
            new Blob(chunks, { type: mime }),
            mime,
          );
        setNotice(
          'Silent video saved. Add your narration track and the exported captions in your video editor.',
        );
      };
      media.onerror = () => {
        setNotice('The browser could not continue recording.');
        stopRecording();
      };
      recorder.current = media;
      media.start(250);
      setRecording(true);
      setNotice(
        'Recording locally. Keep this tab visible; no microphone is used.',
      );
    } catch (e) {
      api.current?.stopCapture();
      setRecording(false);
      setNotice(e instanceof Error ? e.message : 'Recording could not start.');
    }
  }
  const filtered = PARTS.filter(
    (p) =>
      (effective.system === 'all' || p.system === effective.system) &&
      (p.name + ' ' + p.assembly).toLowerCase().includes(query.toLowerCase()),
  );
  const legend = FLOW_LEGEND.filter(
    (f) =>
      effective.system === 'all' ||
      (effective.system === 'mechanics' &&
        !['cooling', 'oil'].includes(f.id)) ||
      effective.system === f.id ||
      (effective.system === 'combustion' &&
        ['air', 'fuel', 'burn', 'exhaust'].includes(f.id)),
  );
  return (
    <main className={`engine-app ${cinema ? 'cinema-mode' : ''}`} ref={exhibit}>
      <header className="site-topbar">
        <a className="wordmark" href="/" aria-label="How Things Click home">
          how things <span>click.</span>
        </a>
        <div className="topbar-middle">
          <span className="section-index">01 / MACHINES</span>
          <span className="topbar-divider" />
          <span>Inside the engine</span>
        </div>
        <span className="preview-status">
          <span />
          Interactive engine lab
        </span>
      </header>
      <div className="exhibit-layout">
        <aside className="system-rail">
          <div className="rail-heading">
            <span>EXPLORE</span>
            <span className="rail-count">06</span>
          </div>
          <Tabs
            orientation="vertical"
            value={effective.system}
            onValueChange={(v) => selectSystem(v as SystemId)}
            className="system-tabs"
          >
            <TabsList className="systems-list" aria-label="Engine systems">
              {SYSTEMS.map((s, i) => {
                const Icon = systemIcons[i];
                return (
                  <TabsTrigger
                    key={s.id}
                    value={s.id}
                    className="system-trigger"
                  >
                    <Icon size={17} style={{ color: SYSTEM_COLORS[s.id] }} />
                    <span>{s.name}</span>
                    <ChevronRight className="system-chevron" size={14} />
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <div className="rail-rule" />
          <div className="rail-heading">
            <span>PART LIBRARY</span>
            <span className="rail-count">{PARTS.length}</span>
          </div>
          <div className="part-search">
            <Search size={15} />
            <Input
              aria-label="Search engine parts"
              placeholder="Find a part…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="parts-list">
            {filtered.map((p) => (
              <button
                key={p.id}
                className={`part-row ${effective.selected === p.id ? 'selected' : ''}`}
                onClick={() => choosePart(p.id)}
              >
                <span>{p.name}</span>
                {controls.removed.includes(p.id) ? (
                  <ArrowUpRight size={13} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </button>
            ))}
            {!filtered.length && (
              <p className="no-parts">No matching parts in this system.</p>
            )}
          </div>
          <Button variant="ghost" className="tour-entry" onClick={startTour}>
            <Play size={15} />
            Play the engine tour <ArrowUpRight size={14} />
          </Button>
        </aside>
        <section className="workspace">
          <div className="exhibit-heading">
            <div>
              <p className="eyebrow">2025 COROLLA · INLINE-FOUR STUDY</p>
              <h1>
                Inside the engine<span>.</span>
              </h1>
            </div>
            <div className="heading-actions">
              <Button
                variant="outline"
                className="mobile-parts"
                onClick={() => setShowParts(!showParts)}
              >
                <Search size={16} />
                Parts
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Help and model information"
                onClick={() => setShowHelp(!showHelp)}
              >
                <CircleHelp size={19} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open full screen"
                onClick={fullscreen}
              >
                <Maximize size={19} />
              </Button>
            </div>
          </div>
          <div className="mobile-systems">
            {SYSTEMS.map((s) => (
              <button
                key={s.id}
                aria-pressed={effective.system === s.id}
                onClick={() => selectSystem(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="assembly-toolbar">
            <div className="assembly-actions">
              <Button
                variant={blocked ? 'outline' : 'default'}
                onClick={assemble}
                disabled={touring}
              >
                <Box size={16} />
                Assemble
              </Button>
              <Button
                variant={blocked ? 'default' : 'outline'}
                onClick={disassemble}
                disabled={touring}
              >
                <Expand size={16} />
                Disassemble
              </Button>
            </div>
            <span className="assembly-count">
              {PARTS.length} inspectable assemblies <span>·</span> 4 cylinders{' '}
              <span>·</span> 16 valves
            </span>
            <Button
              variant="outline"
              className="toolbar-tour"
              onClick={startTour}
              disabled={!ready}
            >
              <Play size={15} />
              Play tour <span>{timeLabel(tourDuration(variant))}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                cinema ? 'Exit presentation view' : 'Open presentation view'
              }
              onClick={() => setCinema(!cinema)}
            >
              <Film size={18} />
            </Button>
          </div>
          <div className="stage-shell">
            <div className="model-host" ref={host} />
            {!ready && !error && (
              <div className="model-loading" role="status">
                <span className="loading-ring" />
                Preparing the engine
              </div>
            )}
            {error && (
              <div className="model-error" role="alert">
                <h2>The 3D view could not start.</h2>
                <p>{error}</p>
                <Button onClick={() => setRetry((x) => x + 1)}>
                  Try again
                </Button>
              </div>
            )}
            <div className="stage-context">
              <span className="stage-dot" />
              {recording
                ? 'RECORDING'
                : touring
                  ? 'GUIDED TOUR'
                  : blocked
                    ? 'EXPLODED ASSEMBLY'
                    : controls.playing
                      ? 'RUNNING · SLOW MOTION'
                      : 'PAUSED'}
              <span className="stage-context-rule" />
              {currentSystem.name.toUpperCase()}
            </div>
            {cinema && (
              <Button
                className="exit-cinema"
                variant="outline"
                onClick={() => setCinema(false)}
              >
                <X size={16} />
                Exit presentation
              </Button>
            )}
            {!touring && (
              <div className="camera-tools" aria-label="Camera controls">
                <Button
                  variant="ghost"
                  className="camera-text"
                  aria-label="Car context"
                  aria-pressed={
                    controls.carContext && controls.system === 'all'
                  }
                  title="Explore the engine bay, chassis and exterior"
                  onClick={() =>
                    update({
                      carContext: !(
                        controls.carContext && controls.system === 'all'
                      ),
                      system: 'all',
                      selected: null,
                      isolated: false,
                      explode: 0,
                      removed: [],
                      peel: 0,
                      cutaway: false,
                      flows: false,
                    })
                  }
                >
                  <CarFront size={17} /> Car
                </Button>
                <span />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Reset camera"
                  onClick={() => api.current?.camera('home')}
                >
                  <RotateCcw size={17} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Zoom in"
                  onClick={() => api.current?.camera('zoom-in')}
                >
                  <Plus size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Zoom out"
                  onClick={() => api.current?.camera('zoom-out')}
                >
                  <Minus size={18} />
                </Button>
                <span />
                <Button
                  variant="ghost"
                  className="camera-text"
                  onClick={() => api.current?.camera('front')}
                >
                  Side
                </Button>
                <Button
                  variant="ghost"
                  className="camera-text"
                  onClick={() => api.current?.camera('top')}
                >
                  Top
                </Button>
              </div>
            )}
            {effective.flows && legend.length > 0 && (
              <div className="flow-legend">
                {legend.map((f) => (
                  <span key={f.id}>
                    <i style={{ background: f.color }} />
                    {f.label}
                  </span>
                ))}
                {effective.system === 'cooling' && (
                  <span className="circuit-state">
                    {effective.warm ? 'Radiator route open' : 'Cold bypass'}
                  </span>
                )}
              </div>
            )}
            {effective.carContext &&
              effective.system === 'all' &&
              !blocked &&
              !touring && (
                <div
                  className="vehicle-view-controls"
                  aria-label="Vehicle views"
                >
                  {(
                    [
                      ['bay', 'Engine bay'],
                      ['chassis', 'Chassis'],
                      ['body', 'Exterior'],
                    ] as const
                  ).map(([view, label]) => (
                    <Button
                      key={view}
                      variant="ghost"
                      aria-pressed={controls.vehicleView === view}
                      onClick={() =>
                        update({
                          vehicleView: view,
                          hoodOpen: view === 'bay',
                          cutaway: false,
                          flows: false,
                          selected: null,
                        })
                      }
                    >
                      {label}
                    </Button>
                  ))}
                  {controls.vehicleView === 'body' && (
                    <Button
                      variant="ghost"
                      onClick={() => update({ hoodOpen: !controls.hoodOpen })}
                    >
                      {controls.hoodOpen ? 'Close hood' : 'Open hood'}
                    </Button>
                  )}
                </div>
              )}
            <div className="stage-footnote">
              <span>
                Drag to rotate <span>·</span> Scroll or pinch to zoom
              </span>
              <span>
                {blocked
                  ? 'Exploded assembly'
                  : effective.cutaway
                    ? 'Cutaway view'
                    : effective.carContext &&
                        effective.vehicleView === 'chassis'
                      ? 'Chassis & powertrain'
                      : effective.carContext && effective.vehicleView === 'bay'
                        ? 'Under the hood'
                        : 'Complete exterior'}{' '}
                <span>·</span>{' '}
                {effective.carContext &&
                effective.system === 'all' &&
                !blocked &&
                !effective.peel
                  ? 'Illustrative wheel motion'
                  : 'Metallic materials'}
              </span>
            </div>
            {selected && (
              <div className="part-inspector">
                <div className="inspector-heading">
                  <span style={{ color: SYSTEM_COLORS[selected.system] }}>
                    {selected.assembly.toUpperCase()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close part details"
                    onClick={() => update({ selected: null, isolated: false })}
                  >
                    <X size={15} />
                  </Button>
                </div>
                <h2>{selected.name}</h2>
                <p>{selected.description}</p>
                <div className="part-material">{selected.material}</div>
                <div className="inspector-actions">
                  <Button
                    variant="outline"
                    onClick={() => api.current?.camera('focus')}
                  >
                    <Crosshair size={14} />
                    Focus
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => update({ isolated: !controls.isolated })}
                  >
                    {controls.isolated ? 'Show all' : 'Isolate'}
                  </Button>
                  <Button variant="outline" onClick={removeSelected}>
                    {controls.removed.includes(selected.id)
                      ? 'Return'
                      : 'Remove'}
                  </Button>
                </div>
              </div>
            )}
            {sample && (
              <div className="tour-caption">
                <span>
                  {String(sample.index + 1).padStart(2, '0')} /{' '}
                  {String(tourShots(variant).length).padStart(2, '0')}
                </span>
                <div>
                  <h2>{sample.shot.title}</h2>
                  <p>{sample.shot.narration}</p>
                </div>
              </div>
            )}
            {showHelp && (
              <div className="help-panel">
                <div className="inspector-heading">
                  <span>ABOUT THIS MODEL</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close help"
                    onClick={() => setShowHelp(false)}
                  >
                    <X size={15} />
                  </Button>
                </div>
                <h2>A representative petrol engine.</h2>
                <p>
                  A modern transverse inline-four with two camshafts, 16 valves,
                  a timing chain and dual fuel injection. All {PARTS.length}{' '}
                  named assemblies are modeled, including the covers and sealing
                  layers.
                </p>
                <p>
                  The mechanisms share one cycle clock. Valve events, colored
                  flow paths and throttle response are educational
                  illustrations, not pressure, power or temperature
                  calculations. Disassembly explains structure, not a workshop
                  procedure. The exterior, chassis and engine bay use the 2025
                  Toyota Corolla SE as a reference. This is an original
                  educational model, not Toyota CAD. The transaxle housing is
                  shown; internal transmission operation is simplified.
                </p>
                <p>
                  Recording is silent. Download the narration script and
                  captions to add a studio voice track. The optional device
                  voice plays only after you enable it.
                </p>
                <a
                  href="https://www.bosch-mobility.com/en/solutions/powertrain/gasoline/gasoline-port-fuel-injection/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Port injection · Bosch <ArrowUpRight size={13} />
                </a>
                <a
                  href="https://www.energy.gov/cmei/vehicles/articles/internal-combustion-engine-basics"
                  target="_blank"
                  rel="noreferrer"
                >
                  Engine principles · US Department of Energy{' '}
                  <ArrowUpRight size={13} />
                </a>
              </div>
            )}
            {showParts && (
              <div className="mobile-parts-panel">
                <div className="inspector-heading">
                  <span>FIND A PART</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close parts"
                    onClick={() => setShowParts(false)}
                  >
                    <X size={15} />
                  </Button>
                </div>
                <Input
                  placeholder="Search parts…"
                  aria-label="Search mobile parts"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="parts-list">
                  {filtered.map((p) => (
                    <button
                      className="part-row"
                      key={p.id}
                      onClick={() => choosePart(p.id)}
                    >
                      {p.name}
                      <ChevronRight size={13} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {sample && (
            <div className="tour-player">
              <div className="tour-transport">
                <Button
                  size="icon"
                  aria-label={tourPlaying ? 'Pause tour' : 'Resume tour'}
                  disabled={recording}
                  onClick={() => {
                    if (sample.done) setTourTime(0);
                    setTourPlaying(!tourPlaying);
                  }}
                >
                  {tourPlaying ? <Pause size={18} /> : <Play size={18} />}
                </Button>
                <span>
                  {timeLabel(tourTime ?? 0)} /{' '}
                  {timeLabel(tourDuration(variant))}
                </span>
                <span id="tour-timeline-label" className="sr-only">
                  Tour timeline
                </span>
                <Slider
                  aria-labelledby="tour-timeline-label"
                  min={0}
                  max={tourDuration(variant)}
                  step={0.1}
                  disabled={recording}
                  value={[tourTime ?? 0]}
                  onValueChange={(v) => setTourTime(sliderValue(v))}
                />
                <Button variant="outline" onClick={takeControl}>
                  Take control <ArrowUpRight size={15} />
                </Button>
              </div>
              <div className="tour-chapters">
                {tourShots(variant).map((shot, i) => (
                  <button
                    key={shot.id}
                    disabled={recording}
                    aria-current={sample.index === i ? 'step' : undefined}
                    onClick={() =>
                      setTourTime(
                        tourShots(variant)
                          .slice(0, i)
                          .reduce((s, x) => s + x.duration, 0),
                      )
                    }
                  >
                    {String(i + 1).padStart(2, '0')} {shot.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className={`playback-panel ${touring ? 'during-tour' : ''}`}>
            <fieldset disabled={touring} className="manual-controls">
              <div className="playback-main">
                <Button
                  className="play-control"
                  size="icon"
                  aria-label={controls.playing ? 'Pause engine' : 'Run engine'}
                  onClick={play}
                  disabled={!ready || touring}
                >
                  {controls.playing ? <Pause size={18} /> : <Play size={18} />}
                </Button>
                <div className="cycle-control">
                  <div className="control-caption">
                    <label id="cycle-label">ENGINE CYCLE</label>
                    <span>
                      <strong>{Math.round(cycle)}°</strong> / 720°
                    </span>
                  </div>
                  <Slider
                    aria-labelledby="cycle-label"
                    value={[cycle]}
                    min={0}
                    max={719.9}
                    step={0.1}
                    onValueChange={(v) => {
                      update({ playing: false });
                      api.current?.seek(sliderValue(v));
                    }}
                  />
                  <div className="cycle-ticks">
                    <span>Firing</span>
                    <span>Exhaust</span>
                    <span>Intake</span>
                    <span>Compression</span>
                  </div>
                </div>
                <div className="speed-control">
                  <label id="speed-label">PLAYBACK</label>
                  <Select
                    value={String(controls.speed)}
                    onValueChange={(value) => update({ speed: Number(value) })}
                  >
                    <SelectTrigger aria-labelledby="speed-label">
                      <SelectValue>
                        {controls.speed === 0.12
                          ? 'Very slow'
                          : controls.speed === 0.32
                            ? 'Slow motion'
                            : 'Faster'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.12">Very slow</SelectItem>
                      <SelectItem value="0.32">Slow motion</SelectItem>
                      <SelectItem value="0.7">Faster</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  className="reset-control"
                  onClick={reset}
                >
                  <RotateCcw size={15} />
                  <span>Reset</span>
                </Button>
              </div>
              <div className="view-controls">
                <label className="toggle-control">
                  <Switch
                    checked={controls.cutaway}
                    onCheckedChange={(value) => update({ cutaway: value })}
                  />
                  <Layers3 size={15} />
                  Cutaway
                </label>
                <label className="toggle-control">
                  <Switch
                    checked={controls.labels}
                    onCheckedChange={(value) => update({ labels: value })}
                  />
                  <Tag size={15} />
                  Labels
                </label>
                <label className="toggle-control">
                  <Switch
                    checked={controls.colors}
                    onCheckedChange={(colors) => update({ colors })}
                  />
                  System colors
                </label>
                <label className="toggle-control">
                  <Switch
                    checked={controls.flows}
                    onCheckedChange={(flows) => update({ flows })}
                  />
                  Animated flows
                </label>
                <div className="explode-control">
                  <label id="explode-label">
                    <Expand size={15} />
                    Disassembly
                  </label>
                  <Slider
                    aria-labelledby="explode-label"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[controls.explode]}
                    onValueChange={(v) =>
                      update({
                        explode: sliderValue(v),
                        playing: false,
                        isolated: false,
                        cutaway: false,
                        selected: null,
                      })
                    }
                  />
                </div>
              </div>
              {(controls.system === 'combustion' ||
                controls.system === 'mechanics' ||
                controls.system === 'all') && (
                <div className="throttle-control">
                  <label id="throttle-label">
                    THROTTLE OPENING{' '}
                    <strong>{Math.round(controls.throttle * 100)}%</strong>
                  </label>
                  <Slider
                    aria-labelledby="throttle-label"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={[controls.throttle]}
                    onValueChange={(v) => update({ throttle: sliderValue(v) })}
                  />
                  <span>Butterfly angle & illustrative flow</span>
                </div>
              )}
              {controls.system === 'cooling' && (
                <label className="toggle-control temperature-toggle">
                  <Switch
                    checked={controls.warm}
                    onCheckedChange={(warm) => update({ warm })}
                  />
                  {controls.warm
                    ? 'Warm engine · radiator route'
                    : 'Cold engine · bypass route'}
                </label>
              )}
            </fieldset>
            <p className="notice" aria-live="polite">
              {notice ||
                (touring
                  ? 'Pause, jump to a chapter, or take control at any time.'
                  : 'Select a part to inspect it. Assemble restores all covers; Cutaway opens a view inside.')}
            </p>
          </div>
          <div className="creator-strip">
            <div>
              <Film size={19} />
              <div>
                <strong>One tour. Two ways to explore.</strong>
                <span>
                  Play here, or record a silent video with the same shots and
                  captions.
                </span>
              </div>
            </div>
            <div className="creator-actions">
              <Select
                value={variant}
                disabled={recording}
                onValueChange={(v) => {
                  setVariant(v as TourVariant);
                  setTourTime(null);
                  setTourPlaying(false);
                }}
              >
                <SelectTrigger aria-label="Tour version">
                  <SelectValue>
                    {variant === 'full' ? 'Full tour' : 'YouTube teaser'} ·{' '}
                    {timeLabel(tourDuration(variant))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full tour</SelectItem>
                  <SelectItem value="teaser">YouTube teaser</SelectItem>
                </SelectContent>
              </Select>
              <label className="toggle-control">
                <Switch
                  checked={narration}
                  disabled={recording}
                  onCheckedChange={(v) => {
                    if (!('speechSynthesis' in window)) {
                      setNotice(
                        'Device narration is unavailable. Download the script for an external voice track.',
                      );
                      return;
                    }
                    setNarration(v);
                  }}
                />
                <Volume2 size={15} />
                Device voice
              </label>
              <Button
                variant="outline"
                disabled={!ready}
                onClick={recording ? stopRecording : recordTour}
              >
                {recording ? (
                  <>
                    <span className="record-dot" />
                    Stop & save
                  </>
                ) : (
                  <>
                    <Film size={15} />
                    Record tour
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  downloadFile(
                    `engine-${variant}.srt`,
                    exportSrt(variant),
                    'text/plain',
                  )
                }
              >
                <Download size={15} />
                Captions
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  downloadFile(
                    `engine-${variant}-narration.txt`,
                    exportScript(variant),
                    'text/plain',
                  )
                }
              >
                <Download size={15} />
                Script
              </Button>
            </div>
          </div>
          <div className="explanation-strip">
            <div className="explanation-copy">
              <p className="eyebrow">{currentSystem.eyebrow}</p>
              <h2>{currentSystem.title}</h2>
              <p>{currentSystem.description}</p>
            </div>
            <div className="cylinder-monitor">
              <div className="control-caption">
                <span>CYLINDER ACTIVITY</span>
                <span>1–3–4–2</span>
              </div>
              <div className="cylinder-cells">
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    className={`cylinder-cell ${strokeAt(cycle, n).toLowerCase()}`}
                    onClick={() => choosePart(`piston-${n + 1}`)}
                  >
                    <span>0{n + 1}</span>
                    <strong>{strokeAt(cycle, n)}</strong>
                    <i />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <footer className="exhibit-footer">
            <span>
              HOW THINGS CLICK <span>/</span> ENGINE EXPLORER
            </span>
            <span>
              Representative geometry · idealized valve events · illustrative
              flows
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}
