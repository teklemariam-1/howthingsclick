/// <reference types="vite/client" />
'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Expand,
  Layers,
  Radio,
  Orbit,
  Satellite,
  Network,
  TreePine,
  Server,
  ChevronRight,
  Download,
  Video,
  Square,
  Camera,
  Mic,
} from 'lucide-react';
import PageLink from '@/components/page-link';
import Brand from '@/components/brand';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  views,
  sampleTour,
  durationFor,
  shotsFor,
  orbitalSpeed,
  type View,
  type Format,
} from '@/lib/starlink/simulation';
import type { createStarlinkScene, Display } from './scene';
import { TourAudio } from '@/components/engine/tour-audio';
import './lab.css';
const icons = [
  Orbit,
  Radio,
  Radio,
  Satellite,
  Network,
  Server,
  Orbit,
  TreePine,
];
const stamp = (t: number) =>
  Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
export default function StarlinkLab() {
  const host = useRef<HTMLDivElement>(null),
    api = useRef<ReturnType<typeof createStarlinkScene> | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [view, setView] = useState<View>('overview'),
    [time, setTime] = useState(0),
    [playing, setPlaying] = useState(true),
    [tour, setTour] = useState(false),
    [format, setFormat] = useState<Format>('full'),
    [angle, setAngle] = useState(0),
    [explode, setExplode] = useState(0),
    [blocked, setBlocked] = useState(false),
    [lasers, setLasers] = useState(true),
    [speed, setSpeed] = useState(1);
  const recorder = useRef<MediaRecorder | null>(null),
    audio = useRef<TourAudio | null>(null),
    downloadUrl = useRef(''),
    rendering = useRef(false),
    cancelRender = useRef(false);
  const [recording, setRecording] = useState(false),
    [exported, setExported] = useState<{ url: string; name: string } | null>(
      null,
    ),
    [notice, setNotice] = useState(''),
    [voice, setVoice] = useState<{ name: string; duration: number } | null>(
      null,
    );
  const state = useRef({
    view,
    time,
    playing,
    tour,
    format,
    angle,
    explode,
    blocked,
    lasers,
    speed,
  });
  useEffect(() => {
    state.current = {
      ...state.current,
      view,
      playing,
      tour,
      format,
      angle,
      explode,
      blocked,
      lasers,
      speed,
    };
  }, [view, playing, tour, format, angle, explode, blocked, lasers, speed]);
  function choose(v: View) {
    if (recorder.current) return;
    state.current.time = 0;
    setTime(0);
    setTour(false);
    setView(v);
    setExplode(v === 'beam' ? 1 : 0);
    setBlocked(v === 'obstruction');
  }
  function seek(t: number) {
    state.current.time = t;
    setTime(t);
    api.current?.update(displayFor(state.current), 0);
  }
  function displayFor(s: typeof state.current): Display {
    const shot = s.tour ? sampleTour(s.time, s.format) : null;
    return {
      view: shot?.shot.view ?? s.view,
      time: s.time,
      angle: shot?.angle ?? s.angle,
      explode: shot?.explode ?? s.explode,
      blocked: shot?.blocked ?? s.blocked,
      lasers: s.tour ? true : s.lasers,
      guided: s.tour,
      title: shot?.shot.title,
      kicker: shot?.shot.kicker,
      shotId: shot?.shot.id,
      localTime: shot?.local,
      progress: s.tour ? s.time / durationFor(s.format) : undefined,
      portrait: s.format === 'short' && s.tour,
    };
  }
  function transport(play: boolean) {
    state.current.playing = play;
    setPlaying(play);
    const r = recorder.current;
    if (r?.state === 'recording' && !play) r.pause();
    else if (r?.state === 'paused' && play) r.resume();
    if (!play) audio.current?.pause();
    else void audio.current?.resume();
  }
  function beginTour() {
    state.current.tour = true;
    state.current.time = 0;
    setTime(0);
    setTour(true);
    transport(true);
    api.current?.update(displayFor(state.current), 0);
  }
  async function renderFilm() {
    if (!api.current || recording) return;
    rendering.current = true;
    cancelRender.current = false;
    setRecording(true);
    transport(false);
    setTour(true);
    state.current.tour = true;
    state.current.time = 0;
    setTime(0);
    setNotice('Preparing all frames…');
    try {
      const { renderProduction } = await import('./production-render');
      const result = await renderProduction(
        api.current,
        format,
        (frame, total) => {
          setNotice(
            'Rendering ' +
              frame +
              ' / ' +
              total +
              ' frames — ' +
              Math.round((frame / total) * 100) +
              '%',
          );
          setTime(frame / 30);
          state.current.time = frame / 30;
        },
        () => cancelRender.current,
      );
      setNotice('Production master saved: ' + result.path);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Production render failed.',
      );
    } finally {
      rendering.current = false;
      setRecording(false);
      transport(false);
    }
  }
  function stopRecording() {
    if (rendering.current) cancelRender.current = true;
    transport(false);
    const r = recorder.current;
    if (r && r.state !== 'inactive') r.stop();
  }
  async function recordTour() {
    if (!api.current || recorder.current) return;
    if (typeof MediaRecorder === 'undefined') {
      setNotice(
        'Recording is not supported in this browser. Open this lab in a current Chrome or Edge browser.',
      );
      return;
    }
    setNotice('');
    let stream: MediaStream | undefined;
    try {
      await audio.current?.resume();
      const kind = state.current.format;
      state.current.tour = true;
      state.current.time = 0;
      state.current.playing = false;
      setTour(true);
      setTime(0);
      stream = api.current.startCapture(displayFor(state.current), kind);
      if (voice && audio.current)
        stream.addTrack(audio.current.recordingTrack());
      const mime = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ].find((v) => MediaRecorder.isTypeSupported(v));
      const r = new MediaRecorder(stream, {
        ...(mime ? { mimeType: mime } : {}),
        videoBitsPerSecond: 12000000,
      });
      const chunks: Blob[] = [];
      const captured = stream;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onerror = () => {
        setNotice(
          'Recording stopped unexpectedly. You can retry or save the captured portion.',
        );
        stopRecording();
      };
      r.onstop = () => {
        captured.getTracks().forEach((t) => t.stop());
        api.current?.endCapture();
        recorder.current = null;
        setRecording(false);
        audio.current?.pause();
        if (chunks.length) {
          const blob = new Blob(chunks, { type: r.mimeType });
          if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
          const url = URL.createObjectURL(blob);
          downloadUrl.current = url;
          setExported({
            url,
            name:
              'HowThingsClick-Starlink-' +
              (kind === 'short' ? 'Short' : 'Full') +
              (r.mimeType.includes('mp4') ? '.mp4' : '.webm'),
          });
          setNotice(
            'Your recording is ready to save. ' +
              (voice
                ? 'Includes your local narration.'
                : 'Visual master — add the timed voiceover in your editor.'),
          );
        } else
          setNotice(
            'No frames were captured. Please retry with the lab visible.',
          );
      };
      recorder.current = r;
      r.start(1000);
      setRecording(true);
      transport(true);
    } catch (err) {
      stream?.getTracks().forEach((t) => t.stop());
      api.current?.endCapture();
      recorder.current = null;
      setRecording(false);
      transport(false);
      setNotice(
        err instanceof Error ? err.message : 'Recording could not start.',
      );
    }
  }
  async function loadVoice(file?: File) {
    if (!file) return;
    try {
      audio.current ??= new TourAudio();
      const duration = await audio.current.load(file);
      if (duration !== null) {
        setVoice({ name: file.name, duration });
        setNotice(
          Math.abs(duration - durationFor(format)) > 1
            ? 'Voice length differs from this tour. Align each chapter to the timing sheet before recording.'
            : 'Narration loaded locally. It will play only when you start the tour.',
        );
      }
    } catch {
      setNotice(
        'This audio file could not be decoded. Try an MP3 or WAV file.',
      );
    }
  }
  async function exportLocal() {
    if (!exported) return;
    setNotice('Saving the production file to the project…');
    try {
      const blob = await (await fetch(exported.url)).blob();
      const kind = exported.name.includes('Short') ? 'short' : 'full';
      const r = await fetch('http://127.0.0.1:4319/exports/' + kind, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });
      if (!r.ok) throw Error('Export helper returned ' + r.status);
      const result = (await r.json()) as { path: string };
      setNotice('Saved: ' + result.path);
    } catch {
      setNotice(
        'Start node scripts/starlink-export-server.mjs locally, then try Save to production folder again.',
      );
    }
  }
  async function saveStill() {
    const blob = await api.current?.still();
    if (!blob) return;
    if (import.meta.env.DEV) {
      try {
        const r = await fetch('http://127.0.0.1:4319/exports/still', {
          method: 'POST',
          headers: { 'Content-Type': 'image/png' },
          body: blob,
        });
        if (!r.ok) throw Error();
        const result = (await r.json()) as { path: string };
        setNotice('Still saved: ' + result.path);
        return;
      } catch {
        /* Normal browser download remains available without the local helper. */
      }
    }
    const url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'HowThingsClick-Starlink-Still.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  useEffect(() => {
    let alive = true,
      assetsReady = false,
      id = 0,
      last = performance.now(),
      lastUi = 0;
    const visibility = () => {
      last = performance.now();
      if (document.hidden) {
        state.current.playing = false;
        setPlaying(false);
        audio.current?.pause();
        if (recorder.current?.state === 'recording') {
          recorder.current.pause();
          setNotice(
            'Recording paused because this tab was hidden. Return and press Play to resume.',
          );
        }
      }
    };
    document.addEventListener('visibilitychange', visibility);
    import('./scene')
      .then(({ createStarlinkScene }) => {
        if (!alive || !host.current) return;
        const scene = createStarlinkScene(host.current, choose);
        api.current = scene;
        scene.ready
          .then(() => {
            if (alive) {
              assetsReady = true;
              last = performance.now();
              setReady(true);
            }
          })
          .catch(() => {
            if (alive)
              setError('The 3D assets could not load. Reload to try again.');
          });
        const frame = (now: number) => {
          if (!alive) return;
          if (rendering.current) {
            last = now;
            id = requestAnimationFrame(frame);
            return;
          }
          const s = state.current,
            dt = Math.max(0, (now - last) / 1000);
          last = now;
          if (s.playing && assetsReady && !document.hidden)
            s.time += dt * (s.tour ? 1 : s.speed);
          if (s.tour && s.time >= durationFor(s.format)) {
            s.time = durationFor(s.format);
            s.playing = false;
            setPlaying(false);
          }
          const display = displayFor(s);
          scene.update(display, Math.min(dt, 0.1));
          audio.current?.sync(s.time, s.tour && s.playing);
          if (
            s.tour &&
            !s.playing &&
            s.time >= durationFor(s.format) &&
            recorder.current &&
            recorder.current.state !== 'inactive'
          )
            recorder.current.stop();
          if (now - lastUi > 100) {
            setTime(s.time);
            lastUi = now;
          }
          id = requestAnimationFrame(frame);
        };
        id = requestAnimationFrame(frame);
      })
      .catch(() =>
        setError(
          'This browser could not start the 3D scene. Please enable hardware acceleration and reload.',
        ),
      );
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', visibility);
      cancelAnimationFrame(id);
      const r = recorder.current;
      if (r) {
        r.onstop = null;
        r.stream.getTracks().forEach((t) => t.stop());
        if (r.state !== 'inactive') r.stop();
        recorder.current = null;
      }
      audio.current?.dispose();
      audio.current = null;
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
      api.current?.dispose();
      api.current = null;
    };
  }, []);
  const sampled = tour ? sampleTour(time, format) : null,
    shownAngle = sampled?.angle ?? angle,
    shownExplode = sampled?.explode ?? explode;
  const current = sampled?.shot.view ?? view,
    info = views.find((v) => v.id === current)!;
  return (
    <div className="starlink-lab">
      <header className="sl-header">
        <PageLink href="/" aria-label="How Things Click home">
          <Brand inverse />
        </PageLink>
        <PageLink href="/#explore" className="sl-back">
          <ArrowLeft size={16} /> All labs
        </PageLink>
        <span className="sl-edition">
          EXPLORATION 04 <span>SPACE & TECHNOLOGY</span>
        </span>
      </header>
      <main className="sl-main">
        <div className="sl-intro">
          <div>
            <p className="sl-eyebrow">A CONNECTION BEYOND THE HORIZON</p>
            <h1>
              How Starlink <em>actually works.</em>
            </h1>
          </div>
          <p>
            Follow a packet. Open the satellite.
            <br />
            Take control of the connection.
          </p>
        </div>
        <div className="sl-workspace">
          <nav className="sl-nav" aria-label="Explore Starlink systems">
            {views.map((v, i) => {
              const Icon = icons[i];
              return (
                <button
                  disabled={recording}
                  key={v.id}
                  onClick={() => choose(v.id)}
                  aria-pressed={current === v.id}
                >
                  <Icon size={19} />
                  <span>{v.label}</span>
                  <ChevronRight size={14} />
                </button>
              );
            })}
            <div className="sl-nav-note">
              <span>ONE NETWORK. MANY MOVING PARTS.</span>
              <p>
                Drag to orbit.
                <br />
                Scroll to get closer.
                <br />
                Click a part to explore.
              </p>
            </div>
          </nav>
          <section
            className={
              'sl-stage' +
              (tour ? ' sl-film' : '') +
              (tour && format === 'short' ? ' sl-portrait' : '')
            }
            aria-label="Starlink interactive animation"
          >
            <div className="sl-canvas" ref={host} />
            {!ready && !error && (
              <div className="sl-loading">Preparing the orbital scene…</div>
            )}
            {error && (
              <div className="sl-loading" role="alert">
                {error}
              </div>
            )}
            <div className="sl-stage-top">
              <span className="sl-live">INTERACTIVE 3D</span>
              <button
                disabled={recording}
                aria-label="Reset camera"
                onClick={() => api.current?.resetCamera()}
              >
                <RotateCcw size={17} />
              </button>
              <button
                aria-label="Expand animation"
                onClick={() => host.current?.parentElement?.requestFullscreen()}
              >
                <Expand size={17} />
              </button>
            </div>
            {!tour && (
              <div className="sl-stage-caption">
                <span>
                  {String(
                    views.findIndex((v) => v.id === current) + 1,
                  ).padStart(2, '0')}{' '}
                  / EXPLORE
                </span>
                <h2>{info.label}</h2>
                <p>{info.subtitle}</p>
              </div>
            )}
            <div className="sl-legend">
              <span>
                <i style={{ background: '#48c9ff' }} />
                Radio
              </span>
              <span>
                <i style={{ background: '#ffd17f' }} />
                Laser
              </span>
              <span>
                <i style={{ background: '#d5ef78' }} />
                Return / fiber
              </span>
            </div>
          </section>
        </div>
        <section className="sl-controls" aria-label="Animation controls">
          <div className="sl-transport">
            <button
              className="sl-play"
              disabled={!ready || rendering.current}
              aria-label={playing ? 'Pause animation' : 'Play animation'}
              onClick={() => transport(!playing)}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              disabled={recording}
              onClick={() => {
                seek(0);
                transport(true);
              }}
              aria-label="Replay animation"
            >
              <RotateCcw size={17} />
            </button>
            <span>
              {stamp(time)}
              {tour ? ' / ' + stamp(durationFor(format)) : ''}
            </span>
          </div>
          <div className="sl-experiment">
            {['terminal', 'beam', 'satellite'].includes(current) && (
              <>
                <button
                  onClick={() => setExplode(explode > 0.5 ? 0 : 1)}
                  disabled={tour}
                >
                  <Layers size={16} />
                  {shownExplode > 0.5 ? 'Assemble' : 'Disassemble'}
                </button>
                <div className="sl-control-label">
                  Assembly
                  <Slider
                    thumbLabel="Assembly separation"
                    aria-label="Assembly separation"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[shownExplode]}
                    onValueChange={(v) =>
                      setExplode(Array.isArray(v) ? v[0] : v)
                    }
                    disabled={tour}
                  />
                </div>
              </>
            )}
            {current === 'beam' && (
              <div className="sl-control-label">
                Beam {Math.round(shownAngle)}°
                <Slider
                  thumbLabel="Beam steering angle"
                  aria-label="Beam steering angle"
                  min={-45}
                  max={45}
                  step={1}
                  value={[shownAngle]}
                  onValueChange={(v) => setAngle(Array.isArray(v) ? v[0] : v)}
                  disabled={tour}
                />
              </div>
            )}
            {current === 'obstruction' && (
              <div className="sl-control-label sl-toggle">
                <Switch
                  aria-label="Obstruct the sky"
                  checked={blocked}
                  onCheckedChange={setBlocked}
                  disabled={tour}
                />{' '}
                Obstruct the sky
              </div>
            )}
            {current === 'lasers' && (
              <div className="sl-control-label sl-toggle">
                <Switch
                  aria-label="Route via lasers"
                  disabled={tour || recording}
                  checked={lasers}
                  onCheckedChange={setLasers}
                />{' '}
                Route via lasers
              </div>
            )}
          </div>
          <div className="sl-tour">
            <select
              aria-label="Exploration speed"
              value={speed}
              disabled={tour || recording}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={1}>1× speed</option>
              <option value={1.5}>1.5× speed</option>
              <option value={2}>2× speed</option>
            </select>
            <select
              disabled={recording}
              aria-label="Tour format"
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as Format);
                setTour(false);
                seek(0);
                audio.current?.clear();
                setVoice(null);
              }}
            >
              <option value="full">Full film · 2:30</option>
              <option value="short">Short · 1:00</option>
            </select>
            <button
              className="sl-primary"
              disabled={!ready || recording}
              onClick={beginTour}
            >
              <Play size={16} /> Play tour
            </button>
          </div>
        </section>
        {tour && (
          <div className="sl-timeline">
            <Slider
              disabled={recording}
              thumbLabel="Tour timeline"
              aria-label="Tour timeline"
              min={0}
              max={durationFor(format)}
              step={0.1}
              value={[time]}
              onValueChange={(v) => seek(Array.isArray(v) ? v[0] : v)}
            />
            <button
              disabled={recording}
              onClick={() => {
                setTour(false);
                setView(current);
                audio.current?.pause();
              }}
            >
              Exit tour
            </button>
          </div>
        )}
        <section className="sl-studio" aria-label="Video recording studio">
          <div>
            <p className="sl-eyebrow">MAKE THE FILM</p>
            <h3>
              {format === 'short'
                ? '60 seconds · 9:16'
                : '2 minutes 30 seconds · 16:9'}
            </h3>
            <p>
              1080p export. Branded chapters and part labels. Narration captions
              are off.
            </p>
          </div>
          <div className="sl-studio-actions">
            {recording ? (
              <button className="sl-record active" onClick={stopRecording}>
                <Square size={16} />{' '}
                {rendering.current ? 'Cancel render' : 'Stop & save'}
              </button>
            ) : (
              <button
                disabled={!ready}
                className="sl-record"
                onClick={recordTour}
              >
                <Video size={18} /> Record tour
              </button>
            )}
            {import.meta.env.DEV && (
              <button disabled={!ready || recording} onClick={renderFilm}>
                <Video size={16} /> Render smooth master
              </button>
            )}
            <button disabled={!ready || recording} onClick={saveStill}>
              <Camera size={16} /> Save still
            </button>
            <label className="sl-upload">
              <Mic size={16} />
              {voice ? 'Replace voiceover' : 'Add voiceover'}
              <input
                aria-label="Local narration audio"
                type="file"
                accept="audio/*"
                disabled={recording}
                onChange={(e) => {
                  void loadVoice(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            {voice && (
              <button
                disabled={recording}
                onClick={() => {
                  audio.current?.clear();
                  setVoice(null);
                }}
              >
                Remove voiceover
              </button>
            )}
          </div>
          {voice && (
            <p className="sl-voice">
              {voice.name} · {stamp(voice.duration)} · stays on this device
            </p>
          )}
          <output className="sl-record-status">
            {rendering.current
              ? notice
              : recording
                ? playing
                  ? 'Recording ' +
                    stamp(time) +
                    ' / ' +
                    stamp(durationFor(format)) +
                    ' — keep this tab visible.'
                  : 'Recording paused. Press Play to resume.'
                : notice}
          </output>
          {exported && (
            <div className="sl-export">
              <a href={exported.url} download={exported.name}>
                <Download size={17} /> Download {exported.name}
              </a>
              {import.meta.env.DEV && (
                <button onClick={exportLocal}>Save to production folder</button>
              )}
              {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- Narration is user supplied; automatic captions are intentionally off. */}
              <video
                aria-label="Recorded Starlink tour"
                src={exported.url}
                controls
                preload="metadata"
              />
            </div>
          )}
          <details className="sl-script">
            <summary>Chapters & narration files</summary>
            <div className="sl-chapters">
              {shotsFor(format).map((shot, i) => {
                const start = shotsFor(format)
                  .slice(0, i)
                  .reduce((n, v) => n + v.duration, 0);
                return (
                  <button
                    disabled={recording}
                    key={shot.id}
                    onClick={() => {
                      state.current.tour = true;
                      setTour(true);
                      transport(false);
                      seek(start + 0.25);
                    }}
                  >
                    <span>{stamp(start)}</span>
                    {shot.title}
                  </button>
                );
              })}
            </div>
            <div className="sl-script-links">
              <a href={'/tours/starlink-' + format + '-narration.txt'} download>
                Timed narration
              </a>
              <a
                href={'/tours/starlink-' + format + '-voice-only.txt'}
                download
              >
                Voice-only script
              </a>
              <a href={'/tours/starlink-' + format + '-cues.json'} download>
                Timing cues
              </a>
            </div>
            <p>
              Generate or record each paragraph separately, then place it at its
              chapter start. Chapter timecodes guide the edit; they do not
              automatically stretch a voice recording.
            </p>
          </details>
        </section>
        <div className="sl-below">
          <article>
            <p className="sl-eyebrow">WHAT YOU ARE SEEING</p>
            <h3>{info.label}</h3>
            <p>
              {info.subtitle} The model combines reference-informed hardware
              with illustrative signal paths, motion and scale.
            </p>
            <div className="sl-facts">
              <span>
                <strong>{orbitalSpeed().toFixed(2)} km/s</strong>Illustrative
                480 km circular orbit
              </span>
              <span>
                <strong>Electronic</strong>Beam steering, not a tracking motor
              </span>
              <span>
                <strong>Two paths</strong>Gateway directly, or via laser links
              </span>
            </div>
          </article>
          <aside>
            <p className="sl-eyebrow">THE FILM, YOUR WAY</p>
            <h3>One journey. Two edits.</h3>
            <p>
              A brisk 60-second portrait tour, or a 2½-minute engineering
              explanation. Pause any scene and make the connection your own.
            </p>
            <a href={'/tours/starlink-' + format + '-narration.txt'} download>
              Download timed narration ↗
            </a>
          </aside>
        </div>
        <details className="sl-sources">
          <summary>Sources, model accuracy & credits</summary>
          <p>
            Original educational reconstruction. Satellite internals, exact
            routing and handoff behavior are illustrative, not SpaceX
            engineering data. Orbit altitude varies and is changing; the 480 km
            scene is representative. Beams are visible and spacecraft enlarged
            to explain the network.
          </p>
          <a
            href="https://www.starlink.com/technology"
            target="_blank"
            rel="noreferrer"
          >
            Starlink technology
          </a>
          <a
            href="https://www.starlink.com/public-files/specification_sheet_standard.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Standard 4 X specifications
          </a>
          <a
            href="https://space-safety.starlink.com/docs/space-safety-articles/constellation_altitudes/"
            target="_blank"
            rel="noreferrer"
          >
            Starlink orbital shells
          </a>
          <a href="/licenses/starlink-assets.md" download>
            NASA imagery & asset credits
          </a>
        </details>
      </main>
      <footer className="sl-footer">
        HOW THINGS CLICK <span>Curiosity, in motion.</span>
      </footer>
    </div>
  );
}

import './studio.css';
