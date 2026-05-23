"use client";

import type { Reading } from "@/lib/smartos-types";
import { useMemo } from "react";

/**
 * Lightweight inline sparkline. ISA-101: no fill, no gradient, single neutral
 * stroke; color only when value crosses safe band.
 */
export function SensorTrend({
  readings,
  min, max,
  height = 36,
  width = 120,
}: {
  readings: Reading[];
  min: number; max: number;
  height?: number; width?: number;
}) {
  const { path, pts, low, high } = useMemo(() => {
    if (readings.length === 0) return { path: "", pts: [] as { x: number; y: number; v: number }[], low: 0, high: 0 };
    const vals = readings.map((r) => r.value);
    const lo = Math.min(min - (max - min) * 0.2, ...vals);
    const hi = Math.max(max + (max - min) * 0.2, ...vals);
    const range = hi - lo || 1;
    const n = readings.length;
    const points = readings.map((r, i) => ({
      x: (i / Math.max(1, n - 1)) * (width - 4) + 2,
      y: height - 2 - ((r.value - lo) / range) * (height - 4),
      v: r.value,
    }));
    const d = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join("");
    return { path: d, pts: points, low: lo, high: hi };
  }, [readings, min, max, height, width]);

  if (!readings.length) {
    return (
      <div
        className="text-xs text-[color:var(--color-iso-ink-muted)] flex items-center justify-center"
        style={{ width, height }}
      >
        لا بيانات
      </div>
    );
  }

  // Map safe band y-coordinates
  const range = high - low || 1;
  const yMax = height - 2 - ((max - low) / range) * (height - 4);
  const yMin = height - 2 - ((min - low) / range) * (height - 4);

  const last = readings[readings.length - 1];
  const lastIsOut = last.value < min || last.value > max;

  return (
    <svg width={width} height={height} role="img" aria-label="مخطّط القراءات" className="block">
      {/* Safe band */}
      <rect
        x={2}
        y={Math.min(yMin, yMax)}
        width={width - 4}
        height={Math.abs(yMax - yMin)}
        fill="var(--color-iso-fill)"
        opacity={0.5}
      />
      {/* Line */}
      <path d={path} fill="none" stroke="var(--color-iso-ink-soft)" strokeWidth={1.5} />
      {/* Last point (color only if out-of-band) */}
      {pts.length > 0 && (
        <circle
          cx={pts[pts.length - 1].x}
          cy={pts[pts.length - 1].y}
          r={2.5}
          fill={lastIsOut ? "var(--color-status-high)" : "var(--color-iso-ink)"}
        />
      )}
    </svg>
  );
}
