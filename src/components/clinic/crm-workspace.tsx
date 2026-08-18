import { ArrowUpRight, CircleDollarSign, Clock3, MessageSquareText, PhoneCall, RefreshCw, RotateCcw, UserRoundPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LeadCreateAction, LeadMessageAction, LeadTransitionAction } from "@/components/clinic/crm-actions";
import type { CRMWorkspace as CRMWorkspaceData } from "@/lib/repositories/crm-repository";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";

type CRMLead = CRMWorkspaceData["leads"][number];

const pipelineColumns: Array<{ key: string; label: string; matches: (lead: CRMLead) => boolean }> = [
  { key: "new", label: "New", matches: (lead) => lead.status === "new" && lead.bookingStatus !== "cancellation_observed" },
  { key: "contacted", label: "Contacted", matches: (lead) => lead.status === "contacted" && lead.bookingStatus !== "cancellation_observed" },
  { key: "booked", label: "Booked", matches: (lead) => lead.status === "booked" && lead.bookingStatus !== "cancellation_observed" },
  { key: "recovery", label: "Recovery", matches: (lead) => lead.bookingStatus === "cancellation_observed" },
  { key: "lost", label: "Lost", matches: (lead) => lead.status === "lost" },
];

function nextActionTitle(lead: CRMLead) {
  if (lead.bookingStatus === "cancellation_observed") return `Review cancellation recovery: ${lead.name}`;
  if (lead.overdue) return `Follow up with ${lead.name}`;
  return `Contact new lead: ${lead.name}`;
}

