import { AppShell } from "@/components/AppShell";
import { StatusBar } from "@/components/StatusBar";
import { AuditLog } from "@/components/AuditLog";
import { computeSiteHealth, listSites, listCommands, listControlEvents, listMaintenance } from "@/lib/queries";
import { EmptyDb } from "@/components/EmptyDb";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const sites = await listSites();
  if (sites.length === 0) return <AppShell><EmptyDb context="logs" /></AppShell>;
  const primary = sites.find((s) => !s.is_demo_site) ?? sites[0];
  const [health, commands, events, maintenance] = await Promise.all([
    computeSiteHealth(primary.id),
    listCommands(undefined, 200),
    listControlEvents({ limit: 300 }),
    listMaintenance(30),
  ]);
  if (!health) return <AppShell><EmptyDb context="logs" /></AppShell>;

  const commandsMap = Object.fromEntries(commands.map((c) => [c.id, c]));
  const siteOptions = sites.map((s) => ({ id: s.id, name: s.name }));

  return (
    <AppShell>
      <StatusBar health={health} mode="demo" />
      <main className="p-6 space-y-5">
        <header>
          <h1 className="text-xl font-bold text-[color:var(--color-deep-green)]">سجل العمليات والتدقيق</h1>
          <p className="text-xs text-[color:var(--color-iso-ink-soft)] mt-1">
            كل حدث تحكّم + كل عملية صيانة. التصفية وتصدير CSV متاحان.
          </p>
        </header>

        <AuditLog events={events} commands={commandsMap} siteOptions={siteOptions} />

        <section className="iso-panel">
          <header className="px-4 py-3 border-b border-[color:var(--color-iso-border)]">
            <h2 className="text-sm font-bold">سجل الصيانة</h2>
          </header>
          <div className="overflow-x-auto">
            <table className="iso-table">
              <thead>
                <tr>
                  <th>الوقت</th>
                  <th>الموقع</th>
                  <th>الإجراء</th>
                  <th>الجهاز</th>
                  <th>المنفّذ</th>
                  <th>الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-[color:var(--color-iso-ink-muted)] py-6">لا أحداث</td></tr>
                )}
                {maintenance.map((m) => (
                  <tr key={m.id}>
                    <td className="ltr-bdi tabular text-xs">{m.performed_at}</td>
                    <td>{m.site_name}</td>
                    <td>{actionAr(m.action_type)}</td>
                    <td className="ltr-bdi text-xs">{m.device_id ?? "—"}</td>
                    <td className="ltr-bdi text-xs">{m.performed_by}</td>
                    <td className="text-xs max-w-md">{m.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function actionAr(t: string) {
  return ({ inspection: "فحص", calibration: "معايرة", replacement: "استبدال", cleaning: "تنظيف", repair: "إصلاح", firmware_update: "تحديث برمجة" } as Record<string, string>)[t] ?? t;
}
