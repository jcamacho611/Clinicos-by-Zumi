import { format, formatDistanceToNowStrict } from "date-fns";
import { Clock3, Fingerprint, GitCompareArrows, Link2, MapPinned, ScanSearch, ShieldCheck, UserRoundSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConsentCaptureControl, ConsentWithdrawControl, IdentityScanControl, MatchReviewControl, RecordLocatorControl } from "@/components/clinic/identity-actions";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import { can, type ClinicRole } from "@/lib/auth/rbac";
import type { IdentityWorkspace } from "@/lib/repositories/patient-identity-repository";

function matchedFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { matched: [] as string[], conflicts: [] as string[] };
  const record = value as Record<string, unknown>;
  return {
    matched: Array.isArray(record.matched) ? record.matched.filter((item): item is string => typeof item === "string") : [],
    conflicts: Array.isArray(record.conflicts) ? record.conflicts.filter((item): item is string => typeof item === "string") : [],
  };
}

function eventLabel(action: string) {
  return action.replace("identity.", "").replaceAll("_", " ");
}

function formatBirthDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function IdentityResolutionWorkspace({ role, workspace }: { role: ClinicRole; workspace: IdentityWorkspace }) {
  const possibleMatches = workspace.matches.filter((match) => match.status === "possible");
  const linkedPatients = workspace.patients.filter((patient) => patient.masterPatientId);
  const activeConsents = workspace.consents.filter((consent) => consent.state === "active");
  const mayScan = can(role, "identity", "create");
  const mayReview = can(role, "identity", "update");
  const mayCaptureConsent = can(role, "consents", "create");
  const mayWithdrawConsent = can(role, "consents", "update");

  return <div className="space-y-6">
    <PageIntro
      title="One person. Every source preserved."
      description="ClinicOS links authorized source charts under a master patient identity without erasing the originals. Deterministic matching creates candidates, an authorized human makes the decision, and consent remains a separate revocable control."
      action={<IdentityScanControl disabled={!mayScan} />}
      aside={<><Badge tone="sky">Human-reviewed MPI</Badge><Badge tone="teal">Consent enforced</Badge></>}
    />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="amber" detail="No automatic merges" icon={<UserRoundSearch className="size-4" />} label="Possible matches" value={String(possibleMatches.length)} />
      <StatCard accent="sky" detail="Source records remain intact" icon={<Link2 className="size-4" />} label="Linked local records" value={String(linkedPatients.length)} />
      <StatCard accent="teal" detail="Recipient and category scoped" icon={<ShieldCheck className="size-4" />} label="Active consents" value={String(activeConsents.length)} />
      <StatCard accent="slate" detail="Verified relationships only" icon={<MapPinned className="size-4" />} label="Connected clinics" value={String(workspace.connections.length)} />
    </section>

    <section className="identity-command relative overflow-hidden rounded-[30px] bg-[#061720] p-6 text-white shadow-[0_30px_90px_rgba(2,18,28,.26)] sm:p-8">
      <div className="absolute -right-16 -top-16 size-64 rounded-full border-[42px] border-cyan-300/10" />
      <div className="absolute bottom-[-90px] left-[28%] size-60 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="relative grid gap-8 xl:grid-cols-[.72fr_1.28fr] xl:items-center">
        <div><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><Fingerprint className="size-5" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[.22em] text-cyan-200">Master patient index</p><p className="mt-1 text-2xl font-black tracking-[-.05em]">Identity is a link, not a destructive merge.</p></div></div><p className="mt-5 max-w-xl text-xs leading-6 text-slate-300">The locator exposes only source organization, MRN, identity status, and verified identifiers. Clinical details still require the full connected-care authorization chain.</p></div>
        <div className="grid gap-3 sm:grid-cols-4">{[
          ["01", "Detect", "Weighted demographics create review candidates."],
          ["02", "Reconcile", "Staff choose the surviving demographic values."],
          ["03", "Link", "A shared MPI key connects preserved source charts."],
          ["04", "Govern", "Consent and access grants remain independent."],
        ].map(([number, title, detail]) => <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4" key={number}><p className="text-[9px] font-black text-cyan-300">{number}</p><p className="mt-4 text-xs font-extrabold">{title}</p><p className="mt-2 text-[9px] leading-5 text-slate-400">{detail}</p></div>)}</div>
      </div>
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <SectionCard title="Identity resolution queue" description="Every match requires a reason, an accountable reviewer, and explicit reconciliation choices.">
        <div className="space-y-4 p-4">{workspace.matches.length ? workspace.matches.map((match) => {
          const signals = matchedFields(match.matchedFields);
          return <article className="rounded-2xl border border-slate-200 bg-white p-4" key={match.id}>
            <div className="flex flex-wrap items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><GitCompareArrows className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-950">{Math.round(match.confidenceScore * 100)}% identity confidence</p><p className="mt-1 text-[10px] text-slate-500">Human decision required before any link is created.</p></div><StatusBadge status={match.status.replaceAll("_", " ")} /></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[match.source, match.candidate].map((record, index) => <div className={`rounded-2xl p-4 ${index === 0 ? "bg-slate-950 text-white" : "bg-cyan-50 text-slate-950"}`} key={record.patientId}><p className={`text-[9px] font-extrabold uppercase tracking-[.16em] ${index === 0 ? "text-cyan-300" : "text-cyan-700"}`}>{index === 0 ? "Source chart" : "Candidate chart"}</p><p className="mt-3 text-sm font-extrabold">{record.name}</p><p className={`mt-1 text-[10px] ${index === 0 ? "text-slate-400" : "text-slate-500"}`}>{record.organization} · {record.mrn}</p><p className={`mt-3 text-[10px] leading-5 ${index === 0 ? "text-slate-300" : "text-slate-600"}`}>DOB {formatBirthDate(record.dateOfBirth)}<br />{record.phone ?? "No phone"}<br />{record.email ?? "No email"}</p></div>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">{signals.matched.map((field) => <Badge key={field} tone="teal">match · {field.replaceAll("_", " ")}</Badge>)}{signals.conflicts.map((field) => <Badge key={field} tone="amber">review · {field.replaceAll("_", " ")}</Badge>)}</div>
            {match.status === "possible" ? <MatchReviewControl disabled={!mayReview} matchId={match.id} /> : <div className="mt-4 rounded-xl bg-slate-50 p-3 text-[10px] leading-5 text-slate-600"><strong className="capitalize">{match.reviewAction?.replaceAll("_", " ") ?? match.status}</strong>{match.decisionReason ? ` · ${match.decisionReason}` : ""}</div>}
          </article>;
        }) : <div className="p-6 text-center"><ScanSearch className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-xs font-bold text-slate-600">No identity candidates yet.</p><p className="mt-1 text-[10px] text-slate-400">Run a deterministic scan against connected clinics.</p></div>}</div>
      </SectionCard>

      <SectionCard title="Record locator" description="Find linked source charts without exposing clinical content.">
        <div className="space-y-3 p-4">{workspace.patients.map((patient) => <div className="rounded-2xl border border-slate-200 p-4" key={patient.id}><div className="flex items-start gap-3"><span className={`grid size-9 place-items-center rounded-xl ${patient.masterPatientId ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}><Fingerprint className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-950">{patient.firstName} {patient.lastName}</p><p className="mt-1 text-[10px] text-slate-500">{patient.mrn} · {patient.identityStatus.replaceAll("_", " ")}</p><p className="mt-2 text-[9px] text-slate-400">{patient.masterPatientId ? `${patient.locatedRecordCount} source chart${patient.locatedRecordCount === 1 ? "" : "s"} located` : "No master identity assigned"}</p></div></div>{patient.masterPatientId && <RecordLocatorControl masterPatientId={patient.masterPatientId} />}</div>)}</div>
      </SectionCard>
    </section>

    <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <SectionCard title="Capture patient authorization" description="A signer receipt is scoped to one connected clinic, one purpose, selected categories, and an expiration.">
        <ConsentCaptureControl connections={workspace.connections} disabled={!mayCaptureConsent} patients={workspace.patients} />
      </SectionCard>

      <SectionCard title="Consent ledger" description="Withdrawal immediately revokes every linked ordinary access grant.">
        <div className="space-y-3 p-4">{workspace.consents.length ? workspace.consents.map((consent) => <article className="rounded-2xl border border-slate-200 p-4" key={consent.id}><div className="flex flex-wrap items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><ShieldCheck className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-950">{consent.patientName} <span className="font-medium text-slate-400">{consent.mrn}</span></p><p className="mt-1 text-[10px] leading-5 text-slate-500">To {consent.grantedToOrganization} · {consent.purposeOfUse?.replaceAll("_", " ") ?? "purpose not set"}</p><p className="mt-1 text-[9px] text-slate-400">Signed by {consent.signerName ?? "unknown signer"}{consent.expiresAt ? ` · Expires ${formatDistanceToNowStrict(new Date(consent.expiresAt), { addSuffix: true })}` : ""}</p></div><StatusBadge status={consent.state} /></div><div className="mt-3 flex flex-wrap gap-1">{consent.dataCategories.map((category) => <Badge key={category}>{category.replaceAll("_", " ")}</Badge>)}</div>{consent.state === "active" && <ConsentWithdrawControl consentId={consent.id} disabled={!mayWithdrawConsent} />}{consent.withdrawalReason && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-[10px] leading-5 text-rose-700">Withdrawal: {consent.withdrawalReason}</p>}</article>) : <p className="p-5 text-xs text-slate-500">No network-sharing consents captured.</p>}</div>
      </SectionCard>
    </section>

    <SectionCard title="Identity audit trail" description="Scans, links, separations, and locator queries remain attributable.">
      <div className="divide-y divide-slate-100">{workspace.history.length ? workspace.history.map((event) => <div className="flex items-start gap-3 px-5 py-4" key={event.id}><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Clock3 className="size-3.5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold capitalize text-slate-900">{eventLabel(event.action)}</p><p className="mt-1 text-[10px] text-slate-500">Resource {event.resourceId} · Patient {event.patientId ?? "not applicable"}</p><p className="mt-1 text-[9px] text-slate-400">{format(new Date(event.createdAt), "MMM d, yyyy · h:mm a")}</p></div></div>) : <p className="p-5 text-xs text-slate-500">Identity activity will appear here.</p>}</div>
    </SectionCard>
  </div>;
}
