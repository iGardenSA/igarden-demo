import { AppShell } from "@/components/AppShell";
import { StatusBar } from "@/components/StatusBar";
import { AIRecommendationCard } from "@/components/AIRecommendation";
import { listAIRecommendations, listSites, computeSiteHealth, getAlert } from "@/lib/queries";
import { decideAIAction } from "@/lib/actions";
import { Brain } from "lucide-react";
import { DISCLAIMERS } from "@/lib/disclaimers";
import { EmptyDb } from "@/components/EmptyDb";

export const dynamic = "force-dynamic";

export default async function AIPage() {
  const sites = await listSites();
  if (sites.length === 0) return <AppShell><EmptyDb context="ai" /></AppShell>;
  const primary = sites.find((s) => !s.is_demo_site) ?? sites[0];
  const [health, pending, approved, modified, rejected] = await Promise.all([
    computeSiteHealth(primary.id),
    listAIRecommendations(undefined, "pending"),
    listAIRecommendations(undefined, "approved"),
    listAIRecommendations(undefined, "modified"),
    listAIRecommendations(undefined, "rejected"),
  ]);
  if (!health) return <AppShell><EmptyDb context="ai" /></AppShell>;
  const decided = [...approved, ...modified, ...rejected].sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Resolve linked alerts for pending recommendations
  const pendingAlertIds = pending.map((p) => p.related_alert_id).filter((x): x is string => Boolean(x));
  const pendingAlerts = await Promise.all(pendingAlertIds.map((id) => getAlert(id)));
  const alertById = Object.fromEntries(pendingAlerts.filter(Boolean).map((a) => [a!.id, a!]));

  return (
    <AppShell>
      <StatusBar health={health} mode="demo" />
      <main className="p-6 space-y-5">
        <header>
          <h1 className="text-xl font-bold text-[color:var(--color-deep-green)] flex items-center gap-2">
            <Brain className="size-5" /> مساعد الذكاء الاصطناعي
          </h1>
          <p className="text-xs text-[color:var(--color-iso-ink-soft)] mt-1 max-w-2xl">
            توصيات مع دليل وثقة. {DISCLAIMERS.aiHumanApproval}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-bold">قيد الاعتماد ({pending.length})</h2>
          {pending.length === 0 && <div className="iso-panel p-3 text-xs text-[color:var(--color-iso-ink-muted)]">لا توصيات بانتظار اعتماد.</div>}
          {pending.map((r) => {
            const alert = r.related_alert_id ? alertById[r.related_alert_id] : null;
            return (
              <div key={r.id} className="space-y-1">
                {alert && (
                  <div className="text-xs text-[color:var(--color-iso-ink-muted)] iso-chip border bg-white border-[color:var(--color-iso-border)] inline-flex">
                    مرتبط بتنبيه: <span className="font-semibold">{alert.title}</span>
                  </div>
                )}
                <AIRecommendationCard
                  rec={r}
                  overrideRatePct={18}
                  onDecide={async (id, d) => { "use server"; await decideAIAction(id, d); }}
                />
              </div>
            );
          })}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold">قرارات سابقة ({decided.length})</h2>
          {decided.slice(0, 10).map((r) => (
            <AIRecommendationCard
              key={r.id}
              rec={r}
              overrideRatePct={18}
              onDecide={async (id, d) => { "use server"; await decideAIAction(id, d); }}
            />
          ))}
        </section>
      </main>
    </AppShell>
  );
}
