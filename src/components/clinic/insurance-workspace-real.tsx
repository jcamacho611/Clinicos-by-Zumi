import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck2, FileWarning, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InsuranceVerificationAction } from "@/components/clinic/insurance-verification-action";
import { SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { InsuranceWorkspaceData } from "@/lib/repositories/insurance-repository";

function money(cents: number | null) {
  if (cents === null) return "Not recorded";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function memberLabel(value: string) {
  if (value.length <= 4) return value;
  return `••••${value.slice(-4)}`;
}

export function InsuranceWorkspaceReal({ workspace }: { workspace: InsuranceWorkspaceData }) {
  const verifiedActive = workspace.coverages.filter((coverage) => coverage.latestVerification?.eligibilityStatus === "active").length;
  const needsReview = workspace.coverages.filter((coverage) => !coverage.latestVerification || ["unknown", "needs_review"].includes(coverage.latestVerification.eligibilityStatus)).length;
  const inactive = workspace.coverages.filter((coverage) => coverage.latestVerification?.eligibilityStatus === "inactive").length;
  const openPriorAuthorizations = workspace.priorAuthorizations.filter((authorization) => !["approved", "denied", "cancelled", "closed"].includes(authorization.status.toLowerCase())).length;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-teal-700">Insurance</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-slate-950">Coverage facts and evidence, without pretending a clearinghouse answered.</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">This workspace shows actual tenant coverage, stored verification evidence, and prior-authorization records. Staff can record manual evidence now; electronic 270/271 verification stays separate until a production clearinghouse connection is approved.</p>
      </div>
      <div className="flex flex-wrap gap-2">{workspace.canRecordVerification ? <InsuranceVerificationAction coverages={workspace.coverages} /> : null}<Button asChild variant="secondary"><Link href="/integrations">Eligibility connection <ArrowRight className="size-4" /></Link></Button></div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="teal" detail="Latest stored evidence says active" icon={<BadgeCheck className="size-4" />} label="Active evidence" value={String(verifiedActive)} />
      <StatCard accent="amber" detail="No evidence, unknown, or staff review needed" icon={<FileWarning className="size-4" />} label="Needs review" value={String(needsReview)} />
      <StatCard accent="rose" detail="Latest evidence says inactive" icon={<ShieldCheck className="size-4" />} label="Inactive evidence" value={String(inactive)} />
      <StatCard accent="sky" detail="Stored prior-authorizations not in a terminal state" icon={<FileCheck2 className="size-4" />} label="Open authorizations" value={String(openPriorAuthorizations)} />
    </div>

    <Card className="border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-800 shadow-sm"><ShieldCheck className="size-5" /></span><div><p className="text-xs font-extrabold text-slate-900">Verification evidence is not a guarantee of coverage or payment.</p><p className="mt-2 text-[11px] leading-5 text-slate-600">Eligibility can change and payer adjudication remains authoritative. Manual evidence is labeled by source and staff user. Klinikos does not call a manual record an electronic 270/271 response.</p></div></div></Card>

    <SectionCard title="Active coverage and latest evidence" description="Member identifiers are masked in this overview. Open the patient chart for broader patient context.">
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400"><th className="px-5 py-3">Patient</th><th className="px-3 py-3">Coverage</th><th className="px-3 py-3">Benefits recorded</th><th className="px-3 py-3">Evidence source</th><th className="px-3 py-3">Checked</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{workspace.coverages.map((coverage) => {
        const evidence = coverage.latestVerification;
        return <tr className="border-b border-slate-100 text-xs last:border-0" key={coverage.id}><td className="px-5 py-5"><Link className="font-extrabold text-slate-900 hover:text-sky-700" href={`/patients/${coverage.patientId}`}>{coverage.patientName}</Link><p className="mt-1 text-[10px] text-slate-400">{coverage.patientMrn}</p></td><td className="px-3 py-5"><p className="font-bold text-slate-800">{coverage.payer}</p><p className="mt-1 text-[10px] text-slate-400">{coverage.planName ?? "Plan not recorded"} · member {memberLabel(coverage.memberId)}</p><p className="mt-1 text-[9px] text-slate-400">Priority {coverage.priority}{coverage.effectiveDate ? ` · effective ${coverage.effectiveDate}` : ""}{coverage.terminationDate ? ` · terminates ${coverage.terminationDate}` : ""}</p></td><td className="px-3 py-5"><p className="font-bold text-slate-700">Copay {money(evidence?.copayCents ?? null)}</p><p className="mt-1 text-[10px] text-slate-500">Deductible {money(evidence?.deductibleCents ?? null)}{evidence?.coinsurancePercent !== null && evidence?.coinsurancePercent !== undefined ? ` · ${evidence.coinsurancePercent}% coinsurance` : ""}</p></td><td className="px-3 py-5"><p className="max-w-52 text-[10px] font-bold text-slate-600">{evidence?.source ?? "No verification evidence"}</p>{evidence?.notes ? <p className="mt-1 max-w-52 truncate text-[9px] text-slate-400" title={evidence.notes}>{evidence.notes}</p> : null}</td><td className="px-3 py-5 text-[10px] text-slate-500">{evidence?.verifiedAt ? new Date(evidence.verifiedAt).toLocaleString() : "Not checked"}</td><td className="px-5 py-5"><StatusBadge status={evidence?.eligibilityStatus ?? "Needs review"} /></td></tr>;
      })}{workspace.coverages.length === 0 && <tr><td className="px-5 py-8 text-xs text-slate-500" colSpan={6}>No active insurance coverage records are stored for this organization.</td></tr>}</tbody></table></div>
    </SectionCard>

    <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <SectionCard title="Prior authorization ledger" description="Stored authorization records only. Submission to a payer is not inferred from a draft record.">
        <div className="divide-y divide-slate-100">{workspace.priorAuthorizations.map((authorization) => <div className="grid gap-4 p-5 md:grid-cols-[1fr_.9fr_.65fr_auto] md:items-center" key={authorization.id}><div><Link className="text-xs font-extrabold text-slate-900 hover:text-sky-700" href={`/patients/${authorization.patientId}`}>{authorization.patientName}</Link><p className="mt-1 text-[10px] text-slate-400">{authorization.patientMrn}</p></div><div><p className="text-[9px] font-bold uppercase text-slate-400">{authorization.payer}</p><p className="mt-1 text-xs font-bold text-slate-700">{authorization.service}</p><p className="mt-1 text-[9px] text-slate-400">{authorization.referenceNumber ? `Ref ${authorization.referenceNumber}` : "No external reference recorded"}</p></div><div><p className="text-[9px] font-bold text-slate-400">SUBMITTED</p><p className="mt-1 text-[10px] text-slate-600">{authorization.submittedAt ? new Date(authorization.submittedAt).toLocaleDateString() : "Not recorded"}</p></div><StatusBadge status={authorization.status} /></div>)}{workspace.priorAuthorizations.length === 0 && <p className="p-5 text-xs text-slate-500">No prior-authorization records are stored.</p>}</div>
      </SectionCard>
      <SectionCard title="Recent verification history" description="Human-entered and future electronic evidence share one visible history, with source preserved.">
        <div className="divide-y divide-slate-100">{workspace.verificationHistory.slice(0, 12).map((verification) => <div className="p-4" key={verification.id}><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{verification.patientName}</p><StatusBadge status={verification.eligibilityStatus} /><Badge tone="slate">{verification.payer}</Badge></div><p className="mt-2 text-[10px] text-slate-500">{verification.source} · {new Date(verification.verifiedAt).toLocaleString()}</p>{verification.notes ? <p className="mt-2 text-[10px] leading-5 text-slate-500">{verification.notes}</p> : null}</div>)}{workspace.verificationHistory.length === 0 && <p className="p-5 text-xs text-slate-500">No insurance verification evidence is recorded yet.</p>}</div>
      </SectionCard>
    </div>
  </div>;
}
