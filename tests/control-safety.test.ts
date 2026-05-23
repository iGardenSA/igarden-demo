import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the supabase server module BEFORE importing the helper under test.
// Tracks calls so we can assert the RPC is invoked with the right args.
const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
const rpcResult = { data: null, error: null as null | { message: string } };

vi.mock("@/lib/supabase-server", () => ({
  getServerSupabase: () => ({
    rpc: (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      return Promise.resolve(rpcResult);
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
    }),
  }),
}));

import { issueCommand, CommandSafetyError } from "../app/lib/queries";

beforeEach(() => {
  rpcCalls.length = 0;
  rpcResult.data = null;
  rpcResult.error = null;
});

const base = {
  siteId: "s1",
  deviceId: "d1",
  commandType: "pause" as const,
  requestedState: "paused",
  reason: "EC out of band — pause to reassess",
  requestedBy: "op-test",
  confirmedBy: "supervisor-test",
  safetyLockEnabled: true,
};

describe("CommandSafetyError pre-checks (TS layer)", () => {
  it("rejects empty reason", async () => {
    await expect(issueCommand({ ...base, reason: "   " })).rejects.toBeInstanceOf(CommandSafetyError);
  });
  it("rejects empty confirmer", async () => {
    await expect(issueCommand({ ...base, confirmedBy: "" })).rejects.toBeInstanceOf(CommandSafetyError);
  });
  it("rejects disabled safety lock", async () => {
    await expect(issueCommand({ ...base, safetyLockEnabled: false })).rejects.toBeInstanceOf(CommandSafetyError);
  });
  it("invokes issue_command_with_event RPC when invariants pass", async () => {
    const { commandId } = await issueCommand(base);
    expect(commandId).toBeTruthy();
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].fn).toBe("issue_command_with_event");
    expect(rpcCalls[0].args).toMatchObject({
      p_site_id: "s1",
      p_device_id: "d1",
      p_command_type: "pause",
      p_requested_state: "paused",
      p_reason: "EC out of band — pause to reassess",
      p_requested_by: "op-test",
      p_confirmed_by: "supervisor-test",
    });
  });
  it("maps Postgres DEVICE_NOT_FOUND exception to CommandSafetyError", async () => {
    rpcResult.error = { message: "DEVICE_NOT_FOUND" };
    const err = await issueCommand(base).catch((e) => e);
    expect(err).toBeInstanceOf(CommandSafetyError);
    expect((err as CommandSafetyError).code).toBe("DEVICE_NOT_FOUND");
  });
  it("maps Postgres REASON_REQUIRED exception to CommandSafetyError", async () => {
    rpcResult.error = { message: "REASON_REQUIRED" };
    const err = await issueCommand(base).catch((e) => e);
    expect((err as CommandSafetyError).code).toBe("REASON_REQUIRED");
  });
  it("maps Postgres CONFIRM_REQUIRED exception to CommandSafetyError", async () => {
    rpcResult.error = { message: "CONFIRM_REQUIRED" };
    const err = await issueCommand(base).catch((e) => e);
    expect((err as CommandSafetyError).code).toBe("CONFIRM_REQUIRED");
  });
});
