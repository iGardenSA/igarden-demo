/* eslint-disable no-console */
// =========================================================================
// Seed script — 30-day deterministic demo data per brief §3.
// Three sites: عسفان R&D (mixed sources) · موقع صناعي (simulated) · Demo Site.
// One pre-baked EC excursion event that drives the Golden Flow.
// Run: `npm run seed`
// =========================================================================

import { randomUUID } from "node:crypto";
import { resetDb } from "../src/lib/db";
import { DISCLAIMERS } from "../src/lib/disclaimers";

// ------------------------------------------------------------------ RNG ----
function mulberry32(seed: number) {
  let t = seed;
  return function () {
    t = (t + 0x6D2B79F5) | 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260522);
const noise = (amplitude: number) => (rand() - 0.5) * 2 * amplitude;

// ------------------------------------------------------------------ time ---
const NOW = new Date(Date.UTC(2026, 4, 22, 6, 0, 0)); // 2026-05-22 06:00 UTC
const isoUtc = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);

// ------------------------------------------------------------------ data ---
interface SensorSpec {
  id: string;
  type: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  centre: number;     // target operating value
  noise: number;      // baseline noise amplitude
  source: "live" | "simulated";
}

const COMMON_SENSORS: Omit<SensorSpec, "id" | "source">[] = [
  { type: "ph",          name: "الأس الهيدروجيني (pH)",   unit: "pH",   min: 5.8,  max: 6.5,  centre: 6.1,  noise: 0.05 },
  { type: "ec",          name: "التوصيلية الكهربائية (EC)", unit: "mS/cm", min: 1.6,  max: 2.4,  centre: 2.0,  noise: 0.05 },
  { type: "water_temp",  name: "حرارة الماء",              unit: "°C",   min: 18,   max: 24,   centre: 21,   noise: 0.3 },
  { type: "tank_level",  name: "مستوى الخزان",             unit: "%",    min: 30,   max: 95,   centre: 75,   noise: 1.5 },
  { type: "air_temp",    name: "حرارة الهواء",             unit: "°C",   min: 20,   max: 30,   centre: 25,   noise: 0.4 },
  { type: "humidity",    name: "الرطوبة النسبية",          unit: "%",    min: 50,   max: 75,   centre: 62,   noise: 1.2 },
  { type: "light",       name: "شدة الإضاءة (PAR)",        unit: "µmol", min: 0,    max: 900,  centre: 450,  noise: 80 },
];

const SITES = [
  {
    id: "site-asfan-rnd",
    name: "محطة عسفان · R&D",
    location: "عسفان · مكة المكرمة",
    site_type: "rnd",
    is_demo_site: 0,
    status: "online",
    liveMix: true,     // mix live/simulated
  },
  {
    id: "site-industrial-south",
    name: "موقع صناعي · المنطقة الجنوبية",
    location: "المنطقة الجنوبية",
    site_type: "industrial",
    is_demo_site: 0,
    status: "online",
    liveMix: false,    // simulated only
  },
  {
    id: "site-demo",
    name: "Demo Site · TAQADAM",
    location: "KAUST",
    site_type: "demo",
    is_demo_site: 1,
    status: "online",
    liveMix: false,    // simulated only
  },
] as const;

// ------------------------------------------------------------------ main ---
const db = resetDb();

console.log("[seed] schema initialised");

