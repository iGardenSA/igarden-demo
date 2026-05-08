// ─── Compliance Report Storage — iGarden Smart OS ──────────────────
// Uploads a generated PDF to the compliance-reports bucket (private).
// Always safe to call: if Supabase is absent or the upload fails,
// returns { uploaded: false, fileUrl: null } and does not throw.
// ───────────────────────────────────────────────────────────────────

import { isSupabaseConfigured, uploadStorageObject } from './supabase';

export type ReportUploadResult =
  | { uploaded: true;  fileUrl: string }
  | { uploaded: false; fileUrl: null; reason: string };

export async function uploadComplianceReportPdf(input: {
  reportId: string;
  pdfBlob:  Blob;
}): Promise<ReportUploadResult> {
  if (!isSupabaseConfigured()) {
    return { uploaded: false, fileUrl: null, reason: 'Supabase not configured' };
  }

  const path = `demo/${input.reportId}.pdf`;

  try {
    const result = await uploadStorageObject({
      bucket:      'compliance-reports',
      path,
      body:        input.pdfBlob,
      contentType: 'application/pdf',
    });
    return { uploaded: true, fileUrl: result.path };
  } catch (error) {
    console.warn('[iGarden] Compliance PDF was not uploaded:', error);
    return {
      uploaded: false,
      fileUrl:  null,
      reason:   error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
