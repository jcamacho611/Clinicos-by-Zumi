"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Eye, LoaderCircle, ShieldOff, Siren, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function parseResponse(response: Response) {
  const body = await response.json() as { error?: string; data?: unknown };
  if (!response.ok) throw new Error(body.error ?? "The request could not be completed.");
  return body.data;
}
export function RecordRequestDecision({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("Treatment coordination approved by an authorized reviewer.");
  const [pending, setPending] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState("");

  async function decide(decision: "approve" | "deny") {
    setPending(decision);
    setError("");
    try {
      const response = await fetch(`/api/network/record-requests/${requestId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason, expiresInDays: 30 }),
      });
      await parseResponse(response);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Review failed.");
    } finally {
      setPending(null);
    }
  }

  return <div className="mt-3 space-y-2">
    <Input aria-label="Decision reason" onChange={(event) => setReason(event.target.value)} value={reason} />
    <div className="flex flex-wrap gap-2">
      <Button disabled={pending !== null || reason.trim().length < 8} onClick={() => decide("approve")} size="sm" variant="primary">
        {pending === "approve" ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Approve 30 days
      </Button>
      <Button disabled={pending !== null || reason.trim().length < 8} onClick={() => decide("deny")} size="sm" variant="secondary">
        {pending === "deny" ? <LoaderCircle className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Deny
      </Button>
    </div>
    {error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}

export function GrantControls({ grant }: { grant: {
  id: string;
  patientId: string;
  sourceOrganizationId: string;
  purposeOfUse: string;
  dataCategories: string[];
  direction: string;
  state: string;
} }) {
  const router = useRouter();
  const [pending, setPending] = useState<"read" | "revoke" | null>(null);
  const [error, setError] = useState("");
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);

  async function openRecord() {
    setPending("read");
    setError("");
    try {
      const query = new URLSearchParams({
        sourceOrganizationId: grant.sourceOrganizationId,
        purposeOfUse: grant.purposeOfUse,
        categories: grant.dataCategories.join(","),
      });
      const response = await fetch(`/api/network/shared-patients/${grant.patientId}?${query}`);
      setRecord(await parseResponse(response) as Record<string, unknown>);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Shared record unavailable.");
    } finally {
      setPending(null);
    }
  }

  async function revoke() {
    setPending("revoke");
    setError("");
    try {
      const response = await fetch(`/api/network/grants/${grant.id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Access no longer required for care coordination." }),
      });
      await parseResponse(response);
      setRecord(null);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Revocation failed.");
    } finally {
      setPending(null);
    }
  }

  return <div className="mt-3">
    <div className="flex flex-wrap gap-2">
      {grant.direction === "received" && grant.state === "active" && <Button onClick={openRecord} size="sm" variant="primary">
        {pending === "read" ? <LoaderCircle className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />} Open scoped record
      </Button>}
      {grant.state === "active" && <Button onClick={revoke} size="sm" variant="secondary">
        {pending === "revoke" ? <LoaderCircle className="size-3.5 animate-spin" /> : <ShieldOff className="size-3.5" />} Revoke
      </Button>}
    </div>
    {error && <p className="mt-2 text-[10px] font-bold text-rose-600" role="alert">{error}</p>}
    {record && <div className="mt-3 rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
      <div className="flex items-center gap-2 text-teal-800"><Check className="size-4" /><p className="text-xs font-extrabold">Scoped record opened and audited</p></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.entries((record.data as Record<string, unknown> | undefined) ?? {}).filter(([, value]) => value !== undefined).map(([key, value]) => <div className="rounded-xl bg-white p-3" key={key}>
          <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400">{key.replace(/([A-Z])/g, " $1")}</p>
          <p className="mt-1 line-clamp-3 text-[10px] leading-5 text-slate-600">{Array.isArray(value) ? `${value.length} approved item${value.length === 1 ? "" : "s"}` : "Approved patient identity details"}</p>
        </div>)}
      </div>
      <p className="mt-3 text-[9px] text-teal-700">Download and printing remain disabled unless the grant explicitly permits them.</p>
    </div>}
  </div>;
}

export function BreakGlassControl({ sourceOrganizationId, patientId }: { sourceOrganizationId: string; patientId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function activate() {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/network/break-glass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceOrganizationId, patientId, reason }),
      });
      await parseResponse(response);
      setMessage("Emergency access active for 30 minutes. The source clinic was alerted.");
      setReason("");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Emergency access failed.");
    } finally {
      setPending(false);
    }
  }

  return <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
    <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700"><Siren className="size-4" /></span><div><p className="text-xs font-extrabold text-slate-950">Emergency break-glass</p><p className="mt-1 text-[10px] leading-5 text-slate-600">Requires a specific treatment reason. Access expires in 30 minutes, cannot be printed or downloaded, and alerts both organizations.</p></div></div>
    <textarea className="mt-3 min-h-20 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-rose-400" onChange={(event) => setReason(event.target.value)} placeholder="Describe the emergency treatment need..." value={reason} />
    <Button className="mt-2" disabled={pending || reason.trim().length < 20} onClick={activate} size="sm" variant="danger">
      {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <AlertTriangle className="size-3.5" />} Activate audited access
    </Button>
    {message && <p className="mt-2 text-[10px] font-bold text-teal-700">{message}</p>}
    {error && <p className="mt-2 text-[10px] font-bold text-rose-700" role="alert">{error}</p>}
  </div>;
}
