-- ============================================================================
-- RPC helpers — let the Supabase JS client express Postgres-only patterns
-- (DISTINCT ON, multi-row aggregates) without raw SQL.
-- ============================================================================

-- Latest reading per sensor for a site (uses DISTINCT ON — Postgres-native).
CREATE OR REPLACE FUNCTION latest_readings_for_site(site_id_param text)
RETURNS SETOF readings
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT ON (sensor_id) *
  FROM readings
  WHERE site_id = site_id_param
  ORDER BY sensor_id, recorded_at DESC;
$$;

-- Site health aggregate used by StatusBar (single round-trip).
CREATE OR REPLACE FUNCTION site_health(site_id_param text)
RETURNS TABLE (
  site_id          text,
  devices_online   integer,
  devices_total    integer,
  open_alerts      integer,
  critical_alerts  integer,
  last_sync_at     timestamptz,
  has_live_source  boolean,
  has_stale_sensor boolean
)
LANGUAGE sql STABLE
AS $$
  SELECT
    site_id_param,
    (SELECT COUNT(*)::int FROM devices WHERE site_id = site_id_param AND status = 'online'),
    (SELECT COUNT(*)::int FROM devices WHERE site_id = site_id_param),
    (SELECT COUNT(*)::int FROM alerts  WHERE site_id = site_id_param AND status IN ('open','acknowledged')),
    (SELECT COUNT(*)::int FROM alerts  WHERE site_id = site_id_param AND status IN ('open','acknowledged') AND severity = 'p1'),
    (SELECT MAX(recorded_at) FROM readings WHERE site_id = site_id_param),
    EXISTS(
      SELECT 1 FROM sensors WHERE site_id = site_id_param AND source_type = 'live'
      UNION
      SELECT 1 FROM devices WHERE site_id = site_id_param AND source_type = 'live'
    ),
    EXISTS(SELECT 1 FROM sensors WHERE site_id = site_id_param AND status IN ('stale','offline'));
$$;

