"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2, MessageSquareText, ShieldCheck, Smartphone, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MessageClass = "transactional" | "operational" | "marketing";
type PermissionStatus = "granted" | "denied" | "revoked" | "unknown";
type PermissionEvidence = {
  status: PermissionStatus;
  source: string;
  capturedAt: string;
  actorId?: string | null;
  policyVersion?: string | null;
  evidenceReference?: string | null;
};
type SmsState = {
  patientId: string;
  normalizedPhone: string | null;
  sms: {
    endpoint?: { normalizedPhone?: string | null; verifiedAt?: string | null; verificationSource?: string | null };
    suppressedAt?: string | null;
    suppressionReason?: string | null;
    permissions?: Partial<Record<"transactional" | "operational" | "marketing" | "clinical", PermissionEvidence>>;
  };
};

type ConsentSource = "patient_verbal" | "patient_written" | "staff_documented";

const classMeta: Record<MessageClass, { label: string; description: string }> = {
  transactional: { label: "Transactional", description: "A specific non-clinical transaction or account event." },
  operational: { label: "Operational", description: "Office logistics such as non-clinical reminders and workflow notices." },
  marketing: { label: "Marketing", description: "Promotional outreach. Never inferred from operational permission." },
};

function statusTone(status: PermissionStatus) {
  if (status === "granted") return "teal" as const;
  if (status === "denied" || status === "revoked") return "rose" as const;
  return "slate" as const;
}

