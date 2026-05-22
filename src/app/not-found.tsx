import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <main className="p-12 text-center">
        <h1 className="text-3xl font-bold text-[color:var(--color-deep-green)]">404</h1>
        <p className="text-sm text-[color:var(--color-iso-ink-soft)] mt-2">المسار غير موجود.</p>
        <Link href="/" className="inline-block mt-4 text-sm text-[color:var(--color-status-info)] hover:underline">عودة للوحة الرئيسية</Link>
      </main>
    </AppShell>
  );
}
