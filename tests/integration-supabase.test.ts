import { describe, it, expect, beforeAll } from "vitest";

// Integration tests against the live Supabase project.
// Auto-skips if SUPABASE_SERVICE_ROLE_KEY isn't set, so CI without secrets
// stays green. Set env locally (.env.local) to actually exercise these.

const HAS_ENV = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const d = HAS_ENV ? describe : describe.skip;

d("Supabase integration — schema constraints + golden flow", () => {
  beforeAll(async () => {
    // Lazy import — only when env is present, to avoid initialising the client.
    const { triggerGoldenFlow } = await import("../src/lib/golden-flow");
    await triggerGoldenFlow();
  });

  it("rejects a reading with an invalid source_type value", async () => {
    const { getServerSupabase } = await import("../src/lib/supabase/server");
    const sb = getServerSupabase();
    const { error } = await sb.from("readings").insert({
      site_id: "site-demo", sensor_id: "sen-site-demo-ec", value: 2,
      unit: "mS/cm", status: "ok",
      source_type: "invented" as never,
      recorded_at: new Date().toISOString(),
    });
    expect(error).toBeTruthy();
    expect(error!.message).toMatch(/enum|invalid/i);
  });

  it("rejects an ai_recommendation with requires_human_approval=false", async () => {
    const { getServerSupabase } = await import("../src/lib/supabase/server");
    const sb = getServerSupabase();
    const { error } = await sb.from("ai_recommendations").insert({
      id: "ai-fail-" + Date.now(),
      site_id: "site-demo",
      recommendation_type: "x", recommendation: "x", evidence_summary: "x",
      confidence_label: "low", requires_human_approval: false,
    });
    expect(error).toBeTruthy();
    expect(error!.message).toMatch(/check|requires_human_approval/i);
  });

  it("rejects a report without a disclaimer", async () => {
    const { getServerSupabase } = await import("../src/lib/supabase/server");
    const sb = getServerSupabase();
    const { error } = await sb.from("reports").insert({
      id: "rep-fail-" + Date.now(),
      site_id: "site-demo", report_type: "daily",
      period_start: new Date().toISOString(), period_end: new Date().toISOString(),
      summary: "x", generated_by: "test",
      disclaimer: null as unknown as string,
    });
    expect(error).toBeTruthy();
    expect(error!.message).toMatch(/null|not.?null|disclaimer/i);
  });

  it("Golden Flow leaves a pending high-confidence AI recommendation on site-demo", async () => {
    const { getServerSupabase } = await import("../src/lib/supabase/server");
    const sb = getServerSupabase();
    const { data } = await sb.from("ai_recommendations")
      .select("*").eq("site_id", "site-demo").eq("approval_status", "pending")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    expect(data).toBeTruthy();
    expect(data!.confidence_label).toBe("high");
    expect(data!.requires_human_approval).toBe(true);
  });
});
