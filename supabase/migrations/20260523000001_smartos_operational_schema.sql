-- ============================================================================
-- iGarden Smart OS Demo · 12-Table Schema · Postgres (Supabase)
-- Migrated from SQLite (preserves all brief §3 + §7 red lines):
--   • source_type ENUM enforced via Postgres native ENUM
--   • commands.reason + confirmed_by + safety_lock_enabled NOT NULL
--   • reports.disclaimer NOT NULL
--   • ai_recommendations.requires_human_approval DEFAULT TRUE (CHECK = TRUE)
-- ============================================================================

-- ---- ENUM types --------------------------------------------------------------
CREATE TYPE source_type   AS ENUM ('live','simulated','manual','offline');
CREATE TYPE site_type     AS ENUM ('rnd','industrial','demo');
CREATE TYPE node_status   AS ENUM ('online','degraded','offline');
CREATE TYPE device_kind   AS ENUM ('gateway','controller','pump','valve','dosing','fan','ro_unit');
CREATE TYPE sensor_kind   AS ENUM ('ph','ec','water_temp','tank_level','air_temp','humidity','light','do','pressure');
CREATE TYPE sensor_status AS ENUM ('ok','warning','critical','offline','stale');
CREATE TYPE reading_status AS ENUM ('ok','warning','critical','stale');
CREATE TYPE severity      AS ENUM ('p1','p2','p3');
CREATE TYPE alert_status  AS ENUM ('open','acknowledged','resolved','suppressed');
CREATE TYPE command_kind  AS ENUM ('pause','resume','open','close','set','reset','toggle');
CREATE TYPE command_status AS ENUM ('pending','acknowledged','executed','failed','rolled_back');
CREATE TYPE event_kind    AS ENUM ('issued','acknowledged','executed','failed','rolled_back','manual_override','safety_engage');
CREATE TYPE confidence    AS ENUM ('low','medium','high');
CREATE TYPE approval_status AS ENUM ('pending','approved','modified','rejected');
CREATE TYPE report_kind   AS ENUM ('daily','weekly','monthly','incident','compliance_snapshot');
CREATE TYPE maintenance_kind AS ENUM ('inspection','calibration','replacement','cleaning','repair','firmware_update');
CREATE TYPE membrane_health AS ENUM ('good','fair','degraded','replace');

