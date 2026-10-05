export function scoreTone(score: number | null) {
  if (score === null) return "muted";
  if (score >= 75) return "green";
  if (score >= 55) return "blue";
  if (score >= 40) return "amber";
  return "red";
}

const COLORS: Record<string, string> = {
  green: "var(--green)",
  blue: "var(--blue)",
  amber: "var(--amber)",
  red: "var(--red)",
  muted: "var(--text-3)",
  sky: "var(--sky)",
  white: "#fff",
};

export function ScoreRing({ value, size = 160, label, max = 100, color, onDark = false }: { value: number | null; size?: number; label?: string; max?: number; color?: string; onDark?: boolean }) {
  const stroke = Math.max(8, size * 0.08);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.min(1, Math.max(0, value / max));
  const tone = color ?? (onDark ? "white" : scoreTone(value));
  return (
    <div className="ring" style={{ width: size, height: size, fontSize: size / 4.6 }} role="img" aria-label={`${label ?? "Skor"}: ${value === null ? "N/A" : `${value} / ${max}`}`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={onDark ? "rgba(255,255,255,0.18)" : "var(--surface-3)"} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={COLORS[tone]} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s var(--ease)" }} />
      </svg>
      <div className="ring__value">
        <div>
          <strong className="num">{value === null ? "N/A" : Math.round(value)}</strong>
          {label ? <small style={onDark ? { color: "rgba(255,255,255,0.7)" } : undefined}>{label}</small> : null}
        </div>
      </div>
    </div>
  );
}

export function ScoreBar({ label, value, sub, max = 100, tone, unit = "", hideValue = false }: { label: string; value: number | null; sub?: string; max?: number; tone?: string; unit?: string; hideValue?: boolean }) {
  const t = tone ?? scoreTone(value);
  return (
    <div className="bar">
      {label || !hideValue ? (
        <div className="bar__top">
          <span>
            {label}
            {sub ? <span className="muted"> · {sub}</span> : null}
          </span>
          {!hideValue ? <strong className="num">{value === null ? "N/A" : `${Math.round(value)}${unit}`}</strong> : null}
        </div>
      ) : null}
      <div className="bar__track">
        <div className={`bar__fill bar__fill--${t}`} style={{ width: `${value === null ? 0 : Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}