const tx = db.transaction(() => {
  // ---- sites ------------------------------------------------------------
  const insertSite = db.prepare(`
    INSERT INTO sites (id, name, location, site_type, status, is_demo_site, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of SITES) {
    insertSite.run(s.id, s.name, s.location, s.site_type, s.status, s.is_demo_site,
      isoUtc(daysAgo(30)), isoUtc(NOW));
  }

  // ---- devices + sensors per site --------------------------------------
  const insertDevice = db.prepare(`
    INSERT INTO devices
    (id, site_id, name, device_type, status, last_heartbeat_at, signal_strength, firmware_version, source_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSensor = db.prepare(`
    INSERT INTO sensors
    (id, site_id, device_id, name, sensor_type, unit, min_safe_value, max_safe_value, status, calibration_due_at, source_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sensorsBySite: Record<string, SensorSpec[]> = {};

  for (const s of SITES) {
    const gw = `dev-${s.id}-gw`;
    const ctrl = `dev-${s.id}-ctrl`;
    const pump = `dev-${s.id}-pump`;
    const dosing = `dev-${s.id}-dosing`;
    const fan = `dev-${s.id}-fan`;
    const valve = `dev-${s.id}-valve`;
    const ro = `dev-${s.id}-ro`;

    const deviceSource: "live" | "simulated" = s.liveMix ? "live" : "simulated";

    insertDevice.run(gw,    s.id, "بوابة IoT الرئيسية",  "gateway",    "online",  isoUtc(minutesAgo(1)),  92, "1.4.2", deviceSource);
    insertDevice.run(ctrl,  s.id, "وحدة التحكّم المركزية", "controller", "online",  isoUtc(minutesAgo(2)),  88, "1.4.2", deviceSource);
    insertDevice.run(pump,  s.id, "مضخة دوران #1",        "pump",       "online",  isoUtc(minutesAgo(1)),  90, "1.2.0", "simulated");
    insertDevice.run(dosing,s.id, "وحدة جرعات A/B",       "dosing",     "online",  isoUtc(minutesAgo(1)),  85, "1.3.1", "simulated");
    insertDevice.run(fan,   s.id, "مراوح الاستخلاص",       "fan",        "online",  isoUtc(minutesAgo(3)),  78, "1.1.0", "simulated");
    insertDevice.run(valve, s.id, "محبس الري الرئيسي",     "valve",      "online",  isoUtc(minutesAgo(2)),  82, "1.2.0", "simulated");
    insertDevice.run(ro,    s.id, "وحدة التناضح العكسي",   "ro_unit",    "online",  isoUtc(minutesAgo(2)),  80, "1.0.4", "simulated");

    const sList: SensorSpec[] = [];
    for (const cs of COMMON_SENSORS) {
      const id = `sen-${s.id}-${cs.type}`;
      // عسفان R&D gets ph + water_temp as "live"; rest simulated. Others fully simulated.
      const isLive = s.liveMix && (cs.type === "ph" || cs.type === "water_temp");
      const source: SensorSpec["source"] = isLive ? "live" : "simulated";
      insertSensor.run(id, s.id, ctrl, cs.name, cs.type, cs.unit, cs.min, cs.max, "ok",
        isoUtc(daysAgo(-45)), source);
      sList.push({ id, ...cs, source });
    }
    sensorsBySite[s.id] = sList;
  }

  // ---- readings: 30 days × 96 samples/day (every 15 min) ---------------
  const insertReading = db.prepare(`
    INSERT INTO readings (site_id, sensor_id, value, unit, status, source_type, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const SAMPLES_PER_DAY = 96;
  const STEP_MIN = 15;
  const TOTAL = 30 * SAMPLES_PER_DAY;

  for (const s of SITES) {
    const sensors = sensorsBySite[s.id];
    for (let i = 0; i < TOTAL; i++) {
      const ts = new Date(NOW.getTime() - (TOTAL - i) * STEP_MIN * 60_000);
      const hour = ts.getUTCHours();
      const dayPhase = Math.sin(((hour - 6) / 24) * 2 * Math.PI); // peaks at noon

      for (const sen of sensors) {
        let v = sen.centre + noise(sen.noise);
        // light follows daylight
        if (sen.type === "light") v = Math.max(0, sen.centre * Math.max(0, dayPhase) + noise(40));
        // air_temp slight diurnal swing
        if (sen.type === "air_temp") v += dayPhase * 2.5;
        // humidity inverse to temp
        if (sen.type === "humidity") v -= dayPhase * 4;
        // tank_level slowly draining + refill at midnight
        if (sen.type === "tank_level") {
          const t = (i % SAMPLES_PER_DAY) / SAMPLES_PER_DAY;
          v = 95 - t * 25 + noise(0.6);
        }

        // bounds
        v = Math.max(sen.min - sen.noise * 4, Math.min(sen.max + sen.noise * 4, v));

        let status: "ok" | "warning" | "critical" | "stale" = "ok";
        if (v < sen.min || v > sen.max) status = "warning";

        insertReading.run(s.id, sen.id, +v.toFixed(2), sen.unit, status, sen.source, isoUtc(ts));
      }
    }
  }

  // ---- THE EC INCIDENT (Golden Flow trigger) ---------------------------
  // On site-demo, the last 8 readings of EC spike from ~2.0 → 2.85 mS/cm.
  // This is the demo's centre of gravity.
  const ecSensor = sensorsBySite["site-demo"].find((x) => x.type === "ec")!;
  const ecValues = [2.05, 2.12, 2.28, 2.41, 2.55, 2.68, 2.78, 2.86];
  for (let i = 0; i < ecValues.length; i++) {
    const ts = minutesAgo((ecValues.length - i) * 15);
    const v = ecValues[i];
    const status = v > ecSensor.max + 0.1 ? "critical" : v > ecSensor.max ? "warning" : "ok";
    insertReading.run("site-demo", ecSensor.id, v, ecSensor.unit, status, ecSensor.source, isoUtc(ts));
  }

  // ---- alerts ----------------------------------------------------------
  const ecAlertId = randomUUID();
  db.prepare(`
    INSERT INTO alerts
    (id, site_id, sensor_id, severity, title, description, trigger_value,
     recommended_action, assigned_to, status, created_at)
    VALUES (?, ?, ?, 'p2', ?, ?, ?, ?, NULL, 'open', ?)
  `).run(
    ecAlertId,
    "site-demo",
    ecSensor.id,
    "ارتفاع EC خارج النطاق الآمن",
    "ارتفعت قراءة EC إلى 2.86 mS/cm متجاوزةً الحد الأعلى 2.4. النمط يشير إلى إفراط محتمل في الجرعات أو فقد ماء.",
    2.86,
    "إيقاف الجرعات مؤقتاً + تأكيد قيم الخزان قبل الاستئناف.",
    isoUtc(minutesAgo(5)),
  );

  // a second, lower-severity alert to populate the panel
  db.prepare(`
    INSERT INTO alerts
    (id, site_id, sensor_id, severity, title, description, trigger_value,
     recommended_action, assigned_to, status, created_at)
    VALUES (?, ?, ?, 'p3', ?, ?, ?, ?, NULL, 'open', ?)
  `).run(
    randomUUID(),
    "site-asfan-rnd",
    sensorsBySite["site-asfan-rnd"].find((x) => x.type === "humidity")!.id,
    "رطوبة منخفضة (تنبيه إعلامي)",
    "انخفضت الرطوبة دون 55% خلال نافذة قصيرة. مراقبة فقط — لا يستلزم تدخّلاً.",
    52.4,
    "مراقبة لمدة ساعتين. إن استمرّ، فعّل دورة ترطيب مساعدة.",
    isoUtc(minutesAgo(40)),
  );

  // a resolved p1 in the past — populates the audit log timeline
  const oldP1 = randomUUID();
  db.prepare(`
    INSERT INTO alerts
    (id, site_id, sensor_id, severity, title, description, trigger_value,
     recommended_action, assigned_to, status, created_at, acknowledged_at, resolved_at)
    VALUES (?, ?, ?, 'p1', ?, ?, ?, ?, 'op-fahad', 'resolved', ?, ?, ?)
  `).run(
    oldP1,
    "site-industrial-south",
    sensorsBySite["site-industrial-south"].find((x) => x.type === "water_temp")!.id,
    "ارتفاع حرارة الماء فوق العتبة الحرجة",
    "تجاوزت حرارة الماء 26°C — تمّ تفعيل التبريد ومعاينة المضخة.",
    26.4,
    "تشغيل التبريد + فحص دوران المياه.",
    isoUtc(daysAgo(3)),
    isoUtc(daysAgo(3)),
    isoUtc(daysAgo(3)),
  );

  // ---- AI recommendation tied to the EC alert (Golden Flow) -----------
  const aiId = randomUUID();
  db.prepare(`
    INSERT INTO ai_recommendations
    (id, site_id, related_alert_id, recommendation_type, recommendation,
     evidence_summary, confidence_label, requires_human_approval, approval_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'pending', ?)
  `).run(
    aiId,
    "site-demo",
    ecAlertId,
    "pause_dosing",
    "إيقاف وحدة الجرعات A/B مؤقتاً (15 دقيقة) ثم إعادة التقييم بعد دورة ري قصيرة.",
    "EC يرتفع بمعدل +0.10 كل 15 دقيقة منذ آخر 8 قراءات · pH مستقر عند 6.1 · مستوى الخزان انخفض 8% خلال نفس النافذة · لا توجد دورة جرعات مسجّلة في آخر ساعتين. النمط متّسق مع تركّز الأملاح بسبب فقد ماء، لا إفراط جرعات.",
    "high",
    isoUtc(minutesAgo(3)),
  );

  // ---- baseline maintenance log ---------------------------------------
  db.prepare(`
    INSERT INTO maintenance_logs
    (site_id, device_id, related_alert_id, action_type, notes, performed_by, performed_at)
    VALUES (?, ?, ?, 'inspection', ?, ?, ?)
  `).run(
    "site-industrial-south",
    `dev-site-industrial-south-pump`,
    oldP1,
    "فحص دورة المياه + استبدال مرشّح. الحرارة طبيعية.",
    "op-fahad",
    isoUtc(daysAgo(3)),
  );

  // ---- 30 days of cooling/RO logs (1/day) -----------------------------
  const insertCooling = db.prepare(`
    INSERT INTO cooling_water_logs
    (site_id, device_id, cooling_water_liters, irrigation_water_liters,
     vertical_temp_gradient, fan_extraction_rate, ambient_temp, optimization_active, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRO = db.prepare(`
    INSERT INTO ro_telemetry
    (site_id, device_id, inlet_pressure, outlet_pressure, differential_pressure,
     ec_pre_filtration, ec_post_filtration, tds, salt_rejection_pct, membrane_health_status, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of SITES) {
    for (let d = 30; d >= 0; d--) {
      const ts = isoUtc(daysAgo(d));
      const optActive = d < 14 ? 1 : 0;   // turned optimization ON 14 days ago
      const irrigation = 1850 + noise(40);
      // cooling drops once optimization is active
      const cooling = (optActive ? 690 : 950) + noise(35);
      insertCooling.run(
        s.id, `dev-${s.id}-fan`,
        +cooling.toFixed(0), +irrigation.toFixed(0),
        +(1.8 + noise(0.2)).toFixed(2),
        +(72 + noise(5)).toFixed(0),
        +(28 + noise(2)).toFixed(1),
        optActive,
        ts,
      );

      const inlet = +(4.2 + noise(0.1)).toFixed(2);
      const outlet = +(2.9 + noise(0.1)).toFixed(2);
      insertRO.run(
        s.id, `dev-${s.id}-ro`,
        inlet, outlet, +(inlet - outlet).toFixed(2),
        +(2100 + noise(60)).toFixed(0),
        +(85 + noise(8)).toFixed(0),
        +(180 + noise(15)).toFixed(0),
        +(96.5 + noise(0.4)).toFixed(1),
        d > 20 ? "fair" : "good",
        ts,
      );
    }
  }

  // ---- baseline report (weekly) ---------------------------------------
  db.prepare(`
    INSERT INTO reports
    (id, site_id, report_type, period_start, period_end, summary, generated_by, generated_at, disclaimer)
    VALUES (?, ?, 'weekly', ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    "site-asfan-rnd",
    isoUtc(daysAgo(7)),
    isoUtc(NOW),
    "أسبوع مستقر — لا تنبيهات حرجة · تحسّن مؤشر استهلاك مياه التبريد بعد تفعيل التحسين.",
    "system",
    isoUtc(NOW),
    DISCLAIMERS.reportFooter,
  );
});

tx();

console.log("[seed] sites:", SITES.length);
console.log("[seed] EC incident pre-baked on site-demo (alert P2 + AI recommendation ready).");
console.log("[seed] done.");
