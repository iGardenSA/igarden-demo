'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ComposedChart } from 'recharts';
import { Sprout, Droplets, Thermometer, Wind, Zap, Activity, Settings, BarChart3, Layers, Download, AlertTriangle, CheckCircle2, TrendingUp, MapPin, Calendar, Beaker, Sun, Power, RefreshCw, Save, ChevronLeft, Cpu, FlaskConical, Leaf, CloudRain, ShieldCheck, FileText, Clock, X, Eye, Printer } from 'lucide-react';
import { REGULATORY_REFS, DISCLAIMER_TEXT } from './compliance/standards';
import { calcComplianceScore, mockSHA, generateAuditEntries } from './compliance/compliance-engine';
import type { AuditEntry } from './compliance/compliance-engine';

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
// المكوّن الرئيسي
// ═══════════════════════════════════════════════════════════════════
export default function DemoPage() {
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

  // تحميل من sessionStorage (مع دعم Claude Artifacts كـ fallback)
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
          // Production environment (browser sessionStorage — cleared on tab close)
          const z = sessionStorage.getItem('igarden_zones');
          if (z) setZones(JSON.parse(z));
          const o = sessionStorage.getItem('igarden_overrides');
          if (o) setOverrides(JSON.parse(o));
        }
      } catch (e) { /* key not found or invalid JSON */ }
      setStorageReady(true);
    })();
  }, []);

  // حفظ تلقائي
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
          sessionStorage.setItem('igarden_zones', JSON.stringify(zones));
          sessionStorage.setItem('igarden_overrides', JSON.stringify(overrides));
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
    { id: 'live',       label: 'لوحة المعطيات الحية', icon: Activity },
    { id: 'engine',     label: 'محرّك التوصيات',       icon: Sprout },
    { id: 'history',    label: 'السجل التاريخي',        icon: BarChart3 },
    { id: 'zones',      label: 'إعدادات المناطق',       icon: Layers },
    { id: 'compliance', label: '📋 الامتثال',           icon: ShieldCheck },
  ];

  return (
    <div dir="rtl" lang="ar" style={{ fontFamily: "'Tajawal', 'Segoe UI', system-ui, sans-serif", background: C.cream, minHeight: '100vh', color: C.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet" />

      {/* ═══ Header ═══ */}
      <header style={{ background: `linear-gradient(180deg, ${C.forest} 0%, ${C.forestDark} 100%)`, borderBottom: `3px solid ${C.lime}`, padding: isMobile ? '12px 14px' : '14px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: isMobile ? 8 : 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, minWidth: 0 }}>
            <IGardenLogo variant="green" size={isMobile ? 38 : 48} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>iGarden <span style={{ color: C.limeLight, fontSize: isMobile ? 13 : 16, fontWeight: 500 }}>Smart OS</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.limeLight, fontSize: isMobile ? 11 : 12, background: 'rgba(255,255,255,0.08)', padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 20, border: `1px solid ${C.lime}40` }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isRunning ? C.lime : C.muted, boxShadow: isRunning ? `0 0 10px ${C.lime}` : 'none', animation: isRunning ? 'pulse 1.5s infinite' : 'none', flexShrink: 0 }}></span>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{isRunning ? (isMobile ? 'البث المباشر' : 'البث المباشر — البيانات تُحدَّث كل ثانيتين') : 'متوقف'}</span>
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

          {/* القسم 1: العلامة + الـ Tagline + CTA */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 18 : 24, alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: isMobile ? 18 : 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <IGardenLogo variant="green" size={isMobile ? 48 : 60} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.01em' }}>iGarden</div>
                <div style={{ fontSize: isMobile ? 13 : 15, color: C.lime, marginTop: 6, fontWeight: 700, letterSpacing: '0.02em' }}>ازرع بذكاء</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 8, width: isMobile ? '100%' : 'auto' }}>
              <a href="https://igarden.sa" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: C.lime, color: C.forestDark, borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'all .15s' }}>
                زيارة igarden.sa ↗
              </a>
              <div style={{ fontSize: 11, color: C.limeLight, opacity: 0.65 }}>للاستشارات والشراكات</div>
            </div>
          </div>

          {/* القسم 3: Signature Line */}
          <div style={{ textAlign: 'center', padding: isMobile ? '12px 0 14px' : '14px 0 18px', marginBottom: isMobile ? 14 : 18, borderTop: `1px solid rgba(124, 179, 66, 0.18)`, borderBottom: `1px solid rgba(124, 179, 66, 0.18)` }}>
            <div style={{ fontSize: isMobile ? 14 : 16, color: '#fff', fontWeight: 700, letterSpacing: '0.01em', lineHeight: 1.5 }}>
              حين تزرع بذكاء، <span style={{ color: C.lime }}>تحصد بثقة</span>
            </div>
          </div>

          {/* القسم 4: Demo notice + copyright */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 8 : 14, justifyContent: 'space-between', alignItems: 'center', fontSize: isMobile ? 10 : 11, color: C.limeLight, opacity: 0.6 }}>
            <div>
              <strong style={{ color: '#fff', fontWeight: 600 }}>Smart OS — Demo Seed v1.0</strong>
              {!isMobile && (<><span style={{ margin: '0 8px' }}>·</span>نموذج وظيفي يعكس المعمارية الحقيقية — القراءات محاكاة</>)}
            </div>
            <div>© 2026 شركة انتيليجنت غاردن</div>
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
  const zone = zones.find(z => z.id === selectedZoneId) || zones[0];
  if (!zone) return <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>لا توجد مناطق — أضف منطقة من تبويب "إعدادات المناطق"</div>;

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
          <Badge color={zone.enabled ? C.ok : C.muted} text={zone.enabled ? '⏵ نشطة' : '⏸ موقوفة'} />
          <Badge color={zone.auto ? C.lime : C.warn} text={zone.auto ? '🤖 تلقائي' : '✋ يدوي'} />
          {!isMobile && <Badge color={C.forestLight} text={`${REGIONS[zone.region].icon} ${REGIONS[zone.region].name}`} />}
        </div>
      </div>

      {/* أربع الوحدات */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? 12 : 16, marginBottom: 20 }}>
        <ControlCard
          title="Climate Switch"
          subtitle="التحكم بالمناخ"
          icon={Thermometer}
          enabled={zone.devices.climate}
          color={C.forest}
          metrics={[
            { label: 'حرارة الهواء', value: reading.temp ?? '—', unit: '°C', target: targets.temp, status: status(reading.temp, targets.temp), icon: Thermometer },
            { label: 'الرطوبة', value: reading.humidity ?? '—', unit: '%', target: targets.humidity, status: status(reading.humidity, targets.humidity), icon: CloudRain },
            { label: 'CO₂', value: reading.co2 ?? '—', unit: 'ppm', target: [600, 1200], status: status(reading.co2, [600, 1200]), icon: Wind },
          ]}
          actuators={[
            { name: 'مروحة', on: reading.fanOn },
            { name: 'مكيّف', on: reading.coolerOn },
            { name: 'مدفأة', on: reading.heaterOn },
            { name: 'ضباب', on: reading.misterOn },
          ]}
        />
        <ControlCard
          title="Fertigation Switch"
          subtitle="التسميد الآلي"
          icon={Beaker}
          enabled={zone.devices.fertigation}
          color={C.lime}
          metrics={[
            { label: 'EC الموصلية', value: reading.ec ?? '—', unit: 'mS/cm', target: targets.ec, status: status(reading.ec, targets.ec), icon: Activity },
            { label: 'pH الحموضة', value: reading.ph ?? '—', unit: '', target: targets.ph, status: status(reading.ph, targets.ph), icon: FlaskConical },
            { label: 'NPK المستهدف', value: baseRec ? `${baseRec.targets.npk.n}-${baseRec.targets.npk.p}-${baseRec.targets.npk.k}` : '—', unit: 'ppm', target: null, status: 'ok', icon: Leaf },
          ]}
          actuators={[
            { name: 'مضخة A', on: reading.pumpOn },
            { name: 'مضخة B', on: !reading.pumpOn && Math.random() < 0.5 },
            { name: 'pH دوزر', on: status(reading.ph, targets.ph) !== 'ok' },
          ]}
        />
        <ControlCard
          title="Irrigation Switch"
          subtitle="نظام الري"
          icon={Droplets}
          enabled={zone.devices.irrigation}
          color="#0EA5E9"
          metrics={[
            { label: 'مستوى الخزان', value: reading.waterLevel ?? '—', unit: '%', target: [40, 100], status: (reading.waterLevel ?? 0) < 30 ? 'low' : 'ok', icon: Droplets },
            { label: 'دورات اليوم', value: baseRec?.irrigation.freq ?? '—', unit: 'مرة', target: null, status: 'ok', icon: RefreshCw },
            { label: 'مدة الدورة', value: baseRec?.irrigation.duration ?? '—', unit: 'ثانية', target: null, status: 'ok', icon: Calendar },
          ]}
          actuators={[
            { name: 'صمام 1', on: reading.pumpOn },
            { name: 'صمام 2', on: !reading.pumpOn && Math.random() < 0.4 },
            { name: 'تصريف', on: false },
          ]}
        />
        <ControlCard
          title="Energy Switch"
          subtitle="إدارة الطاقة"
          icon={Zap}
          enabled={zone.devices.energy}
          color="#F59E0B"
          metrics={[
            { label: 'إنتاج الشمسي', value: reading.solarPower ?? '—', unit: 'واط', target: null, status: 'ok', icon: Sun },
            { label: 'سحب الشبكة', value: reading.gridDraw ?? '—', unit: 'واط', target: null, status: 'ok', icon: Power },
            { label: 'صافي', value: reading.solarPower && reading.gridDraw ? Math.round(reading.solarPower - reading.gridDraw) : '—', unit: 'واط', target: null, status: (reading.solarPower ?? 0) > (reading.gridDraw ?? 0) ? 'ok' : 'low', icon: TrendingUp },
          ]}
          actuators={[
            { name: 'الشمسي', on: (reading.solarPower ?? 0) > 100 },
            { name: 'البطارية', on: (reading.solarPower ?? 0) < (reading.gridDraw ?? 0) },
            { name: 'الشبكة', on: true },
          ]}
        />
      </div>

      {/* Quick Override */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, color: C.forest, fontSize: 16, fontWeight: 700 }}>تجاوز يدوي للمستهدفات</h3>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>القيم المُحدَّثة هنا تتجاوز توصيات Crop Engine لهذه المنطقة فقط</div>
          </div>
          <button onClick={() => setOverrides({ ...overrides, [zone.id]: {} })} style={{ background: C.creamDark, border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.forest, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={12} /> إعادة للقيم الأصلية
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <RangeSlider label="درجة الحرارة (°C)" min={10} max={40} step={0.5} value={targets.temp} onChange={v => setOverrides({ ...overrides, [zone.id]: { ...ovr, temp: v } })} color={C.forest} />
          <RangeSlider label="الرطوبة (%)" min={30} max={95} step={1} value={targets.humidity} onChange={v => setOverrides({ ...overrides, [zone.id]: { ...ovr, humidity: v } })} color="#0EA5E9" />
          <RangeSlider label="EC (mS/cm)" min={0.4} max={4.0} step={0.1} value={targets.ec} onChange={v => setOverrides({ ...overrides, [zone.id]: { ...ovr, ec: v } })} color={C.lime} />
          <RangeSlider label="pH" min={4.5} max={7.5} step={0.1} value={targets.ph} onChange={v => setOverrides({ ...overrides, [zone.id]: { ...ovr, ph: v } })} color="#A855F7" />
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
  const [crop, setCrop] = useState('tomato');
  const [stage, setStage] = useState('vegetative');
  const [region, setRegion] = useState('jeddah');
  const [applyZone, setApplyZone] = useState('zone_a');

  const cropObj = CROP_DB[crop];
  const stages = Object.keys(cropObj.stages);
  // ضبط المرحلة عند تغيير المحصول
  useEffect(() => { if (!cropObj.stages[stage]) setStage(stages[0]); }, [crop]);

  const rec = recommend(crop, stage, region);

  const applyToZone = () => {
    setZones(zones.map(z => z.id === applyZone ? { ...z, crop, stage, region } : z));
    setOverrides({ ...overrides, [applyZone]: {} });
    alert(`✓ تم تطبيق برنامج ${cropObj.name} (${cropObj.stages[stage].name}) على ${zones.find(z => z.id === applyZone)?.name}`);
  };

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.forest} 0%, ${C.forestLight} 100%)`, color: '#fff', borderRadius: 12, padding: isMobile ? 18 : 24, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, fontSize: isMobile ? 120 : 180, opacity: 0.06 }}>🌱</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(124, 179, 66, 0.18)', borderRadius: 14, fontSize: isMobile ? 10 : 11, fontWeight: 700, color: C.lime, marginBottom: 10, border: `1px solid ${C.lime}40` }}>
          ✨ ازرع بذكاء
        </div>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 900 }}>محرّك التوصيات الذكي</h2>
        <p style={{ margin: '6px 0 0', color: C.limeLight, fontSize: isMobile ? 12 : 14 }}>اختر المحصول والمرحلة والمنطقة — يقوم النظام تلقائياً بحساب EC و pH و NPK والمناخ المناسب</p>
        <div style={{ marginTop: 8, fontSize: isMobile ? 11 : 12, color: C.limeLight, opacity: 0.85 }}>📚 مكتبة 12 محصول × 4 مناطق × 3-4 مراحل = ~150 وصفة فريدة</div>
      </div>

      {/* Selectors */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 14 : 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', color: C.forest, fontSize: 16, fontWeight: 700 }}>1. اختيار المعايير</h3>

        <Label text="نوع المحصول" />
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
              <span style={{ fontSize: 10, opacity: 0.7 }}>{c.cycleDays} يوم</span>
            </button>
          ))}
        </div>

        <Label text="المرحلة الزمنية" />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 18 }}>
          {stages.map(s => (
            <button key={s} onClick={() => setStage(s)} style={{
              padding: '10px 12px', background: stage === s ? C.lime : '#fff', color: stage === s ? '#fff' : C.ink,
              border: `2px solid ${stage === s ? C.lime : C.border}`, borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
            }}>
              <div style={{ fontWeight: 700 }}>{cropObj.stages[s].name}</div>
              <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>اليوم {cropObj.stages[s].days}</div>
            </button>
          ))}
        </div>

        <Label text="المنطقة الجغرافية" />
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
            <CheckCircle2 size={18} color={C.lime} /> 2. التوصية المقترحة
          </h3>

          <div style={{ background: C.creamDark, padding: 14, borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: isMobile ? 32 : 40 }}>{rec.cropIcon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16, color: C.forest }}>{rec.crop} — {rec.stage}</div>
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>اليوم {rec.days} · في {rec.region}</div>
            </div>
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 11 }}>
              <div style={{ color: C.muted }}>جودة المياه</div>
              <div style={{ color: C.forest, fontWeight: 700 }}>{rec.waterQuality} ppm TDS</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? 8 : 12, marginBottom: 14 }}>
            <RecCard title="🌡️ الحرارة" value={`${rec.targets.temp[0]} – ${rec.targets.temp[1]}`} unit="°C" color={C.forest} />
            <RecCard title="💧 الرطوبة" value={`${rec.targets.humidity[0]} – ${rec.targets.humidity[1]}`} unit="%" color="#0EA5E9" />
            <RecCard title="⚡ EC" value={`${rec.targets.ec[0]} – ${rec.targets.ec[1]}`} unit="mS/cm" color={C.lime} />
            <RecCard title="🧪 pH" value={`${rec.targets.ph[0]} – ${rec.targets.ph[1]}`} unit="" color="#A855F7" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? 8 : 12, marginBottom: 14 }}>
            <RecCard title="🌿 N" value={rec.targets.npk.n} unit="ppm" color="#16A34A" />
            <RecCard title="🌱 P" value={rec.targets.npk.p} unit="ppm" color="#CA8A04" />
            <RecCard title="🍅 K" value={rec.targets.npk.k} unit="ppm" color="#DC2626" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
            <RecCard title="🚿 دورات اليوم" value={rec.irrigation.freq} unit="مرة" color={C.forestLight} />
            <RecCard title="⏱ مدة الدورة" value={rec.irrigation.duration} unit="ث" color={C.forestLight} />
          </div>

          <div style={{ background: `${C.lime}15`, border: `1px dashed ${C.lime}`, borderRadius: 8, padding: 12, fontSize: 13, color: C.forest, lineHeight: 1.7 }}>
            <strong>📍 ملاحظة المنطقة:</strong> {rec.regionNote}
          </div>
        </div>
      )}

      {/* Apply to Zone */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 14 : 20 }}>
        <h3 style={{ margin: '0 0 12px', color: C.forest, fontSize: 16, fontWeight: 700 }}>3. تطبيق على منطقة</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={applyZone} onChange={e => setApplyZone(e.target.value)} style={{ flex: '1 1 200px', minWidth: 0, padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 14, background: '#fff' }}>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <button onClick={applyToZone} style={{ padding: '10px 22px', background: C.lime, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Save size={16} /> تطبيق البرنامج
          </button>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>سيتمّ تحديث المحصول والمرحلة والمنطقة للوحدة المختارة وإعادة تعيين أيّ تجاوزات يدوية سابقة.</div>
      </div>
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
  const [metric, setMetric] = useState('tempIn');
  const [compareRegions, setCompareRegions] = useState(['jeddah', 'abha']);
  const [range, setRange] = useState(90);

  const metrics = {
    tempIn:  { label: 'حرارة المحمية', unit: '°C', color: C.forest, optimal: [20, 26] },
    humIn:   { label: 'الرطوبة',         unit: '%',  color: '#0EA5E9', optimal: [55, 70] },
    ec:      { label: 'EC الموصلية',      unit: 'mS/cm', color: C.lime, optimal: [2.0, 2.5] },
    ph:      { label: 'pH الحموضة',       unit: '',  color: '#A855F7', optimal: [5.8, 6.4] },
    co2:     { label: 'CO₂',              unit: 'ppm', color: '#64748B', optimal: [600, 1200] },
    water:   { label: 'استهلاك المياه',   unit: 'لتر/يوم', color: '#0891B2', optimal: null },
    energy:  { label: 'استهلاك الطاقة',   unit: 'kWh/يوم', color: '#F59E0B', optimal: null },
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
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>السجل التاريخي · 90 يوماً</h2>
        <p style={{ margin: '6px 0 0', color: C.limeLight, fontSize: 14 }}>تحليل تفاعلي للقراءات مع مقارنة بين المناطق وتحليل ذكي للأداء</p>
      </div>

      {/* Controls */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <Label text="المتغيّر" />
            <select value={metric} onChange={e => setMetric(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 14, background: '#fff' }}>
              {Object.entries(metrics).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <Label text="النطاق الزمني" />
            <div style={{ display: 'flex', gap: 6 }}>
              {[7, 30, 90].map(d => (
                <button key={d} onClick={() => setRange(d)} style={{ flex: 1, padding: '8px', background: range === d ? C.forest : '#fff', color: range === d ? '#fff' : C.ink, border: `1px solid ${range === d ? C.forest : C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
                  {d === 7 ? 'أسبوع' : d === 30 ? 'شهر' : '٣ أشهر'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label text="مناطق المقارنة" />
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
              <Download size={14} /> تصدير CSV
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 12 : 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, color: C.forest, fontSize: 15, fontWeight: 700 }}>{m.label} · {range} يوم</h3>
          {m.optimal && <Badge color={C.lime} text={`النطاق المثالي: ${m.optimal[0]} – ${m.optimal[1]} ${m.unit}`} />}
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
                {a.inOptimalPct != null && <Badge color={a.inOptimalPct >= 75 ? C.ok : a.inOptimalPct >= 50 ? C.warn : C.danger} text={`${a.inOptimalPct}% مثالي`} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <Stat label="المتوسط" value={a.avg} unit={m.unit} />
                <Stat label="الانحراف" value={`±${a.std}`} unit={m.unit} />
                <Stat label="القمة" value={a.max} unit={m.unit} color={C.danger} />
                <Stat label="القاع" value={a.min} unit={m.unit} color="#0EA5E9" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart Insights */}
      <div style={{ background: `linear-gradient(135deg, ${C.lime}10 0%, #fff 100%)`, border: `1px dashed ${C.lime}`, borderRadius: 12, padding: 18 }}>
        <h3 style={{ margin: '0 0 12px', color: C.forest, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={16} color={C.lime} /> التحليل الذكي
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
  const [editingId, setEditingId] = useState(null);
  const editing = zones.find(z => z.id === editingId);

  const updateZone = (id, patch) => setZones(zones.map(z => z.id === id ? { ...z, ...patch } : z));
  const updateDevice = (id, dev, val) => {
    const z = zones.find(z => z.id === id);
    updateZone(id, { devices: { ...z.devices, [dev]: val } });
  };
  const addZone = () => {
    const newId = `zone_${Date.now()}`;
    setZones([...zones, {
      id: newId, name: `منطقة جديدة ${zones.length + 1}`,
      region: 'jeddah', crop: 'lettuce', stage: 'vegetative',
      plantedDate: new Date().toISOString().slice(0, 10),
      area: 50, enabled: true, auto: true,
      devices: { climate: true, fertigation: true, irrigation: true, energy: true },
    }]);
    setEditingId(newId);
  };
  const deleteZone = (id) => {
    if (zones.length <= 1) { alert('لا يمكن حذف آخر منطقة'); return; }
    if (confirm('هل تريد حذف هذه المنطقة؟')) {
      setZones(zones.filter(z => z.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: C.forest, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ChevronLeft size={16} /> العودة لقائمة المناطق
        </button>

        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: '0 0 18px', color: C.forest, fontSize: 17, fontWeight: 700 }}>تحرير: {editing.name}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
            <Field label="اسم المنطقة">
              <input type="text" value={editing.name} onChange={e => updateZone(editing.id, { name: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="المساحة (م²)">
              <input type="number" value={editing.area} onChange={e => updateZone(editing.id, { area: +e.target.value })} style={inputStyle} />
            </Field>
            <Field label="تاريخ الزراعة">
              <input type="date" value={editing.plantedDate} onChange={e => updateZone(editing.id, { plantedDate: e.target.value })} style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
            <Field label="المنطقة الجغرافية">
              <select value={editing.region} onChange={e => updateZone(editing.id, { region: e.target.value })} style={inputStyle}>
                {Object.entries(REGIONS).map(([k, r]) => <option key={k} value={k}>{r.icon} {r.name}</option>)}
              </select>
            </Field>
            <Field label="نوع المحصول">
              <select value={editing.crop} onChange={e => {
                const newCrop = e.target.value;
                const firstStage = Object.keys(CROP_DB[newCrop].stages)[0];
                updateZone(editing.id, { crop: newCrop, stage: firstStage });
              }} style={inputStyle}>
                {Object.entries(CROP_DB).map(([k, c]) => <option key={k} value={k}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
            <Field label="مرحلة النمو">
              <select value={editing.stage} onChange={e => updateZone(editing.id, { stage: e.target.value })} style={inputStyle}>
                {Object.entries(CROP_DB[editing.crop as keyof typeof CROP_DB].stages).map(([k, s]) => { const st = s as { name: string; days: string }; return <option key={k} value={k}>{st.name} (اليوم {st.days})</option>; })}
              </select>
            </Field>
          </div>

          <div style={{ marginBottom: 18 }}>
            <Label text="حالة المنطقة" />
            <div style={{ display: 'flex', gap: 10 }}>
              <Toggle checked={editing.enabled} onChange={v => updateZone(editing.id, { enabled: v })} label={editing.enabled ? '🟢 المنطقة نشطة' : '⚪ المنطقة موقوفة'} />
              <Toggle checked={editing.auto} onChange={v => updateZone(editing.id, { auto: v })} label={editing.auto ? '🤖 تشغيل تلقائي' : '✋ تحكم يدوي'} />
            </div>
          </div>

          <div>
            <Label text="الوحدات المُفعَّلة" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              <DeviceToggle name="Climate Switch" desc="مناخ" icon={Thermometer} on={editing.devices.climate} onChange={v => updateDevice(editing.id, 'climate', v)} color={C.forest} />
              <DeviceToggle name="Fertigation Switch" desc="تسميد" icon={Beaker} on={editing.devices.fertigation} onChange={v => updateDevice(editing.id, 'fertigation', v)} color={C.lime} />
              <DeviceToggle name="Irrigation Switch" desc="ري" icon={Droplets} on={editing.devices.irrigation} onChange={v => updateDevice(editing.id, 'irrigation', v)} color="#0EA5E9" />
              <DeviceToggle name="Energy Switch" desc="طاقة" icon={Zap} on={editing.devices.energy} onChange={v => updateDevice(editing.id, 'energy', v)} color="#F59E0B" />
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
          <h2 style={{ margin: 0, color: C.forest, fontSize: 22, fontWeight: 900 }}>إدارة المناطق (Zones)</h2>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>{zones.length} منطقة · يمكن إضافة عدد غير محدود</div>
        </div>
        <button onClick={addZone} style={{ padding: '10px 18px', background: C.lime, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={16} /> + إضافة منطقة
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
                  {v ? '●' : '○'} {k === 'climate' ? 'مناخ' : k === 'fertigation' ? 'تسميد' : k === 'irrigation' ? 'ري' : 'طاقة'}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingId(z.id)} style={{ flex: 1, padding: '8px', background: C.forest, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>تحرير</button>
              <button onClick={() => deleteZone(z.id)} style={{ padding: '8px 12px', background: '#fff', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>حذف</button>
            </div>
          </div>
        ))}
      </div>
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
    title: 'التقرير الشهري',
    authority: 'MEWA',
    badge: 'وزارة البيئة والمياه والزراعة',
    icon: '📊',
    desc: 'ملخّص قراءات + استهلاك مياه + انحرافات آخر 30 يوم',
    ref: 'MEWA-AGR-LAW-IR',
  },
  {
    id: 'saudi-gap',
    title: 'شهادة Saudi GAP',
    authority: 'MEWA / NAAMA',
    badge: 'Good Agricultural Practices',
    icon: '🌿',
    desc: 'تتبع رحلة الدفعة + تقييم المخاطر + سجل العمليات الزراعية',
    ref: 'Saudi GAP',
  },
  {
    id: 'water-efficiency',
    title: 'سجل ترشيد المياه',
    authority: 'MEWA',
    badge: 'Water Use Efficiency',
    icon: '💧',
    desc: 'الاستهلاك الفعلي مقابل المعيار التقليدي + نسبة التوفير',
    ref: 'MEWA-AGR-LAW-IR',
  },
  {
    id: 'zatca-fatoora',
    title: 'ربط Fatoora',
    authority: 'ZATCA',
    badge: 'E-Invoicing Phase 2',
    icon: '🧾',
    desc: 'ربط BATCH-ID بفاتورة إلكترونية مع QR التحقق',
    ref: 'ZATCA Fatoora Phase 2',
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

function ComplianceTab({ isMobile, historicalData, zones }) {
  const [section, setSection] = useState<'scores' | 'reports' | 'audit' | 'traceability'>('scores');
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [auditZone, setAuditZone]     = useState('all');
  const [auditType, setAuditType]     = useState('all');
  const [auditPeriod, setAuditPeriod] = useState('30d');

  const sections = [
    { id: 'scores',       label: '🏆 درجة الامتثال',  icon: ShieldCheck },
    { id: 'reports',      label: '📄 مكتبة التقارير',  icon: FileText    },
    { id: 'audit',        label: '🕐 سجل المراجعة',    icon: Clock       },
    { id: 'traceability', label: '🔗 تتبع الدفعة',     icon: Leaf        },
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
    const headers = ['الوقت', 'المنطقة', 'النوع', 'القيمة', 'المشغّل', 'الختم'];
    const rows = filteredAudit.map(e =>
      [e.timestamp, e.zone, e.type, e.value, e.operator, e.sha].join(',')
    );
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `igarden-audit-trail-${auditPeriod}.csv`;
    link.click();
  };

  return (
    <div>
      {/* Banner */}
      <div style={{ background: `linear-gradient(135deg, ${C.forest} 0%, ${C.forestLight} 100%)`, color: '#fff', borderRadius: 12, padding: isMobile ? 18 : 24, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -20, fontSize: 160, opacity: 0.05, pointerEvents: 'none' }}>🛡️</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(124,179,66,0.18)', borderRadius: 14, fontSize: 11, fontWeight: 700, color: C.lime, marginBottom: 10, border: `1px solid ${C.lime}40` }}>
          🇸🇦 MEWA · SFDA · Saudi GAP · ZATCA
        </div>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 900 }}>طبقة الامتثال السعودي</h2>
        <p style={{ margin: '6px 0 0', color: C.limeLight, fontSize: isMobile ? 12 : 14 }}>
          مراقبة الامتثال لمعايير MEWA وSFDA.FD 382/2018 وSaudi GAP وZATCA Fatoora
        </p>
      </div>

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
      {section === 'reports'      && <ReportsLibrary     isMobile={isMobile} historicalData={historicalData} zones={zones} setReportModal={setReportModal} />}
      {section === 'audit'        && (
        <AuditTrailSection
          isMobile={isMobile}
          filteredAudit={filteredAudit}
          zones={zones}
          auditZone={auditZone}   setAuditZone={setAuditZone}
          auditType={auditType}   setAuditType={setAuditType}
          auditPeriod={auditPeriod} setAuditPeriod={setAuditPeriod}
          downloadAuditCSV={downloadAuditCSV}
        />
      )}
      {section === 'traceability' && <GAPTraceability    isMobile={isMobile} />}

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
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
        {Object.entries(REGIONS).map(([rk, region]) => {
          const hist = (historicalData[rk] || []) as Array<{ ph: number; ec: number; tempIn: number }>;
          const { score, deviations } = calcComplianceScore(hist);
          const hasData   = hist.length > 0;
          const sc        = score;
          const statusCol = sc >= 95 ? C.ok : sc >= 85 ? '#F59E0B' : '#DC2626';
          const statusTxt = sc >= 95 ? '🟢 ممتثل' : sc >= 85 ? '🟡 يحتاج مراجعة' : '🔴 خارج النطاق';

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
                  <div style={{ fontSize: 9, color: C.muted }}>آخر 30 يوم</div>
                </div>
              </div>

              <Badge color={statusCol} text={statusTxt} />

              {deviations > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> {deviations} انحراف مسجّل
                </div>
              )}

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { label: 'سجل قراءات يومية',         ok: hist.length >= 25 },
                  { label: 'ضمن نطاق pH (5.5–7.5)',     ok: sc >= 90 },
                  { label: 'مرجع MEWA-AGR-LAW-IR',      ok: true },
                  { label: 'تتبع Saudi GAP',             ok: sc >= 85 },
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
        <h3 style={{ margin: '0 0 14px', color: C.forest, fontSize: 15, fontWeight: 700 }}>القيم المرجعية المعتمدة (Saudi GAP / MEWA)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
          <RecCard title="🧪 pH المياه"    value="5.5 – 7.5" unit=""      color="#A855F7" />
          <RecCard title="⚡ EC المياه"    value="≤ 2.5"     unit="mS/cm" color={C.lime}  />
          <RecCard title="💧 TDS"          value="≤ 1500"    unit="ppm"   color="#0EA5E9" />
          <RecCard title="☢️ الكلور الحر" value="≤ 0.5"     unit="mg/L"  color="#F59E0B" />
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>
          المرجع: Saudi GAP / MEWA Agriculture Law Implementing Regulations · SFDA.FD 382/2018
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: مكتبة التقارير ───
function ReportsLibrary({ isMobile, historicalData, zones, setReportModal }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
      {REPORT_DEFS.map(report => (
        <div key={report.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: C.creamDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              {report.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: C.forest, fontSize: 15 }}>{report.title}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{report.authority}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.6 }}>{report.desc}</div>
          <Badge color={C.lime} text={report.badge} />
          <div style={{ fontSize: 10, color: C.muted }}>مرجع: {report.ref}</div>
          <button onClick={() => setReportModal(report.id)} style={{
            marginTop: 'auto', padding: '8px 14px', background: C.forest, color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Eye size={14} /> معاينة التقرير
          </button>
        </div>
      ))}
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
  const last15   = hist.slice(-15);
  const avgEC    = last15.length ? (last15.reduce((s, r) => s + r.ec, 0) / last15.length).toFixed(2) : '—';
  const avgPH    = last15.length ? (last15.reduce((s, r) => s + r.ph, 0) / last15.length).toFixed(2) : '—';
  const totalWater = last15.reduce((s, r) => s + (r.water || 0), 0).toFixed(0);
  const sha      = mockSHA(reportId + today);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,61,46,0.75)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 14px', overflowY: 'auto' }}
    >
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } }`}</style>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 720, marginBottom: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background: C.forest, color: '#fff', padding: '18px 22px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <IGardenLogo variant="white" size={38} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>iGarden Smart OS</div>
              <div style={{ fontSize: 10, color: C.limeLight, marginTop: 2 }}>شركة انتيليجنت غاردن · CR: 4030579637 · MISA: #423450193</div>
            </div>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => window.print()} style={{ padding: '7px 12px', background: C.lime, color: C.forestDark, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Printer size={13} /> تصدير PDF
            </button>
            <button onClick={onClose} style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${C.creamDark}` }}>
            <div style={{ fontSize: 11, color: C.muted }}>{report.authority}</div>
            <h2 style={{ margin: '4px 0 4px', color: C.forest, fontSize: 20, fontWeight: 900 }}>{report.title}</h2>
            <div style={{ fontSize: 12, color: C.inkSoft }}>{report.badge}</div>
            <div style={{ marginTop: 6, fontSize: 11, color: C.muted }}>تاريخ الإصدار: {today} · مرجع: {report.ref}</div>
          </div>

          {/* ── MEWA Monthly / Water Efficiency ── */}
          {(reportId === 'mewa-monthly' || reportId === 'water-efficiency') && (
            <div>
              <h3 style={{ color: C.forest, fontSize: 14, margin: '0 0 12px', fontWeight: 700 }}>
                {reportId === 'mewa-monthly' ? 'ملخّص قراءات آخر 15 يوم' : 'سجل استهلاك المياه — آخر 15 يوم'}
              </h3>
              <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 420 }}>
                  <thead>
                    <tr style={{ background: C.creamDark }}>
                      {(reportId === 'mewa-monthly'
                        ? ['التاريخ', 'pH', 'EC (mS/cm)', 'حرارة °C', 'رطوبة %', 'الحالة']
                        : ['التاريخ', 'استهلاك (لتر)', 'TDS (ppm)', 'النطاق', 'الحالة']
                      ).map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: C.forest, border: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {last15.map((row, i) => {
                      const phOk = row.ph >= 5.5 && row.ph <= 7.5;
                      const ecOk = row.ec <= 2.5;
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : C.cream }}>
                          {reportId === 'mewa-monthly' ? (
                            <>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}` }}>{row.dateFull}</td>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}`, color: phOk ? C.ok : '#DC2626' }}>{row.ph}</td>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}`, color: ecOk ? C.ok : '#DC2626' }}>{row.ec}</td>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}` }}>{row.tempIn}</td>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}` }}>{row.humIn}</td>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}`, color: phOk && ecOk ? C.ok : '#DC2626', fontWeight: 600 }}>
                                {phOk && ecOk ? '✓' : '✗'}
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}` }}>{row.dateFull}</td>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}` }}>{row.water}</td>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}` }}>{REGIONS[firstKey as keyof typeof REGIONS].waterTDS}</td>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}` }}>0 – 1500 ppm</td>
                              <td style={{ padding: '6px 10px', border: `1px solid ${C.border}`, color: C.ok, fontWeight: 600 }}>✓ ضمن الحد</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
                <div style={{ background: C.creamDark, padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: C.muted }}>متوسط pH</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.forest }}>{avgPH}</div>
                </div>
                <div style={{ background: C.creamDark, padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: C.muted }}>متوسط EC</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.forest }}>{avgEC} mS/cm</div>
                </div>
                {reportId === 'water-efficiency' && (
                  <div style={{ background: C.creamDark, padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted }}>إجمالي 15 يوم</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.forest }}>{totalWater} لتر</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Saudi GAP ── */}
          {reportId === 'saudi-gap' && (
            <div>
              <h3 style={{ color: C.forest, fontSize: 14, margin: '0 0 12px', fontWeight: 700 }}>شهادة ممارسات الزراعة الجيدة — Saudi GAP</h3>
              <div style={{ background: `${C.lime}10`, border: `1px solid ${C.lime}40`, borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: C.forest, marginBottom: 8 }}>رقم الدفعة: BATCH-2026-04-A</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  {[
                    ['المحصول',          'طماطم (Solanum lycopersicum)'],
                    ['المنشأ',           'محمية A — جدة'],
                    ['تاريخ الزراعة',    '2026-02-10'],
                    ['الحصاد المتوقع',   '2026-06-10'],
                    ['المساحة',          '200 م²'],
                    ['المبيدات',         'صفر — لا مبيدات'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: C.muted }}>{k}</div>
                      <div style={{ fontWeight: 600, color: C.ink }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12, lineHeight: 1.7 }}>
                <strong>تقييم المخاطر:</strong> منخفض — نظام زراعة مائية مغلق · لا تربة · مياه مراقَبة بمستشعرات EC/pH في الوقت الفعلي
              </div>
              {['✅ مصدر البذور موثّق', '✅ جودة المياه ضمن المعايير', '✅ سجل قراءات يومي كامل', '✅ صفر متبقيات مبيدات (SFDA.FD 382/2018)', '✅ نظام تتبع رقمي متكامل'].map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: C.inkSoft, marginBottom: 4 }}>{item}</div>
              ))}
            </div>
          )}

          {/* ── ZATCA Fatoora ── */}
          {reportId === 'zatca-fatoora' && (
            <div>
              <h3 style={{ color: C.forest, fontSize: 14, margin: '0 0 12px', fontWeight: 700 }}>ربط الدفعة بفاتورة إلكترونية — ZATCA Fatoora Phase 2</h3>
              <div style={{ background: C.creamDark, borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  {[
                    ['رقم الفاتورة',    'INV-2026-04-A-001'],
                    ['رقم الدفعة',      'BATCH-2026-04-A'],
                    ['تاريخ الفاتورة',  today],
                    ['اسم المورد',      'شركة انتيليجنت غاردن'],
                    ['الرقم الضريبي',  '310012345600003'],
                    ['اسم المشتري',    'مجمع الرياض الغذائي'],
                    ['الكمية',          '150 كيلو طماطم'],
                    ['المبلغ (شامل)',   '862.50 ر.س'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: C.muted }}>{k}</div>
                      <div style={{ fontWeight: 600, color: C.ink, fontSize: 12 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 80, height: 80, background: '#000', borderRadius: 6, padding: 6, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, flexShrink: 0 }}>
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} style={{ background: [0,1,2,5,6,12,13,14,17,18,24,25,26,29,30,7,11,23,31,35,8,9,10,32,33,34].includes(i) ? '#fff' : '#000', borderRadius: 1 }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.7 }}>
                  QR Code — ZATCA Fatoora للتحقق<br />
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted }}>INV-2026-04-A-001 · BATCH-2026-04-A</span>
                </div>
              </div>
              <div style={{ background: `${C.lime}10`, padding: 12, borderRadius: 8, fontSize: 12, color: C.inkSoft, lineHeight: 1.7 }}>
                💡 يُربط BATCH-ID تلقائياً بفاتورة Fatoora عند الحصاد من خلال iGarden Smart OS. دور ZATCA محصور في الفاتورة الإلكترونية — ليس منصة تتبع غذائي.
              </div>
            </div>
          )}

          {/* SHA + توقيع */}
          <div style={{ marginTop: 18, padding: '10px 14px', background: C.creamDark, borderRadius: 8, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, fontSize: 11, color: C.muted }}>
            <div><span style={{ fontWeight: 600 }}>SHA-256 (mock): </span><span style={{ fontFamily: 'monospace' }}>{sha}</span></div>
            <div><span style={{ fontWeight: 600 }}>QR تحقق: </span><span style={{ fontFamily: 'monospace', color: C.forest }}>verify.igarden.sa/{reportId}</span></div>
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

