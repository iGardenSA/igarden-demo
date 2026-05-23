-- ============================================================================
-- iGarden Smart OS Demo · 13-Table Schema
-- Mirrors brief §3 exactly. Mirrors Supabase shape — portable.
-- Constraints enforce brief red lines structurally:
--   • source_type ENUM('live','simulated','manual','offline') everywhere relevant
--   • commands.confirmed_by + reason + safety_lock_enabled NOT NULL
--   • reports.disclaimer NOT NULL
--   • ai_recommendations.requires_human_approval DEFAULT TRUE (1)
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ---------------------------------------------------------------------------
-- 1. sites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sites (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  location        TEXT NOT NULL,
  site_type       TEXT NOT NULL CHECK (site_type IN ('rnd','industrial','demo')),
  status          TEXT NOT NULL CHECK (status IN ('online','degraded','offline')),
  is_demo_site    INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- 2. devices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
  id                TEXT PRIMARY KEY,
  site_id           TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  device_type       TEXT NOT NULL CHECK (device_type IN ('gateway','controller','pump','valve','dosing','fan','ro_unit')),
  status            TEXT NOT NULL CHECK (status IN ('online','degraded','offline')),
  last_heartbeat_at TEXT,
  signal_strength   INTEGER,          -- 0-100
  firmware_version  TEXT,
  source_type       TEXT NOT NULL CHECK (source_type IN ('live','simulated','manual','offline'))
);
CREATE INDEX IF NOT EXISTS idx_devices_site ON devices(site_id);

-- ---------------------------------------------------------------------------
-- 3. sensors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensors (
  id                  TEXT PRIMARY KEY,
  site_id             TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id           TEXT REFERENCES devices(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  sensor_type         TEXT NOT NULL CHECK (sensor_type IN ('ph','ec','water_temp','tank_level','air_temp','humidity','light','do','pressure')),
  unit                TEXT NOT NULL,
  min_safe_value      REAL NOT NULL,
  max_safe_value      REAL NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('ok','warning','critical','offline','stale')),
  calibration_due_at  TEXT,
  source_type         TEXT NOT NULL CHECK (source_type IN ('live','simulated','manual','offline'))
);
CREATE INDEX IF NOT EXISTS idx_sensors_site ON sensors(site_id);

