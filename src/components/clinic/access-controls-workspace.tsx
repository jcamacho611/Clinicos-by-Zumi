import { differenceInMinutes, format, formatDistanceToNowStrict } from "date-fns";
import { Clock3, Eye, FileKey2, KeyRound, LockKeyhole, Network, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BreakGlassControl, GrantControls, RecordRequestDecision } from "@/components/clinic/network-access-actions";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { NetworkAccessWorkspace } from "@/lib/repositories/network-access-repository";

function actionLabel(action: string) {
  return action.replace("network.", "").replaceAll("_", " ");
}

export function AccessControlsWorkspace({ organizationId, workspace }: { organizationId: string; workspace: NetworkAccessWorkspace }) {
  const activeGrants = workspace.grants.filter((grant) => grant.state === "active");
  const pendingInbound = workspace.requests.filter((request) => request.direction === "inbound" && request.status === "requested");
  const emergencyGrants = activeGrants.filter((grant) => grant.accessLevel === "break_glass");
  const receivedGrant = activeGrants.find((grant) => grant.direction === "received");

  return <div className="space-y-6">
    <PageIntro
      title="Proof before access. Every time."
      description="ClinicOS now enforces organization, purpose, category, time, consent, and role boundaries before a connected clinic can read a patient record. Every request, decision, read, emergency override, and revocation becomes an access receipt."
      aside={<><Badge tone="teal">Policy enforced</Badge><Badge>Minimum necessary</Badge></>}
    />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="teal" detail="Valid now, category scoped" icon={<KeyRound className="size-4" />} label="Active grants" value={String(activeGrants.length)} />
      <StatCard accent="amber" detail="Decision and reason required" icon={<FileKey2 className="size-4" />} label="Requests waiting" value={String(pendingInbound.length)} />
      <StatCard accent="rose" detail="30-minute emergency window" icon={<ShieldAlert className="size-4" />} label="Break-glass sessions" value={String(emergencyGrants.length)} />
      <StatCard accent="sky" detail="Visible in the access ledger" icon={<Eye className="size-4" />} label="Audited events" value={String(workspace.history.length)} />
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <div className="network-command relative overflow-hidden rounded-[28px] bg-[#07131f] p-6 text-white shadow-[0_28px_80px_rgba(2,12,23,.22)] sm:p-8">
        <div className="absolute -right-20 -top-24 size-72 rounded-full border-[44px] border-sky-300/10" />
        <div className="relative flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-sky-200"><LockKeyhole className="size-5" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-sky-200">Authorization chain</p><h3 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">No network membership shortcut.</h3><p className="mt-2 max-w-2xl text-xs leading-6 text-slate-300">Joining ClinicOS never opens a chart. A read succeeds only when the full policy chain remains valid at the moment of access.</p></div></div>
        <div className="relative mt-8 grid gap-3 md:grid-cols-4">{[
          ["01", "Verified connection", "The two clinics have an active relationship."],
          ["02", "Allowed purpose", "Treatment, payment, or operations is explicit."],
          ["03", "Scoped consent", "Only approved record categories are eligible."],
          ["04", "Active receipt", "Time, user, clinic, and every read are logged."],
        ].map(([number, title, detail]) => <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4" key={number}><p className="text-[9px] font-black text-sky-300">{number}</p><p className="mt-4 text-xs font-extrabold">{title}</p><p className="mt-2 text-[10px] leading-5 text-slate-400">{detail}</p></div>)}</div>
      </div>

      <SectionCard title="Consent wallets" description="Patient-selected defaults remain visible beside institutional access rules.">
        <div className="space-y-3 p-4">{workspace.wallets.length ? workspace.wallets.map((wallet) => <div className="rounded-2xl border border-slate-200 p-4" key={wallet.id}><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><UserCheck className="size-4" /></span><div className="flex-1"><p className="text-xs font-extrabold text-slate-950">{wallet.patientName}</p><p className="mt-1 text-[10px] text-slate-500">{wallet.mrn} · Emergency: {wallet.emergencyPreference?.replaceAll("_", " ") ?? "not configured"}</p></div><StatusBadge status={wallet.status} /></div></div>) : <p className="p-5 text-xs text-slate-500">No consent wallets configured.</p>}</div>
      </SectionCard>
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <SectionCard title="Record request queue" description="The source clinic must approve or deny every request with a documented reason.">
        <div className="space-y-3 p-4">{workspace.requests.length ? workspace.requests.map((request) => <div className="rounded-2xl border border-slate-200 p-4" key={request.id}>
          <div className="flex flex-wrap items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700"><Network className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-950">{request.patientName} <span className="font-medium text-slate-400">{request.mrn}</span></p><p className="mt-1 text-[10px] leading-5 text-slate-500">{request.requester} → {request.receiver} · {request.purposeOfUse}</p><div className="mt-2 flex flex-wrap gap-1">{request.dataCategories.map((category) => <Badge key={category}>{category.replaceAll("_", " ")}</Badge>)}</div></div><StatusBadge status={request.status} /></div>
          {request.direction === "inbound" && request.status === "requested" && <RecordRequestDecision requestId={request.id} />}
          {request.decisionReason && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[10px] leading-5 text-slate-600">Decision note: {request.decisionReason}</p>}
        </div>) : <p className="p-5 text-xs text-slate-500">No record requests yet.</p>}</div>
      </SectionCard>

      <SectionCard title="Access grants" description="Active, expired, and revoked access stays visible with download and print restrictions.">
        <div className="space-y-3 p-4">{workspace.grants.length ? workspace.grants.map((grant) => <div className="rounded-2xl border border-slate-200 p-4" key={grant.id}>
          <div className="flex flex-wrap items-start gap-3"><span className={`grid size-9 place-items-center rounded-xl ${grant.accessLevel === "break_glass" ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700"}`}><ShieldCheck className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-950">{grant.patientName} <span className="font-medium text-slate-400">{grant.mrn}</span></p><p className="mt-1 text-[10px] leading-5 text-slate-500">{grant.source} → {grant.grantee} · {grant.accessLevel.replaceAll("_", " ")}</p><p className="mt-1 text-[9px] text-slate-400">{grant.expiresAt ? `Expires ${formatDistanceToNowStrict(new Date(grant.expiresAt), { addSuffix: true })}` : "No expiration"} · Download {grant.downloadAllowed ? "allowed" : "blocked"} · Print {grant.printAllowed ? "allowed" : "blocked"}</p></div><StatusBadge status={grant.state} /></div>
          <GrantControls grant={grant} />
        </div>) : <p className="p-5 text-xs text-slate-500">No access grants yet.</p>}</div>
      </SectionCard>
    </section>

    <section className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <SectionCard title="Emergency controls" description="Break-glass is visible, narrow, temporary, and never silent.">
        <div className="space-y-3 p-4">{receivedGrant ? <BreakGlassControl patientId={receivedGrant.patientId} sourceOrganizationId={receivedGrant.sourceOrganizationId} /> : <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-extrabold text-slate-900">Source-clinic posture</p><p className="mt-2 text-[10px] leading-5 text-slate-500">Receiving-clinic users see the emergency activation control. This source workspace receives alerts and can revoke any active override.</p></div>}</div>
      </SectionCard>

      <SectionCard title="Patient-visible access ledger" description="Who, represented clinic, purpose, categories, time, override state, and restrictions remain attributable.">
        <div className="divide-y divide-slate-100">{workspace.history.length ? workspace.history.map((event) => {
          const metadata = (event.metadata ?? {}) as Record<string, unknown>;
          const createdAt = new Date(event.createdAt);
          return <div className="flex items-start gap-3 px-5 py-4" key={event.id}><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Clock3 className="size-3.5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold capitalize text-slate-900">{actionLabel(event.action)}</p>{metadata.emergencyAccessAlert === true && <Badge tone="rose">Emergency alert</Badge>}</div><p className="mt-1 text-[10px] leading-5 text-slate-500">Actor {event.actorId ?? "system"} · Clinic {String(metadata.representedOrganizationId ?? organizationId)} · Purpose {String(metadata.purposeOfUse ?? "record governance")}</p><p className="mt-1 text-[9px] text-slate-400">{format(createdAt, "MMM d, yyyy · h:mm a")} · {differenceInMinutes(new Date(), createdAt)} minutes ago</p></div></div>;
        }) : <p className="p-5 text-xs text-slate-500">Access activity will appear here.</p>}</div>
      </SectionCard>
    </section>
  </div>;
}
