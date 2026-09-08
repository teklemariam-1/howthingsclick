'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Video,
  Download,
  Camera,
  Route,
  Eye,
  ScanLine,
  Sun,
  Moon,
  Square,
  Upload,
  X,
} from 'lucide-react';
import Brand from '@/components/brand';
import PageLink from '@/components/page-link';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TourAudio } from '@/components/engine/tour-audio';
import {
  DEFAULT_SETTINGS,
  DURATION,
  SCENARIOS,
  VIEW_INFO,
  frameAt,
  simulate,
  type View,
  type CameraView,
  type Settings,
} from '@/lib/self-driving/simulation';
import { TOUR_DURATION, TOUR, tourAt } from '@/lib/self-driving/tour';
import type { DrivingScene } from './scene';
import { PlaybackClock } from '@/lib/self-driving/playback';
import { steeringExperimentAt } from '@/lib/self-driving/steering';
import type { ControlDetail } from '@/lib/self-driving/motor-driver';
import EngineeringPanel, { EngineeringSteps } from './engineering-panel';
import DecisionPanel from './decision-panel';
import {
  systemInfo,
  type SystemId,
  type Assembly,
} from '@/lib/self-driving/engineering';
import './lab.css';
import './engineering.css';
const timeText = (n: number) =>
  Math.floor(n / 60) +
  ':' +
  Math.floor(n % 60)
    .toString()
    .padStart(2, '0');
