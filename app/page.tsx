'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ComposedChart } from 'recharts';
import { Sprout, Droplets, Thermometer, Wind, Zap, Activity, Settings, BarChart3, Layers, Download, AlertTriangle, CheckCircle2, TrendingUp, MapPin, Calendar, Beaker, Sun, Power, RefreshCw, Save, ChevronLeft, ChevronRight, Cpu, FlaskConical, Leaf, CloudRain, ShieldCheck, FileText, Clock, X, Eye, Printer, Languages, LogOut } from 'lucide-react';
import { REGULATORY_REFS, DISCLAIMER_TEXT, ESTABLISHMENT_INFO } from './compliance/standards';
import { calcComplianceScore, mockSHA, generateAuditEntries } from './compliance/compliance-engine';
import type { AuditEntry } from './compliance/compliance-engine';
import { useComplianceData } from './hooks/useComplianceData';
import { useSupabaseAuth }   from './hooks/useSupabaseAuth';
import type { AuditEventDisplay, BatchDisplay, WaterSourceDisplay } from './lib/compliance-data';
import { logReportExport } from './lib/report-exports';
import { uploadComplianceReportPdf } from './lib/report-storage';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { DemoAuthProvider, useDemoAuth } from './components/DemoAuthContext';
import { LoginScreen } from './components/LoginScreen';

// ═══════════════════════════════════════════════════════════════════
// 🌱 iGarden Smart OS — Demo Seed v1.0
// ازرع بذكاء — Tagline v1.0 (مُعتمد 27 أبريل 2026)
// ═══════════════════════════════════════════════════════════════════
// المعمارية تعكس Smart OS الحقيقي:
//   CROP_DB        → PostgreSQL table
//   REGIONS        → Climate baseline (ARAMCO/PME)
//   simulateLive() → سيُستبدل بـ MQTT subscriber
//   recommend()    → سينتقل إلى FastAPI: /api/recommend
//   zonesState     → سيُربط بـ Garden Hub Smart OS state
// ═══════════════════════════════════════════════════════════════════

const C = {
  forest: '#0F3D2E', forestDark: '#08291E', forestLight: '#1A5D45',
  lime: '#7CB342', limeDark: '#5A8A2C', limeLight: '#9BCB5E',
  cream: '#FAFAF7', creamDark: '#F0EFE8',
  ink: '#1F2937', inkSoft: '#4B5563', muted: '#9CA3AF',
  border: '#E5E1D8', warn: '#D97706', danger: '#B91C1C', ok: '#059669',
};

// ─── قاعدة بيانات المحاصيل (12 محصول) ───
const CROP_DB = {
  tomato: { name: 'طماطم', icon: '🍅', category: 'ثمري', cycleDays: 120,
    stages: {
      seedling:   { name: 'الإنبات والشتل', days: '0-21',  ec: [1.2, 1.6], ph: [5.8, 6.2], temp: [22, 26], humidity: [65, 75], npk: { n: 120, p: 50,  k: 150 }, irrigation: { freq: 4,  duration: 60  } },
      vegetative: { name: 'النمو الخضري',   days: '22-45', ec: [2.0, 2.5], ph: [5.8, 6.2], temp: [21, 27], humidity: [60, 70], npk: { n: 180, p: 60,  k: 200 }, irrigation: { freq: 6,  duration: 90  } },
      flowering:  { name: 'الإزهار',         days: '46-75', ec: [2.5, 3.0], ph: [5.8, 6.2], temp: [20, 26], humidity: [55, 65], npk: { n: 150, p: 80,  k: 280 }, irrigation: { freq: 8,  duration: 90  } },
      fruiting:   { name: 'الإثمار',         days: '76-120',ec: [3.0, 3.5], ph: [6.0, 6.4], temp: [19, 25], humidity: [55, 65], npk: { n: 130, p: 70,  k: 350 }, irrigation: { freq: 10, duration: 120 } },
    } },
  cucumber: { name: 'خيار', icon: '🥒', category: 'ثمري', cycleDays: 75,
    stages: {
      seedling:   { name: 'الإنبات',         days: '0-14',  ec: [1.4, 1.8], ph: [5.8, 6.0], temp: [24, 28], humidity: [70, 80], npk: { n: 130, p: 50, k: 160 }, irrigation: { freq: 4,  duration: 50  } },
      vegetative: { name: 'النمو الخضري',   days: '15-35', ec: [2.0, 2.4], ph: [5.8, 6.0], temp: [22, 28], humidity: [65, 75], npk: { n: 200, p: 60, k: 220 }, irrigation: { freq: 7,  duration: 80  } },
      flowering:  { name: 'الإزهار',         days: '36-50', ec: [2.4, 2.8], ph: [5.8, 6.2], temp: [22, 26], humidity: [60, 70], npk: { n: 170, p: 75, k: 260 }, irrigation: { freq: 9,  duration: 100 } },
      fruiting:   { name: 'الإثمار',         days: '51-75', ec: [2.8, 3.2], ph: [6.0, 6.4], temp: [21, 26], humidity: [55, 65], npk: { n: 150, p: 70, k: 320 }, irrigation: { freq: 12, duration: 110 } },
    } },
  lettuce: { name: 'خس', icon: '🥬', category: 'ورقي', cycleDays: 45,
    stages: {
      seedling:   { name: 'الإنبات',       days: '0-10',  ec: [0.8, 1.2], ph: [5.8, 6.2], temp: [18, 22], humidity: [65, 75], npk: { n: 100, p: 40, k: 120 }, irrigation: { freq: 3, duration: 40 } },
      vegetative: { name: 'النمو الخضري', days: '11-30', ec: [1.2, 1.6], ph: [5.8, 6.2], temp: [16, 22], humidity: [60, 70], npk: { n: 150, p: 50, k: 180 }, irrigation: { freq: 5, duration: 60 } },
      mature:     { name: 'النضج',         days: '31-45', ec: [1.4, 1.8], ph: [5.8, 6.2], temp: [15, 20], humidity: [55, 65], npk: { n: 130, p: 45, k: 200 }, irrigation: { freq: 6, duration: 70 } },
    } },
  strawberry: { name: 'فراولة', icon: '🍓', category: 'ثمري', cycleDays: 90,
    stages: {
      seedling:   { name: 'الإنبات',         days: '0-20',  ec: [1.0, 1.4], ph: [5.5, 6.0], temp: [18, 22], humidity: [65, 75], npk: { n: 100, p: 45, k: 130 }, irrigation: { freq: 4, duration: 50 } },
      vegetative: { name: 'النمو الخضري',   days: '21-45', ec: [1.4, 1.8], ph: [5.5, 6.0], temp: [17, 23], humidity: [60, 70], npk: { n: 140, p: 55, k: 180 }, irrigation: { freq: 5, duration: 70 } },
      flowering:  { name: 'الإزهار',         days: '46-65', ec: [1.6, 2.0], ph: [5.5, 6.0], temp: [16, 22], humidity: [55, 65], npk: { n: 120, p: 70, k: 230 }, irrigation: { freq: 6, duration: 80 } },
      fruiting:   { name: 'الإثمار',         days: '66-90', ec: [1.8, 2.2], ph: [5.8, 6.2], temp: [15, 21], humidity: [55, 65], npk: { n: 100, p: 60, k: 280 }, irrigation: { freq: 7, duration: 90 } },
    } },
  pepper: { name: 'فلفل', icon: '🌶️', category: 'ثمري', cycleDays: 110,
    stages: {
      seedling:   { name: 'الإنبات',         days: '0-21',   ec: [1.4, 1.8], ph: [5.8, 6.2], temp: [22, 26], humidity: [65, 75], npk: { n: 130, p: 55, k: 160 }, irrigation: { freq: 4,  duration: 55  } },
      vegetative: { name: 'النمو الخضري',   days: '22-50',  ec: [2.0, 2.5], ph: [5.8, 6.2], temp: [22, 28], humidity: [60, 70], npk: { n: 180, p: 65, k: 220 }, irrigation: { freq: 6,  duration: 85  } },
      flowering:  { name: 'الإزهار',         days: '51-75',  ec: [2.5, 3.0], ph: [5.8, 6.2], temp: [21, 27], humidity: [55, 65], npk: { n: 150, p: 80, k: 280 }, irrigation: { freq: 8,  duration: 95  } },
      fruiting:   { name: 'الإثمار',         days: '76-110', ec: [2.8, 3.2], ph: [6.0, 6.4], temp: [20, 26], humidity: [55, 65], npk: { n: 130, p: 70, k: 320 }, irrigation: { freq: 10, duration: 110 } },
    } },
  eggplant: { name: 'باذنجان', icon: '🍆', category: 'ثمري', cycleDays: 100,
    stages: {
      seedling:   { name: 'الإنبات',         days: '0-20',   ec: [1.4, 1.8], ph: [5.8, 6.2], temp: [22, 27], humidity: [65, 75], npk: { n: 125, p: 50, k: 155 }, irrigation: { freq: 4,  duration: 55  } },
      vegetative: { name: 'النمو الخضري',   days: '21-45',  ec: [2.0, 2.5], ph: [5.8, 6.2], temp: [22, 28], humidity: [60, 70], npk: { n: 175, p: 60, k: 210 }, irrigation: { freq: 6,  duration: 85  } },
      flowering:  { name: 'الإزهار',         days: '46-70',  ec: [2.5, 2.9], ph: [5.8, 6.2], temp: [21, 27], humidity: [55, 65], npk: { n: 145, p: 75, k: 265 }, irrigation: { freq: 8,  duration: 95  } },
      fruiting:   { name: 'الإثمار',         days: '71-100', ec: [2.8, 3.2], ph: [6.0, 6.4], temp: [20, 26], humidity: [55, 65], npk: { n: 125, p: 65, k: 310 }, irrigation: { freq: 10, duration: 105 } },
    } },
  mint: { name: 'نعناع', icon: '🌿', category: 'عطري', cycleDays: 60,
    stages: {
      seedling:   { name: 'الإنبات',       days: '0-14',  ec: [1.0, 1.4], ph: [6.0, 7.0], temp: [18, 24], humidity: [70, 80], npk: { n: 110, p: 40, k: 130 }, irrigation: { freq: 4, duration: 50 } },
      vegetative: { name: 'النمو الخضري', days: '15-40', ec: [1.6, 2.0], ph: [6.0, 7.0], temp: [18, 24], humidity: [65, 75], npk: { n: 160, p: 50, k: 180 }, irrigation: { freq: 6, duration: 70 } },
      mature:     { name: 'النضج',         days: '41-60', ec: [1.8, 2.2], ph: [6.0, 7.0], temp: [17, 23], humidity: [60, 70], npk: { n: 140, p: 45, k: 200 }, irrigation: { freq: 7, duration: 75 } },
    } },
  basil: { name: 'ريحان', icon: '🌱', category: 'عطري', cycleDays: 65,
    stages: {
      seedling:   { name: 'الإنبات',       days: '0-14',  ec: [1.0, 1.4], ph: [5.5, 6.5], temp: [20, 25], humidity: [65, 75], npk: { n: 120, p: 45, k: 140 }, irrigation: { freq: 4, duration: 50 } },
      vegetative: { name: 'النمو الخضري', days: '15-45', ec: [1.6, 2.0], ph: [5.5, 6.5], temp: [20, 26], humidity: [60, 70], npk: { n: 170, p: 55, k: 190 }, irrigation: { freq: 6, duration: 70 } },
      mature:     { name: 'النضج',         days: '46-65', ec: [1.8, 2.2], ph: [5.5, 6.5], temp: [19, 25], humidity: [55, 65], npk: { n: 150, p: 50, k: 210 }, irrigation: { freq: 7, duration: 75 } },
    } },
  arugula: { name: 'جرجير', icon: '🥗', category: 'ورقي', cycleDays: 35,
    stages: {
      seedling:   { name: 'الإنبات',       days: '0-7',   ec: [0.8, 1.2], ph: [6.0, 6.8], temp: [16, 22], humidity: [65, 75], npk: { n: 100, p: 40, k: 120 }, irrigation: { freq: 3, duration: 40 } },
      vegetative: { name: 'النمو الخضري', days: '8-25',  ec: [1.2, 1.6], ph: [6.0, 6.8], temp: [16, 22], humidity: [60, 70], npk: { n: 140, p: 50, k: 170 }, irrigation: { freq: 5, duration: 55 } },
      mature:     { name: 'النضج',         days: '26-35', ec: [1.4, 1.8], ph: [6.0, 6.8], temp: [15, 20], humidity: [55, 65], npk: { n: 120, p: 45, k: 190 }, irrigation: { freq: 6, duration: 65 } },
    } },
  spinach: { name: 'سبانخ', icon: '🥬', category: 'ورقي', cycleDays: 40,
    stages: {
      seedling:   { name: 'الإنبات',       days: '0-10',  ec: [0.8, 1.2], ph: [6.0, 7.0], temp: [15, 20], humidity: [65, 75], npk: { n: 105, p: 40, k: 125 }, irrigation: { freq: 3, duration: 40 } },
      vegetative: { name: 'النمو الخضري', days: '11-30', ec: [1.4, 1.8], ph: [6.0, 7.0], temp: [15, 20], humidity: [60, 70], npk: { n: 160, p: 50, k: 180 }, irrigation: { freq: 5, duration: 60 } },
      mature:     { name: 'النضج',         days: '31-40', ec: [1.6, 2.0], ph: [6.0, 7.0], temp: [14, 19], humidity: [55, 65], npk: { n: 140, p: 45, k: 200 }, irrigation: { freq: 6, duration: 65 } },
    } },
  fodder: { name: 'أعلاف خضراء', icon: '🌾', category: 'علفي', cycleDays: 8,
    stages: {
      sprouting: { name: 'الإنبات', days: '0-3', ec: [0.5, 1.0], ph: [6.0, 7.0], temp: [18, 22], humidity: [80, 90], npk: { n: 60, p: 25, k: 80  }, irrigation: { freq: 12, duration: 30 } },
      growth:    { name: 'النمو',   days: '4-8', ec: [0.8, 1.2], ph: [6.0, 7.0], temp: [20, 24], humidity: [70, 80], npk: { n: 90, p: 35, k: 110 }, irrigation: { freq: 16, duration: 35 } },
    } },
  parsley: { name: 'بقدونس', icon: '🌿', category: 'عطري', cycleDays: 70,
    stages: {
      seedling:   { name: 'الإنبات',       days: '0-21',  ec: [0.8, 1.2], ph: [6.0, 7.0], temp: [16, 22], humidity: [65, 75], npk: { n: 100, p: 40, k: 120 }, irrigation: { freq: 3, duration: 45 } },
      vegetative: { name: 'النمو الخضري', days: '22-50', ec: [1.4, 1.8], ph: [6.0, 7.0], temp: [16, 23], humidity: [60, 70], npk: { n: 145, p: 50, k: 175 }, irrigation: { freq: 5, duration: 65 } },
      mature:     { name: 'النضج',         days: '51-70', ec: [1.6, 2.0], ph: [6.0, 7.0], temp: [15, 22], humidity: [55, 65], npk: { n: 130, p: 45, k: 195 }, irrigation: { freq: 6, duration: 70 } },
    } },
};

// ─── المناطق السعودية الأربع ───
const REGIONS = {
  jeddah:  { name: 'جدة',     icon: '🌊', desc: 'ساحلي · رطوبة عالية · حرارة شديدة',           avgTempSummer: 38, avgTempWinter: 23, avgHumidity: 65, waterTDS: 450, tempBias: -1.5, humidityBias: -3, ecBoost: 1.0,  note: 'تكييف مكثّف صيفاً + إزالة رطوبة في الإثمار' },
  riyadh:  { name: 'الرياض',  icon: '🏜️', desc: 'صحراوي · جاف · فارق حراري كبير ليلاً',         avgTempSummer: 42, avgTempWinter: 14, avgHumidity: 25, waterTDS: 650, tempBias: -2.0, humidityBias: +5, ecBoost: 0.95, note: 'تبخير + ضباب لرفع الرطوبة + EC منخفض' },
  abha:    { name: 'أبها',    icon: '⛰️', desc: 'جبلي · معتدل · مناسب لمحاصيل ورقية',             avgTempSummer: 26, avgTempWinter: 12, avgHumidity: 55, waterTDS: 250, tempBias: 0,    humidityBias: 0,  ecBoost: 1.0,  note: 'المناخ المثالي — أقل تدخل مطلوب' },
  tabuk:   { name: 'تبوك',    icon: '🌵', desc: 'صحراوي معتدل · شتاء بارد · صيف معتدل',           avgTempSummer: 36, avgTempWinter: 8,  avgHumidity: 35, waterTDS: 400, tempBias: -1.0, humidityBias: +2, ecBoost: 1.0,  note: 'تدفئة شتوية + تظليل صيفي خفيف' },
};

// ─── محرّك التوصيات ───
function recommend(cropKey, stageKey, regionKey) {
  const crop = CROP_DB[cropKey];
  const stage = crop?.stages?.[stageKey];
  const region = REGIONS[regionKey];
  if (!crop || !stage || !region) return null;
  const tempAdj = [stage.temp[0] + region.tempBias, stage.temp[1] + region.tempBias];
  const humAdj = [Math.max(40, stage.humidity[0] + region.humidityBias), Math.min(90, stage.humidity[1] + region.humidityBias)];
  const ecAdj = [+(stage.ec[0] * region.ecBoost).toFixed(2), +(stage.ec[1] * region.ecBoost).toFixed(2)];
  return {
    crop: crop.name, cropIcon: crop.icon, stage: stage.name, days: stage.days, region: region.name,
    targets: { temp: tempAdj, humidity: humAdj, ec: ecAdj, ph: stage.ph, npk: stage.npk },
    irrigation: stage.irrigation, regionNote: region.note, waterQuality: region.waterTDS,
  };
}

