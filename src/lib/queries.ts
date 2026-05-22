import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import type {
  Site, Device, Sensor, Reading, Alert, Command, ControlEvent,
  AIRecommendation, Report, CoolingWaterLog, ROTelemetryRow,
  SourceType, AlertStatus, ApprovalStatus,
} from "./types";

// =========================================================================
// READ helpers — safe, typed wrappers over better-sqlite3.
// =========================================================================

export function listSites(): Site[] {
  return getDb().prepare("SELECT * FROM sites ORDER BY is_demo_site, name").all() as Site[];
}

export function getSite(id: string): Site | undefined {
  return getDb().prepare("SELECT * FROM sites WHERE id = ?").get(id) as Site | undefined;
}

export function listDevices(siteId: string): Device[] {
  return getDb().prepare("SELECT * FROM devices WHERE site_id = ? ORDER BY device_type, name").all(siteId) as Device[];
}

export function getDevice(id: string): Device | undefined {
  return getDb().prepare("SELECT * FROM devices WHERE id = ?").get(id) as Device | undefined;
}

export function listSensors(siteId: string): Sensor[] {
  return getDb().prepare("SELECT * FROM sensors WHERE site_id = ? ORDER BY sensor_type").all(siteId) as Sensor[];
}

export function getSensor(id: string): Sensor | undefined {
  return getDb().prepare("SELECT * FROM sensors WHERE id = ?").get(id) as Sensor | undefined;
}

export function latestReadingsForSite(siteId: string): Reading[] {
  return getDb().prepare(`
    SELECT r.* FROM readings r
    JOIN (
      SELECT sensor_id, MAX(recorded_at) AS mx
      FROM readings WHERE site_id = ? GROUP BY sensor_id
    ) lr ON lr.sensor_id = r.sensor_id AND lr.mx = r.recorded_at
    WHERE r.site_id = ?
    ORDER BY r.sensor_id
  `).all(siteId, siteId) as Reading[];
}

export function latestReading(sensorId: string): Reading | undefined {
  return getDb().prepare(
    "SELECT * FROM readings WHERE sensor_id = ? ORDER BY recorded_at DESC LIMIT 1"
  ).get(sensorId) as Reading | undefined;
}

export function readingsBetween(sensorId: string, from: string, to: string): Reading[] {
  return getDb().prepare(
    "SELECT * FROM readings WHERE sensor_id = ? AND recorded_at BETWEEN ? AND ? ORDER BY recorded_at"
  ).all(sensorId, from, to) as Reading[];
}

export function recentReadings(sensorId: string, limit = 96): Reading[] {
  return getDb().prepare(
    "SELECT * FROM readings WHERE sensor_id = ? ORDER BY recorded_at DESC LIMIT ?"
  ).all(sensorId, limit).reverse() as Reading[];
}

export function listAlerts(opts: { siteId?: string; status?: AlertStatus | "any"; limit?: number } = {}): Alert[] {
  const { siteId, status = "any", limit = 100 } = opts;
  const where: string[] = [];
  const args: unknown[] = [];
  if (siteId) { where.push("site_id = ?"); args.push(siteId); }
  if (status !== "any") { where.push("status = ?"); args.push(status); }
  const sql = `SELECT * FROM alerts ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT ?`;
  args.push(limit);
  return getDb().prepare(sql).all(...args) as Alert[];
}

export function getAlert(id: string): Alert | undefined {
  return getDb().prepare("SELECT * FROM alerts WHERE id = ?").get(id) as Alert | undefined;
}

export function listCommands(siteId?: string, limit = 100): Command[] {
  if (siteId) {
    return getDb().prepare(
      "SELECT * FROM commands WHERE site_id = ? ORDER BY created_at DESC LIMIT ?"
    ).all(siteId, limit) as Command[];
  }
  return getDb().prepare(
    "SELECT * FROM commands ORDER BY created_at DESC LIMIT ?"
  ).all(limit) as Command[];
}

