"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { nextAppointmentStatuses } from "@/lib/appointment-lifecycle";
import type { AppointmentStatus } from "@/lib/types";

export function AppointmentStatusControl({
  appointmentId,
  initialStatus,
}: {
  appointmentId: string;
  initialStatus: AppointmentStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = nextAppointmentStatuses(status);

  async function updateStatus(targetStatus: string) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      const payload = await response.json() as { error?: string; appointment?: { status: AppointmentStatus } };
      if (!response.ok || !payload.appointment) throw new Error(payload.error ?? "Status update failed.");
      setStatus(payload.appointment.status);
      startTransition(() => router.refresh());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Status update failed.");
    } finally {
      setPending(false);
    }
  }

  if (options.length === 0) {
    return <span className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">No action</span>;
  }

  return (
    <div className="min-w-32">
      <div className="relative">
        <select
          aria-label="Update appointment status"
          className="h-8 w-full appearance-none rounded-lg border border-slate-200 bg-white px-2 pr-8 text-[10px] font-bold text-slate-700 outline-none transition hover:border-teal-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-50 disabled:opacity-60"
          disabled={pending}
          onChange={(event) => {
            if (event.target.value) void updateStatus(event.target.value);
            event.target.value = "";
          }}
          value=""
        >
          <option value="">Next action</option>
          {options.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
        {pending && <LoaderCircle className="pointer-events-none absolute right-2 top-2 size-4 animate-spin text-teal-600" />}
      </div>
      {error && <p className="mt-1 max-w-40 text-[9px] leading-4 text-rose-600">{error}</p>}
    </div>
  );
}