export function CRMWorkspace({ workspace, canCreate, canUpdate }: { workspace: CRMWorkspaceData; canCreate: boolean; canUpdate: boolean }) {
  const conversionRate = workspace.leads.length ? Math.round((workspace.metrics.booked / workspace.leads.length) * 100) : 0;
  const nextActions = workspace.leads
    .filter((lead) => lead.bookingStatus === "cancellation_observed" || lead.overdue || lead.status === "new")
    .sort((a, b) => Number(b.bookingStatus === "cancellation_observed") - Number(a.bookingStatus === "cancellation_observed"))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageIntro
        title="Recover the revenue already trying to reach you."
        description="Capture website, social, phone, referral, booking, cancellation, and reactivation signals in one tenant-bound pipeline. Every workflow state remains attached to an audited lead timeline. Collected revenue requires separate payment evidence."
        aside={<><Badge tone="violet">Revenue recovery</Badge><Badge tone="amber">Human follow-up control</Badge></>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard accent="sky" detail="New and active pipeline" icon={<UserRoundPlus className="size-4" />} label="Open leads" value={String(workspace.metrics.openLeads)} />
        <StatCard accent="amber" detail="Due today or overdue" icon={<Clock3 className="size-4" />} label="Follow-ups due" value={String(workspace.metrics.followUpsDue)} />
        <StatCard accent="teal" detail="Estimated opportunity on booked/completed leads, excluding cancellation review; not collected revenue" icon={<CircleDollarSign className="size-4" />} label="Booked estimate" value={`$${Math.round(workspace.metrics.bookedEstimatedCents / 100).toLocaleString()}`} />
        <StatCard accent="amber" detail="Estimated opportunity with a cancellation observation awaiting human recovery review; not recovered revenue" icon={<RotateCcw className="size-4" />} label="Cancellation review" value={`$${Math.round(workspace.metrics.cancellationReviewEstimatedCents / 100).toLocaleString()}`} />
        <StatCard accent="sky" detail="Booked ÷ all captured; cancellation-observed leads do not count as booked" icon={<ArrowUpRight className="size-4" />} label="Conversion" value={`${conversionRate}%`} />
        <StatCard accent="rose" detail="Estimated opportunity explicitly marked lost; not cash" icon={<RefreshCw className="size-4" />} label="Lost estimate" value={`$${Math.round(workspace.metrics.lostEstimatedCents / 100).toLocaleString()}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-950 p-5 text-white">
            <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-violet-300">Lead capture</p>
            <h3 className="mt-3 text-xl font-extrabold tracking-[-.04em]">Put every inquiry somewhere useful.</h3>
            <p className="mt-2 text-xs leading-5 text-slate-400">Manual capture and connected acquisition adapters feed the same audited lead record instead of creating side-channel CRMs.</p>
          </div>
          <LeadCreateAction enabled={canCreate} />
          <div className="border-t border-slate-100 bg-violet-50 p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-violet-800">No lead left behind</p>
            <p className="mt-2 text-xs leading-5 text-violet-950">A booking observation, cancellation observation, or due follow-up creates visible human work. None of those signals independently proves payment or clinical eligibility.</p>
          </div>
        </Card>

        <SectionCard title="Next best actions" description="Cancellation recovery, overdue work, and new demand stay operationally visible instead of living in someone’s memory.">
          <div className="divide-y divide-slate-100">
            {nextActions.map((lead) => {
              const cancellation = lead.bookingStatus === "cancellation_observed";
              return (
                <div className="flex flex-wrap items-center gap-3 p-4" key={lead.id}>
                  <span className={`grid size-9 place-items-center rounded-xl ${cancellation || lead.overdue ? "bg-rose-50 text-rose-700" : "bg-violet-50 text-violet-700"}`}>
                    {cancellation ? <RotateCcw className="size-4" /> : lead.overdue ? <Clock3 className="size-4" /> : <MessageSquareText className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900">{nextActionTitle(lead)}</p>
                    <p className="mt-1 text-[12px] text-slate-500">{lead.serviceInterest ?? "Service interest not recorded"} · {lead.source.replaceAll("_", " ")} · {lead.estimatedValue} estimated</p>
                    {cancellation && <p className="mt-1 text-[11px] font-semibold text-amber-700">Human review required before outreach or rebooking. Not a no-show or payment failure.</p>}
                  </div>
                  <StatusBadge status={cancellation ? "Recovery review" : lead.overdue ? "Overdue" : "New"} />
                </div>
              );
            })}
            {!nextActions.length && <p className="p-5 text-xs text-slate-500">No next-best-action leads are waiting.</p>}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Lead pipeline" description="Pipeline state is operational context, not proof of booking or payment. Cancellation-observed opportunities move out of Booked and into Recovery until a human decides the next action.">
        <div className="grid gap-4 p-4 xl:grid-cols-5">
          {pipelineColumns.map((column) => {
            const columnLeads = workspace.leads.filter(column.matches);
            return (
              <div className="min-h-48 rounded-2xl bg-slate-50 p-3" key={column.key}>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-extrabold uppercase tracking-[.14em] text-slate-500">{column.label}</p>
                  <span className="grid size-6 place-items-center rounded-full bg-white text-[11px] font-extrabold text-slate-600">{columnLeads.length}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {columnLeads.map((lead) => {
                    const cancellation = lead.bookingStatus === "cancellation_observed";
                    return (
                      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={lead.id}>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-extrabold text-slate-900">{lead.name}</p>
                            <p className="mt-1 text-[12px] text-slate-400">{lead.serviceInterest ?? "Interest pending"}</p>
                          </div>
                          <StatusBadge status={lead.source} />
                        </div>
                        {cancellation && <Badge tone="amber">Cancellation observed</Badge>}
                        <p className="mt-3 text-sm font-extrabold text-violet-700">{lead.estimatedValue} <span className="text-[10px] font-semibold text-slate-400">estimated</span></p>
                        <p className="mt-1 text-[12px] text-slate-500">{lead.contactAttempts} contact attempt{lead.contactAttempts === 1 ? "" : "s"} · {lead.patient ? `Patient ${lead.patient.mrn}` : "Lead not linked to chart"}</p>
                        {lead.followUpDueAt && <p className={`mt-2 text-[12px] font-bold ${lead.overdue ? "text-rose-600" : "text-slate-400"}`}>Follow-up {new Date(lead.followUpDueAt).toLocaleDateString()}</p>}
                        {cancellation && <p className="mt-2 text-[11px] leading-5 text-amber-700">Reported cancellation awaiting human recovery review. Payment and no-show state remain separate.</p>}
                        <LeadTransitionAction enabled={canUpdate} lead={lead} />
                        <LeadMessageAction enabled={canUpdate} leadId={lead.id} />
                      </article>
                    );
                  })}
                  {!columnLeads.length && <p className="py-8 text-center text-[12px] text-slate-400">No leads here.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Follow-up queue" description="Tasks remain separate from the lead record so work can be assigned, escalated, and reported.">
          <div className="divide-y divide-slate-100">
            {workspace.tasks.map((task) => <div className="flex items-start gap-3 p-4" key={task.id}><PhoneCall className="mt-1 size-4 text-violet-600" /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{task.title}</p><p className="mt-1 text-[12px] text-slate-500">{task.details}</p></div><StatusBadge status={task.status} /></div>)}
            {!workspace.tasks.length && <p className="p-5 text-xs text-slate-500">No follow-up tasks are queued.</p>}
          </div>
        </SectionCard>
        <SectionCard title="Recent lead communications" description="SMS, email, social, phone notes, and website messages use one lead-linked communication trace.">
          <div className="divide-y divide-slate-100">
            {workspace.messages.slice(0, 12).map((message) => <div className="p-4" key={message.id}><div className="flex items-center gap-2"><Badge tone="slate">{message.channel}</Badge><StatusBadge status={message.direction} /><span className="ml-auto text-[11px] text-slate-400">{new Date(message.createdAt).toLocaleString()}</span></div><p className="mt-2 text-[12px] leading-5 text-slate-600">{message.body}</p></div>)}
            {!workspace.messages.length && <p className="p-5 text-xs text-slate-500">No lead communications have been recorded.</p>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
