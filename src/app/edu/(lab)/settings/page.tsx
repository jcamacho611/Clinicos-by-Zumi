import { redirect } from "next/navigation";
import { EduCommandHeader } from "@/components/edu/edu-shell";
import { canFinalizeCompetency } from "@/lib/edu/edu-roles";
import { eduAiGatewayStatus, CREDENTIAL_DISCLAIMER } from "@/lib/edu/edu-safety";
import { resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduSettingsPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;
  if (!canFinalizeCompetency(identity.role)) redirect("/edu/dashboard");

  const gateway = eduAiGatewayStatus();

  return (
    <>
      <EduCommandHeader description="Institution configuration and the current state of governed integrations." eyebrow="Administration" title="Settings" />
      <div className="px-5 py-6 sm:px-8">
        <table className="w-full max-w-3xl border border-white/10 bg-white/[.03] text-left text-sm">
          <caption className="sr-only">Integration status</caption>
          <thead className="bg-white/[.04] text-[11px] uppercase tracking-[.1em] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-extrabold" scope="col">Capability</th>
              <th className="px-4 py-3 font-extrabold" scope="col">State</th>
              <th className="px-4 py-3 font-extrabold" scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-white/10">
              <th className="px-4 py-3 font-bold text-white" scope="row">AI scenario drafting &amp; feedback</th>
              <td className="px-4 py-3 font-semibold text-[#f0dda0]">Pending Connection</td>
              <td className="px-4 py-3 leading-6 text-slate-400">{gateway.detail}</td>
            </tr>
            <tr className="border-t border-white/10">
              <th className="px-4 py-3 font-bold text-white" scope="row">LMS interoperability (LTI 1.3, SSO)</th>
              <td className="px-4 py-3 font-semibold text-[#f0dda0]">Pending Connection</td>
              <td className="px-4 py-3 leading-6 text-slate-400">Requires per-institution credentials and an agreement before it can be enabled.</td>
            </tr>
            <tr className="border-t border-white/10">
              <th className="px-4 py-3 font-bold text-white" scope="row">Credential issuance</th>
              <td className="px-4 py-3 font-semibold text-[#f0dda0]">Pending review</td>
              <td className="px-4 py-3 leading-6 text-slate-400">{CREDENTIAL_DISCLAIMER}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