// ─── Section 3: Audit Trail ───
function AuditTrailSection({ isMobile, filteredAudit, zones, auditZone, setAuditZone, auditType, setAuditType, auditPeriod, setAuditPeriod, downloadAuditCSV }) {
  const sel: React.CSSProperties = { padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 12, background: '#fff', cursor: 'pointer' };
  return (
    <div>
      {/* Filters */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
          <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
            <button onClick={downloadAuditCSV} style={{ padding: '8px 14px', background: C.forest, color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={13} /> تصدير CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: C.forest, fontSize: 14 }}>سجل المراجعة والأحداث</div>
          <Badge color={C.lime} text={`${filteredAudit.length} سجل`} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 10 : 12 }}>
            <thead>
              <tr style={{ background: C.creamDark }}>
                {['الوقت (UTC)', 'المنطقة', 'النوع', 'القيمة', 'المشغّل', 'الختم'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: C.forest, borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAudit.slice(0, 50).map((entry: AuditEntry, i: number) => {
                const tc = entry.type === 'تجاوز يدوي' ? '#F59E0B' : entry.type === 'تدخل تلقائي' ? '#0EA5E9' : C.muted;
                return (
                  <tr key={entry.id} style={{ background: i % 2 === 0 ? '#fff' : C.cream, borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: 10, color: C.inkSoft, whiteSpace: 'nowrap' }}>{entry.timestamp.slice(0, 16).replace('T', ' ')}</td>
                    <td style={{ padding: '7px 12px', fontWeight: 600, color: C.forest, whiteSpace: 'nowrap' }}>{entry.zone}</td>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 10, background: tc + '20', color: tc, fontWeight: 700, fontSize: 10 }}>
                        {entry.isOverride ? '✋' : entry.type === 'تدخل تلقائي' ? '🤖' : '📊'} {entry.type}
                      </span>
                    </td>
                    <td style={{ padding: '7px 12px', color: C.inkSoft, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.value}</td>
                    <td style={{ padding: '7px 12px', fontWeight: 600, color: C.ink, whiteSpace: 'nowrap' }}>{entry.operator}</td>
                    <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>{entry.sha}</td>
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
    </div>
  );
}

// ─── Section 4: GAP Traceability ───
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
        <h3 style={{ margin: '0 0 14px', color: C.forest, fontSize: 14, fontWeight: 700 }}>QR تتبع الدفعة</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 96, height: 96, background: '#000', borderRadius: 8, padding: 8, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1.5, flexShrink: 0 }}>
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} style={{ background: [0,1,2,3,4,5,7,11,12,13,14,17,19,20,22,23,24,25,26,27,28,29,31,35].includes(i) ? '#fff' : '#000', borderRadius: 1 }} />
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: C.forest, marginBottom: 6, fontSize: 14 }}>trace.igarden.sa/BATCH-2026-04-A</div>
            <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.7 }}>
              امسح الرمز للوصول لسجل الدفعة الكامل:<br />
              تاريخ الزراعة · قراءات الحساسات · شهادة GAP · فاتورة ZATCA
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge color={C.ok}    text="✅ متحقق — Saudi GAP" />
              <Badge color="#0EA5E9" text="📋 SFDA.FD 382/2018"  />
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory References Footer */}
      <div style={{ padding: 14, background: C.creamDark, borderRadius: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: C.forest, marginBottom: 10 }}>المراجع التنظيمية المعتمدة</div>
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
