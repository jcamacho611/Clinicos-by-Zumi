import { format, formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, Aperture, ArrowRight, Building2, CalendarCheck2, CheckCircle2, CloudCog, FileCheck2, FileClock, History, Image as ImageIcon, LockKeyhole, RadioTower, ScanLine, ShieldAlert, Sparkles } from "lucide-react";
import { CorrectImagingResultControl, CreateImagingOrderControl, ImagingOrderTransitionControl, ImagingResultTransitionControl, ReceiveImagingResultControl } from "@/components/clinic/imaging-actions";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ImagingWorkspace as ImagingWorkspaceData } from "@/lib/repositories/imaging-repository";

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function priorityTone(priority: string) {
  if (priority === "stat") return "rose" as const;
  if (priority === "urgent") return "amber" as const;
  return "slate" as const;
}

export function ImagingWorkspace({ workspace, canCreate, canUpdate, canSign }: { workspace: ImagingWorkspaceData; canCreate: boolean; canUpdate: boolean; canSign: boolean }) {
  const needsReview = workspace.results.filter((result) => result.status === "needs_review");
  const urgent = needsReview.filter((result) => result.urgentSourceFlag);
  const pendingStudies = workspace.orders.filter((order) => !["report_received", "cancelled"].includes(order.status));
  const deliveryAttention = workspace.orders.filter((order) => ["failed", "pending_manual"].includes(order.deliveryStatus));
  const released = workspace.results.filter((result) => result.status === "released");

  return <div className="space-y-6">
    <PageIntro
      title="See the whole imaging journey. Never guess the handoff."
      description="Clinical indication, authorization, facility delivery, appointment state, source report, provider review, portal release, correction, and follow-up stay in one traceable radiology lane."
      aside={<><Badge tone="sky">Provider-gated release</Badge><Badge tone="amber">Authorization aware</Badge><Badge>Manual fallback always visible</Badge></>}
    />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="rose" detail={`${urgent.length} urgent source flags`} icon={<ShieldAlert className="size-4" />} label="Reports to review" value={String(needsReview.length)} />
      <StatCard accent="sky" detail="Sent, scheduled, or awaiting reports" icon={<ScanLine className="size-4" />} label="Open studies" value={String(pendingStudies.length)} />
      <StatCard accent="amber" detail="Failed or awaiting human confirmation" icon={<FileClock className="size-4" />} label="Delivery attention" value={String(deliveryAttention.length)} />
      <StatCard accent="teal" detail="Reviewed and explicitly approved" icon={<CheckCircle2 className="size-4" />} label="Portal released" value={String(released.length)} />
    </section>

    <section className="relative isolate overflow-hidden rounded-[34px] bg-[#071334] p-6 text-white shadow-[0_38px_110px_rgba(30,64,175,.3)] sm:p-8">
      <div className="absolute -right-24 -top-24 size-[360px] rounded-full border-[1px] border-blue-300/20 shadow-[0_0_90px_rgba(59,130,246,.28)]" />
      <div className="absolute -right-5 -top-4 size-52 rounded-full border-[38px] border-indigo-400/[.08]" />
      <div className="absolute -bottom-32 left-1/4 size-96 rounded-full bg-blue-500/[.12] blur-3xl" />
      <div className="relative grid gap-10 xl:grid-cols-[.85fr_1.15fr] xl:items-end">
        <div><div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[.23em] text-blue-200"><Aperture className="size-4" /> Radiology command lane</div><h3 className="mt-5 max-w-xl text-3xl font-black tracking-[-.06em] sm:text-5xl">Every image leaves a care signal. Every signal gets an owner.</h3><p className="mt-4 max-w-xl text-xs leading-6 text-blue-100/65">ClinicOS preserves source findings and impressions without turning them into an automated diagnosis. Urgent source flags stop routine flow and summon a human.</p></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["01", "Authorize", "Coverage gate"], ["02", "Transmit", "Confirmed path"], ["03", "Review", "Provider identity"], ["04", "Release", "Portal consent"]].map(([number, label, detail], index) => <div className="relative overflow-hidden rounded-2xl border border-blue-300/15 bg-white/[.055] p-4" key={number}><div className="absolute right-3 top-3 size-8 rounded-full border border-blue-300/15" /><p className="text-[11px] font-black text-blue-300">{number}</p><p className="mt-8 text-xs font-extrabold">{label}</p><p className="mt-1 text-[11px] text-blue-100/45">{detail}</p>{index < 3 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-blue-300 sm:block" />}</div>)}</div>
      </div>
    </section>

    <section className="grid gap-6 2xl:grid-cols-2">
      <SectionCard title="Create a chart-bound imaging order" description="The selected provider, chart diagnosis, indication, authorization record, facility, and delivery pathway are validated before the order can move.">
        <CreateImagingOrderControl disabled={!canCreate} integrations={workspace.integrations} patients={workspace.patients} priorAuthorizations={workspace.priorAuthorizations} providers={workspace.providers} />
      </SectionCard>
      <SectionCard title="Receive a source radiology report" description="PDF, structured manual, and verified adapter pathways all remain held from the patient portal until an active provider reviews and releases them.">
        <ReceiveImagingResultControl disabled={!canCreate} documents={workspace.sourceDocuments} integrations={workspace.integrations} orders={workspace.orders} patients={workspace.patients} />
      </SectionCard>
    </section>

    <section className="grid gap-6 2xl:grid-cols-[1.25fr_.75fr]">
      <SectionCard title="Order and facility lanes" description="Authorization, delivery, appointment, and report status remain separate so a queued order is never mistaken for a completed handoff.">
        <div className="space-y-3 p-4">{workspace.orders.length ? workspace.orders.map((order) => <article className="overflow-hidden rounded-[24px] border border-indigo-100 bg-white shadow-[0_16px_40px_rgba(30,64,175,.06)]" key={order.id}>
          <div className="h-1 bg-gradient-to-r from-blue-700 via-indigo-500 to-cyan-300" />
          <div className="p-5"><div className="flex flex-wrap items-start gap-3"><span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${order.priority === "stat" ? "bg-rose-600 text-white" : "bg-indigo-50 text-indigo-700"}`}><ScanLine className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold tracking-[-.025em] text-slate-950">{order.patientName}</p><Badge tone={priorityTone(order.priority)}>{order.priority.toUpperCase()}</Badge><StatusBadge status={titleCase(order.status)} /></div><p className="mt-1 text-[12px] text-slate-500">{order.patientMrn} · {order.providerName}</p><p className="mt-1 text-[12px] font-bold text-indigo-700">{order.study} · {titleCase(order.modality)} · {order.bodyPart}{order.laterality ? ` · ${titleCase(order.laterality)}` : ""}</p></div><p className="text-[11px] text-slate-400">Updated {formatDistanceToNowStrict(new Date(order.updatedAt), { addSuffix: true })}</p></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><OrderFact label="Facility" value={order.facility ?? "Not selected"} /><OrderFact label="Authorization" value={titleCase(order.authorizationStatus)} alert={!['approved', 'not_required'].includes(order.authorizationStatus)} /><OrderFact label="Delivery" value={`${titleCase(order.deliveryMethod)} · ${titleCase(order.deliveryStatus)}`} alert={order.deliveryStatus === "failed"} /><OrderFact label="Appointment" value={titleCase(order.appointmentStatus)} /></div>
            <div className="mt-4 flex flex-wrap gap-2">{order.diagnosisCodes.map((code) => <Badge key={`${order.id}-${code}`}>{code}</Badge>)}<Badge tone="sky">{order.clinicalIndication}</Badge></div>
            {order.failureReason && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-700"><AlertTriangle className="mr-1.5 inline size-3.5" />{order.failureReason}</p>}
            <ImagingOrderTransitionControl disabled={!canUpdate} order={order} />
          </div>
        </article>) : <EmptyState icon={<ScanLine className="size-6" />} title="No imaging orders" detail="Create the first chart-bound study above." />}</div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard title="Facility connectivity" description="Only active and tested adapters can be selected for electronic work. Roadmap vendors retain manual, print, fax, and Direct fallbacks.">
          <div className="space-y-3 p-4">{workspace.integrations.length ? workspace.integrations.map((integration) => <div className="rounded-2xl border border-indigo-100 bg-indigo-50/35 p-4" key={integration.id}><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-xl ${integration.active ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"}`}><CloudCog className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{integration.vendor}</p><p className="mt-1 text-[11px] text-slate-400">{integration.phase ?? "Roadmap"} · {integration.active ? "Adapter enabled" : "No live interface"}</p></div><Badge tone={integration.active ? "teal" : "slate"}>{titleCase(integration.status)}</Badge></div></div>) : <p className="p-3 text-xs text-slate-500">No imaging adapters configured.</p>}</div>
        </SectionCard>
        <Card className="border-0 bg-[#e8edff] p-6"><LockKeyhole className="size-5 text-indigo-700" /><p className="mt-5 text-xl font-black tracking-[-.04em] text-slate-950">A report is not a release.</p><p className="mt-3 text-xs leading-6 text-slate-600">Receipt creates provider work. Review documents human assessment of the source report. Release is a second provider-gated action that controls portal visibility.</p></Card>
      </div>
    </section>

    <section className="grid gap-6 2xl:grid-cols-[1.35fr_.65fr]">
      <SectionCard title="Source report lightbox" description="Source findings, impressions, provenance, review state, patient visibility, and correction lineage remain together.">
        <div className="space-y-4 p-4">{workspace.results.length ? workspace.results.map((result) => <article className={`relative overflow-hidden rounded-[26px] border bg-white shadow-[0_18px_44px_rgba(30,64,175,.07)] ${result.urgentSourceFlag && result.status === "needs_review" ? "border-rose-300 ring-4 ring-rose-50" : "border-indigo-100"}`} key={result.id}>
          {result.urgentSourceFlag && result.status === "needs_review" && <div className="flex items-center gap-2 bg-rose-600 px-5 py-2 text-[11px] font-black uppercase tracking-[.15em] text-white"><ShieldAlert className="size-3.5" /> Urgent flag from source · immediate human review required</div>}
          <div className="grid lg:grid-cols-[180px_1fr]"><div className="relative grid min-h-44 place-items-center overflow-hidden bg-[#06102d] text-blue-200"><div className="absolute size-32 rounded-full border border-blue-300/20" /><div className="absolute size-24 rounded-full border-[12px] border-blue-400/[.08]" /><Aperture className="relative size-12" /><span className="absolute bottom-4 left-4 text-[11px] font-black uppercase tracking-[.18em] text-blue-300/60">{titleCase(result.modality)} · source</span></div><div className="p-5"><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold tracking-[-.025em] text-slate-950">{result.patientName}</p><StatusBadge status={titleCase(result.status)} /><Badge>v{result.version}</Badge>{result.correctionOfId && <Badge tone="amber">Correction</Badge>}</div><p className="mt-1 text-[12px] text-slate-500">{result.patientMrn} · {result.reportTitle}</p><p className="mt-1 text-[11px] text-slate-400">{result.studyPerformedAt ? format(new Date(result.studyPerformedAt), "MMM d, yyyy · h:mm a") : "Study time unavailable"} · {result.facility ?? "Unknown source"} · {titleCase(result.sourceType)}</p></div><div className="flex flex-col items-end gap-1"><Badge tone={result.patientVisible ? "teal" : "slate"}>{result.patientVisible ? "Portal visible" : "Portal held"}</Badge><span className="text-[11px] text-slate-400">{titleCase(result.patientNotificationStatus)}</span></div></div>
              <div className="mt-4 grid gap-3 xl:grid-cols-2"><ReportText label="Source findings" value={result.findings} /><ReportText label="Source impression" value={result.impression} /></div>
              <div className="mt-3 flex flex-wrap gap-2"><Badge tone="sky">{result.orderingProviderName}</Badge>{result.sourceReference && <Badge>{result.sourceReference}</Badge>}{result.imageReference && <Badge tone="sky">Image reference retained</Badge>}</div>
              {result.reviewComments && <div className="mt-4 rounded-2xl bg-emerald-50 p-4"><p className="text-[11px] font-black uppercase tracking-[.13em] text-emerald-700">Provider review note</p><p className="mt-2 text-[12px] leading-5 text-emerald-950">{result.reviewComments}</p></div>}
              {result.correctionReason && <div className="mt-4 rounded-2xl bg-amber-50 p-4"><p className="text-[11px] font-black uppercase tracking-[.13em] text-amber-700">Correction provenance</p><p className="mt-2 text-[12px] leading-5 text-amber-950">{result.correctionReason}</p></div>}
              <ImagingResultTransitionControl canSign={canSign} disabled={!canUpdate} result={result} />
              <CorrectImagingResultControl canSign={canSign} result={result} />
            </div></div>
        </article>) : <EmptyState icon={<ImageIcon className="size-6" />} title="No source reports received" detail="Reports will appear here after organization and patient validation." />}</div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard title="Radiology ledger" description="Order, authorization, delivery, report, review, release, correction, notification, and follow-up events are append-only.">
          <div className="divide-y divide-indigo-50">{workspace.events.length ? workspace.events.slice(0, 28).map((event) => <div className="flex gap-3 px-5 py-4" key={event.id}><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><History className="size-3.5" /></span><div className="min-w-0"><p className="text-[12px] font-extrabold text-slate-800">{titleCase(event.eventType)}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{event.fromStatus ? `${titleCase(event.fromStatus)} → ` : ""}{event.toStatus ? titleCase(event.toStatus) : "Workflow recorded"}</p>{event.note && <p className="mt-1 text-[11px] leading-4 text-slate-500">{event.note}</p>}<p className="mt-1 text-[11px] text-slate-400">{format(new Date(event.createdAt), "MMM d · h:mm a")} · actor {event.actorId ?? "system"}</p></div></div>) : <p className="p-5 text-xs text-slate-500">Imaging events will appear here.</p>}</div>
        </SectionCard>
        <SectionCard title="Day-one coverage" description="The complete radiology registry stays visible even when a vendor lane is manual.">
          <div className="grid gap-2 p-4">{[[FileCheck2, "Orders + diagnosis binding"], [CalendarCheck2, "Facility appointment tracking"], [RadioTower, "HL7 / FHIR adapter contract"], [Building2, "Hospital + local facility fallback"], [Sparkles, "DICOM / PACS roadmap reference"]].map(([Icon, label]) => { const Component = Icon as typeof FileCheck2; return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3" key={String(label)}><Component className="size-4 text-indigo-700" /><p className="text-[12px] font-bold text-slate-700">{String(label)}</p></div>; })}</div>
        </SectionCard>
      </div>
    </section>

    <section className="rounded-[28px] border border-dashed border-indigo-300 bg-indigo-50/50 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-700 text-white"><RadioTower className="size-5" /></span><div><p className="text-xs font-extrabold text-slate-950">Interface readiness is visible, never overstated.</p><p className="mt-1 text-[12px] leading-5 text-slate-600">Integration events retain vendor, direction, status, acknowledgment, retry, and error state. DICOM/PACS, HL7, FHIR, hospital, RadNet-style, and local imaging connectors remain adapter-ready until contracts, credentials, test messages, and production acknowledgments are verified.</p></div></div></section>
  </div>;
}

function OrderFact({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className={`rounded-2xl p-3 ${alert ? "bg-amber-50" : "bg-slate-50"}`}><p className={`text-[11px] font-black uppercase tracking-[.13em] ${alert ? "text-amber-700" : "text-slate-400"}`}>{label}</p><p className={`mt-2 text-[12px] font-bold ${alert ? "text-amber-900" : "text-slate-700"}`}>{value}</p></div>;
}

function ReportText({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-2xl border border-indigo-100 bg-indigo-50/35 p-4"><p className="text-[11px] font-black uppercase tracking-[.15em] text-indigo-600">{label}</p><p className="mt-2 text-[12px] leading-5 text-slate-700">{value || "Not supplied by source."}</p></div>;
}

function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/20"><div className="text-center text-indigo-300">{icon}<p className="mt-3 text-xs font-extrabold text-slate-700">{title}</p><p className="mt-1 text-[12px] text-slate-400">{detail}</p></div></div>;
}
