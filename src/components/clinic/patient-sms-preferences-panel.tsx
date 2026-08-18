"use client";

import { useCallback, useEffect, useState } from "react";
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
type ConsentSource = "patient_verbal" | "staff_documented";

const classes: MessageClass[] = ["transactional", "operational", "marketing"];
const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2";
const classMeta: Record<MessageClass, { label: string; description: string }> = {
  transactional: { label: "Transactional", description: "A specific non-clinical transaction or secure-account event." },
  operational: { label: "Operational", description: "Office logistics and secure-account notices that contain no clinical detail." },
  marketing: { label: "Marketing", description: "Promotional outreach. Klinikos does not currently expose a staff grant or production send path for this class." },
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
  onSave: (messageClass: MessageClass, status: Exclude<PermissionStatus, "unknown">, source: ConsentSource) => Promise<void>;
}) {
  const [source, setSource] = useState<ConsentSource>("patient_verbal");
  const status = evidence?.status ?? "unknown";
  const meta = classMeta[messageClass];
  const marketing = messageClass === "marketing";
  const grantBlocked = disabled || marketing || source !== "patient_verbal";

  return (
    <section aria-labelledby={`sms-${messageClass}-heading`} className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-extrabold text-slate-950" id={`sms-${messageClass}-heading`}>{meta.label}</h4>
            <Badge tone={statusTone(status)}>{pretty(status)}</Badge>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">{meta.description}</p>
          {evidence ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Recorded source: {pretty(evidence.source)} · {new Date(evidence.capturedAt).toLocaleString()}
              {evidence.evidenceReference ? " · Historical evidence reference present" : ""}
            </p>
          ) : null}
        </div>
      </div>

      {canUpdate ? (
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-[260px_auto] lg:items-end">
          <label className="space-y-1.5 text-xs font-bold text-slate-700">
            Capture basis
            <select
              className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 ${focusClass}`}
              disabled={disabled}
              onChange={(event) => setSource(event.target.value as ConsentSource)}
              value={source}
            >
              <option value="patient_verbal">Patient verbal authorization</option>
              <option value="staff_documented">Staff documentation only</option>
            </select>
          </label>
          <div aria-label={`${meta.label} SMS permission actions`} className="flex flex-wrap gap-2" role="group">
            <Button aria-label={`Grant ${meta.label} SMS permission`} disabled={grantBlocked} onClick={() => onSave(messageClass, "granted", source)} size="sm" type="button" variant="primary"><Check aria-hidden="true" className="size-4" /> Grant</Button>
            <Button aria-label={`Deny ${meta.label} SMS permission`} disabled={disabled} onClick={() => onSave(messageClass, "denied", source)} size="sm" type="button" variant="secondary"><X aria-hidden="true" className="size-4" /> Deny</Button>
            <Button aria-label={`Revoke ${meta.label} SMS permission`} disabled={disabled} onClick={() => onSave(messageClass, "revoked", source)} size="sm" type="button" variant="secondary">Revoke</Button>
          </div>
        </div>
      ) : null}

      {canUpdate && source === "staff_documented" ? <p className="mt-3 text-xs leading-5 text-amber-900">Staff documentation may record denial or revocation, but it cannot create permission.</p> : null}
      {canUpdate && marketing ? <p className="mt-2 text-xs leading-5 text-slate-700">Marketing grant is deliberately unavailable here. A dedicated patient-facing written communication-consent ceremony must exist before Klinikos can create marketing permission.</p> : null}
    </section>
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
  const verificationMatchesCurrent = Boolean(state?.normalizedPhone && verification?.normalizedPhone && state.normalizedPhone === verification.normalizedPhone && verification.verifiedAt);

  async function save(messageClass: MessageClass, status: Exclude<PermissionStatus, "unknown">, source: ConsentSource) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messageClass, status, source }),
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
          <div className="flex items-center gap-2"><MessageSquareText aria-hidden="true" className="size-5 text-teal-700" /><h3 className="text-base font-extrabold text-slate-950">SMS permissions & suppression</h3></div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Permission is recorded separately by message class. Phone verification proves possession only and is independently required before a patient send. Clinical/PHI SMS and staff-created marketing permission remain blocked.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={suppressed ? "rose" : "slate"}>{suppressed ? "Recipient suppressed" : "No global suppression"}</Badge>
          <Badge tone={verificationMatchesCurrent ? "teal" : "slate"}>{verificationMatchesCurrent ? "Current phone verified" : "Current phone not verified"}</Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {loading ? <div aria-live="polite" className="flex items-center gap-2 text-sm text-slate-600" role="status"><Loader2 aria-hidden="true" className="size-4 animate-spin" /> Loading communication permissions…</div> : null}
        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" role="alert">{error}</div> : null}
        {notice ? <div aria-live="polite" className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900" role="status">{notice}</div> : null}

        {!loading && state ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4"><Smartphone aria-hidden="true" className="size-5 text-slate-600" /><p className="mt-2 text-xs font-extrabold uppercase tracking-[.08em] text-slate-500">Normalized phone</p><p className="mt-1 text-sm font-bold text-slate-900">{state.normalizedPhone ?? "Unavailable"}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><ShieldCheck aria-hidden="true" className="size-5 text-slate-600" /><p className="mt-2 text-xs font-extrabold uppercase tracking-[.08em] text-slate-500">Possession evidence</p><p className="mt-1 text-sm font-bold text-slate-900">{verificationMatchesCurrent ? new Date(verification?.verifiedAt ?? "").toLocaleString() : "Not verified for current phone"}</p></div>
              <div className={`rounded-xl p-4 ${suppressed ? "bg-rose-50" : "bg-slate-50"}`}><AlertTriangle aria-hidden="true" className={`size-5 ${suppressed ? "text-rose-700" : "text-slate-600"}`} /><p className="mt-2 text-xs font-extrabold uppercase tracking-[.08em] text-slate-500">Suppression</p><p className={`mt-1 text-sm font-bold ${suppressed ? "text-rose-950" : "text-slate-900"}`}>{suppressed ? `Since ${new Date(state.sms.suppressedAt ?? "").toLocaleString()}` : "Not suppressed"}</p></div>
            </div>

            {!verificationMatchesCurrent ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Patient SMS remains blocked.</strong> The current phone needs a governed possession-verification ceremony. Staff cannot mark a phone verified from this panel.</div> : null}
            {suppressed ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><strong>Recipient opt-out is authoritative.</strong> Staff cannot clear suppression from this chart. Permission may still be documented accurately, but sends remain blocked until the recipient uses a provider-supported resume command such as START or UNSTOP.</div> : null}

            <div className="space-y-3">
              {classes.map((messageClass) => <PermissionRow canUpdate={canUpdate} disabled={saving} evidence={state.sms.permissions?.[messageClass]} key={messageClass} messageClass={messageClass} onSave={save} />)}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3"><AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><p className="text-sm font-extrabold text-amber-950">Clinical SMS locked</p><p className="mt-1 text-sm leading-6 text-amber-900">This staff workflow cannot record a clinical SMS grant. Clinical or PHI-bearing messaging requires a separate approved infrastructure, contractual posture, minimum-necessary content controls, and production policy.</p></div></div>
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
}
