import { randomUUID } from "node:crypto";
import { getServerSupabase } from "./supabase-server";
import type {
  Site, Device, Sensor, Reading, Alert, Command, ControlEvent,
  AIRecommendation, Report, CoolingWaterLog, ROTelemetryRow,
  SourceType, AlertStatus, ApprovalStatus,
} from "./smartos-types";

// =========================================================================
// READ helpers — async wrappers over Supabase JS. Same signatures as the
// SQLite version (callers just need to `await`).
// On error: log + return safe fallback (empty array / undefined) so pages
// render in degraded mode rather than throw — important for prerender.
// =========================================================================

function warn(label: string, error: unknown) {
  if (error) console.warn(`[queries:${label}]`, error);
}

export async function listSites(): Promise<Site[]> {
  const { data, error } = await getServerSupabase()
    .from("sites")
    .select("*")
    .order("is_demo_site", { ascending: true })
    .order("name", { ascending: true });
  warn("listSites", error);
  return (data ?? []) as Site[];
}

export async function getSite(id: string): Promise<Site | undefined> {
  const { data, error } = await getServerSupabase().from("sites").select("*").eq("id", id).maybeSingle();
  warn("getSite", error);
  return (data ?? undefined) as Site | undefined;
}

export async function listDevices(siteId: string): Promise<Device[]> {
  const { data, error } = await getServerSupabase()
    .from("devices").select("*").eq("site_id", siteId)
    .order("device_type").order("name");
  warn("listDevices", error);
  return (data ?? []) as Device[];
}

export async function getDevice(id: string): Promise<Device | undefined> {
  const { data, error } = await getServerSupabase().from("devices").select("*").eq("id", id).maybeSingle();
  warn("getDevice", error);
  return (data ?? undefined) as Device | undefined;
}

export async function listSensors(siteId: string): Promise<Sensor[]> {
  const { data, error } = await getServerSupabase()
    .from("sensors").select("*").eq("site_id", siteId).order("sensor_type");
  warn("listSensors", error);
  return (data ?? []) as Sensor[];
}

export async function getSensor(id: string): Promise<Sensor | undefined> {
  const { data, error } = await getServerSupabase().from("sensors").select("*").eq("id", id).maybeSingle();
  warn("getSensor", error);
  return (data ?? undefined) as Sensor | undefined;
}

export async function latestReadingsForSite(siteId: string): Promise<Reading[]> {
  const { data, error } = await getServerSupabase().rpc("latest_readings_for_site", { site_id_param: siteId });
  warn("latestReadingsForSite", error);
  return (data ?? []) as Reading[];
}

export async function latestReading(sensorId: string): Promise<Reading | undefined> {
  const { data, error } = await getServerSupabase()
    .from("readings").select("*").eq("sensor_id", sensorId)
    .order("recorded_at", { ascending: false }).limit(1).maybeSingle();
  warn("latestReading", error);
  return (data ?? undefined) as Reading | undefined;
}

export async function readingsBetween(sensorId: string, from: string, to: string): Promise<Reading[]> {
  const { data, error } = await getServerSupabase()
    .from("readings").select("*").eq("sensor_id", sensorId)
    .gte("recorded_at", from).lte("recorded_at", to).order("recorded_at");
  warn("readingsBetween", error);
  return (data ?? []) as Reading[];
}

export async function recentReadings(sensorId: string, limit = 96): Promise<Reading[]> {
  const { data, error } = await getServerSupabase()
    .from("readings").select("*").eq("sensor_id", sensorId)
    .order("recorded_at", { ascending: false }).limit(limit);
  warn("recentReadings", error);
  return ((data ?? []) as Reading[]).reverse();
}

