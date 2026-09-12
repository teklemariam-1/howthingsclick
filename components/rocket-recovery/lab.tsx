'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Play,
  Pause,
  RotateCcw,
  Expand,
  Download,
  Video,
  Square,
  Wind,
  SlidersHorizontal,
  MousePointer2,
  ChevronRight,
  Check,
  Volume2,
  Camera,
  Info,
} from 'lucide-react';
import Brand from '@/components/brand';
import PageLink from '@/components/page-link';
import { TourAudio } from '@/components/engine/tour-audio';
import {
  simulate,
  sampleFlight,
  sampleShort,
  specs,
  views,
  smooth,
  defaultSettings,
  SHORT_DURATION,
  type Settings,
  type Vehicle,
  type View,
} from '@/lib/rocket-recovery/simulation';
import type { createRecoveryScene, Display } from './scene';
import './lab.css';
const stamp = (n: number) =>
  Math.floor(n / 60) + ':' + String(Math.floor(n % 60)).padStart(2, '0');
const initialFlight = simulate(defaultSettings),
  initialTime = initialFlight.contactTime - 2.8;
const partInfo: Record<string, string> = {
  'Propellant tanks':
    'The tank barrel stores liquid oxygen and fuel. Falcon 9 uses RP-1 kerosene; Super Heavy uses methane. The shell is not the tower’s catch surface.',
  'Grid fins':
    'Open lattice surfaces rotate in the airflow to change aerodynamic forces and help orient the descending booster.',
  'Engine cluster':
    'The controller regulates thrust. Gimballed engines redirect force to correct the flight path. Not every engine fires throughout the landing burn.',
  'Landing legs':
    'Four legs deploy near the end of descent. Their structure carries Falcon 9 after touchdown; the engine supplies the braking before contact.',
  'Catch arms':
    'Two arms support the descending booster at dedicated catch interfaces below the grid fins.',
  'Catch carriage':
    'The carriage connects the arms to vertical rails on the tower and transfers the load into its structure.',
  'Launch tower':
    'The tower carries lifting and catch equipment. Both tower and vehicle health checks matter before committing to a catch.',
};
function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="rr-range">
      <span>
        {label}
        <output>
          {Math.round(value * 10) / 10}
          {unit}
        </output>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export default function RecoveryLab() {
  const host = useRef<HTMLDivElement>(null),
    stage = useRef<HTMLDivElement>(null),
    api = useRef<ReturnType<typeof createRecoveryScene> | null>(null),
    tourSample = useRef<((t: number) => Display) | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [settings, setSettings] = useState<Settings>(defaultSettings),
    [view, setView] = useState<View>('recovery'),
    [time, setTime] = useState(initialTime),
    [playing, setPlaying] = useState(false),
    [guided, setGuided] = useState(false),
    [labels, setLabels] = useState(true),
    [explode, setExplode] = useState(0),
    [fin, setFin] = useState(0),
    [deploy, setDeploy] = useState(1),
    [armOpen, setArmOpen] = useState(0),
    [selected, setSelected] = useState(''),
    [recording, setRecording] = useState(false),
    [notice, setNotice] = useState(''),
    [fileName, setFileName] = useState(''),
    [voiceEnabled, setVoiceEnabled] = useState(false),
    [download, setDownload] = useState<{ url: string; name: string } | null>(
      null,
    ),
    [details, setDetails] = useState(false);
  const playback = useRef({
    settings: defaultSettings,
    flight: initialFlight,
    view: 'recovery' as View,
    time: initialTime,
    playing: false,
    guided: false,
    labels: true,
    explode: 0,
    fin: 0,
    deploy: 1,
    armOpen: 0,
  });
  const recorder = useRef<MediaRecorder | null>(null),
    audio = useRef<TourAudio | null>(null),
    audioEnabled = useRef(false),
    objectURL = useRef(''),
    mounted = useRef(true),
    streamRef = useRef<MediaStream | null>(null);
  function display(): Display {
    const s = playback.current;
    if (s.guided && tourSample.current) return tourSample.current(s.time);
    const frame = sampleFlight(s.flight, s.time);
    if (s.view === 'engines') {
      frame.throttle = s.explode > 0.001 ? 0 : 0.65;
      frame.gimbal = s.fin * 0.3;
    }
    return {
      vehicle: s.settings.vehicle,
      view: s.view,
      frame,
      time: s.time,
      explode: s.explode,
      fin: s.view === 'fins' ? s.fin : frame.fin,
      deploy: s.deploy,
      armOpen:
        s.view === 'hardware'
          ? s.armOpen
          : 1 - smooth(1 - frame.altitude / 110),
      labels: s.labels,
      guided: false,
    };
  }
  function syncVisual() {
    api.current?.update(display(), 0);
  }
  function exitTour() {
    if (playback.current.guided) {
      playback.current.guided = false;
      setGuided(false);
      api.current?.endCapture();
      audio.current?.pause();
    }
  }
  function chooseView(next: View) {
    if (recorder.current) return;
    exitTour();
    playback.current.view = next;
    playback.current.playing = false;
    setPlaying(false);
    setView(next);
    setSelected('');
    syncVisual();
  }
  function configure(next: Partial<Settings>) {
    if (recorder.current) return;
    exitTour();
    const s = { ...playback.current.settings, ...next },
      flight = simulate(s);
    Object.assign(playback.current, {
      settings: s,
      flight,
      time: Math.max(0, flight.contactTime - 2.8),
      playing: false,
    });
    setSettings(s);
    setTime(playback.current.time);
    setPlaying(false);
    setSelected('');
    syncVisual();
  }
  function setControl(
    key: 'explode' | 'fin' | 'deploy' | 'armOpen',
    value: number,
  ) {
    playback.current[key] = value;
    ({
      explode: setExplode,
      fin: setFin,
      deploy: setDeploy,
      armOpen: setArmOpen,
    })[key](value);
    syncVisual();
  }
  function transport(value: boolean) {
    playback.current.playing = value;
    setPlaying(value);
    if (value && audioEnabled.current) void audio.current?.resume();
    if (!value) audio.current?.pause();
    if (recorder.current?.state === 'recording' && !value)
      recorder.current.pause();
    else if (recorder.current?.state === 'paused' && value)
      recorder.current.resume();
  }
  function run() {
    if (playback.current.guided) {
      if (playback.current.time >= SHORT_DURATION) playback.current.time = 0;
      transport(!playback.current.playing);
      return;
    }
    if (playback.current.time >= playback.current.flight.contactTime) {
      playback.current.time = 0;
      setTime(0);
    }
    chooseView('recovery');
    transport(true);
  }
  function runRecovery() {
    if (recorder.current) return;
    exitTour();
    playback.current.time = 0;
    setTime(0);
    chooseView('recovery');
    transport(true);
  }
  function seek(value: number) {
    playback.current.time = value;
    setTime(value);
    syncVisual();
    audio.current?.sync(
      value,
      playback.current.guided &&
        playback.current.playing &&
        audioEnabled.current,
    );
  }
  function reset() {
    if (recorder.current) return;
    exitTour();
    playback.current.time = 0;
    setTime(0);
    transport(false);
    api.current?.resetCamera();
    syncVisual();
  }
  function beginShort() {
    if (!api.current || !tourSample.current || recorder.current) return;
    playback.current.guided = true;
    playback.current.time = 0;
    setGuided(true);
    setTime(0);
    setSelected('');
    stage.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    api.current.startPreview(tourSample.current(0));
    transport(true);
  }
  async function recordShort() {
    if (!api.current || !tourSample.current || recorder.current) return;
    if (typeof MediaRecorder === 'undefined') {
      setNotice(
        'Recording is unavailable in this browser. Try Chrome or Edge.',
      );
      return;
    }
    let stream: MediaStream | undefined;
    try {
      if (audioEnabled.current) await audio.current?.resume();
      Object.assign(playback.current, {
        guided: true,
        time: 0,
        playing: false,
      });
      setTime(0);
      setGuided(true);
      setSelected('');
      stage.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
      stream = api.current.startCapture(tourSample.current(0));
      streamRef.current = stream;
      if (audioEnabled.current && audio.current)
        stream.addTrack(audio.current.recordingTrack());
      const mime = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/mp4;codecs=avc1.420029,mp4a.40.2',
        'video/webm',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mime) throw Error('No supported video encoder was found.');
      const media = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: 18000000,
          audioBitsPerSecond: 256000,
        }),
        chunks: BlobPart[] = [];
      recorder.current = media;
      media.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      media.onerror = () => {
        if (mounted.current)
          setNotice(
            'The browser encoder was interrupted. Retry recording in Chrome with this tab visible.',
          );
        if (media.state !== 'inactive') media.stop();
      };
      media.onstop = () => {
        stream?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorder.current = null;
        audio.current?.pause();
        api.current?.endCapture();
        playback.current.playing = false;
        if (!mounted.current) return;
        api.current?.startPreview(display());
        setRecording(false);
        setPlaying(false);
        if (chunks.length) {
          if (objectURL.current) URL.revokeObjectURL(objectURL.current);
          const blob = new Blob(chunks, { type: media.mimeType }),
            url = URL.createObjectURL(blob);
          objectURL.current = url;
          setDownload({
            url,
            name:
              'HowThingsClick-Rocket-Recovery-Short.' +
              (media.mimeType.includes('mp4') ? 'mp4' : 'webm'),
          });
          setNotice('Your vertical recording is ready to download.');
        } else
          setNotice(
            'The browser returned no video frames. Retry with the lab visible.',
          );
      };
      media.start(1000);
      setRecording(true);
      setNotice('Recording 1080 × 1920. Keep this tab visible.');
      transport(true);
    } catch (e) {
      stream?.getTracks().forEach((t) => t.stop());
      recorder.current = null;
      streamRef.current = null;
      api.current?.endCapture();
      playback.current.playing = false;
      setPlaying(false);
      setRecording(false);
      setNotice(e instanceof Error ? e.message : 'Recording could not start.');
    }
  }
  function stopRecording() {
    playback.current.playing = false;
    setPlaying(false);
    audio.current?.pause();
    if (recorder.current && recorder.current.state !== 'inactive')
      recorder.current.stop();
  }
  async function loadAudio(file: File | undefined) {
    if (!file || recording) return;
    try {
      audio.current ??= new TourAudio();
      const duration = await audio.current.load(file);
      if (duration === null) return;
      setFileName(file.name);
      setVoiceEnabled(true);
      audioEnabled.current = true;
      setNotice(
        Math.abs(duration - 60) > 1
          ? 'Audio is ' +
              duration.toFixed(1) +
              ' seconds; the Short is 60 seconds. Use the timed script for an aligned mix.'
          : '60-second audio loaded. It will play with the Short.',
      );
    } catch {
      setNotice('This audio file could not be decoded. Try MP3 or WAV.');
    }
  }
  function screenshot() {
    if (!api.current) return;
    const a = document.createElement('a');
    a.href = api.current.snapshot();
    a.download = 'rocket-recovery.png';
    a.click();
  }
  useEffect(() => {
    mounted.current = true;
    let dead = false,
      raf = 0,
      last = 0,
      lastUI = 0;
    import('./scene')
      .then(({ createRecoveryScene, tourDisplay }) => {
        if (dead || !host.current) return;
        tourSample.current = tourDisplay;
        api.current = createRecoveryScene(host.current, setSelected);
        syncVisual();
        void api.current.ready.then(() => {
          if (!dead) {
            setReady(true);
            if (api.current?.assetErrors.length)
              setNotice(
                'Some imagery could not load. Reload to restore the full environment.',
              );
          }
        });
        const tick = (now: number) => {
          if (dead) return;
          const dt = Math.min((now - last) / 1000, 0.075);
          last = now;
          const s = playback.current;
          if (s.playing) {
            s.time = Math.min(s.guided ? 60 : s.flight.duration, s.time + dt);
            if (s.time >= (s.guided ? 60 : s.flight.duration)) {
              s.playing = false;
              setPlaying(false);
              if (recorder.current && recorder.current.state !== 'inactive')
                recorder.current.stop();
            }
          }
          api.current?.update(display(), dt);
          audio.current?.sync(
            s.time,
            s.guided && s.playing && audioEnabled.current,
          );
          if (now - lastUI > 90) {
            setTime(s.time);
            lastUI = now;
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : 'The 3D scene could not load.',
        ),
      );
    const visibility = () => {
      if (document.hidden && playback.current.playing) {
        transport(false);
        if (recorder.current)
          setNotice(
            'Recording paused because the tab became hidden. Press Play to resume.',
          );
      }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      dead = true;
      mounted.current = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibility);
      if (recorder.current && recorder.current.state !== 'inactive')
        recorder.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audio.current?.dispose();
      api.current?.dispose();
      api.current = null;
      if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    };
  }, []);
  const flight = useMemo(() => simulate(settings), [settings]),
    frame = sampleFlight(flight, time),
    shot = guided ? sampleShort(time).shot : null,
    shownVehicle = shot?.vehicle ?? settings.vehicle,
    shownFrame = frame,
    result = frame.outcome !== 'descending',
    success = frame.outcome === 'landed' || frame.outcome === 'caught';
  return (
    <div className="rr-page">
      <header className="rr-header">
        <PageLink href="/" aria-label="How Things Click home">
          <Brand inverse />
        </PageLink>
        <PageLink href="/#explore" className="rr-back">
          <ArrowLeft size={15} /> All labs
        </PageLink>
        <span className="rr-edition">
          LAB 05 <span>/</span> SPACE & FLIGHT
        </span>
      </header>
      <main className="rr-main">
        <div className="rr-heading">
          <div>
            <p className="rr-eyebrow">
              <span /> ROCKET RECOVERY
            </p>
            <h1>
              Built to fly. <em>Engineered to return.</em>
            </h1>
            <p>Explore the precision behind a landing—and a catch.</p>
          </div>
          <button
            className="rr-short-btn"
            onClick={beginShort}
            disabled={!ready || recording}
          >
            <Play size={17} fill="currentColor" /> Watch the 60s Short{' '}
            <span>9:16</span>
          </button>
        </div>
        <section
          className="rr-workspace"
          aria-label="Rocket recovery interactive lab"
        >
          <div className="rr-stage-wrap">
            <div
              className={'rr-stage ' + (guided ? 'rr-portrait' : '')}
              ref={stage}
            >
              <div ref={host} className="rr-canvas" />
              {!ready && (
                <div className="rr-loading" aria-live="polite">
                  {error ? (
                    <>
                      <strong>Unable to start 3D</strong>
                      <p>{error}</p>
                      <button onClick={() => location.reload()}>Reload</button>
                    </>
                  ) : (
                    <>
                      <span className="rr-spinner" />
                      <strong>Preparing the recovery zone</strong>
                      <p>Assembling boosters, engines and tower.</p>
                    </>
                  )}
                </div>
              )}
              {ready && !guided && (
                <div className="rr-scene-title">
                  <span>ORIGINAL 3D RECONSTRUCTION</span>
                  <h2>
                    {view === 'earth'
                      ? 'Earth & recovery sites'
                      : specs[shownVehicle].name}
                  </h2>
                  <p>
                    {view === 'earth'
                      ? 'Boca Chica, Texas · Atlantic Ocean'
                      : specs[shownVehicle].subtitle}
                  </p>
                </div>
              )}
              {ready && guided && (
                <div className="rr-tour-tag">
                  <span className={recording ? 'rr-red-dot' : 'rr-dot'} />
                  {recording ? 'RECORDING' : 'SHORT PREVIEW'}{' '}
                  <b>{stamp(time)} / 1:00</b>
                </div>
              )}
              <div className="rr-camera-actions">
                <button
                  aria-label="Reset camera"
                  title="Reset camera"
                  onClick={() => api.current?.resetCamera()}
                  disabled={!ready || guided}
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  aria-label="Save scene image"
                  title="Save scene image"
                  onClick={screenshot}
                  disabled={!ready || recording}
                >
                  <Camera size={17} />
                </button>
                <button
                  aria-label="Fullscreen"
                  title="Fullscreen"
                  onClick={() => {
                    if (document.fullscreenElement)
                      void document.exitFullscreen();
                    else
                      void stage.current
                        ?.requestFullscreen()
                        .catch(() => setNotice('Fullscreen is unavailable.'));
                  }}
                >
                  <Expand size={17} />
                </button>
              </div>
              {ready && !guided && (
                <div className="rr-hint">
                  <MousePointer2 size={13} /> Drag to orbit · Scroll to zoom ·
                  Click a part
                </div>
              )}
              {ready && !guided && view === 'recovery' && (
                <div className="rr-telemetry">
                  <div>
                    <span>TO CONTACT</span>
                    <strong>
                      {shownFrame.altitude.toFixed(0)}
                      <small> m</small>
                    </strong>
                  </div>
                  <div>
                    <span>VERTICAL SPEED</span>
                    <strong>
                      {Math.abs(shownFrame.velocity).toFixed(1)}
                      <small> m/s</small>
                    </strong>
                  </div>
                  <div>
                    <span>THRUST</span>
                    <strong>
                      {Math.round(shownFrame.throttle * 100)}
                      <small> %</small>
                    </strong>
                  </div>
                </div>
              )}
              {selected && (
                <div className="rr-picked" aria-live="polite">
                  <button
                    aria-label="Close part information"
                    onClick={() => setSelected('')}
                  >
                    ×
                  </button>
                  <strong>{selected}</strong>
                  <p>
                    {partInfo[selected] ??
                      'Select a system view to examine this part.'}
                  </p>
                </div>
              )}
            </div>
            <div className="rr-transport">
              <button
                className="rr-play"
                aria-label={playing ? 'Pause simulation' : 'Play simulation'}
                onClick={() => (playing ? transport(false) : run())}
                disabled={!ready}
              >
                {playing ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
              </button>
              <button
                aria-label="Restart simulation"
                onClick={reset}
                disabled={!ready || recording}
              >
                <RotateCcw size={17} />
              </button>
              <input
                aria-label={guided ? 'Short timeline' : 'Recovery timeline'}
                type="range"
                min={0}
                max={guided ? 60 : flight.duration}
                step={0.01}
                value={time}
                disabled={!ready || recording}
                onChange={(e) => seek(Number(e.target.value))}
              />
              <span>
                {stamp(time)} <i>/</i>{' '}
                {guided ? '1:00' : stamp(flight.duration)}
              </span>
              {guided && (
                <button
                  className="rr-text-button"
                  onClick={() => (recording ? stopRecording() : reset())}
                >
                  {recording ? 'Stop' : 'Exit Short'}
                </button>
              )}
            </div>
            <div
              className="rr-view-tabs"
              role="tablist"
              aria-label="Engineering views"
            >
              {views.map((v, i) => (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={(shot?.view ?? view) === v.id}
                  onClick={() => chooseView(v.id)}
                  disabled={recording}
                >
                  <span>0{i + 1}</span>
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <aside className="rr-panel">
            <div className="rr-panel-heading">
              <span className="rr-eyebrow">MISSION CONTROL</span>
              <SlidersHorizontal size={18} />
            </div>
            <div className="rr-vehicle-switch" aria-label="Select rocket">
              {(['superheavy', 'falcon9'] as Vehicle[]).map((v) => (
                <button
                  key={v}
                  className={shownVehicle === v ? 'active' : ''}
                  aria-pressed={shownVehicle === v}
                  disabled={recording}
                  onClick={() => configure({ vehicle: v })}
                >
                  {specs[v].name}
                  <small>
                    {v === 'superheavy' ? 'Tower catch' : 'Leg landing'}
                  </small>
                </button>
              ))}
            </div>
            {guided ? (
              <div className="rr-guided-info">
                <span className="rr-eyebrow">60 SECONDS / 8 SHOTS</span>
                <h2>{shot?.label}</h2>
                <p>
                  A vertical tour from falling flight to a supported booster.
                  The recording includes the logo and final website link, with
                  no narration captions.
                </p>
                <button onClick={() => transport(!playing)} disabled={!ready}>
                  {playing ? <Pause size={15} /> : <Play size={15} />}{' '}
                  {playing ? 'Pause Short' : 'Play Short'}
                </button>
              </div>
            ) : (
              <>
                <div className="rr-view-info">
                  <h2>{views.find((v) => v.id === view)?.name}</h2>
                  <p>{views.find((v) => v.id === view)?.description}</p>
                </div>
                {view === 'recovery' ? (
                  <>
                    <label className="rr-check" aria-label="Automatic ignition">
                      <span>
                        <strong>Automatic ignition</strong>
                        <small>Let the controller time the burn.</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.automatic}
                        onChange={(e) =>
                          configure({ automatic: e.target.checked })
                        }
                      />
                    </label>
                    {!settings.automatic && (
                      <Range
                        label="Ignition altitude"
                        value={settings.ignitionHeight}
                        min={20}
                        max={250}
                        step={5}
                        unit=" m"
                        onChange={(ignitionHeight) =>
                          configure({ ignitionHeight })
                        }
                      />
                    )}
                    <Range
                      label="Crosswind"
                      value={settings.wind}
                      min={-20}
                      max={20}
                      unit=" m/s"
                      onChange={(wind) => configure({ wind })}
                    />
                    <label className="rr-check" aria-label="Steering guidance">
                      <span>
                        <strong>Steering guidance</strong>
                        <small>Correct sideways drift.</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.guidance}
                        onChange={(e) =>
                          configure({ guidance: e.target.checked })
                        }
                      />
                    </label>
                    <button
                      className="rr-run"
                      onClick={runRecovery}
                      disabled={!ready}
                    >
                      <Play size={16} fill="currentColor" /> Run recovery{' '}
                      <ChevronRight size={17} />
                    </button>
                    <div
                      className={
                        'rr-result ' +
                        (result ? (success ? 'success' : 'failure') : '')
                      }
                      aria-live="polite"
                    >
                      {result ? (
                        <>
                          <strong>
                            {success ? <Check size={16} /> : <Wind size={16} />}{' '}
                            {success
                              ? settings.vehicle === 'superheavy'
                                ? 'Booster caught'
                                : 'Touchdown confirmed'
                              : frame.outcome === 'missed'
                                ? 'Target missed'
                                : 'Too fast at contact'}
                          </strong>
                          <p>
                            {flight.impactSpeed.toFixed(1)} m/s at contact ·{' '}
                            {flight.missDistance.toFixed(1)} m off centre
                          </p>
                          <small>
                            {success
                              ? 'Now change the wind or try a later ignition.'
                              : 'Restore guidance or start the landing burn higher.'}
                          </small>
                        </>
                      ) : (
                        <>
                          <strong>
                            {frame.throttle > 0
                              ? 'Landing burn in progress'
                              : 'Coasting toward the recovery zone'}
                          </strong>
                          <p>
                            Watch speed fall as the engines remove momentum.
                          </p>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {view === 'earth' && (
                      <button
                        className="rr-run"
                        onClick={() => chooseView('recovery')}
                      >
                        Return to the recovery zone <ChevronRight size={17} />
                      </button>
                    )}
                    {view === 'fins' && (
                      <Range
                        label="Fin angle"
                        value={(fin * 180) / Math.PI}
                        min={-26}
                        max={26}
                        unit="°"
                        onChange={(v) => setControl('fin', (v * Math.PI) / 180)}
                      />
                    )}
                    {view === 'engines' && (
                      <>
                        <Range
                          label="Engine steering"
                          value={(fin * 180) / Math.PI}
                          min={-26}
                          max={26}
                          unit="° control"
                          onChange={(v) =>
                            setControl('fin', (v * Math.PI) / 180)
                          }
                        />
                        <Range
                          label="Separate engine assembly"
                          value={explode * 100}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={(v) => setControl('explode', v / 100)}
                        />
                      </>
                    )}
                    {view === 'hardware' &&
                      (settings.vehicle === 'falcon9' ? (
                        <Range
                          label="Landing leg deployment"
                          value={deploy * 100}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={(v) => setControl('deploy', v / 100)}
                        />
                      ) : (
                        <Range
                          label="Catch arm opening"
                          value={armOpen * 100}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={(v) => setControl('armOpen', v / 100)}
                        />
                      ))}
                    <div className="rr-lesson">
                      <span>THE ENGINEERING</span>
                      <p>
                        {view === 'earth'
                          ? 'The coastline uses USGS aerial imagery; Earth uses NASA Blue Marble imagery. The foreground Starbase structures are reconstructed, not a survey of the current site.'
                          : view === 'fins'
                            ? 'Airflow creates the force. A fin cannot steer a rocket through a vacuum.'
                            : view === 'engines'
                              ? 'The thrust vector changes when the engine pivots. Throttle changes the magnitude of that force.'
                              : settings.vehicle === 'superheavy'
                                ? 'Catch points transfer weight to the arms, carriage and tower. The grid fins are not the lifting points.'
                                : 'Leg deployment does not slow the booster. The landing burn removes velocity before the feet contact the deck.'}
                      </p>
                    </div>
                  </>
                )}
                <label className="rr-check rr-label-check">
                  <span>
                    {view === 'earth'
                      ? 'Show recovery sites'
                      : 'Show part labels'}
                  </span>
                  <input
                    type="checkbox"
                    checked={labels}
                    onChange={(e) => {
                      setLabels(e.target.checked);
                      playback.current.labels = e.target.checked;
                      syncVisual();
                    }}
                  />
                </label>
              </>
            )}
            <p className="rr-model-note">
              <Info size={13} /> Educational final-approach model. Readouts are
              simulated, not flight telemetry.
            </p>
          </aside>
        </section>
        <section className="rr-studio" aria-label="Short video studio">
          <div>
            <span className="rr-eyebrow">MADE TO SHARE</span>
            <h2>One small film. A big engineering story.</h2>
            <p>60 seconds · Vertical 1080 × 1920 · No captions burned in</p>
          </div>
          <div className="rr-studio-actions">
            <label
              className={'rr-audio-upload ' + (recording ? 'disabled' : '')}
            >
              <Volume2 size={16} />
              {fileName ? 'Replace audio' : 'Add narration / mix'}
              <input
                aria-label="Upload Short audio"
                type="file"
                accept="audio/*"
                disabled={recording}
                onChange={(e) => void loadAudio(e.target.files?.[0])}
              />
            </label>
            <button
              className="rr-record"
              onClick={() => (recording ? stopRecording() : void recordShort())}
              disabled={!ready}
            >
              {recording ? (
                <Square size={16} fill="currentColor" />
              ) : (
                <Video size={17} />
              )}{' '}
              {recording ? 'Stop recording' : 'Record Short'}
            </button>
            <a href="/tours/rocket-recovery-short-narration.txt" download>
              <Download size={16} /> Timed script
            </a>
            <a href="/tours/rocket-recovery-short-helio-prompt.txt" download>
              <Download size={16} /> Helio audio prompt
            </a>
          </div>
          {fileName && (
            <label className="rr-audio-state">
              <input
                type="checkbox"
                checked={voiceEnabled}
                disabled={recording}
                onChange={(e) => {
                  setVoiceEnabled(e.target.checked);
                  audioEnabled.current = e.target.checked;
                  if (!e.target.checked) audio.current?.pause();
                }}
              />
              Use audio: {fileName}
              <small>Stays on your device.</small>
            </label>
          )}
          {notice && (
            <p className="rr-notice" aria-live="polite">
              {notice}
            </p>
          )}
          {download && (
            <a
              className="rr-download"
              href={download.url}
              download={download.name}
            >
              <Download size={17} /> Download your recording
            </a>
          )}
        </section>
        <section className="rr-sources">
          <button onClick={() => setDetails(!details)} aria-expanded={details}>
            <Info size={16} /> What is real, and what is simplified?{' '}
            <ChevronRight size={16} />
          </button>
          {details && (
            <div>
              <p>
                The original models illustrate Falcon 9 and the Flight 5-era
                Super Heavy configuration. This is the booster catch—not a
                Starship upper-stage catch. Exhaust is enhanced for visibility,
                and the Short compresses the sequence. The challenge starts
                during final approach and uses a reduced-order gravity, thrust,
                fuel and crosswind model, not proprietary flight-control
                software.
              </p>
              <p>
                Recovery trajectories vary. Not every Falcon 9 drone-ship
                mission performs a boostback burn. Tower readiness can cause a
                planned catch to be diverted.
              </p>
              <nav>
                <a
                  href="/licenses/rocket-recovery-assets.md"
                  target="_blank"
                  rel="noreferrer"
                >
                  Imagery credits & sources <ArrowUpRight size={13} />
                </a>
                <a
                  href="https://www.spacex.com/assets/media/falcon-users-guide-2025-05-09.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  SpaceX Falcon user guide <ArrowUpRight size={13} />
                </a>
                <a
                  href="https://www.spacex.com/vehicles/starship/assets/media/Starbase%20Overview.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  SpaceX Starbase overview <ArrowUpRight size={13} />
                </a>
                <a
                  href="https://www.youtube.com/watch?v=CMGiNKcVSek"
                  target="_blank"
                  rel="noreferrer"
                >
                  Official Flight 6 account <ArrowUpRight size={13} />
                </a>
              </nav>
            </div>
          )}
        </section>
      </main>
      <footer className="rr-footer">
        <PageLink href="/starlink">
          Continue exploring: How Starlink works <ArrowUpRight size={15} />
        </PageLink>
        <span>Independent educational reconstruction · How Things Click</span>
      </footer>
    </div>
  );
}
