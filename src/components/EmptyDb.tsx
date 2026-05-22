import Link from "next/link";
import { Database } from "lucide-react";

/**
 * Defensive empty-state when Supabase returns 0 sites.
 * Prevents the "Cannot read properties of undefined (reading 'id')" class of
 * errors that bit prerender on first deploy.
 */
export function EmptyDb({ context = "site" }: { context?: string }) {
  return (
    <div className="p-12 text-center" dir="rtl">
      <Database className="size-10 mx-auto text-[color:var(--color-iso-ink-muted)] mb-3" aria-hidden />
      <h1 className="text-lg font-bold text-[color:var(--color-deep-green)]">قاعدة البيانات فارغة</h1>
      <p className="text-sm text-[color:var(--color-iso-ink-soft)] mt-2 max-w-md mx-auto">
        لا توجد بيانات لعرضها بعد ({context}). شغّل seed:
      </p>
      <code className="iso-chip border bg-white border-[color:var(--color-iso-border)] mt-3 font-mono text-xs">
        npm run seed
      </code>
      <div className="mt-4">
        <Link href="/" className="text-sm text-[color:var(--color-status-info)] hover:underline">العودة للوحة الرئيسية</Link>
      </div>
    </div>
  );
}
