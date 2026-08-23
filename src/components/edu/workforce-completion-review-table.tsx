"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CompletionReviewRow = {
  enrollmentId: string;
  studentDisplayName: string;
  studentEmail: string;
  enrollmentStatus: string;
  completedAt: string | null;
  scheduledMinutes: number;
  verifiedMinutesPresent: number;
  attendancePercent: number;
  requiredActivities: number;
  gradedActivities: number;
  requiredKnowledgePairs: number;
  comparableKnowledgePairs: number;
  averageKnowledgeChange: number | null;
  resolution: { status: "incomplete" | "needs_instructor_review" | "complete"; blockers: string[] };
};

export function WorkforceCompletionReviewTable({
  rows,
  canFinalize,
  minimumAttendancePercent,
}: {
  rows: CompletionReviewRow[];
  canFinalize: boolean;
  minimumAttendancePercent: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function finalize(enrollmentId: string) {
    setBusy(enrollmentId);
    setMessage(null);
    try {
      const response = await fetch("/api/edu/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, minimumAttendancePercent }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Completion could not be finalized.");
      setMessage("Completion finalized from verified evidence and instructor approval.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Completion could not be finalized.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7" aria-labelledby="completion-review-title">
      <div className="max-w-4xl">
        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Human completion authority</p>
        <h2 className="mt-2 text-lg font-semibold text-[#f8efed]" id="completion-review-title">Completion review</h2>
        <p className="mt-2 text-xs leading-6 text-[#a98f8b]">Current demo policy requires at least {minimumAttendancePercent}% verified instructional time, all assigned applied work released after grading, required comparable knowledge evidence, and explicit instructor/admin approval. Contract-specific rules remain configurable before live delivery.</p>
      </div>
      {message && <p className="mt-3 text-xs leading-5 text-[#efaaa1]" role="status">{message}</p>}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <caption className="sr-only">Workforce participant completion evidence</caption>
          <thead className="text-[#8f7773]"><tr><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Participant</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Attendance</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Applied work</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Knowledge</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">State</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Action</th></tr></thead>
          <tbody>
            {rows.map((row) => {
              const readyForHumanReview = row.resolution.status === "needs_instructor_review";
              return (
                <tr className="border-b border-[#e28b85]/10 align-top" key={row.enrollmentId}>
                  <th className="px-3 py-3 font-semibold text-[#f8efed]" scope="row"><span className="block">{row.studentDisplayName}</span><span className="mt-1 block font-normal text-[#8f7773]">{row.studentEmail}</span></th>
                  <td className="px-3 py-3 text-[#bca5a1]"><span className="font-semibold text-[#f8efed]">{row.attendancePercent}%</span><span className="mt-1 block text-[#8f7773]">{row.verifiedMinutesPresent}/{row.scheduledMinutes} verified min</span></td>
                  <td className="px-3 py-3 text-[#bca5a1]"><span className="font-semibold text-[#f8efed]">{row.gradedActivities}/{row.requiredActivities}</span><span className="mt-1 block text-[#8f7773]">released after grading</span></td>
                  <td className="px-3 py-3 text-[#bca5a1]"><span className="font-semibold text-[#f8efed]">{row.comparableKnowledgePairs}/{row.requiredKnowledgePairs}</span><span className="mt-1 block text-[#8f7773]">{row.averageKnowledgeChange == null ? "no paired change yet" : `${row.averageKnowledgeChange >= 0 ? "+" : ""}${row.averageKnowledgeChange} pts avg`}</span></td>
                  <td className="px-3 py-3"><span className="font-semibold text-[#efaaa1]">{row.completedAt ? "completed" : row.resolution.status.replaceAll("_", " ")}</span>{!row.completedAt && row.resolution.blockers.length > 0 && <span className="mt-1 block text-[#8f7773]">Blocked: {row.resolution.blockers.join(", ")}</span>}</td>
                  <td className="px-3 py-3">{row.completedAt ? <span className="text-[#a9c5b0]">Finalized</span> : canFinalize && readyForHumanReview ? <button className="border border-[#e6817b]/35 bg-[#e6817b]/10 px-3 py-2 font-semibold text-[#ffd0ca] disabled:opacity-50" disabled={busy !== null} onClick={() => finalize(row.enrollmentId)} type="button">Approve completion</button> : <span className="text-[#8f7773]">Evidence required</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
