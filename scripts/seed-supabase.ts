/* eslint-disable no-console */
/**
 * Seed script — 30-day deterministic demo data against Supabase.
 * Three sites: عسفان R&D · موقع صناعي · Demo Site. Pre-baked EC excursion
 * on Demo Site that drives the Golden Flow.
 *
 * Run: `npm run seed`  (requires .env.local with SUPABASE_SERVICE_ROLE_KEY)
 *
 * Every row goes in with source_type='simulated' so future live MQTT writes
 * can drop in alongside without schema change — RLS keeps writes service-role.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

// Lightweight .env.local loader so the script can run via `npm run seed`
// without dotenv as a dep.
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* no .env.local — env may already be set */ }

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

// ----- deterministic RNG -----------------------------------------------------
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6D2B79F5) | 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260522);
const noise = (a: number) => (rand() - 0.5) * 2 * a;

const NOW = new Date(Date.UTC(2026, 4, 22, 6, 0, 0));
const iso = (d: Date) => d.toISOString();
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);

interface SensorSpec {
  id: string; type: string; name: string; unit: string;
  min: number; max: number; centre: number; noise: number;
  source: "live" | "simulated";
}
const COMMON: Omit<SensorSpec, "id" | "source">[] = [
  { type: "ph",         name: "الأس الهيدروجيني (pH)",   unit: "pH",    min: 5.8, max: 6.5, centre: 6.1,  noise: 0.05 },
  { type: "ec",         name: "التوصيلية الكهربائية (EC)", unit: "mS/cm", min: 1.6, max: 2.4, centre: 2.0,  noise: 0.05 },
  { type: "water_temp", name: "حرارة الماء",              unit: "°C",    min: 18,  max: 24,  centre: 21,   noise: 0.3 },
  { type: "tank_level", name: "مستوى الخزان",             unit: "%",     min: 30,  max: 95,  centre: 75,   noise: 1.5 },
  { type: "air_temp",   name: "حرارة الهواء",             unit: "°C",    min: 20,  max: 30,  centre: 25,   noise: 0.4 },
  { type: "humidity",   name: "الرطوبة النسبية",          unit: "%",     min: 50,  max: 75,  centre: 62,   noise: 1.2 },
  { type: "light",      name: "شدة الإضاءة (PAR)",        unit: "µmol",  min: 0,   max: 900, centre: 450,  noise: 80 },
];

// liveMix is always false: §7 forbids labelling simulated data 'live'. The
// 'live' enum value is reserved for the future MQTT bridge (post-G2) — any
// 'live'-badged row in production = real sensor, not seed.
const SITES = [
  { id: "site-asfan-rnd",        name: "محطة عسفان · R&D",          location: "عسفان · مكة المكرمة",  site_type: "rnd",         is_demo_site: false, status: "online", liveMix: false },
  { id: "site-industrial-south", name: "موقع صناعي · المنطقة الجنوبية", location: "المنطقة الجنوبية",      site_type: "industrial",  is_demo_site: false, status: "online", liveMix: false },
  { id: "site-demo",             name: "Demo Site · TAQADAM",        location: "KAUST",                site_type: "demo",        is_demo_site: true,  status: "online", liveMix: false },
] as const;

async function wipe() {
  // Delete in FK-safe order — child tables first.
  // Tables keyed by text PK use neq on string sentinel; tables keyed by
  // bigserial use gte 0 — both end up as "delete everything".
  const TEXT_PK = ["control_events", "commands", "ai_recommendations", "alerts", "reports", "sensors", "devices", "sites"];
  const BIGSERIAL_PK = ["readings", "maintenance_logs", "cooling_water_logs", "ro_telemetry"];
  for (const t of BIGSERIAL_PK) {
    const { error } = await sb.from(t).delete().gte("id", 0);
    if (error) console.warn(`[wipe:${t}]`, error.message);
  }
  // alerts.id and others use text — use a NEVER-match string
  for (const t of TEXT_PK) {
    const { error } = await sb.from(t).delete().neq("id", "__sentinel_never_matches__");
    if (error) console.warn(`[wipe:${t}]`, error.message);
  }
}

