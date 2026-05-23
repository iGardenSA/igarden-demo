"use client";

import { useState } from "react";
import { Download, FileText, Printer } from "lucide-react";
import { DISCLAIMERS } from "@/lib/disclaimers";

/**
 * Brief §4 Phase 3.5 — compliance export.
 * Builds a CSV client-side + a print-ready HTML window for PDF (browser print).
 * Footer is non-negotiable boilerplate per §7.
 */
export function ComplianceExport({
  siteName, rangeFrom, rangeTo, rows,
}: {
  siteName: string;
  rangeFrom: string;
  rangeTo: string;
  rows: { time: string; metric: string; value: string; source: string; status: string; actor?: string; reason?: string; }[];
}) {
  const [busy, setBusy] = useState(false);

  function downloadCsv() {
    setBusy(true);
    const header = ["time", "metric", "value", "source", "status", "actor", "reason"];
    const csv = [header, ...rows.map((r) => [r.time, r.metric, r.value, r.source, r.status, r.actor ?? "", r.reason ?? ""])]
      .map((line) => line.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv, "\n", `"DISCLAIMER","${DISCLAIMERS.compliance}"`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `compliance-${siteName}-${rangeFrom}-${rangeTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  }

  function openPrintable() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>تقرير امتثال — ${escapeHtml(siteName)}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: Tajawal, "IBM Plex Sans Arabic", system-ui, sans-serif; color: #1F2933; line-height: 1.6; }
  h1 { color: #0F3D2E; margin: 0 0 4px; font-size: 22px; }
  .meta { color: #4A5568; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #DDE1E5; padding: 6px 8px; text-align: right; }
  th { background: #FAFBFC; }
  tr:nth-child(even) td { background: #FAFBFC; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px dashed #DDE1E5; color: #6B7785; font-size: 11px; }
  .pill { display:inline-block; padding:1px 6px; border-radius:4px; font-size:10px; border:1px solid #DDE1E5; }
</style>
</head>
<body>
  <h1>تقرير امتثال · iGarden Smart OS</h1>
  <div class="meta">
    الموقع: <strong>${escapeHtml(siteName)}</strong>
    · الفترة: <span dir="ltr">${escapeHtml(rangeFrom)} → ${escapeHtml(rangeTo)}</span>
    · بنية متوافقة مع GLOBALG.A.P. IFA — غير مُعتمدة خارجياً
  </div>

  <table>
    <thead>
      <tr><th>الوقت</th><th>القياس</th><th>القيمة</th><th>المصدر</th><th>الحالة</th><th>المُشغّل</th><th>السبب</th></tr>
    </thead>
    <tbody>
      ${rows.map((r) => `<tr>
        <td dir="ltr">${escapeHtml(r.time)}</td>
        <td>${escapeHtml(r.metric)}</td>
        <td dir="ltr">${escapeHtml(r.value)}</td>
        <td><span class="pill">${escapeHtml(r.source)}</span></td>
        <td>${escapeHtml(r.status)}</td>
        <td dir="ltr">${escapeHtml(r.actor ?? "")}</td>
        <td>${escapeHtml(r.reason ?? "")}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="footer">
    ${escapeHtml(DISCLAIMERS.compliance)}<br>
    ${escapeHtml(DISCLAIMERS.reportFooter)}
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`);
    w.document.close();
  }

  return (
    <div className="iso-panel p-4 space-y-3" dir="rtl">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileText className="size-4" />
          تصدير الامتثال
        </h3>
        <div className="text-xs text-[color:var(--color-iso-ink-muted)] ltr-bdi">
          {rangeFrom} → {rangeTo}
        </div>
      </header>
      <p className="text-xs text-[color:var(--color-iso-ink-soft)] leading-relaxed">
        يُولّد جدولاً متوافق البنية مع GLOBALG.A.P. IFA: قراءات + أحداث تحكّم + أوامر مع الأسباب والمؤكّدين. لا يستبدل الاعتماد الرسمي.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={downloadCsv}
          disabled={busy}
          className="text-xs px-3 py-2 rounded-md border border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)] flex items-center gap-1.5"
        >
          <Download className="size-3.5" /> تحميل CSV
        </button>
        <button
          onClick={openPrintable}
          className="text-xs px-3 py-2 rounded-md border border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)] flex items-center gap-1.5"
        >
          <Printer className="size-3.5" /> طباعة PDF
        </button>
      </div>
      <footer className="disclaimer-footer">{DISCLAIMERS.compliance}</footer>
    </div>
  );
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
