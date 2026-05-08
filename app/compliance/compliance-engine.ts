// ─── دوال pure للحساب — لا حالة React هنا ───

import { EC_OPERATIONAL_BANDS } from './standards';

export interface AuditEntry {
  id:         string;
  timestamp:  string;
  zone:       string;
  zoneId:     string;
  type:       "قراءة" | "تدخل تلقائي" | "تجاوز يدوي";
  value:      string;
  operator:   string;
  sha:        string;
  isOverride: boolean;
}

export type EcCategory = keyof typeof EC_OPERATIONAL_BANDS;

/** نسبة الامتثال لآخر 30 يوم — عتبة EC حسب فئة المحصول
 *  category افتراضياً 'general' (يقبل 0–3.5 mS/cm)
 *  مرّر 'leafy' / 'fruiting' / 'herbal' / 'fodder' لقياس أدق
 */
export function calcComplianceScore(
  histData: Array<{ ph: number; ec: number; tempIn: number }>,
  category: EcCategory = 'general'
): { score: number; deviations: number } {
  const last30 = histData.slice(-30);
  if (!last30.length) return { score: 0, deviations: 0 };
  const ecBand = EC_OPERATIONAL_BANDS[category];
  let pass = 0, deviations = 0;
  const total = last30.length * 3;
  last30.forEach((r) => {
    const phOk   = r.ph     >= 5.5         && r.ph     <= 7.5;
    const ecOk   = r.ec     >= ecBand.min  && r.ec     <= ecBand.max;
    const tmpOk  = r.tempIn >= 18          && r.tempIn <= 30;
    if (phOk)  pass++; else deviations++;
    if (ecOk)  pass++; else deviations++;
    if (tmpOk) pass++; else deviations++;
  });
  return { score: Math.round((pass / total) * 100), deviations };
}

/** mock SHA-256 — 8 chars + … + 4 chars — حتمي لنفس seed */
export function mockSHA(seed: string): string {
  const hex = "0123456789abcdef";
  let r = "";
  for (let i = 0; i < 12; i++) r += hex[(seed.charCodeAt(i % seed.length) * (i + 7)) % 16];
  return r.slice(0, 8) + "…" + r.slice(-4);
}

const OPS = ["System", "علي", "أيمن", "كمال"] as const;

/** يولّد سجلات Audit Trail من historicalData + أحداث mock */
export function generateAuditEntries(
  zones: Array<{ id: string; name: string; region: string }>,
  historicalData: Record<string, Array<{ dateFull: string; ph: number; ec: number; tempIn: number }>>
): AuditEntry[] {
  const entries: AuditEntry[] = [];

  // قراءات يومية — كل يومين per zone من آخر 50 يوم
  zones.forEach((zone) => {
    const data = (historicalData[zone.region] || []).slice(-50);
    data.forEach((reading, i) => {
      if (i % 2 !== 0) return;
      entries.push({
        id:        `${zone.id}-rd-${i}`,
        timestamp: reading.dateFull + "T08:00:00Z",
        zone:      zone.name,
        zoneId:    zone.id,
        type:      "قراءة",
        value:     `pH ${reading.ph} | EC ${reading.ec} mS/cm | ${reading.tempIn}°C`,
        operator:  OPS[0],
        sha:       mockSHA(zone.id + reading.dateFull),
        isOverride: false,
      });
    });
  });

  // تجاوزات يدوية
  const overrides = [
    { date: "2026-04-15", zi: 0, val: "EC → 2.4 mS/cm",             op: 1 },
    { date: "2026-04-22", zi: 1, val: "pH → 6.1 (تعديل يدوي)",      op: 2 },
    { date: "2026-04-28", zi: 0, val: "درجة الحرارة → 24°C",        op: 3 },
    { date: "2026-05-01", zi: 2, val: "EC → 1.8 mS/cm",             op: 1 },
    { date: "2026-05-03", zi: 1, val: "رطوبة → 68%",                op: 2 },
    { date: "2026-05-06", zi: 0, val: "pH → 6.0 (ضبط صباحي)",       op: 3 },
  ];
  overrides.forEach(({ date, zi, val, op }, i) => {
    const z = zones[zi % zones.length];
    if (!z) return;
    entries.push({
      id: `ovr-${i}`, timestamp: date + "T14:30:00Z",
      zone: z.name, zoneId: z.id, type: "تجاوز يدوي",
      value: val, operator: OPS[op],
      sha: mockSHA("ovr" + date + i), isOverride: true,
    });
  });

  // تدخلات تلقائية
  const autos = [
    { date: "2026-04-18", zi: 0, val: "تعديل pH → 6.2 (انحراف −0.4)" },
    { date: "2026-04-25", zi: 1, val: "تفعيل ضباب — رطوبة < 55%"     },
    { date: "2026-04-30", zi: 2, val: "إيقاف مروحة — حرارة < 20°C"   },
    { date: "2026-05-04", zi: 0, val: "ضخّ سماد — EC < 1.8 mS/cm"    },
    { date: "2026-05-06", zi: 1, val: "خفض EC — أُكتشف ارتفاع 0.3"   },
  ];
  autos.forEach(({ date, zi, val }, i) => {
    const z = zones[zi % zones.length];
    if (!z) return;
    entries.push({
      id: `auto-${i}`, timestamp: date + "T03:15:00Z",
      zone: z.name, zoneId: z.id, type: "تدخل تلقائي",
      value: val, operator: OPS[0],
      sha: mockSHA("auto" + date + i), isOverride: false,
    });
  });

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
