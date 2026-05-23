// =========================================================================
// Domain types — mirror data/schema.sql exactly.
// Brief §3 + §7 red lines are encoded as TS literals here so the
// type system rejects forbidden shapes at compile time (e.g. a Reading
// without source_type cannot exist).
// =========================================================================

export type SourceType = "live" | "simulated" | "manual" | "offline";
export type Severity = "p1" | "p2" | "p3";
export type SensorStatus = "ok" | "warning" | "critical" | "offline" | "stale";
export type SiteStatus = "online" | "degraded" | "offline";
export type DeviceStatus = SiteStatus;
export type CommandStatus = "pending" | "acknowledged" | "executed" | "failed" | "rolled_back";
export type AlertStatus = "open" | "acknowledged" | "resolved" | "suppressed";
export type ConfidenceLabel = "low" | "medium" | "high";
export type ApprovalStatus = "pending" | "approved" | "modified" | "rejected";

export type SensorType =
  | "ph" | "ec" | "water_temp" | "tank_level"
  | "air_temp" | "humidity" | "light" | "do" | "pressure";

export type DeviceType =
  | "gateway" | "controller" | "pump" | "valve"
  | "dosing" | "fan" | "ro_unit";

export type CommandType =
  | "pause" | "resume" | "open" | "close"
  | "set" | "reset" | "toggle";

export type EventType =
  | "issued" | "acknowledged" | "executed" | "failed"
  | "rolled_back" | "manual_override" | "safety_engage";

export type ReportType =
  | "daily" | "weekly" | "monthly" | "incident" | "compliance_snapshot";

export type SiteType = "rnd" | "industrial" | "demo";

export interface Site {
  id: string;
  name: string;
  location: string;
  site_type: SiteType;
  status: SiteStatus;
  is_demo_site: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  site_id: string;
  name: string;
  device_type: DeviceType;
  status: DeviceStatus;
  last_heartbeat_at: string | null;
  signal_strength: number | null;
  firmware_version: string | null;
  source_type: SourceType;
}

export interface Sensor {
  id: string;
  site_id: string;
  device_id: string | null;
  name: string;
  sensor_type: SensorType;
  unit: string;
  min_safe_value: number;
  max_safe_value: number;
  status: SensorStatus;
  calibration_due_at: string | null;
  source_type: SourceType;
}

export interface Reading {
  id: number;
  site_id: string;
  sensor_id: string;
  value: number;
  unit: string;
  status: "ok" | "warning" | "critical" | "stale";
  source_type: SourceType;
  recorded_at: string;
}

export interface Alert {
  id: string;
  site_id: string;
  sensor_id: string | null;
  severity: Severity;
  title: string;
  description: string;
  trigger_value: number | null;
  recommended_action: string;
  assigned_to: string | null;
  status: AlertStatus;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface Command {
  id: string;
  site_id: string;
  device_id: string;
  command_type: CommandType;
  requested_state: string;
  reason: string;                  // NOT NULL, non-empty
  status: CommandStatus;
  requested_by: string;
  confirmed_by: string;            // NOT NULL, non-empty
  safety_lock_enabled: 0 | 1;      // NOT NULL
  created_at: string;
  acknowledged_at: string | null;
  failed_reason: string | null;
}

export interface ControlEvent {
  id: number;
  command_id: string | null;
  site_id: string;
  device_id: string;
  event_type: EventType;
  previous_state: string | null;
  new_state: string | null;
  source_type: SourceType;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  site_id: string;
  related_alert_id: string | null;
  related_reading_id: number | null;
  recommendation_type: string;
  recommendation: string;
  evidence_summary: string;
  confidence_label: ConfidenceLabel;
  requires_human_approval: 1;      // enforced at DB level too
  approval_status: ApprovalStatus;
  approved_by: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  site_id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  summary: string;
  generated_by: string;
  generated_at: string;
  export_url: string | null;
  disclaimer: string;              // NOT NULL — §3 + §7
}

export interface CoolingWaterLog {
  id: number;
  site_id: string;
  device_id: string | null;
  cooling_water_liters: number;
  irrigation_water_liters: number;
  vertical_temp_gradient: number | null;
  fan_extraction_rate: number | null;
  ambient_temp: number | null;
  optimization_active: 0 | 1;
  recorded_at: string;
}

export interface ROTelemetryRow {
  id: number;
  site_id: string;
  device_id: string | null;
  inlet_pressure: number;
  outlet_pressure: number;
  differential_pressure: number;
  ec_pre_filtration: number;
  ec_post_filtration: number;
  tds: number;
  salt_rejection_pct: number;
  membrane_health_status: "good" | "fair" | "degraded" | "replace";
  recorded_at: string;
}

// ---- Role context for persona views (§4 phase 2) ---------------------------
export type Role = "operator" | "manager" | "executive";

export const ROLE_LABELS_AR: Record<Role, string> = {
  operator: "مشغّل",
  manager: "مدير العمليات",
  executive: "تنفيذي",
};
