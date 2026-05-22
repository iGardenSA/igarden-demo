import { describe, it, expect, beforeAll } from "vitest";
import { resetDb, getDb } from "../src/lib/db";
import { issueCommand, CommandSafetyError } from "../src/lib/queries";

// Brief §3 + §5: commands MUST have a reason, dual confirmation, and safety lock.

beforeAll(() => {
  resetDb();
  const db = getDb();
  db.exec(`
    INSERT INTO sites (id, name, location, site_type, status, is_demo_site)
      VALUES ('s1','t','tl','demo','online',1);
    INSERT INTO devices (id, site_id, name, device_type, status, source_type)
      VALUES ('d1','s1','dev','dosing','online','simulated');
  `);
});

const baseInput = {
  siteId: "s1",
  deviceId: "d1",
  commandType: "pause" as const,
  requestedState: "paused",
  reason: "EC out of band — pause to reassess",
  requestedBy: "op-test",
  confirmedBy: "supervisor-test",
  safetyLockEnabled: true,
};

describe("control safety enforcement", () => {
  it("rejects a command without a reason", () => {
    expect(() => issueCommand({ ...baseInput, reason: "   " })).toThrow(CommandSafetyError);
  });

  it("rejects a command without a confirmer", () => {
    expect(() => issueCommand({ ...baseInput, confirmedBy: "" })).toThrow(CommandSafetyError);
  });

  it("rejects a command with safety lock disabled", () => {
    expect(() => issueCommand({ ...baseInput, safetyLockEnabled: false })).toThrow(CommandSafetyError);
  });

  it("issues a command + a paired control_event when invariants pass", () => {
    const { commandId } = issueCommand(baseInput);
    expect(commandId).toBeTruthy();
    const db = getDb();
    const cmd = db.prepare("SELECT * FROM commands WHERE id = ?").get(commandId) as any;
    expect(cmd.safety_lock_enabled).toBe(1);
    expect(cmd.reason.length).toBeGreaterThan(0);
    expect(cmd.confirmed_by.length).toBeGreaterThan(0);
    const ev = db.prepare("SELECT * FROM control_events WHERE command_id = ?").get(commandId) as any;
    expect(ev.event_type).toBe("issued");
    expect(ev.source_type).toBe("simulated");
  });

  it("rejects a command targeting a device that does not belong to the site", () => {
    expect(() => issueCommand({ ...baseInput, deviceId: "ghost-device" })).toThrow(CommandSafetyError);
  });
});
