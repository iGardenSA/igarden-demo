// ─── Report Export Logger — iGarden Smart OS ───────────────────────
// Logs a compliance report export to the report_exports table.
// Always safe to call: if Supabase is absent or the insert fails,
// it returns { logged: false } and the PDF still downloads normally.
// ───────────────────────────────────────────────────────────────────

import { isSupabaseConfigured, post } from './supabase';

export type ReportExportInput = {
  reportId:    string;
  farmId?:     string | null;
  reportType:  string;
  dataMode:    'demo' | 'simulated' | 'live';
  generatedBy: string;
  fileUrl?:    string | null;
  disclaimer:  string;
};

export type ReportExportResult =
  | { logged: true;  rows: unknown[] }
  | { logged: false; reason: string  };

export async function logReportExport(
  input: ReportExportInput
): Promise<ReportExportResult> {
  if (!isSupabaseConfigured()) {
    return { logged: false, reason: 'Supabase not configured' };
  }

  try {
    const rows = await post('report_exports', {
      report_id:    input.reportId,
      farm_id:      input.farmId   ?? null,
      report_type:  input.reportType,
      data_mode:    input.dataMode,
      generated_by: input.generatedBy,
      file_url:     input.fileUrl  ?? null,
      disclaimer:   input.disclaimer,
    });
    return { logged: true, rows };
  } catch (err) {
    console.warn('[iGarden] Report export not logged:', err);
    return {
      logged: false,
      reason: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
