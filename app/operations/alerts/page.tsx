import { AppShell } from "@/components/AppShell";
import { AlertCard } from "@/components/AlertCard";
import { AlertActions } from "@/components/AlertActions";
import { AIRecommendationCard } from "@/components/AIRecommendation";
import { decideAIAction } from "@/lib/actions";
import { listAlerts, getAIRecommendationForAlert, listSites, getSensor, computeSiteHealth } from "@/lib/queries";
import { StatusBar } from "@/components/StatusBar";
import { EmptyDb } from "@/components/EmptyDb";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const sites = await listSites();
  if (sites.length === 0) return <AppShell><EmptyDb context="alerts" /></AppShell>;
  const primary = sites.find((s) => !s.is_demo_site) ?? sites[0];
  const [health, open, ack, resolved] = await Promise.all([
    computeSiteHealth(primary.id),
    listAlerts({ status: "open", limit: 20 }),
    listAlerts({ status: "acknowledged", limit: 20 }),
    listAlerts({ status: "resolved", limit: 20 }),
  ]);
  if (!health) return <AppShell><EmptyDb context="alerts" /></AppShell>;

  const groups = [
    { title: "مفتوحة", items: open, accent: "text-[color:var(--color-status-high)]" },
    { title: "مُطّلع عليها", items: ack, accent: "text-[color:var(--color-status-med)]" },
    { title: "مُعالَجة", items: resolved, accent: "text-[color:var(--color-iso-ink-soft)]" },
  ];

  // Pre-fetch sensors + AI in parallel
  const allItems = [...open, ...ack, ...resolved];
  const sensorIds = Array.from(new Set(allItems.map((a) => a.sensor_id).filter(Boolean) as string[]));
  const [sensors, ais] = await Promise.all([
    Promise.all(sensorIds.map((id) => getSensor(id))),
    Promise.all(allItems.map((a) => getAIRecommendationForAlert(a.id))),
  ]);
  const sensorById = Object.fromEntries(sensors.filter(Boolean).map((s) => [s!.id, s!]));
  const aiByAlert = Object.fromEntries(allItems.map((a, i) => [a.id, ais[i]]));

  return (
    <AppShell>
      <StatusBar health={health} mode="demo" />
      <main className="p-6 space-y-6">
        <header>
          <h1 className="text-xl font-bold text-[color:var(--color-deep-green)]">التنبيهات والإجراءات</h1>
          <p className="text-xs text-[color:var(--color-iso-ink-soft)] mt-1">
            ISA-18.2: كل تنبيه يتطلّب استجابة. توزيع الشدّة المستهدف 10/20/70 (P1/P2/P3).
          </p>
        </header>

        {groups.map((g) => (
          <section key={g.title} className="space-y-3" id={g.title}>
            <h2 className={`text-sm font-bold ${g.accent}`}>
              {g.title} <span className="tabular ltr-bdi text-[color:var(--color-iso-ink-muted)] font-normal">({g.items.length})</span>
            </h2>
            {g.items.length === 0 && <div className="text-xs text-[color:var(--color-iso-ink-muted)] iso-panel p-3">لا عناصر</div>}
            {g.items.map((a) => {
              const sensor = a.sensor_id ? sensorById[a.sensor_id] : undefined;
              const ai = aiByAlert[a.id];
              return (
                <div key={a.id} id={a.id}>
                  <AlertCard alert={a} sensor={sensor}>
                    <div className="flex items-center justify-end gap-2">
                      <AlertActions alertId={a.id} status={a.status} />
                    </div>
                    {ai && (
                      <AIRecommendationCard
                        rec={ai}
                        overrideRatePct={18}
                        onDecide={async (id, d) => { "use server"; await decideAIAction(id, d); }}
                      />
                    )}
                  </AlertCard>
                </div>
              );
            })}
          </section>
        ))}
      </main>
    </AppShell>
  );
}
