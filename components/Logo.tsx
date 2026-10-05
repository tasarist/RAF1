/** 5SE™ mark: Tasarist's inverted-triangle-in-circle motif carrying the five shelf principles as five ticks. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="5SE Packaging Intelligence" role="img">
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="3.5" />
      <path d="M17 22h30L32 47z" fill="currentColor" />
      <path d="M12 12l4 4M52 12l-4 4M32 6v5M8 32h5M51 32h5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="brand">
      <Logo size={30} />
      <span>
        5SE<sup style={{ fontSize: "0.55em", fontWeight: 600 }}>™</sup>
        <br />
        <small>Packaging Intelligence</small>
      </span>
    </span>
  );
}
