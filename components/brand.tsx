import { BRAND_MARK_PATH } from '@/lib/brand';
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={BRAND_MARK_PATH}
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