-- ---------------------------------------------------------------------------
-- 4. readings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS readings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id       TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  sensor_id     TEXT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  value         REAL NOT NULL,
  unit          TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('ok','warning','critical','stale')),
  source_type   TEXT NOT NULL CHECK (source_type IN ('live','simulated','manual','offline')),
  recorded_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_readings_sensor_time ON readings(sensor_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_site_time   ON readings(site_id, recorded_at DESC);

-- ---------------------------------------------------------------------------
-- 5. alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
  id                  TEXT PRIMARY KEY,
  site_id             TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  sensor_id           TEXT REFERENCES sensors(id) ON DELETE SET NULL,
  severity            TEXT NOT NULL CHECK (severity IN ('p1','p2','p3')),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  trigger_value       REAL,
  recommended_action  TEXT NOT NULL,                          -- every alert MUST have an action (ISA-18.2)
  assigned_to         TEXT,
  status              TEXT NOT NULL CHECK (status IN ('open','acknowledged','resolved','suppressed')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  acknowledged_at     TEXT,
  resolved_at         TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_site_status ON alerts(site_id, status);

-- ---------------------------------------------------------------------------
-- 6. commands  (HARD constraints: §3 + §5)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commands (
  id                    TEXT PRIMARY KEY,
  site_id               TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id             TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  command_type          TEXT NOT NULL CHECK (command_type IN ('pause','resume','open','close','set','reset','toggle')),
  requested_state       TEXT NOT NULL,
  reason                TEXT NOT NULL CHECK (length(trim(reason)) > 0),       -- mandatory reason
  status                TEXT NOT NULL CHECK (status IN ('pending','acknowledged','executed','failed','rolled_back')),
  requested_by          TEXT NOT NULL,
  confirmed_by          TEXT NOT NULL CHECK (length(trim(confirmed_by)) > 0), -- mandatory dual confirm
  safety_lock_enabled   INTEGER NOT NULL CHECK (safety_lock_enabled IN (0,1)),
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  acknowledged_at       TEXT,
  failed_reason         TEXT
);
CREATE INDEX IF NOT EXISTS idx_commands_site_time ON commands(site_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 7. control_events  (the audit trail of what actually happened)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS control_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  command_id      TEXT REFERENCES commands(id) ON DELETE SET NULL,
  site_id         TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id       TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN ('issued','acknowledged','executed','failed','rolled_back','manual_override','safety_engage')),
  previous_state  TEXT,
  new_state       TEXT,
  source_type     TEXT NOT NULL CHECK (source_type IN ('live','simulated','manual','offline')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_control_events_site_time ON control_events(site_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 8. maintenance_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id           TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id         TEXT REFERENCES devices(id) ON DELETE SET NULL,
  related_alert_id  TEXT REFERENCES alerts(id) ON DELETE SET NULL,
  action_type       TEXT NOT NULL CHECK (action_type IN ('inspection','calibration','replacement','cleaning','repair','firmware_update')),
  notes             TEXT,
  performed_by      TEXT NOT NULL,
  performed_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- 9. reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  site_id       TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  report_type   TEXT NOT NULL CHECK (report_type IN ('daily','weekly','monthly','incident','compliance_snapshot')),
  period_start  TEXT NOT NULL,
  period_end    TEXT NOT NULL,
  summary       TEXT NOT NULL,
  generated_by  TEXT NOT NULL,
  generated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  export_url    TEXT,
  disclaimer    TEXT NOT NULL CHECK (length(trim(disclaimer)) > 0)             -- §3 + §7 red line
);

-- ---------------------------------------------------------------------------
-- 10. ai_recommendations  (human approval default ON — non-negotiable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id                          TEXT PRIMARY KEY,
  site_id                     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  related_alert_id            TEXT REFERENCES alerts(id) ON DELETE SET NULL,
  related_reading_id          INTEGER REFERENCES readings(id) ON DELETE SET NULL,
  recommendation_type         TEXT NOT NULL,
  recommendation              TEXT NOT NULL,
  evidence_summary            TEXT NOT NULL,
  confidence_label            TEXT NOT NULL CHECK (confidence_label IN ('low','medium','high')),
  requires_human_approval     INTEGER NOT NULL DEFAULT 1 CHECK (requires_human_approval = 1),
  approval_status             TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','modified','rejected')),
  approved_by                 TEXT,
  created_at                  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- 11+12. Saudi-localization moats
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cooling_water_logs (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id                     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id                   TEXT REFERENCES devices(id) ON DELETE SET NULL,
  cooling_water_liters        REAL NOT NULL,
  irrigation_water_liters     REAL NOT NULL,
  vertical_temp_gradient      REAL,
  fan_extraction_rate         REAL,
  ambient_temp                REAL,
  optimization_active         INTEGER NOT NULL DEFAULT 0 CHECK (optimization_active IN (0,1)),
  recorded_at                 TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cooling_site_time ON cooling_water_logs(site_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS ro_telemetry (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id                 TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id               TEXT REFERENCES devices(id) ON DELETE SET NULL,
  inlet_pressure          REAL NOT NULL,
  outlet_pressure         REAL NOT NULL,
  differential_pressure   REAL NOT NULL,
  ec_pre_filtration       REAL NOT NULL,
  ec_post_filtration      REAL NOT NULL,
  tds                     REAL NOT NULL,
  salt_rejection_pct      REAL NOT NULL,
  membrane_health_status  TEXT NOT NULL CHECK (membrane_health_status IN ('good','fair','degraded','replace')),
  recorded_at             TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ro_site_time ON ro_telemetry(site_id, recorded_at DESC);