-- Atomic command issue + paired control_event (preserves the brief's audit-chain
-- invariant the SQLite version had via a single tx). Throws if invariants fail.
CREATE OR REPLACE FUNCTION issue_command_with_event(
  p_id              text,
  p_site_id         text,
  p_device_id       text,
  p_command_type    command_kind,
  p_requested_state text,
  p_reason          text,
  p_requested_by    text,
  p_confirmed_by    text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists boolean;
BEGIN
  IF length(trim(p_reason)) = 0      THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
  IF length(trim(p_confirmed_by)) = 0 THEN RAISE EXCEPTION 'CONFIRM_REQUIRED'; END IF;

  SELECT EXISTS(SELECT 1 FROM devices WHERE id = p_device_id AND site_id = p_site_id) INTO v_exists;
  IF NOT v_exists THEN RAISE EXCEPTION 'DEVICE_NOT_FOUND'; END IF;

  INSERT INTO commands
    (id, site_id, device_id, command_type, requested_state, reason, status,
     requested_by, confirmed_by, safety_lock_enabled)
  VALUES
    (p_id, p_site_id, p_device_id, p_command_type, p_requested_state, p_reason, 'pending',
     p_requested_by, p_confirmed_by, true);

  INSERT INTO control_events
    (command_id, site_id, device_id, event_type, previous_state, new_state, source_type)
  VALUES
    (p_id, p_site_id, p_device_id, 'issued', NULL, p_requested_state, 'simulated');

  RETURN p_id;
END;
$$;

-- Mark a command as executed and append the matching control_event.
CREATE OR REPLACE FUNCTION execute_command_with_event(p_command_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_cmd commands%ROWTYPE;
BEGIN
  SELECT * INTO v_cmd FROM commands WHERE id = p_command_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'CMD_NOT_FOUND'; END IF;
  IF v_cmd.status NOT IN ('pending','acknowledged') THEN RETURN; END IF;

  UPDATE commands
     SET status = 'executed', acknowledged_at = now()
   WHERE id = p_command_id;

  INSERT INTO control_events
    (command_id, site_id, device_id, event_type, previous_state, new_state, source_type)
  VALUES
    (p_command_id, v_cmd.site_id, v_cmd.device_id, 'executed', NULL, v_cmd.requested_state, 'simulated');
END;
$$;

-- The idempotent Golden Flow re-arm function (mirrors src/lib/golden-flow.ts).
CREATE OR REPLACE FUNCTION trigger_golden_flow()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_sensor sensors%ROWTYPE;
  v_alert_id text;
  v_ai_id text;
  v_status reading_status;
  v_val double precision;
  v_offsets int[] := ARRAY[16, 14, 12, 10, 8, 6, 4, 2];
  v_values double precision[] := ARRAY[2.05, 2.12, 2.28, 2.41, 2.55, 2.68, 2.78, 2.86];
  i int;
BEGIN
  SELECT * INTO v_sensor FROM sensors WHERE site_id = 'site-demo' AND sensor_type = 'ec' LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  FOR i IN 1..array_length(v_values, 1) LOOP
    v_val := v_values[i];
    v_status := CASE
      WHEN v_val > v_sensor.max_safe_value + 0.1 THEN 'critical'::reading_status
      WHEN v_val > v_sensor.max_safe_value       THEN 'warning'::reading_status
      ELSE 'ok'::reading_status
    END;
    INSERT INTO readings (site_id, sensor_id, value, unit, status, source_type, recorded_at)
    VALUES ('site-demo', v_sensor.id, v_val, v_sensor.unit, v_status, v_sensor.source_type,
            now() - (v_offsets[i] || ' minutes')::interval);
  END LOOP;

  SELECT id INTO v_alert_id
    FROM alerts
   WHERE site_id = 'site-demo' AND sensor_id = v_sensor.id
     AND status IN ('open','acknowledged') AND severity = 'p2'
   LIMIT 1;

  IF v_alert_id IS NULL THEN
    v_alert_id := gen_random_uuid()::text;
    INSERT INTO alerts
      (id, site_id, sensor_id, severity, title, description, trigger_value,
       recommended_action, assigned_to, status)
    VALUES (
      v_alert_id, 'site-demo', v_sensor.id, 'p2',
      'ارتفاع EC خارج النطاق الآمن',
      'ارتفعت قراءة EC إلى 2.86 mS/cm متجاوزةً الحد الأعلى 2.4. النمط يشير إلى إفراط محتمل في الجرعات أو فقد ماء.',
      2.86,
      'إيقاف الجرعات مؤقتاً + تأكيد قيم الخزان قبل الاستئناف.',
      NULL, 'open'
    );
  END IF;

  SELECT id INTO v_ai_id
    FROM ai_recommendations
   WHERE related_alert_id = v_alert_id
   ORDER BY created_at DESC LIMIT 1;

  IF v_ai_id IS NULL THEN
    INSERT INTO ai_recommendations
      (id, site_id, related_alert_id, recommendation_type, recommendation,
       evidence_summary, confidence_label, requires_human_approval, approval_status)
    VALUES (
      gen_random_uuid()::text, 'site-demo', v_alert_id, 'pause_dosing',
      'إيقاف وحدة الجرعات A/B مؤقتاً (15 دقيقة) ثم إعادة التقييم بعد دورة ري قصيرة.',
      'EC يرتفع بمعدل +0.10 كل 15 دقيقة منذ آخر 8 قراءات · pH مستقر عند 6.1 · مستوى الخزان انخفض 8% خلال نفس النافذة · لا توجد دورة جرعات مسجّلة في آخر ساعتين. النمط متّسق مع تركّز الأملاح بسبب فقد ماء، لا إفراط جرعات.',
      'high', true, 'pending'
    );
  ELSE
    UPDATE ai_recommendations
       SET approval_status = 'pending', approved_by = NULL
     WHERE id = v_ai_id AND approval_status <> 'pending';
  END IF;

  RETURN v_alert_id;
END;
$$;
