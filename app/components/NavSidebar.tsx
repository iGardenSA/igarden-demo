import Link from "next/link";
import { Activity, AlertTriangle, BookOpen, Brain, FileBarChart, Home, Sparkles, ArrowRight } from "lucide-react";

const NAV = [
  { href: "/operations",         label: "نظرة عامة",        icon: Home },
  { href: "/operations/alerts",  label: "التنبيهات",        icon: AlertTriangle },
  { href: "/operations/logs",    label: "سجل العمليات",     icon: BookOpen },
  { href: "/operations/reports", label: "التقارير والامتثال", icon: FileBarChart },
  { href: "/operations/ai",      label: "مساعد الذكاء",      icon: Brain },
  { href: "/operations/demo",    label: "وضع المستثمر",      icon: Sparkles },
];

export function NavSidebar({ sites }: { sites: { id: string; name: string; status: string }[] }) {
  return (
    <aside className="iso-panel-flat bg-white border-l border-[color:var(--color-iso-border)] w-60 shrink-0 h-screen sticky top-0 hidden md:flex flex-col" dir="rtl">
      <div className="p-4 border-b border-[color:var(--color-iso-border)] flex items-center gap-2">
        <Activity className="size-7 text-[color:var(--color-lime)]" aria-hidden />
        <div>
          <div className="text-sm font-bold text-[color:var(--color-deep-green)]">iGarden Smart OS</div>
          <div className="text-[10px] text-[color:var(--color-iso-ink-muted)] tracking-wide">/operations · ديمو</div>
        </div>
      </div>

      <nav className="p-2 space-y-0.5">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm hover:bg-[color:var(--color-iso-panel-alt)] text-[color:var(--color-iso-ink)]"
          >
            <n.icon className="size-4 text-[color:var(--color-iso-ink-soft)]" aria-hidden />
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pt-3 pb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-iso-ink-muted)]">المواقع</div>
      <div className="px-2 space-y-0.5 overflow-y-auto">
        {sites.map((s) => (
          <Link
            key={s.id}
            href={`/operations/site/${s.id}`}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs hover:bg-[color:var(--color-iso-panel-alt)]"
          >
            <span className={`size-1.5 rounded-full ${s.status === "online" ? "bg-[color:var(--color-status-ok)]" : "bg-[color:var(--color-status-med)]"}`} aria-hidden />
            <span className="truncate">{s.name}</span>
          </Link>
        ))}
      </div>

      {/* Back to RC-2 compliance landing */}
      <Link
        href="/"
        className="mt-auto p-3 border-t border-[color:var(--color-iso-border)] text-xs text-[color:var(--color-iso-ink-soft)] hover:bg-[color:var(--color-iso-panel-alt)] flex items-center gap-2"
      >
        <ArrowRight className="size-3.5" aria-hidden />
        العودة لـ Compliance Demo
      </Link>

      <div className="px-3 py-2 border-t border-[color:var(--color-iso-border)] text-[10px] text-[color:var(--color-iso-ink-muted)] leading-relaxed">
        نسخة ديمو · كل البيانات محاكاة · تتطلب اعتماد بشري لكل أمر تحكّم.
      </div>
    </aside>
  );
}