export function listControlEvents(filters: { siteId?: string; deviceId?: string; type?: string; limit?: number } = {}): ControlEvent[] {
  const { siteId, deviceId, type, limit = 200 } = filters;
  const where: string[] = [];
  const args: unknown[] = [];
  if (siteId) { where.push("site_id = ?"); args.push(siteId); }
  if (deviceId) { where.push("device_id = ?"); args.push(deviceId); }
  if (type) { where.push("event_type = ?"); args.push(type); }
  const sql = `SELECT * FROM control_events ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT ?`;
  args.push(limit);
  return getDb().prepare(sql).all(...args) as ControlEvent[];
}

export function listAIRecommendations(siteId?: string, status?: ApprovalStatus): AIRecommendation[] {
  const where: string[] = [];
  const args: unknown[] = [];
  if (siteId) { where.push("site_id = ?"); args.push(siteId); }
  if (status) { where.push("approval_status = ?"); args.push(status); }
  const sql = `SELECT * FROM ai_recommendations ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT 50`;
  return getDb().prepare(sql).all(...args) as AIRecommendation[];
}

export function getAIRecommendationForAlert(alertId: string): AIRecommendation | undefined {
  return getDb().prepare(
    "SELECT * FROM ai_recommendations WHERE related_alert_id = ? ORDER BY created_at DESC LIMIT 1"
  ).get(alertId) as AIRecommendation | undefined;
}

export function listReports(siteId?: string): Report[] {
  if (siteId) {
    return getDb().prepare("SELECT * FROM reports WHERE site_id = ? ORDER BY generated_at DESC").all(siteId) as Report[];
  }
  return getDb().prepare("SELECT * FROM reports ORDER BY generated_at DESC").all() as Report[];
}

export function latestCooling(siteId: string, limit = 30): CoolingWaterLog[] {
  return getDb().prepare(
    "SELECT * FROM cooling_water_logs WHERE site_id = ? ORDER BY recorded_at DESC LIMIT ?"
  ).all(siteId, limit) as CoolingWaterLog[];
}

export function latestRO(siteId: string, limit = 1): ROTelemetryRow[] {
  return getDb().prepare(
    "SELECT * FROM ro_telemetry WHERE site_id = ? ORDER BY recorded_at DESC LIMIT ?"
  ).all(siteId, limit) as ROTelemetryRow[];
}

// =========================================================================
// WRITE helpers — enforce safety invariants at the helper layer too,
// so a caller cannot bypass them by malformed UI input.
// =========================================================================

export interface IssueCommandInput {
  siteId: string;
  deviceId: string;
  commandType: Command["command_type"];
  requestedState: string;
  reason: string;
  requestedBy: string;
  confirmedBy: string;
  safetyLockEnabled: boolean;
}

export class CommandSafetyError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Issues a command + an `issued` control_event in one transaction.
 * Enforces brief §3 + §5 invariants:
 *   - reason non-empty
 *   - confirmedBy non-empty
 *   - safetyLockEnabled MUST be true (operator must explicitly arm)
 */
