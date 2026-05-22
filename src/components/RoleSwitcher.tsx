"use client";

import { useState } from "react";
import { ROLE_LABELS_AR, type Role } from "@/lib/types";
import { User, Briefcase, LineChart } from "lucide-react";

const ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  operator: User, manager: Briefcase, executive: LineChart,
};

export function RoleSwitcher({ current, onChange }: { current: Role; onChange: (r: Role) => void }) {
  const roles: Role[] = ["operator", "manager", "executive"];
  return (
    <div className="iso-chip border-0 bg-[color:var(--color-iso-fill)] gap-0 p-0.5" dir="rtl">
      {roles.map((r) => {
        const Icon = ICON[r];
        const active = r === current;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
              active ? "bg-white text-[color:var(--color-deep-green)] font-semibold shadow-sm" : "text-[color:var(--color-iso-ink-soft)] hover:text-[color:var(--color-iso-ink)]"
            }`}
          >
            <Icon className="size-3.5" />
            {ROLE_LABELS_AR[r]}
          </button>
        );
      })}
    </div>
  );
}

export function RoleSwitcherForm({ current }: { current: Role }) {
  const [r, setR] = useState<Role>(current);
  return (
    <RoleSwitcher current={r} onChange={async (next) => {
      setR(next);
      document.cookie = `ig_role=${next}; path=/; max-age=${60 * 60 * 24 * 30}`;
      // Soft-refresh without full reload
      window.location.reload();
    }} />
  );
}
