"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, GitCompareArrows, LoaderCircle, MapPinned, RefreshCw, ShieldOff, UserRoundCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function parseResponse<T>(response: Response) {
  const body = await response.json() as { error?: string; data?: T };
  if (!response.ok) throw new Error(body.error ?? "The request could not be completed.");
  return body.data as T;
}

export function IdentityScanControl({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function scan() {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await parseResponse<{ candidatesFound: number; connectedOrganizationCount: number }>(await fetch("/api/identity/matches", { method: "POST" }));
      setMessage(`${result.candidatesFound} candidate${result.candidatesFound === 1 ? "" : "s"} across ${result.connectedOrganizationCount} connected clinic${result.connectedOrganizationCount === 1 ? "" : "s"}.`);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Identity scan failed.");
    } finally {
      setPending(false);
    }
  }

  return <div className="flex flex-wrap items-center gap-2">
    <Button disabled={disabled || pending} onClick={scan} size="sm" variant="primary">
      {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Scan connected records
    </Button>
    {message && <p className="text-[12px] font-bold text-teal-700" role="status">{message}</p>}
    {error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}

const resolutionFields = ["firstName", "lastName", "preferredName", "phone", "email", "pronouns"] as const;

export function MatchReviewControl({ matchId, disabled = false }: { matchId: string; disabled?: boolean }) {
  const router = useRouter();
  const [reason, setReason] = useState("Verified demographic overlap and source records reviewed by authorized staff.");
  const [resolutions, setResolutions] = useState<Record<string, "source" | "candidate">>({});
  const [pending, setPending] = useState<"confirm_match" | "not_match" | null>(null);
  const [error, setError] = useState("");

  async function review(action: "confirm_match" | "not_match") {
    setPending(action);
    setError("");
    try {
      await parseResponse(await fetch(`/api/identity/matches/${matchId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, fieldResolutions: resolutions }),
      }));
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Identity review failed.");
    } finally {
      setPending(null);
    }
  }

  return <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
    <div className="grid gap-2 sm:grid-cols-3">
      {resolutionFields.map((field) => <label className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-400" key={field}>
        {field.replace(/([A-Z])/g, " $1")}
        <select
          className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-semibold normal-case tracking-normal text-slate-700 outline-none focus:border-sky-400"
          onChange={(event) => setResolutions((current) => ({ ...current, [field]: event.target.value as "source" | "candidate" }))}
          value={resolutions[field] ?? "source"}
        >
          <option value="source">Keep source</option>
          <option value="candidate">Use candidate</option>
        </select>
      </label>)}
    </div>
    <Input aria-label="Identity review reason" onChange={(event) => setReason(event.target.value)} value={reason} />
    <div className="flex flex-wrap gap-2">
      <Button disabled={disabled || pending !== null || reason.trim().length < 12} onClick={() => review("confirm_match")} size="sm" variant="primary">
        {pending === "confirm_match" ? <LoaderCircle className="size-3.5 animate-spin" /> : <GitCompareArrows className="size-3.5" />} Link records
      </Button>
      <Button disabled={disabled || pending !== null || reason.trim().length < 12} onClick={() => review("not_match")} size="sm" variant="secondary">
        {pending === "not_match" ? <LoaderCircle className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Not the same person
      </Button>
    </div>
    {error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}

const categories = [
  "demographics", "allergies", "medications", "problems", "approved_visit_summary",
  "labs", "imaging", "referrals", "care_plans", "immunizations",
] as const;

export function ConsentCaptureControl({
  patients,
  connections,
  disabled = false,
}: {
  patients: { id: string; firstName: string; lastName: string; mrn: string }[];
  connections: { organizationId: string; organizationName: string }[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [organizationId, setOrganizationId] = useState(connections[0]?.organizationId ?? "");
  const [purpose, setPurpose] = useState("treatment");
  const [selected, setSelected] = useState<string[]>(["demographics", "allergies", "medications", "approved_visit_summary"]);
  const [signerName, setSignerName] = useState("");
  const [relationship, setRelationship] = useState("self");
  const [expiresInDays, setExpiresInDays] = useState(180);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(category: string) {
    setSelected((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  async function capture() {
    setPending(true);
    setError("");
    try {
      await parseResponse(await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          type: "network_sharing",
          purposeOfUse: purpose,
          dataCategories: selected,
          grantedToOrganizationId: organizationId,
          signerName,
          signerRelationship: relationship,
          expiresInDays,
          sensitiveRestrictions: {},
        }),
      }));
      setSignerName("");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Consent capture failed.");
    } finally {
      setPending(false);
    }
  }

  const unavailable = disabled || !patientId || !organizationId || !signerName.trim() || !selected.length;
  return <div className="space-y-4 p-5">
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-[12px] font-bold text-slate-600">Patient
        <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-sky-400" onChange={(event) => setPatientId(event.target.value)} value={patientId}>
          {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.mrn}</option>)}
        </select>
      </label>
      <label className="text-[12px] font-bold text-slate-600">Recipient clinic
        <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-sky-400" onChange={(event) => setOrganizationId(event.target.value)} value={organizationId}>
          {connections.map((connection) => <option key={connection.organizationId} value={connection.organizationId}>{connection.organizationName}</option>)}
        </select>
      </label>
      <label className="text-[12px] font-bold text-slate-600">Purpose of use
        <select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-sky-400" onChange={(event) => setPurpose(event.target.value)} value={purpose}>
          <option value="treatment">Treatment</option><option value="payment">Payment</option><option value="operations">Healthcare operations</option>
        </select>
      </label>
      <label className="text-[12px] font-bold text-slate-600">Expires in days
        <Input max={365} min={1} onChange={(event) => setExpiresInDays(Number(event.target.value))} type="number" value={expiresInDays} />
      </label>
      <label className="text-[12px] font-bold text-slate-600">Signer name
        <Input onChange={(event) => setSignerName(event.target.value)} placeholder="Patient or authorized representative" value={signerName} />
      </label>
      <label className="text-[12px] font-bold text-slate-600">Relationship
        <Input onChange={(event) => setRelationship(event.target.value)} value={relationship} />
      </label>
    </div>
    <fieldset><legend className="text-[12px] font-bold text-slate-600">Authorized record categories</legend><div className="mt-2 flex flex-wrap gap-2">
      {categories.map((category) => <label className={`cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-bold ring-1 ring-inset ${selected.includes(category) ? "bg-teal-600 text-white ring-teal-600" : "bg-white text-slate-600 ring-slate-200"}`} key={category}>
        <input checked={selected.includes(category)} className="sr-only" onChange={() => toggleCategory(category)} type="checkbox" />{category.replaceAll("_", " ")}
      </label>)}
    </div></fieldset>
    <Button disabled={unavailable || pending} onClick={capture} size="sm" variant="primary">
      {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <UserRoundCheck className="size-3.5" />} Capture signed consent
    </Button>
    <p className="text-[11px] leading-5 text-slate-400">This records a signer acknowledgment receipt. It does not open any chart until a separate record request is approved.</p>
    {error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}

export function ConsentWithdrawControl({ consentId, disabled = false }: { consentId: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function withdraw() {
    setPending(true);
    setError("");
    try {
      await parseResponse(await fetch(`/api/consents/${consentId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Patient withdrew authorization for connected-clinic record sharing." }),
      }));
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Consent withdrawal failed.");
    } finally {
      setPending(false);
    }
  }

  return <div className="mt-3">
    <Button disabled={disabled || pending} onClick={withdraw} size="sm" variant="secondary">
      {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <ShieldOff className="size-3.5" />} Withdraw and revoke grants
    </Button>
    {error && <p className="mt-2 text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}

export function RecordLocatorControl({ masterPatientId }: { masterPatientId: string }) {
  const [pending, setPending] = useState(false);
  const [records, setRecords] = useState<{ patientId: string; organization: string; mrn: string; identityStatus: string }[]>([]);
  const [error, setError] = useState("");

  async function locate() {
    setPending(true);
    setError("");
    try {
      const query = new URLSearchParams({ masterPatientId });
      setRecords(await parseResponse(await fetch(`/api/identity/record-locator?${query}`)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Record locator failed.");
    } finally {
      setPending(false);
    }
  }

  return <div className="mt-3">
    <Button disabled={pending} onClick={locate} size="sm" variant="secondary">
      {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <MapPinned className="size-3.5" />} Locate source charts
    </Button>
    {records.length > 0 && <div className="mt-2 space-y-1">{records.map((record) => <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12px]" key={`${record.organization}-${record.patientId}`}><Check className="size-3 text-teal-600" /><span className="font-bold text-slate-700">{record.organization}</span><span className="text-slate-400">{record.mrn} · {record.identityStatus.replaceAll("_", " ")}</span></div>)}</div>}
    {error && <p className="mt-2 text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}