-- ---- 1. sites ----------------------------------------------------------------
CREATE TABLE sites (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  location     text NOT NULL,
  site_type    site_type NOT NULL,
  status       node_status NOT NULL,
  is_demo_site boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---- 2. devices --------------------------------------------------------------
CREATE TABLE devices (
  id                text PRIMARY KEY,
  site_id           text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name              text NOT NULL,
  device_type       device_kind NOT NULL,
  status            node_status NOT NULL,
  last_heartbeat_at timestamptz,
  signal_strength   integer CHECK (signal_strength IS NULL OR (signal_strength BETWEEN 0 AND 100)),
  firmware_version  text,
  source_type       source_type NOT NULL
);
CREATE INDEX idx_devices_site ON devices(site_id);

-- ---- 3. sensors --------------------------------------------------------------
CREATE TABLE sensors (
  id                 text PRIMARY KEY,
  site_id            text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id          text REFERENCES devices(id) ON DELETE SET NULL,
  name               text NOT NULL,
  sensor_type        sensor_kind NOT NULL,
  unit               text NOT NULL,
  min_safe_value     double precision NOT NULL,
  max_safe_value     double precision NOT NULL,
  status             sensor_status NOT NULL,
  calibration_due_at timestamptz,
  source_type        source_type NOT NULL
);
CREATE INDEX idx_sensors_site ON sensors(site_id);

-- ---- 4. readings -------------------------------------------------------------
CREATE TABLE readings (
  id          bigserial PRIMARY KEY,
  site_id     text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  sensor_id   text NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  value       double precision NOT NULL,
  unit        text NOT NULL,
  status      reading_status NOT NULL,
  source_type source_type NOT NULL,
  recorded_at timestamptz NOT NULL
);
CREATE INDEX idx_readings_sensor_time ON readings(sensor_id, recorded_at DESC);
CREATE INDEX idx_readings_site_time   ON readings(site_id, recorded_at DESC);

-- ---- 5. alerts ---------------------------------------------------------------
CREATE TABLE alerts (
  id                  text PRIMARY KEY,
  site_id             text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  sensor_id           text REFERENCES sensors(id) ON DELETE SET NULL,
  severity            severity NOT NULL,
  title               text NOT NULL,
  description         text NOT NULL,
  trigger_value       double precision,
  recommended_action  text NOT NULL,
  assigned_to         text,
  status              alert_status NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  acknowledged_at     timestamptz,
  resolved_at         timestamptz
);
CREATE INDEX idx_alerts_site_status ON alerts(site_id, status);

-- ---- 6. commands (HARD constraints — brief §3 + §5) -------------------------
CREATE TABLE commands (
  id                  text PRIMARY KEY,
  site_id             text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id           text NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  command_type        command_kind NOT NULL,
  requested_state     text NOT NULL,
  reason              text NOT NULL CHECK (length(trim(reason)) > 0),
  status              command_status NOT NULL,
  requested_by        text NOT NULL,
  confirmed_by        text NOT NULL CHECK (length(trim(confirmed_by)) > 0),
  safety_lock_enabled boolean NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  acknowledged_at     timestamptz,
  failed_reason       text
);
CREATE INDEX idx_commands_site_time ON commands(site_id, created_at DESC);

-- ---- 7. control_events -------------------------------------------------------
CREATE TABLE control_events (
  id             bigserial PRIMARY KEY,
  command_id     text REFERENCES commands(id) ON DELETE SET NULL,
  site_id        text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id      text NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type     event_kind NOT NULL,
  previous_state text,
  new_state      text,
  source_type    source_type NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_control_events_site_time ON control_events(site_id, created_at DESC);

-- ---- 8. maintenance_logs -----------------------------------------------------
CREATE TABLE maintenance_logs (
  id               bigserial PRIMARY KEY,
  site_id          text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id        text REFERENCES devices(id) ON DELETE SET NULL,
  related_alert_id text REFERENCES alerts(id) ON DELETE SET NULL,
  action_type      maintenance_kind NOT NULL,
  notes            text,
  performed_by     text NOT NULL,
  performed_at     timestamptz NOT NULL DEFAULT now()
);

-- ---- 9. reports --------------------------------------------------------------
CREATE TABLE reports (
  id           text PRIMARY KEY,
  site_id      text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  report_type  report_kind NOT NULL,
  period_start timestamptz NOT NULL,
  period_end   timestamptz NOT NULL,
  summary      text NOT NULL,
  generated_by text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  export_url   text,
  disclaimer   text NOT NULL CHECK (length(trim(disclaimer)) > 0)
);

-- ---- 10. ai_recommendations (human approval = always TRUE) ------------------
CREATE TABLE ai_recommendations (
  id                      text PRIMARY KEY,
  site_id                 text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  related_alert_id        text REFERENCES alerts(id) ON DELETE SET NULL,
  related_reading_id      bigint REFERENCES readings(id) ON DELETE SET NULL,
  recommendation_type     text NOT NULL,
  recommendation          text NOT NULL,
  evidence_summary        text NOT NULL,
  confidence_label        confidence NOT NULL,
  requires_human_approval boolean NOT NULL DEFAULT true CHECK (requires_human_approval = true),
  approval_status         approval_status NOT NULL DEFAULT 'pending',
  approved_by             text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ---- 11. cooling_water_logs (Saudi moat) ------------------------------------
CREATE TABLE cooling_water_logs (
  id                      bigserial PRIMARY KEY,
  site_id                 text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id               text REFERENCES devices(id) ON DELETE SET NULL,
  cooling_water_liters    double precision NOT NULL,
  irrigation_water_liters double precision NOT NULL,
  vertical_temp_gradient  double precision,
  fan_extraction_rate     double precision,
  ambient_temp            double precision,
  optimization_active     boolean NOT NULL DEFAULT false,
  recorded_at             timestamptz NOT NULL
);
CREATE INDEX idx_cooling_site_time ON cooling_water_logs(site_id, recorded_at DESC);

-- ---- 12. ro_telemetry (Saudi moat) ------------------------------------------
CREATE TABLE ro_telemetry (
  id                     bigserial PRIMARY KEY,
  site_id                text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id              text REFERENCES devices(id) ON DELETE SET NULL,
  inlet_pressure         double precision NOT NULL,
  outlet_pressure        double precision NOT NULL,
  differential_pressure  double precision NOT NULL,
  ec_pre_filtration      double precision NOT NULL,
  ec_post_filtration     double precision NOT NULL,
  tds                    double precision NOT NULL,
  salt_rejection_pct     double precision NOT NULL,
  membrane_health_status membrane_health NOT NULL,
  recorded_at            timestamptz NOT NULL
);
CREATE INDEX idx_ro_site_time ON ro_telemetry(site_id, recorded_at DESC);

-- ============================================================================
-- RLS: anon SELECT only · service_role full (server + seed)
-- ============================================================================
ALTER TABLE sites              ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands           ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooling_water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_telemetry       ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_read_sites              ON sites              FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_devices            ON devices            FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_sensors            ON sensors            FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_readings           ON readings           FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_alerts             ON alerts             FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_commands           ON commands           FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_control_events     ON control_events     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_maintenance_logs   ON maintenance_logs   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_reports            ON reports            FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_ai_recommendations ON ai_recommendations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_cooling_water_logs ON cooling_water_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_ro_telemetry       ON ro_telemetry       FOR SELECT TO anon, authenticated USING (true);
