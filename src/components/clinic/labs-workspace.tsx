import { format, formatDistanceToNowStrict } from "date-fns";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, CloudCog, FileClock, FlaskConical, HeartPulse, History, LockKeyhole, Route, ShieldAlert, Sparkles, TestTube2 } from "lucide-react";
import { CorrectLabResultControl, CreateLabOrderControl, LabOrderTransitionControl, LabResultTransitionControl, LabTrendChart, ReceiveLabResultControl } from "@/components/clinic/lab-actions";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LabWorkspace as LabWorkspaceData } from "@/lib/repositories/lab-repository";

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function priorityTone(priority: string) {
  if (priority === "stat") return "rose" as const;
  if (priority === "urgent") return "amber" as const;
  return "slate" as const;
}

function deliveryTone(status: string) {
  if (status === "failed") return "rose" as const;
  if (status === "delivered") return "teal" as const;
  if (["pending_manual", "queued"].includes(status)) return "amber" as const;
  return "slate" as const;
}

export function LabsWorkspace({ workspace, canCreate, canUpdate, canSign }: { workspace: LabWorkspaceData; canCreate: boolean; canUpdate: boolean; canSign: boolean }) {
  const needsReview = workspace.results.filter((result) => result.status === "needs_review");
  const critical = workspace.results.filter((result) => result.critical && result.status === "needs_review");
  const deliveryAttention = workspace.orders.filter((order) => order.deliveryStatus === "failed" || order.deliveryStatus === "pending_manual");
  const released = workspace.results.filter((result) => result.status === "released");
  const eligibleResultOrders = workspace.orders.filter((order) => ["sent", "collected"].includes(order.status));

  return <div className="space-y-6">
    <PageIntro
      title="Results move only when a provider says so."
      description="Order, deliver, receive, review, release, notify, correct, and trend laboratory data without blurring source flags into clinical interpretation. Every transition has a human owner and an audit receipt."
      aside={<><Badge tone="teal">Provider-gated release</Badge><Badge tone="sky">Structured LOINC-ready</Badge><Badge>Manual fallback preserved</Badge></>}
    />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="rose" detail={`${critical.length} critical source flags`} icon={<ShieldAlert className="size-4" />} label="Needs provider review" value={String(needsReview.length)} />
      <StatCard accent="amber" detail="Failed or awaiting human confirmation" icon={<FileClock className="size-4" />} label="Delivery attention" value={String(deliveryAttention.length)} />
      <StatCard accent="sky" detail="Delivered and awaiting result receipt" icon={<TestTube2 className="size-4" />} label="Open result lanes" value={String(eligibleResultOrders.length)} />
      <StatCard accent="teal" detail="Reviewed and explicitly approved" icon={<CheckCircle2 className="size-4" />} label="Portal released" value={String(released.length)} />
    </section>

    <section className="relative overflow-hidden rounded-[32px] bg-[#07191f] p-6 text-white shadow-[0_35px_100px_rgba(5,28,36,.28)] sm:p-8">
      <div className="absolute -right-20 -top-28 size-80 rounded-full border-[56px] border-cyan-300/[.08]" />
      <div className="absolute -bottom-28 left-1/4 size-72 rounded-full bg-emerald-400/[.08] blur-3xl" />
      <div className="relative grid gap-8 xl:grid-cols-[.8fr_1.2fr] xl:items-end">
        <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-200"><HeartPulse className="size-4" /> Laboratory relay</div><h3 className="mt-4 max-w-lg text-3xl font-black tracking-[-.055em] sm:text-5xl">Source truth in. Human judgment stays human.</h3><p className="mt-4 max-w-xl text-xs leading-6 text-slate-300">ClinicOS structures values, preserves provenance, and surfaces abnormal or critical source flags. It does not diagnose, interpret, or silently release results.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["01", "Order", "Codes + tests"], ["02", "Deliver", "Truthful pathway"], ["03", "Review", "Provider only"], ["04", "Release", "Explicit approval"]].map(([number, title, detail], index) => <div className="relative rounded-2xl border border-white/10 bg-white/[.055] p-4" key={number}><p className="text-[9px] font-black text-cyan-300">{number}</p><p className="mt-5 text-xs font-extrabold">{title}</p><p className="mt-1 text-[9px] text-slate-400">{detail}</p>{index < 3 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-cyan-300/70 sm:block" />}</div>)}</div>
      </div>
    </section>

    <section className="grid gap-6 2xl:grid-cols-2">
      <SectionCard title="Create a laboratory order" description="Tests, chart diagnoses, provider, specimen plan, vendor, and delivery pathway remain bound to one order.">
        <CreateLabOrderControl disabled={!canCreate} integrations={workspace.integrations} patients={workspace.patients} providers={workspace.providers} />
      </SectionCard>
      <SectionCard title="Receive structured results" description="Manual entries and verified document fallbacks are held from the portal until provider review and release.">
        <ReceiveLabResultControl disabled={!canCreate} documents={workspace.sourceDocuments} integrations={workspace.integrations} orders={workspace.orders} patients={workspace.patients} />
      </SectionCard>
    </section>

    <section className="grid gap-6 2xl:grid-cols-[1.25fr_.75fr]">
      <SectionCard title="Order delivery lanes" description="Clinical status and delivery status remain separate so queued work is never mistaken for a delivered order.">
        <div className="space-y-3 p-4">{workspace.orders.length ? workspace.orders.map((order) => <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.045)]" key={order.id}>
          <div className="flex flex-wrap items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${order.priority === "stat" ? "bg-rose-50 text-rose-700" : "bg-cyan-50 text-cyan-700"}`}><FlaskConical className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold tracking-[-.02em] text-slate-950">{order.patientName}</p><Badge tone={priorityTone(order.priority)}>{order.priority.toUpperCase()}</Badge><StatusBadge status={titleCase(order.status)} /></div><p className="mt-1 text-[10px] text-slate-500">{order.patientMrn} · {order.providerName} · {order.vendor ?? "External laboratory"}</p></div><p className="text-[9px] text-slate-400">Updated {formatDistanceToNowStrict(new Date(order.updatedAt), { addSuffix: true })}</p></div>
          <div className="mt-4 flex flex-wrap gap-2">{order.tests.map((test) => <Badge key={`${order.id}-${test.name}`} tone="sky">{test.name}{test.loincCode ? ` · ${test.loincCode}` : ""}</Badge>)}{order.diagnosisCodes.map((code) => <Badge key={`${order.id}-${code}`}>{code}</Badge>)}</div>
          <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-3"><div><p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">Delivery</p><div className="mt-2"><Badge tone={deliveryTone(order.deliveryStatus)}>{titleCase(order.deliveryStatus)}</Badge></div></div><div><p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">Pathway</p><p className="mt-2 text-[10px] font-bold text-slate-700">{titleCase(order.deliveryMethod)}</p></div><div><p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">Specimen</p><p className="mt-2 text-[10px] font-bold text-slate-700">{order.specimenType ?? "Not specified"}</p></div></div>
          {order.failureReason && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700"><AlertTriangle className="mr-1.5 inline size-3.5" />{order.failureReason}</p>}
          <LabOrderTransitionControl disabled={!canUpdate} order={order} />
        </article>) : <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-slate-300"><div className="text-center"><ClipboardList className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-xs font-extrabold text-slate-700">No laboratory orders</p><p className="mt-1 text-[10px] text-slate-400">Create the first chart-bound order above.</p></div></div>}</div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard title="Interface readiness" description="Roadmap vendors remain manual until contracts, credentials, testing, and acknowledgments are approved.">
          <div className="space-y-3 p-4">{workspace.integrations.length ? workspace.integrations.map((integration) => <div className="rounded-2xl border border-slate-200 p-4" key={integration.id}><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-xl ${integration.active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}><CloudCog className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{integration.vendor}</p><p className="mt-1 text-[9px] text-slate-400">{integration.phase ?? "Roadmap"} · {integration.active ? "Adapter active" : "No live interface"}</p></div><Badge tone={integration.active ? "teal" : "slate"}>{titleCase(integration.status)}</Badge></div></div>) : <p className="p-3 text-xs text-slate-500">No laboratory adapters configured.</p>}</div>
        </SectionCard>
        <Card className="overflow-hidden border-0 bg-[#fff3dc] p-6"><LockKeyhole className="size-5 text-amber-700" /><p className="mt-5 text-xl font-black tracking-[-.035em] text-slate-950">Release is a clinical action.</p><p className="mt-3 text-xs leading-6 text-slate-600">Only a user with provider review permission can document review or approve portal release. Critical source flags open urgent human escalation; they do not produce an automated answer.</p></Card>
      </div>
    </section>

    <section className="grid gap-6 2xl:grid-cols-[1.35fr_.65fr]">
      <SectionCard title="Provider result worklist" description="Original values, source flags, provenance, review state, patient visibility, and correction history remain visible together.">
        <div className="space-y-3 p-4">{workspace.results.length ? workspace.results.map((result) => <article className={`overflow-hidden rounded-[22px] border bg-white shadow-[0_12px_34px_rgba(15,23,42,.045)] ${result.critical && result.status === "needs_review" ? "border-rose-300 ring-4 ring-rose-50" : "border-slate-200"}`} key={result.id}>
          {result.critical && result.status === "needs_review" && <div className="flex items-center gap-2 bg-rose-600 px-5 py-2 text-[9px] font-black uppercase tracking-[.15em] text-white"><ShieldAlert className="size-3.5" /> Critical source flag · immediate provider review required</div>}
          <div className="p-5"><div className="flex flex-wrap items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${result.critical ? "bg-rose-50 text-rose-700" : result.abnormal ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"}`}><Activity className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold tracking-[-.02em] text-slate-950">{result.patientName}</p><StatusBadge status={titleCase(result.status)} />{result.abnormal && <Badge tone={result.critical ? "rose" : "amber"}>{result.critical ? "Critical source flag" : "Abnormal source flag"}</Badge>}<Badge>v{result.version}</Badge></div><p className="mt-1 text-[10px] text-slate-500">{result.patientMrn} · {result.panelName} · {result.vendor ?? "Unknown source"}</p><p className="mt-1 text-[9px] text-slate-400">{result.resultedAt ? format(new Date(result.resultedAt), "MMM d, yyyy · h:mm a") : "Result time unavailable"} · {titleCase(result.sourceType)} · {result.orderingProviderName}</p></div><div className="flex flex-col items-end gap-1"><Badge tone={result.patientVisible ? "teal" : "slate"}>{result.patientVisible ? "Portal visible" : "Portal held"}</Badge><span className="text-[9px] text-slate-400">{titleCase(result.patientNotificationStatus)}</span></div></div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{result.items.map((item) => <div className={`rounded-2xl p-3 ${item.critical ? "bg-rose-50 ring-1 ring-inset ring-rose-200" : item.abnormalFlag && item.abnormalFlag !== "normal" ? "bg-amber-50 ring-1 ring-inset ring-amber-100" : "bg-slate-50"}`} key={item.id}><div className="flex items-start justify-between gap-2"><div><p className="text-[9px] font-extrabold text-slate-700">{item.name}</p><p className="mt-0.5 text-[8px] text-slate-400">{item.loincCode ?? "LOINC not mapped"}</p></div>{item.abnormalFlag && <Badge tone={item.critical ? "rose" : item.abnormalFlag === "normal" ? "teal" : "amber"}>{titleCase(item.abnormalFlag)}</Badge>}</div><p className="mt-3 text-lg font-black tracking-[-.03em] text-slate-950">{item.value} <span className="text-[9px] font-bold text-slate-400">{item.unit}</span></p><p className="mt-1 text-[9px] text-slate-400">Reference {item.referenceRange ?? "not supplied"}</p></div>)}</div>
            {result.reviewComments && <div className="mt-4 rounded-2xl bg-teal-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.13em] text-teal-700">Provider review</p><p className="mt-2 text-[10px] leading-5 text-teal-900">{result.reviewComments}</p></div>}
            {result.correctionReason && <div className="mt-4 rounded-2xl bg-amber-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.13em] text-amber-700">Correction provenance</p><p className="mt-2 text-[10px] leading-5 text-amber-900">{result.correctionReason}</p></div>}
            <LabResultTransitionControl canSign={canSign} disabled={!canUpdate} result={result} />
            <CorrectLabResultControl canSign={canSign} result={result} />
          </div>
        </article>) : <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-slate-300"><div className="text-center"><FlaskConical className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-xs font-extrabold text-slate-700">No results received</p><p className="mt-1 text-[10px] text-slate-400">Structured results will appear here for provider review.</p></div></div>}</div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard title="Longitudinal trends" description="Numeric values are graphed only when source units and structured numbers are available.">
          <div className="p-5">{workspace.trends[0] ? <LabTrendChart trend={workspace.trends[0]} /> : <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-slate-300"><div className="text-center"><Sparkles className="mx-auto size-5 text-slate-300" /><p className="mt-2 text-[10px] font-bold text-slate-600">Two matching numeric values create a trend.</p></div></div>}</div>
        </SectionCard>
        <SectionCard title="Laboratory ledger" description="Order, delivery, result, review, release, correction, and notification actions are append-only events.">
          <div className="divide-y divide-slate-100">{workspace.events.length ? workspace.events.slice(0, 24).map((event) => <div className="flex gap-3 px-5 py-4" key={event.id}><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><History className="size-3.5" /></span><div className="min-w-0"><p className="text-[10px] font-extrabold text-slate-800">{titleCase(event.eventType)}</p><p className="mt-1 text-[9px] leading-4 text-slate-400">{event.fromStatus ? `${titleCase(event.fromStatus)} → ` : ""}{event.toStatus ? titleCase(event.toStatus) : "Workflow recorded"}</p>{event.note && <p className="mt-1 text-[9px] leading-4 text-slate-500">{event.note}</p>}<p className="mt-1 text-[9px] text-slate-400">{format(new Date(event.createdAt), "MMM d · h:mm a")} · actor {event.actorId ?? "system"}</p></div></div>) : <p className="p-5 text-xs text-slate-500">Laboratory events will appear here.</p>}</div>
        </SectionCard>
      </div>
    </section>

    <section className="rounded-[26px] border border-dashed border-cyan-300 bg-cyan-50/50 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cyan-600 text-white"><Route className="size-5" /></span><div><p className="text-xs font-extrabold text-slate-950">HL7 v2 and FHIR adapter contract is visible, not falsely live.</p><p className="mt-1 text-[10px] leading-5 text-slate-600">Integration events retain vendor, direction, status, acknowledgment, retry, and error state. Until a tested adapter is active, staff use the manual, print, fax, document, and structured-entry fallbacks above.</p></div></div></section>
  </div>;
}
