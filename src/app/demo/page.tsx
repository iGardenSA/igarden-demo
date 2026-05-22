import { AppShell } from "@/components/AppShell";
import { StatusBar } from "@/components/StatusBar";
import { GoldenFlowTrigger } from "@/components/GoldenFlowTrigger";
import { TransparencyPanel } from "@/components/TransparencyPanel";
import { AnalogIndicator } from "@/components/AnalogIndicator";
import { CoolingWaterPanel } from "@/components/CoolingWaterPanel";
import { WaterEfficiency } from "@/components/WaterEfficiency";
import { computeSiteHealth, listSensors, latestReadingsForSite, latestCooling, listAlerts, getSite } from "@/lib/queries";
import { CheckCircle2, Sparkles } from "lucide-react";

export default async function DemoPage() {
  const site = getSite("site-demo")!;
  const health = computeSiteHealth("site-demo")!;
  const sensors = listSensors("site-demo");
  const readings = latestReadingsForSite("site-demo");
  const cooling = latestCooling("site-demo", 30);
  const alerts = listAlerts({ siteId: "site-demo", status: "open" });

  const readingByType = Object.fromEntries(readings.map((r) => {
    const s = sensors.find((sx) => sx.id === r.sensor_id);
    return [s?.sensor_type ?? "", { r, s }];
  }));

  return (
    <AppShell>
      <StatusBar health={health} mode="investor" />
      <main className="p-6 space-y-6">
        <header className="iso-panel p-5 bg-[color:var(--color-deep-green)] text-white">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-wider opacity-80 flex items-center gap-2">
                <Sparkles className="size-3.5" /> وضع المستثمر · TAQADAM
              </div>
              <h1 className="text-2xl font-bold mt-1">iGarden Smart OS</h1>
              <p className="text-sm opacity-90 mt-1 max-w-2xl">
                طبقة التشغيل والبيانات تحت المزارع المائية الذكية السعودية. سلسلة قابلة للتشغيل: مشكلة → دليل حيّ → تنبيه → فعل → سجل → امتثال → توطين.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TransparencyPanel />
              <GoldenFlowTrigger label="تشغيل السيناريو الذهبي (EC)" />
            </div>
          </div>
        </header>

        <NarrativeStep n={1} title="المشكلة"
          body="المزارع المُحكمة السعودية تواجه ارتفاع EC مفاجئاً بسبب الحرارة وفقد الماء. الأنظمة الحالية إمّا أوتوماتيكية صامتة (تخاف الإفراط) أو يدوية ثقيلة (تخاف الفقد)." />

        <NarrativeStep n={2} title="دليل حيّ"
          body="مؤشرات تشغيلية لـ Demo Site الآن — لون فقط عند الخروج عن النطاق (ISA-101):">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 iso-panel p-5">
            {(["ph", "ec", "water_temp", "tank_level"] as const).map((t) => {
              const entry = readingByType[t];
              if (!entry?.s) return null;
              return (
                <AnalogIndicator
                  key={t}
                  value={entry.r?.value ?? null}
                  min={entry.s.min_safe_value * 0.7}
                  max={entry.s.max_safe_value * 1.3}
                  safeMin={entry.s.min_safe_value}
                  safeMax={entry.s.max_safe_value}
                  label={entry.s.name}
                  unit={entry.s.unit}
                />
              );
            })}
          </div>
        </NarrativeStep>

        <NarrativeStep n={3} title="تنبيه + فعل تحت إشراف"
          body="عند ضغط زر التشغيل أعلاه: يُولَّد تنبيه P2 + بطاقة AI = توصية + دليل + ثقة + اعتماد بشري إلزامي. اعتماد المشغّل يفتح modal تأكيد ثنائي مع سبب وقفل أمان. الفعل يُسجَّل ولا يُنفَّذ آلياً.">
          <div className="grid sm:grid-cols-3 gap-2">
            <Pill label="تنبيهات مفتوحة الآن" value={alerts.length.toString()} />
            <Pill label="بطاقة AI ثقة" value="عالية · بانتظار اعتماد" />
            <Pill label="نمط التحكّم" value="مُحاكى · يُسجَّل · لا تشغيل تلقائي" />
          </div>
        </NarrativeStep>

        <NarrativeStep n={4} title="قابلية التدقيق"
          body="كل أمر يدخل جدول control_events مع المُشغّل والمؤكّد والسبب. سجل قابل للتصفية والتصدير CSV لكل المواقع. صفحة /logs." />

        <NarrativeStep n={5} title="التوطين السعودي (الخندق)">
          <div className="grid lg:grid-cols-2 gap-3">
            <CoolingWaterPanel logs={cooling} />
            <WaterEfficiency logs={cooling} />
          </div>
        </NarrativeStep>

        <NarrativeStep n={6} title="نموذج الإيراد المتكرّر"
          body="باقة Smart OS = اشتراك شهري + خدمات تشغيل (SLA على الاستجابة) + تقارير امتثال. ليست بيع جهاز لمرّة واحدة." />

        <NarrativeStep n={7} title="معالم TAQADAM"
          body="الخارج من البرنامج: ربط FastAPI + MQTT حيّ على عسفان (G2)، نشر demo.igarden.sa (G4)، استكمال تكامل MEWA/Naama (مبدئياً مهيّأ بنيوياً، لا يدّعي اعتماداً)." />

        <footer className="iso-panel-flat p-4 text-xs text-[color:var(--color-iso-ink-muted)] flex items-start gap-2">
          <CheckCircle2 className="size-4 text-[color:var(--color-status-ok)] mt-0.5" />
          <span>
            ديمو تحقّق ميداني — يعرض كيف يربط iGarden المراقبة والتنبيهات والتحكم تحت إشراف وسجلات التدقيق والتقارير المُهيّأة للامتثال للزراعة المُحكَمة السعودية.
          </span>
        </footer>
      </main>
    </AppShell>
  );
}

function NarrativeStep({ n, title, body, children }: { n: number; title: string; body?: string; children?: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="iso-chip border bg-[color:var(--color-deep-green)] text-white border-[color:var(--color-deep-green)] tabular ltr-bdi">{n}</span>
        <h2 className="text-sm font-bold text-[color:var(--color-deep-green)]">{title}</h2>
      </div>
      {body && <p className="text-sm text-[color:var(--color-iso-ink-soft)] leading-relaxed max-w-3xl">{body}</p>}
      {children}
    </section>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="iso-panel p-3">
      <div className="text-[11px] text-[color:var(--color-iso-ink-muted)]">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
