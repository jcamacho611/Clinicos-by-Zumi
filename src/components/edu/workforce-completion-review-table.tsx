"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";

import { projectWorkforceEvidenceChain } from "@/lib/edu/workforce/workforce-evidence-chain";

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

const visibleEvidenceStages = [
  "enrollment",
  "session",
  "attendance",
  "applied_evidence",
  "knowledge",
  "instructor_review",
  "completion_approval",
] as const;

const evidenceStageLabels: Record<(typeof visibleEvidenceStages)[number], string> = {
  enrollment: "Enrollment",
  session: "Session",
  attendance: "Attendance",
  applied_evidence: "Applied work",
  knowledge: "Knowledge",
  instructor_review: "Instructor review",
  completion_approval: "Completion",
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
              const completed = Boolean(row.completedAt);
              const evidenceChain = projectWorkforceEvidenceChain({
                enrolled: true,
                sessionScheduled: row.scheduledMinutes > 0,
                attendanceVerified: row.attendancePercent >= minimumAttendancePercent,
                appliedEvidenceSatisfied: row.requiredActivities === 0 || row.gradedActivities >= row.requiredActivities,
                knowledgeSatisfied: row.requiredKnowledgePairs === 0 || row.comparableKnowledgePairs >= row.requiredKnowledgePairs,
                instructorReviewed: completed,
                completionApproved: completed,
                credentialIssued: false,
              }).filter((stage): stage is typeof stage & { key: (typeof visibleEvidenceStages)[number] } =>
                visibleEvidenceStages.includes(stage.key as (typeof visibleEvidenceStages)[number]),
              );

              return (
                <Fragment key={row.enrollmentId}>
                  <tr className="border-b border-[#e28b85]/10 align-top">
                    <th className="px-3 py-3 font-semibold text-[#f8efed]" scope="row"><span className="block">{row.studentDisplayName}</span><span className="mt-1 block font-normal text-[#8f7773]">{row.studentEmail}</span></th>
                    <td className="px-3 py-3 text-[#bca5a1]"><span className="font-semibold text-[#f8efed]">{row.attendancePercent}%</span><span className="mt-1 block text-[#8f7773]">{row.verifiedMinutesPresent}/{row.scheduledMinutes} verified min</span></td>
                    <td className="px-3 py-3 text-[#bca5a1]"><span className="font-semibold text-[#f8efed]">{row.gradedActivities}/{row.requiredActivities}</span><span className="mt-1 block text-[#8f7773]">released after grading</span></td>
                    <td className="px-3 py-3 text-[#bca5a1]"><span className="font-semibold text-[#f8efed]">{row.comparableKnowledgePairs}/{row.requiredKnowledgePairs}</span><span className="mt-1 block text-[#8f7773]">{row.averageKnowledgeChange == null ? "no paired change yet" : `${row.averageKnowledgeChange >= 0 ? "+" : ""}${row.averageKnowledgeChange} pts avg`}</span></td>
                    <td className="px-3 py-3"><span className="font-semibold text-[#efaaa1]">{row.completedAt ? "completed" : row.resolution.status.replaceAll("_", " ")}</span>{!row.completedAt && row.resolution.blockers.length > 0 && <span className="mt-1 block text-[#8f7773]">Blocked: {row.resolution.blockers.join(", ")}</span>}</td>
                    <td className="px-3 py-3">{row.completedAt ? <span className="text-[#a9c5b0]">Finalized</span> : canFinalize && readyForHumanReview ? <button className="border border-[#e6817b]/35 bg-[#e6817b]/10 px-3 py-2 font-semibold text-[#ffd0ca] disabled:opacity-50" disabled={busy !== null} onClick={() => finalize(row.enrollmentId)} type="button">Approve completion</button> : <span className="text-[#8f7773]">Evidence required</span>}</td>
                  </tr>
                  <tr className="border-b border-[#e28b85]/10 bg-[#12090b]/35">
                    <td className="px-3 py-3" colSpan={6}>
                      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Evidence chain</p>
                      <ol className="mt-2 flex flex-wrap gap-2" aria-label={`Completion evidence chain for ${row.studentDisplayName}`}>
                        {evidenceChain.map((stage) => (
                          <li
                            className={stage.status === "satisfied"
                              ? "border border-[#7ba38a]/30 bg-[#7ba38a]/10 px-2.5 py-1.5 text-[#b9d5c1]"
                              : stage.status === "action_required"
                                ? "border border-[#e6817b]/35 bg-[#e6817b]/10 px-2.5 py-1.5 text-[#ffd0ca]"
                                : "border border-[#e28b85]/10 bg-[#0d0708]/55 px-2.5 py-1.5 text-[#8f7773]"}
                            key={stage.key}
                          >
                            <span className="font-semibold">{evidenceStageLabels[stage.key]}</span>
                            <span className="ml-1 opacity-75">· {stage.status.replaceAll("_", " ")}</span>
                          </li>
                        ))}
                      </ol>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
