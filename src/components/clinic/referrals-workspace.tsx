import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CheckCircle2, Clock3, FileWarning, Network, Route, Send, Siren, Waypoints } from "lucide-react";
import { CreateReferralControl, ReferralTransitionControl } from "@/components/clinic/referral-actions";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import { Badge } from "@/components/ui/badge";
import type { ReferralWorkspace as ReferralWorkspaceData } from "@/lib/repositories/referral-repository";

const stages = ["draft", "ready_to_send", "sent", "received", "accepted", "scheduled", "completed", "consultation_received", "closed"];

function stagePosition(status: string) {
  const index = stages.indexOf(status);
  return index < 0 ? 0 : index;
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function priorityTone(priority: string) {
  if (priority === "stat") return "rose" as const;
  if (priority === "urgent") return "amber" as const;
  return "slate" as const;
}

export function ReferralsWorkspace({
  workspace,
  canCreate,
  canUpdate,
}: {
  workspace: ReferralWorkspaceData;
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const open = workspace.referrals.filter((referral) => !["closed", "declined", "cancelled"].includes(referral.status));
  const inbound = workspace.referrals.filter((referral) => referral.direction === "inbound");
  const awaiting = workspace.referrals.filter((referral) => ["sent", "received", "accepted", "scheduled", "completed"].includes(referral.status));
  const deliveryAttention = workspace.referrals.filter((referral) => referral.deliveryStatus === "failed" || referral.deliveryStatus === "pending_manual");
  const closed = workspace.referrals.filter((referral) => referral.status === "closed");

  return <div className="space-y-6">
    <PageIntro
      title="Every referral comes home."
      description="Create the clinical order, send through a consent-bound clinic connection or a truthful manual fallback, track acceptance and scheduling, return the consultation, and close the loop on one screen."
      aside={<><Badge tone="teal">Closed-loop native</Badge><Badge tone="sky">Consent revalidated</Badge><Badge>Manual fallback preserved</Badge></>}
    />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="sky" detail={`${inbound.length} received from connected clinics`} icon={<Waypoints className="size-4" />} label="Open referrals" value={String(open.length)} />
      <StatCard accent="amber" detail="Sent through consultation return" icon={<Clock3 className="size-4" />} label="Awaiting closure" value={String(awaiting.length)} />
      <StatCard accent="rose" detail="Failed or waiting for human confirmation" icon={<FileWarning className="size-4" />} label="Delivery attention" value={String(deliveryAttention.length)} />
      <StatCard accent="teal" detail="Consultation returned and acknowledged" icon={<CheckCircle2 className="size-4" />} label="Closed loops" value={String(closed.length)} />
    </section>

    <section className="relative overflow-hidden rounded-[30px] bg-[#061722] p-6 text-white shadow-[0_30px_90px_rgba(4,21,31,.24)] sm:p-8">
      <div className="absolute -right-24 -top-28 size-80 rounded-full border-[54px] border-cyan-300/[.07]" />
      <div className="absolute -bottom-28 left-1/3 size-64 rounded-full bg-teal-400/[.08] blur-3xl" />
      <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-xl"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-200"><Network className="size-4" /> Care relay</div><h3 className="mt-4 text-2xl font-black tracking-[-.045em] sm:text-4xl">The handoff is a living care path, not a fax event.</h3><p className="mt-3 text-xs leading-6 text-slate-300">ClinicOS separates clinical status from delivery status, records the represented clinic on every action, and never labels an outside delivery complete without human confirmation.</p></div>
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:grid-cols-5 xl:max-w-3xl">{[
          ["01", "Order"], ["02", "Deliver"], ["03", "Accept"], ["04", "Consult"], ["05", "Close"],
        ].map(([number, label], index) => <div className="relative rounded-2xl border border-white/10 bg-white/[.055] px-3 py-4" key={number}><p className="text-[9px] font-black text-cyan-300">{number}</p><p className="mt-4 text-[10px] font-extrabold">{label}</p>{index < 4 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-cyan-300/70 sm:block" />}</div>)}</div>
      </div>
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <SectionCard title="Create a coordinated referral" description="The source chart, order, destination, clinical question, authorization, consent, and delivery pathway remain linked.">
        <CreateReferralControl disabled={!canCreate} destinations={workspace.destinations} facilities={workspace.facilities} patients={workspace.localPatients} />
      </SectionCard>
      <SectionCard title="Network readiness" description="Only recipients with an active treatment agreement covering demographics and referrals appear here.">
        <div className="space-y-3 p-4">{workspace.destinations.length ? workspace.destinations.map((destination) => {
          const destinationFacilities = workspace.facilities.filter((facility) => facility.organizationId === destination.id);
          return <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4" key={destination.id}><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><Network className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-950">{destination.name}</p><p className="mt-1 text-[10px] text-slate-500">{destination.clinicType} · {destinationFacilities.length} verified facilit{destinationFacilities.length === 1 ? "y" : "ies"}</p><div className="mt-2 flex flex-wrap gap-1"><Badge tone="teal">Treatment</Badge><Badge tone="sky">Demographics</Badge><Badge tone="sky">Referrals</Badge></div></div></div></div>;
        }) : <div className="rounded-2xl border border-dashed border-slate-300 p-5"><p className="text-xs font-extrabold text-slate-800">No eligible connected destination</p><p className="mt-2 text-[10px] leading-5 text-slate-500">Configure a verified relationship and data-sharing agreement, or use a clearly labeled manual, fax, or Direct fallback.</p></div>}</div>
      </SectionCard>
    </section>

    <section className="grid gap-6 2xl:grid-cols-[1.35fr_.65fr]">
      <SectionCard title="Referral command queue" description="Outbound and inbound work share one chronological, attributable care-coordination lane.">
        <div className="space-y-3 p-4">{workspace.referrals.length ? workspace.referrals.map((referral) => {
          const currentStage = stagePosition(referral.status);
          return <article className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,.04)]" key={referral.id}>
            <div className="p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${referral.direction === "inbound" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"}`}>{referral.direction === "inbound" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold tracking-[-.02em] text-slate-950">{referral.patientName}</p><Badge tone={priorityTone(referral.priority)}>{referral.priority.toUpperCase()}</Badge><StatusBadge status={titleCase(referral.status)} /></div><p className="mt-1 text-[10px] leading-5 text-slate-500">{referral.patientMrn} · {referral.specialty} · {referral.sourceOrganizationName} <ArrowRight className="mx-1 inline size-3" /> {referral.destinationName}</p></div>
                <div className="text-right"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{referral.direction}</p><p className="mt-1 text-[9px] text-slate-400">Updated {formatDistanceToNowStrict(new Date(referral.updatedAt), { addSuffix: true })}</p></div>
              </div>
              <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2"><div><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Reason</p><p className="mt-1 text-[10px] leading-5 text-slate-700">{referral.reason}</p></div><div><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Clinical question</p><p className="mt-1 text-[10px] leading-5 text-slate-700">{referral.clinicalQuestion}</p></div></div>
              <div className="mt-4 flex flex-wrap gap-2"><Badge tone={referral.deliveryStatus === "failed" ? "rose" : referral.deliveryStatus === "delivered" ? "teal" : "amber"}>Delivery: {titleCase(referral.deliveryStatus)}</Badge><Badge>{titleCase(referral.deliveryMethod)}</Badge><Badge tone={referral.authorizationStatus === "denied" ? "rose" : referral.authorizationStatus === "approved" ? "teal" : "slate"}>Auth: {titleCase(referral.authorizationStatus)}</Badge><Badge tone={referral.patientOutreachStatus === "notified" ? "teal" : "amber"}>Outreach: {titleCase(referral.patientOutreachStatus)}</Badge>{referral.appointmentAt && <Badge tone="sky">Visit {format(new Date(referral.appointmentAt), "MMM d · h:mm a")}</Badge>}</div>
              <div className="mt-4 flex gap-1">{stages.slice(0, -1).map((stage, index) => <span className={`h-1 flex-1 rounded-full ${index <= currentStage ? referral.status === "declined" ? "bg-rose-400" : "bg-teal-500" : "bg-slate-100"}`} key={stage} />)}</div>
              {referral.failureReason && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700"><Siren className="mr-1.5 inline size-3.5" />{referral.failureReason}</p>}
              {referral.specialistResponse && <p className="mt-3 rounded-xl bg-teal-50 px-3 py-2 text-[10px] leading-5 text-teal-800"><CheckCircle2 className="mr-1.5 inline size-3.5" />Consultation: {referral.specialistResponse}</p>}
              <ReferralTransitionControl disabled={!canUpdate} referral={referral} />
            </div>
          </article>;
        }) : <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300"><div className="text-center"><Route className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-xs font-extrabold text-slate-700">No referrals in this workspace</p><p className="mt-1 text-[10px] text-slate-400">Create the first coordinated referral above.</p></div></div>}</div>
      </SectionCard>

      <SectionCard title="Handoff ledger" description="Both connected clinics receive attributable lifecycle receipts after transmission.">
        <div className="divide-y divide-slate-100">{workspace.events.length ? workspace.events.slice(0, 24).map((event) => <div className="flex gap-3 px-5 py-4" key={event.id}><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">{event.eventType === "created" ? <Send className="size-3.5" /> : <Waypoints className="size-3.5" />}</span><div className="min-w-0"><p className="text-[10px] font-extrabold text-slate-800">{titleCase(event.eventType)}</p><p className="mt-1 text-[9px] leading-4 text-slate-400">{event.fromStatus ? `${titleCase(event.fromStatus)} → ` : ""}{event.toStatus ? titleCase(event.toStatus) : "Workflow updated"}</p>{event.note && <p className="mt-1 text-[9px] leading-4 text-slate-500">{event.note}</p>}<p className="mt-1 text-[9px] text-slate-400">{format(new Date(event.createdAt), "MMM d · h:mm a")} · actor {event.actorId ?? "system"}</p></div></div>) : <p className="p-5 text-xs text-slate-500">Referral events will appear here.</p>}</div>
      </SectionCard>
    </section>
  </div>;
}
