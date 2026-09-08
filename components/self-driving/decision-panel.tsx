import {
  decisionCheckpoints,
  decisionReadout,
} from '@/lib/self-driving/decision';
import type { Frame, Settings } from '@/lib/self-driving/simulation';

export default function DecisionPanel({
  frame,
  frames,
  settings,
  disabled,
  onSeek,
}: {
  frame: Frame;
  frames: Frame[];
  settings: Settings;
  disabled: boolean;
  onSeek: (time: number) => void;
}) {
  const points = decisionCheckpoints(frames, settings),
    data = decisionReadout(frame, settings);
  const active = points.filter((p) => p.time <= frame.time + 0.001).at(-1)?.id;
  return (
    <section
      className="sd-decision-explorer"
      aria-label="Follow a driving decision"
    >
      <div className="sd-checkpoint-heading">
        <strong>Pause at the moment it changes</strong>
        <span>Change a setting, then compare the same moments.</span>
      </div>
      <nav className="sd-checkpoints" aria-label="Decision checkpoints">
        {points.map((p, i) => (
          <button
            key={p.id}
            disabled={disabled}
            aria-pressed={active === p.id}
            onClick={() => onSeek(p.time)}
          >
            <span>0{i + 1}</span>
            <strong>{p.label}</strong>
            <small>{p.time.toFixed(1)} s</small>
          </button>
        ))}
      </nav>
      <ol
        className="sd-live-chain"
        aria-label="Live sensing, planning and actuation"
      >
        <li>
          <small>01 · OBSERVE</small>
          <strong>{data.observation}</strong>
        </li>
        <li>
          <small>02 · PLAN</small>
          <strong>{data.plan}</strong>
        </li>
        <li>
          <small>03 · ACT</small>
          <strong>
            {data.action} · {data.angle.toFixed(1)}° steering
          </strong>
        </li>
      </ol>
    </section>
  );
}
