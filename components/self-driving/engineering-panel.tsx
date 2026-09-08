import { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  SYSTEMS,
  systemInfo,
  engineeringTelemetry,
  stoppingExperiment,
  ENGINEERING_SOURCES,
  type SystemId,
  type Assembly,
} from '@/lib/self-driving/engineering';
import {
  blockedByVan,
  laneAt,
  SCENARIOS,
  type Frame,
  type Settings,
} from '@/lib/self-driving/simulation';

function WorldMap({
  frame: f,
  settings: s,
  planning,
}: {
  frame: Frame;
  settings: Settings;
  planning: boolean;
}) {
  const map = (x: number, z: number) => [150 + z * 20, 219 - (x - f.x) * 8];
  const car = map(f.x, f.z),
    ped = map(5, f.pedestrianZ);
  const route = Array.from({ length: 42 }, (_, i) => {
    const x = f.x + i * 0.5;
    return map(x, laneAt(x, s.scenario)).join(',');
  }).join(' ');
  const cells = Array.from({ length: 180 }, (_, i) => {
    const x = f.x + Math.floor(i / 12) * 1.5,
      z = (i % 12) - 5.5;
    const p = map(x, z);
    return {
      p,
      hidden: s.scenario === 'crossing' && blockedByVan(f.x + 1.9, f.z, x, z),
    };
  });
  const van = map(-0.8, -4.45),
    stop = map(s.scenario === 'signal' ? 2.05 : 3.4, f.z);
  return (
    <figure className="sd-world-map">
      <svg
        viewBox="0 0 300 244"
        aria-label="Top-down representation derived from the simulation geometry"
      >
        <defs>
          <clipPath id="sd-map-clip">
            <rect width="300" height="244" rx="7" />
          </clipPath>
        </defs>
        <g clipPath="url(#sd-map-clip)">
          <rect width="300" height="244" fill="#0c1a22" />
          {cells.map(({ p, hidden }, i) => (
            <rect
              key={i}
              x={p[0] - 8}
              y={p[1] - 9}
              width="16"
              height="10"
              fill={hidden ? '#41454b' : '#244346'}
              opacity={hidden ? 0.8 : 0.45}
            />
          ))}
          <path
            d="M150 0V244"
            stroke="#819797"
            strokeDasharray="5 7"
            opacity=".45"
          />
          <path d="M67 0V244M233 0V244" stroke="#547175" opacity=".6" />
          <polyline
            points={route}
            fill="none"
            stroke={planning ? '#d5ef78' : '#456764'}
            strokeWidth={planning ? 4 : 2}
          />
          {s.scenario === 'crossing' && (
            <rect
              x={van[0]}
              y={van[1] - 28.8}
              width="42"
              height="28.8"
              fill="#60717b"
              stroke="#a5b5bb"
            />
          )}
          <rect
            x={car[0] - 15}
            y={car[1] - 18}
            width="30"
            height="36"
            rx="7"
            fill="#c6af80"
          />
          <path
            d={`M${car[0] - 5} ${car[1] - 5}l5 -6 5 6`}
            fill="none"
            stroke="#102b32"
            strokeWidth="2"
          />
          {f.yielding && planning && (
            <path
              d={`M${stop[0] - 30} ${stop[1]}h60`}
              stroke="#f08c81"
              strokeWidth="3"
            />
          )}
          {f.visible && (
            <>
              <circle cx={ped[0]} cy={ped[1]} r="5" fill="#71dceb" />
              {planning && (
                <path
                  d={`M${ped[0]} ${ped[1]}h63`}
                  stroke="#e9b563"
                  strokeWidth="2"
                  strokeDasharray="4 5"
                />
              )}
            </>
          )}
        </g>
      </svg>
      <figcaption>
        Geometry-derived map · gray = occluded space
        {planning ? ' · amber = motion estimate' : ''}
      </figcaption>
    </figure>
  );
}
function Knob({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="sd-range">
      <span>
        {label}
        <strong>
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
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
export default function EngineeringPanel({
  system,
  frame,
  settings,
  assembly,
  onAssembly,
  onSettings,
  onRoad,
}: {
  system: SystemId;
  frame: Frame;
  settings: Settings;
  assembly: Assembly;
  onAssembly: (v: Assembly) => void;
  onSettings: (v: Partial<Settings>) => void;
  onRoad: () => void;
}) {
  const info = systemInfo(system),
    t = engineeringTelemetry(frame, settings);
  const [delay, setDelay] = useState(150),
    [deceleration, setDeceleration] = useState(3.5);
  const stopping = stoppingExperiment(settings.speedKph, delay, deceleration);
  return (
    <div
      className="sd-engineering-panel"
      style={{ '--system-color': info.color } as React.CSSProperties}
    >
      <p className="sd-panel-label">
        {info.number}
        <span>{info.title.toUpperCase()}</span>
      </p>
      <h2>{info.question}</h2>
      <p className="sd-engineering-body">{info.body}</p>
      <div className="sd-assembly" aria-label="Body assembly">
        {(['assembled', 'cutaway', 'exploded'] as const).map((v) => (
          <button
            key={v}
            aria-pressed={assembly === v}
            onClick={() => onAssembly(v)}
          >
            {v === 'assembled'
              ? 'Exterior'
              : v === 'cutaway'
                ? 'Cutaway'
                : 'Exploded'}
          </button>
        ))}
      </div>
      <div className="sd-signal-chain">
        <div>
          <small>INPUT</small>
          <span>{info.input}</span>
        </div>
        <ArrowRight size={14} />
        <div>
          <small>PROCESS</small>
          <span>{info.process}</span>
        </div>
        <ArrowRight size={14} />
        <div>
          <small>OUTPUT</small>
          <span>{info.output}</span>
        </div>
      </div>
      {(system === 'perception' ||
        system === 'planning' ||
        system === 'sensors') && (
        <>
          <WorldMap
            frame={frame}
            settings={settings}
            planning={system === 'planning'}
          />
          <dl className="sd-engineering-metrics">
            <div>
              <dt>Pedestrian observation</dt>
              <dd>{frame.visible ? 'In view' : 'Not observed'}</dd>
            </div>
            <div>
              <dt>Forward / lateral position</dt>
              <dd>
                {frame.visible
                  ? `${t.forward.toFixed(1)} / ${t.lateral.toFixed(1)} m`
                  : 'Unknown'}
              </dd>
            </div>
            {system === 'planning' && (
              <div>
                <dt>Motion estimate</dt>
                <dd>
                  {frame.visible
                    ? t.pedestrianVelocity.toFixed(2) +
                      ' m/s · constant velocity'
                    : 'Waiting for observation'}
                </dd>
              </div>
            )}
          </dl>
        </>
      )}
      {system === 'compute' && (
        <>
          <div className="sd-chip-explainer">
            <span>CAMERA FRAMES</span>
            <ArrowRight size={14} />
            <strong>INFERENCE</strong>
            <ArrowRight size={14} />
            <span>TRAJECTORY</span>
            <small>Model weights + recent observations in memory</small>
          </div>
          <p className="sd-small-note">
            The opened board shows generic processor, memory and cooling
            packaging. Chip count and layout are illustrative.
          </p>
        </>
      )}
      {(system === 'control' || system === 'overview') && (
        <>
          <dl className="sd-engineering-metrics">
            <div>
              <dt>Target / measured speed</dt>
              <dd>
                {(frame.targetSpeed * 3.6).toFixed(1)} /{' '}
                {(frame.speed * 3.6).toFixed(1)} km/h
              </dd>
            </div>
            <div>
              <dt>Front wheel angle</dt>
              <dd>{((t.steering * 180) / Math.PI).toFixed(1)}°</dd>
            </div>
            <div>
              <dt>Wheel rotation</dt>
              <dd>{t.wheelRpm.toFixed(0)} rpm</dd>
            </div>
            <div>
              <dt>Acceleration</dt>
              <dd>{frame.acceleration.toFixed(2)} m/s²</dd>
            </div>
          </dl>
          <div className="sd-actuator-bars">
            <label>
              Propulsion demand <meter min="0" max="1" value={t.drive} />
            </label>
            <label>
              Deceleration demand <meter min="0" max="1" value={t.brake} />
            </label>
          </div>
          <p className="sd-formula">
            path curvature → wheel angle
            <br />
            target speed − measured speed → acceleration
          </p>
        </>
      )}
      {system === 'power' && (
        <>
          <div className="sd-power-chain">
            <b>400 V battery</b>
            <span>→ Integrated inverter → Front motor</span>
            <span>↳ Voltage conversion → 48 V system</span>
            <small>
              Orange = traction power · Teal = illustrative cooling route
            </small>
          </div>
          <p className="sd-small-note">
            Battery placement, voltage systems and front drive unit are
            documented by Tesla. Converter, computing and actuator packaging are
            simplified for explanation.
          </p>
        </>
      )}
      {(system === 'compute' || system === 'control') && (
        <details className="sd-experiment" open>
          <summary>Experiment: why delay matters</summary>
          <p>
            A separate constant-braking model at your chosen speed. This does
            not change the road simulation.
          </p>
          <Knob
            label="Processing + actuation delay"
            value={delay}
            min={0}
            max={1000}
            step={50}
            unit="ms"
            onChange={setDelay}
          />
          <Knob
            label="Constant deceleration"
            value={deceleration}
            min={1}
            max={6}
            step={0.5}
            unit="m/s²"
            onChange={setDeceleration}
          />
          <div className="sd-stopping">
            <span
              style={{
                width: (100 * stopping.reaction) / stopping.total + '%',
              }}
            />
            <span style={{ flex: 1 }} />
          </div>
          <dl className="sd-engineering-metrics">
            <div>
              <dt>Distance during delay</dt>
              <dd>{stopping.reaction.toFixed(2)} m</dd>
            </div>
            <div>
              <dt>Total stopping distance</dt>
              <dd>{stopping.total.toFixed(2)} m</dd>
            </div>
          </dl>
          <p className="sd-formula">
            distance = v × delay + v² / (2 × deceleration)
          </p>
        </details>
      )}
      <div className="sd-engineering-test">
        <label htmlFor="engineering-scenario">LIVE INPUT SCENARIO</label>
        <select
          id="engineering-scenario"
          value={settings.scenario}
          onChange={(e) =>
            onSettings({ scenario: e.target.value as Settings['scenario'] })
          }
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <Knob
          label="Target cruise speed"
          value={settings.speedKph}
          min={10}
          max={35}
          unit="km/h"
          onChange={(v) => onSettings({ speedKph: v })}
        />
        <button onClick={onRoad}>
          Watch this on the road <ArrowUpRight size={15} />
        </button>
      </div>
      <details className="sd-source-details">
        <summary>What is documented? What is simplified?</summary>
        <p>
          This is an educational Cybercab reference model. The software stages
          explain functions: an end-to-end network can combine them. This
          browser demo uses explicit geometry and rules, not Tesla software.
          Sensor count, PCB, wiring and actuator internals are illustrative.
        </p>
        {ENGINEERING_SOURCES.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
            {s.title}
            <ArrowUpRight size={12} />
            <small>{s.note}</small>
          </a>
        ))}
      </details>
    </div>
  );
}
export function EngineeringSteps({
  value,
  onChange,
  disabled,
}: {
  value: SystemId;
  onChange: (v: SystemId) => void;
  disabled: boolean;
}) {
  return (
    <nav
      className="sd-engineering-steps"
      aria-label="Explore the autonomy systems"
    >
      {SYSTEMS.map((s) => (
        <button
          key={s.id}
          disabled={disabled}
          aria-pressed={s.id === value}
          onClick={() => onChange(s.id)}
          style={{ '--system-color': s.color } as React.CSSProperties}
        >
          <small>{s.number}</small>
          {s.short}
        </button>
      ))}
    </nav>
  );
}
