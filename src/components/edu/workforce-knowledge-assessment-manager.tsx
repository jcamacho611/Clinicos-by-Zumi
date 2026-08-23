"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RosterOption = { enrollmentId: string; name: string; email: string };

export function WorkforceKnowledgeAssessmentManager({
  courseId,
  cohortId,
  sessionId,
  roster,
}: {
  courseId: string;
  cohortId: string;
  sessionId: string;
  roster: RosterOption[];
}) {
  const router = useRouter();
  const [enrollmentId, setEnrollmentId] = useState(roster[0]?.enrollmentId ?? "");
  const [assessmentKey, setAssessmentKey] = useState("workforce-ai-core");
  const [phase, setPhase] = useState<"pre" | "post">("pre");
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [pointsPossible, setPointsPossible] = useState(10);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/edu/knowledge-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          cohortId,
          enrollmentId,
          sessionId,
          assessmentKey,
          phase,
          attemptNumber,
          pointsAwarded,
          pointsPossible,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Assessment evidence could not be recorded.");
      setMessage(`${phase === "pre" ? "Pre" : "Post"}-assessment evidence recorded and instructor-reviewed.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Assessment evidence could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7" aria-labelledby="knowledge-measurement-title">
      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Measured learning evidence</p>
      <h2 className="mt-2 text-lg font-semibold text-[#f8efed]" id="knowledge-measurement-title">Pre/post knowledge assessment</h2>
      <p className="mt-2 max-w-3xl text-xs leading-6 text-[#a98f8b]">Record scored knowledge checks separately from participant confidence surveys. Only comparable, instructor-reviewed pre/post attempts are eligible for knowledge-change reporting.</p>

      <form className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1.1fr_.7fr_.7fr_.7fr_.7fr_auto]" onSubmit={submit}>
        <label className="text-xs text-[#bca5a1]">Participant
          <select className="mt-1 w-full border border-[#e28b85]/16 bg-[#12090b] px-3 py-2 text-[#f8efed]" onChange={(event) => setEnrollmentId(event.target.value)} required value={enrollmentId}>
            {roster.map((item) => <option key={item.enrollmentId} value={item.enrollmentId}>{item.name} · {item.email}</option>)}
          </select>
        </label>
        <label className="text-xs text-[#bca5a1]">Assessment key
          <input className="mt-1 w-full border border-[#e28b85]/16 bg-[#12090b] px-3 py-2 text-[#f8efed]" maxLength={120} onChange={(event) => setAssessmentKey(event.target.value)} required value={assessmentKey} />
        </label>
        <label className="text-xs text-[#bca5a1]">Phase
          <select className="mt-1 w-full border border-[#e28b85]/16 bg-[#12090b] px-3 py-2 text-[#f8efed]" onChange={(event) => setPhase(event.target.value as "pre" | "post")} value={phase}><option value="pre">Pre</option><option value="post">Post</option></select>
        </label>
        <label className="text-xs text-[#bca5a1]">Attempt
          <input className="mt-1 w-full border border-[#e28b85]/16 bg-[#12090b] px-3 py-2 text-[#f8efed]" min={1} max={20} onChange={(event) => setAttemptNumber(Number(event.target.value))} type="number" value={attemptNumber} />
        </label>
        <label className="text-xs text-[#bca5a1]">Score
          <input className="mt-1 w-full border border-[#e28b85]/16 bg-[#12090b] px-3 py-2 text-[#f8efed]" min={0} onChange={(event) => setPointsAwarded(Number(event.target.value))} type="number" value={pointsAwarded} />
        </label>
        <label className="text-xs text-[#bca5a1]">Possible
          <input className="mt-1 w-full border border-[#e28b85]/16 bg-[#12090b] px-3 py-2 text-[#f8efed]" min={1} onChange={(event) => setPointsPossible(Number(event.target.value))} type="number" value={pointsPossible} />
        </label>
        <button className="self-end border border-[#e6817b]/35 bg-[#e6817b]/10 px-4 py-2 text-xs font-semibold text-[#ffd0ca] disabled:opacity-50" disabled={busy || !enrollmentId || pointsAwarded > pointsPossible} type="submit">Record</button>
      </form>
      {message && <p className="mt-3 text-xs leading-5 text-[#efaaa1]" role="status">{message}</p>}
    </section>
  );
}
