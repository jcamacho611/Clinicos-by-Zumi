import Link from "next/link";
import { ArrowRight, Banknote, CircleDollarSign, FileWarning, ReceiptText, ShieldCheck, TriangleAlert } from "lucide-react";
import { GridMoneyPanel } from "@/components/clinic/grid-money-panel";
import { PaymentConsole } from "@/components/clinic/payment-actions";
import { PageIntro, SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GridMoney } from "@/lib/money/grid-money";
import type { BillingTruthWorkspace } from "@/lib/repositories/billing-truth-repository";
import type { PaymentWorkspace } from "@/lib/repositories/payment-repository";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function BillingWorkspaceReal({ billing, grid, payments }: { billing: BillingTruthWorkspace; grid: GridMoney | null; payments: PaymentWorkspace }) {
  const nonTerminalClaims = billing.claims.filter((claim) => !["CLOSED"].includes(claim.status));
  const claimValueCents = nonTerminalClaims.reduce((sum, claim) => sum + claim.totalCents, 0);
  const openDenials = billing.denials.filter((denial) => denial.status.toLowerCase() !== "resolved");
  const denialValueCents = openDenials.reduce((sum, denial) => sum + denial.amountCents, 0);
  const patientBalanceCents = payments.balances.reduce((sum, balance) => sum + balance.balanceCents, 0);
  const now = new Date();
  const collectedMtdCents = payments.payments.filter((payment) => {
    if (payment.status !== "posted" || !payment.postedAt) return false;
    const posted = new Date(payment.postedAt);
    return posted.getUTCFullYear() === now.getUTCFullYear() && posted.getUTCMonth() === now.getUTCMonth();
  }).reduce((sum, payment) => sum + payment.amountCents, 0);
  const configuredPaymentRails = payments.integrations.filter((integration) => ["active", "connected", "live"].includes(integration.status.toLowerCase()));

  const revenueMetrics = [
    { label: "Claim value in work", value: money(claimValueCents), detail: `${nonTerminalClaims.length} stored claim records`, icon: Banknote, tone: "neutral" },
    { label: "Open denial value", value: money(denialValueCents), detail: `${openDenials.length} unresolved denial records`, icon: TriangleAlert, tone: "danger" },
    { label: "Patient balances", value: money(patientBalanceCents), detail: `${payments.balances.length} latest patient balances`, icon: ReceiptText, tone: "attention" },
    { label: "Posted MTD", value: money(collectedMtdCents), detail: "Posted payment records this calendar month", icon: CircleDollarSign, tone: "resolved" },
  ] as const;

  return <div className="space-y-6">
    <PageIntro
      title="Revenue cycle with every handoff visible."
      description="Stored claim drafts, denials, invoices, balances, payment evidence, and claim-readiness work share one truthful operating surface. External clearinghouse submission is never inferred from a local claim record."
      action={<Button asChild variant="primary"><Link href="/claim-readiness">Open claim readiness <ArrowRight className="size-4" /></Link></Button>}
      aside={<Button asChild variant="secondary"><Link href="/integrations">Revenue connections</Link></Button>}
    />

    <section data-revenue-integrity-strip className="overflow-hidden border-y border-[var(--k-line)] bg-[var(--k-public-surface)]" aria-label="Revenue integrity summary">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        {revenueMetrics.map(({ label, value, detail, icon: Icon, tone }, index) => <div className={`relative min-w-0 px-5 py-5 sm:px-6 ${index > 0 ? "border-t border-[var(--k-line)] sm:border-l sm:border-t-0" : ""} ${index === 2 ? "sm:border-l-0 xl:border-l" : ""}`} data-financial-tone={tone} key={label}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[var(--k-muted)]">{label}</p>
            <Icon className={`size-4 ${tone === "danger" ? "text-rose-600" : tone === "attention" ? "text-amber-700" : "text-[var(--k-accent)]"}`} aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums tracking-[-.04em] text-[var(--k-text)] sm:text-3xl">{value}</p>
          <p className="mt-2 text-xs leading-5 text-[var(--k-muted)]">{detail}</p>
        </div>)}
      </div>
    </section>

    <Card className="border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-800 shadow-sm"><ShieldCheck className="size-5" /></span><div><p className="text-xs font-extrabold text-slate-900">Stored claim status is not clearinghouse evidence.</p><p className="mt-2 text-[11px] leading-5 text-slate-600">A local `SUBMITTED`, `ACCEPTED`, or other claim state remains an internal workflow state unless a real 837/277/835 or equivalent external evidence record supports it. The current surface does not fabricate that evidence.</p><p className="mt-2 text-[12px] text-slate-500">Payment integrations currently marked connected/live in tenant configuration: {configuredPaymentRails.length}.</p></div></div></Card>

    <GridMoneyPanel grid={grid} />

    <PaymentConsole workspace={payments} />

    <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <SectionCard title="Stored claim worklist" description="Claims route to Claim readiness for governed coding review. No browser action here pretends to submit a payer transaction.">
        <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-400"><th className="px-5 py-3">Patient / claim</th><th className="px-3 py-3">Payer</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">External evidence</th><th className="px-3 py-3">Updated</th><th className="px-5 py-3">State</th></tr></thead><tbody>{billing.claims.map((claim) => <tr className="border-b border-slate-100 text-xs last:border-0" key={claim.id}><td className="px-5 py-5"><Link className="font-extrabold text-slate-900 hover:text-sky-700" href={`/patients/${claim.patientId}`}>{claim.patientName}</Link><p className="mt-1 text-[12px] text-slate-400">{claim.patientMrn} · {claim.id}</p></td><td className="px-3 py-5 font-bold text-slate-700">{claim.payer}</td><td className="px-3 py-5 font-extrabold tabular-nums text-slate-900">{money(claim.totalCents)}</td><td className="px-3 py-5"><p className="text-[12px] text-slate-500">{claim.submittedAt ? `Local submitted timestamp: ${new Date(claim.submittedAt).toLocaleString()}` : "No submission timestamp"}</p><p className="mt-1 text-[11px] font-bold text-amber-700">Clearinghouse response not inferred</p></td><td className="px-3 py-5 text-[12px] text-slate-500">{new Date(claim.updatedAt).toLocaleString()}</td><td className="px-5 py-5"><div className="flex items-center gap-2"><StatusBadge status={claim.status} /><Button asChild size="icon" variant="ghost" aria-label={`Open claim readiness for ${claim.patientName}`}><Link href="/claim-readiness"><ArrowRight className="size-4" /></Link></Button></div></td></tr>)}{billing.claims.length === 0 && <tr><td className="px-5 py-8 text-xs text-slate-500" colSpan={6}>No claim draft records are stored for this organization.</td></tr>}</tbody></table></div>
      </SectionCard>

      <SectionCard title="Denial work" description="Real stored denial records and appeal timing, without invented percentages or forecast confidence.">
        <div className="divide-y divide-slate-100">{billing.denials.map((denial) => <article className="p-5" key={denial.id}><div className="flex flex-wrap items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700"><FileWarning className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{denial.reason}</p><StatusBadge status={denial.status} /></div><p className="mt-1 text-[12px] tabular-nums text-slate-500">{denial.patientName} · {denial.payer} · {money(denial.amountCents)}</p><p className="mt-1 text-[11px] text-slate-400">{denial.reasonCode ? `Reason code ${denial.reasonCode} · ` : ""}{denial.appealDueAt ? `Appeal due ${new Date(denial.appealDueAt).toLocaleDateString()}` : "No appeal due date recorded"}</p></div></div></article>)}{billing.denials.length === 0 && <p className="p-5 text-xs text-slate-500">No denial records are stored.</p>}</div>
      </SectionCard>
    </div>

    <Card className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-slate-950">Claims transmission remains a governed external rail.</p><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">Use the existing claim-readiness workflow now. Activate a production clearinghouse only after payer enrollment, credentials, contract/BAA posture, and customer-funded economics are ready.</p></div><div className="flex gap-2"><Badge tone="amber">837/277/835 pending production rail</Badge><Button asChild size="sm" variant="secondary"><Link href="/claim-readiness">Claim readiness</Link></Button></div></div></Card>
  </div>;
}