export async function listAlerts(opts: { siteId?: string; status?: AlertStatus | "any"; limit?: number } = {}): Promise<Alert[]> {
  const { siteId, status = "any", limit = 100 } = opts;
  let q = getServerSupabase().from("alerts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (siteId) q = q.eq("site_id", siteId);
  if (status !== "any") q = q.eq("status", status);
  const { data, error } = await q;
  warn("listAlerts", error);
  return (data ?? []) as Alert[];
}

export async function getAlert(id: string): Promise<Alert | undefined> {
  const { data, error } = await getServerSupabase().from("alerts").select("*").eq("id", id).maybeSingle();
  warn("getAlert", error);
  return (data ?? undefined) as Alert | undefined;
}

export async function listCommands(siteId?: string, limit = 100): Promise<Command[]> {
  let q = getServerSupabase().from("commands").select("*").order("created_at", { ascending: false }).limit(limit);
  if (siteId) q = q.eq("site_id", siteId);
  const { data, error } = await q;
  warn("listCommands", error);
  return (data ?? []) as Command[];
}

export async function listControlEvents(filters: { siteId?: string; deviceId?: string; type?: string; limit?: number } = {}): Promise<ControlEvent[]> {
  const { siteId, deviceId, type, limit = 200 } = filters;
  let q = getServerSupabase().from("control_events").select("*").order("created_at", { ascending: false }).limit(limit);
  if (siteId) q = q.eq("site_id", siteId);
  if (deviceId) q = q.eq("device_id", deviceId);
  if (type) q = q.eq("event_type", type);
  const { data, error } = await q;
  warn("listControlEvents", error);
  return (data ?? []) as ControlEvent[];
}

export async function listAIRecommendations(siteId?: string, status?: ApprovalStatus): Promise<AIRecommendation[]> {
  let q = getServerSupabase().from("ai_recommendations").select("*").order("created_at", { ascending: false }).limit(50);
  if (siteId) q = q.eq("site_id", siteId);
  if (status) q = q.eq("approval_status", status);
  const { data, error } = await q;
  warn("listAIRecommendations", error);
  return (data ?? []) as AIRecommendation[];
}

export async function getAIRecommendationForAlert(alertId: string): Promise<AIRecommendation | undefined> {
  const { data, error } = await getServerSupabase()
    .from("ai_recommendations").select("*").eq("related_alert_id", alertId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  warn("getAIRecommendationForAlert", error);
  return (data ?? undefined) as AIRecommendation | undefined;
}

export async function listReports(siteId?: string): Promise<Report[]> {
  let q = getServerSupabase().from("reports").select("*").order("generated_at", { ascending: false });
  if (siteId) q = q.eq("site_id", siteId);
  const { data, error } = await q;
  warn("listReports", error);
  return (data ?? []) as Report[];
}

export async function latestCooling(siteId: string, limit = 30): Promise<CoolingWaterLog[]> {
  const { data, error } = await getServerSupabase()
    .from("cooling_water_logs").select("*").eq("site_id", siteId)
    .order("recorded_at", { ascending: false }).limit(limit);
  warn("latestCooling", error);
  return (data ?? []) as CoolingWaterLog[];
}

export async function latestRO(siteId: string, limit = 1): Promise<ROTelemetryRow[]> {
  const { data, error } = await getServerSupabase()
    .from("ro_telemetry").select("*").eq("site_id", siteId)
    .order("recorded_at", { ascending: false }).limit(limit);
  warn("latestRO", error);
  return (data ?? []) as ROTelemetryRow[];
}

export async function listMaintenance(limit = 30): Promise<Array<{
  id: number; site_id: string; site_name: string; device_id: string | null;
  action_type: string; notes: string | null; performed_by: string; performed_at: string;
}>> {
  const { data, error } = await getServerSupabase()
    .from("maintenance_logs")
    .select("id, site_id, device_id, action_type, notes, performed_by, performed_at, sites!inner(name)")
    .order("performed_at", { ascending: false })
    .limit(limit);
  warn("listMaintenance", error);
  type Row = { id: number; site_id: string; device_id: string | null; action_type: string; notes: string | null; performed_by: string; performed_at: string; sites: { name: string } | { name: string }[] };
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id, site_id: r.site_id, device_id: r.device_id, action_type: r.action_type,
    notes: r.notes, performed_by: r.performed_by, performed_at: r.performed_at,
    site_name: Array.isArray(r.sites) ? r.sites[0]?.name ?? r.site_id : r.sites?.name ?? r.site_id,
  }));
}