// ─── مولّد بيانات تاريخية ───
function generateHistoricalData(regionKey, days = 90, seed = 1) {
  const region = REGIONS[regionKey];
  const now = Date.now();
  const data = [];
  const r = (i) => { const x = Math.sin(i * seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
  for (let d = days - 1; d >= 0; d--) {
    const t = now - d * 86400000;
    const dayOfYear = new Date(t).getMonth() * 30 + new Date(t).getDate();
    const seasonal = Math.cos(((dayOfYear - 15) / 365) * 2 * Math.PI);
    const baseTemp = (region.avgTempSummer + region.avgTempWinter) / 2;
    const tempAmp = (region.avgTempSummer - region.avgTempWinter) / 2;
    const outsideTemp = baseTemp - seasonal * tempAmp + (r(d) - 0.5) * 3;
    const tempIn = 22 + Math.sin(d * 0.3) * 2 + (r(d + 100) - 0.5) * 1.5;
    const humIn = 62 + Math.cos(d * 0.25) * 8 + (r(d + 200) - 0.5) * 4;
    const ec = 2.2 + Math.sin(d * 0.4) * 0.3 + (r(d + 300) - 0.5) * 0.15;
    const ph = 6.0 + Math.cos(d * 0.35) * 0.2 + (r(d + 400) - 0.5) * 0.1;
    const co2 = 800 + Math.sin(d * 0.2) * 150 + (r(d + 500) - 0.5) * 80;
    const water = 280 + Math.sin(d * 0.5) * 60 + (r(d + 600) - 0.5) * 40;
    const energy = 18 + Math.max(0, outsideTemp - 22) * 0.8 + (r(d + 700) - 0.5) * 3;
    data.push({
      date: new Date(t).toISOString().slice(5, 10),
      dateFull: new Date(t).toISOString().slice(0, 10),
      tempIn: +tempIn.toFixed(1), tempOut: +outsideTemp.toFixed(1),
      humIn: +humIn.toFixed(1), ec: +ec.toFixed(2), ph: +ph.toFixed(2),
      co2: +co2.toFixed(0), water: +water.toFixed(1), energy: +Math.max(8, energy).toFixed(1),
    });
  }
  return data;
}

// ─── المناطق الافتراضية ───
const DEFAULT_ZONES = [
  { id: 'zone_a', name: 'محمية A — طماطم',  region: 'jeddah', crop: 'tomato',  stage: 'flowering',  plantedDate: '2026-02-10', area: 200, enabled: true,  auto: true,  devices: { climate: true, fertigation: true, irrigation: true, energy: true } },
  { id: 'zone_b', name: 'محمية B — خس',     region: 'abha',   crop: 'lettuce', stage: 'vegetative', plantedDate: '2026-04-01', area: 120, enabled: true,  auto: true,  devices: { climate: true, fertigation: true, irrigation: true, energy: true } },
  { id: 'zone_c', name: 'وحدة الأعلاف',     region: 'riyadh', crop: 'fodder',  stage: 'growth',     plantedDate: '2026-04-22', area: 50,  enabled: true,  auto: false, devices: { climate: true, fertigation: false, irrigation: true, energy: true } },
];

// ─── محاكاة قراءات الحساسات الحية ───
function simulateLive(zone, prev) {
  const rec = recommend(zone.crop, zone.stage, zone.region);
  if (!rec) return prev;
  const drift = (target, current, speed = 0.15) => {
    const mid = (target[0] + target[1]) / 2;
    const diff = mid - current;
    return current + diff * speed + (Math.random() - 0.5) * 0.3;
  };
  return {
    temp: zone.enabled ? +drift(rec.targets.temp, prev?.temp ?? 22).toFixed(1) : (prev?.temp ?? 22),
    humidity: zone.enabled ? +drift(rec.targets.humidity, prev?.humidity ?? 60, 0.1).toFixed(1) : (prev?.humidity ?? 60),
    ec: zone.enabled ? +drift(rec.targets.ec, prev?.ec ?? 2.0, 0.2).toFixed(2) : (prev?.ec ?? 0),
    ph: zone.enabled ? +drift(rec.targets.ph, prev?.ph ?? 6.0, 0.2).toFixed(2) : (prev?.ph ?? 7),
    co2: zone.enabled ? Math.round(800 + (Math.random() - 0.5) * 100) : 400,
    waterLevel: zone.enabled ? +Math.max(20, Math.min(100, (prev?.waterLevel ?? 85) - 0.05 + (Math.random() < 0.02 ? 15 : 0))).toFixed(1) : (prev?.waterLevel ?? 85),
    pumpOn: Math.random() < 0.3,
    fanOn: zone.enabled && (prev?.temp ?? 22) > rec.targets.temp[1],
    coolerOn: zone.enabled && (prev?.temp ?? 22) > rec.targets.temp[1] + 1,
    heaterOn: zone.enabled && (prev?.temp ?? 22) < rec.targets.temp[0] - 1,
    misterOn: zone.enabled && (prev?.humidity ?? 60) < rec.targets.humidity[0],
    solarPower: Math.round(2200 + Math.sin(Date.now() / 60000) * 500 + (Math.random() - 0.5) * 200),
    gridDraw: Math.round(800 + (Math.random() - 0.5) * 200),
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🌿 شعار iGarden الرسمي — يُحمّل من /public/branding
// نسختان: بيضاء على شفاف للهيدر، خضراء على شفاف للفوتر والمواد
// ═══════════════════════════════════════════════════════════════════
function IGardenLogo({ variant = 'white', size = 44 }: { variant?: 'white' | 'green'; size?: number }) {
  const src = variant === 'green'
    ? '/branding/icon-master-original.png'
    : '/branding/icon-master-white.png';
  return (
    <img
      src={src}
      alt="iGarden logo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, display: 'block' }}
      loading="eager"
      decoding="async"
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// المكوّن الرئيسي — مع Providers + Login Gate
// ═══════════════════════════════════════════════════════════════════
export default function DemoPage() {
  return (
    <I18nProvider defaultLocale="ar">
      <DemoAuthProvider>
        <RootGate />
      </DemoAuthProvider>
    </I18nProvider>
  );
}

function RootGate() {
  const auth = useDemoAuth();
  if (!auth.ready) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF7' }}>...</div>;
  }
  if (!auth.signedIn) return <LoginScreen />;
  return <DemoApp />;
}

function DemoApp() {
  const { t, locale, setLocale, dir } = useI18n();
  const auth = useDemoAuth();
  const [activeTab, setActiveTab] = useState('live');
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState('zone_a');
  const [liveReadings, setLiveReadings] = useState({});
  const [isRunning, setIsRunning] = useState(true);
  const [historicalData, setHistoricalData] = useState({});
  const [storageReady, setStorageReady] = useState(false);
  const [overrides, setOverrides] = useState({}); // user manual overrides per zone
  const isMobile = useIsMobile(640);

  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

  // ضمان viewport meta لكل أجهزة الجوال (في حال تشغيله ضمن iframe)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta') as HTMLMetaElement;
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
  }, []);

  // تحميل من localStorage (يبقى عبر إغلاق التبويب) — مع دعم Claude Artifacts كـ fallback
  useEffect(() => {
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        // Claude Artifacts environment
        const w = window as any;
        if (w.storage) {
          const z = await w.storage.get('zones');
          if (z?.value) setZones(JSON.parse(z.value));
          const o = await w.storage.get('overrides');
          if (o?.value) setOverrides(JSON.parse(o.value));
        } else {
          // Production environment — localStorage (يبقى عبر إغلاق التبويب)
          const z = localStorage.getItem('igarden_zones');
          if (z) setZones(JSON.parse(z));
          const o = localStorage.getItem('igarden_overrides');
          if (o) setOverrides(JSON.parse(o));
        }
      } catch (e) { /* key not found or invalid JSON */ }
      setStorageReady(true);
    })();
  }, []);

  // حفظ تلقائي في localStorage
  useEffect(() => {
    if (!storageReady) return;
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const w = window as any;
        if (w.storage) {
          await w.storage.set('zones', JSON.stringify(zones));
          await w.storage.set('overrides', JSON.stringify(overrides));
        } else {
          localStorage.setItem('igarden_zones', JSON.stringify(zones));
          localStorage.setItem('igarden_overrides', JSON.stringify(overrides));
        }
      } catch (e) { /* ignore quota errors */ }
    })();
  }, [zones, overrides, storageReady]);

  // توليد البيانات التاريخية مرة واحدة
  useEffect(() => {
    const data = {};
    Object.keys(REGIONS).forEach((r, i) => { data[r] = generateHistoricalData(r, 90, i + 1); });
    setHistoricalData(data);
  }, []);

  // محاكاة حية كل ثانيتين
  useEffect(() => {
    if (!isRunning) return;
    const tick = () => {
      setLiveReadings(prev => {
        const next = {};
        zones.forEach(z => { next[z.id] = simulateLive(z, prev[z.id]); });
        return next;
      });
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [zones, isRunning]);

  const tabs = [
    { id: 'live',       label: t.tabs.live,       icon: Activity },
    { id: 'engine',     label: t.tabs.engine,     icon: Sprout },
    { id: 'history',    label: t.tabs.history,    icon: BarChart3 },
    { id: 'zones',      label: t.tabs.zones,      icon: Layers },
    { id: 'compliance', label: t.tabs.compliance, icon: ShieldCheck },
  ];

  const fontFamily = locale === 'ar'
    ? "'Tajawal', 'Segoe UI', system-ui, sans-serif"
    : "'Segoe UI', system-ui, -apple-system, sans-serif";

  return (
    <div dir={dir} lang={locale} style={{ fontFamily, background: C.cream, minHeight: '100vh', color: C.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet" />

      {/* ═══ Header ═══ */}
      <header style={{ background: `linear-gradient(180deg, ${C.forest} 0%, ${C.forestDark} 100%)`, borderBottom: `3px solid ${C.lime}`, padding: isMobile ? '12px 14px' : '14px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: isMobile ? 8 : 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, minWidth: 0 }}>
            <IGardenLogo variant="green" size={isMobile ? 38 : 48} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>iGarden <span style={{ color: C.limeLight, fontSize: isMobile ? 13 : 16, fontWeight: 500 }}>{t.header.appShort}</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.limeLight, fontSize: isMobile ? 11 : 12, background: 'rgba(255,255,255,0.08)', padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 20, border: `1px solid ${C.lime}40` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isRunning ? C.lime : C.muted, boxShadow: isRunning ? `0 0 10px ${C.lime}` : 'none', animation: isRunning ? 'pulse 1.5s infinite' : 'none', flexShrink: 0 }}></span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{isRunning ? (isMobile ? t.common.livePulseShort : t.common.livePulse) : t.common.paused}</span>
            </div>
            {/* ─── Live Operations CTA (link to /operations) ─── */}
            <a
              href="/operations/demo"
              title="العرض الحيّ · Live Operations"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.lime, color: C.forestDark, border: `1px solid ${C.lime}`, padding: isMobile ? '6px 12px' : '7px 14px', borderRadius: 20, fontFamily: 'inherit', fontSize: isMobile ? 11 : 12, fontWeight: 800, textDecoration: 'none', letterSpacing: '0.01em' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.forestDark }} />
              {isMobile ? 'العرض الحيّ' : 'العرض الحيّ · Live Operations'} ←
            </a>
            <button
              type="button"
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              title={t.login.languageLabel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', color: C.limeLight, border: `1px solid ${C.lime}40`, padding: isMobile ? '6px 10px' : '7px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: isMobile ? 11 : 12, fontWeight: 700 }}
            >
              <Languages size={13} /> {locale === 'ar' ? 'EN' : 'ع'}
            </button>
            <button
              type="button"
              onClick={() => auth.signOut()}
              title={t.common.signOut}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', color: '#FCA5A5', border: '1px solid rgba(252,165,165,0.4)', padding: isMobile ? '6px 10px' : '7px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: isMobile ? 11 : 12, fontWeight: 700 }}
            >
              <LogOut size={13} /> {!isMobile && t.common.signOut}
            </button>
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }`}</style>
      </header>

      {/* ═══ Tabs ═══ */}
      <nav style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: isMobile ? '0 14px' : '0 24px', position: 'sticky', top: isMobile ? 64 : 76, zIndex: 40 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          <style>{`nav div::-webkit-scrollbar { display: none; }`}</style>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                background: 'none', border: 'none', padding: isMobile ? '12px 14px' : '14px 20px', cursor: 'pointer',
                color: active ? C.forest : C.inkSoft, fontWeight: active ? 700 : 500, fontSize: isMobile ? 13 : 14,
                borderBottom: active ? `3px solid ${C.lime}` : '3px solid transparent', marginBottom: -1,
                display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all .15s', flexShrink: 0,
              }}>
                <Icon size={isMobile ? 14 : 16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ═══ Transparency Banner ═══ */}
      <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '9px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12, fontSize: isMobile ? 11 : 12, color: '#92400E', fontWeight: 500, lineHeight: 1.5 }}>
        <span>{t.banner.transparency}</span>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}>{t.banner.chipDemo}</span>
          <span style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#1E40AF' }}>{t.banner.chipSimulated}</span>
          <span style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#166534' }}>{t.banner.chipNotCert}</span>
        </span>
      </div>

      {/* ═══ المحتوى ═══ */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? 14 : 24 }}>
        {activeTab === 'live' && <LiveDashboard isMobile={isMobile} zones={zones} setZones={setZones} selectedZoneId={selectedZoneId} setSelectedZoneId={setSelectedZoneId} liveReadings={liveReadings} overrides={overrides} setOverrides={setOverrides} />}
        {activeTab === 'engine' && <CropEngine isMobile={isMobile} zones={zones} setZones={setZones} overrides={overrides} setOverrides={setOverrides} />}
        {activeTab === 'history' && <HistoryTab isMobile={isMobile} historicalData={historicalData} zones={zones} />}
        {activeTab === 'zones' && <ZonesSettings isMobile={isMobile} zones={zones} setZones={setZones} />}
        {activeTab === 'compliance' && <ComplianceTab isMobile={isMobile} historicalData={historicalData} zones={zones} />}
      </main>

      {/* ═══ Footer ═══ */}
      <footer style={{ background: C.forestDark, color: C.limeLight, padding: isMobile ? '24px 14px 16px' : '36px 24px 22px', marginTop: 40, borderTop: `3px solid ${C.lime}` }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Brand + Tagline + CTA */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 18 : 24, alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: isMobile ? 18 : 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <IGardenLogo variant="green" size={isMobile ? 48 : 60} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.01em' }}>iGarden</div>
                <div style={{ fontSize: isMobile ? 13 : 15, color: C.lime, marginTop: 6, fontWeight: 700, letterSpacing: '0.02em' }}>{t.common.tagline}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 8, width: isMobile ? '100%' : 'auto' }}>
              <a href="https://igarden.sa" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: C.lime, color: C.forestDark, borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'all .15s' }}>
                {t.common.visitWebsite} ↗
              </a>
              <div style={{ fontSize: 11, color: C.limeLight, opacity: 0.65 }}>{t.common.forConsulting}</div>
            </div>
          </div>

          {/* Production-readiness note */}
          <div style={{ background: 'rgba(124,179,66,0.08)', border: `1px dashed ${C.lime}40`, borderRadius: 8, padding: '10px 14px', marginBottom: isMobile ? 14 : 16, fontSize: 11, color: C.limeLight, lineHeight: 1.7 }}>
            {t.footer.productionReady}
          </div>

          {/* Signature Line */}
          <div style={{ textAlign: 'center', padding: isMobile ? '12px 0 14px' : '14px 0 18px', marginBottom: isMobile ? 14 : 18, borderTop: `1px solid rgba(124, 179, 66, 0.18)`, borderBottom: `1px solid rgba(124, 179, 66, 0.18)` }}>
            <div style={{ fontSize: isMobile ? 14 : 16, color: '#fff', fontWeight: 700, letterSpacing: '0.01em', lineHeight: 1.5 }}>
              {t.common.signature}
            </div>
          </div>

          {/* Demo notice + copyright */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 8 : 14, justifyContent: 'space-between', alignItems: 'center', fontSize: isMobile ? 10 : 11, color: C.limeLight, opacity: 0.6 }}>
            <div>
              <strong style={{ color: '#fff', fontWeight: 600 }}>{t.common.demoSeedV1}</strong>
              {!isMobile && (<><span style={{ margin: '0 8px' }}>·</span>{t.common.demoNote}</>)}
            </div>
            <div>{t.common.copyright}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🟢 1) Live Dashboard
// ═══════════════════════════════════════════════════════════════════
function LiveDashboard({ zones, setZones, selectedZoneId, setSelectedZoneId, liveReadings, overrides, setOverrides, isMobile }) {
  const { t } = useI18n();
  const zone = zones.find(z => z.id === selectedZoneId) || zones[0];
  if (!zone) return <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>{t.live.noZones}</div>;

  const reading = liveReadings[zone.id] || {};
  const baseRec = recommend(zone.crop, zone.stage, zone.region);
  const ovr = overrides[zone.id] || {};
  const targets = {
    temp: ovr.temp || baseRec?.targets.temp,
    humidity: ovr.humidity || baseRec?.targets.humidity,
    ec: ovr.ec || baseRec?.targets.ec,
    ph: ovr.ph || baseRec?.targets.ph,
  };

  const status = (val, target) => {
    if (!target || val == null) return 'unknown';
    if (val < target[0]) return 'low';
    if (val > target[1]) return 'high';
    return 'ok';
  };

  return (
    <div>
      {/* Demo Badges Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '4px 10px', borderRadius: 20 }}>{t.live.demoMode}</span>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 20 }}>{t.live.simulated}</span>
        <span style={{ fontSize: 11, color: C.muted, marginRight: 'auto' }}>{t.live.refreshNote}</span>
      </div>
      {/* Zone Selector */}
      <div style={{ display: 'flex', gap: isMobile ? 8 : 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {zones.map(z => {
          const r = liveReadings[z.id] || {};
          const sel = z.id === selectedZoneId;
          return (
            <button key={z.id} onClick={() => setSelectedZoneId(z.id)} style={{
              flex: isMobile ? '1 1 100%' : '1 1 220px', minWidth: 0, background: sel ? C.forest : '#fff', color: sel ? '#fff' : C.ink,
              border: `2px solid ${sel ? C.forest : C.border}`, borderRadius: 12, padding: '12px 14px',
              cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit', transition: 'all .15s',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name}</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: z.enabled ? C.lime : C.muted, flexShrink: 0 }}></span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>{REGIONS[z.region].icon} {REGIONS[z.region].name} · {CROP_DB[z.crop].icon} {CROP_DB[z.crop].name}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{r.temp ? `${r.temp}°C · ${r.humidity}% · EC ${r.ec}` : '—'}</div>
            </button>
          );
        })}
      </div>

      {/* Zone Info Banner */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 12 : 16, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: isMobile ? 10 : 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, minWidth: 0, flex: '1 1 auto' }}>
          <div style={{ width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 12, background: C.creamDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 22 : 28, flexShrink: 0 }}>{CROP_DB[zone.crop].icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 17, color: C.forest, overflow: 'hidden', textOverflow: 'ellipsis' }}>{zone.name}</div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: C.inkSoft, marginTop: 2 }}>
              {CROP_DB[zone.crop].name} · {CROP_DB[zone.crop].stages[zone.stage]?.name} · {zone.area} م²
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge color={zone.enabled ? C.ok : C.muted} text={zone.enabled ? t.live.activeZone : t.live.inactiveZone} />
          <Badge color={zone.auto ? C.lime : C.warn} text={zone.auto ? t.live.autoMode : t.live.manualMode} />
          {!isMobile && <Badge color={C.forestLight} text={`${REGIONS[zone.region].icon} ${REGIONS[zone.region].name}`} />}
        </div>
      </div>

      {/* أربع الوحدات */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? 12 : 16, marginBottom: 20 }}>
        <ControlCard
          title={t.live.climateSwitch}
          subtitle={t.live.climateSubtitle}
          icon={Thermometer}
          enabled={zone.devices.climate}
          color={C.forest}
          metrics={[
            { label: t.live.airTemp, value: reading.temp ?? '—', unit: '°C', target: targets.temp, status: status(reading.temp, targets.temp), icon: Thermometer },
            { label: t.live.humidity, value: reading.humidity ?? '—', unit: '%', target: targets.humidity, status: status(reading.humidity, targets.humidity), icon: CloudRain },
            { label: t.live.co2, value: reading.co2 ?? '—', unit: 'ppm', target: [600, 1200], status: status(reading.co2, [600, 1200]), icon: Wind },
          ]}
          actuators={[
            { name: t.live.fan, on: reading.fanOn },
            { name: t.live.cooler, on: reading.coolerOn },
            { name: t.live.heater, on: reading.heaterOn },
            { name: t.live.mister, on: reading.misterOn },
          ]}
        />
        <ControlCard
          title={t.live.fertigationSwitch}
          subtitle={t.live.fertigationSubtitle}
          icon={Beaker}
          enabled={zone.devices.fertigation}
          color={C.lime}
          metrics={[
            { label: t.live.ec, value: reading.ec ?? '—', unit: 'mS/cm', target: targets.ec, status: status(reading.ec, targets.ec), icon: Activity },
            { label: t.live.ph, value: reading.ph ?? '—', unit: '', target: targets.ph, status: status(reading.ph, targets.ph), icon: FlaskConical },
            { label: t.live.npk, value: baseRec ? `${baseRec.targets.npk.n}-${baseRec.targets.npk.p}-${baseRec.targets.npk.k}` : '—', unit: 'ppm', target: null, status: 'ok', icon: Leaf },
          ]}
          actuators={[
            { name: t.live.pumpA, on: reading.pumpOn },
            { name: t.live.pumpB, on: !reading.pumpOn && Math.random() < 0.5 },
            { name: t.live.phDoser, on: status(reading.ph, targets.ph) !== 'ok' },
          ]}
        />
        <ControlCard
          title={t.live.irrigationSwitch}
          subtitle={t.live.irrigationSubtitle}
          icon={Droplets}
          enabled={zone.devices.irrigation}
          color="#0EA5E9"
          metrics={[
            { label: t.live.waterLevel, value: reading.waterLevel ?? '—', unit: '%', target: [40, 100], status: (reading.waterLevel ?? 0) < 30 ? 'low' : 'ok', icon: Droplets },
            { label: t.live.cyclesPerDay, value: baseRec?.irrigation.freq ?? '—', unit: '', target: null, status: 'ok', icon: RefreshCw },
            { label: t.live.cycleDuration, value: baseRec?.irrigation.duration ?? '—', unit: 's', target: null, status: 'ok', icon: Calendar },
          ]}
          actuators={[
            { name: t.live.valve1, on: reading.pumpOn },
            { name: t.live.valve2, on: !reading.pumpOn && Math.random() < 0.4 },
            { name: t.live.drain, on: false },
          ]}
        />
        <ControlCard
          title={t.live.energySwitch}
          subtitle={t.live.energySubtitle}
          icon={Zap}
          enabled={zone.devices.energy}
          color="#F59E0B"
          metrics={[
            { label: t.live.solarPower, value: reading.solarPower ?? '—', unit: 'W', target: null, status: 'ok', icon: Sun },
            { label: t.live.gridDraw, value: reading.gridDraw ?? '—', unit: 'W', target: null, status: 'ok', icon: Power },
            { label: t.live.netPower, value: reading.solarPower && reading.gridDraw ? Math.round(reading.solarPower - reading.gridDraw) : '—', unit: 'W', target: null, status: (reading.solarPower ?? 0) > (reading.gridDraw ?? 0) ? 'ok' : 'low', icon: TrendingUp },
          ]}
          actuators={[
            { name: t.live.solar, on: (reading.solarPower ?? 0) > 100 },
            { name: t.live.battery, on: (reading.solarPower ?? 0) < (reading.gridDraw ?? 0) },
            { name: t.live.grid, on: true },
          ]}
        />
      </div>

      {/* Quick Override */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, color: C.forest, fontSize: 16, fontWeight: 700 }}>{t.live.overrideTitle}</h3>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{t.live.overrideSubtitle}</div>
          </div>
          <button onClick={() => setOverrides({ ...overrides, [zone.id]: {} })} style={{ background: C.creamDark, border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.forest, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={12} /> {t.live.resetOriginal}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <RangeSlider label={t.live.tempLabel} min={10} max={40} step={0.5} value={targets.temp} onChange={v => setOverrides({ ...overrides, [zone.id]: { ...ovr, temp: v } })} color={C.forest} />
          <RangeSlider label={t.live.humidityLabel} min={30} max={95} step={1} value={targets.humidity} onChange={v => setOverrides({ ...overrides, [zone.id]: { ...ovr, humidity: v } })} color="#0EA5E9" />
          <RangeSlider label={t.live.ecLabel} min={0.4} max={4.0} step={0.1} value={targets.ec} onChange={v => setOverrides({ ...overrides, [zone.id]: { ...ovr, ec: v } })} color={C.lime} />
          <RangeSlider label={t.live.phLabel} min={4.5} max={7.5} step={0.1} value={targets.ph} onChange={v => setOverrides({ ...overrides, [zone.id]: { ...ovr, ph: v } })} color="#A855F7" />
        </div>
      </div>
    </div>
  );
}

function ControlCard({ title, subtitle, icon: Icon, enabled, color, metrics, actuators }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', opacity: enabled ? 1 : 0.55 }}>
      <div style={{ background: color, color: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{subtitle}</div>
        </div>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: enabled ? C.limeLight : C.muted }}></span>
      </div>
      <div style={{ padding: 14 }}>
        {metrics.map((m, i) => (
          <Metric key={i} {...m} />
        ))}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {actuators.map((a, i) => (
            <span key={i} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 12, background: a.on ? C.lime : C.creamDark, color: a.on ? '#fff' : C.muted, fontWeight: 600 }}>
              ● {a.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, target, status, icon: Icon }) {
  const colors = { ok: C.ok, low: C.warn, high: C.danger, unknown: C.muted };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px dashed ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={14} color={C.muted} />}
        <span style={{ fontSize: 12, color: C.inkSoft }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: colors[status] || C.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <span style={{ fontSize: 10, color: C.muted }}>{unit}</span>
        {target && <span style={{ fontSize: 10, color: C.muted, marginRight: 4 }}>({target[0]}–{target[1]})</span>}
      </div>
    </div>
  );
}

function Badge({ color, text }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 14, background: `${color}20`, color, fontWeight: 700, fontSize: 11 }}>{text}</span>;
}

function RangeSlider({ label, min, max, step, value, onChange, color }) {
  const [lo, hi] = value || [min, max];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: C.inkSoft, fontWeight: 600 }}>{label}</span>
        <span style={{ color: color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{lo} ↔ {hi}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="number" inputMode="decimal" min={min} max={hi} step={step} value={lo} onChange={e => onChange([+e.target.value, hi])} style={{ width: 64, padding: '6px 4px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', textAlign: 'center', flexShrink: 0 }} />
        <input type="range" min={min} max={max} step={step} value={lo} onChange={e => onChange([+e.target.value, Math.max(+e.target.value, hi)])} style={{ flex: 1, accentColor: color, height: 24, minWidth: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
        <input type="number" inputMode="decimal" min={lo} max={max} step={step} value={hi} onChange={e => onChange([lo, +e.target.value])} style={{ width: 64, padding: '6px 4px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', textAlign: 'center', flexShrink: 0 }} />
        <input type="range" min={min} max={max} step={step} value={hi} onChange={e => onChange([Math.min(+e.target.value, lo), +e.target.value])} style={{ flex: 1, accentColor: color, height: 24, minWidth: 0 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🟢 2) Crop Engine — محرّك التوصيات
// ═══════════════════════════════════════════════════════════════════
function CropEngine({ zones, setZones, overrides, setOverrides, isMobile }) {
  const { t } = useI18n();
  const [crop, setCrop] = useState('tomato');
  const [stage, setStage] = useState('vegetative');
  const [region, setRegion] = useState('jeddah');
  const [applyZone, setApplyZone] = useState('zone_a');
  const [toast, setToast] = useState<string | null>(null);

  const cropObj = CROP_DB[crop];
  const stages = Object.keys(cropObj.stages);
  // ضبط المرحلة عند تغيير المحصول
  useEffect(() => { if (!cropObj.stages[stage]) setStage(stages[0]); }, [crop]);

  const rec = recommend(crop, stage, region);

  const applyToZone = () => {
    setZones(zones.map(z => z.id === applyZone ? { ...z, crop, stage, region } : z));
    setOverrides({ ...overrides, [applyZone]: {} });
    setToast(`${t.engine.appliedToast}: ${cropObj.name} (${cropObj.stages[stage].name}) → ${zones.find(z => z.id === applyZone)?.name}`);
  };

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.forest} 0%, ${C.forestLight} 100%)`, color: '#fff', borderRadius: 12, padding: isMobile ? 18 : 24, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, fontSize: isMobile ? 120 : 180, opacity: 0.06 }}>🌱</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(124, 179, 66, 0.18)', borderRadius: 14, fontSize: isMobile ? 10 : 11, fontWeight: 700, color: C.lime, marginBottom: 10, border: `1px solid ${C.lime}40` }}>
          {t.engine.badge}
        </div>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 900 }}>{t.engine.title}</h2>
        <p style={{ margin: '6px 0 0', color: C.limeLight, fontSize: isMobile ? 12 : 14 }}>{t.engine.subtitle}</p>
        <div style={{ marginTop: 8, fontSize: isMobile ? 11 : 12, color: C.limeLight, opacity: 0.85 }}>{t.engine.libraryNote}</div>
      </div>

      {/* Selectors */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 14 : 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', color: C.forest, fontSize: 16, fontWeight: 700 }}>{t.engine.step1}</h3>

        <Label text={t.engine.cropType} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 18 }}>
          {Object.entries(CROP_DB).map(([k, c]) => (
            <button key={k} onClick={() => setCrop(k)} style={{
              padding: isMobile ? '8px 4px' : '10px 8px', background: crop === k ? C.forest : '#fff', color: crop === k ? '#fff' : C.ink,
              border: `2px solid ${crop === k ? C.forest : C.border}`, borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: isMobile ? 11 : 12, transition: 'all .15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: isMobile ? 20 : 24 }}>{c.icon}</span>
              <span>{c.name}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>{c.cycleDays} {t.engine.dayUnit}</span>
            </button>
          ))}
        </div>

        <Label text={t.engine.timeStage} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 18 }}>
          {stages.map(s => (
            <button key={s} onClick={() => setStage(s)} style={{
              padding: '10px 12px', background: stage === s ? C.lime : '#fff', color: stage === s ? '#fff' : C.ink,
              border: `2px solid ${stage === s ? C.lime : C.border}`, borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
            }}>
              <div style={{ fontWeight: 700 }}>{cropObj.stages[s].name}</div>
              <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{t.engine.dayShort} {cropObj.stages[s].days}</div>
            </button>
          ))}
        </div>

        <Label text={t.engine.geoRegion} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          {Object.entries(REGIONS).map(([k, r]) => (
            <button key={k} onClick={() => setRegion(k)} style={{
              padding: 12, background: region === k ? C.forestLight : '#fff', color: region === k ? '#fff' : C.ink,
              border: `2px solid ${region === k ? C.forestLight : C.border}`, borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'right', transition: 'all .15s',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
              <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation Output */}
      {rec && (
        <div style={{ background: '#fff', border: `2px solid ${C.lime}`, borderRadius: 12, padding: isMobile ? 14 : 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', color: C.forest, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color={C.lime} /> {t.engine.step2}
          </h3>

          <div style={{ background: C.creamDark, padding: 14, borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: isMobile ? 32 : 40 }}>{rec.cropIcon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16, color: C.forest }}>{rec.crop} — {rec.stage}</div>
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{t.engine.dayShort} {rec.days} · {t.engine.in} {rec.region}</div>
            </div>
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 11 }}>
              <div style={{ color: C.muted }}>{t.engine.waterQuality}</div>
              <div style={{ color: C.forest, fontWeight: 700 }}>{rec.waterQuality} ppm TDS</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? 8 : 12, marginBottom: 14 }}>
            <RecCard title={t.engine.tempRec} value={`${rec.targets.temp[0]} – ${rec.targets.temp[1]}`} unit="°C" color={C.forest} />
            <RecCard title={t.engine.humRec} value={`${rec.targets.humidity[0]} – ${rec.targets.humidity[1]}`} unit="%" color="#0EA5E9" />
            <RecCard title={t.engine.ecRec} value={`${rec.targets.ec[0]} – ${rec.targets.ec[1]}`} unit="mS/cm" color={C.lime} />
            <RecCard title={t.engine.phRec} value={`${rec.targets.ph[0]} – ${rec.targets.ph[1]}`} unit="" color="#A855F7" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? 8 : 12, marginBottom: 14 }}>
            <RecCard title="🌿 N" value={rec.targets.npk.n} unit="ppm" color="#16A34A" />
            <RecCard title="🌱 P" value={rec.targets.npk.p} unit="ppm" color="#CA8A04" />
            <RecCard title="🍅 K" value={rec.targets.npk.k} unit="ppm" color="#DC2626" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
            <RecCard title={t.engine.irrFreq} value={rec.irrigation.freq} unit={t.engine.timesUnit} color={C.forestLight} />
            <RecCard title={t.engine.irrDur} value={rec.irrigation.duration} unit={t.engine.secondsUnit} color={C.forestLight} />
          </div>

          <div style={{ background: `${C.lime}15`, border: `1px dashed ${C.lime}`, borderRadius: 8, padding: 12, fontSize: 13, color: C.forest, lineHeight: 1.7 }}>
            <strong>{t.engine.regionNote}:</strong> {rec.regionNote}
          </div>
        </div>
      )}

      {/* Apply to Zone */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 14 : 20 }}>
        <h3 style={{ margin: '0 0 12px', color: C.forest, fontSize: 16, fontWeight: 700 }}>{t.engine.step3}</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={applyZone} onChange={e => setApplyZone(e.target.value)} style={{ flex: '1 1 200px', minWidth: 0, padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 14, background: '#fff' }}>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <button onClick={applyToZone} style={{ padding: '10px 22px', background: C.lime, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Save size={16} /> {t.engine.applyBtn}
          </button>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>{t.engine.applyNote}</div>
      </div>
      <ToastBanner message={toast} type="success" onClose={() => setToast(null)} />
    </div>
  );
}

