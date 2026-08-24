import { redirect } from "next/navigation";

import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { WorkforceCompletionReviewTable } from "@/components/edu/workforce-completion-review-table";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import { listWorkforceCompletionEvidence } from "@/lib/edu/workforce-completion-repository";
import { defaultWorkforceCompletionPolicy } from "@/lib/edu/workforce-completion-review";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["edu_admin", "edu_instructor", "edu_assistant", "edu_observer"]);

export default async function EduCompletionsPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;
  if (!ALLOWED.has(identity.role)) redirect("/edu/dashboard");

  const reviews = identity.institutionId && process.env.DATABASE_URL
    ? await listWorkforceCompletionEvidence(identity, {
        minimumAttendancePercent: defaultWorkforceCompletionPolicy.minimumAttendancePercent,
        requiredKnowledgePairs: defaultWorkforceCompletionPolicy.requiredKnowledgePairs,
        limit: 150,
      })
    : [];

  return (
    <>
      <EduCommandHeader
        eyebrow="Completion authority"
        title="Completion review"
        description="A human-reviewed gate between workforce-delivery evidence and completion. Attendance, applied work, scored knowledge evidence, and final approval remain distinct and auditable."
      />
      <div className="px-5 py-6 sm:px-8">
        {!identity.institutionId ? (
          <EduEmptyState title="No institution linked" detail="Completion evidence requires an institutional EDU context." />
        ) : reviews.length === 0 ? (
          <EduEmptyState title="No active completion reviews" detail="Active or completed participant enrollments will appear here once they exist in an accessible cohort." />
        ) : (
          <WorkforceCompletionReviewTable
            canFinalize={identity.role === "edu_admin" || identity.role === "edu_instructor"}
            minimumAttendancePercent={defaultWorkforceCompletionPolicy.minimumAttendancePercent}
            rows={reviews}
          />
        )}
      </div>
    </>
  );
}
