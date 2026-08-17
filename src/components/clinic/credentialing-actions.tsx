"use client";

import { useState } from "react";
import { BadgeCheck, Check, LoaderCircle, Plus, Search, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OigLeieScreening } from "@/components/clinic/oig-leie-screening";
import type { CredentialingWorkspace } from "@/lib/repositories/credentialing-repository";

const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50";
const textAreaClass = "min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50";

type NppesEvidence = {
  source: "CMS NPPES";
  sourceVersion: string;
  npi: string;
  enumerationType: string | null;
  status: string | null;
  name: string;
  credential: string | null;
  lastUpdated: string | null;
  enumerationDate: string | null;
  taxonomies: Array<{ code: string | null; description: string | null; primary: boolean; state: string | null; license: string | null }>;
  authorityNotice: string;
};

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Credentialing action failed.");
}

export function NppesLookupAction({ npi, providerName }: { npi: string | null; providerName: string }) {
  const [busy, setBusy] = useState(false);
  const [evidence, setEvidence] = useState<NppesEvidence | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!npi || busy) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/provider-network/nppes/${encodeURIComponent(npi)}`, { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "CMS NPPES lookup failed.");
      setEvidence(payload?.data ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "CMS NPPES lookup failed.");
    } finally { setBusy(false); }
  }

  if (!npi) return <p className="mt-3 text-[10px] text-slate-400">Add the provider NPI before checking the free federal public registries.</p>;
  return <div className="mt-3 space-y-2">
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-500">Free public NPI evidence</p><p className="mt-1 text-[10px] text-slate-400">CMS NPPES · {providerName}</p></div>
        <Button disabled={busy} onClick={lookup} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Search className="size-3.5" />} Check NPPES</Button>
      </div>
      {evidence === null && <p className="mt-3 text-[10px] font-bold text-amber-700">No NPPES record was returned for NPI {npi}.</p>}
      {evidence && <div className="mt-3 space-y-2 text-[10px] leading-5 text-slate-600"><p><strong>{evidence.name}</strong> · NPI {evidence.npi} · {evidence.status ?? "status not supplied"}</p>{evidence.taxonomies.length > 0 && <p>{evidence.taxonomies.slice(0, 3).map((taxonomy) => `${taxonomy.primary ? "Primary: " : ""}${taxonomy.code ?? "taxonomy"}${taxonomy.description ? ` ${taxonomy.description}` : ""}`).join(" · ")}</p>}<p className="text-amber-800">{evidence.authorityNotice}</p></div>}
      {error && <p className="mt-3 text-[10px] font-bold text-rose-600" role="alert">{error}</p>}
    </div>
    <OigLeieScreening npi={npi} />
  </div>;
}

export function CredentialCreateAction({ providers, enabled }: { providers: CredentialingWorkspace["providers"]; enabled: boolean }) {
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [type, setType] = useState("STATE_LICENSE");
  const [number, setNumber] = useState("DEMO-NY-LICENSE");
  const [state, setState] = useState("NY");
  const [expiresAt, setExpiresAt] = useState("");
  const [source, setSource] = useState("Manual primary-source review queue");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post("/api/provider-network/credentials", { providerId, type, number, state: state || null, expiresAt: expiresAt ? `${expiresAt}T00:00:00.000Z` : null, verificationSource: source || null }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Credential creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Your role can review credentials but cannot add credential records.</p>;
  return <div className="space-y-3 p-5"><select aria-label="Credential provider" className={selectClass} onChange={(event) => setProviderId(event.target.value)} value={providerId}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}, {provider.credential}</option>)}</select><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Credential type" onChange={(event) => setType(event.target.value)} placeholder="Credential type" value={type} /><Input aria-label="Credential number" onChange={(event) => setNumber(event.target.value)} placeholder="Credential number" value={number} /></div><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Credential state" onChange={(event) => setState(event.target.value)} placeholder="State" value={state} /><Input aria-label="Credential expiration" onChange={(event) => setExpiresAt(event.target.value)} type="date" value={expiresAt} /></div><Input aria-label="Verification source" onChange={(event) => setSource(event.target.value)} placeholder="Verification source" value={source} /><Button disabled={busy || !providerId || number.trim().length < 2} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add credential for review</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function CredentialTransitionAction({ credentialId, verificationStatus, canManage }: { credentialId: string; verificationStatus: string; canManage: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function transition(action: "verify" | "reject" | "exception" | "request_verification") {
    setBusy(true); setError(null);
    try { await post(`/api/provider-network/credentials/${credentialId}/transition`, { action, note: `Human credentialing review recorded: ${action}.`, verificationSource: "ClinicOS manual evidence workflow", ...(action === "exception" ? { exceptionReason: "Evidence requires a documented exception review before approval." } : {}) }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Credential transition failed."); }
    finally { setBusy(false); }
  }
  if (verificationStatus === "verified") return <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-700"><BadgeCheck className="size-3.5" /> Primary source recorded</span>;
  return <div className="mt-3 flex flex-wrap items-center gap-2">{canManage && <Button disabled={busy} onClick={() => transition("verify")} size="sm" variant="secondary"><Check className="size-3.5" /> Verify</Button>}{canManage && <Button disabled={busy} onClick={() => transition("exception")} size="sm" variant="ghost"><ShieldAlert className="size-3.5" /> Exception</Button>}{canManage && <Button disabled={busy} onClick={() => transition("reject")} size="sm" variant="ghost"><X className="size-3.5" /> Reject</Button>}{!canManage && <Button disabled={busy} onClick={() => transition("request_verification")} size="sm" variant="secondary">Request review</Button>}{error && <p className="basis-full text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function FacilityPrivilegeCreateAction({ providers, facilities, enabled }: { providers: CredentialingWorkspace["providers"]; facilities: CredentialingWorkspace["facilities"]; enabled: boolean }) {
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? "");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("Manual privilege evidence is required before activation.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post("/api/provider-network/credentials", { kind: "facility_privilege", providerId, facilityId, expiresAt: expiresAt ? `${expiresAt}T00:00:00.000Z` : null, notes }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Privilege creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Facility privileges are restricted to credentialing administrators.</p>;
  return <div className="space-y-3 p-5"><div className="grid gap-3 sm:grid-cols-2"><select aria-label="Privilege provider" className={selectClass} onChange={(event) => setProviderId(event.target.value)} value={providerId}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}, {provider.credential}</option>)}</select><select aria-label="Privilege facility" className={selectClass} onChange={(event) => setFacilityId(event.target.value)} value={facilityId}>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name} · {facility.type}</option>)}</select></div><Input aria-label="Privilege expiration" onChange={(event) => setExpiresAt(event.target.value)} type="date" value={expiresAt} /><textarea aria-label="Privilege notes" className={textAreaClass} onChange={(event) => setNotes(event.target.value)} value={notes} /><Button disabled={busy || !providerId || !facilityId || notes.trim().length < 12} onClick={submit} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add facility privilege</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function FacilityPrivilegeTransitionAction({ privilegeId, status, enabled }: { privilegeId: string; status: string; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function transition(action: "grant" | "suspend" | "expire") {
    setBusy(true); setError(null);
    try { await post(`/api/provider-network/privileges/${privilegeId}/transition`, { action, note: `Human facility privilege review recorded: ${action}.`, verificationSource: "Manual facility privilege evidence" }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Privilege transition failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{status !== "active" && <Button disabled={busy} onClick={() => transition("grant")} size="sm" variant="secondary"><Check className="size-3.5" /> Grant</Button>}{status === "active" && <Button disabled={busy} onClick={() => transition("suspend")} size="sm" variant="ghost"><ShieldAlert className="size-3.5" /> Suspend</Button>}<Button disabled={busy} onClick={() => transition("expire")} size="sm" variant="ghost">Expire</Button>{error && <p className="basis-full text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}