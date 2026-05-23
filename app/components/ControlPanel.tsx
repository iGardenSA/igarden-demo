"use client";

import { useState } from "react";
import { Pause, Play, Power, RotateCcw, Settings } from "lucide-react";
import type { Device, Command, CommandType } from "@/lib/smartos-types";
import { DeviceHealth } from "./DeviceHealth";
import { ControlConfirmModal } from "./ControlConfirmModal";
import { issueCommandAction } from "@/lib/actions";

interface ControlOption { label: string; type: CommandType; state: string; icon: React.ComponentType<{ className?: string }> }

const OPTIONS_BY_TYPE: Partial<Record<Device["device_type"], ControlOption[]>> = {
  pump: [
    { label: "إيقاف",   type: "pause",  state: "paused",  icon: Pause },
    { label: "تشغيل",   type: "resume", state: "running", icon: Play },
  ],
  dosing: [
    { label: "إيقاف الجرعات", type: "pause",  state: "paused",  icon: Pause },
    { label: "استئناف الجرعات", type: "resume", state: "running", icon: Play },
  ],
  valve: [
    { label: "فتح",   type: "open",  state: "open",   icon: Power },
    { label: "إغلاق", type: "close", state: "closed", icon: Power },
  ],
  fan: [
    { label: "إيقاف",   type: "pause",  state: "off", icon: Pause },
    { label: "تشغيل",   type: "resume", state: "on",  icon: Play },
  ],
  controller: [
    { label: "إعادة تشغيل", type: "reset", state: "reset", icon: RotateCcw },
  ],
  ro_unit: [
    { label: "إيقاف وحدة RO",   type: "pause",  state: "paused",  icon: Pause },
    { label: "تشغيل وحدة RO",   type: "resume", state: "running", icon: Play },
  ],
};

interface PanelProps {
  devices: Device[];
  recentCommandsByDevice: Record<string, Command | null>;
}

export function ControlPanel({ devices, recentCommandsByDevice }: PanelProps) {
  const [modalState, setModalState] = useState<{ device: Device; opt: ControlOption } | null>(null);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {devices.map((d) => {
          const opts = OPTIONS_BY_TYPE[d.device_type] ?? [];
          return (
            <div key={d.id} className="iso-panel p-3 space-y-3" dir="rtl">
              <DeviceHealth device={d} compact />
              {opts.length === 0 ? (
                <div className="text-xs text-[color:var(--color-iso-ink-muted)] iso-chip border bg-[color:var(--color-iso-fill)] border-[color:var(--color-iso-border)]">
                  لا أوامر تحكّم مباشرة لهذا الجهاز
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {opts.map((o) => (
                    <button
                      key={o.label}
                      onClick={() => setModalState({ device: d, opt: o })}
                      className="text-xs px-2.5 py-2 rounded-md border border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)] flex items-center justify-center gap-1.5"
                    >
                      <o.icon className="size-3.5" />
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {recentCommandsByDevice[d.id] && (
                <div className="text-[11px] text-[color:var(--color-iso-ink-muted)] ltr-bdi">
                  آخر: {recentCommandsByDevice[d.id]!.command_type} → {recentCommandsByDevice[d.id]!.requested_state} · {recentCommandsByDevice[d.id]!.status}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ControlConfirmModal
        open={!!modalState}
        onClose={() => setModalState(null)}
        device={modalState?.device ?? ({ id: "", site_id: "", name: "" } as Device)}
        commandType={modalState?.opt.type ?? "pause"}
        requestedState={modalState?.opt.state ?? ""}
        recentStatus={modalState ? recentCommandsByDevice[modalState.device.id] : null}
        onSubmit={async (input) => issueCommandAction(input)}
      />
    </>
  );
}

// Re-export so a sole-button entry (e.g., from /alerts) can use the modal directly:
export { ControlConfirmModal } from "./ControlConfirmModal";
