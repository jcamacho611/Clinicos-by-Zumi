import { redirect } from "next/navigation";

import { EduCommandHeader } from "@/components/edu/edu-shell";
import { WorkforceCurriculumVersionManager } from "@/components/edu/workforce-curriculum-version-manager";
import { db } from "@/lib/db";
import { canFinalizeCompetency } from "@/lib/edu/edu-roles";
import { eduAiGatewayStatus, CREDENTIAL_DISCLAIMER } from "@/lib/edu/edu-safety";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import { listWorkforceCurriculumVersions } from "@/lib/edu/workforce-curriculum-repository";

export const dynamic = "force-dynamic";

export default async function EduSettingsPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;
  if (!canFinalizeCompetency(identity.role)) redirect("/edu/dashboard");

  const gateway = eduAiGatewayStatus();
  const [courses, versions] = identity.institutionId && process.env.DATABASE_URL
    ? await Promise.all([
        db.educationCourse.findMany({
          where: { institutionId: identity.institutionId },
          orderBy: [{ code: "asc" }, { title: "asc" }],
          select: { id: true, title: true, code: true },
          take: 250,
        }),
        listWorkforceCurriculumVersions(identity),
      ])
    : [[], []];

  return (
    <>
      <EduCommandHeader description="Institution configuration, governed integrations, and delivery provenance." eyebrow="Administration" title="Settings" />
      <div className="px-5 py-6 sm:px-8">
        <table className="w-full max-w-4xl border border-[#e28b85]/12 bg-[#12090b]/45 text-left text-sm">
          <caption className="sr-only">Integration status</caption>
          <thead className="bg-[#12090b]/60 text-[11px] uppercase tracking-[.1em] text-[#8f7773]">
            <tr>
              <th className="px-4 py-3 font-extrabold" scope="col">Capability</th>
              <th className="px-4 py-3 font-extrabold" scope="col">State</th>
              <th className="px-4 py-3 font-extrabold" scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[#e28b85]/10">
              <th className="px-4 py-3 font-bold text-[#f8efed]" scope="row">AI scenario drafting &amp; feedback</th>
              <td className="px-4 py-3 font-semibold text-[#efaaa1]">{gateway.available ? "Connected" : "Pending Connection"}</td>
              <td className="px-4 py-3 leading-6 text-[#a98f8b]">{gateway.detail}</td>
            </tr>
            <tr className="border-t border-[#e28b85]/10">
              <th className="px-4 py-3 font-bold text-[#f8efed]" scope="row">LMS interoperability (LTI 1.3, SSO)</th>
              <td className="px-4 py-3 font-semibold text-[#efaaa1]">Pending Connection</td>
              <td className="px-4 py-3 leading-6 text-[#a98f8b]">Requires per-institution credentials and an agreement before it can be enabled.</td>
            </tr>
            <tr className="border-t border-[#e28b85]/10">
              <th className="px-4 py-3 font-bold text-[#f8efed]" scope="row">Credential issuance</th>
              <td className="px-4 py-3 font-semibold text-[#efaaa1]">Pending review</td>
              <td className="px-4 py-3 leading-6 text-[#a98f8b]">{CREDENTIAL_DISCLAIMER}</td>
            </tr>
          </tbody>
        </table>

        <WorkforceCurriculumVersionManager
          canApprove={identity.role === "edu_admin"}
          courses={courses}
          versions={versions.map((version) => ({
            id: version.id,
            courseId: version.courseId,
            version: version.version,
            status: version.status,
            changeSummary: version.changeSummary,
            approvedAt: version.approvedAt?.toISOString() ?? null,
            effectiveAt: version.effectiveAt?.toISOString() ?? null,
            retiredAt: version.retiredAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </>
  );
}
