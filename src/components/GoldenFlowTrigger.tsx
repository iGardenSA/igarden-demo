"use client";

import { useTransition } from "react";
import { Play } from "lucide-react";
import { triggerGoldenFlowAction } from "@/lib/actions";

export function GoldenFlowTrigger({ label = "تشغيل سيناريو EC — حادثة الديمو الذهبية" }: { label?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => triggerGoldenFlowAction().then(() => {}))}
      disabled={pending}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[color:var(--color-deep-green)] text-white text-sm font-semibold hover:bg-[color:var(--color-corp-green)] disabled:opacity-60"
      type="button"
      dir="rtl"
    >
      <Play className="size-4" />
      {pending ? "جارٍ التشغيل…" : label}
    </button>
  );
}
