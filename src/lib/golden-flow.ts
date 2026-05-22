import { randomUUID } from "node:crypto";
import { getDb } from "./db";

/**
 * Brief §4 Phase 2.1 — the one-button incident at the heart of the demo.
 *
 * Re-arms the EC excursion on site-demo: ensures there's an OPEN P2 alert
 * and a PENDING high-confidence AI recommendation tied to it. Idempotent —
 * safe to click again during a live demo to reset the state.
 */
export function triggerGoldenFlow(): { ok: boolean; alertId?: string } {
  const db = getDb();
  const SITE = "site-demo";
  const sensor = db.prepare(
    "SELECT * FROM sensors WHERE site_id = ? AND sensor_type = 'ec'"
  ).get(SITE) as { id: string; unit: string; min_safe_value: number; max_safe_value: number; source_type: string } | undefined;
  if (!sensor) return { ok: false };

  const isoNow = new Date().toISOString().slice(0, 19).replace("T", " ");
  const minusMin = (m: number) =>
    new Date(Date.now() - m * 60_000).toISOString().slice(0, 19).replace("T", " ");

  const tx = db.transaction(() => {
    // 1. Append the fresh EC ramp (visible on sensor trend immediately)
    const ramp = [2.05, 2.12, 2.28, 2.41, 2.55, 2.68, 2.78, 2.86];
    for (let i = 0; i < ramp.length; i++) {
      const v = ramp[i];
      const status = v > sensor.max_safe_value + 0.1 ? "critical" : v > sensor.max_safe_value ? "warning" : "ok";
      db.prepare(`
        INSERT INTO readings (site_id, sensor_id, value, unit, status, source_type, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(SITE, sensor.id, v, sensor.unit, status, sensor.source_type, minusMin((ramp.length - i) * 2));
    }

    // 2. Ensure an open P2 alert
    let alertId: string | undefined = (db.prepare(
      "SELECT id FROM alerts WHERE site_id = ? AND sensor_id = ? AND status IN ('open','acknowledged') AND severity = 'p2'"
    ).get(SITE, sensor.id) as { id: string } | undefined)?.id;

    if (!alertId) {
      alertId = randomUUID();
      db.prepare(`
        INSERT INTO alerts
        (id, site_id, sensor_id, severity, title, description, trigger_value,
         recommended_action, assigned_to, status, created_at)
        VALUES (?, ?, ?, 'p2', ?, ?, ?, ?, NULL, 'open', ?)
      `).run(
        alertId, SITE, sensor.id,
        "ارتفاع EC خارج النطاق الآمن",
        "ارتفعت قراءة EC إلى 2.86 mS/cm متجاوزةً الحد الأعلى 2.4. النمط يشير إلى إفراط محتمل في الجرعات أو فقد ماء.",
        2.86,
        "إيقاف الجرعات مؤقتاً + تأكيد قيم الخزان قبل الاستئناف.",
        isoNow,
      );
    }

    // 3. Ensure a pending high-confidence AI recommendation for that alert
    const existingAi = db.prepare(
      "SELECT id, approval_status FROM ai_recommendations WHERE related_alert_id = ? ORDER BY created_at DESC LIMIT 1"
    ).get(alertId) as { id: string; approval_status: string } | undefined;

    if (!existingAi) {
      db.prepare(`
        INSERT INTO ai_recommendations
        (id, site_id, related_alert_id, recommendation_type, recommendation,
         evidence_summary, confidence_label, requires_human_approval, approval_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'high', 1, 'pending', ?)
      `).run(
        randomUUID(), SITE, alertId, "pause_dosing",
        "إيقاف وحدة الجرعات A/B مؤقتاً (15 دقيقة) ثم إعادة التقييم بعد دورة ري قصيرة.",
        "EC يرتفع بمعدل +0.10 كل 15 دقيقة منذ آخر 8 قراءات · pH مستقر عند 6.1 · مستوى الخزان انخفض 8% خلال نفس النافذة · لا توجد دورة جرعات مسجّلة في آخر ساعتين. النمط متّسق مع تركّز الأملاح بسبب فقد ماء، لا إفراط جرعات.",
        isoNow,
      );
    } else if (existingAi.approval_status !== "pending") {
      // Re-arm: reset to pending so demo can be replayed end-to-end
      db.prepare("UPDATE ai_recommendations SET approval_status = 'pending', approved_by = NULL WHERE id = ?")
        .run(existingAi.id);
    }

    return alertId;
  });

  const alertId = tx();
  return { ok: true, alertId };
}
