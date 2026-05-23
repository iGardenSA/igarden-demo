/**
 * ISA-101 high-performance analog indicator (semicircle gauge).
 * Greyscale by default; turns colour ONLY when the needle leaves the safe band.
 * Used for KPI headers (§2 — معايير التصميم الإلزامية).
 */
export function AnalogIndicator({
  value, min, max, safeMin, safeMax, label, unit, size = 96,
}: {
  value: number | null | undefined;
  min: number; max: number;
  safeMin: number; safeMax: number;
  label: string; unit: string;
  size?: number;
}) {
  const range = max - min || 1;
  const v = value ?? NaN;
  const pct = Math.max(0, Math.min(1, (v - min) / range));
  const inSafe = !Number.isNaN(v) && v >= safeMin && v <= safeMax;
  const angle = -90 + pct * 180; // semicircle

  const cx = size / 2;
  const cy = size * 0.7;
  const r = size * 0.42;

  // Safe band arc
  const safeStart = ((safeMin - min) / range) * 180 - 90;
  const safeEnd = ((safeMax - min) / range) * 180 - 90;

  function polar(deg: number, radius = r) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  const a = polar(safeStart);
  const b = polar(safeEnd);
  const safePath = `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;

  const needle = polar(angle, r * 0.95);

  return (
    <div className="flex flex-col items-center gap-1" dir="ltr">
      <svg width={size} height={size * 0.85} role="img" aria-label={`${label} ${value ?? "—"} ${unit}`}>
        {/* full background arc */}
        <path
          d={`M ${polar(-90).x} ${polar(-90).y} A ${r} ${r} 0 0 1 ${polar(90).x} ${polar(90).y}`}
          fill="none" stroke="var(--color-iso-fill)" strokeWidth={10} strokeLinecap="round"
        />
        {/* safe-band arc */}
        <path d={safePath} fill="none" stroke="var(--color-iso-border-strong)" strokeWidth={10} strokeLinecap="round" />
        {/* needle */}
        <line
          x1={cx} y1={cy}
          x2={needle.x} y2={needle.y}
          stroke={inSafe ? "var(--color-iso-ink)" : "var(--color-status-high)"}
          strokeWidth={2.5} strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={3} fill="var(--color-iso-ink)" />
      </svg>
      <div className="text-center" dir="rtl">
        <div className="text-2xl font-bold tabular ltr-bdi" style={{ color: inSafe ? "var(--color-iso-ink)" : "var(--color-status-high)" }}>
          {value === undefined || value === null || Number.isNaN(v) ? "—" : value.toFixed(2)}
          <span className="text-xs font-medium text-[color:var(--color-iso-ink-soft)] ms-1">{unit}</span>
        </div>
        <div className="text-xs text-[color:var(--color-iso-ink-soft)]">{label}</div>
      </div>
    </div>
  );
}