function Label({ text }) { return <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 8 }}>{text}</div>; }

function RecCard({ title, value, unit, color }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, borderRight: `4px solid ${color}` }}>
      <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 4 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🟢 3) History Tab — السجل التاريخي مع تحليلات
// ═══════════════════════════════════════════════════════════════════
function HistoryTab({ historicalData, zones, isMobile }) {
  const { t } = useI18n();
  const [metric, setMetric] = useState('tempIn');
  const [compareRegions, setCompareRegions] = useState(['jeddah', 'abha']);
  const [range, setRange] = useState(90);

  const metrics = {
    tempIn:  { label: t.history.metricTempIn, unit: '°C',                color: C.forest, optimal: [20, 26] },
    humIn:   { label: t.history.metricHumIn,  unit: '%',                 color: '#0EA5E9', optimal: [55, 70] },
    ec:      { label: t.history.metricEC,     unit: 'mS/cm',             color: C.lime, optimal: [0.8, 3.5] },
    ph:      { label: t.history.metricPH,     unit: '',                  color: '#A855F7', optimal: [5.5, 7.5] },
    co2:     { label: t.history.metricCO2,    unit: 'ppm',               color: '#64748B', optimal: [600, 1200] },
    water:   { label: t.history.metricWater,  unit: t.history.waterUnit, color: '#0891B2', optimal: null },
    energy:  { label: t.history.metricEnergy, unit: t.history.energyUnit, color: '#F59E0B', optimal: null },
  };

  const m = metrics[metric];

  // دمج البيانات للمقارنة
  const merged = useMemo(() => {
    const slice = (arr) => arr ? arr.slice(-range) : [];
    const baseRegion = compareRegions[0] || Object.keys(REGIONS)[0];
    const baseData = slice(historicalData[baseRegion]);
    return baseData.map((row, i) => {
      const merged = { date: row.date };
      compareRegions.forEach(r => {
        const data = slice(historicalData[r]);
        if (data[i]) merged[r] = data[i][metric];
      });
      return merged;
    });
  }, [historicalData, metric, range, compareRegions]);

  // تحليل ذكي
  const analysis = useMemo(() => {
    const result = {};
    compareRegions.forEach(r => {
      const data = (historicalData[r] || []).slice(-range);
      if (data.length === 0) return;
      const values = data.map(d => d[metric]);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length);
      let inOptimal = 0;
      if (m.optimal) {
        inOptimal = values.filter(v => v >= m.optimal[0] && v <= m.optimal[1]).length;
      }
      result[r] = {
        avg: +avg.toFixed(2), max: +max.toFixed(2), min: +min.toFixed(2),
        std: +std.toFixed(2), inOptimalPct: m.optimal ? Math.round(inOptimal / values.length * 100) : null,
      };
    });
    return result;
  }, [historicalData, metric, range, compareRegions, m]);

  const downloadCSV = () => {
    const headers = ['date', ...compareRegions.map(r => REGIONS[r].name)];
    const rows = merged.map(row => [row.date, ...compareRegions.map(r => row[r] ?? '')].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `igarden-${metric}-${range}days.csv`;
    link.click();
  };

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, #1A5D45 0%, ${C.forest} 100%)`, color: '#fff', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{t.history.title}</h2>
        <p style={{ margin: '6px 0 0', color: C.limeLight, fontSize: 14 }}>{t.history.subtitle}</p>
      </div>

      {/* Controls */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <Label text={t.history.metricLabel} />
            <select value={metric} onChange={e => setMetric(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 14, background: '#fff' }}>
              {Object.entries(metrics).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <Label text={t.history.rangeLabel} />
            <div style={{ display: 'flex', gap: 6 }}>
              {[7, 30, 90].map(d => (
                <button key={d} onClick={() => setRange(d)} style={{ flex: 1, padding: '8px', background: range === d ? C.forest : '#fff', color: range === d ? '#fff' : C.ink, border: `1px solid ${range === d ? C.forest : C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
                  {d === 7 ? t.common.week : d === 30 ? t.common.month : t.common.threeMonths}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label text={t.history.compareLabel} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(REGIONS).map(([k, r]) => {
                const sel = compareRegions.includes(k);
                return (
                  <button key={k} onClick={() => setCompareRegions(sel ? compareRegions.filter(x => x !== k) : [...compareRegions, k])} style={{ padding: '6px 10px', background: sel ? C.lime : '#fff', color: sel ? '#fff' : C.ink, border: `1px solid ${sel ? C.lime : C.border}`, borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600 }}>
                    {r.icon} {r.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={downloadCSV} style={{ width: '100%', padding: '8px 14px', background: C.forest, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Download size={14} /> {t.history.exportCsv}
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 12 : 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, color: C.forest, fontSize: 15, fontWeight: 700 }}>{m.label} · {range} {t.engine.dayUnit}</h3>
          {m.optimal && <Badge color={C.lime} text={`${t.history.optimalRange}: ${m.optimal[0]} – ${m.optimal[1]} ${m.unit}`} />}
        </div>
        <div style={{ width: '100%', height: isMobile ? 240 : 320 }}>
          <ResponsiveContainer>
            <LineChart data={merged} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.muted} fontSize={isMobile ? 9 : 11} interval={isMobile ? 'preserveStartEnd' : 'preserveStartEnd'} />
              <YAxis stroke={C.muted} fontSize={isMobile ? 9 : 11} width={isMobile ? 30 : 40} />
              <Tooltip contentStyle={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {m.optimal && <ReferenceLine y={m.optimal[0]} stroke={C.lime} strokeDasharray="4 4" label={{ value: 'حد أدنى', fill: C.lime, fontSize: 10 }} />}
              {m.optimal && <ReferenceLine y={m.optimal[1]} stroke={C.lime} strokeDasharray="4 4" label={{ value: 'حد أعلى', fill: C.lime, fontSize: 10 }} />}
              {compareRegions.map((r, i) => {
                const colors = [C.forest, '#0EA5E9', '#F59E0B', '#A855F7'];
                return <Line key={r} type="monotone" dataKey={r} name={REGIONS[r].name} stroke={colors[i % 4]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />;
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analysis Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
        {compareRegions.map(r => {
          const a = analysis[r];
          if (!a) return null;
          const region = REGIONS[r];
          return (
            <div key={r} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: C.forest, fontSize: 15 }}>{region.icon} {region.name}</div>
                {a.inOptimalPct != null && <Badge color={a.inOptimalPct >= 75 ? C.ok : a.inOptimalPct >= 50 ? C.warn : C.danger} text={`${a.inOptimalPct}${t.history.pctOptimal}`} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <Stat label={t.common.average}   value={a.avg} unit={m.unit} />
                <Stat label={t.common.deviation} value={`±${a.std}`} unit={m.unit} />
                <Stat label={t.common.peak}      value={a.max} unit={m.unit} color={C.danger} />
                <Stat label={t.common.trough}    value={a.min} unit={m.unit} color="#0EA5E9" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart Insights */}
      <div style={{ background: `linear-gradient(135deg, ${C.lime}10 0%, #fff 100%)`, border: `1px dashed ${C.lime}`, borderRadius: 12, padding: 18 }}>
        <h3 style={{ margin: '0 0 12px', color: C.forest, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={16} color={C.lime} /> {t.history.smartAnalysis}
        </h3>
        <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.9 }}>
          {generateInsights(analysis, m, compareRegions, metric)}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, color = C.ink }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color, fontVariantNumeric: 'tabular-nums' }}>
        {value} <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>{unit}</span>
      </div>
    </div>
  );
}

function generateInsights(analysis, metricMeta, regions, metricKey) {
  const insights = [];
  if (regions.length >= 2) {
    const sorted = [...regions].sort((a, b) => (analysis[a]?.avg || 0) - (analysis[b]?.avg || 0));
    const lowest = sorted[0], highest = sorted[sorted.length - 1];
    if (analysis[lowest] && analysis[highest]) {
      const diff = +(analysis[highest].avg - analysis[lowest].avg).toFixed(2);
      insights.push(`📊 الفارق بين ${REGIONS[highest].name} (الأعلى) و${REGIONS[lowest].name} (الأقل) في متوسط ${metricMeta.label} يبلغ ${diff} ${metricMeta.unit}.`);
    }
  }
  regions.forEach(r => {
    const a = analysis[r];
    if (!a) return;
    if (a.inOptimalPct != null) {
      if (a.inOptimalPct < 60) {
        insights.push(`⚠️ ${REGIONS[r].name}: ${100 - a.inOptimalPct}% من القراءات خارج النطاق المثالي — يُنصح بضبط setpoints.`);
      } else if (a.inOptimalPct >= 85) {
        insights.push(`✅ ${REGIONS[r].name}: أداء ممتاز (${a.inOptimalPct}% داخل النطاق المثالي).`);
      }
    }
    if (a.std > a.avg * 0.15) {
      insights.push(`📈 ${REGIONS[r].name}: تقلّبات عالية (انحراف ±${a.std}) — قد تحتاج لتحسين خوارزمية التحكم.`);
    }
  });
  if (metricKey === 'water' || metricKey === 'energy') {
    regions.forEach(r => {
      const a = analysis[r];
      if (a) insights.push(`💡 ${REGIONS[r].name}: متوسط الاستهلاك اليومي ${a.avg} ${metricMeta.unit} — إجمالي شهري تقريبي ${Math.round(a.avg * 30)} ${metricMeta.unit.replace('/يوم','')}/شهر.`);
    });
  }
  if (insights.length === 0) return 'لا توجد ملاحظات بارزة في هذه الفترة — الأداء مستقر.';
  return insights.map((t, i) => <div key={i} style={{ marginBottom: 6 }}>{t}</div>);
}

// ═══════════════════════════════════════════════════════════════════
// 🟢 4) Zones Settings — إعدادات المناطق
// ═══════════════════════════════════════════════════════════════════
function ZonesSettings({ zones, setZones, isMobile }) {
  const { t, locale, dir } = useI18n();
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const editing = zones.find(z => z.id === editingId);

  const updateZone = (id, patch) => setZones(zones.map(z => z.id === id ? { ...z, ...patch } : z));
  const updateDevice = (id, dev, val) => {
    const z = zones.find(z => z.id === id);
    updateZone(id, { devices: { ...z.devices, [dev]: val } });
  };
  const addZone = () => {
    const newId = `zone_${Date.now()}`;
    const namePrefix = locale === 'ar' ? 'منطقة جديدة' : 'New zone';
    setZones([...zones, {
      id: newId, name: `${namePrefix} ${zones.length + 1}`,
      region: 'jeddah', crop: 'lettuce', stage: 'vegetative',
      plantedDate: new Date().toISOString().slice(0, 10),
      area: 50, enabled: true, auto: true,
      devices: { climate: true, fertigation: true, irrigation: true, energy: true },
    }]);
    setEditingId(newId);
  };
  const requestDeleteZone = (id: string) => {
    if (zones.length <= 1) {
      setToastType('error');
      setToast(t.zones.deleteCancel);
      return;
    }
    setPendingDeleteId(id);
  };
  const confirmDeleteZone = () => {
    if (!pendingDeleteId) return;
    setZones(zones.filter(z => z.id !== pendingDeleteId));
    if (editingId === pendingDeleteId) setEditingId(null);
    setPendingDeleteId(null);
    setToastType('success');
    setToast(t.zones.deleteSuccess);
  };

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: C.forest, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          {dir === 'rtl' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />} {t.zones.backToList}
        </button>

        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: '0 0 18px', color: C.forest, fontSize: 17, fontWeight: 700 }}>{t.zones.editTitle}: {editing.name}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
            <Field label={t.zones.nameLabel}>
              <input type="text" value={editing.name} onChange={e => updateZone(editing.id, { name: e.target.value })} style={inputStyle} />
            </Field>
            <Field label={t.zones.areaLabel}>
              <input type="number" value={editing.area} onChange={e => updateZone(editing.id, { area: +e.target.value })} style={inputStyle} />
            </Field>
            <Field label={t.zones.plantedDateLabel}>
              <input type="date" value={editing.plantedDate} onChange={e => updateZone(editing.id, { plantedDate: e.target.value })} style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
            <Field label={t.common.region}>
              <select value={editing.region} onChange={e => updateZone(editing.id, { region: e.target.value })} style={inputStyle}>
                {Object.entries(REGIONS).map(([k, r]) => <option key={k} value={k}>{r.icon} {r.name}</option>)}
              </select>
            </Field>
            <Field label={t.common.crop}>
              <select value={editing.crop} onChange={e => {
                const newCrop = e.target.value;
                const firstStage = Object.keys(CROP_DB[newCrop].stages)[0];
                updateZone(editing.id, { crop: newCrop, stage: firstStage });
              }} style={inputStyle}>
                {Object.entries(CROP_DB).map(([k, c]) => <option key={k} value={k}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
            <Field label={t.common.stage}>
              <select value={editing.stage} onChange={e => updateZone(editing.id, { stage: e.target.value })} style={inputStyle}>
                {Object.entries(CROP_DB[editing.crop as keyof typeof CROP_DB].stages).map(([k, s]) => { const st = s as { name: string; days: string }; return <option key={k} value={k}>{st.name} ({t.engine.dayShort} {st.days})</option>; })}
              </select>
            </Field>
          </div>

          <div style={{ marginBottom: 18 }}>
            <Label text={t.zones.statusLabel} />
            <div style={{ display: 'flex', gap: 10 }}>
              <Toggle checked={editing.enabled} onChange={v => updateZone(editing.id, { enabled: v })} label={editing.enabled ? t.zones.enabled : t.zones.disabled} />
              <Toggle checked={editing.auto} onChange={v => updateZone(editing.id, { auto: v })} label={editing.auto ? t.zones.autoOn : t.zones.autoOff} />
            </div>
          </div>

          <div>
            <Label text={t.zones.devicesLabel} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              <DeviceToggle name={t.live.climateSwitch}     desc={t.zones.devClimate}     icon={Thermometer} on={editing.devices.climate}     onChange={v => updateDevice(editing.id, 'climate',     v)} color={C.forest} />
              <DeviceToggle name={t.live.fertigationSwitch} desc={t.zones.devFertigation} icon={Beaker}      on={editing.devices.fertigation} onChange={v => updateDevice(editing.id, 'fertigation', v)} color={C.lime} />
              <DeviceToggle name={t.live.irrigationSwitch}  desc={t.zones.devIrrigation}  icon={Droplets}    on={editing.devices.irrigation}  onChange={v => updateDevice(editing.id, 'irrigation',  v)} color="#0EA5E9" />
              <DeviceToggle name={t.live.energySwitch}      desc={t.zones.devEnergy}      icon={Zap}         on={editing.devices.energy}      onChange={v => updateDevice(editing.id, 'energy',      v)} color="#F59E0B" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, color: C.forest, fontSize: 22, fontWeight: 900 }}>{t.zones.title}</h2>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>{zones.length} {t.zones.countSuffix}</div>
        </div>
        <button onClick={addZone} style={{ padding: '10px 18px', background: C.lime, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={16} /> {t.zones.addBtn}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {zones.map(z => (
          <div key={z.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: C.forest, fontSize: 16 }}>{z.name}</div>
                <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{REGIONS[z.region].icon} {REGIONS[z.region].name} · {CROP_DB[z.crop].icon} {CROP_DB[z.crop].name}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: z.enabled ? C.lime : C.muted, marginTop: 6 }}></span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
              {CROP_DB[z.crop].stages[z.stage]?.name} · {z.area} م² · زُرعت {z.plantedDate}
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {Object.entries(z.devices).map(([k, v]) => (
                <span key={k} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 10, background: v ? C.creamDark : '#fff', color: v ? C.forest : C.muted, border: `1px solid ${C.border}`, fontWeight: 600 }}>
                  {v ? '●' : '○'} {k === 'climate' ? t.zones.devClimate : k === 'fertigation' ? t.zones.devFertigation : k === 'irrigation' ? t.zones.devIrrigation : t.zones.devEnergy}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingId(z.id)} style={{ flex: 1, padding: '8px', background: C.forest, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>{t.common.edit}</button>
              <button onClick={() => requestDeleteZone(z.id)} style={{ padding: '8px 12px', background: '#fff', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>{t.common.delete}</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title={t.zones.deleteConfirmTitle}
        message={t.zones.deleteConfirmMsg(zones.find(z => z.id === pendingDeleteId)?.name ?? '')}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        danger
        onConfirm={confirmDeleteZone}
        onCancel={() => setPendingDeleteId(null)}
      />
      <ToastBanner message={toast} type={toastType} onClose={() => setToast(null)} />
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 14, background: '#fff', boxSizing: 'border-box' };

// ─── Hook بسيط لاكتشاف الشاشات الصغيرة ───
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.forest, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

// ─── Confirm Dialog (يستبدل window.confirm) ─────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', danger = false, onConfirm, onCancel }: { open: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,61,46,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 800, color: C.forest, fontSize: 15 }}>{title}</div>
        </div>
        <div style={{ padding: '14px 18px', fontSize: 13, color: C.inkSoft, lineHeight: 1.7 }}>{message}</div>
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end', background: C.cream }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', background: '#fff', color: C.inkSoft, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ padding: '8px 16px', background: danger ? C.danger : C.forest, color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── QR Code (يولّد QR صالحاً عبر مكتبة qrcode) ─────────────────────
function QRCode({ value, size = 96, label }: { value: string; size?: number; label?: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const QR = await import('qrcode');
        const url = await QR.toDataURL(value, {
          margin: 1,
          width: size * 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#0F3D2E', light: '#FFFFFF' },
        });
        if (!cancelled) setDataUrl(url);
      } catch (err) {
        console.warn('[iGarden] QR generation failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [value, size]);

  return (
    <div style={{ width: size, height: size, background: '#fff', borderRadius: 8, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${C.border}` }} aria-label={label ?? `QR Code: ${value}`}>
      {dataUrl ? (
        <img src={dataUrl} alt={label ?? value} width={size - 8} height={size - 8} style={{ display: 'block', width: size - 8, height: size - 8 }} />
      ) : (
        <span style={{ fontSize: 9, color: C.muted }}>...</span>
      )}
    </div>
  );
}

// ─── Toast Banner (يستبدل window.alert) ─────────────────────────────
function ToastBanner({ message, type = 'success', onClose }: { message: string | null; type?: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  const palette = type === 'success' ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
                : type === 'error'   ? { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' }
                :                      { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF' };
  return (
    <div role="status" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500, background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color, padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, maxWidth: 420, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ flex: 1, lineHeight: 1.6 }}>{message}</span>
      <button onClick={onClose} aria-label="إغلاق" style={{ background: 'none', border: 'none', color: palette.color, cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button onClick={() => onChange(!checked)} style={{ flex: 1, padding: '10px 14px', background: checked ? C.lime + '20' : '#fff', border: `1px solid ${checked ? C.lime : C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', color: checked ? C.forest : C.inkSoft, fontWeight: 600, fontSize: 13 }}>
      {label}
    </button>
  );
}

function DeviceToggle({ name, desc, icon: Icon, on, onChange, color }) {
  return (
    <button onClick={() => onChange(!on)} style={{ padding: 10, background: on ? color + '15' : '#fff', border: `1px solid ${on ? color : C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'right', width: '100%' }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: on ? color : C.creamDark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={on ? '#fff' : C.muted} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: on ? color : C.ink }}>{name}</div>
        <div style={{ fontSize: 10, color: C.muted }}>{desc}</div>
      </div>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? color : C.muted, flexShrink: 0 }}></span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🟢 5) Compliance Tab — طبقة الامتثال السعودي
// ═══════════════════════════════════════════════════════════════════

const REPORT_DEFS = [
  {
    id: 'mewa-monthly',
    title: 'التقرير الشهري للمياه والامتثال',
    authority: 'وزارة البيئة والمياه والزراعة',
    badge: 'MEWA — إلزامي',
    icon: '📊',
    desc: 'ملخّص شهري: قراءات EC/pH/حرارة · استهلاك المياه · الانحرافات · توصيات النظام التلقائية',
    ref: 'MEWA-AGR-LAW-IR',
    reportNo: 'RPT-MEWA-2026-05',
    status: 'ready',
    frequency: 'شهري',
    pages: 3,
    lastDate: '2026-05-06',
    accentColor: '#0F3D2E',
  },
  {
    id: 'saudi-gap',
    title: 'شهادة الممارسات الزراعية الجيدة',
    authority: 'MEWA — منصة نعمة (NAAMA)',
    badge: 'Saudi GAP Certificate',
    icon: '🌿',
    desc: 'شهادة GAP كاملة: قائمة فحص 8 بنود + تقييم المخاطر + نتيجة الشهادة + توقيع المفتّش',
    ref: 'Saudi GAP',
    reportNo: 'GAP-CERT-2026-04-A',
    status: 'ready',
    frequency: 'سنوي / بالدفعة',
    pages: 2,
    lastDate: '2026-04-10',
    accentColor: '#7CB342',
  },
  {
    id: 'water-efficiency',
    title: 'سجل ترشيد المياه',
    authority: 'وزارة البيئة والمياه والزراعة',
    badge: 'Water Use Efficiency',
    icon: '💧',
    desc: 'مقارنة هيدروبونيك vs ري تقليدي · نسبة التوفير · الأثر البيئي السنوي · مستهدف MEWA',
    ref: 'MEWA-AGR-LAW-IR',
    reportNo: 'RPT-WUE-2026-05',
    status: 'ready',
    frequency: 'شهري',
    pages: 2,
    lastDate: '2026-05-06',
    accentColor: '#0EA5E9',
  },
  {
    id: 'zatca-fatoora',
    title: 'ربط مفهومي بفاتورة ZATCA — Conceptual Linkage',
    authority: 'هيئة الزكاة والضريبة والجمارك (مرجعي)',
    badge: 'ZATCA — Conceptual Demo',
    icon: '🧾',
    desc: 'تصوّر معماري: ربط BATCH-ID بمرجع فاتورة + بنود توضيحية + ضريبة 15% — لا توقيع رقمي ولا QR TLV',
    ref: 'ZATCA Fatoora Phase 2 (مرجعي)',
    reportNo: 'DEMO-INV-2026-04-A-001',
    status: 'ready',
    frequency: 'بالدفعة (تصوّري)',
    pages: 1,
    lastDate: '2026-05-06',
    accentColor: '#7C3AED',
  },
];

const GAP_TIMELINE_STEPS = [
  { emoji: '🌱', title: 'البذر',             subtitle: 'مكتمل',   date: '2026-02-10', status: 'done',     detail: 'مصدر البذور: نورس للبذور السعودية · شهادة صحة بذور SEED-2026-0142' },
  { emoji: '🌿', title: 'الإنبات',           subtitle: 'مكتمل',   date: '2026-02-24', status: 'done',     detail: '847 قراءة حساس مسجّلة · معدل إنبات 94%' },
  { emoji: '🌳', title: 'النمو الخضري',      subtitle: 'مكتمل',   date: '2026-03-20', status: 'done',     detail: 'NPK: 150-60-200 ppm · صفر مبيدات مستخدمة' },
  { emoji: '🌸', title: 'الإزهار',           subtitle: '(الحالي)',  date: '2026-04-10', status: 'current',  detail: 'متابعة حية · EC: 2.5–3.0 mS/cm · pH: 5.8–6.2' },
  { emoji: '🍅', title: 'الإثمار',           subtitle: 'متوقع',    date: '2026-05-15', status: 'upcoming', detail: 'المتوقع: 120–150 كيلو · العنابر الثلاث' },
  { emoji: '📦', title: 'الحصاد والتعبئة',  subtitle: 'متوقع',    date: '2026-06-10', status: 'upcoming', detail: 'QR auto-bind لفاتورة ZATCA Fatoora عند التعبئة' },
];

// ─── بيانات Sprint 2: أحداث التدقيق التفصيلية ───
const ENHANCED_AUDIT_EVENTS = [
  { id: 'AUD-2026-0001', ts: '2026-05-07 10:42', zone: 'المحمية A', actor: 'System',   action: 'دورة ري مشغَّلة',           before: 'رطوبة 38%',       after: 'رطوبة 44%',         reason: 'أقل من الحد المستهدف 40%',        status: 'Locked' },
  { id: 'AUD-2026-0002', ts: '2026-05-07 11:10', zone: 'المحمية B', actor: 'Operator', action: 'ضبط مستهدف pH',              before: 'pH 6.2',           after: 'pH 6.0',             reason: 'تغيير مرحلة المحصول إلى الإزهار', status: 'Locked' },
  { id: 'AUD-2026-0003', ts: '2026-05-07 12:05', zone: 'المحمية C', actor: 'System',   action: 'جرعة سماد مكتملة',          before: 'EC 1.4 mS/cm',    after: 'EC 1.8 mS/cm',      reason: 'EC مستهدف لمرحلة النمو الحالية',  status: 'Locked' },
  { id: 'AUD-2026-0004', ts: '2026-05-06 14:30', zone: 'المحمية A', actor: 'Operator', action: 'تعديل يدوي — EC',            before: 'EC 2.4 mS/cm',    after: 'EC 2.1 mS/cm',      reason: 'طلب مشغّل بعد ملاحظة ميدانية',   status: 'Locked' },
  { id: 'AUD-2026-0005', ts: '2026-05-06 03:15', zone: 'المحمية B', actor: 'System',   action: 'تفعيل ضباب — رطوبة منخفضة', before: 'رطوبة 52%',       after: 'رطوبة 61%',         reason: 'أقل من الحد الأدنى 55%',          status: 'Locked' },
  { id: 'AUD-2026-0006', ts: '2026-05-05 09:00', zone: 'المحمية A', actor: 'System',   action: 'مراجعة حساس pH',             before: 'قراءة 6.8 (مشكوك)', after: 'مُعاير — 6.3',    reason: 'انحراف قراءة عن متوسط 3 أيام',   status: 'Locked' },
  { id: 'AUD-2026-0007', ts: '2026-05-04 16:20', zone: 'المحمية C', actor: 'Operator', action: 'فحص صيانة دورية',            before: 'مضخة تعمل',       after: 'مضخة تعمل — موثّق', reason: 'صيانة أسبوعية مجدولة',          status: 'Locked' },
  { id: 'AUD-2026-0008', ts: '2026-05-03 08:30', zone: 'المحمية B', actor: 'System',   action: 'إشعار pH خارج النطاق',       before: 'pH 7.6',           after: 'pH 7.1 (بعد تعديل)', reason: 'تجاوز الحد الأعلى المسموح 7.5', status: 'Locked' },
].map(e => ({ ...e, hash: mockSHA(e.id) }));

// ─── بيانات Sprint 2: الدفعات ───
const BATCH_DATA = [
  {
    batchId: 'BATCH-TOM-2026-001', crop: '🍅 طماطم', zone: 'المحمية A — جدة',
    planting: '2026-04-12', harvest: '2026-06-20', water: 'خزان ري مفلتر',
    inputs: '12 سجل', sensor: 'pH مستقر · EC ضمن المستهدف', invoice: 'غير مرتبط — ديمو',
    status: 'growing', statusLabel: '🌱 نامٍ', statusColor: C.ok,
  },
  {
    batchId: 'BATCH-LET-2026-002', crop: '🥬 خس', zone: 'المحمية B — الرياض',
    planting: '2026-04-25', harvest: '2026-05-30', water: 'خزان ري مفلتر',
    inputs: '8 سجلات', sensor: 'قراءات مستقرة · لا تنبيهات حرجة', invoice: 'غير مرتبط — ديمو',
    status: 'ready', statusLabel: '✅ جاهز قريباً', statusColor: '#2563EB',
  },
];

// ─── Sprint 3 Constants ───
const CALIBRATION_LOG = [
  { deviceId: 'PH-002-A',    type: 'pH Sensor',        zone: 'المحمية A', lastCal: '2026-05-01', nextCal: '2026-06-01', tech: 'Operator',   status: 'Valid',        notes: 'معايرة ثنائية النقطة مكتملة'       },
  { deviceId: 'EC-002-A',    type: 'EC Sensor',        zone: 'المحمية A', lastCal: '2026-05-02', nextCal: '2026-06-02', tech: 'Operator',   status: 'Valid',        notes: 'فحص محلول معياري مكتمل'           },
  { deviceId: 'PH-003-B',    type: 'pH Sensor',        zone: 'المحمية B', lastCal: '2026-04-25', nextCal: '2026-05-25', tech: 'Operator',   status: 'Review Soon',  notes: 'موعد المراجعة خلال 18 يوم'        },
  { deviceId: 'EC-003-B',    type: 'EC Sensor',        zone: 'المحمية B', lastCal: '2026-04-26', nextCal: '2026-05-26', tech: 'Operator',   status: 'Valid',        notes: 'معايرة أسبوعية دورية'             },
  { deviceId: 'PUMP-IRR-01', type: 'Irrigation Pump',  zone: 'المحمية B', lastCal: '2026-04-28', nextCal: '2026-05-28', tech: 'Technician', status: 'Review Soon',  notes: 'فحص معدل التدفق مطلوب قريباً'    },
  { deviceId: 'TEMP-001-C',  type: 'Temp/Hum Sensor',  zone: 'المحمية C', lastCal: '2026-05-03', nextCal: '2026-06-03', tech: 'Operator',   status: 'Valid',        notes: 'مقارنة مرجعية مكتملة'             },
];

const INPUT_USAGE_LOG = [
  { inputId: 'INP-2026-001', type: 'Nutrient',       name: 'محلول A الهيدروبونيك',   qty: '2.5',  unit: 'L',  batch: 'BATCH-TOM-2026-001', appliedBy: 'System',   appliedAt: '2026-05-08 09:15', zone: 'المحمية A', reason: 'EC أقل من الهدف المرحلي'          },
  { inputId: 'INP-2026-002', type: 'pH Adjustment',  name: 'pH Down',                qty: '120',  unit: 'ml', batch: 'BATCH-TOM-2026-001', appliedBy: 'Operator', appliedAt: '2026-05-08 11:10', zone: 'المحمية A', reason: 'ضبط pH لمرحلة الإزهار'            },
  { inputId: 'INP-2026-003', type: 'Water',          name: 'مياه ري مفلترة',          qty: '180',  unit: 'L',  batch: 'BATCH-LET-2026-002', appliedBy: 'System',   appliedAt: '2026-05-08 12:40', zone: 'المحمية B', reason: 'دورة ري مجدولة'                  },
  { inputId: 'INP-2026-004', type: 'Nutrient',       name: 'محلول B الهيدروبونيك',   qty: '1.8',  unit: 'L',  batch: 'BATCH-TOM-2026-001', appliedBy: 'System',   appliedAt: '2026-05-07 09:00', zone: 'المحمية A', reason: 'NPK للمرحلة الخضرية'             },
  { inputId: 'INP-2026-005', type: 'pH Adjustment',  name: 'pH Up',                  qty: '80',   unit: 'ml', batch: 'BATCH-LET-2026-002', appliedBy: 'Operator', appliedAt: '2026-05-06 14:00', zone: 'المحمية B', reason: 'رفع pH — أقل من 5.8'             },
  { inputId: 'INP-2026-006', type: 'Water',          name: 'مياه ري مفلترة',          qty: '220',  unit: 'L',  batch: 'BATCH-TOM-2026-001', appliedBy: 'System',   appliedAt: '2026-05-06 07:00', zone: 'المحمية A', reason: 'دورة ري صباحية'                  },
];

const WATER_SOURCE_LOG = [
  { source: 'خزان ري مفلتر (رئيسي)',    treatment: 'فلتر رسوبي + فلتر كربوني', lastTest: '2026-05-06', ph: '6.4', ec: '1.1 mS/cm', tds: '720 ppm',  status: 'ضمن الهدف',   attachment: 'غير مرفق — ديمو' },
  { source: 'خزان احتياطي (شبكة مياه)', treatment: 'خزان احتياطي + ترشيح',      lastTest: '2026-04-29', ph: '7.1', ec: '1.6 mS/cm', tds: '980 ppm',  status: 'للمراقبة',    attachment: 'غير مرفق — ديمو' },
];

const DATA_QUALITY_METRICS = [
  { label: 'Missing readings',    labelAr: 'قراءات مفقودة',        value: '0.8%',    status: 'Good',        note: 'أقل من حد المراجعة الداخلي'              },
  { label: 'Sensor offline time', labelAr: 'وقت توقف الحساسات',    value: '12 دقيقة', status: 'Good',        note: 'لا توقف يتجاوز 24 ساعة'                 },
  { label: 'Outlier readings',    labelAr: 'قراءات شاذة',           value: '3',       status: 'Review',      note: 'تستلزم مراجعة المشغّل قبل التقرير النهائي' },
  { label: 'Manual overrides',    labelAr: 'تعديلات يدوية',         value: '2',       status: 'Review',      note: 'كلا التعديلين موثّقان في سجل التدقيق'      },
  { label: 'Calibration status',  labelAr: 'حالة المعايرة',         value: '4/6 صالح', status: 'Review Soon', note: 'جهازان يحتاجان مراجعة قريباً'              },
  { label: 'Report completeness', labelAr: 'اكتمال التقرير',        value: '86%',     status: 'Report-ready', note: 'الأقسام الأساسية المطلوبة متوفرة'          },
];

// ─── Sprint 4B Constants ───

// Derive chain from ENHANCED_AUDIT_EVENTS so they share the same source
const AUDIT_CHAIN_EVENTS = ENHANCED_AUDIT_EVENTS.map((e, i) => ({
  ...e,
  previousHash: i === 0 ? 'GENESIS' : ENHANCED_AUDIT_EVENTS[i - 1].hash,
  eventHash:    e.hash,
  chainStatus:  'Valid',
}));

const AUDIT_CHAIN_SUMMARY = {
  verificationMode: 'Demo hash chain',
  chainStatus:      'Valid in demo',
  eventsChecked:    ENHANCED_AUDIT_EVENTS.length,
  brokenLinks:      0,
  lastEventHash:    ENHANCED_AUDIT_EVENTS[ENHANCED_AUDIT_EVENTS.length - 1]?.hash ?? 'N/A',
  disclaimer:       'Tamper-evident structure shown for demo only. Production requires append-only backend storage and restricted deletion controls.',
};

const AUDIT_VERSIONING = [
  { object: 'Audit Event',       ar: 'حدث تدقيق',      versioningRule: 'Never edit; add a correction event referencing original ID', demoStatus: 'Modeled' },
  { object: 'Compliance Report', ar: 'تقرير امتثال',   versioningRule: 'New export creates new reportId and timestamp',              demoStatus: 'Active'  },
  { object: 'Batch Record',      ar: 'سجل دفعة',       versioningRule: 'Changes create history entries — original retained',        demoStatus: 'Planned' },
  { object: 'Input Usage Log',   ar: 'سجل المدخلات',   versioningRule: 'Corrections are logged as new entries',                     demoStatus: 'Modeled' },
  { object: 'Sensor Reading',    ar: 'قراءة حساس',     versioningRule: 'Flagged as outlier; original value preserved in audit log', demoStatus: 'Modeled' },
  { object: 'Calibration Log',   ar: 'سجل المعايرة',   versioningRule: 'New calibration entry does not overwrite previous',        demoStatus: 'Modeled' },
];

// ─── Sprint 4A Constants ───
const USER_ROLES = [
  {
    role: 'Owner', ar: 'مالك المزرعة', color: C.forest,
    permissions: ['View dashboard', 'View all reports', 'Approve monthly report', 'Download all exports'],
    restrictions: ['Cannot edit locked audit events', 'Cannot change sensor calibration records'],
  },
  {
    role: 'Operator', ar: 'مشغّل', color: '#2563EB',
    permissions: ['Log daily operations', 'Add input usage entries', 'Trigger manual irrigation', 'Add maintenance notes'],
    restrictions: ['Cannot approve compliance reports', 'Cannot delete audit events'],
  },
  {
    role: 'Technician', ar: 'فني', color: C.warn,
    permissions: ['Update device status', 'Add calibration records', 'Add maintenance records'],
    restrictions: ['Cannot approve reports', 'Cannot edit batch financial links'],
  },
  {
    role: 'Auditor', ar: 'مراجع / مفتش', color: '#7C3AED',
    permissions: ['Read-only access to all data', 'View audit trail', 'View batch traceability', 'Download inspection package'],
    restrictions: ['Cannot change operational data', 'Cannot trigger system actions'],
  },
  {
    role: 'System', ar: 'النظام (آلي)', color: C.ok,
    permissions: ['Log sensor readings automatically', 'Log automation events', 'Generate system alerts', 'Create report drafts'],
    restrictions: ['Requires human approval for final report submission'],
  },
];

const NAAMA_MAPPING = [
  { internal: 'farmCode',            label: 'Farm Code',            target: 'farm_identifier',             status: 'Mapped',    note: 'Final field name subject to official API docs' },
  { internal: 'batchId',             label: 'Batch ID',             target: 'production_batch_reference',  status: 'Mapped',    note: 'Used for traceability workflow'               },
  { internal: 'cropType',            label: 'Crop Type',            target: 'crop_type',                   status: 'Mapped',    note: 'Requires controlled vocabulary when available' },
  { internal: 'inspectionReadiness', label: 'Inspection Readiness', target: 'readiness_score',             status: 'Draft',     note: 'Demo-only field — not in official spec yet'   },
  { internal: 'waterQualityPH',      label: 'Water pH',             target: 'water_ph_value',              status: 'Mapped',    note: 'From sensor readings log'                     },
  { internal: 'auditTrailRef',       label: 'Audit Trail Ref',      target: 'operation_log_reference',     status: 'Draft',     note: 'Pending API schema from NAAMA'                },
];

const ZATCA_MAPPING = [
  { internal: 'batchId',   label: 'Batch ID',   target: 'invoice_reference_note',  status: 'Concept',  note: 'Links harvest batch to invoice reference only'        },
  { internal: 'invoiceId', label: 'Invoice ID', target: 'invoice_id',              status: 'Concept',  note: 'Requires actual e-invoicing integration'              },
  { internal: 'sellerVat', label: 'Seller VAT', target: 'seller_tax_identifier',   status: 'Required', note: 'Must come from registered entity — not shown in demo' },
  { internal: 'quantity',  label: 'Quantity',   target: 'line_item_quantity',       status: 'Mapped',   note: 'kg unit — from harvest record'                        },
];

const getReportMetadata = () => ({
  reportId:    `RPT-DEMO-${new Date().toISOString().slice(0,7).replace('-','')}-0001`,
  farmCode:    'DEMO-001',
  dataMode:    'Simulated',
  environment: 'Demo',
  generatedAt: new Date().toISOString(),
  generatedBy: 'Demo System',
  version:     'Compliance Demo RC-2 (Bilingual)',
  disclaimer:  'Generated from a demo environment using simulated readings. Not a certification document.',
});

// ─── Auth Status Panel — Sprint 9D ───────────────────────────────────
function AuthStatusPanel({
  auth, dataSource, dataLoading,
}: {
  auth: ReturnType<typeof useSupabaseAuth>;
  dataSource: string;
  dataLoading: boolean;
}) {
  const [email, setEmail]     = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSignIn() {
    if (!email.trim()) return;
    setSending(true); setError(null);
    try {
      await auth.signInWithEmail(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ');
    } finally {
      setSending(false);
    }
  }

  if (auth.loading) return null;

  if (auth.signedIn) {
    // Logged in but RLS is blocking data (no farm membership yet)
    const noMembership = !dataLoading && dataSource === 'mock';
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: noMembership ? '10px 10px 0 0' : 10, padding: '10px 14px', fontSize: 12 }}>
          <span style={{ color: '#166534', fontWeight: 700 }}>🔑 مسجّل الدخول:</span>
          <span style={{ color: '#15803D', flexGrow: 1 }}>{auth.userEmail}</span>
          <button
            onClick={() => void auth.signOut()}
            style={{ padding: '4px 12px', background: '#fff', border: '1px solid #BBF7D0', borderRadius: 6, cursor: 'pointer', color: '#166534', fontFamily: 'inherit', fontSize: 11, fontWeight: 700 }}
          >
            تسجيل خروج
          </button>
        </div>
        {noMembership && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '8px 14px', fontSize: 11, color: '#92400E' }}>
            ⚠️ مسجّل الدخول، لكن لا توجد عضوية مزرعة نشطة — البيانات الحية غير متاحة. أضف صفاً في <strong>farm_memberships</strong> لـ DEMO-001.
          </div>
        )}
      </div>
    );
  }

  if (sent) {
    return (
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>
        📧 تم إرسال رابط الدخول إلى <strong>{email}</strong> — تحقق من بريدك الإلكتروني.
      </div>
    );
  }

  return (
    <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', flexWrap: 'wrap' as const, gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: '#374151', fontWeight: 600, flexShrink: 0 }}>🔒 تسجيل الدخول للوصول الكامل:</span>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && void handleSignIn()}
        placeholder="البريد الإلكتروني"
        style={{ flex: 1, minWidth: 180, padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
      />
      <button
        onClick={() => void handleSignIn()}
        disabled={sending || !email.trim()}
        style={{ padding: '6px 14px', background: C.forest, color: '#fff', border: 'none', borderRadius: 6, cursor: sending ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, opacity: sending ? 0.7 : 1 }}
      >
        {sending ? '⏳ جاري…' : 'إرسال رابط الدخول'}
      </button>
      {error && <span style={{ fontSize: 11, color: '#DC2626', width: '100%' }}>{error}</span>}
    </div>
  );
}

// ─── System Health Card — Sprint 10C ─────────────────────────────────
function SystemHealthCard({
  auth, dataSource, dataLoading, activeFarmId, activeFarmCode,
}: {
  auth: ReturnType<typeof useSupabaseAuth>;
  dataSource: string;
  dataLoading: boolean;
  activeFarmId: string | null;
  activeFarmCode: string;
}) {
  const rows: { label: string; value: string; ok: boolean }[] = [
    {
      label: 'Auth',
      value: auth.loading  ? 'جاري التحقق…'
           : auth.signedIn ? `مسجّل الدخول — ${auth.userEmail}`
           : auth.configured ? 'مجهول (غير مسجّل)'
           : 'غير مهيّأ (بدون env vars)',
      ok: auth.signedIn,
    },
    {
      label: 'مصدر البيانات',
      value: dataLoading ? 'جاري التحميل…'
           : dataSource === 'supabase' ? 'Supabase — بيانات حية'
           : 'Mock — بيانات محاكاة محلية',
      ok: !dataLoading && dataSource === 'supabase',
    },
    {
      label: 'سياق المزرعة',
      value: activeFarmId ? `${activeFarmCode} · ${activeFarmId.slice(0, 8)}…` : `${activeFarmCode} — لا يوجد farm_id حي`,
      ok: Boolean(activeFarmId),
    },
    {
      label: 'تسجيل التقارير',
      value: auth.signedIn && activeFarmId ? 'مفعّل — سيتم تسجيل كل تصدير' : 'معطّل — يتطلب تسجيل دخول + عضوية',
      ok: auth.signedIn && Boolean(activeFarmId),
    },
    {
      label: 'التخزين',
      value: auth.configured ? 'مهيّأ — رفع إلى compliance-reports' : 'غير مهيّأ',
      ok: auth.configured,
    },
    {
      label: 'سياسات RLS',
      value: 'membership-based — is_farm_member()',
      ok: true,
    },
  ];

  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: C.forest, marginBottom: 12 }}>⚙️ System Health</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 10px', background: r.ok ? '#F0FDF4' : '#F9FAFB', borderRadius: 8, border: `1px solid ${r.ok ? '#BBF7D0' : '#E5E7EB'}` }}>
            <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{r.ok ? '🟢' : '🔵'}</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</div>
              <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{r.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compliance Tab ───────────────────────────────────────────────────
function ComplianceTab({ isMobile, historicalData, zones }) {
  const { t } = useI18n();
  const [section, setSection] = useState<'scores' | 'reports' | 'audit' | 'traceability' | 'limits' | 'operational' | 'roles' | 'api'>('scores');
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [auditZone, setAuditZone]     = useState('all');
  const [auditType, setAuditType]     = useState('all');
  const [auditPeriod, setAuditPeriod] = useState('30d');

  // Sprint 6: live data from Supabase, falls back to mock constants when env vars absent
  const { data: liveData, source: dataSource, loading: dataLoading } = useComplianceData();
  // Sprint 9D: magic link auth — no-op when Supabase env vars absent
  const auth = useSupabaseAuth();
  const currentAuditEvents:  AuditEventDisplay[]  = liveData?.auditEvents  ?? ENHANCED_AUDIT_EVENTS;
  const currentBatches:      BatchDisplay[]        = liveData?.batches      ?? BATCH_DATA;
  const currentWaterSources: WaterSourceDisplay[]  = liveData?.waterSources ?? WATER_SOURCE_LOG;
  const activeFarmId   = liveData?.activeFarmId   ?? null;
  const activeFarmCode = liveData?.activeFarmCode  ?? 'DEMO-001';

  const sections = [
    { id: 'scores',       label: t.compliance.sec.scores,       icon: ShieldCheck },
    { id: 'reports',      label: t.compliance.sec.reports,      icon: FileText    },
    { id: 'audit',        label: t.compliance.sec.audit,        icon: Clock       },
    { id: 'traceability', label: t.compliance.sec.traceability, icon: Leaf        },
    { id: 'limits',       label: t.compliance.sec.limits,       icon: ShieldCheck },
    { id: 'operational',  label: t.compliance.sec.operational,  icon: Clock       },
    { id: 'roles',        label: t.compliance.sec.roles,        icon: ShieldCheck },
    { id: 'api',          label: t.compliance.sec.api,          icon: FileText    },
  ];

  const allAudit: AuditEntry[] = useMemo(
    () => generateAuditEntries(zones, historicalData),
    [zones, historicalData]
  );

  const periodDays = auditPeriod === '24h' ? 1 : auditPeriod === '7d' ? 7 : 30;
  const cutoff     = new Date(Date.now() - periodDays * 86400000).toISOString().slice(0, 10);

  const filteredAudit = useMemo(() => allAudit.filter(e => {
    if (auditZone !== 'all' && e.zoneId !== auditZone) return false;
    if (auditType !== 'all' && e.type !== auditType)   return false;
    if (e.timestamp.slice(0, 10) < cutoff)             return false;
    return true;
  }), [allAudit, auditZone, auditType, cutoff]);

  const downloadAuditCSV = () => {
    const headers = ['Event ID', 'الوقت', 'المنطقة', 'المشغّل', 'الإجراء', 'قبل', 'بعد', 'السبب', 'Hash', 'الحالة'];
    const rows = currentAuditEvents.map(e =>
      [e.id, e.ts, e.zone, e.actor, e.action, e.before, e.after, e.reason, e.hash, e.status].map(v => `"${v}"`).join(',')
    );
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `igarden-audit-events-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div>
      {/* Banner */}
      <div style={{ background: `linear-gradient(135deg, ${C.forest} 0%, ${C.forestLight} 100%)`, color: '#fff', borderRadius: 12, padding: isMobile ? 18 : 24, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -20, fontSize: 160, opacity: 0.05, pointerEvents: 'none' }}>🛡️</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(124,179,66,0.18)', borderRadius: 14, fontSize: 11, fontWeight: 700, color: C.lime, border: `1px solid ${C.lime}40` }}>
            {t.compliance.bannerCountries}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: 10, fontWeight: 700, border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)' }}>
            {dataLoading ? t.compliance.bannerLoading
              : dataSource === 'supabase' ? t.compliance.bannerSupabase
              : t.compliance.bannerMock}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: 10, fontWeight: 700, background: 'rgba(253,186,116,0.15)', border: '1px solid rgba(253,186,116,0.5)', color: '#FDE68A' }}>
            {t.compliance.bannerRC}
          </div>
        </div>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 900 }}>{t.compliance.title}</h2>
        <p style={{ margin: '6px 0 0', color: C.limeLight, fontSize: isMobile ? 12 : 14 }}>
          {t.compliance.subtitle}
        </p>
      </div>

      {/* Partial-translation notice (EN only) */}
      {t.compliance.partialTranslationNotice && (
        <div role="note" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400E', lineHeight: 1.7 }}>
          {t.compliance.partialTranslationNotice}
        </div>
      )}

      {/* Auth Status — Sprint 9D/10B */}
      {auth.configured && <AuthStatusPanel auth={auth} dataSource={dataSource} dataLoading={dataLoading} />}

      {/* System Health — Sprint 10C */}
      <SystemHealthCard auth={auth} dataSource={dataSource} dataLoading={dataLoading} activeFarmId={activeFarmId} activeFarmCode={activeFarmCode} />

      {/* Section Navigation */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '4px 6px', marginBottom: 20, display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <style>{`div.comp-nav::-webkit-scrollbar { display: none; }`}</style>
        {sections.map(s => {
          const active = section === s.id;
          const Icon   = s.icon;
          return (
            <button key={s.id} onClick={() => setSection(s.id as typeof section)} style={{
              flex: '1 1 auto', padding: isMobile ? '9px 6px' : '10px 14px',
              background: active ? C.forest : 'transparent',
              color: active ? '#fff' : C.inkSoft,
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: active ? 700 : 500,
              fontSize: isMobile ? 11 : 12, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
              transition: 'all .15s',
            }}>
              <Icon size={13} />{s.label}
            </button>
          );
        })}
      </div>

      {/* Sections */}
      {section === 'scores'       && <ComplianceScores   isMobile={isMobile} historicalData={historicalData} />}
      {section === 'reports'      && <ReportsLibrary     isMobile={isMobile} historicalData={historicalData} zones={zones} setReportModal={setReportModal} activeFarmId={activeFarmId} activeFarmCode={activeFarmCode} />}
      {section === 'audit'        && (
        <AuditTrailSection
          isMobile={isMobile}
          filteredAudit={filteredAudit}
          zones={zones}
          auditZone={auditZone}   setAuditZone={setAuditZone}
          auditType={auditType}   setAuditType={setAuditType}
          auditPeriod={auditPeriod} setAuditPeriod={setAuditPeriod}
          downloadAuditCSV={downloadAuditCSV}
          auditEventsData={currentAuditEvents}
          dataSource={dataSource}
        />
      )}
      {section === 'traceability' && <BatchTraceabilitySection isMobile={isMobile} batchData={currentBatches} dataSource={dataSource} />}
      {section === 'limits'       && <SystemLimitsSection      isMobile={isMobile} />}
      {section === 'operational'  && <OperationalLogsSection  isMobile={isMobile} historicalData={historicalData} waterSourceData={currentWaterSources} dataSource={dataSource} />}
      {section === 'roles'        && <RolesPermissionsSection isMobile={isMobile} />}
      {section === 'api'          && <ApiMappingSection       isMobile={isMobile} />}

      {/* Disclaimer */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: `${C.lime}08`, border: `1px dashed ${C.lime}60`, borderRadius: 10, fontSize: 11, color: C.inkSoft, lineHeight: 1.8 }}>
        <strong style={{ color: C.forest }}>* ملاحظة الشفافية: </strong>{DISCLAIMER_TEXT}
      </div>

      {/* Report Modal */}
      {reportModal && (
        <ReportModal
          reportId={reportModal}
          onClose={() => setReportModal(null)}
          historicalData={historicalData}
          zones={zones}
        />
      )}
    </div>
  );
}

// ─── Section 1: درجة الامتثال per Zone ───
function ComplianceScores({ isMobile, historicalData }) {
  const { t } = useI18n();
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
        {Object.entries(REGIONS).map(([rk, region]) => {
          const hist = (historicalData[rk] || []) as Array<{ ph: number; ec: number; tempIn: number }>;
          const { score, deviations } = calcComplianceScore(hist);
          const hasData   = hist.length > 0;
          const sc        = score;
          const statusCol = sc >= 95 ? C.ok : sc >= 85 ? '#F59E0B' : '#DC2626';
          const statusTxt = sc >= 95 ? t.compliance.compliant : sc >= 85 ? t.compliance.needReview : t.compliance.outOfRange;

          return (
            <div key={rk} style={{ background: '#fff', border: `2px solid ${statusCol}40`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{region.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: C.forest, fontSize: 15 }}>{region.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{region.desc}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: hasData ? statusCol : C.muted, fontVariantNumeric: 'tabular-nums' }}>
                    {hasData ? sc : '—'}%
                  </div>
                  <div style={{ fontSize: 9, color: C.muted }}>{t.compliance.last30}</div>
                </div>
              </div>

              <Badge color={statusCol} text={statusTxt} />

              {deviations > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> {deviations} {t.compliance.deviationLogged}
                </div>
              )}

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { label: t.compliance.dailyReadings,                ok: hist.length >= 25 },
                  { label: t.compliance.pHRangeOk,                    ok: sc >= 90 },
                  { label: t.compliance.mewaRef,                       ok: true },
                  { label: t.compliance.gapTracking,                   ok: sc >= 85 },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.inkSoft }}>
                    <span style={{ color: item.ok ? C.ok : '#F59E0B', fontWeight: 700, flexShrink: 0 }}>{item.ok ? '✓' : '○'}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* القيم المرجعية */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
        <h3 style={{ margin: '0 0 14px', color: C.forest, fontSize: 15, fontWeight: 700 }}>{t.compliance.refsCardTitle}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
          <RecCard title="🧪 pH"            value="5.5 – 7.5" unit=""      color="#A855F7" />
          <RecCard title="⚡ EC"             value="≤ 3.5"     unit="mS/cm" color={C.lime}  />
          <RecCard title="💧 TDS"           value="≤ 1500"    unit="ppm"   color="#0EA5E9" />
          <RecCard title="☢️ Cl₂"           value="≤ 0.5"     unit="mg/L"  color="#F59E0B" />
        </div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
          {t.compliance.refsCardSource}
          <br />
          <span style={{ color: C.warn }}>{t.common.note}:</span> {t.compliance.refsCardEcNote}
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: مكتبة التقارير ───
function ReportsLibrary({ isMobile, historicalData, zones, setReportModal, activeFarmId = null, activeFarmCode = 'DEMO-001' }: { isMobile: boolean; historicalData: any; zones: any[]; setReportModal: (v: string) => void; activeFarmId?: string | null; activeFarmCode?: string }) {
  const { t } = useI18n();

  const buildCsvWithMeta = (headers: string[], dataRows: string[][]) => {
    const m = getReportMetadata();
    const meta = [
      `# iGarden Smart OS - Compliance Demo Export`,
      `# Report ID: ${m.reportId}`,
      `# Farm Code: ${m.farmCode}  |  Data Mode: ${m.dataMode}  |  Environment: ${m.environment}`,
      `# Generated: ${m.generatedAt}  |  Version: ${m.version}`,
      `# DISCLAIMER: ${m.disclaimer}`,
      `#`,
    ];
    const rows = [headers.map(h => `"${h}"`).join(','), ...dataRows.map(r => r.map(v => `"${v}"`).join(','))];
    return [...meta, ...rows].join('\n');
  };

  const downloadGAPCSV = () => {
    const headers = ['Batch ID', 'Crop', 'Zone', 'Planting', 'Harvest', 'Water Source', 'Inputs', 'Sensor Summary', 'Invoice', 'Status'];
    const dataRows = BATCH_DATA.map(b => [b.batchId, b.crop.replace(/[^\w\s-]/g,'').trim(), b.zone, b.planting, b.harvest, b.water, b.inputs, b.sensor, b.invoice, b.statusLabel.replace(/[^\w\s-]/g,'').trim()]);
    const csv  = buildCsvWithMeta(headers, dataRows);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'igarden-batches.csv'; link.click();
  };

  const downloadAuditCSVDirect = () => {
    const headers = ['Event ID','Timestamp','Zone','Actor','Action','Before','After','Reason','Hash','Status'];
    const dataRows = ENHANCED_AUDIT_EVENTS.map(e => [e.id,e.ts,e.zone,e.actor,e.action,e.before,e.after,e.reason,e.hash,e.status]);
    const csv  = buildCsvWithMeta(headers, dataRows);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'igarden-audit-trail.csv'; link.click();
  };

  const createReportId = () => {
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    return `RPT-DEMO-${stamp}`;
  };

  const generateCompliancePDF = async () => {
    const meta = getReportMetadata();
    const reportId = createReportId();
    const today = new Date().toISOString().slice(0, 10);

    // ─── 1) ابنِ HTML العربي للتقرير في DOM مخفي ─────────────────────
    const container = document.createElement('div');
    container.dir = 'rtl';
    container.lang = 'ar';
    container.style.cssText = [
      'position: fixed',
      'top: -10000px',
      'left: 0',
      'width: 794px',                 // A4 ≈ 210mm @ 96dpi
      'background: #fff',
      "font-family: 'Tajawal', 'Segoe UI', system-ui, sans-serif",
      'color: #1F2937',
      'padding: 0',
      'margin: 0',
    ].join(';');

    const firstKey = Object.keys(REGIONS)[0];
    const hist = (historicalData[firstKey] || []) as Array<{ dateFull: string; ph: number; ec: number; tempIn: number; humIn: number }>;
    const last30 = hist.slice(-30);
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const avgPH = avg(last30.map(r => r.ph));
    const avgEC = avg(last30.map(r => r.ec));
    const phPass = last30.filter(r => r.ph >= 5.5 && r.ph <= 7.5).length;
    const ecPass = last30.filter(r => r.ec <= 3.5).length;
    const compliancePct = last30.length ? Math.round(((phPass + ecPass) / (last30.length * 2)) * 100) : 0;
    const phPctOk = last30.length ? Math.round((phPass / last30.length) * 100) : 0;
    const ecPctOk = last30.length ? Math.round((ecPass / last30.length) * 100) : 0;
    const cs = AUDIT_CHAIN_SUMMARY;

    const escapeHTML = (s: string) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

    const tableRow = (cells: string[], i: number) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#FAFAF7'}">
        ${cells.map(c => `<td style="padding:6px 9px;border:1px solid #E5E1D8;font-size:10px;color:#1F2937">${c}</td>`).join('')}
      </tr>`;

    container.innerHTML = `
      <style>
        .rpt * { box-sizing: border-box; }
        .rpt h1, .rpt h2, .rpt h3 { margin: 0; }
        .rpt th { padding: 7px 9px; background: #F0EFE8; color: #0F3D2E; font-size: 10px; text-align: right; border: 1px solid #E5E1D8; font-weight: 700; }
      </style>
      <div class="rpt" style="width:794px">
        <!-- Header -->
        <div style="background:linear-gradient(180deg,#0F3D2E,#08291E);color:#fff;padding:22px 28px;border-bottom:4px solid #7CB342">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#9BCB5E;margin-bottom:6px">
            <span>iGarden Smart OS · تقرير جاهزية الامتثال</span>
            <span style="background:rgba(124,179,66,0.18);border:1px solid #7CB34255;padding:3px 10px;border-radius:14px;font-weight:700">DEMO MODE — بيانات محاكاة</span>
          </div>
          <h1 style="font-size:22px;font-weight:900;letter-spacing:-0.01em;margin-bottom:6px">تقرير جاهزية الامتثال</h1>
          <div style="font-size:12px;color:#C7E0A8">
            ${escapeHTML(today)} · المزرعة: ${escapeHTML(activeFarmCode)} · ${escapeHTML(meta.version)}
          </div>
        </div>

        <!-- Disclaimer -->
        <div style="margin:16px 24px;padding:12px 14px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;font-size:11px;color:#92400E;line-height:1.7">
          <strong>إفصاح:</strong> ${escapeHTML(DISCLAIMER_TEXT)}
          <br />
          المراجع التنظيمية (MEWA / SFDA / Saudi GAP / ZATCA) مذكورة لأغراض التوافق المعماري فقط. الشهادة الرسمية تتطلب جهة معتمدة ومفتشاً معتمداً.
        </div>

        <!-- Section: Metadata -->
        <div style="margin:20px 24px">
          <h2 style="font-size:14px;color:#0F3D2E;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #7CB342">البيانات الوصفية للتقرير</h2>
          <table style="width:100%;border-collapse:collapse">
            <tbody>
              ${[
                ['رقم التقرير', reportId],
                ['كود المزرعة', activeFarmCode],
                ['وضع البيانات', meta.dataMode],
                ['البيئة', meta.environment],
                ['تاريخ الإنشاء', meta.generatedAt],
                ['الإصدار', meta.version],
                ['البائع/المعد', meta.generatedBy],
              ].map(([k, v], i) => `
                <tr style="background:${i % 2 === 0 ? '#fff' : '#FAFAF7'}">
                  <td style="padding:7px 10px;border:1px solid #E5E1D8;font-size:11px;font-weight:700;color:#0F3D2E;width:35%">${escapeHTML(k)}</td>
                  <td style="padding:7px 10px;border:1px solid #E5E1D8;font-size:11px;color:#1F2937;font-family:monospace">${escapeHTML(v)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section: Compliance Summary -->
        <div style="margin:20px 24px">
          <h2 style="font-size:14px;color:#0F3D2E;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #7CB342">ملخص الامتثال — آخر 30 يوم</h2>
          <div style="display:flex;gap:10px;margin-bottom:10px">
            ${[
              { label: 'متوسط pH', value: avgPH.toFixed(2), ok: avgPH >= 5.5 && avgPH <= 7.5, ref: '5.5 – 7.5' },
              { label: 'متوسط EC', value: avgEC.toFixed(2) + ' mS', ok: avgEC <= 3.5, ref: '≤ 3.5 mS/cm' },
              { label: 'نسبة الامتثال', value: compliancePct + '%', ok: compliancePct >= 85, ref: 'الهدف 85%' },
              { label: 'pH داخل النطاق', value: phPctOk + '%', ok: phPctOk >= 85, ref: phPass + '/' + last30.length },
              { label: 'EC داخل النطاق', value: ecPctOk + '%', ok: ecPctOk >= 85, ref: ecPass + '/' + last30.length },
            ].map(kpi => `
              <div style="flex:1;background:#fff;border:1px solid ${kpi.ok ? '#A7F3D0' : '#FCA5A5'};border-radius:8px;padding:10px;text-align:center">
                <div style="font-size:9px;color:#9CA3AF">${escapeHTML(kpi.label)}</div>
                <div style="font-size:18px;font-weight:900;color:${kpi.ok ? '#059669' : '#B91C1C'};line-height:1.1;margin:4px 0">${escapeHTML(kpi.value)}</div>
                <div style="font-size:9px;color:#9CA3AF">${escapeHTML(kpi.ref)}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Section: Saudi GAP Readiness -->
        <div style="margin:20px 24px">
          <h2 style="font-size:14px;color:#0F3D2E;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #7CB342">قائمة جاهزية Saudi GAP — 8 بنود</h2>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>${['#','البند','المتطلب','الحالة','الملاحظة'].map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${[
                ['1', 'جودة مياه الري',          'pH 5.5–7.5 · EC ≤ 3.5',     '✓ مُقاس بالنظام',                  `pH ${avgPH.toFixed(2)} (${phPctOk}%) · EC ${avgEC.toFixed(2)} (${ecPctOk}%)`],
                ['2', 'متبقيات المبيدات MRL',   'SFDA.FD 382/2018',           '⊘ خارج النطاق',                    'يتطلب مختبراً معتمداً من SFDA'],
                ['3', 'تتبع رقمي للدفعات',       'BATCH-ID + Hash chain',      '✓ مُقاس بالنظام',                  'Hash chain موثّق في audit_events'],
                ['4', 'نظافة المنشأة',            'بروتوكول تعقيم موثّق',        '⊘ خارج النطاق',                    'يتطلب توثيقاً تشغيلياً بشرياً'],
                ['5', 'كفاءة استخدام المياه',     'ترشيد ≥ 50% vs تقليدي',      '✓ مُقاس بالنظام',                  'محسوب من قراءات 30 يوم'],
                ['6', 'تسجيل العمال',              'هويات + أدوار',               '✓ مُقاس بالنظام',                  '5 أدوار محددة في النموذج'],
                ['7', 'تخزين ونقل المنتج',         'سلسلة تبريد < 6°C',           '⊘ خارج النطاق',                    'يتطلب logger خارجي'],
                ['8', 'التدريب والكفاءة',           'شهادات Saudi GAP',           '⊘ خارج النطاق',                    'توثيق خارج النظام'],
              ].map((r, i) => tableRow(r.map(escapeHTML), i)).join('')}
            </tbody>
          </table>
          <div style="margin-top:8px;padding:8px 10px;background:#FFF7ED;border:1px solid #FDBA74;border-radius:6px;font-size:10px;color:#7C2D12;line-height:1.6">
            <strong>ملاحظة:</strong> "مُقاس بالنظام" = توفّر بيانات تشغيلية تدعم البند. "خارج النطاق" = توثيق بشري أو مختبر خارجي مطلوب.
          </div>
        </div>

        <!-- Section: Audit Events -->
        <div style="margin:20px 24px;page-break-inside:auto">
          <h2 style="font-size:14px;color:#0F3D2E;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #7CB342">سجل المراجعة — أحدث الأحداث</h2>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>${['Event ID','الوقت','المنطقة','المشغّل','الإجراء','Hash'].map(h => `<th style="font-size:9px">${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${ENHANCED_AUDIT_EVENTS.map((e, i) => tableRow([e.id, e.ts, e.zone, e.actor, e.action, e.hash].map(escapeHTML), i)).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section: Batch Traceability -->
        <div style="margin:20px 24px">
          <h2 style="font-size:14px;color:#0F3D2E;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #7CB342">تتبع الدفعات</h2>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>${['Batch ID','المحصول','الزراعة','الحصاد','مصدر المياه','الحالة'].map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${BATCH_DATA.map((b, i) => tableRow([b.batchId, b.crop, b.planting, b.harvest, b.water, b.statusLabel].map(escapeHTML), i)).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section: Audit Chain Integrity -->
        <div style="margin:20px 24px">
          <h2 style="font-size:14px;color:#0F3D2E;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #7CB342">سلامة سلسلة التدقيق</h2>
          <table style="width:100%;border-collapse:collapse">
            <tbody>
              ${[
                ['وضع التحقق', cs.verificationMode],
                ['حالة السلسلة', cs.chainStatus],
                ['عدد الأحداث المفحوصة', String(cs.eventsChecked)],
                ['روابط مكسورة', String(cs.brokenLinks)],
                ['آخر Event Hash', cs.lastEventHash],
              ].map(([k, v], i) => `
                <tr style="background:${i % 2 === 0 ? '#fff' : '#FAFAF7'}">
                  <td style="padding:7px 10px;border:1px solid #E5E1D8;font-size:11px;font-weight:700;color:#0F3D2E;width:35%">${escapeHTML(k)}</td>
                  <td style="padding:7px 10px;border:1px solid #E5E1D8;font-size:11px;color:#1F2937;font-family:monospace">${escapeHTML(v)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          <div style="margin-top:8px;padding:8px 10px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;font-size:10px;color:#92400E;line-height:1.6">
            ${escapeHTML(cs.disclaimer)}
          </div>
        </div>

        <!-- Section: Versioning Rules -->
        <div style="margin:20px 24px">
          <h2 style="font-size:14px;color:#0F3D2E;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #7CB342">قواعد إصدارات السجل</h2>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>${['الكيان','بالعربية','قاعدة الإصدار','الحالة'].map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${AUDIT_VERSIONING.map((r, i) => tableRow([r.object, r.ar, r.versioningRule, r.demoStatus].map(escapeHTML), i)).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer Note -->
        <div style="margin:24px;padding:14px;background:#0F3D2E;color:#9BCB5E;border-radius:8px;font-size:10px;line-height:1.7;text-align:center">
          iGarden Smart OS — Demo Compliance Report · لا يصلح للتقديم الرسمي · DEMO DATA ONLY
          <br />
          المراجع: MEWA-AGR-LAW-IR · SFDA.FD 382/2018 · Saudi GAP · ZATCA Fatoora Phase 2
        </div>
      </div>
    `;

    document.body.appendChild(container);

    let pdfBlob: Blob | null = null;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // ─── 2) التقط الـ DOM كـ canvas ───────────────────────────────
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // ─── 3) قسّم على صفحات A4 وأضفها لـ jsPDF ────────────────────
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const pageH = 297;
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      let heightLeft = imgH;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= pageH;

      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
        heightLeft -= pageH;
      }

      // ─── 4) Footer رقم الصفحة على كل صفحة ─────────────────────────
      const total = pdf.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Page ${i} / ${total} · iGarden Smart OS · DEMO`, pageW - 14, pageH - 5, { align: 'right' });
      }

      pdfBlob = pdf.output('blob') as Blob;
      pdf.save(`igarden-compliance-report-${today}.pdf`);
    } finally {
      if (container.parentNode) container.parentNode.removeChild(container);
    }

    if (!pdfBlob) return;

    void (async () => {
      if (!activeFarmId) {
        console.info('[iGarden] Report export not logged: no activeFarmId available.');
        return;
      }
      const uploadResult = await uploadComplianceReportPdf({ reportId, pdfBlob: pdfBlob! });
      await logReportExport({
        reportId,
        farmId:      activeFarmId,
        reportType:  'Compliance Readiness Report',
        dataMode:    'demo',
        generatedBy: 'Demo System',
        fileUrl:     uploadResult.fileUrl,
        disclaimer:  meta.disclaimer,
      });
      console.info('[iGarden] Compliance report export handled:', uploadResult);
    })();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Farm Context Badge */}
      <div style={{ background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, color: C.forest }}>{t.compliance.farmContext}</span>
        <span style={{ fontWeight: 600 }}>{activeFarmCode}</span>
        <span style={{ color: '#94A3B8', margin: '0 4px' }}>·</span>
        <span>{activeFarmId ? t.compliance.farmIdLinked(activeFarmId.slice(0, 8)) : t.compliance.farmIdNone}</span>
      </div>

      {/* Quick Exports */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: C.forest, marginBottom: 4 }}>{t.compliance.quickExport}</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{t.compliance.quickExportNote}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: t.compliance.pdfBtn,      action: () => void generateCompliancePDF(),                                                    color: '#0F3D2E' },
            { label: t.compliance.gapPdfBtn,   action: () => { setReportModal('saudi-gap');       setTimeout(() => window.print(), 400); }, color: '#7CB342' },
            { label: t.compliance.batchCsvBtn, action: downloadGAPCSV,                                                                        color: '#2563EB' },
            { label: t.compliance.auditCsvBtn, action: downloadAuditCSVDirect,                                                                color: '#6B7280' },
          ].map(({ label, action, color }) => (
            <button key={label} onClick={action} style={{ padding: '9px 16px', background: color, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16 }}>
      {REPORT_DEFS.map(report => (
        <div key={report.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ height: 5, background: report.accentColor }} />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: report.accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, border: `1px solid ${report.accentColor}30` }}>
                {report.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: C.ink, fontSize: 14, lineHeight: 1.3 }}>{report.title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{report.authority}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '3px 9px', borderRadius: 20, border: '1px solid #FDE68A' }}>{t.compliance.readyForPreview}</span>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: C.inkSoft, background: C.creamDark, padding: '3px 8px', borderRadius: 6 }}>{report.reportNo}</span>
            </div>
            <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.65 }}>{report.desc}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: C.muted }}>
              <span>{t.compliance.statusCycle} {report.frequency}</span>
              <span>{t.compliance.pagesIcon} {report.pages} {t.compliance.pagesUnit}</span>
              <span>{t.compliance.dateIcon} {report.lastDate}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button
                onClick={() => setReportModal(report.id)}
                style={{ flex: 1, padding: '9px 12px', background: report.accentColor, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Eye size={14} /> {t.common.preview}
              </button>
              <button
                onClick={() => { setReportModal(report.id); setTimeout(() => window.print(), 400); }}
                style={{ padding: '9px 12px', background: C.creamDark, color: C.inkSoft, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                title="طباعة مباشرة"
              >
                <Printer size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

// ─── Report Modal ───
function ReportModal({ reportId, onClose, historicalData, zones }) {
  const report = REPORT_DEFS.find(r => r.id === reportId);
  if (!report) return null;

  const today    = new Date().toISOString().slice(0, 10);
  const firstKey = Object.keys(REGIONS)[0];
  const hist     = (historicalData[firstKey] || []) as Array<{ dateFull: string; ph: number; ec: number; tempIn: number; humIn: number; water: number }>;
  const last30   = hist.slice(-30);
  const last15   = hist.slice(-15);

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const avgPH   = avg(last30.map(r => r.ph));
  const avgEC   = avg(last30.map(r => r.ec));
  const avgTemp = avg(last30.map(r => r.tempIn));
  const avgHum  = avg(last30.map(r => r.humIn));
  const phPass  = last30.filter(r => r.ph >= 5.5 && r.ph <= 7.5).length;
  const ecPass  = last30.filter(r => r.ec <= 3.5).length;
  const tpPass  = last30.filter(r => r.tempIn >= 18 && r.tempIn <= 30).length;
  const deviations    = (last30.length - phPass) + (last30.length - ecPass) + (last30.length - tpPass);
  const compliancePct = last30.length ? Math.round(((phPass + ecPass + tpPass) / (last30.length * 3)) * 100) : 0;
  const totalWater30  = last30.reduce((s, r) => s + (r.water || 0), 0);
  const dailyAvgWater = last30.length ? totalWater30 / last30.length : 0;
  const perM2PerDay   = dailyAvgWater / 200;
  const savingsPct    = Math.round((1 - perM2PerDay / 6.0) * 100);
  const monthlySaved  = Math.round((6.0 - perM2PerDay) * 200 * 30);
  const sha           = mockSHA(reportId + today);

  const autoRecs: string[] = [];
  if (avgPH < 6.0)  autoRecs.push('⚙️ رفع pH — المتوسط (' + avgPH.toFixed(2) + ') أقل من الحد الأمثل 6.0');
  if (avgPH > 7.0)  autoRecs.push('⚙️ خفض pH — المتوسط (' + avgPH.toFixed(2) + ') تجاوز 7.0');
  if (avgEC > 3.5)  autoRecs.push('⚙️ تخفيف المحلول — EC (' + avgEC.toFixed(2) + ' mS/cm) تجاوز الحد العام (3.5)');
  if (avgEC < 0.8)  autoRecs.push('⚙️ ضخّ سماد إضافي — EC (' + avgEC.toFixed(2) + ' mS/cm) أقل من الحد الأدنى التشغيلي');
  if (avgTemp > 28) autoRecs.push('⚙️ تشغيل التبريد — حرارة المحيط (' + avgTemp.toFixed(1) + '°C) مرتفعة');
  if (autoRecs.length === 0) autoRecs.push('✅ جميع المؤشرات ضمن النطاقات المثلى خلال آخر 30 يوم');

  const rowStyle = (i: number): React.CSSProperties => ({ background: i % 2 === 0 ? '#fff' : C.cream });
  const tdS: React.CSSProperties = { padding: '6px 10px', border: `1px solid ${C.border}`, fontSize: 12 };
  const thS: React.CSSProperties = { padding: '8px 10px', textAlign: 'right' as const, fontWeight: 700, color: C.forest, border: `1px solid ${C.border}`, background: C.creamDark, fontSize: 12 };

  return (
    <div
      className="report-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,61,46,0.8)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 14px', overflowY: 'auto' }}
    >
      <style>{`
        @media print {
          .report-modal-overlay { position: static !important; background: none !important; padding: 0 !important; }
          .report-modal-inner   { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
          .no-print             { display: none !important; }
          body                  { background: #fff !important; }
          @page                 { size: A4; margin: 18mm 14mm; }
        }
      `}</style>
      <div className="report-modal-inner" style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 750, marginBottom: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ background: report.accentColor, color: '#fff', padding: '16px 22px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <IGardenLogo variant="white" size={36} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{report.title}</div>
              <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, fontFamily: 'monospace' }}>{report.reportNo} · {report.authority}</div>
            </div>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#fff', color: report.accentColor, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Printer size={13} /> طباعة PDF
            </button>
            <button onClick={onClose} style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px' }}>

          {/* بيانات المنشأة */}
          <div style={{ background: C.creamDark, borderRadius: 8, padding: '12px 16px', marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: C.forest, marginBottom: 8 }}>بيانات المنشأة</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px 14px', fontSize: 12 }}>
              {[
                ['الاسم العربي',    ESTABLISHMENT_INFO.nameAr],
                ['الاسم الإنجليزي', ESTABLISHMENT_INFO.nameEn],
                ['السجل التجاري',   ESTABLISHMENT_INFO.cr],
                ['رقم MISA',        ESTABLISHMENT_INFO.misa],
                ['النظام',          ESTABLISHMENT_INFO.system],
                ['تاريخ الإصدار',   today],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 6 }}>
                  <span style={{ color: C.muted, flexShrink: 0 }}>{k}:</span>
                  <span style={{ fontWeight: 600, color: C.ink }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══ MEWA Monthly ══ */}
          {reportId === 'mewa-monthly' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: report.accentColor, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${report.accentColor}30` }}>
                التقرير الشهري للمياه والامتثال — {today.slice(0, 7)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'متوسط pH',      value: avgPH.toFixed(2),        ok: avgPH >= 5.5 && avgPH <= 7.5, ref: '5.5 – 7.5' },
                  { label: 'متوسط EC',      value: avgEC.toFixed(2) + ' mS', ok: avgEC <= 3.5,                ref: '≤ 3.5 mS/cm' },
                  { label: 'نسبة الامتثال', value: compliancePct + '%',      ok: compliancePct >= 85,          ref: 'الهدف 85%' },
                  { label: 'انحرافات',       value: String(deviations),       ok: deviations === 0,             ref: 'الهدف صفر' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: '#fff', border: `1px solid ${kpi.ok ? C.ok + '50' : C.danger + '40'}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{kpi.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: kpi.ok ? C.ok : C.danger, lineHeight: 1 }}>{kpi.value}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{kpi.ref}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.forest, marginBottom: 8 }}>سجل القراءات اليومية — آخر 30 يوم</div>
              <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto', marginBottom: 16, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead style={{ position: 'sticky', top: 0 }}>
                    <tr>{['#', 'التاريخ', 'pH', 'EC (mS/cm)', 'حرارة °C', 'رطوبة %', 'الحالة'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {last30.map((row, i) => {
                      const phOk  = row.ph >= 5.5 && row.ph <= 7.5;
                      const ecOk  = row.ec <= 3.5;
                      const tmpOk = row.tempIn >= 18 && row.tempIn <= 30;
                      const allOk = phOk && ecOk && tmpOk;
                      return (
                        <tr key={i} style={rowStyle(i)}>
                          <td style={{ ...tdS, color: C.muted }}>{i + 1}</td>
                          <td style={tdS}>{row.dateFull}</td>
                          <td style={{ ...tdS, color: phOk ? C.ok : C.danger, fontWeight: 600 }}>{row.ph}</td>
                          <td style={{ ...tdS, color: ecOk ? C.ok : C.danger, fontWeight: 600 }}>{row.ec}</td>
                          <td style={{ ...tdS, color: tmpOk ? C.ink : C.danger }}>{row.tempIn}</td>
                          <td style={tdS}>{row.humIn}</td>
                          <td style={{ ...tdS, fontWeight: 700, color: allOk ? C.ok : C.danger }}>{allOk ? '✓ ممتثل' : '✗ انحراف'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ background: `${report.accentColor}08`, border: `1px solid ${report.accentColor}25`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: report.accentColor, marginBottom: 8 }}>توصيات النظام التلقائية</div>
                {autoRecs.map((r, i) => <div key={i} style={{ fontSize: 12, color: C.inkSoft, marginBottom: 5, lineHeight: 1.5 }}>{r}</div>)}
              </div>
            </div>
          )}

          {/* ══ Saudi GAP ══ */}
          {reportId === 'saudi-gap' && (
            <div>
              <div style={{ border: `3px double ${report.accentColor}`, borderRadius: 10, padding: 20, marginBottom: 16, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, right: 20, background: '#fff', padding: '0 8px', fontWeight: 800, fontSize: 13, color: report.accentColor }}>
                  شهادة الممارسات الزراعية الجيدة — Saudi GAP
                </div>
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: C.muted }}>صادرة بموجب: {REGULATORY_REFS[2].fullName}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>الجهة: {REGULATORY_REFS[2].authority}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.forest, marginTop: 6 }}>GAP-CERT-2026-04-A</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12, marginBottom: 12 }}>
                  {[
                    ['الدفعة',             'BATCH-2026-04-A'],
                    ['المحصول',            'طماطم (Solanum lycopersicum)'],
                    ['المنشأ / المنطقة',   'محمية A — جدة'],
                    ['تاريخ الزراعة',      '2026-02-10'],
                    ['الحصاد المتوقع',     '2026-06-10'],
                    ['المساحة',            '200 م²'],
                    ['المبيدات المستخدمة', 'صفر — نظام عضوي'],
                    ['نوع الزراعة',        'هيدروبونيك مغلق'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 6 }}>
                      <span style={{ color: C.muted, flexShrink: 0 }}>{k}:</span>
                      <span style={{ fontWeight: 600, color: C.ink }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.forest, marginBottom: 8 }}>قائمة فحص GAP — 8 بنود (جاهزية الديمو)</div>
              <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['#', 'بند الفحص', 'المتطلب', 'الحالة في النظام', 'الملاحظة'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const phPctOk    = last30.length ? Math.round((phPass / last30.length) * 100) : 0;
                      const ecPctOk    = last30.length ? Math.round((ecPass / last30.length) * 100) : 0;
                      const items: Array<[string, string, string, 'ok' | 'measured' | 'external', string]> = [
                        ['1', 'جودة مياه الري',         'pH 5.5–7.5 · EC ≤ 3.5 mS/cm',  phPctOk >= 85 && ecPctOk >= 85 ? 'measured' : 'measured', `pH متوسط ${avgPH.toFixed(2)} (${phPctOk}% داخل النطاق) · EC متوسط ${avgEC.toFixed(2)} (${ecPctOk}% داخل النطاق)`],
                        ['2', 'متبقيات المبيدات MRL',   'SFDA.FD 382/2018 — مختبر معتمد', 'external', 'النظام لا يقيس MRL — يتطلب تقرير مختبر معتمد من SFDA'],
                        ['3', 'تتبع رقمي للدفعات',       'BATCH-ID موثّق + Hash chain',   'measured', `SHA: ${mockSHA('batch-2026-04-A')} (mock في الديمو · يصبح SHA-256 حقيقي في الإنتاج)`],
                        ['4', 'نظافة المنشأة وتعقيمها', 'بروتوكول تعقيم موثّق',          'external', 'يتطلب سجلاً تشغيلياً بشرياً — خارج نطاق الحساسات'],
                        ['5', 'كفاءة استخدام المياه',    'ترشيد ≥ 50% vs ري تقليدي',     'measured', `توفير ${savingsPct}% (محسوب من قراءات 30 يوم)`],
                        ['6', 'تسجيل العمال والصلاحيات', 'هويات موثّقة + أدوار',          'measured', '5 أدوار محددة (Owner/Operator/Technician/Auditor/System) — يتطلب ربطاً بسجل HR رسمي'],
                        ['7', 'تخزين ونقل المنتج',       'سلسلة تبريد < 6°C موثّقة',     'external', 'النظام لا يرصد سلسلة التبريد — يتطلب logger خارجي'],
                        ['8', 'التدريب والكفاءة',         'شهادات Saudi GAP للمشغّلين',    'external', 'يتطلب توثيق شهادات تدريب خارج النظام'],
                      ];
                      return items.map(([num, item, req, kind, note], i) => {
                        const cfg = kind === 'measured'
                          ? { color: C.ok,      bg: '#ECFDF5', border: '#A7F3D0', label: '✓ مُقاس بالنظام' }
                          : kind === 'external'
                          ? { color: C.warn,    bg: '#FFF7ED', border: '#FDBA74', label: '⊘ خارج النطاق — توثيق خارجي' }
                          : { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: '◔ جزئي' };
                        return (
                          <tr key={num} style={rowStyle(i)}>
                            <td style={{ ...tdS, color: C.muted }}>{num}</td>
                            <td style={{ ...tdS, fontWeight: 600 }}>{item}</td>
                            <td style={{ ...tdS, fontSize: 11, color: C.inkSoft }}>{req}</td>
                            <td style={tdS}>
                              <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' as const }}>{cfg.label}</span>
                            </td>
                            <td style={{ ...tdS, fontSize: 11, color: C.inkSoft }}>{note}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 11, color: '#7C2D12', lineHeight: 1.7 }}>
                <strong>ملاحظة الجاهزية:</strong> "مُقاس بالنظام" يعني توفّر بيانات تشغيلية تدعم البند. "خارج النطاق" يعني أن البند يتطلب توثيقاً بشرياً أو مختبراً خارجياً وليس إثباتاً ينتجه النظام تلقائياً. هذا الملف يعرض جاهزية الديمو وليس شهادة معتمدة.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { cat: 'خطر بيولوجي', level: 'منخفض', color: C.ok },
                  { cat: 'خطر كيميائي', level: 'معدوم',  color: C.ok },
                  { cat: 'خطر فيزيائي', level: 'منخفض', color: C.ok },
                ].map(({ cat, level, color }) => (
                  <div key={cat} style={{ background: '#fff', border: `1px solid ${color}40`, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: C.muted }}>{cat}</div>
                    <div style={{ fontWeight: 800, color, fontSize: 16, marginTop: 4 }}>{level}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, borderTop: `1px dashed ${C.border}`, paddingTop: 14 }}>
                {['أُعدّ بواسطة النظام (آلي)', '<مكان توقيع المراجع المعتمد>', '<مكان ختم المنشأة>'].map(role => (
                  <div key={role} style={{ textAlign: 'center', fontSize: 12 }}>
                    <div style={{ color: C.muted, marginBottom: 28 }}>{role}</div>
                    <div style={{ borderBottom: `1px solid ${C.ink}`, marginBottom: 4 }} />
                    <div style={{ color: C.muted, fontSize: 10 }}>التاريخ: {today}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: C.muted, textAlign: 'center', fontStyle: 'italic' }}>
                ⚠️ التواقيع والأختام أعلاه هي أماكن مخصصة (placeholders) — تُستكمل من جهة الإصدار المعتمدة وليست توقيعات حقيقية.
              </div>
            </div>
          )}

          {/* ══ Water Efficiency ══ */}
          {reportId === 'water-efficiency' && (
            <div>
              <div style={{ background: `linear-gradient(135deg, ${report.accentColor} 0%, #0284C7 100%)`, color: '#fff', borderRadius: 10, padding: '20px 24px', marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>نسبة توفير المياه — هيدروبونيك مقارنةً بالري التقليدي</div>
                <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1 }}>{savingsPct}%</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8 }}>توفير شهري ≈ {monthlySaved.toLocaleString()} لتر · مصدر: MEWA-AGR-LAW-IR</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.forest, marginBottom: 8 }}>مقارنة أساليب الري</div>
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['المعيار', 'هيدروبونيك iGarden', 'ري تقليدي', 'الفرق'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[
                      ['استهلاك المياه/م²/يوم', `${perM2PerDay.toFixed(2)} لتر`,              '6.00 لتر',    `−${(6.0 - perM2PerDay).toFixed(2)} لتر`],
                      ['إجمالي شهري/200م²',     `${(dailyAvgWater * 30).toFixed(0)} لتر`,      '36,000 لتر',  `−${monthlySaved.toLocaleString()} لتر`],
                      ['تسرّب خارج المنظومة',   'صفر (نظام مغلق)',                             '15 – 30%',    'صفر مقابل تسرّب'],
                      ['TDS مياه الري',          `${REGIONS[firstKey as keyof typeof REGIONS].waterTDS} ppm`, 'متغيّر', 'مراقَب تلقائياً'],
                      ['مستهدف MEWA 2030',       '≤ 2 لتر/م²/يوم',                             '—',           '✓ ضمن الهدف'],
                    ].map(([m, ig, trad, diff], i) => (
                      <tr key={m} style={rowStyle(i)}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{m}</td>
                        <td style={{ ...tdS, color: report.accentColor, fontWeight: 700 }}>{ig}</td>
                        <td style={{ ...tdS, color: C.danger }}>{trad}</td>
                        <td style={{ ...tdS, color: C.ok, fontWeight: 600 }}>{diff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.forest, marginBottom: 8 }}>سجل الاستهلاك — آخر 15 يوم</div>
              <div style={{ overflowX: 'auto', marginBottom: 14, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                  <thead>
                    <tr>{['التاريخ', 'استهلاك (لتر)', 'لتر/م²', 'TDS (ppm)', 'الحالة'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {last15.map((row, i) => (
                      <tr key={i} style={rowStyle(i)}>
                        <td style={tdS}>{row.dateFull}</td>
                        <td style={{ ...tdS, fontWeight: 600, color: report.accentColor }}>{row.water}</td>
                        <td style={tdS}>{((row.water || 0) / 200).toFixed(2)}</td>
                        <td style={tdS}>{REGIONS[firstKey as keyof typeof REGIONS].waterTDS}</td>
                        <td style={{ ...tdS, color: C.ok, fontWeight: 600 }}>✓ ضمن الحد</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ background: `${report.accentColor}08`, border: `1px solid ${report.accentColor}25`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: report.accentColor, marginBottom: 8 }}>الأثر البيئي السنوي</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'مياه موفّرة/سنة',             value: (monthlySaved * 12 / 1000).toFixed(1) + ' م³' },
                    { label: 'تخفيض استنزاف الخزانات',      value: savingsPct + '%' },
                    { label: 'مزارع مكافئة يمكن رويها',     value: Math.round(monthlySaved * 12 / 36000) + ' مزارع' },
                    { label: 'توافق مستهدف Vision 2030',    value: '✓ ممتثل' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#fff', borderRadius: 8, padding: 10, textAlign: 'center', border: `1px solid ${report.accentColor}20`, fontSize: 12 }}>
                      <div style={{ fontSize: 10, color: C.muted }}>{label}</div>
                      <div style={{ fontWeight: 800, color: report.accentColor, fontSize: 16, marginTop: 4 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ ZATCA Fatoora — Conceptual Linkage ══ */}
          {reportId === 'zatca-fatoora' && (
            <div>
              <div style={{ background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#991B1B', lineHeight: 1.7 }}>
                <strong>⚠️ تصوّر معماري فقط — ليست فاتورة ZATCA Phase 2 صالحة:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: 11 }}>
                  <li>لا يحوي توقيع رقمي XAdES-B-LTV ولا Cryptographic Stamp Identifier (CSID)</li>
                  <li>QR المعروض ليس بصيغة TLV Base64 المطلوبة (يحتاج: اسم البائع + الرقم الضريبي + الطابع الزمني + الإجمالي + قيمة الضريبة)</li>
                  <li>لا يحوي UUID للفاتورة، نوع الفاتورة (Standard/Simplified)، أو نسبة الضريبة لكل بند</li>
                  <li>الأرقام الضريبية في النموذج وهمية لأغراض العرض</li>
                </ul>
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: report.accentColor, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${report.accentColor}30` }}>
                نموذج توضيحي للربط بين دفعة الحصاد ومرجع الفاتورة
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { title: 'البائع (المورد) — توضيحي', fields: [['الاسم', 'شركة انتيليجنت غاردن (ديمو)'], ['الرقم الضريبي', '<DEMO-VAT-15-DIGITS>'], ['CR', ESTABLISHMENT_INFO.cr], ['العنوان', '<مكان عنوان البائع>']] },
                  { title: 'المشتري — توضيحي',        fields: [['الاسم', '<اسم المشتري>'], ['الرقم الضريبي', '<DEMO-VAT-15-DIGITS>'], ['رقم الدفعة', 'BATCH-2026-04-A'], ['العنوان', '<مكان عنوان المشتري>']] },
                ].map(({ title, fields }) => (
                  <div key={title} style={{ background: C.creamDark, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: report.accentColor, marginBottom: 8 }}>{title}</div>
                    {fields.map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: C.muted, flexShrink: 0 }}>{k}:</span>
                        <span style={{ fontWeight: 600, color: C.ink }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.forest, marginBottom: 8 }}>بنود الفاتورة</div>
              <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['الصنف', 'الكمية', 'سعر الوحدة', 'المجموع', 'ضريبة 15%', 'الإجمالي'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#fff' }}>
                      <td style={{ ...tdS, fontWeight: 600 }}>طماطم هيدروبونيك — BATCH-2026-04-A</td>
                      <td style={tdS}>150 كغ</td>
                      <td style={tdS}>5.00 ر.س</td>
                      <td style={tdS}>750.00 ر.س</td>
                      <td style={{ ...tdS, color: report.accentColor }}>112.50 ر.س</td>
                      <td style={{ ...tdS, fontWeight: 800 }}>862.50 ر.س</td>
                    </tr>
                    <tr style={{ background: C.creamDark }}>
                      <td colSpan={3} style={{ ...tdS, fontWeight: 700, textAlign: 'right' }}>الإجمالي قبل الضريبة</td>
                      <td colSpan={3} style={{ ...tdS, fontWeight: 800, fontSize: 14 }}>750.00 ر.س</td>
                    </tr>
                    <tr style={{ background: C.creamDark }}>
                      <td colSpan={3} style={{ ...tdS, fontWeight: 700, textAlign: 'right', color: report.accentColor }}>ضريبة القيمة المضافة 15%</td>
                      <td colSpan={3} style={{ ...tdS, fontWeight: 700, color: report.accentColor }}>112.50 ر.س</td>
                    </tr>
                    <tr style={{ background: `${report.accentColor}12` }}>
                      <td colSpan={3} style={{ ...tdS, fontWeight: 900, fontSize: 14, textAlign: 'right', color: report.accentColor }}>الإجمالي شامل الضريبة</td>
                      <td colSpan={3} style={{ ...tdS, fontWeight: 900, fontSize: 18, color: report.accentColor }}>862.50 ر.س</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                <QRCode value={`DEMO|invoice=DEMO-INV-2026-04-A-001|batch=BATCH-2026-04-A|date=${today}|note=NOT-A-VALID-ZATCA-TLV`} size={88} label="QR توضيحي للفاتورة (ليس TLV)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: report.accentColor, marginBottom: 4 }}>QR توضيحي — يحتوي بيانات نصية فقط (ليس TLV Base64 صالحاً)</div>
                  <div style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.7 }}>
                    رقم الفاتورة (تجريبي): <span style={{ fontFamily: 'monospace' }}>DEMO-INV-2026-04-A-001</span><br />
                    رقم الدفعة: <span style={{ fontFamily: 'monospace' }}>BATCH-2026-04-A</span><br />
                    تاريخ التوريد: {today}<br />
                    <span style={{ color: C.warn }}>UUID الفاتورة:</span> <span style={{ fontFamily: 'monospace' }}>&lt;ينتجه نظام الإنتاج&gt;</span>
                  </div>
                </div>
              </div>
              <div style={{ background: `${report.accentColor}08`, border: `1px solid ${report.accentColor}25`, borderRadius: 8, padding: 12, fontSize: 12, color: C.inkSoft, lineHeight: 1.7 }}>
                💡 الهدف الوحيد من هذا النموذج: توضيح كيفية ربط BATCH-ID بمرجع الفاتورة الإلكترونية في معمارية النظام. التكامل الفعلي مع ZATCA يتطلب SDK معتمد، CSID، توقيع رقمي، وQR TLV — كلها خارج نطاق هذا الديمو.
              </div>
            </div>
          )}

          {/* SHA + توقيعات */}
          <div style={{ marginTop: 18, borderTop: `1px dashed ${C.border}`, paddingTop: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, fontSize: 11, color: C.muted, marginBottom: 12, background: C.creamDark, padding: '8px 12px', borderRadius: 6 }}>
              <span><strong>SHA-256 (mock):</strong> <span style={{ fontFamily: 'monospace' }}>{sha}</span></span>
              <span><strong>رابط التحقق (نمطي — غير مفعَّل):</strong> <span style={{ fontFamily: 'monospace', color: report.accentColor, opacity: 0.65, textDecoration: 'line-through' }}>verify.igarden.sa/{reportId}</span></span>
            </div>
            <div style={{ marginBottom: 12, fontSize: 10, color: C.muted, fontStyle: 'italic' }}>
              ⓘ نظام التحقق (verify.igarden.sa) لم يُنشر بعد — الرابط أعلاه يظهر كقالب لتوضيح المعمارية المستقبلية.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {['أُعدّ بواسطة النظام (آلي)', '<مكان توقيع المشغّل>', '<مكان ختم المنشأة>'].map(role => (
                <div key={role} style={{ textAlign: 'center', fontSize: 11 }}>
                  <div style={{ color: C.muted, marginBottom: 24 }}>{role}</div>
                  <div style={{ borderBottom: `1px solid ${C.ink}`, marginBottom: 4 }} />
                  <div style={{ color: C.muted }}>التاريخ: {today}</div>
                </div>
              ))}
            </div>
          </div>

          {/* المراجع */}
          <div style={{ marginTop: 14, padding: '10px 14px', background: `${C.lime}08`, border: `1px dashed ${C.lime}60`, borderRadius: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: C.forest, marginBottom: 6 }}>المراجع التنظيمية:</div>
            {REGULATORY_REFS.map(ref => (
              <div key={ref.code} style={{ fontSize: 10, color: C.inkSoft, marginBottom: 3 }}>
                <strong>{ref.code}</strong> — {ref.fullName} ({ref.authority})
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fffbf0', border: `1px solid ${C.warn}30`, borderRadius: 8, fontSize: 10, color: C.inkSoft, lineHeight: 1.8 }}>
            <strong>* ملاحظة: </strong>{DISCLAIMER_TEXT}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 7: Roles & Permissions ───
function RolesPermissionsSection({ isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: C.forest, marginBottom: 4 }}>الصلاحيات والأدوار — User Roles & Permissions</div>
        <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.6, marginBottom: 14 }}>
          كل إجراء تشغيلي أو يدوي مرتبط بدور واضح. <strong>في هذا الديمو، الأدوار معروضة كبنية صلاحيات مقترحة وليست نظام مصادقة فعلي.</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {USER_ROLES.map(r => (
            <div key={r.role} style={{ border: `1px solid ${r.color}30`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: r.color, color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{r.ar}</div>
                  <div style={{ fontSize: 10, opacity: 0.85, fontFamily: 'monospace' }}>{r.role}</div>
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.ok, marginBottom: 6 }}>✅ الصلاحيات</div>
                {r.permissions.map((p, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.inkSoft, marginBottom: 3, display: 'flex', gap: 6 }}>
                    <span style={{ color: C.ok, flexShrink: 0 }}>•</span>{p}
                  </div>
                ))}
                <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, margin: '10px 0 6px' }}>🚫 القيود</div>
                {r.restrictions.map((res, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.inkSoft, marginBottom: 3, display: 'flex', gap: 6 }}>
                    <span style={{ color: C.danger, flexShrink: 0 }}>•</span>{res}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#92400E', lineHeight: 1.7 }}>
        <strong>ملاحظة هامة: </strong>هذا الهيكل مبني لدعم Saudi GAP Record Keeping ومتطلبات الامتثال. التطبيق الفعلي لنظام المصادقة (Authentication) يتم عند ربط النظام ببيئة إنتاج.
      </div>
    </div>
  );
}

// ─── Section 8: API-ready Mapping ───
function ApiMappingSection({ isMobile }) {
  const thS: React.CSSProperties = { padding: '9px 11px', textAlign: 'right' as const, fontWeight: 700, color: C.forest, border: `1px solid ${C.border}`, background: C.creamDark, fontSize: 11 };
  const tdS: React.CSSProperties = { padding: '7px 11px', border: `1px solid ${C.border}`, fontSize: 12 };
  const statusColor = (s: string) => s === 'Mapped' ? { bg: '#ECFDF5', color: C.ok } : s === 'Required' ? { bg: '#FEF2F2', color: C.danger } : { bg: '#FFFBEB', color: C.warn };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#1E3A8A', lineHeight: 1.7 }}>
        <strong>API-ready Mapping: </strong>
        هذه الخريطة توضح جاهزية بنية البيانات للتكامل المستقبلي. <strong>لا تعني وجود تكامل رسمي أو إرسال فعلي لأي بيانات إلى جهة حكومية.</strong>
      </div>

      {/* NAAMA */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.creamDark, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.forest }}>🏛️ NAAMA Platform Mapping</div>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', fontWeight: 700, border: '1px solid #FDE68A' }}>API-ready when official docs available</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['حقل داخلي','Label','حقل NAAMA','الحالة','ملاحظة'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {NAAMA_MAPPING.map((r, i) => {
                const sc = statusColor(r.status);
                return (
                  <tr key={r.internal} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{r.internal}</td>
                    <td style={tdS}>{r.label}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11, color: '#2563EB' }}>{r.target}</td>
                    <td style={tdS}><span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{r.status}</span></td>
                    <td style={{ ...tdS, fontSize: 11, color: C.inkSoft }}>{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ZATCA */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.creamDark, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.forest }}>🧾 ZATCA Fatoora Mapping</div>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#FAF5FF', color: '#7C3AED', fontWeight: 700, border: '1px solid #E9D5FF' }}>Invoice linkage only — not food traceability</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['حقل داخلي','Label','حقل ZATCA','الحالة','ملاحظة'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {ZATCA_MAPPING.map((r, i) => {
                const sc = statusColor(r.status);
                return (
                  <tr key={r.internal} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{r.internal}</td>
                    <td style={tdS}>{r.label}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11, color: '#7C3AED' }}>{r.target}</td>
                    <td style={tdS}><span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{r.status}</span></td>
                    <td style={{ ...tdS, fontSize: 11, color: C.inkSoft }}>{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Card */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: C.forest, marginBottom: 12 }}>Report Metadata — بيانات وصفية للتقارير</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 12 }}>
          {[
            ['Farm Code',    'DEMO-001'],
            ['Data Mode',    'Simulated'],
            ['Environment',  'Demo'],
            ['Version',      'Compliance Demo RC-2 (Bilingual)'],
            ['Report Format', 'PDF / CSV / Print'],
            ['Metadata Scope', 'Header of every export'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: C.creamDark, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{k}</div>
              <div style={{ fontWeight: 700, color: C.ink, fontFamily: k.includes('Code') || k.includes('Format') ? 'monospace' : 'inherit' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>
          هذه الـ metadata تُضاف تلقائياً لكل تصدير (CSV header · PDF title · Printable report) لتسهيل التتبع والمراجعة.
        </div>
      </div>
    </div>
  );
}

// ─── Section 6: Operational Logs ───
function OperationalLogsSection({ isMobile, historicalData, waterSourceData = WATER_SOURCE_LOG, dataSource = 'mock' }: { isMobile: boolean; historicalData: any; waterSourceData?: WaterSourceDisplay[]; dataSource?: string }) {
  const thS: React.CSSProperties = { padding: '9px 11px', textAlign: 'right' as const, fontWeight: 700, color: C.forest, border: `1px solid ${C.border}`, background: C.creamDark, fontSize: 11, whiteSpace: 'nowrap' as const };
  const tdS: React.CSSProperties = { padding: '7px 11px', border: `1px solid ${C.border}`, fontSize: 12 };

  const dqColor = (s: string) => s === 'Good' ? C.ok : s === 'Report-ready' ? '#2563EB' : s === 'Review Soon' ? C.warn : '#DC2626';

  const downloadCSV = (filename: string, rows: string[][]) => {
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = filename; link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Data Quality Panel ── */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: C.forest, color: '#fff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>📊 جودة البيانات — Data Quality</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>مؤشرات جاهزية البيانات للتقرير — Demo</div>
          </div>
          <button onClick={() => downloadCSV('data-quality.csv', [
            ['المؤشر','Label','القيمة','الحالة','الملاحظة'],
            ...DATA_QUALITY_METRICS.map(m => [m.labelAr, m.label, m.value, m.status, m.note]),
          ])} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Download size={12} /> CSV
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 0 }}>
          {DATA_QUALITY_METRICS.map((m, i) => {
            const col = dqColor(m.status);
            return (
              <div key={m.label} style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, borderRight: i % 2 === 0 ? `1px solid ${C.border}` : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 56, height: 56, borderRadius: 10, background: col + '15', border: `2px solid ${col}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: col, lineHeight: 1, textAlign: 'center' }}>{m.value}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{m.labelAr}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{m.label}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: col + '15', color: col, border: `1px solid ${col}40` }}>{m.status}</span>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 5, lineHeight: 1.5 }}>{m.note}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '10px 18px', background: '#FFFBEB', borderTop: `1px solid #FDE68A`, fontSize: 11, color: '#92400E' }}>
          ⚠️ هذه المؤشرات لبيئة الديمو. "Report-ready" لا تعني امتثالاً رسمياً — تعني أن بنية البيانات جاهزة للمراجعة.
        </div>
      </div>

      {/* ── Calibration & Maintenance ── */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.forest }}>🔧 سجل المعايرة والصيانة</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Calibration & Maintenance Log — Simulated</div>
          </div>
          <button onClick={() => downloadCSV('calibration-log.csv', [
            ['Device ID','Type','Zone','Last Calibration','Next Calibration','Technician','Status','Notes'],
            ...CALIBRATION_LOG.map(d => [d.deviceId, d.type, d.zone, d.lastCal, d.nextCal, d.tech, d.status, d.notes]),
          ])} style={{ padding: '6px 12px', background: C.creamDark, color: C.inkSoft, border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Download size={12} /> CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead><tr>{['Device ID','النوع','المنطقة','آخر معايرة','المعايرة القادمة','الفني','الحالة','الملاحظة'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {CALIBRATION_LOG.map((d, i) => {
                const sc = d.status === 'Valid' ? { bg: '#ECFDF5', color: C.ok } : { bg: '#FFFBEB', color: C.warn };
                return (
                  <tr key={d.deviceId} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>{d.deviceId}</td>
                    <td style={tdS}>{d.type}</td>
                    <td style={{ ...tdS, fontWeight: 600, color: C.forest }}>{d.zone}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11 }}>{d.lastCal}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11 }}>{d.nextCal}</td>
                    <td style={tdS}>{d.tech}</td>
                    <td style={tdS}><span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{d.status}</span></td>
                    <td style={{ ...tdS, color: C.inkSoft, fontSize: 11 }}>{d.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 18px', background: `${C.lime}06`, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>
          💡 هذا السجل يوضح بنية توثيق المعايرة في بيئة الديمو. اعتماد أي جهاز رسمياً يتطلب إجراءات توثيق وفريقاً مختصاً.
        </div>
      </div>

      {/* ── Input Usage Log ── */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.forest }}>🧪 سجل المدخلات الزراعية</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Input Usage Log — Linked to Batch ID — Simulated</div>
          </div>
          <button onClick={() => downloadCSV('input-usage-log.csv', [
            ['Input ID','Type','Name','Quantity','Unit','Batch','Applied By','Applied At','Zone','Reason'],
            ...INPUT_USAGE_LOG.map(r => [r.inputId, r.type, r.name, r.qty, r.unit, r.batch, r.appliedBy, r.appliedAt, r.zone, r.reason]),
          ])} style={{ padding: '6px 12px', background: C.creamDark, color: C.inkSoft, border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Download size={12} /> CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead><tr>{['Input ID','النوع','المادة','الكمية','الوحدة','Batch','المشغّل','الوقت','المنطقة','السبب'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {INPUT_USAGE_LOG.map((r, i) => {
                const typeColor = r.type === 'Nutrient' ? '#2563EB' : r.type === 'pH Adjustment' ? C.warn : C.ok;
                return (
                  <tr key={r.inputId} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{r.inputId}</td>
                    <td style={tdS}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: typeColor + '18', color: typeColor }}>{r.type}</span></td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', textAlign: 'center' as const }}>{r.qty}</td>
                    <td style={{ ...tdS, color: C.muted }}>{r.unit}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 10, color: C.forest }}>{r.batch}</td>
                    <td style={tdS}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: r.appliedBy === 'System' ? '#EFF6FF' : '#FFFBEB', color: r.appliedBy === 'System' ? '#1D4ED8' : '#92400E' }}>{r.appliedBy === 'System' ? '🤖' : '✋'} {r.appliedBy}</span></td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 10 }}>{r.appliedAt}</td>
                    <td style={{ ...tdS, fontWeight: 600, color: C.forest }}>{r.zone}</td>
                    <td style={{ ...tdS, color: C.inkSoft, fontSize: 11 }}>{r.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 18px', background: '#EFF6FF', borderTop: `1px solid #BFDBFE`, fontSize: 11, color: '#1E40AF', lineHeight: 1.6 }}>
          💡 كل مدخل زراعي مرتبط بـ Batch ID أو Zone ID لضمان إمكانية التتبع. هذا الربط أساسي لمتطلبات Saudi GAP Record Keeping.
        </div>
      </div>

      {/* ── Water Source Documentation ── */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.forest }}>💧 توثيق مصدر المياه</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Water Source Documentation —{' '}
              {dataSource === 'supabase' ? '🟢 Supabase Demo DB' : '🔵 Simulated readings'}
            </div>
          </div>
          <button onClick={() => downloadCSV('water-source-log.csv', [
            ['Source','Treatment','Last Test','pH','EC','TDS','Status','Attachment'],
            ...waterSourceData.map(r => [r.source, r.treatment, r.lastTest, r.ph, r.ec, r.tds, r.status, r.attachment]),
          ])} style={{ padding: '6px 12px', background: C.creamDark, color: C.inkSoft, border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Download size={12} /> CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead><tr>{['مصدر المياه','نوع المعالجة','آخر اختبار','pH','EC','TDS','الحالة','المرفق'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {waterSourceData.map((r, i) => {
                const ok = r.status === 'ضمن الهدف';
                return (
                  <tr key={r.source} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{r.source}</td>
                    <td style={{ ...tdS, fontSize: 11, color: C.inkSoft }}>{r.treatment}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11 }}>{r.lastTest}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontWeight: 600 }}>{r.ph}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontWeight: 600 }}>{r.ec}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontWeight: 600 }}>{r.tds}</td>
                    <td style={tdS}><span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ok ? '#ECFDF5' : '#FFFBEB', color: ok ? C.ok : C.warn }}>{r.status}</span></td>
                    <td style={{ ...tdS, fontSize: 11, color: C.muted }}>{r.attachment}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 18px', background: '#FFF7ED', borderTop: `1px solid #FDBA74`, fontSize: 11, color: '#7C2D12', lineHeight: 1.6 }}>
          ⚠️ قيم pH وEC وTDS هنا أهداف تشغيلية زراعية، <strong>وليست حدوداً تنظيمية نهائية</strong>. أي اعتماد رسمي لجودة المياه يتطلب مستنداً من جهة مختصة عند الحاجة.
        </div>
      </div>

    </div>
  );
}

// ─── Section 5: System Limits ───
function SystemLimitsSection({ isMobile }) {
  const cardS: React.CSSProperties = { background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 16 : 20 };
  const labelS: React.CSSProperties = { fontWeight: 800, fontSize: 14, marginBottom: 14 };

  const DOES: string[]     = [
    'يوثّق قراءات الحساسات (pH · EC · حرارة · رطوبة · CO₂) في الوقت الفعلي',
    'يسجّل أوامر الري والتسميد الآلي ويحتفظ بسجل تدقيق كامل',
    'يولّد تقارير شهرية قابلة للمراجعة والتصدير (PDF / CSV)',
    'يساعد في تنظيم ملف جاهزية Saudi GAP وتتبع الدفعات',
    'يربط Batch ID بمرجع الفاتورة الإلكترونية عند إتمام البيع',
  ];
  const DOESNOT: string[]  = [
    'لا يمنح شهادة Saudi GAP — الشهادة تصدر من جهة معتمدة عبر منصة NAAMA',
    'لا يستبدل التفتيش الرسمي من مفتّش زراعي معتمد',
    'لا يقيس متبقيات المبيدات MRL مخبرياً — يتطلب مختبراً معتمداً من SFDA',
    'لا يُرسل بيانات لمنصات حكومية دون تكامل API رسمي ومعتمد',
    'لا يتحدث باسم وزارة البيئة والمياه والزراعة أو أي جهة رسمية',
  ];

  const GAP_CHECKLIST = [
    { item: 'جودة مياه الري',          status: 'جاهز',               note: 'pH وEC مراقَبان بالوقت الفعلي' },
    { item: 'حفظ السجلات',             status: 'جاهز جزئياً',        note: 'قراءات وأوامر موثّقة — تصدير PDF قيد التطوير' },
    { item: 'تتبع الدفعات',            status: 'جاهز جزئياً',        note: 'Batch ID مربوط بالمحصول والمنطقة' },
    { item: 'تقييم المخاطر',           status: 'قيد الإعداد',        note: 'نموذج أولي — يحتاج اعتمادًا داخليًا' },
    { item: 'متبقيات المبيدات MRL',    status: 'يتطلب مختبر معتمد', note: 'النظام لا يقيس MRL — يُرفق تقرير المختبر يدوياً' },
    { item: 'سجل المدخلات الزراعية',   status: 'قيد التطوير',        note: 'Sprint 2' },
    { item: 'سلامة العمال',            status: 'قيد التطوير',        note: 'Sprint 3' },
    { item: 'إدارة المخلفات',          status: 'قيد التطوير',        note: 'Sprint 3' },
  ];

  const statusColor = (s: string) => {
    if (s === 'جاهز')               return { bg: '#ECFDF5', color: C.ok,      border: '#A7F3D0' };
    if (s === 'جاهز جزئياً')        return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
    if (s === 'قيد الإعداد')        return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
    if (s === 'يتطلب مختبر معتمد') return { bg: '#FFF7ED', color: '#C2410C', border: '#FDBA74' };
    return { bg: C.creamDark, color: C.muted, border: C.border };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ما يفعله / ما لا يفعله */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div style={{ ...cardS, borderTop: `4px solid ${C.ok}` }}>
          <div style={{ ...labelS, color: C.ok }}>✅ ما يفعله النظام</div>
          {DOES.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13, color: C.inkSoft, lineHeight: 1.55 }}>
              <span style={{ color: C.ok, flexShrink: 0, marginTop: 2 }}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ ...cardS, borderTop: `4px solid ${C.danger}` }}>
          <div style={{ ...labelS, color: C.danger }}>🚫 ما لا يفعله النظام</div>
          {DOESNOT.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13, color: C.inkSoft, lineHeight: 1.55 }}>
              <span style={{ color: C.danger, flexShrink: 0, marginTop: 2 }}>✗</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Saudi GAP Readiness Checklist */}
      <div style={cardS}>
        <div style={{ ...labelS, color: C.forest }}>📋 جاهزية Saudi GAP — حالة كل بند</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.creamDark }}>
                {['بند الجاهزية', 'الحالة', 'ملاحظة'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: C.forest, border: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GAP_CHECKLIST.map(({ item, status, note }, i) => {
                const sc = statusColor(status);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                    <td style={{ padding: '8px 12px', border: `1px solid ${C.border}`, fontWeight: 600 }}>{item}</td>
                    <td style={{ padding: '8px 12px', border: `1px solid ${C.border}` }}>
                      <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{status}</span>
                    </td>
                    <td style={{ padding: '8px 12px', border: `1px solid ${C.border}`, color: C.inkSoft, fontSize: 12 }}>{note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NAAMA Integration Status */}
      <div style={{ ...cardS, borderTop: `4px solid #2563EB` }}>
        <div style={{ ...labelS, color: '#2563EB' }}>🏛️ حالة التكامل مع المنصات الحكومية</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { name: 'NAAMA (منصة نعمة)', current: 'تصدير يدوي للتقارير', next: 'Mapping جاهز للحقول', future: 'API مباشر عند توفر واجهة رسمية', color: '#2563EB' },
            { name: 'SFDA', current: 'توثيق المدخلات فقط', next: 'ربط سجل المبيدات', future: 'تقرير MRL مرفق من المختبر', color: '#DC2626' },
            { name: 'ZATCA Fatoora', current: 'ربط Batch ID بالفاتورة', next: 'تكامل QR تلقائي', future: 'مرحلة 2 مكتملة عند الإنتاج', color: '#7C3AED' },
          ].map(({ name, current, next, future, color }) => (
            <div key={name} style={{ background: C.creamDark, borderRadius: 8, padding: 14, borderRight: `4px solid ${color}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 10 }}>{name}</div>
              {[['الحالة الحالية', current, C.inkSoft], ['المرحلة القادمة', next, '#2563EB'], ['المستقبل', future, C.muted]].map(([label, val, clr]) => (
                <div key={label as string} style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: C.muted, flexShrink: 0, minWidth: 100 }}>{label as string}:</span>
                  <span style={{ color: clr as string, fontWeight: 500 }}>{val as string}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, color: '#1E40AF', lineHeight: 1.7 }}>
          <strong>ملاحظة: </strong>لا يوجد حالياً ربط مباشر مع أي منصة حكومية. يستخدم النظام حقولاً متوافقة مع متطلبات NAAMA وZATCA جاهزة للتكامل الرسمي عند توفّر API معتمد.
        </div>
      </div>

      {/* GLOBAL Standards Gap Analysis Card */}
      <div style={{ ...cardS, borderTop: `4px solid #7C3AED` }}>
        <div style={{ ...labelS, color: '#7C3AED' }}>🌍 تحليل الفجوة مقابل المعايير العالمية</div>
        <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.7, marginBottom: 10 }}>
          وثيقة منفصلة تستعرض جاهزية النظام مقابل ستة معايير: <strong>GLOBALG.A.P. IFA v6 · ISO 22005:2007 · Codex HACCP · EU MRL Reg 396/2005 · ISO 22000:2018 · ISO 27001</strong>. تتضمّن خارطة طريق من 3 سبرنتات لإغلاق الفجوات.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, fontSize: 11 }}>
          {[
            { name: 'Saudi GAP', pct: 60, color: C.warn },
            { name: 'GLOBALG.A.P.', pct: 45, color: C.warn },
            { name: 'ISO 22005', pct: 70, color: C.ok },
            { name: 'Codex HACCP', pct: 55, color: C.warn },
            { name: 'EU MRL', pct: 25, color: C.danger },
            { name: 'ISO 27001', pct: 65, color: C.ok },
          ].map(s => (
            <div key={s.name} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontWeight: 800, color: s.color, fontSize: 16 }}>{s.pct}%</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
          📄 الوثيقة الكاملة في المستودع: <span style={{ fontFamily: 'monospace', color: '#7C3AED' }}>docs/global-standards-gap-analysis.md</span>
        </div>
      </div>

      {/* SFDA / MRL Disclaimer */}
      <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: '#C2410C', marginBottom: 8 }}>⚗️ تنبيه مهم — SFDA ومتبقيات المبيدات (MRL)</div>
        <div style={{ fontSize: 13, color: '#7C2D12', lineHeight: 1.75 }}>
          نظام iGarden يوثّق ظروف الإنتاج والمدخلات والقراءات التشغيلية. <strong>لا يقيس النظام متبقيات المبيدات MRL مخبرياً</strong>، ولا يُغني عن شهادة مختبر معتمد من SFDA عند الحاجة. وفقاً للائحة SFDA.FD 382/2018، يجب إجراء اختبار MRL على المنتج النهائي في مختبر معتمد.
        </div>
      </div>

      {/* ZATCA Disclaimer */}
      <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: '#7C3AED', marginBottom: 8 }}>🧾 توضيح دور ZATCA في هذا النموذج</div>
        <div style={{ fontSize: 13, color: '#4C1D95', lineHeight: 1.75 }}>
          دور ZATCA في هذا النموذج يقتصر على <strong>ربط دفعة الحصاد (Batch ID) بالفاتورة الإلكترونية</strong> ومرجع البيع عند توفّره. لا تُستخدم ZATCA كبديل عن متطلبات سلامة الغذاء أو شهادة Saudi GAP، ولا تُعد منصة تتبع غذائي.
        </div>
      </div>

    </div>
  );
}

// ─── Sprint 4B: Audit Chain Integrity Panel ───
function AuditChainIntegrityPanel({ isMobile }) {
  const s = AUDIT_CHAIN_SUMMARY;
  const thS: React.CSSProperties = { padding: '8px 10px', textAlign: 'right' as const, fontWeight: 700, color: C.forest, border: `1px solid ${C.border}`, background: C.creamDark, fontSize: 11, whiteSpace: 'nowrap' as const };
  const tdS: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${C.border}`, fontSize: 11 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Summary header */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: C.forest, color: '#fff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>سلامة سلسلة التدقيق — Audit Chain Integrity</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>بنية ديمو قابلة لكشف العبث · Tamper-evident demo structure</div>
          </div>
          <span style={{ padding: '4px 12px', borderRadius: 20, background: '#ECFDF5', color: C.ok, fontWeight: 800, fontSize: 12, border: '1px solid #A7F3D0' }}>✅ {s.chainStatus}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { label: 'Verification Mode', value: s.verificationMode,                         color: C.warn    },
            { label: 'Events Checked',    value: String(s.eventsChecked),                    color: '#2563EB' },
            { label: 'Broken Links',      value: String(s.brokenLinks),                      color: s.brokenLinks > 0 ? C.danger : C.ok },
            { label: 'Last Event Hash',   value: `${s.lastEventHash.slice(0,8)}…`,            color: C.inkSoft },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '14px 16px', borderRight: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
              <div style={{ fontWeight: 800, fontSize: 13, color, fontFamily: label.includes('Hash') ? 'monospace' : 'inherit' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 16px', background: '#FFFBEB', borderTop: `1px solid #FDE68A`, fontSize: 11, color: '#92400E', lineHeight: 1.7 }}>
          <strong>ملاحظة: </strong>{s.disclaimer}
        </div>
      </div>

      {/* Hash chain table — derived from AUDIT_CHAIN_EVENTS (same source as ENHANCED_AUDIT_EVENTS) */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.creamDark }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.forest }}>سلسلة Hash المترابطة — Linked Hash Chain</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>كل حدث يحمل previousHash من الحدث السابق · Each event carries the previous event's hash</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead><tr>{['Event ID','الوقت','المشغّل','الإجراء','Previous Hash','Event Hash','Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {AUDIT_CHAIN_EVENTS.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 10, color: C.inkSoft }}>{e.id}</td>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' as const }}>{e.ts}</td>
                  <td style={tdS}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: e.actor === 'System' ? '#EFF6FF' : '#FFFBEB', color: e.actor === 'System' ? '#1D4ED8' : '#92400E' }}>{e.actor === 'System' ? '🤖' : '✋'} {e.actor}</span></td>
                  <td style={{ ...tdS, color: C.ink, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{e.action}</td>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 10, color: e.previousHash === 'GENESIS' ? C.lime : C.muted, whiteSpace: 'nowrap' as const }}>{e.previousHash === 'GENESIS' ? '◆ GENESIS' : e.previousHash.slice(0, 12) + '…'}</td>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 10, color: '#2563EB', whiteSpace: 'nowrap' as const }}>{e.eventHash}</td>
                  <td style={tdS}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: '#ECFDF5', color: C.ok, border: '1px solid #A7F3D0' }}>✅ {e.chainStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sprint 4B: Append-only Model (standalone) ───
function AppendOnlyModelSection({ isMobile }) {
  const thS: React.CSSProperties = { padding: '9px 11px', textAlign: 'right' as const, fontWeight: 700, color: C.forest, border: `1px solid ${C.border}`, background: C.creamDark, fontSize: 11 };
  const tdS: React.CSSProperties = { padding: '7px 11px', border: `1px solid ${C.border}`, fontSize: 11 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Three principle cards */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.creamDark }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.forest }}>Append-only Audit Model — نموذج السجل غير القابل للتعديل</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>النموذج المقترح للإنتاج: لا يتم تعديل السجل القديم، بل تُضاف أحداث تصحيحية جديدة</div>
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { title: 'لا يحدث ❌',         bg: '#FEF2F2', border: '#FECACA', color: C.danger, text: 'تعديل حدث قديم مباشرة أو حذف قراءة من السجل.' },
            { title: 'يحدث بدلاً من ذلك ✅', bg: '#ECFDF5', border: '#A7F3D0', color: C.ok,    text: 'إضافة حدث تصحيحي جديد يشير إلى الحدث الأصلي مع السبب والوقت والمستخدم.' },
            { title: 'للتقارير 📄',          bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', text: 'كل تصدير يولد Report ID وtimestamp جديدين، ولا يستبدل التقرير السابق.' },
          ].map(({ title, bg, border, color, text }) => (
            <div key={title} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 12, color, lineHeight: 1.65 }}>{text}</div>
            </div>
          ))}
        </div>

        {/* Wrong / Correct examples */}
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { wrong: 'AUD-0002 was edited.',                                correct: 'AUD-0002 remains unchanged.\nAUD-0009 added: Correction for AUD-0002.' },
            { wrong: 'Sensor reading deleted.',                             correct: 'Reading flagged as outlier; original preserved with exclusion reason.' },
            { wrong: 'Report revised by overwriting previous file.',        correct: 'New report: new reportId + timestamp. Previous version retained.' },
          ].map(({ wrong, correct }, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.danger, marginBottom: 3 }}>❌ Wrong</div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.danger, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{wrong}</div>
              </div>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '9px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.ok, marginBottom: 3 }}>✅ Correct</div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.ok, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{correct}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Versioning table */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.creamDark }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.forest }}>Audit Versioning — إصدارات السجل</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>كيف يتعامل النظام مع التغييرات في كل نوع من الكيانات</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Object','العنصر','Versioning Rule','Demo Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {AUDIT_VERSIONING.map((r, i) => {
                const sc = r.demoStatus === 'Active' ? { bg: '#ECFDF5', color: C.ok } : r.demoStatus === 'Modeled' ? { bg: '#EFF6FF', color: '#2563EB' } : { bg: '#FFFBEB', color: C.warn };
                return (
                  <tr key={r.object} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                    <td style={{ ...tdS, fontWeight: 700, color: C.ink }}>{r.object}</td>
                    <td style={{ ...tdS, color: C.inkSoft }}>{r.ar}</td>
                    <td style={{ ...tdS, color: C.inkSoft, fontSize: 11 }}>{r.versioningRule}</td>
                    <td style={tdS}><span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{r.demoStatus}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', background: '#F8FDF9', borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>
          💡 "Modeled" = البنية موجودة كنمط للإنتاج · "Active" = يعمل فعلاً في هذا الديمو · "Planned" = مدرج في الخارطة التقنية
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Audit Trail ───
function AuditTrailSection({ isMobile, filteredAudit, zones, auditZone, setAuditZone, auditType, setAuditType, auditPeriod, setAuditPeriod, downloadAuditCSV, auditEventsData = ENHANCED_AUDIT_EVENTS, dataSource = 'mock' }: { isMobile: boolean; filteredAudit: AuditEntry[]; zones: any[]; auditZone: string; setAuditZone: (v: string) => void; auditType: string; setAuditType: (v: string) => void; auditPeriod: string; setAuditPeriod: (v: string) => void; downloadAuditCSV: () => void; auditEventsData?: AuditEventDisplay[]; dataSource?: string }) {
  const [showChain, setShowChain] = useState(false);
  const sel: React.CSSProperties = { padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 12, background: '#fff', cursor: 'pointer' };
  const thS: React.CSSProperties = { padding: '9px 11px', textAlign: 'right' as const, fontWeight: 700, color: C.forest, borderBottom: `2px solid ${C.border}`, background: C.creamDark, whiteSpace: 'nowrap' as const, fontSize: 11 };
  const tdS: React.CSSProperties = { padding: '7px 11px', borderBottom: `1px solid ${C.border}`, fontSize: 11, verticalAlign: 'middle' as const };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        {[
          { id: false, label: '📋 أحداث التشغيل'          },
          { id: true,  label: '🔗 سلسلة التدقيق + Append-only' },
        ].map(({ id, label }) => (
          <button key={String(id)} onClick={() => setShowChain(id)} style={{ padding: '8px 16px', background: showChain === id ? C.forest : '#fff', color: showChain === id ? '#fff' : C.inkSoft, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {showChain && (
        <>
          <AuditChainIntegrityPanel isMobile={isMobile} />
          <AppendOnlyModelSection isMobile={isMobile} />
        </>
      )}

      {!showChain && <>

      {/* Detailed Events Table */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, color: C.forest, fontSize: 14 }}>أحداث التشغيل التفصيلية</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {dataSource === 'supabase' ? '🟢 Supabase Demo DB' : '🔵 Local Mock Data'} — Audit-ready structure
            </div>
          </div>
          <button onClick={downloadAuditCSV} style={{ padding: '7px 14px', background: C.forest, color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13} /> تصدير CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
            <thead>
              <tr>
                {['Event ID', 'الوقت', 'المنطقة', 'المشغّل', 'الإجراء', 'قبل', 'بعد', 'السبب', 'Hash', 'الحالة'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditEventsData.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 10, color: C.inkSoft, whiteSpace: 'nowrap' }}>{e.id}</td>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' }}>{e.ts}</td>
                  <td style={{ ...tdS, fontWeight: 600, color: C.forest, whiteSpace: 'nowrap' }}>{e.zone}</td>
                  <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: e.actor === 'System' ? '#EFF6FF' : '#FFFBEB', color: e.actor === 'System' ? '#1D4ED8' : '#92400E' }}>
                      {e.actor === 'System' ? '🤖' : '✋'} {e.actor}
                    </span>
                  </td>
                  <td style={{ ...tdS, color: C.ink, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.action}</td>
                  <td style={{ ...tdS, color: C.danger, fontSize: 10, whiteSpace: 'nowrap' }}>{e.before}</td>
                  <td style={{ ...tdS, color: C.ok,     fontSize: 10, whiteSpace: 'nowrap' }}>{e.after}</td>
                  <td style={{ ...tdS, color: C.inkSoft, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.reason}</td>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>{e.hash}</td>
                  <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: '#F0FDF4', color: C.ok, border: '1px solid #BBF7D0' }}>🔒 {e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', background: '#F8FDF9', borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>
          💡 كل تعديل يدوي أو آلي يُسجل في سجل التدقيق. لا يتم حذف الأحداث، بل يُضاف حدث تصحيحي عند الحاجة. | Audit-ready structure · Locked in demo
        </div>
      </div>

      {/* Readings Filter + Table */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 800, color: C.forest, fontSize: 14, marginBottom: 12 }}>سجل قراءات الحساسات المفلتر</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.forest, marginBottom: 4 }}>المنطقة</div>
            <select value={auditZone} onChange={e => setAuditZone(e.target.value)} style={sel}>
              <option value="all">كل المناطق</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.forest, marginBottom: 4 }}>نوع الحدث</div>
            <select value={auditType} onChange={e => setAuditType(e.target.value)} style={sel}>
              <option value="all">كل الأنواع</option>
              <option value="قراءة">قراءة</option>
              <option value="تدخل تلقائي">تدخل تلقائي</option>
              <option value="تجاوز يدوي">تجاوز يدوي</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.forest, marginBottom: 4 }}>الفترة</div>
            <select value={auditPeriod} onChange={e => setAuditPeriod(e.target.value)} style={sel}>
              <option value="24h">آخر 24 ساعة</option>
              <option value="7d">آخر 7 أيام</option>
              <option value="30d">آخر 30 يوم</option>
            </select>
          </div>
          <div style={{ marginRight: 'auto' }}>
            <Badge color={C.lime} text={`${filteredAudit.length} سجل`} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 10 : 12 }}>
            <thead>
              <tr style={{ background: C.creamDark }}>
                {['الوقت (UTC)', 'المنطقة', 'النوع', 'القيمة', 'المشغّل', 'الختم'].map(h => (
                  <th key={h} style={{ padding: '9px 11px', textAlign: 'right', fontWeight: 700, color: C.forest, borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAudit.slice(0, 40).map((entry: AuditEntry, i: number) => {
                const tc = entry.type === 'تجاوز يدوي' ? '#F59E0B' : entry.type === 'تدخل تلقائي' ? '#0EA5E9' : C.muted;
                return (
                  <tr key={entry.id} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                    <td style={{ padding: '7px 11px', fontFamily: 'monospace', fontSize: 10, color: C.inkSoft, whiteSpace: 'nowrap' }}>{entry.timestamp.slice(0, 16).replace('T', ' ')}</td>
                    <td style={{ padding: '7px 11px', fontWeight: 600, color: C.forest, whiteSpace: 'nowrap' }}>{entry.zone}</td>
                    <td style={{ padding: '7px 11px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, background: tc + '20', color: tc, fontWeight: 700, fontSize: 10 }}>
                        {entry.isOverride ? '✋' : entry.type === 'تدخل تلقائي' ? '🤖' : '📊'} {entry.type}
                      </span>
                    </td>
                    <td style={{ padding: '7px 11px', color: C.inkSoft, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.value}</td>
                    <td style={{ padding: '7px 11px', fontWeight: 600, color: C.ink, whiteSpace: 'nowrap' }}>{entry.operator}</td>
                    <td style={{ padding: '7px 11px', fontFamily: 'monospace', fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>{entry.sha}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAudit.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 13 }}>لا توجد سجلات تطابق الفلتر المحدد</div>
          )}
        </div>
      </div>
      </>}
    </div>
  );
}

// ─── Section 4: Batch Traceability ───
function BatchTraceabilitySection({ isMobile, batchData = BATCH_DATA, dataSource = 'mock' }: { isMobile: boolean; batchData?: BatchDisplay[]; dataSource?: string }) {
  const [selectedBatch, setSelectedBatch] = React.useState(batchData[0]?.batchId ?? 'BATCH-TOM-2026-001');
  const thS: React.CSSProperties = { padding: '9px 12px', textAlign: 'right' as const, fontWeight: 700, color: C.forest, border: `1px solid ${C.border}`, background: C.creamDark, fontSize: 11 };
  const tdS: React.CSSProperties = { padding: '8px 12px', border: `1px solid ${C.border}`, fontSize: 12 };

  const activeBatches = batchData.filter(b => b.statusLabel.includes('نشطة') || b.statusLabel.includes('active')).length || batchData.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'دفعات نشطة',     value: String(activeBatches), color: C.ok      },
          { label: 'إجمالي الدفعات', value: String(batchData.length), color: '#2563EB' },
          { label: 'تنبيهات مفتوحة', value: '0',          color: C.ok      },
          { label: 'ربط فاتورة',     value: 'ديمو فقط',  color: C.muted   },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Batches Table */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 800, color: C.forest, fontSize: 14 }}>سجل الدفعات — Batch Traceability</div>
          <span style={{ fontSize: 10, color: dataSource === 'supabase' ? C.ok : '#2563EB', fontWeight: 700 }}>
            {dataSource === 'supabase' ? '🟢 Supabase' : '🔵 Mock'}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr>{['Batch ID', 'المحصول', 'المنطقة', 'تاريخ الزراعة', 'الحصاد المتوقع', 'سجلات المدخلات', 'ملخص الحساسات', 'ربط الفاتورة', 'الحالة'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {batchData.map((b, i) => (
                <tr key={b.batchId} style={{ background: i % 2 === 0 ? '#fff' : C.cream, cursor: 'pointer' }} onClick={() => setSelectedBatch(b.batchId)}>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontWeight: 700, color: selectedBatch === b.batchId ? C.forest : C.inkSoft }}>{b.batchId}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{b.crop}</td>
                  <td style={tdS}>{b.zone}</td>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11 }}>{b.planting}</td>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11 }}>{b.harvest}</td>
                  <td style={{ ...tdS, color: '#2563EB', fontWeight: 600 }}>{b.inputs}</td>
                  <td style={{ ...tdS, color: C.inkSoft, fontSize: 11 }}>{b.sensor}</td>
                  <td style={{ ...tdS, color: C.muted, fontSize: 11 }}>{b.invoice}</td>
                  <td style={tdS}><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: b.statusColor + '18', color: b.statusColor, border: `1px solid ${b.statusColor}40` }}>{b.statusLabel}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', background: '#FFFBEB', borderTop: `1px solid #FDE68A`, fontSize: 11, color: '#92400E' }}>
          ⚠️ ربط الدفعة بالفاتورة الإلكترونية يظهر هنا كتصوّر معماري فقط. التكامل الفعلي يتطلب إعدادات واعتمادات مستقلة مع ZATCA.
        </div>
      </div>

      {/* Batch Detail — Timeline for selected */}
      {selectedBatch === 'BATCH-TOM-2026-001' && (
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.forest, marginBottom: 12 }}>
            تفاصيل الدفعة: {selectedBatch}
          </div>
          <div style={{ background: '#fff', border: `2px solid ${C.lime}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 900, color: C.forest, fontSize: isMobile ? 16 : 20 }}>BATCH-TOM-2026-001</div>
                <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>طماطم · المحمية A — جدة · مساحة 200 م²</div>
              </div>
              <Badge color={C.lime} text="🌿 Saudi GAP Tracked" />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'المحصول', value: '🍅 طماطم' }, { label: 'المرحلة', value: '🌸 الإزهار' },
                { label: 'صفر مبيدات', value: '✅' }, { label: 'SFDA.FD 382', value: '✅ ممتثل جزئياً' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: C.creamDark, padding: '6px 12px', borderRadius: 8, fontSize: 11 }}>
                  <span style={{ color: C.muted }}>{label}: </span>
                  <span style={{ fontWeight: 700, color: C.forest }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: C.forest, fontSize: 14, marginBottom: 18 }}>رحلة الدفعة — Saudi GAP Timeline</div>
            <div style={{ position: 'relative', paddingRight: 28 }}>
              <div style={{ position: 'absolute', right: 11, top: 20, bottom: 20, width: 2, background: C.border }} />
              {GAP_TIMELINE_STEPS.map((step, i) => {
                const done = step.status === 'done', current = step.status === 'current';
                const dc   = done ? C.ok : current ? C.lime : C.border;
                return (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < GAP_TIMELINE_STEPS.length - 1 ? 22 : 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? C.ok + '25' : current ? C.lime + '25' : C.creamDark, border: `2px solid ${dc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, zIndex: 1, marginTop: 2 }}>
                      {step.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: done ? C.forest : current ? C.lime : C.muted, fontSize: 14 }}>{step.title}</span>
                          <span style={{ fontSize: 11, color: current ? C.lime : C.muted, fontWeight: current ? 700 : 400 }}>{step.subtitle}</span>
                        </div>
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{step.date}</span>
                      </div>
                      <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 4, lineHeight: 1.6 }}>{step.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontWeight: 700, color: C.forest, fontSize: 14, marginBottom: 12 }}>QR تتبع الدفعة (تصوّري)</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <QRCode value="https://trace.igarden.sa/BATCH-TOM-2026-001?demo=1" size={96} label="QR صفحة تتبع الدفعة (نمطي)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.forest, marginBottom: 6, fontSize: 13, opacity: 0.7 }}>
                  trace.igarden.sa/BATCH-TOM-2026-001 <span style={{ fontSize: 10, color: C.warn, fontWeight: 600 }}>(نمطي — غير مفعَّل)</span>
                </div>
                <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.7, marginBottom: 8 }}>تصوّر معماري لسجل الدفعة الكامل (تاريخ الزراعة · قراءات الحساسات · ملف الجاهزية · مرجع الفاتورة). صفحة التتبع لم تُنشر بعد.</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge color={C.ok}    text="✅ Saudi GAP Tracked (Demo)" />
                  <Badge color="#0EA5E9" text="📋 SFDA.FD 382/2018"  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedBatch === 'BATCH-LET-2026-002' && (
        <div style={{ background: '#fff', border: `2px solid #2563EB`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 900, color: '#2563EB', fontSize: 16, marginBottom: 8 }}>BATCH-LET-2026-002</div>
          <div style={{ fontSize: 13, color: C.inkSoft }}>خس · المحمية B — الرياض · قراءات مستقرة · حصاد متوقع 2026-05-30</div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>Timeline مفصّل قيد الإعداد لهذه الدفعة.</div>
        </div>
      )}

      {/* Regulatory Refs */}
      <div style={{ padding: 14, background: C.creamDark, borderRadius: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: C.forest, marginBottom: 10 }}>المراجع التنظيمية</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {REGULATORY_REFS.map(ref => (
            <div key={ref.code} style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: C.forest }}>{ref.code}</div>
              <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>{ref.authority}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GAPTraceability({ isMobile }) {
  return (
    <div>
      {/* Batch Header */}
      <div style={{ background: '#fff', border: `2px solid ${C.lime}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 900, color: C.forest, fontSize: isMobile ? 16 : 20 }}>BATCH-2026-04-A</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>طماطم · محمية A — جدة · مساحة 200 م²</div>
          </div>
          <Badge color={C.lime} text="🌿 Saudi GAP Tracked" />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'المحصول',    value: '🍅 طماطم'  },
            { label: 'المرحلة',    value: '🌸 الإزهار' },
            { label: 'صفر مبيدات', value: '✅'         },
            { label: 'SFDA.FD 382', value: '✅ ممتثل' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: C.creamDark, padding: '6px 12px', borderRadius: 8, fontSize: 11 }}>
              <span style={{ color: C.muted }}>{label}: </span>
              <span style={{ fontWeight: 700, color: C.forest }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 20px', color: C.forest, fontSize: 15, fontWeight: 700 }}>رحلة الدفعة — Saudi GAP Timeline</h3>
        <div style={{ position: 'relative', paddingRight: 28 }}>
          <div style={{ position: 'absolute', right: 11, top: 20, bottom: 20, width: 2, background: C.border }} />
          {GAP_TIMELINE_STEPS.map((step, i) => {
            const done    = step.status === 'done';
            const current = step.status === 'current';
            const dc      = done ? C.ok : current ? C.lime : C.border;
            return (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < GAP_TIMELINE_STEPS.length - 1 ? 22 : 0 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? C.ok + '25' : current ? C.lime + '25' : C.creamDark, border: `2px solid ${dc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, zIndex: 1, marginTop: 2 }}>
                  {step.emoji}
                </div>
                <div style={{ flex: 1, paddingBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: done ? C.forest : current ? C.lime : C.muted, fontSize: 14 }}>{step.title}</span>
                      <span style={{ fontSize: 11, color: current ? C.lime : C.muted, fontWeight: current ? 700 : 400 }}>{step.subtitle}</span>
                    </div>
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{step.date}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 4, lineHeight: 1.6 }}>{step.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR + Trace Link */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 14px', color: C.forest, fontSize: 14, fontWeight: 700 }}>QR تتبع الدفعة (تصوّري)</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <QRCode value="https://trace.igarden.sa/BATCH-2026-04-A?demo=1" size={104} label="QR صفحة تتبع الدفعة (نمطي)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: C.forest, marginBottom: 6, fontSize: 14, opacity: 0.7 }}>
              trace.igarden.sa/BATCH-2026-04-A <span style={{ fontSize: 10, color: C.warn, fontWeight: 600 }}>(نمطي — غير مفعَّل)</span>
            </div>
            <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.7 }}>
              تصوّر معماري لصفحة تتبع الدفعة الكاملة:<br />
              تاريخ الزراعة · قراءات الحساسات · ملف جاهزية GAP · مرجع الفاتورة
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge color={C.ok}    text="✅ Saudi GAP Tracked (Demo)" />
              <Badge color="#0EA5E9" text="📋 SFDA.FD 382/2018"  />
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory References Footer */}
      <div style={{ padding: 14, background: C.creamDark, borderRadius: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: C.forest, marginBottom: 10 }}>المراجع التنظيمية الرسمية</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {REGULATORY_REFS.map(ref => (
            <div key={ref.code} style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: C.forest }}>{ref.code}</div>
              <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>{ref.authority}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