function Range({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="sd-range">
      <span>
        {label}
        <strong>
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </strong>
      </span>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))}
      />
    </label>
  );
}
export default function SelfDrivingLab() {
  const host = useRef<HTMLDivElement>(null),
    shell = useRef<HTMLDivElement>(null),
    api = useRef<DrivingScene | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS),
    [view, setView] = useState<View>('linked'),
    [camera, setCamera] = useState<CameraView>('follow');
  const [engineering, setEngineering] = useState(true),
    [system, setSystem] = useState<SystemId>('overview'),
    [assembly, setAssembly] = useState<Assembly>('cutaway');
  const [playing, setPlaying] = useState(false),
    [tour, setTour] = useState(false),
    [time, setTime] = useState(0),
    [rate, setRate] = useState(1),
    [doors, setDoors] = useState(false),
    [night, setNight] = useState(false),
    [steeringAmplitude, setSteeringAmplitude] = useState(18),
    [controlDetail, setControlDetail] = useState<ControlDetail>('mechanism');
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [recording, setRecording] = useState(false);
  const [download, setDownload] = useState<{
      url: string;
      name: string;
    } | null>(null),
    [voiceName, setVoiceName] = useState(''),
    [voiceLoading, setVoiceLoading] = useState(false);
  const voice = useRef<TourAudio | null>(null),
    media = useRef<MediaRecorder | null>(null),
    downloadUrl = useRef(''),
    mounted = useRef(false);
  const frames = useMemo(() => simulate(settings), [settings]);
  const tours = useMemo(
    () =>
      Object.fromEntries(
        SCENARIOS.map((s) => [
          s.id,
          simulate({ ...DEFAULT_SETTINGS, scenario: s.id }),
        ]),
      ),
    [],
  );
  const [frame, setFrame] = useState(() => frames[0]);
  const clock = useRef(new PlaybackClock());
  const state = useRef({
    settings,
    view,
    camera,
    doors,
    night,
    frames,
    engineering,
    system,
    assembly,
    steeringAmplitude,
    controlDetail,
  });
  const setPlayback = useCallback((active: boolean) => {
    clock.current.setPlaying(active, performance.now());
    setPlaying(active);
    if (media.current?.state === 'recording' && !active) media.current.pause();
    else if (media.current?.state === 'paused' && active)
      media.current.resume();
    if (clock.current.tour) voice.current?.sync(clock.current.time, active);
    else voice.current?.pause();
  }, []);
  const seek = useCallback((t: number) => {
    clock.current.seek(
      t,
      performance.now(),
      clock.current.tour ? TOUR_DURATION : DURATION,
    );
    setTime(clock.current.time);
    if (clock.current.tour)
      voice.current?.sync(clock.current.time, clock.current.playing);
  }, []);
  useEffect(() => {
    state.current = {
      settings,
      view,
      camera,
      doors,
      night,
      frames,
      engineering,
      system,
      assembly,
      steeringAmplitude,
      controlDetail,
    };
  }, [
    settings,
    view,
    camera,
    doors,
    night,
    frames,
    engineering,
    system,
    assembly,
    steeringAmplitude,
    controlDetail,
  ]);
  useEffect(() => {
    clock.current.rate = rate;
  }, [rate]);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false,
      raf = 0,
      lastUi = 0;
    import('./scene')
      .then(({ createDrivingScene }) => {
        if (cancelled || !host.current) return;
        try {
          api.current = createDrivingScene(host.current, (id) => {
            if (!clock.current.tour) {
              setSystem(id);
              if (id === 'control') {
                setAssembly('cutaway');
                seek(0);
                setPlayback(true);
              }
            }
          });
          void api.current.ready
            .then(() => {
              if (!cancelled) setReady(true);
            })
            .catch(() => {
              if (!cancelled)
                setError(
                  'A detailed 3D asset could not load. Reload the page before recording.',
                );
            });
        } catch (e) {
          setError(
            'The 3D scene could not start. Try a browser with WebGL enabled.',
          );
          console.error(e);
          return;
        }
        function animate(now: number) {
          if (cancelled) return;
          const c = clock.current,
            s = state.current,
            max = c.tour ? TOUR_DURATION : DURATION;
          const dt = c.advance(now, max, !document.hidden);
          const ts = c.tour ? tourAt(c.time) : null,
            shown = ts
              ? frameAt(tours[ts.settings.scenario], ts.time)
              : frameAt(s.frames, c.time);
          api.current?.update(
            {
              frame: shown,
              settings: ts?.settings ?? s.settings,
              view: ts?.view ?? s.view,
              camera: ts?.camera ?? s.camera,
              doors: ts?.doors ?? s.doors,
              night: ts ? false : s.night,
              tourPose: ts?.pose,
              controlDetail: ts?.controlDetail ?? s.controlDetail,
              steering: ts
                ? ts.steering
                : s.engineering && s.system === 'control'
                  ? steeringExperimentAt(c.time, s.steeringAmplitude)
                  : undefined,
              engineering: ts?.engineering ?? s.engineering,
              system: ts?.system ?? s.system,
              assembly: ts?.assembly ?? s.assembly,
            },
            dt,
          );
          if (c.tour)
            voice.current?.sync(c.time, c.playing && !document.hidden);
          if (now - lastUi > 100) {
            setTime(c.time);
            setFrame(shown);
            lastUi = now;
          }
          if (c.playing && c.time >= max) {
            c.setPlaying(false, now);
            setPlaying(false);
            voice.current?.pause();
            if (media.current && media.current.state !== 'inactive')
              media.current.stop();
          }
          raf = requestAnimationFrame(animate);
        }
        raf = requestAnimationFrame(animate);
      })
      .catch(() =>
        setError('The lab could not load. Reload the page to try again.'),
      );
    const hide = () => {
      if (document.hidden) {
        clock.current.setPlaying(false, performance.now());
        setPlaying(false);
        voice.current?.pause();
        if (media.current?.state === 'recording') {
          media.current.pause();
          setNotice(
            'Recording paused because the tab was hidden. Press Play to resume the video and narration together.',
          );
        }
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancelled = true;
      mounted.current = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', hide);
      const r = media.current;
      if (r && r.state !== 'inactive') {
        r.onstop = null;
        r.stop();
        r.stream.getTracks().forEach((t) => t.stop());
      }
      voice.current?.dispose();
      voice.current = null;
      api.current?.dispose();
      api.current = null;
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    };
  }, [tours, seek, setPlayback]);
  function changeSettings(patch: Partial<Settings>) {
    if (recording) return;
    setTour(false);
    clock.current.tour = false;
    voice.current?.pause();
    setSettings((s) => ({ ...s, ...patch }));
    seek(0);
    api.current?.resetCamera();
  }
  function leaveTour() {
    if (recording) return;
    setTour(false);
    clock.current.tour = false;
    setPlayback(false);
    seek(0);
    api.current?.resetCamera();
  }
  async function play() {
    if (clock.current.time >= (clock.current.tour ? TOUR_DURATION : DURATION))
      seek(0);
    if (!clock.current.playing) await voice.current?.resume();
    setPlayback(!clock.current.playing);
  }
  function startTour() {
    if (!ready) return;
    clock.current.tour = true;
    seek(0);
    setTour(true);
    clock.current.rate = 1;
    setRate(1);
    setPlayback(true);
    void voice.current?.resume();
    api.current?.resetCamera();
  }
  function stopRecording() {
    const r = media.current;
    if (r && r.state !== 'inactive') r.stop();
    setPlayback(false);
  }
  async function record() {
    if (!api.current || typeof MediaRecorder === 'undefined') {
      setNotice(
        'Recording needs a browser with MediaRecorder support. You can still use the guided tour.',
      );
      return;
    }
    let stream: MediaStream | null = null;
    try {
      await voice.current?.resume();
      setPlayback(false);
      // Stage the opening pose while the encoder starts. The normal RAF must
      // not overwrite the first captured frame with the previous manual view.
      clock.current.tour = true;
      clock.current.rate = 1;
      setTour(true);
      setRate(1);
      seek(0);
      const first = tourAt(0);
      const firstDisplay = {
        frame: frameAt(tours[first.settings.scenario], first.time),
        settings: first.settings,
        view: first.view,
        camera: first.camera,
        doors: first.doors,
        night: false,
        tourPose: first.pose,
        engineering: first.engineering,
        system: first.system,
        assembly: first.assembly,
      };
      stream = api.current.startCapture(firstDisplay);
      if (voice.current && voiceName)
        stream.addTrack(voice.current.recordingTrack());
      const mime = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ].find((m) => MediaRecorder.isTypeSupported(m));
      if (!mime) throw new Error('Unsupported recording format');
      const recorder = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: 8_000_000,
        }),
        chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onerror = () => {
        setNotice('Recording was interrupted. Try recording again.');
        stopRecording();
      };
      recorder.onstop = () => {
        stream?.getTracks().forEach((t) => t.stop());
        api.current?.endCapture();
        media.current = null;
        if (!mounted.current) return;
        setRecording(false);
        setPlayback(false);
        if (!chunks.length) {
          setNotice('No video frames were captured. Please try again.');
          return;
        }
        const blob = new Blob(chunks, { type: mime });
        chunks.length = 0;
        if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
        const url = URL.createObjectURL(blob);
        downloadUrl.current = url;
        setDownload({
          url,
          name:
            'howthingsclick-self-driving-tour.' +
            (mime.startsWith('video/mp4') ? 'mp4' : 'webm'),
        });
        setNotice(
          (clock.current.time >= TOUR_DURATION
            ? 'Full tour ready.'
            : 'Preview clip ready (' + timeText(clock.current.time) + ').') +
            ' Save the video below. The export has branding and no narration captions.',
        );
      };
      media.current = recorder;
      recorder.start(1000);
      // Some encoders emit "start" only after receiving audio samples.
      // Start playback now so narration and encoder cannot wait on each other.
      startTour();
      api.current?.update(firstDisplay, 0);
      setRecording(true);
      setDownload(null);
      setNotice(
        'Recording the 4:30 tour. Keep this tab visible. Pause stops the video and narration together.',
      );
    } catch (e) {
      const failed = media.current;
      if (failed && failed.state !== 'inactive') {
        failed.onstop = null;
        failed.stop();
      }
      media.current = null;
      stream?.getTracks().forEach((t) => t.stop());
      api.current?.endCapture();
      setRecording(false);
      setPlayback(false);
      setNotice(
        'Recording could not start in this browser. Try a desktop Chromium browser.',
      );
      console.error(e);
    }
  }
  async function loadVoice(file?: File) {
    if (!file) return;
    setVoiceLoading(true);
    try {
      voice.current ??= new TourAudio();
      const duration = await voice.current.load(file);
      if (duration === null) return;
      setVoiceName(file.name);
      setNotice(
        'Narration loaded (' +
          timeText(duration) +
          '). It will play only when you start the tour.' +
          (Math.abs(duration - TOUR_DURATION) > 1
            ? ' This tour is ' +
              timeText(TOUR_DURATION) +
              '. Use the timed script to place the chapter readings; the audio will not be stretched automatically.'
            : ''),
      );
    } catch {
      setNotice('This audio file could not be read. Try MP3 or WAV.');
    } finally {
      setVoiceLoading(false);
    }
  }
  const shownTour = tour ? tourAt(time) : null,
    shownView = shownTour?.view ?? view,
    shownCamera = shownTour?.camera ?? camera,
    shownSettings = shownTour?.settings ?? settings;
  const step = shownTour?.step;
  const shownEngineering = shownTour?.engineering ?? engineering,
    shownSystem = shownTour?.system ?? system;
  const activeSystem = systemInfo(shownSystem);
  return (
    <div className="sd-page" ref={shell}>
      <a className="sd-skip" href="#driving-controls">
        Skip to simulation controls
      </a>
      <header className="sd-header">
        <PageLink href="/" aria-label="How Things Click home">
          <Brand inverse />
        </PageLink>
        <PageLink className="sd-back" href="/#explore">
          <ArrowLeft size={16} /> All labs
        </PageLink>
        <span className="sd-lab-no">EXPLORATION 03</span>
      </header>
      <div className="sd-heading">
        <div>
          <p className="sd-eyebrow">
            <span /> VEHICLES · VISION · DECISIONS
          </p>
          <h1>
            Inside a self-driving car<span>.</span>
          </h1>
          <p>
            Open the car. Follow the signal. Discover the engineering behind
            autonomy.
          </p>
        </div>
        <button
          className="sd-primary"
          onClick={tour ? leaveTour : startTour}
          disabled={!ready || recording}
        >
          <Play size={16} />
          {tour ? 'Back to exploring' : 'Take the guided tour'}
          <small>{timeText(TOUR_DURATION)}</small>
        </button>
      </div>
      <main className="sd-layout">
        <section className={'sd-stage' + (recording ? ' sd-capturing' : '')} aria-label="Interactive driving scene">
          <div className="sd-mode-switch" aria-label="Lab workspace">
            <button
              aria-pressed={shownEngineering}
              disabled={recording}
              onClick={() => {
                if (tour) leaveTour();
                setEngineering(true);
              }}
            >
              Inside the engineering
            </button>
            <button
              aria-pressed={!shownEngineering}
              disabled={recording}
              onClick={() => {
                if (tour) leaveTour();
                setEngineering(false);
                setCamera('follow');
              }}
            >
              Road test
            </button>
            <span>01 SENSE → 02 THINK → 03 ACT</span>
          </div>
          {shownEngineering && (
            <EngineeringSteps
              value={shownSystem}
              disabled={recording}
              onChange={(id) => {
                if (tour) leaveTour();
                setSystem(id);
                setAssembly('cutaway');
                if (id === 'control') {
                  seek(0);
                  setPlayback(true);
                }
              }}
            />
          )}
          <Tabs
            value={shownView}
            onValueChange={(v) => {
              if (tour) leaveTour();
              setView(v as View);
            }}
            className="sd-view-tabs"
          >
            <TabsList
              aria-label="Visualization layer"
              style={shownEngineering ? { display: 'none' } : undefined}
            >
              {(
                [
                  ['linked', 'Decision view', ScanLine],
                  ['street', 'Street', Camera],
                  ['vision', 'Vision', ScanLine],
                  ['prediction', 'Prediction', Eye],
                  ['planning', 'Planning', Route],
                ] as const
              ).map(([id, label, Icon]) => (
                <TabsTrigger key={id} value={id} disabled={recording}>
                  <Icon size={16} />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div
              className={
                'sd-canvas-wrap' +
                (!shownEngineering &&
                shownView === 'linked' &&
                shownCamera !== 'vehicle' &&
                shownCamera !== 'cabin'
                  ? ' sd-linked'
                  : '')
              }
            >
              <div className="sd-canvas" ref={host} />
              {!ready && (
                <output className="sd-loading">
                  {error || 'Preparing the engineering lab…'}
                  {error && (
                    <button onClick={() => window.location.reload()}>
                      Reload lab
                    </button>
                  )}
                </output>
              )}
              <div className="sd-scene-tag">
                <i />
                {shownEngineering
                  ? 'CYBERCAB · ' + activeSystem.short.toUpperCase()
                  : shownCamera === 'cabin'
                    ? 'CYBERCAB · INTERIOR'
                    : shownCamera === 'vehicle'
                      ? 'CYBERCAB · VEHICLE STUDY'
                      : SCENARIOS.find((s) => s.id === shownSettings.scenario)
                          ?.tag}
              </div>
              <div className="sd-camera-tools" aria-label="View controls">
                <button
                  title="Inspect cabin"
                  aria-label="Inspect Cybercab interior"
                  disabled={!ready || recording || tour}
                  onClick={() => {
                    setEngineering(false);
                    setCamera('cabin');
                    setPlayback(false);
                    setDoors(true);
                  }}
                >
                  <Eye size={16} />
                </button>
                <button
                  title="Reset camera"
                  aria-label="Reset camera"
                  onClick={() => api.current?.resetCamera()}
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  title="Full screen"
                  aria-label="Full screen"
                  onClick={() => {
                    if (document.fullscreenElement)
                      void document.exitFullscreen();
                    else
                      void shell.current
                        ?.requestFullscreen()
                        .catch(() =>
                          setNotice('Full screen is not available here.'),
                        );
                  }}
                >
                  <Maximize2 size={16} />
                </button>
              </div>
              <div
                className="sd-telemetry"
                style={
                  (shownEngineering && shownSystem === 'control') ||
                  (!shownEngineering && shownView === 'linked')
                    ? { display: 'none' }
                    : undefined
                }
              >
                <strong>
                  {Math.round(frame.speed * 3.6)}
                  <small>km/h</small>
                </strong>
                <span>
                  <i className={frame.yielding ? 'waiting' : ''} />
                  {frame.phase}
                </span>
              </div>
              <div className="sd-orbit-hint">
                {tour ? (
                  'Guided camera · Pause or select a chapter to inspect'
                ) : (
                  <>
                    {shownEngineering ? 'Click hardware to inspect · ' : ''}Drag
                    to orbit · Scroll to zoom
                  </>
                )}
              </div>
            </div>
            {shownEngineering ? (
              <div className="sd-view-description">
                <span style={{ background: activeSystem.color }} />
                <p>
                  <strong>{activeSystem.title}</strong>
                  {activeSystem.input} → {activeSystem.output}.{' '}
                  {shownSystem === 'control'
                    ? 'Watch the stationary steering bench correct an angle error.'
                    : 'Press play to follow the live scenario through the hardware.'}
                </p>
              </div>
            ) : (
              Object.entries(VIEW_INFO).map(([id, info]) => (
                <TabsContent
                  key={id}
                  value={id}
                  className="sd-view-description"
                >
                  <span style={{ background: info.color }} />
                  <p>
                    <strong>{info.title}</strong>
                    {info.description}
                  </p>
                </TabsContent>
              ))
            )}
          </Tabs>
          <div className="sd-transport" id="driving-controls">
            <button
              className="sd-play"
              onClick={play}
              disabled={!ready}
              aria-label={playing ? 'Pause simulation' : 'Play simulation'}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="sd-reset"
              title="Restart"
              aria-label="Restart simulation"
              onClick={() => seek(0)}
              disabled={recording}
            >
              <RotateCcw size={17} />
            </button>
            <span className="sd-time">{timeText(time)}</span>
            <Slider
              className="sd-timeline"
              value={[time]}
              min={0}
              max={tour ? TOUR_DURATION : DURATION}
              step={0.05}
              disabled={!ready || recording}
              aria-label={tour ? 'Tour timeline' : 'Simulation timeline'}
              onValueChange={(v) =>
                seek(Array.isArray(v) ? v[0] : (v as number))
              }
            />
            <span className="sd-time sd-duration">
              {timeText(tour ? TOUR_DURATION : DURATION)}
            </span>
            <button
              className="sd-rate"
              onClick={() =>
                setRate((r) => (r === 1 ? 0.5 : r === 0.5 ? 2 : 1))
              }
              disabled={tour || recording}
              aria-label={'Playback speed ' + rate + ' times'}
            >
              {tour ? '1' : rate}×
            </button>
          </div>
          {!shownEngineering &&
            !tour &&
            shownView === 'linked' &&
            shownCamera !== 'vehicle' &&
            shownCamera !== 'cabin' && (
              <DecisionPanel
                frame={frame}
                frames={frames}
                settings={settings}
                disabled={!ready || recording}
                onSeek={(moment) => {
                  setPlayback(false);
                  seek(moment);
                  api.current?.resetCamera();
                }}
              />
            )}
        </section>
        <aside className="sd-sidebar">
          {tour ? (
            <div className="sd-tour-panel">
              <p className="sd-eyebrow">
                GUIDED TOUR ·{' '}
                {String((shownTour?.index ?? 0) + 1).padStart(2, '0')} /{' '}
                {TOUR.length}
              </p>
              <h2>{step?.title}</h2>
              <p>{step?.body}</p>
              <div className="sd-tour-chapters">
                {TOUR.map((s, i) => (
                  <button
                    key={s.at}
                    className={shownTour?.index === i ? 'active' : ''}
                    disabled={recording}
                    onClick={() => seek(s.at)}
                  >
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          ) : shownEngineering ? (
            <EngineeringPanel
              system={system}
              frame={frame}
              settings={settings}
              assembly={assembly}
              onAssembly={setAssembly}
              steering={
                system === 'control'
                  ? steeringExperimentAt(time, steeringAmplitude)
                  : undefined
              }
              steeringAmplitude={steeringAmplitude}
              controlDetail={controlDetail}
              onControlDetail={(detail) => {
                setControlDetail(detail);
                seek(0);
                setPlayback(true);
              }}
              onSteeringChange={(amplitude) => {
                setSteeringAmplitude(amplitude);
                seek(0);
                setPlayback(true);
              }}
              onReplaySteering={() => {
                seek(0);
                setPlayback(true);
              }}
              onSettings={changeSettings}
              onRoad={() => {
                setEngineering(false);
                setView('linked');
                setCamera('follow');
              }}
            />
          ) : (
            <>
              <div className="sd-panel-label">
                01 <span>CHOOSE A SCENARIO</span>
              </div>
              <Tabs
                value={settings.scenario}
                onValueChange={(s) =>
                  changeSettings({ scenario: s as Settings['scenario'] })
                }
                className="sd-scenarios"
              >
                <TabsList aria-label="Driving scenario">
                  {SCENARIOS.map((s, i) => (
                    <TabsTrigger value={s.id} key={s.id}>
                      <span className="sd-scenario-number">0{i + 1}</span>
                      <span>
                        <strong>{s.title}</strong>
                        <small>{s.tag}</small>
                      </span>
                      <ArrowUpRight size={15} />
                    </TabsTrigger>
                  ))}
                </TabsList>
                {SCENARIOS.map((s) => (
                  <TabsContent key={s.id} value={s.id}>
                    <p>{s.description}</p>
                  </TabsContent>
                ))}
              </Tabs>
              <div className="sd-panel-label">
                02 <span>CHANGE THE SITUATION</span>
              </div>
              <Range
                label="Target speed"
                value={settings.speedKph}
                min={10}
                max={35}
                unit=" km/h"
                onChange={(v) => changeSettings({ speedKph: v })}
              />
              {settings.scenario === 'crossing' && (
                <Range
                  label="Pedestrian starts after"
                  value={settings.pedestrianDelay}
                  min={1}
                  max={8}
                  unit=" s"
                  step={0.5}
                  onChange={(v) => changeSettings({ pedestrianDelay: v })}
                />
              )}
              {settings.scenario === 'signal' && (
                <Range
                  label="Light turns green at"
                  value={settings.greenAt}
                  min={6}
                  max={18}
                  unit=" s"
                  onChange={(v) => changeSettings({ greenAt: v })}
                />
              )}
              {settings.scenario === 'roadworks' && (
                <p className="sd-small-note">
                  The adjacent lane is clear in this scenario. The route changes
                  before the cones.
                </p>
              )}
              <div className="sd-panel-label">
                03 <span>TAKE A CLOSER LOOK</span>
              </div>
              <div className="sd-camera-options">
                {(
                  [
                    ['follow', 'Orbit'],
                    ['overhead', 'Top view'],
                    ['bumper', 'On board'],
                    ['vehicle', 'Cybercab'],
                    ['cabin', 'Interior'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    aria-pressed={camera === id}
                    onClick={() => {
                      setCamera(id);
                      if (id === 'vehicle' || id === 'cabin')
                        setPlayback(false);
                      if (id === 'cabin') setDoors(true);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="sd-extra-controls">
                <button
                  aria-pressed={night}
                  onClick={() => setNight((n) => !n)}
                >
                  {night ? <Moon size={16} /> : <Sun size={16} />}{' '}
                  {night ? 'Night lighting' : 'Day lighting'}
                </button>
                {(camera === 'vehicle' || camera === 'cabin') && (
                  <button
                    aria-pressed={doors}
                    onClick={() => setDoors((d) => !d)}
                  >
                    {doors ? 'Close doors' : 'Open doors'}
                  </button>
                )}
              </div>
            </>
          )}
          <div
            className="sd-decision"
            style={
              shownEngineering && shownSystem === 'control'
                ? { display: 'none' }
                : undefined
            }
          >
            <span className="sd-decision-label">THE CURRENT DECISION</span>
            <h3>{frame.phase}</h3>
            <p>{frame.reason}</p>
          </div>
        </aside>
      </main>
      <details className="sd-recording">
        <summary>
          <Video size={18} /> Recording studio{' '}
          <span>Clean 1080p tour · optional narration</span>
        </summary>
        <div className="sd-studio-inner">
          <p>
            Record the same 4:30 tour for YouTube. The export includes the
            channel logo and website, with no narration captions. Audio stays
            off until you start the tour.
          </p>
          <p>
            Use the timestamped script to match each scene. Place each voice-over
            passage at its marked start time, keep the pauses, and export one
            4:30 audio file before adding narration.
          </p>
          <div className="sd-studio-actions">
            <label className="sd-file">
              <Upload size={16} />
              {voiceLoading ? 'Loading audio…' : voiceName || 'Add narration'}
              <input
                type="file"
                accept="audio/*"
                disabled={recording || voiceLoading}
                onChange={(e) => void loadVoice(e.target.files?.[0])}
              />
            </label>
            {voiceName && (
              <button
                className="sd-icon"
                aria-label="Remove narration"
                disabled={recording}
                onClick={() => {
                  voice.current?.clear();
                  setVoiceName('');
                }}
              >
                <X size={16} />
              </button>
            )}
            <button
              className="sd-primary"
              disabled={!ready || voiceLoading}
              onClick={recording ? stopRecording : () => void record()}
            >
              {recording ? <Square size={15} /> : <Video size={16} />}{' '}
              {recording ? 'Stop and save' : 'Record tour'}
            </button>
            <PageLink href="/tours/self-driving-narration.txt" download>
              <Download size={16} /> Timestamped script (4:30)
            </PageLink>
            <PageLink href="/tours/self-driving-voice-only.txt" download>
              <Download size={16} /> Plain text (no timestamps)
            </PageLink>
            <PageLink href="/tours/self-driving-production.md" download>
              <Download size={16} /> YouTube recording guide
            </PageLink>
            {download && (
              <a
                className="sd-download"
                href={download.url}
                download={download.name}
              >
                <Download size={16} /> Save recording
              </a>
            )}
          </div>
          {recording && (
            <output className="sd-notice">
              {playing ? 'Recording' : 'Recording paused'} · {timeText(time)} /
              {timeText(TOUR_DURATION)}
            </output>
          )}
          {notice && <output className="sd-notice">{notice}</output>}
          {download && (
            // User requested caption-free exports; the timed narration transcript is linked above.
            // oxlint-disable-next-line jsx-a11y/media-has-caption
            <video
              controls
              preload="metadata"
              src={download.url}
              aria-label="Recorded self-driving tour preview"
              style={{
                width: '100%',
                maxWidth: 960,
                marginTop: 16,
                borderRadius: 12,
              }}
            />
          )}
        </div>
      </details>
      <footer className="sd-footer">
        <p>
          <strong>An educational simulation.</strong> Vehicle styling references
          Tesla Cybercab. Hardware packaging, detection, prediction, routes, and
          braking are simplified illustrations, not Tesla’s software or measured
          vehicle performance. Night mode changes lighting only.
        </p>
        <div>
          <a
            href="https://www.tesla.com/robotaxi/riderguides/cybercab/en_us/GUID-669E83C2-E7DE-40F4-9DBD-C9A32E7F6DFF.html"
            target="_blank"
            rel="noreferrer"
          >
            Vehicle reference <ArrowUpRight size={13} />
          </a>
          <PageLink href="/engine">
            Explore the engine <ArrowUpRight size={13} />
          </PageLink>
        </div>
      </footer>
    </div>
  );
}
