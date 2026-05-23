"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { fmtDateTime } from "@/lib/format";
import type { ControlEvent, Command } from "@/lib/smartos-types";
import { Download, Filter } from "lucide-react";

/**
 * Brief §4 Phase 1.5 — visible audit log, filterable, exportable.
 * Reads pre-fetched control_events + commands map.
 */
export function AuditLog({
  events, commands, siteOptions,
}: {
  events: ControlEvent[];
  commands: Record<string, Command>;
  siteOptions: { id: string; name: string }[];
}) {
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (siteFilter !== "all" && e.site_id !== siteFilter) return false;
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      if (actorFilter) {
        const cmd = e.command_id ? commands[e.command_id] : undefined;
        const haystack = `${cmd?.requested_by ?? ""} ${cmd?.confirmed_by ?? ""}`.toLowerCase();
        if (!haystack.includes(actorFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, siteFilter, actorFilter, typeFilter, commands]);

  function exportCsv() {
    const rows = [
      ["time", "site_id", "device_id", "event_type", "previous_state", "new_state", "source_type", "command_id", "requested_by", "confirmed_by", "reason"],
      ...filtered.map((e) => {
        const c = e.command_id ? commands[e.command_id] : undefined;
        return [
          e.created_at, e.site_id, e.device_id, e.event_type, e.previous_state ?? "", e.new_state ?? "",
          e.source_type, e.command_id ?? "", c?.requested_by ?? "", c?.confirmed_by ?? "", c?.reason ?? "",
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="iso-panel" dir="rtl">
      <header className="px-4 py-3 border-b border-[color:var(--color-iso-border)] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-[color:var(--color-iso-ink-soft)]" aria-hidden />
          <h2 className="text-base font-bold">سجل التدقيق</h2>
          <span className="text-xs text-[color:var(--color-iso-ink-muted)] tabular ltr-bdi">{filtered.length} حدث</span>
        </div>
        <button
          onClick={exportCsv}
          className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)]"
        >
          <Download className="size-3.5" /> تصدير CSV
        </button>
      </header>

      <div className="px-4 py-2 border-b border-[color:var(--color-iso-border)] flex items-center gap-2 flex-wrap text-xs">
        <Select label="الموقع" value={siteFilter} onChange={setSiteFilter} options={[{ value: "all", label: "كل المواقع" }, ...siteOptions.map((s) => ({ value: s.id, label: s.name }))]} />
        <Select label="النوع" value={typeFilter} onChange={setTypeFilter} options={[
          { value: "all", label: "كل الأنواع" },
          { value: "issued", label: "أمر صادر" }, { value: "executed", label: "مُنفَّذ" },
          { value: "acknowledged", label: "مُطّلع" }, { value: "failed", label: "فشل" },
          { value: "rolled_back", label: "تراجع" }, { value: "manual_override", label: "تجاوز يدوي" },
          { value: "safety_engage", label: "تفعيل أمان" },
        ]} />
        <label className="flex items-center gap-1">
          <span className="text-[color:var(--color-iso-ink-muted)]">المُشغّل:</span>
          <input
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder="op-..."
            className="border border-[color:var(--color-iso-border)] rounded px-2 py-1 text-xs ltr-bdi"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="iso-table">
          <thead>
            <tr>
              <th className="text-start">الوقت</th>
              <th className="text-start">الحدث</th>
              <th className="text-start">الجهاز</th>
              <th className="text-start">الانتقال</th>
              <th className="text-start">المصدر</th>
              <th className="text-start">المُشغّل / المؤكّد</th>
              <th className="text-start">السبب</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-[color:var(--color-iso-ink-muted)] py-6">لا أحداث مطابقة للتصفية</td></tr>
            )}
            {filtered.map((e) => {
              const c = e.command_id ? commands[e.command_id] : undefined;
              return (
                <tr key={e.id}>
                  <td className="ltr-bdi tabular text-xs">{fmtDateTime(e.created_at)}</td>
                  <td><EventTypeChip t={e.event_type} /></td>
                  <td className="ltr-bdi text-xs">{e.device_id}</td>
                  <td className="ltr-bdi text-xs">
                    {e.previous_state ?? "—"} → <span className="font-semibold">{e.new_state ?? "—"}</span>
                  </td>
                  <td><SrcChip s={e.source_type} /></td>
                  <td className="text-xs ltr-bdi">
                    {c ? <>{c.requested_by} <span className="text-[color:var(--color-iso-ink-muted)]">·</span> {c.confirmed_by}</> : "—"}
                  </td>
                  <td className="text-xs max-w-xs truncate" title={c?.reason ?? ""}>{c?.reason ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EventTypeChip({ t }: { t: ControlEvent["event_type"] }) {
  const STYLE: Record<ControlEvent["event_type"], string> = {
    issued: "bg-[color:var(--color-status-info)]/10 text-[color:var(--color-status-info)] border-[color:var(--color-status-info)]/25",
    acknowledged: "bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-soft)] border-[color:var(--color-iso-border)]",
    executed: "bg-[color:var(--color-status-ok)]/10 text-[color:var(--color-status-ok)] border-[color:var(--color-status-ok)]/25",
    failed: "bg-[color:var(--color-status-high)]/10 text-[color:var(--color-status-high)] border-[color:var(--color-status-high)]/25",
    rolled_back: "bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/25",
    manual_override: "bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/25",
    safety_engage: "bg-[color:var(--color-status-ok)]/10 text-[color:var(--color-status-ok)] border-[color:var(--color-status-ok)]/25",
  };
  const LABEL: Record<ControlEvent["event_type"], string> = {
    issued: "صادر", acknowledged: "مُطّلع", executed: "مُنفَّذ", failed: "فشل",
    rolled_back: "تراجع", manual_override: "تجاوز يدوي", safety_engage: "أمان مُفعَّل",
  };
  return <span className={cn("iso-chip border", STYLE[t])}>{LABEL[t]}</span>;
}

function SrcChip({ s }: { s: ControlEvent["source_type"] }) {
  return <span className="iso-chip border bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-soft)] border-[color:var(--color-iso-border)] uppercase">{s}</span>;
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1">
      <span className="text-[color:var(--color-iso-ink-muted)]">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-[color:var(--color-iso-border)] rounded px-2 py-1 text-xs bg-white"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
