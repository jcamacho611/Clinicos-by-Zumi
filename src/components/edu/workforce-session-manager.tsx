"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CohortOption = { id: string; name: string; courseTitle: string };
type SessionItem = {
  id: string;
  cohortId: string;
  title: string;
  deliveryMode: "in_person" | "live_remote" | "hybrid";
  status: string;
  startsAt: string;
  endsAt: string;
  curriculumVersion: string | null;
  materialVersion: string | null;
  locationLabel: string | null;
  remoteJoinProvider: string | null;
};

export function WorkforceSessionManager({
  canManage,
  cohorts,
  sessions,
}: {
  canManage: boolean;
  cohorts: CohortOption[];
  sessions: SessionItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const cohortNames = useMemo(() => new Map(cohorts.map((cohort) => [cohort.id, cohort])), [cohorts]);

  async function createSession(formData: FormData) {
    setBusy(true);
    setMessage(null);
    const startsLocal = String(formData.get("startsAt") ?? "");
    const endsLocal = String(formData.get("endsAt") ?? "");
    const payload = {
      cohortId: String(formData.get("cohortId") ?? ""),
      title: String(formData.get("title") ?? ""),
      deliveryMode: String(formData.get("deliveryMode") ?? "live_remote"),
      startsAt: startsLocal ? new Date(startsLocal).toISOString() : "",
      endsAt: endsLocal ? new Date(endsLocal).toISOString() : "",
      curriculumVersion: String(formData.get("curriculumVersion") ?? "") || null,
      materialVersion: String(formData.get("materialVersion") ?? "") || null,
      locationLabel: String(formData.get("locationLabel") ?? "") || null,
      remoteJoinProvider: String(formData.get("remoteJoinProvider") ?? "") || null,
    };

    try {
      const response = await fetch("/api/edu/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Session could not be created.");
      setMessage("Session scheduled.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Session could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
      <section aria-labelledby="session-list-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#8f7773]">Delivery calendar</p>
            <h2 className="mt-1 text-lg font-semibold text-[#f8efed]" id="session-list-title">Instructional sessions</h2>
          </div>
          <p className="text-xs tabular-nums text-[#8f7773]">{sessions.length} recorded</p>
        </div>
        <div className="mt-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-6">
              <p className="text-sm font-semibold text-[#f8efed]">No sessions recorded yet</p>
              <p className="mt-2 text-xs leading-6 text-[#8f7773]">A session is one scheduled live class. Creating one establishes the record that attendance, curriculum version, delivery mode, feedback, and completion evidence can attach to.</p>
            </div>
          ) : sessions.map((session) => {
            const cohort = cohortNames.get(session.cohortId);
            return (
              <article className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5" key={session.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#e6817b]">{session.deliveryMode.replaceAll("_", " ")} · {session.status}</p>
                    <h3 className="mt-1 text-base font-semibold text-[#f8efed]">{session.title}</h3>
                    <p className="mt-1 text-xs text-[#8f7773]">{cohort ? `${cohort.courseTitle} · ${cohort.name}` : "Scoped cohort"}</p>
                  </div>
                  <div className="text-right text-xs leading-5 text-[#bca5a1]">
                    <p>{new Date(session.startsAt).toLocaleString()}</p>
                    <p className="text-[#8f7773]">to {new Date(session.endsAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-[#8f7773] sm:grid-cols-2">
                  <p>Curriculum: <span className="text-[#bca5a1]">{session.curriculumVersion ?? "not recorded"}</span></p>
                  <p>Materials: <span className="text-[#bca5a1]">{session.materialVersion ?? "not recorded"}</span></p>
                  <p>Location: <span className="text-[#bca5a1]">{session.locationLabel ?? "not specified"}</span></p>
                  <p>Remote provider: <span className="text-[#bca5a1]">{session.remoteJoinProvider ?? "not specified"}</span></p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside>
        <div className="border border-[#e28b85]/12 bg-[#0d0708]/80 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#8f7773]">Instructor control</p>
          <h2 className="mt-1 text-lg font-semibold text-[#f8efed]">Schedule a live session</h2>
          {!canManage ? (
            <p className="mt-3 text-xs leading-6 text-[#8f7773]">You can review delivery records, but only an instructor or education administrator can schedule a class.</p>
          ) : cohorts.length === 0 ? (
            <p className="mt-3 text-xs leading-6 text-[#8f7773]">Create or join an instructional cohort before scheduling its live sessions.</p>
          ) : (
            <form action={createSession} className="mt-5 space-y-4">
              <Field label="Cohort">
                <select className={controlClass} name="cohortId" required defaultValue="">
                  <option disabled value="">Choose a cohort</option>
                  {cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.courseTitle} · {cohort.name}</option>)}
                </select>
              </Field>
              <Field label="Session title"><input className={controlClass} name="title" required maxLength={180} placeholder="Healthcare AI — safe prompting lab" /></Field>
              <Field label="Delivery mode">
                <select className={controlClass} name="deliveryMode" defaultValue="live_remote">
                  <option value="live_remote">Live remote</option>
                  <option value="in_person">In person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Field label="Starts"><input className={controlClass} name="startsAt" type="datetime-local" required /></Field>
                <Field label="Ends"><input className={controlClass} name="endsAt" type="datetime-local" required /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Field label="Curriculum version"><input className={controlClass} name="curriculumVersion" placeholder="v1.0" /></Field>
                <Field label="Material version"><input className={controlClass} name="materialVersion" placeholder="slides-1.0" /></Field>
              </div>
              <Field label="Location / room"><input className={controlClass} name="locationLabel" placeholder="Optional for live remote" /></Field>
              <Field label="Remote platform"><input className={controlClass} name="remoteJoinProvider" placeholder="Approved delivery platform" /></Field>
              <button className="w-full border border-[#e6817b]/40 bg-[#e6817b]/10 px-4 py-3 text-xs font-semibold text-[#f3b2aa] transition hover:bg-[#e6817b]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b] disabled:cursor-not-allowed disabled:opacity-50" disabled={busy} type="submit">
                {busy ? "Scheduling…" : "Schedule session"}
              </button>
              {message ? <p aria-live="polite" className="text-xs leading-5 text-[#bca5a1]">{message}</p> : null}
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}

const controlClass = "w-full border border-[#e28b85]/15 bg-[#12090b] px-3 py-2.5 text-sm text-[#f8efed] outline-none placeholder:text-[#695754] focus:border-[#e6817b]/60 focus-visible:ring-1 focus-visible:ring-[#e6817b]/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[#bca5a1]"><span className="mb-1.5 block">{label}</span>{children}</label>;
}
