import type { Reading } from "@/lib/smartos-types";
import { cn } from "@/lib/cn";

/**
 * Minimal P&ID-style loop diagram (water tank → pump → dosing → grow rack → return).
 * ISA-101: line-art, greyscale, colour ONLY where a reading is out-of-band.
 * Brief §4 Phase 2.3.
 */
export function PnIDDiagram({
  ph, ec, waterTemp, tankLevel,
  inSafe,
}: {
  ph: Reading | undefined; ec: Reading | undefined;
  waterTemp: Reading | undefined; tankLevel: Reading | undefined;
  inSafe: (r: Reading | undefined) => boolean;
}) {
  return (
    <svg viewBox="0 0 720 240" className="w-full max-w-3xl block" role="img" aria-label="مخطط P&ID لحلقة الزراعة المائية">
      {/* Tank */}
      <g>
        <rect x="20" y="80" width="100" height="120" fill="none" stroke="var(--color-iso-ink-soft)" strokeWidth={2} />
        <text x="70" y="60" textAnchor="middle" fontSize="12" fill="var(--color-iso-ink-soft)" fontFamily="var(--font-arabic)">خزان</text>
        <Pill x={20} y={80} w={100} h={120} pct={(tankLevel?.value ?? 0)} ok={inSafe(tankLevel)} />
        <ReadingTag x={70} y={220} label="مستوى" value={tankLevel?.value} unit="%" ok={inSafe(tankLevel)} />
      </g>

      {/* Pipe to pump */}
      <Pipe x1={120} y1={140} x2={200} y2={140} />

      {/* Pump */}
      <g transform="translate(200,110)">
        <circle cx="30" cy="30" r="28" fill="none" stroke="var(--color-iso-ink-soft)" strokeWidth={2} />
        <text x="30" y="35" textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill="var(--color-iso-ink)">P</text>
        <text x="30" y="86" textAnchor="middle" fontSize="12" fill="var(--color-iso-ink-soft)" fontFamily="var(--font-arabic)">مضخة</text>
      </g>

      <Pipe x1={258} y1={140} x2={340} y2={140} />

      {/* Dosing */}
      <g transform="translate(340,108)">
        <rect x="0" y="0" width="60" height="64" fill="none" stroke="var(--color-iso-ink-soft)" strokeWidth={2} />
        <text x="30" y="38" textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill="var(--color-iso-ink)">A/B</text>
        <text x="30" y="86" textAnchor="middle" fontSize="12" fill="var(--color-iso-ink-soft)" fontFamily="var(--font-arabic)">جرعات</text>
      </g>

      <Pipe x1={400} y1={140} x2={520} y2={140} />

      {/* Grow rack */}
      <g>
        <rect x="520" y="60" width="170" height="160" fill="none" stroke="var(--color-iso-ink-soft)" strokeWidth={2} />
        <line x1="520" y1="100" x2="690" y2="100" stroke="var(--color-iso-border-strong)" />
        <line x1="520" y1="140" x2="690" y2="140" stroke="var(--color-iso-border-strong)" />
        <line x1="520" y1="180" x2="690" y2="180" stroke="var(--color-iso-border-strong)" />
        <text x="605" y="40" textAnchor="middle" fontSize="12" fill="var(--color-iso-ink-soft)" fontFamily="var(--font-arabic)">رفّ زراعة</text>
      </g>

      {/* Inline reading badges */}
      <ReadingTag x={170} y={108} label="pH" value={ph?.value} unit="" ok={inSafe(ph)} />
      <ReadingTag x={310} y={108} label="EC" value={ec?.value} unit="mS" ok={inSafe(ec)} />
      <ReadingTag x={470} y={108} label="T°" value={waterTemp?.value} unit="°C" ok={inSafe(waterTemp)} />
    </svg>
  );
}

function Pipe({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-iso-ink-soft)" strokeWidth={3} />;
}

function Pill({ x, y, w, h, pct, ok }: { x: number; y: number; w: number; h: number; pct: number; ok: boolean }) {
  const fillH = Math.max(0, Math.min(1, pct / 100)) * (h - 4);
  return (
    <rect
      x={x + 2} y={y + h - 2 - fillH} width={w - 4} height={fillH}
      fill={ok ? "var(--color-iso-fill)" : "var(--color-status-high)"}
      opacity={0.7}
    />
  );
}

function ReadingTag({ x, y, label, value, unit, ok }: {
  x: number; y: number; label: string; value: number | undefined; unit: string; ok: boolean;
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-30" y="-12" rx="3" ry="3" width="60" height="22"
        fill="white"
        stroke={ok ? "var(--color-iso-border)" : "var(--color-status-high)"}
        strokeWidth={ok ? 1 : 1.5}
      />
      <text x="0" y="3" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)"
        fill={ok ? "var(--color-iso-ink)" : "var(--color-status-high)"}>
        {label} {value !== undefined ? value.toFixed(2) : "—"} {unit}
      </text>
    </g>
  );
}
