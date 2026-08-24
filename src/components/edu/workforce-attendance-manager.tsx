"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RosterItem = {
  enrollmentId: string;
  name: string;
  email: string;
  status: string;
  attendance: {
    status: string;
    evidenceSource: string;
    verifiedAt: string | null;
    minutesPresent: number | null;
    evidenceNote: string | null;
  } | null;
};

export function WorkforceAttendanceManager({
  canVerify,
  sessionId,
  roster,
}: {
  canVerify: boolean;
  sessionId: string;
  roster: RosterItem[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function saveAttendance(formData: FormData) {
    const enrollmentId = String(formData.get("enrollmentId") ?? "");
    setBusyId(enrollmentId);
    setMessage(null);
    const minutesRaw = String(formData.get("minutesPresent") ?? "").trim();

    try {
      const response = await fetch(`/api/edu/sessions/${encodeURIComponent(sessionId)}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          status: String(formData.get("status") ?? "unverified"),
          evidenceSource: String(formData.get("evidenceSource") ?? ""),
          minutesPresent: minutesRaw ? Number(minutesRaw) : null,
          evidenceNote: String(formData.get("evidenceNote") ?? "") || null,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Attendance could not be saved.");
      setMessage("Attendance evidence saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Attendance could not be saved.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-labelledby="roster-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#8f7773]">Evidence roster</p>
          <h2 className="mt-1 text-lg font-semibold text-[#f8efed]" id="roster-title">Participant attendance</h2>
        </div>
        <p className="text-xs tabular-nums text-[#8f7773]">{roster.length} enrolled in cohort</p>
      </div>

      {message ? <p aria-live="polite" className="mt-3 border border-[#e28b85]/12 bg-[#12090b]/45 px-4 py-3 text-xs text-[#bca5a1]">{message}</p> : null}

      <div className="mt-4 space-y-3">
        {roster.length === 0 ? (
          <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-6 text-xs leading-6 text-[#8f7773]">This cohort has no enrollment records yet. Attendance cannot exist without a participant enrollment.</div>
        ) : roster.map((person) => (
          <form action={saveAttendance} className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5" key={person.enrollmentId}>
            <input name="enrollmentId" type="hidden" value={person.enrollmentId} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#f8efed]">{person.name}</h3>
                <p className="mt-1 text-xs text-[#8f7773]">{person.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Current evidence</p>
                <p className="mt-1 text-xs text-[#bca5a1]">{person.attendance?.status ?? "not recorded"}</p>
                <p className="mt-1 text-[11px] text-[#695754]">{person.attendance?.verifiedAt ? `verified ${new Date(person.attendance.verifiedAt).toLocaleString()}` : "not verified"}</p>
              </div>
            </div>

            {canVerify ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-[150px_1fr_120px]">
                <label className="text-xs font-medium text-[#bca5a1]">Status
                  <select className={controlClass} defaultValue={person.attendance?.status ?? "unverified"} name="status">
                    <option value="present">Present</option>
                    <option value="partial">Partial</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-[#bca5a1]">Evidence source
                  <input className={controlClass} defaultValue={person.attendance?.evidenceSource ?? "instructor_roll_call"} maxLength={120} name="evidenceSource" required placeholder="instructor_roll_call" />
                </label>
                <label className="text-xs font-medium text-[#bca5a1]">Minutes
                  <input className={controlClass} defaultValue={person.attendance?.minutesPresent ?? ""} min={0} max={1440} name="minutesPresent" type="number" />
                </label>
                <label className="text-xs font-medium text-[#bca5a1] lg:col-span-2">Evidence note
                  <input className={controlClass} defaultValue={person.attendance?.evidenceNote ?? ""} maxLength={500} name="evidenceNote" placeholder="Optional minimum-necessary note" />
                </label>
                <button className="self-end border border-[#e6817b]/40 bg-[#e6817b]/10 px-4 py-2.5 text-xs font-semibold text-[#f3b2aa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b] disabled:opacity-50" disabled={busyId === person.enrollmentId} type="submit">
                  {busyId === person.enrollmentId ? "Saving…" : "Verify evidence"}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-5 text-[#8f7773]">Review-only access. Final attendance verification belongs to an instructor or education administrator.</p>
            )}
          </form>
        ))}
      </div>
    </section>
  );
}

const controlClass = "mt-1.5 w-full border border-[#e28b85]/15 bg-[#0d0708] px-3 py-2.5 text-sm text-[#f8efed] outline-none placeholder:text-[#695754] focus:border-[#e6817b]/60 focus-visible:ring-1 focus-visible:ring-[#e6817b]/50";