export function issueCommand(input: IssueCommandInput): { commandId: string; eventId: number } {
  if (!input.reason?.trim()) throw new CommandSafetyError("REASON_REQUIRED", "Reason required");
  if (!input.confirmedBy?.trim()) throw new CommandSafetyError("CONFIRM_REQUIRED", "Dual confirmation required");
  if (!input.safetyLockEnabled) throw new CommandSafetyError("SAFETY_LOCK_OFF", "Safety lock must be armed");

  const id = randomUUID();
  const db = getDb();

  // Verify referenced device exists and belongs to site
  const dev = db.prepare("SELECT id FROM devices WHERE id = ? AND site_id = ?").get(input.deviceId, input.siteId);
  if (!dev) throw new CommandSafetyError("DEVICE_NOT_FOUND", "Device not found in site");

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO commands
      (id, site_id, device_id, command_type, requested_state, reason, status,
       requested_by, confirmed_by, safety_lock_enabled)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, 1)
    `).run(id, input.siteId, input.deviceId, input.commandType, input.requestedState,
      input.reason.trim(), input.requestedBy, input.confirmedBy.trim());

    const res = db.prepare(`
      INSERT INTO control_events
      (command_id, site_id, device_id, event_type, previous_state, new_state, source_type)
      VALUES (?, ?, ?, 'issued', NULL, ?, 'simulated')
    `).run(id, input.siteId, input.deviceId, input.requestedState);

    return { commandId: id, eventId: Number(res.lastInsertRowid) };
  });

  return tx();
}

/**
 * Marks a command as executed and writes the executed event.
 * Simulated-mode side effect (per G2: no real actuation).
 */
export function executeCommand(commandId: string): void {
  const db = getDb();
  const cmd = db.prepare("SELECT * FROM commands WHERE id = ?").get(commandId) as Command | undefined;
  if (!cmd) throw new CommandSafetyError("CMD_NOT_FOUND", "Command not found");
  if (cmd.status !== "pending" && cmd.status !== "acknowledged") return;

  const tx = db.transaction(() => {
    db.prepare("UPDATE commands SET status = 'executed', acknowledged_at = datetime('now') WHERE id = ?").run(commandId);
    db.prepare(`
      INSERT INTO control_events
      (command_id, site_id, device_id, event_type, previous_state, new_state, source_type)
      VALUES (?, ?, ?, 'executed', NULL, ?, 'simulated')
    `).run(commandId, cmd.site_id, cmd.device_id, cmd.requested_state);
  });
  tx();
}

export function acknowledgeAlert(alertId: string, by: string): void {
  getDb().prepare(
    "UPDATE alerts SET status = 'acknowledged', acknowledged_at = datetime('now'), assigned_to = ? WHERE id = ? AND status = 'open'"
  ).run(by, alertId);
}

export function resolveAlert(alertId: string): void {
  getDb().prepare(
    "UPDATE alerts SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?"
  ).run(alertId);
}

export function decideAIRecommendation(id: string, decision: ApprovalStatus, by: string): void {
  if (decision === "pending") return;
  getDb().prepare(
    "UPDATE ai_recommendations SET approval_status = ?, approved_by = ? WHERE id = ?"
  ).run(decision, by, id);
}

export function insertReading(input: {
  siteId: string; sensorId: string; value: number; unit: string;
  status: Reading["status"]; sourceType: SourceType; recordedAt: string;
}): number {
  const res = getDb().prepare(`
    INSERT INTO readings (site_id, sensor_id, value, unit, status, source_type, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(input.siteId, input.sensorId, input.value, input.unit, input.status, input.sourceType, input.recordedAt);
  return Number(res.lastInsertRowid);
}

// =========================================================================
// Site-wide health summary used by StatusBar
// =========================================================================
export interface SiteHealth {
  site: Site;
  devicesOnline: number;
  devicesTotal: number;
  openAlerts: number;
  criticalAlerts: number;
  lastSyncAt: string | null;
  hasLiveSource: boolean;
  hasStaleSensor: boolean;
}

export function computeSiteHealth(siteId: string): SiteHealth | null {
  const db = getDb();
  const site = getSite(siteId);
  if (!site) return null;

  const devices = listDevices(siteId);
  const onlineCount = devices.filter((d) => d.status === "online").length;

  const alertRows = db.prepare(
    "SELECT severity, COUNT(*) AS c FROM alerts WHERE site_id = ? AND status IN ('open','acknowledged') GROUP BY severity"
  ).all(siteId) as { severity: string; c: number }[];

  const openAlerts = alertRows.reduce((s, r) => s + r.c, 0);
  const criticalAlerts = alertRows.find((r) => r.severity === "p1")?.c ?? 0;

  const lastRow = db.prepare(
    "SELECT MAX(recorded_at) AS last FROM readings WHERE site_id = ?"
  ).get(siteId) as { last: string | null };

  const sensors = listSensors(siteId);
  const hasLive = sensors.some((s) => s.source_type === "live") || devices.some((d) => d.source_type === "live");
  const hasStale = sensors.some((s) => s.status === "stale" || s.status === "offline");

  return {
    site,
    devicesOnline: onlineCount,
    devicesTotal: devices.length,
    openAlerts,
    criticalAlerts,
    lastSyncAt: lastRow?.last ?? null,
    hasLiveSource: hasLive,
    hasStaleSensor: hasStale,
  };
}
