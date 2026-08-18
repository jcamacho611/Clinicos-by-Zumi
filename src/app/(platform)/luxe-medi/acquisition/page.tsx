import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlarmClock, CircleDollarSign, Clock3, MessageCircleMore, Route, UserRoundCheck } from "lucide-react";
import { LuxeLeadClaimButton } from "@/components/clinic/luxe-lead-claim-button";
import { LuxeMediNav } from "@/components/clinic/luxe-medi-nav";
import { LuxePaymentEvidenceForm } from "@/components/clinic/luxe-payment-evidence-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { getLuxeAcquisitionOperations } from "@/lib/repositories/luxe-acquisition-analytics-repository";

export const metadata: Metadata = { title: "Luxe acquisition operations" };

function elapsed(minutes: number | null) {
  if (minutes === null) return "Contact recorded";
  if (minutes < 60) return `${minutes}m unanswered`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h unanswered`;
  return `${Math.floor(minutes / 1440)}d unanswered`;
}

export default async function LuxeAcquisitionPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "luxe_medi", "read") || !can(session.role, "crm", "read")) return notFound();
  const canClaimLeads = can(session.role, "luxe_medi", "update") && can(session.role, "crm", "update");
  const canReconcilePayments = can(session.role, "luxe_medi", "manage") && can(session.role, "crm", "update");
  const data = await getLuxeAcquisitionOperations(session);

  return (
    <div className="space-y-6">
      <LuxeMediNav />
      <PageIntro title="Turn Luxe demand into owned next actions." description="One operational view for unanswered demand, speed-to-lead, attribution, at-risk opportunity, follow-up, and collected payment evidence. Estimated opportunity stays separate from money backed by evidence." aside={<><Badge tone="violet">Luxe acquisition</Badge><Badge tone="amber">{data.slaMinutes}m response target</Badge><Badge tone="teal">CRM source of truth</Badge></>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard accent="violet" detail="Created during the rolling 24 hours" icon={<Route className="size-4" />} label="New 24h" value={String(data.metrics.leadsLast24Hours)} />
        <StatCard accent="sky" detail="No recorded contact yet" icon={<MessageCircleMore className="size-4" />} label="Unanswered" value={String(data.metrics.unansweredLeads)} />
        <StatCard accent="amber" detail="Overdue follow-up or past SLA" icon={<AlarmClock className="size-4" />} label="At risk" value={String(data.metrics.atRiskLeads)} />
        <StatCard accent="rose" detail="Needs an explicit human owner" icon={<UserRoundCheck className="size-4" />} label="Unassigned" value={String(data.metrics.unassignedOpenLeads)} />
        <StatCard accent="teal" detail="Recorded contact timestamps only" icon={<Clock3 className="size-4" />} label="Median response" value={data.metrics.medianSpeedToLeadMinutes === null ? "No data" : `${data.metrics.medianSpeedToLeadMinutes}m`} />
        <StatCard accent="violet" detail="Manual reconciliation + processor verification" icon={<CircleDollarSign className="size-4" />} label="Collected w/ evidence" value={data.metrics.collectedRevenueWithEvidence} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <SectionCard title="Contact now" description="Deterministic priority queue: overdue follow-up first, then leads past the configured response target, then estimated opportunity.">
          <div className="divide-y divide-slate-100">
            {data.actionQueue.slice(0, 20).map((lead) => (
              <article className="p-4" key={lead.id}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-xs font-extrabold text-slate-900">{lead.name}</h3><StatusBadge status={lead.status} /><Badge tone={lead.routingStatus === "unassigned" ? "amber" : "teal"}>{lead.routingStatus}</Badge>{(lead.followUpOverdue || lead.pastSla) && <Badge tone="rose">Needs attention</Badge>}{lead.collectedWithEvidenceCents > 0 && <Badge tone="teal">{lead.collectedWithEvidence} collected</Badge>}</div>
                    <p className="mt-1 text-[11px] text-slate-500">{lead.serviceInterest ?? "Service interest pending"} · {lead.estimatedOpportunity} estimated · payment {lead.paymentStatus.replaceAll("_", " ")}</p>
                    <p className="mt-2 text-[12px] text-slate-400">First touch: {lead.firstTouchSource}{lead.firstCampaignSource ? ` · ${lead.firstCampaignSource}` : ""}{lead.latestTouch?.source ? ` · latest ${lead.latestTouch.source}` : ""}</p>
                    {canClaimLeads && lead.routingStatus === "unassigned" && <LuxeLeadClaimButton leadId={lead.id} />}
                    {canReconcilePayments && <LuxePaymentEvidenceForm leadId={lead.id} />}
                  </div>
                  <div className="text-right"><p className="text-[12px] font-extrabold uppercase tracking-[.12em] text-slate-500">{lead.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs font-bold text-slate-700">{elapsed(lead.unansweredAgeMinutes)}</p></div>
                </div>
              </article>
            ))}
            {!data.actionQueue.length && <p className="p-5 text-xs text-slate-500">Everything important in the current lead queue is handled.</p>}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <Card className="overflow-hidden"><div className="border-b border-slate-100 bg-slate-950 p-5 text-white"><p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-violet-300">Revenue truth</p><h3 className="mt-3 text-xl font-extrabold tracking-[-.04em]">Opportunity, booking, and cash stay separate.</h3><p className="mt-2 text-xs leading-5 text-slate-400">Collected revenue appears only when a payment evidence event is linked to the lead. Manual reconciliation is never represented as processor verification.</p></div><div className="space-y-3 p-5 text-xs"><div className="flex justify-between gap-4"><span className="text-slate-500">Open estimated</span><strong className="text-slate-900">{data.metrics.openEstimatedOpportunity}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Booked estimated</span><strong className="text-slate-900">{data.metrics.bookedEstimatedValue}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Lost estimated</span><strong className="text-slate-900">{data.metrics.lostEstimatedOpportunity}</strong></div><div className="border-t border-slate-100 pt-3"><div className="flex justify-between gap-4"><span className="font-extrabold text-slate-900">Collected with evidence</span><strong className="text-emerald-700">{data.metrics.collectedRevenueWithEvidence}</strong></div><p className="mt-2 text-slate-500">Manual reconciled: {data.metrics.manualReconciledRevenue} · Processor verified: {data.metrics.processorVerifiedRevenue}</p></div></div></Card>

          <SectionCard title="Unanswered age" description="No message is assumed sent just because a lead exists."><div className="grid grid-cols-2 gap-3 p-4 text-center"><div className="rounded-xl bg-slate-50 p-3"><p className="text-lg font-extrabold text-slate-900">{data.unansweredBuckets.under5}</p><p className="text-[12px] text-slate-500">under 5m</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-lg font-extrabold text-slate-900">{data.unansweredBuckets.fiveTo15}</p><p className="text-[12px] text-slate-500">5–15m</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-lg font-extrabold text-amber-900">{data.unansweredBuckets.fifteenTo60}</p><p className="text-[12px] text-amber-700">15–60m</p></div><div className="rounded-xl bg-rose-50 p-3"><p className="text-lg font-extrabold text-rose-900">{data.unansweredBuckets.oneTo24Hours + data.unansweredBuckets.over24Hours}</p><p className="text-[12px] text-rose-700">over 1h</p></div></div></SectionCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="By source" description="First-touch source now shows both estimated opportunity and collected money backed by payment evidence."><div className="divide-y divide-slate-100">{data.bySource.slice(0, 10).map((item) => <div className="flex items-center justify-between gap-4 p-4" key={item.key}><div><p className="text-xs font-extrabold text-slate-900">{item.key}</p><p className="text-[12px] text-slate-500">{item.leads} leads · {item.openLeads} open · {item.estimatedOpportunity} estimated</p></div><strong className="text-xs text-emerald-700">{item.collectedWithEvidence} collected</strong></div>)}</div></SectionCard>
        <SectionCard title="By campaign" description="Campaign revenue appears only where both attribution and payment evidence exist."><div className="divide-y divide-slate-100">{data.byCampaign.slice(0, 10).map((item) => <div className="flex items-center justify-between gap-4 p-4" key={item.key}><div><p className="text-xs font-extrabold text-slate-900">{item.key}</p><p className="text-[12px] text-slate-500">{item.leads} leads · {item.openLeads} open · {item.estimatedOpportunity} estimated</p></div><strong className="text-xs text-emerald-700">{item.collectedWithEvidence} collected</strong></div>)}</div></SectionCard>
        <SectionCard title="By service" description="Service intent mapped to the canonical Luxe catalog, with evidence-backed collected revenue kept separate from estimates."><div className="divide-y divide-slate-100">{data.byService.slice(0, 10).map((item) => <div className="flex items-center justify-between gap-4 p-4" key={item.key}><div><p className="text-xs font-extrabold text-slate-900">{item.key}</p><p className="text-[12px] text-slate-500">{item.leads} leads · {item.openLeads} open · {item.estimatedOpportunity} estimated</p></div><strong className="text-xs text-emerald-700">{item.collectedWithEvidence} collected</strong></div>)}</div></SectionCard>
      </div>
    </div>
  );
}
