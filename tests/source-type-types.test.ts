import { describe, it, expectTypeOf } from "vitest";
import type { SourceType, Severity, ApprovalStatus, SensorStatus } from "../app/lib/smartos-types";

// Type-level assertions that the TS literal unions for §7 red-line ENUMs
// exactly match the Postgres ENUM values. The Postgres CHECK + ENUM types
// in the migration enforce these at the DB level; this catches drift at
// the TS layer (e.g. someone adds a forbidden literal).

describe("source_type + related ENUM literals match Postgres", () => {
  it("SourceType is exactly the 4 allowed values", () => {
    expectTypeOf<SourceType>().toEqualTypeOf<"live" | "simulated" | "manual" | "offline">();
  });
  it("Severity is exactly p1/p2/p3", () => {
    expectTypeOf<Severity>().toEqualTypeOf<"p1" | "p2" | "p3">();
  });
  it("ApprovalStatus matches Postgres ENUM", () => {
    expectTypeOf<ApprovalStatus>().toEqualTypeOf<"pending" | "approved" | "modified" | "rejected">();
  });
  it("SensorStatus matches Postgres ENUM", () => {
    expectTypeOf<SensorStatus>().toEqualTypeOf<"ok" | "warning" | "critical" | "offline" | "stale">();
  });
});
