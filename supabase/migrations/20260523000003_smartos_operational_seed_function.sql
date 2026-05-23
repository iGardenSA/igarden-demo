-- ============================================================================
-- seed_demo_data() — full 30-day deterministic seed in pure SQL.
-- Mirrors scripts/seed-supabase.ts but runs entirely server-side, so a
-- developer can re-seed without service_role on their laptop. Idempotent:
-- wipes existing rows first.
-- Run via SQL editor:  SELECT seed_demo_data();
-- ============================================================================
CREATE OR REPLACE FUNCTION seed_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_now constant timestamptz := timestamptz '2026-05-22 06:00:00+00';
  v_ec_alert_id text := gen_random_uuid()::text;
  v_old_p1_id   text := gen_random_uuid()::text;
  v_total_readings int := 0;
BEGIN
  DELETE FROM control_events;
  DELETE FROM commands;
  DELETE FROM ai_recommendations;
  DELETE FROM maintenance_logs;
  DELETE FROM alerts;
  DELETE FROM reports;
  DELETE FROM cooling_water_logs;
  DELETE FROM ro_telemetry;
  DELETE FROM readings;
  DELETE FROM sensors;
  DELETE FROM devices;
  DELETE FROM sites;

  INSERT INTO sites (id, name, location, site_type, status, is_demo_site, created_at, updated_at) VALUES
    ('site-asfan-rnd',        'محطة عسفان · R&D',          'عسفان · مكة المكرمة',  'rnd',        'online', false, v_now - interval '30 days', v_now),
    ('site-industrial-south', 'موقع صناعي · المنطقة الجنوبية', 'المنطقة الجنوبية',      'industrial', 'online', false, v_now - interval '30 days', v_now),
    ('site-demo',             'Demo Site · TAQADAM',        'KAUST',                'demo',       'online', true,  v_now - interval '30 days', v_now);

  INSERT INTO devices (id, site_id, name, device_type, status, last_heartbeat_at, signal_strength, firmware_version, source_type)
  SELECT 'dev-' || site_id || '-' || part, site_id, name, dtype, 'online',
         v_now - (heartbeat_min || ' minutes')::interval, sig, fw, sx.src
  FROM (VALUES
    ('gw',     'بوابة IoT الرئيسية',  'gateway'::device_kind,    1, 92, '1.4.2'),
    ('ctrl',   'وحدة التحكّم المركزية', 'controller'::device_kind, 2, 88, '1.4.2'),
    ('pump',   'مضخة دوران #1',        'pump'::device_kind,       1, 90, '1.2.0'),
    ('dosing', 'وحدة جرعات A/B',       'dosing'::device_kind,     1, 85, '1.3.1'),
    ('fan',    'مراوح الاستخلاص',       'fan'::device_kind,        3, 78, '1.1.0'),
    ('valve',  'محبس الري الرئيسي',     'valve'::device_kind,      2, 82, '1.2.0'),
    ('ro',     'وحدة التناضح العكسي',   'ro_unit'::device_kind,    2, 80, '1.0.4')
  ) AS dev(part, name, dtype, heartbeat_min, sig, fw)
  CROSS JOIN (VALUES
    -- All sources are 'simulated' until a real sensor writes to Supabase
    -- via the MQTT bridge (post-G2). The 'live' enum value is reserved —
    -- never used by the seed — so any 'live'-labelled badge in the UI is
    -- evidence of a real device, never demo data. Brief §7 red line.
    ('site-asfan-rnd', 'simulated'::source_type),
    ('site-industrial-south', 'simulated'::source_type),
    ('site-demo', 'simulated'::source_type)
  ) AS s(site_id, dev_src)
  CROSS JOIN LATERAL (SELECT dev_src AS src) sx;

  INSERT INTO sensors (id, site_id, device_id, name, sensor_type, unit, min_safe_value, max_safe_value, status, calibration_due_at, source_type)
  SELECT 'sen-' || site_id || '-' || stype, site_id,
         'dev-' || site_id || '-ctrl',
         sname, stype::sensor_kind, sunit, smin, smax,
         'ok'::sensor_status, v_now + interval '45 days',
         'simulated'::source_type   -- §7: seed never claims 'live'; only a real
                                    -- sensor writer (post-G2) may insert 'live'.
  FROM (VALUES
    ('ph',         'الأس الهيدروجيني (pH)',   'pH',    5.8, 6.5),
    ('ec',         'التوصيلية الكهربائية (EC)', 'mS/cm', 1.6, 2.4),
    ('water_temp', 'حرارة الماء',              '°C',    18,  24),
    ('tank_level', 'مستوى الخزان',             '%',     30,  95),
    ('air_temp',   'حرارة الهواء',             '°C',    20,  30),
    ('humidity',   'الرطوبة النسبية',          '%',     50,  75),
    ('light',      'شدة الإضاءة (PAR)',        'µmol',  0,   900)
  ) AS sen(stype, sname, sunit, smin, smax)
  CROSS JOIN (VALUES ('site-asfan-rnd'), ('site-industrial-south'), ('site-demo')) AS s(site_id);

  PERFORM setseed(0.20260522);
  INSERT INTO readings (site_id, sensor_id, value, unit, status, source_type, recorded_at)
  SELECT sen.site_id, sen.id,
    ROUND(CAST(
      CASE sen.sensor_type
        WHEN 'light'      THEN GREATEST(0, centre * GREATEST(0, sin(((EXTRACT(hour FROM ts) - 6) / 24.0) * 2 * pi())) + (random() - 0.5) * 80)
        WHEN 'air_temp'   THEN centre + (random() - 0.5) * 0.8 + sin(((EXTRACT(hour FROM ts) - 6) / 24.0) * 2 * pi()) * 2.5
        WHEN 'humidity'   THEN centre + (random() - 0.5) * 2.4 - sin(((EXTRACT(hour FROM ts) - 6) / 24.0) * 2 * pi()) * 4
        WHEN 'tank_level' THEN 95 - ((idx_step % 96)::float / 96) * 25 + (random() - 0.5) * 1.2
        ELSE centre + (random() - 0.5) * 2 * noise_amp
      END
    AS numeric), 2)::double precision AS value,
    sen.unit, 'ok'::reading_status, sen.source_type, ts
  FROM sensors sen
  CROSS JOIN LATERAL (
    SELECT
      CASE sen.sensor_type
        WHEN 'ph' THEN 6.1 WHEN 'ec' THEN 2.0 WHEN 'water_temp' THEN 21.0
        WHEN 'tank_level' THEN 75.0 WHEN 'air_temp' THEN 25.0
        WHEN 'humidity' THEN 62.0 WHEN 'light' THEN 450.0
      END AS centre,
      CASE sen.sensor_type
        WHEN 'ph' THEN 0.05 WHEN 'ec' THEN 0.05 WHEN 'water_temp' THEN 0.3
        WHEN 'tank_level' THEN 1.5 WHEN 'air_temp' THEN 0.4
        WHEN 'humidity' THEN 1.2 WHEN 'light' THEN 80
      END AS noise_amp
  ) params
  CROSS JOIN LATERAL generate_series(0, 30 * 96 - 1) AS idx_step
  CROSS JOIN LATERAL (
    SELECT v_now - ((30 * 96 - idx_step) * 15 || ' minutes')::interval AS ts
  ) tcalc;

  SELECT COUNT(*) INTO v_total_readings FROM readings;

  -- EC excursion ramp
  INSERT INTO readings (site_id, sensor_id, value, unit, status, source_type, recorded_at)
  SELECT 'site-demo', 'sen-site-demo-ec', v, 'mS/cm',
    CASE WHEN v > 2.5 THEN 'critical'::reading_status WHEN v > 2.4 THEN 'warning'::reading_status ELSE 'ok'::reading_status END,
    'simulated'::source_type,
    v_now - ((8 - n) * 15 || ' minutes')::interval
  FROM unnest(ARRAY[2.05, 2.12, 2.28, 2.41, 2.55, 2.68, 2.78, 2.86]::double precision[])
       WITH ORDINALITY AS t(v, n);

  INSERT INTO alerts (id, site_id, sensor_id, severity, title, description, trigger_value, recommended_action, assigned_to, status, created_at) VALUES
    (v_ec_alert_id, 'site-demo', 'sen-site-demo-ec', 'p2',
     'ارتفاع EC خارج النطاق الآمن',
     'ارتفعت قراءة EC إلى 2.86 mS/cm متجاوزةً الحد الأعلى 2.4. النمط يشير إلى إفراط محتمل في الجرعات أو فقد ماء.',
     2.86, 'إيقاف الجرعات مؤقتاً + تأكيد قيم الخزان قبل الاستئناف.', NULL, 'open',
     v_now - interval '5 minutes'),
    (gen_random_uuid()::text, 'site-asfan-rnd', 'sen-site-asfan-rnd-humidity', 'p3',
     'رطوبة منخفضة (تنبيه إعلامي)',
     'انخفضت الرطوبة دون 55% خلال نافذة قصيرة. مراقبة فقط — لا يستلزم تدخّلاً.',
     52.4, 'مراقبة لمدة ساعتين. إن استمرّ، فعّل دورة ترطيب مساعدة.', NULL, 'open',
     v_now - interval '40 minutes'),
    (v_old_p1_id, 'site-industrial-south', 'sen-site-industrial-south-water_temp', 'p1',
     'ارتفاع حرارة الماء فوق العتبة الحرجة',
     'تجاوزت حرارة الماء 26°C — تمّ تفعيل التبريد ومعاينة المضخة.',
     26.4, 'تشغيل التبريد + فحص دوران المياه.', 'op-fahad', 'resolved',
     v_now - interval '3 days');

  UPDATE alerts SET acknowledged_at = v_now - interval '3 days', resolved_at = v_now - interval '3 days'
   WHERE id = v_old_p1_id;

  INSERT INTO ai_recommendations
    (id, site_id, related_alert_id, recommendation_type, recommendation, evidence_summary,
     confidence_label, requires_human_approval, approval_status, created_at)
  VALUES (
    gen_random_uuid()::text, 'site-demo', v_ec_alert_id, 'pause_dosing',
    'إيقاف وحدة الجرعات A/B مؤقتاً (15 دقيقة) ثم إعادة التقييم بعد دورة ري قصيرة.',
    'EC يرتفع بمعدل +0.10 كل 15 دقيقة منذ آخر 8 قراءات · pH مستقر عند 6.1 · مستوى الخزان انخفض 8% خلال نفس النافذة · لا توجد دورة جرعات مسجّلة في آخر ساعتين. النمط متّسق مع تركّز الأملاح بسبب فقد ماء، لا إفراط جرعات.',
    'high', true, 'pending', v_now - interval '3 minutes'
  );

  INSERT INTO maintenance_logs (site_id, device_id, related_alert_id, action_type, notes, performed_by, performed_at)
  VALUES ('site-industrial-south', 'dev-site-industrial-south-pump', v_old_p1_id, 'inspection',
          'فحص دورة المياه + استبدال مرشّح. الحرارة طبيعية.', 'op-fahad', v_now - interval '3 days');

  INSERT INTO cooling_water_logs
    (site_id, device_id, cooling_water_liters, irrigation_water_liters, vertical_temp_gradient,
     fan_extraction_rate, ambient_temp, optimization_active, recorded_at)
  SELECT s.id, 'dev-' || s.id || '-fan',
         ROUND(CAST((CASE WHEN d < 14 THEN 690 ELSE 950 END) + (random() - 0.5) * 70 AS numeric), 0)::double precision,
         ROUND(CAST(1850 + (random() - 0.5) * 80 AS numeric), 0)::double precision,
         ROUND(CAST(1.8 + (random() - 0.5) * 0.4 AS numeric), 2)::double precision,
         ROUND(CAST(72 + (random() - 0.5) * 10 AS numeric), 0)::double precision,
         ROUND(CAST(28 + (random() - 0.5) * 4 AS numeric), 1)::double precision,
         d < 14, v_now - (d || ' days')::interval
  FROM sites s
  CROSS JOIN generate_series(0, 30) d;

  INSERT INTO ro_telemetry
    (site_id, device_id, inlet_pressure, outlet_pressure, differential_pressure,
     ec_pre_filtration, ec_post_filtration, tds, salt_rejection_pct, membrane_health_status, recorded_at)
  SELECT s.id, 'dev-' || s.id || '-ro',
         ROUND(CAST(4.2 + (random() - 0.5) * 0.2 AS numeric), 2)::double precision,
         ROUND(CAST(2.9 + (random() - 0.5) * 0.2 AS numeric), 2)::double precision,
         ROUND(CAST(1.3 + (random() - 0.5) * 0.1 AS numeric), 2)::double precision,
         ROUND(CAST(2100 + (random() - 0.5) * 120 AS numeric), 0)::double precision,
         ROUND(CAST(85   + (random() - 0.5) * 16  AS numeric), 0)::double precision,
         ROUND(CAST(180  + (random() - 0.5) * 30  AS numeric), 0)::double precision,
         ROUND(CAST(96.5 + (random() - 0.5) * 0.8 AS numeric), 1)::double precision,
         CASE WHEN d > 20 THEN 'fair'::membrane_health ELSE 'good'::membrane_health END,
         v_now - (d || ' days')::interval
  FROM sites s
  CROSS JOIN generate_series(0, 30) d;

  INSERT INTO reports (id, site_id, report_type, period_start, period_end, summary, generated_by, generated_at, disclaimer) VALUES
    (gen_random_uuid()::text, 'site-asfan-rnd', 'weekly',
     v_now - interval '7 days', v_now,
     'أسبوع مستقر — لا تنبيهات حرجة · تحسّن مؤشر استهلاك مياه التبريد بعد تفعيل التحسين.',
     'system', v_now,
     'iGarden Smart OS · Reporting layer · compliance-ready · IFA-aligned · not certified. Cooling/irrigation water values are operational counters — not validated against MEWA/Naama systems.');

  RETURN jsonb_build_object(
    'sites', (SELECT COUNT(*) FROM sites),
    'devices', (SELECT COUNT(*) FROM devices),
    'sensors', (SELECT COUNT(*) FROM sensors),
    'readings', (SELECT COUNT(*) FROM readings),
    'alerts', (SELECT COUNT(*) FROM alerts),
    'ai_recommendations', (SELECT COUNT(*) FROM ai_recommendations),
    'cooling_water_logs', (SELECT COUNT(*) FROM cooling_water_logs),
    'ro_telemetry', (SELECT COUNT(*) FROM ro_telemetry),
    'reports', (SELECT COUNT(*) FROM reports)
  );
END;
$$;
