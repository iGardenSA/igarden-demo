"use server";

import { revalidatePath } from "next/cache";
import {
  issueCommand as dbIssueCommand,
  executeCommand,
  acknowledgeAlert,
  resolveAlert,
  decideAIRecommendation,
  CommandSafetyError,
} from "./queries";
import type { CommandType, ApprovalStatus } from "./types";
import { triggerGoldenFlow as runGolden } from "./golden-flow";

export interface IssueCommandResult { ok: boolean; error?: string; commandId?: string; }

export async function issueCommandAction(input: {
  siteId: string;
  deviceId: string;
  commandType: CommandType;
  requestedState: string;
  reason: string;
  requestedBy: string;
  confirmedBy: string;
  safetyLockEnabled: true;
}): Promise<IssueCommandResult> {
  try {
    if (!input.safetyLockEnabled) return { ok: false, error: "Safety lock must be armed" };
    const { commandId } = dbIssueCommand({
      siteId: input.siteId,
      deviceId: input.deviceId,
      commandType: input.commandType,
      requestedState: input.requestedState,
      reason: input.reason,
      requestedBy: input.requestedBy,
      confirmedBy: input.confirmedBy,
      safetyLockEnabled: true,
    });
    // immediately mark executed (simulated — no real GPIO per G2)
    executeCommand(commandId);
    revalidatePath("/logs");
    revalidatePath("/alerts");
    revalidatePath(`/site/${input.siteId}`);
    revalidatePath(`/site/${input.siteId}/control`);
    return { ok: true, commandId };
  } catch (e) {
    if (e instanceof CommandSafetyError) return { ok: false, error: e.message };
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function decideAIAction(id: string, decision: ApprovalStatus, by = "op-current"): Promise<void> {
  decideAIRecommendation(id, decision, by);
  revalidatePath("/ai");
  revalidatePath("/alerts");
}

export async function ackAlertAction(id: string, by = "op-current"): Promise<void> {
  acknowledgeAlert(id, by);
  revalidatePath("/alerts");
}

export async function resolveAlertAction(id: string): Promise<void> {
  resolveAlert(id);
  revalidatePath("/alerts");
}

export async function triggerGoldenFlowAction(): Promise<{ ok: boolean; alertId?: string }> {
  const r = runGolden();
  revalidatePath("/");
  revalidatePath("/demo");
  revalidatePath("/alerts");
  revalidatePath("/site/site-demo");
  return r;
}
