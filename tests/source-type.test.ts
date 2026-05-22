import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { resetDb, getDb } from "../src/lib/db";

// Brief §7 red line: every reading MUST carry source_type.
// This test verifies the schema rejects readings without source_type.

beforeAll(() => {
  resetDb();
  // minimal fixture
  const db = getDb();
  db.exec(`
    INSERT INTO sites (id, name, location, site_type, status, is_demo_site)
      VALUES ('s1','t','tl','demo','online',1);
    INSERT INTO devices (id, site_id, name, device_type, status, source_type)
      VALUES ('d1','s1','dev','controller','online','simulated');
    INSERT INTO sensors (id, site_id, device_id, name, sensor_type, unit, min_safe_value, max_safe_value, status, source_type)
      VALUES ('sen1','s1','d1','x','ph','pH',5.8,6.5,'ok','simulated');
  `);
});

afterEach(() => { /* keep state for read tests */ });

describe("source_type enforcement", () => {
  it("rejects a reading with NULL source_type", () => {
    const db = getDb();
    expect(() => {
      db.prepare(`
        INSERT INTO readings (site_id, sensor_id, value, unit, status, source_type, recorded_at)
        VALUES ('s1','sen1', 6.1, 'pH', 'ok', NULL, '2026-05-22 06:00:00')
      `).run();
    }).toThrow(/NOT NULL/i);
  });

  it("rejects an invalid source_type value", () => {
    const db = getDb();
    expect(() => {
      db.prepare(`
        INSERT INTO readings (site_id, sensor_id, value, unit, status, source_type, recorded_at)
        VALUES ('s1','sen1', 6.1, 'pH', 'ok', 'invented', '2026-05-22 06:00:00')
      `).run();
    }).toThrow(/CHECK|constraint/i);
  });

  it("accepts the four allowed source_type values", () => {
    const db = getDb();
    for (const t of ["live", "simulated", "manual", "offline"]) {
      db.prepare(`
        INSERT INTO readings (site_id, sensor_id, value, unit, status, source_type, recorded_at)
        VALUES ('s1','sen1', 6.1, 'pH', 'ok', ?, '2026-05-22 06:00:00')
      `).run(t);
    }
    const rows = db.prepare("SELECT COUNT(*) c FROM readings").get() as { c: number };
    expect(rows.c).toBeGreaterThanOrEqual(4);
  });

  it("enforces requires_human_approval=1 on ai_recommendations", () => {
    const db = getDb();
    expect(() => {
      db.prepare(`
        INSERT INTO ai_recommendations
          (id, site_id, recommendation_type, recommendation, evidence_summary, confidence_label, requires_human_approval)
        VALUES ('a1','s1','x','r','e','high', 0)
      `).run();
    }).toThrow(/CHECK|constraint/i);
  });

  it("enforces reports.disclaimer NOT NULL", () => {
    const db = getDb();
    expect(() => {
      db.prepare(`
        INSERT INTO reports (id, site_id, report_type, period_start, period_end, summary, generated_by, disclaimer)
        VALUES ('r1','s1','daily','2026-05-15','2026-05-22','x','sys', NULL)
      `).run();
    }).toThrow(/NOT NULL/i);
  });
});
