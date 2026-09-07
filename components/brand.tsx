export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M28 10H20C12.268 10 6 16.268 6 24s6.268 14 14 14h8"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path d="M30 4h12v12H30z" fill="var(--brand-accent, #d5ef78)" />
    </svg>
  );
}
export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`htc-brand ${inverse ? 'htc-brand-inverse' : ''}`}>
      <BrandMark />
      <span>
        how things <strong>click.</strong>
      </span>
    </span>
  );
}
