import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatusBar } from "@/components/StatusBar";
import { ControlPanel } from "@/components/ControlPanel";
import { SafetyPanel } from "@/components/SafetyPanel";
import { AuditLog } from "@/components/AuditLog";
import { computeSiteHealth, getSite, listDevices, listCommands, listControlEvents, listSites } from "@/lib/queries";
import { getCurrentRole } from "@/lib/role";

interface Params { params: Promise<{ id: string }> }

export default async function ControlPage({ params }: Params) {
  const { id } = await params;
  const site = getSite(id);
  if (!site) notFound();
  const health = computeSiteHealth(id)!;
  const role = await getCurrentRole();
  const devices = listDevices(id);
  const commands = listCommands(id, 50);
  const events = listControlEvents({ siteId: id, limit: 80 });

  const recentCommandsByDevice: Record<string, typeof commands[0] | null> = {};
  devices.forEach((d) => { recentCommandsByDevice[d.id] = commands.find((c) => c.device_id === d.id) ?? null; });
  const commandsMap: Record<string, typeof commands[0]> = Object.fromEntries(commands.map((c) => [c.id, c]));
  const siteOptions = listSites().map((s) => ({ id: s.id, name: s.name }));

  return (
    <AppShell>
      <StatusBar health={health} mode={site.is_demo_site ? "demo" : "live"} />
      <main className="p-6 space-y-5">
        <header>
          <h1 className="text-xl font-bold text-[color:var(--color-deep-green)]">لوحة التحكم — {site.name}</h1>
          <p className="text-xs text-[color:var(--color-iso-ink-soft)] max-w-2xl mt-1">
            كل أمر يمر بـ تأكيد ثنائي + سبب إلزامي + قفل أمان مُفعَّل + تسجيل في سجل التدقيق. لا تنفيذ تلقائي ولا تجاوز.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-bold">الأجهزة وأوامرها</h2>
          <ControlPanel devices={devices} recentCommandsByDevice={recentCommandsByDevice} />
        </section>

        <SafetyPanel role={role} />

        <AuditLog events={events} commands={commandsMap} siteOptions={siteOptions} />
      </main>
    </AppShell>
  );
}