function pretty(value?: string | null) {
  if (!value) return "Not recorded";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PermissionRow({
  messageClass,
  evidence,
  canUpdate,
  disabled,
  onSave,
}: {
  messageClass: MessageClass;
  evidence?: PermissionEvidence;
  canUpdate: boolean;
  disabled: boolean;
  onSave: (messageClass: MessageClass, status: Exclude<PermissionStatus, "unknown">, source: ConsentSource, evidenceReference?: string) => Promise<void>;
}) {
  const [source, setSource] = useState<ConsentSource>("patient_verbal");
  const [evidenceReference, setEvidenceReference] = useState("");
  const status = evidence?.status ?? "unknown";
  const meta = classMeta[messageClass];
  const writtenNeedsEvidence = source === "patient_written" && !evidenceReference.trim();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-extrabold text-slate-950">{meta.label}</p>
            <Badge tone={statusTone(status)}>{pretty(status)}</Badge>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-slate-500">{meta.description}</p>
          {evidence ? (
            <p className="mt-2 text-[9px] leading-4 text-slate-400">
              Source: {pretty(evidence.source)} · {new Date(evidence.capturedAt).toLocaleString()}
              {evidence.evidenceReference ? ` · Evidence: ${evidence.evidenceReference}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {canUpdate ? (
        <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 lg:grid-cols-[170px_1fr_auto] lg:items-end">
          <label className="space-y-1">
            <span className="text-[8px] font-extrabold uppercase tracking-[.12em] text-slate-400">Evidence source</span>
            <select
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-700 outline-none focus:border-teal-500"
              disabled={disabled}
              onChange={(event) => setSource(event.target.value as ConsentSource)}
              value={source}
            >
              <option value="patient_verbal">Patient verbal</option>
              <option value="patient_written">Patient written</option>
              <option value="staff_documented">Staff documented</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[8px] font-extrabold uppercase tracking-[.12em] text-slate-400">Evidence reference</span>
            <input
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-500 disabled:bg-slate-50"
              disabled={disabled}
              maxLength={200}
              onChange={(event) => setEvidenceReference(event.target.value)}
              placeholder={source === "patient_written" ? "Required: consent/form/document reference" : "Optional note or evidence reference"}
              value={evidenceReference}
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            <Button disabled={disabled || writtenNeedsEvidence} onClick={() => onSave(messageClass, "granted", source, evidenceReference.trim() || undefined)} size="sm" type="button" variant="primary"><Check className="size-3.5" /> Grant</Button>
            <Button disabled={disabled || writtenNeedsEvidence} onClick={() => onSave(messageClass, "denied", source, evidenceReference.trim() || undefined)} size="sm" type="button" variant="secondary"><X className="size-3.5" /> Deny</Button>
            <Button disabled={disabled || writtenNeedsEvidence} onClick={() => onSave(messageClass, "revoked", source, evidenceReference.trim() || undefined)} size="sm" type="button" variant="secondary">Revoke</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PatientSmsPreferencesPanel({ patientId, canRead, canUpdate }: { patientId: string; canRead: boolean; canUpdate: boolean }) {
  const [state, setState] = useState<SmsState | null>(null);
  const [loading, setLoading] = useState(canRead);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const endpoint = `/api/patients/${encodeURIComponent(patientId)}/sms-preferences`;

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json() as { data?: SmsState; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Could not load SMS preferences.");
      setState(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load SMS preferences.");
    } finally {
      setLoading(false);
    }
  }, [canRead, endpoint]);

  useEffect(() => { void load(); }, [load]);

  const suppressed = Boolean(state?.sms.suppressedAt);
  const verification = state?.sms.endpoint;
  const verificationMatchesCurrent = Boolean(
    state?.normalizedPhone && verification?.normalizedPhone && state.normalizedPhone === verification.normalizedPhone && verification.verifiedAt,
  );

  const classes = useMemo(() => Object.keys(classMeta) as MessageClass[], []);

  async function save(messageClass: MessageClass, status: Exclude<PermissionStatus, "unknown">, source: ConsentSource, evidenceReference?: string) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messageClass, status, source, evidenceReference }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update SMS permission.");
      setNotice(`${classMeta[messageClass].label} SMS permission recorded as ${status}.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update SMS permission.");
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) return null;

  return (
    <Card className="mt-5 overflow-hidden border-slate-200">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2"><MessageSquareText className="size-4 text-teal-700" /><p className="text-sm font-extrabold text-slate-950">SMS permissions & suppression</p></div>
          <p className="mt-2 max-w-3xl text-[10px] leading-5 text-slate-500">Klinikos records permission separately by message class. Phone verification proves possession only; it never creates consent. Clinical or PHI-bearing SMS remains blocked.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={suppressed ? "rose" : "slate"}>{suppressed ? "Recipient suppressed" : "No global suppression"}</Badge>
          <Badge tone={verificationMatchesCurrent ? "teal" : "slate"}>{verificationMatchesCurrent ? "Phone verified" : "Phone not verified"}</Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {loading ? <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading communication permissions…</div> : null}
        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] text-rose-800">{error}</div> : null}
        {notice ? <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-[10px] text-teal-800">{notice}</div> : null}

        {!loading && state ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3"><Smartphone className="size-4 text-slate-500" /><p className="mt-2 text-[8px] font-extrabold uppercase tracking-[.12em] text-slate-400">Normalized phone</p><p className="mt-1 text-[11px] font-bold text-slate-800">{state.normalizedPhone ?? "Unavailable"}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><ShieldCheck className="size-4 text-slate-500" /><p className="mt-2 text-[8px] font-extrabold uppercase tracking-[.12em] text-slate-400">Possession evidence</p><p className="mt-1 text-[11px] font-bold text-slate-800">{verificationMatchesCurrent ? new Date(verification?.verifiedAt ?? "").toLocaleString() : "Not verified for current phone"}</p></div>
              <div className={`rounded-xl p-3 ${suppressed ? "bg-rose-50" : "bg-slate-50"}`}><AlertTriangle className={`size-4 ${suppressed ? "text-rose-700" : "text-slate-500"}`} /><p className="mt-2 text-[8px] font-extrabold uppercase tracking-[.12em] text-slate-400">Suppression</p><p className={`mt-1 text-[11px] font-bold ${suppressed ? "text-rose-900" : "text-slate-800"}`}>{suppressed ? `Since ${new Date(state.sms.suppressedAt ?? "").toLocaleString()}` : "Not suppressed"}</p></div>
            </div>

            {suppressed ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[10px] leading-5 text-rose-800"><strong>Recipient opt-out is authoritative.</strong> Staff cannot clear it from this chart. The recipient must use the provider-supported resume keyword such as START/UNSTOP, after which Klinikos still requires the relevant message-class permission.</div> : null}

            <div className="space-y-3">
              {classes.map((messageClass) => <PermissionRow canUpdate={canUpdate} disabled={saving || suppressed} evidence={state.sms.permissions?.[messageClass]} key={messageClass} messageClass={messageClass} onSave={save} />)}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" /><div><p className="text-xs font-extrabold text-amber-950">Clinical SMS locked</p><p className="mt-1 text-[10px] leading-5 text-amber-800">A consent record cannot turn on clinical or PHI-bearing SMS. That requires separate approved infrastructure, contractual posture, minimum-necessary content controls, and an explicit production policy gate.</p></div></div>
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
}
