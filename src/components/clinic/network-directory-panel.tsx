"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity, Building2, Check, ChevronRight, CircleAlert, Database, MapPin, Network, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { NetworkDirectoryWorkspace } from "@/lib/repositories/network-directory-repository";

const PURPOSES = [
  ["treatment", "Treatment coordination"],
  ["payment", "Payment operations"],
  ["operations", "Healthcare operations"],
] as const;

function organizationState(organization: NetworkDirectoryWorkspace["organizations"][number]) {
  if (organization.isCurrent) return "current";
  return organization.connection?.status ?? "not_connected";
}

function connectionDescription(organization: NetworkDirectoryWorkspace["organizations"][number]) {
  if (organization.isCurrent) return "Your active workspace";
  if (!organization.connection) return "No relationship yet";
  if (organization.connection.status === "pending") return organization.connection.direction === "inbound" ? "Approval requested from this clinic" : "Awaiting receiving clinic approval";
  if (organization.connection.status === "suspended") return "Relationship paused; chart access remains blocked";
  return `${organization.connection.trustLevel.replaceAll("_", " ")} · ${organization.connection.allowedPurposes.join(" · ")}`;
}

function NetworkConnectionActions({ organization, canManage }: { organization: NetworkDirectoryWorkspace["organizations"][number]; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!canManage || !organization.connection || organization.connection.direction === "outbound" && organization.connection.status === "pending") return null;

  const action = organization.connection.status === "pending" ? "approve" : organization.connection.status === "active" ? "suspend" : organization.connection.status === "suspended" ? "restore" : null;
  if (!action) return null;

  async function transition() {
    const reason = window.prompt(
      action === "approve" ? "Approval reason" : action === "suspend" ? "Why is this relationship being paused?" : "Why is this relationship being restored?",
      action === "approve" ? "Verified participating clinic and approved network purposes." : "Reviewed relationship status and documented the administrative decision.",
    );
    if (!reason) return;
    setBusy(true);
    const response = await fetch(`/api/network/connections/${organization.connection?.id}/transition`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      window.alert(payload?.error ?? "The relationship could not be updated.");
      return;
    }
    router.refresh();
  }

  return <Button disabled={busy} onClick={transition} size="sm" variant={action === "suspend" ? "secondary" : "primary"}>{busy ? "Saving..." : action === "approve" ? "Approve relationship" : action === "restore" ? "Restore relationship" : "Pause relationship"}</Button>;
}

function ConnectionRequestForm({ data, canCreate }: { data: NetworkDirectoryWorkspace; canCreate: boolean }) {
  const router = useRouter();
  const [targetOrganizationId, setTargetOrganizationId] = useState("");
  const [allowedPurposes, setAllowedPurposes] = useState<string[]>(["treatment"]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!canCreate) return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600">Your role can view the directory but cannot request new clinic relationships.</div>;

  const togglePurpose = (purpose: string) => setAllowedPurposes((current) => current.includes(purpose) ? current.filter((value) => value !== purpose) : [...current, purpose]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetOrganizationId || allowedPurposes.length === 0) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/network/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetOrganizationId, allowedPurposes }),
    });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    setBusy(false);
    if (!response.ok) {
      setMessage(payload?.error ?? "The relationship request could not be created.");
      return;
    }
    setMessage("Request sent. The receiving clinic must approve before any chart access is possible.");
    setTargetOrganizationId("");
    router.refresh();
  }

  return <form className="space-y-4" onSubmit={submit}>
    <label className="block"><span className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-400">Participating clinic</span><select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400" onChange={(event) => setTargetOrganizationId(event.target.value)} value={targetOrganizationId}><option value="">Choose an organization</option>{data.organizations.filter((organization) => !organization.isCurrent && !organization.connection).map((organization) => <option key={organization.id} value={organization.id}>{organization.name} · {organization.clinicType}</option>)}</select></label>
    <fieldset><legend className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-400">Requested purposes</legend><div className="mt-2 grid gap-2">{PURPOSES.map(([value, label]) => <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-bold ${allowedPurposes.includes(value) ? "border-sky-300 bg-sky-50 text-sky-900" : "border-slate-200 text-slate-600"}`} key={value}><input checked={allowedPurposes.includes(value)} className="accent-sky-600" onChange={() => togglePurpose(value)} type="checkbox" />{label}</label>)}</div></fieldset>
    <Button className="w-full" disabled={busy || !targetOrganizationId || allowedPurposes.length === 0} type="submit" variant="primary">{busy ? "Sending request..." : "Request clinic connection"}<ChevronRight className="size-4" /></Button>
    {message && <p className="rounded-xl bg-slate-50 p-3 text-[12px] leading-5 text-slate-600">{message}</p>}
  </form>;
}

