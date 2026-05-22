import { NavSidebar } from "./NavSidebar";
import { listSites } from "@/lib/queries";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sites = listSites().map((s) => ({ id: s.id, name: s.name, status: s.status }));
  return (
    <div className="min-h-screen flex bg-[color:var(--color-iso-bg)]" dir="rtl">
      <NavSidebar sites={sites} />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