// =========================================================================
// WRITE helpers — go through the issue_command_with_event RPC so atomicity
// matches the SQLite tx version. Brief §3 + §5 invariants enforced 3x:
// table CHECK + RPC plpgsql + this TS pre-check.
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

export async function issueCommand(input: IssueCommandInput): Promise<{ commandId: string }> {
  if (!input.reason?.trim())       throw new CommandSafetyError("REASON_REQUIRED", "Reason required");
  if (!input.confirmedBy?.trim())  throw new CommandSafetyError("CONFIRM_REQUIRED", "Dual confirmation required");
  if (!input.safetyLockEnabled)    throw new CommandSafetyError("SAFETY_LOCK_OFF", "Safety lock must be armed");

  const id = randomUUID();
  const { error } = await getServerSupabase().rpc("issue_command_with_event", {
    p_id: id,
    p_site_id: input.siteId,
    p_device_id: input.deviceId,
    p_command_type: input.commandType,
    p_requested_state: input.requestedState,
    p_reason: input.reason.trim(),
    p_requested_by: input.requestedBy,
    p_confirmed_by: input.confirmedBy.trim(),
  });
  if (error) {
    if (/REASON_REQUIRED/.test(error.message))    throw new CommandSafetyError("REASON_REQUIRED", "Reason required");
    if (/CONFIRM_REQUIRED/.test(error.message))   throw new CommandSafetyError("CONFIRM_REQUIRED", "Dual confirmation required");
    if (/DEVICE_NOT_FOUND/.test(error.message))   throw new CommandSafetyError("DEVICE_NOT_FOUND", "Device not found in site");
    throw new CommandSafetyError("RPC_ERROR", error.message);
  }
  return { commandId: id };
}

export async function executeCommand(commandId: string): Promise<void> {
  const { error } = await getServerSupabase().rpc("execute_command_with_event", { p_command_id: commandId });
  warn("executeCommand", error);
}

export async function acknowledgeAlert(alertId: string, by: string): Promise<void> {
  const { error } = await getServerSupabase()
    .from("alerts")
    .update({ status: "acknowledged", acknowledged_at: new Date().toISOString(), assigned_to: by })
    .eq("id", alertId).eq("status", "open");
  warn("acknowledgeAlert", error);
}

export async function resolveAlert(alertId: string): Promise<void> {
  const { error } = await getServerSupabase()
    .from("alerts")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", alertId);
  warn("resolveAlert", error);
}

export async function decideAIRecommendation(id: string, decision: ApprovalStatus, by: string): Promise<void> {
  if (decision === "pending") return;
  const { error } = await getServerSupabase()
    .from("ai_recommendations")
    .update({ approval_status: decision, approved_by: by })
    .eq("id", id);
  warn("decideAIRecommendation", error);
}

export async function insertReading(input: {
  siteId: string; sensorId: string; value: number; unit: string;
  status: Reading["status"]; sourceType: SourceType; recordedAt: string;
}): Promise<void> {
  const { error } = await getServerSupabase().from("readings").insert({
    site_id: input.siteId, sensor_id: input.sensorId, value: input.value, unit: input.unit,
    status: input.status, source_type: input.sourceType, recorded_at: input.recordedAt,
  });
  warn("insertReading", error);
}

// =========================================================================
// Site-wide health summary used by StatusBar — single round-trip via RPC.
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

export async function computeSiteHealth(siteId: string): Promise<SiteHealth | null> {
  const site = await getSite(siteId);
  if (!site) return null;

  const { data, error } = await getServerSupabase().rpc("site_health", { site_id_param: siteId });
  warn("computeSiteHealth", error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return {
    site,
    devicesOnline: 0, devicesTotal: 0,
    openAlerts: 0, criticalAlerts: 0,
    lastSyncAt: null,
    hasLiveSource: false, hasStaleSensor: false,
  };

  return {
    site,
    devicesOnline: row.devices_online ?? 0,
    devicesTotal: row.devices_total ?? 0,
    openAlerts: row.open_alerts ?? 0,
    criticalAlerts: row.critical_alerts ?? 0,
    lastSyncAt: row.last_sync_at ?? null,
    hasLiveSource: row.has_live_source ?? false,
    hasStaleSensor: row.has_stale_sensor ?? false,
  };
}
