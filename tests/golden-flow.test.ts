import { describe, it, expect, beforeAll } from "vitest";
import { resetDb, getDb } from "../src/lib/db";
import { triggerGoldenFlow } from "../src/lib/golden-flow";
import { issueCommand, executeCommand, decideAIRecommendation, getAIRecommendationForAlert } from "../src/lib/queries";

beforeAll(() => {
  resetDb();
  const db = getDb();
  // Minimal demo-site fixture so triggerGoldenFlow can attach to a real EC sensor
  db.exec(`
    INSERT INTO sites (id, name, location, site_type, status, is_demo_site)
      VALUES ('site-demo','Demo','x','demo','online',1);
    INSERT INTO devices (id, site_id, name, device_type, status, source_type)
      VALUES ('d-ctrl','site-demo','ctrl','controller','online','simulated'),
             ('d-dose','site-demo','dosing','dosing','online','simulated');
    INSERT INTO sensors (id, site_id, device_id, name, sensor_type, unit, min_safe_value, max_safe_value, status, source_type)
      VALUES ('sen-ec','site-demo','d-ctrl','EC','ec','mS/cm', 1.6, 2.4, 'ok', 'simulated');
  `);
});

describe("Golden Flow — end-to-end happy path", () => {
  it("trigger creates an open P2 alert + a pending high-confidence AI recommendation", () => {
    const r = triggerGoldenFlow();
    expect(r.ok).toBe(true);
    expect(r.alertId).toBeTruthy();
    const db = getDb();
    const alert = db.prepare("SELECT * FROM alerts WHERE id = ?").get(r.alertId!) as any;
    expect(alert.severity).toBe("p2");
    expect(alert.status).toBe("open");
    expect(alert.recommended_action.length).toBeGreaterThan(0);
    const ai = getAIRecommendationForAlert(r.alertId!)!;
    expect(ai).toBeTruthy();
    expect(ai.confidence_label).toBe("high");
    expect(ai.approval_status).toBe("pending");
    expect(ai.requires_human_approval).toBe(1);
  });

  it("approving the AI recommendation and issuing a dosing pause produces a full audit chain", () => {
    const db = getDb();
    const ai = db.prepare("SELECT * FROM ai_recommendations ORDER BY created_at DESC LIMIT 1").get() as any;

    decideAIRecommendation(ai.id, "approved", "op-test");
    const after = db.prepare("SELECT * FROM ai_recommendations WHERE id = ?").get(ai.id) as any;
    expect(after.approval_status).toBe("approved");
    expect(after.approved_by).toBe("op-test");

    const { commandId } = issueCommand({
      siteId: "site-demo",
      deviceId: "d-dose",
      commandType: "pause",
      requestedState: "paused",
      reason: "Following AI recommendation: pause dosing to reassess EC after irrigation cycle",
      requestedBy: "op-test",
      confirmedBy: "supervisor-test",
      safetyLockEnabled: true,
    });
    executeCommand(commandId);

    const events = db.prepare(
      "SELECT event_type FROM control_events WHERE command_id = ? ORDER BY id"
    ).all(commandId) as { event_type: string }[];
    expect(events.map((e) => e.event_type)).toEqual(["issued", "executed"]);

    const cmd = db.prepare("SELECT * FROM commands WHERE id = ?").get(commandId) as any;
    expect(cmd.status).toBe("executed");
    expect(cmd.safety_lock_enabled).toBe(1);
  });

  it("re-triggering is idempotent — same active alert, AI returns to pending", () => {
    const r1 = triggerGoldenFlow();
    const r2 = triggerGoldenFlow();
    expect(r2.alertId).toBe(r1.alertId);
    const db = getDb();
    const ai = db.prepare(
      "SELECT * FROM ai_recommendations WHERE related_alert_id = ? ORDER BY created_at DESC LIMIT 1"
    ).get(r2.alertId!) as any;
    expect(ai.approval_status).toBe("pending");
  });
});