export function NetworkDirectoryPanel({ data, canCreate, canManage }: { data: NetworkDirectoryWorkspace; canCreate: boolean; canManage: boolean }) {
  const connectedCount = data.organizations.filter((organization) => organization.connection?.status === "active").length;
  const verifiedFacilities = data.organizations.flatMap((organization) => organization.facilities).filter((facility) => facility.status === "verified").length;
  const providerCount = data.organizations.reduce((count, organization) => count + organization.providers.length, 0);
  const failedEvents = data.integrationEvents.filter((event) => event.status === "failed").length;

  return <div className="space-y-6">
    <PageIntro title="The clinic network, made legible." description="Find participating organizations, verify their people and facilities, request a bounded relationship, and see interoperability failures before they become missing records." aside={<><Badge tone="sky">Directory live</Badge><Badge>Adapters stay governed</Badge></>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="sky" detail="Active relationship status" icon={<Network className="size-4" />} label="Connected clinics" value={String(connectedCount)} />
      <StatCard accent="teal" detail="Organization and facility review" icon={<ShieldCheck className="size-4" />} label="Verified facilities" value={String(verifiedFacilities)} />
      <StatCard accent="amber" detail="Provider directory records" icon={<UsersRound className="size-4" />} label="Active providers" value={String(providerCount)} />
      <StatCard accent="rose" detail={`${failedEvents} failed · retry queue visible`} icon={<CircleAlert className="size-4" />} label="Interface events" value={String(data.integrationEvents.length)} />
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
      <SectionCard title="Participating-clinic directory" description="Directory visibility is not record access. Every relationship still requires purpose, agreement, consent, role, and an access receipt.">
        <div className="divide-y divide-slate-100">{data.organizations.map((organization) => <div className="p-5" key={organization.id}>
          <div className="flex flex-wrap items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${organization.isCurrent ? "bg-slate-950 text-white" : "bg-sky-50 text-sky-700"}`}><Building2 className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold text-slate-950">{organization.name}</p><Badge tone={organization.isCurrent ? "teal" : "sky"}>{organization.isCurrent ? "Your organization" : organization.clinicType}</Badge><StatusBadge status={organizationState(organization)} /></div><p className="mt-1 text-[12px] text-slate-500">{connectionDescription(organization)}</p><div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-400"><span>{organization.locations.length} locations</span><span>·</span><span>{organization.departments.length} departments</span><span>·</span><span>{organization.facilities.length} facilities</span><span>·</span><span>{organization.providers.length} providers</span></div></div><NetworkConnectionActions canManage={canManage} organization={organization} /></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">{[[MapPin, "Locations", organization.locations.map((location) => location.name).join(" · ") || "No active locations"], [Database, "Facilities", organization.facilities.map((facility) => `${facility.name} · ${facility.specialty ?? facility.type}`).join(" · ") || "No facilities listed"], [UsersRound, "Providers", organization.providers.map((provider) => `${provider.name}, ${provider.credential}`).join(" · ") || "No active providers"]].map(([Icon, label, value]) => { const ItemIcon = Icon as typeof MapPin; return <div className="rounded-xl bg-slate-50 p-3" key={String(label)}><div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-400"><ItemIcon className="size-3.5" />{String(label)}</div><p className="mt-2 text-[12px] font-bold leading-5 text-slate-700">{String(value)}</p></div>; })}</div>
        </div>)}</div>
      </SectionCard>

      <div className="space-y-6"><SectionCard title="Request a relationship" description="The receiving organization approves its side. A request never grants chart access by itself."><div className="p-5"><ConnectionRequestForm canCreate={canCreate} data={data} /></div></SectionCard><SectionCard title="Sharing agreements" description="Agreements narrow what a connected clinic may request; they do not replace patient consent."><div className="space-y-3 p-4">{data.agreements.length ? data.agreements.map((agreement) => <div className="rounded-xl border border-slate-200 p-3" key={agreement.id}><div className="flex items-start gap-2"><Check className="mt-0.5 size-4 text-teal-600" /><div className="min-w-0"><p className="text-xs font-extrabold text-slate-900">{agreement.sourceName} → {agreement.targetName}</p><p className="mt-1 text-[12px] text-slate-500">{agreement.allowedPurposes.join(" · ")} · {agreement.dataCategories.length} categories</p></div><StatusBadge status={agreement.status} /></div></div>) : <p className="p-2 text-xs text-slate-500">No sharing agreements yet.</p>}</div></SectionCard></div>
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <SectionCard title="Interoperability control room" description="FHIR, HL7, Direct, lab, imaging, pharmacy, payer, and clearinghouse adapters remain visible with their risk and current fallback.">
        <div className="divide-y divide-slate-100">{data.integrations.map((integration) => <div className="flex flex-wrap items-center gap-3 p-4" key={integration.id}><span className={`grid size-9 place-items-center rounded-xl ${integration.status === "connected" ? "bg-teal-50 text-teal-700" : integration.status === "manual_only" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}><Activity className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{integration.vendor}</p><p className="mt-1 text-[12px] text-slate-500">{integration.type.replaceAll("_", " ")} · {integration.phase ?? "Contract not documented"} · {integration.baaRequired ? "BAA required" : "No BAA flag"}</p></div><StatusBadge status={integration.status} /><Badge tone={integration.riskLevel === "high" ? "rose" : "amber"}>{integration.riskLevel} risk</Badge></div>)}{data.integrations.length === 0 && <p className="p-5 text-xs text-slate-500">No integrations configured.</p>}</div>
      </SectionCard>
      <SectionCard title="Failed-delivery queue" description="Failures stay actionable. Retry, manual upload, fax, and Direct fallback must be recorded before an exchange is considered complete.">
        <div className="space-y-3 p-4">{data.integrationEvents.map((event) => <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3" key={event.id}><div className="flex items-start gap-2"><CircleAlert className="mt-0.5 size-4 text-rose-600" /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{event.integrationName} · {event.eventType.replaceAll("_", " ")}</p><p className="mt-1 text-[12px] leading-5 text-slate-600">{event.errorMessage ?? "Waiting for adapter acknowledgment."}</p><p className="mt-2 text-[11px] font-bold text-slate-400">{event.status} · {event.retryCount} retries · {new Date(event.occurredAt).toLocaleString()}</p></div><Badge tone={event.status === "failed" ? "rose" : "amber"}>{event.status}</Badge></div></div>)}{data.integrationEvents.length === 0 && <div className="rounded-xl bg-teal-50 p-4 text-xs font-bold text-teal-800">No failed or queued interface events.</div>}<div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 p-3 text-[12px] leading-5 text-slate-500"><RefreshCw className="size-4 shrink-0 text-slate-400" />Manual recovery is always available and must carry a delivery confirmation receipt.</div></div>
      </SectionCard>
    </section>
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-[12px] leading-5 text-sky-900"><span className="font-extrabold">Network boundary:</span> ClinicOS can show participating clinics and prepare adapter-ready exchange workflows. It does not imply FHIR, HL7, TEFCA, Carequality, Direct, hospital, lab, pharmacy, or payer connectivity until the corresponding vendor contract and acknowledgment are present.</div>
  </div>;
}