async function bulkInsert<T>(table: string, rows: T[], chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const { error } = await sb.from(table).insert(slice as never);
    if (error) {
      console.error(`[insert:${table}@${i}]`, error.message);
      throw error;
    }
  }
}

async function main() {
  console.log("[seed] wiping existing rows…");
  await wipe();

  // sites
  await bulkInsert("sites", SITES.map((s) => ({
    id: s.id, name: s.name, location: s.location, site_type: s.site_type,
    status: s.status, is_demo_site: s.is_demo_site,
    created_at: iso(daysAgo(30)), updated_at: iso(NOW),
  })));
  console.log("[seed] sites:", SITES.length);

  // devices + sensors
  const allDevices: object[] = [];
  const allSensors: object[] = [];
  const sensorsBySite: Record<string, SensorSpec[]> = {};

  for (const s of SITES) {
    const gw = `dev-${s.id}-gw`;
    const ctrl = `dev-${s.id}-ctrl`;
    const pump = `dev-${s.id}-pump`;
    const dosing = `dev-${s.id}-dosing`;
    const fan = `dev-${s.id}-fan`;
    const valve = `dev-${s.id}-valve`;
    const ro = `dev-${s.id}-ro`;
    const ds: "live" | "simulated" = s.liveMix ? "live" : "simulated";

    allDevices.push(
      { id: gw,    site_id: s.id, name: "بوابة IoT الرئيسية",  device_type: "gateway",    status: "online", last_heartbeat_at: iso(minutesAgo(1)), signal_strength: 92, firmware_version: "1.4.2", source_type: ds },
      { id: ctrl,  site_id: s.id, name: "وحدة التحكّم المركزية", device_type: "controller", status: "online", last_heartbeat_at: iso(minutesAgo(2)), signal_strength: 88, firmware_version: "1.4.2", source_type: ds },
      { id: pump,  site_id: s.id, name: "مضخة دوران #1",        device_type: "pump",       status: "online", last_heartbeat_at: iso(minutesAgo(1)), signal_strength: 90, firmware_version: "1.2.0", source_type: "simulated" },
      { id: dosing,site_id: s.id, name: "وحدة جرعات A/B",       device_type: "dosing",     status: "online", last_heartbeat_at: iso(minutesAgo(1)), signal_strength: 85, firmware_version: "1.3.1", source_type: "simulated" },
      { id: fan,   site_id: s.id, name: "مراوح الاستخلاص",       device_type: "fan",        status: "online", last_heartbeat_at: iso(minutesAgo(3)), signal_strength: 78, firmware_version: "1.1.0", source_type: "simulated" },
      { id: valve, site_id: s.id, name: "محبس الري الرئيسي",     device_type: "valve",      status: "online", last_heartbeat_at: iso(minutesAgo(2)), signal_strength: 82, firmware_version: "1.2.0", source_type: "simulated" },
      { id: ro,    site_id: s.id, name: "وحدة التناضح العكسي",   device_type: "ro_unit",    status: "online", last_heartbeat_at: iso(minutesAgo(2)), signal_strength: 80, firmware_version: "1.0.4", source_type: "simulated" },
    );

    const sList: SensorSpec[] = [];
    for (const cs of COMMON) {
      const id = `sen-${s.id}-${cs.type}`;
      const isLive = s.liveMix && (cs.type === "ph" || cs.type === "water_temp");
      const source: SensorSpec["source"] = isLive ? "live" : "simulated";
      allSensors.push({
        id, site_id: s.id, device_id: ctrl, name: cs.name, sensor_type: cs.type,
        unit: cs.unit, min_safe_value: cs.min, max_safe_value: cs.max,
        status: "ok", calibration_due_at: iso(daysAgo(-45)), source_type: source,
      });
      sList.push({ id, ...cs, source });
    }
    sensorsBySite[s.id] = sList;
  }
  await bulkInsert("devices", allDevices);
  console.log("[seed] devices:", allDevices.length);
  await bulkInsert("sensors", allSensors);
  console.log("[seed] sensors:", allSensors.length);

  // readings — 30d × 96/day per sensor
  const STEP = 15 * 60_000;
  const TOTAL = 30 * 96;
  const readings: object[] = [];
  for (const s of SITES) {
    const sens = sensorsBySite[s.id];
    for (let i = 0; i < TOTAL; i++) {
      const ts = new Date(NOW.getTime() - (TOTAL - i) * STEP);
      const hour = ts.getUTCHours();
      const dayPhase = Math.sin(((hour - 6) / 24) * 2 * Math.PI);
      for (const sen of sens) {
        let v = sen.centre + noise(sen.noise);
        if (sen.type === "light")     v = Math.max(0, sen.centre * Math.max(0, dayPhase) + noise(40));
        if (sen.type === "air_temp")  v += dayPhase * 2.5;
        if (sen.type === "humidity")  v -= dayPhase * 4;
        if (sen.type === "tank_level"){
          const t = (i % 96) / 96;
          v = 95 - t * 25 + noise(0.6);
        }
        v = Math.max(sen.min - sen.noise * 4, Math.min(sen.max + sen.noise * 4, v));
        const status = v < sen.min || v > sen.max ? "warning" : "ok";
        readings.push({
          site_id: s.id, sensor_id: sen.id, value: +v.toFixed(2),
          unit: sen.unit, status, source_type: sen.source, recorded_at: iso(ts),
        });
      }
    }
  }
  console.log("[seed] readings prepared:", readings.length, "— bulk inserting…");
  await bulkInsert("readings", readings, 1000);
  console.log("[seed] readings inserted.");

  // EC incident ramp on site-demo
  const ecSensor = sensorsBySite["site-demo"].find((x) => x.type === "ec")!;
  const ecVals = [2.05, 2.12, 2.28, 2.41, 2.55, 2.68, 2.78, 2.86];
  await bulkInsert("readings", ecVals.map((v, i) => ({
    site_id: "site-demo", sensor_id: ecSensor.id, value: v, unit: ecSensor.unit,
    status: v > ecSensor.max + 0.1 ? "critical" : v > ecSensor.max ? "warning" : "ok",
    source_type: ecSensor.source, recorded_at: iso(minutesAgo((ecVals.length - i) * 15)),
  })));
  console.log("[seed] EC incident ramp inserted on site-demo.");

  // alerts
  const ecAlertId = randomUUID();
  const oldP1 = randomUUID();
  await bulkInsert("alerts", [
    {
      id: ecAlertId, site_id: "site-demo", sensor_id: ecSensor.id, severity: "p2",
      title: "ارتفاع EC خارج النطاق الآمن",
      description: "ارتفعت قراءة EC إلى 2.86 mS/cm متجاوزةً الحد الأعلى 2.4. النمط يشير إلى إفراط محتمل في الجرعات أو فقد ماء.",
      trigger_value: 2.86,
      recommended_action: "إيقاف الجرعات مؤقتاً + تأكيد قيم الخزان قبل الاستئناف.",
      assigned_to: null, status: "open", created_at: iso(minutesAgo(5)),
    },
    {
      id: randomUUID(), site_id: "site-asfan-rnd",
      sensor_id: sensorsBySite["site-asfan-rnd"].find((x) => x.type === "humidity")!.id,
      severity: "p3", title: "رطوبة منخفضة (تنبيه إعلامي)",
      description: "انخفضت الرطوبة دون 55% خلال نافذة قصيرة. مراقبة فقط — لا يستلزم تدخّلاً.",
      trigger_value: 52.4,
      recommended_action: "مراقبة لمدة ساعتين. إن استمرّ، فعّل دورة ترطيب مساعدة.",
      assigned_to: null, status: "open", created_at: iso(minutesAgo(40)),
    },
    {
      id: oldP1, site_id: "site-industrial-south",
      sensor_id: sensorsBySite["site-industrial-south"].find((x) => x.type === "water_temp")!.id,
      severity: "p1", title: "ارتفاع حرارة الماء فوق العتبة الحرجة",
      description: "تجاوزت حرارة الماء 26°C — تمّ تفعيل التبريد ومعاينة المضخة.",
      trigger_value: 26.4,
      recommended_action: "تشغيل التبريد + فحص دوران المياه.",
      assigned_to: "op-fahad", status: "resolved",
      created_at: iso(daysAgo(3)), acknowledged_at: iso(daysAgo(3)), resolved_at: iso(daysAgo(3)),
    },
  ]);
  console.log("[seed] alerts: 3");

  // AI recommendation linked to EC alert
  await bulkInsert("ai_recommendations", [{
    id: randomUUID(), site_id: "site-demo", related_alert_id: ecAlertId,
    recommendation_type: "pause_dosing",
    recommendation: "إيقاف وحدة الجرعات A/B مؤقتاً (15 دقيقة) ثم إعادة التقييم بعد دورة ري قصيرة.",
    evidence_summary: "EC يرتفع بمعدل +0.10 كل 15 دقيقة منذ آخر 8 قراءات · pH مستقر عند 6.1 · مستوى الخزان انخفض 8% خلال نفس النافذة · لا توجد دورة جرعات مسجّلة في آخر ساعتين. النمط متّسق مع تركّز الأملاح بسبب فقد ماء، لا إفراط جرعات.",
    confidence_label: "high", requires_human_approval: true,
    approval_status: "pending", created_at: iso(minutesAgo(3)),
  }]);
  console.log("[seed] ai_recommendation: 1");

  // maintenance log tied to resolved P1
  await bulkInsert("maintenance_logs", [{
    site_id: "site-industrial-south", device_id: "dev-site-industrial-south-pump",
    related_alert_id: oldP1, action_type: "inspection",
    notes: "فحص دورة المياه + استبدال مرشّح. الحرارة طبيعية.",
    performed_by: "op-fahad", performed_at: iso(daysAgo(3)),
  }]);

  // cooling + ro: 31 days each
  const cool: object[] = [];
  const ro: object[] = [];
  for (const s of SITES) {
    for (let d = 30; d >= 0; d--) {
      const ts = iso(daysAgo(d));
      const optActive = d < 14;
      const irrigation = 1850 + noise(40);
      const cooling = (optActive ? 690 : 950) + noise(35);
      cool.push({
        site_id: s.id, device_id: `dev-${s.id}-fan`,
        cooling_water_liters: +cooling.toFixed(0),
        irrigation_water_liters: +irrigation.toFixed(0),
        vertical_temp_gradient: +(1.8 + noise(0.2)).toFixed(2),
        fan_extraction_rate: +(72 + noise(5)).toFixed(0),
        ambient_temp: +(28 + noise(2)).toFixed(1),
        optimization_active: optActive, recorded_at: ts,
      });
      const inlet = +(4.2 + noise(0.1)).toFixed(2);
      const outlet = +(2.9 + noise(0.1)).toFixed(2);
      ro.push({
        site_id: s.id, device_id: `dev-${s.id}-ro`,
        inlet_pressure: inlet, outlet_pressure: outlet,
        differential_pressure: +(inlet - outlet).toFixed(2),
        ec_pre_filtration: +(2100 + noise(60)).toFixed(0),
        ec_post_filtration: +(85 + noise(8)).toFixed(0),
        tds: +(180 + noise(15)).toFixed(0),
        salt_rejection_pct: +(96.5 + noise(0.4)).toFixed(1),
        membrane_health_status: d > 20 ? "fair" : "good",
        recorded_at: ts,
      });
    }
  }
  await bulkInsert("cooling_water_logs", cool);
  await bulkInsert("ro_telemetry", ro);
  console.log("[seed] cooling + ro:", cool.length, ro.length);

  // baseline weekly report
  await bulkInsert("reports", [{
    id: randomUUID(), site_id: "site-asfan-rnd",
    report_type: "weekly",
    period_start: iso(daysAgo(7)), period_end: iso(NOW),
    summary: "أسبوع مستقر — لا تنبيهات حرجة · تحسّن مؤشر استهلاك مياه التبريد بعد تفعيل التحسين.",
    generated_by: "system", generated_at: iso(NOW),
    disclaimer: "iGarden Smart OS · Reporting layer · compliance-ready · IFA-aligned · not certified. Cooling/irrigation water values are operational counters — not validated against MEWA/Naama systems.",
  }]);
  console.log("[seed] reports: 1");
  console.log("[seed] DONE.");
}

main().catch((e) => { console.error("[seed] failed:", e); process.exit(1); });
