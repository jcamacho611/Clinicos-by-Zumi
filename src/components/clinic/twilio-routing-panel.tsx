"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Check, Clipboard, Loader2, MessageSquareText, Phone, ShieldAlert, Webhook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Routing = {
  senderPhone: string;
  messagingServiceSid?: string | null;
  timeZone?: string | null;
  inboundEnabled: boolean;
  configuredAt?: string | null;
  configuredBy?: string | null;
  providerVerifiedAt?: string | null;
  providerPhoneNumberSid?: string | null;
  providerMessagingServiceSid?: string | null;
};
type RoutingResponse = {
  current?: { integrationId: string; integrationStatus: string; routing: Routing | null } | null;
  webhookPath: string;
  webhookUrl?: string | null;
  requiredServerSecrets: string[];
  platformModel: string;
  note?: string;
};

const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2";

export function TwilioRoutingPanel({ canManage }: { canManage: boolean }) {
  const [data, setData] = useState<RoutingResponse | null>(null);
  const [senderPhone, setSenderPhone] = useState("");
  const [messagingServiceSid, setMessagingServiceSid] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [inboundEnabled, setInboundEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/twilio/sms-routing", { cache: "no-store" });
      const payload = await response.json() as { data?: RoutingResponse; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Could not load Twilio routing state.");
      setData(payload.data);
      const routing = payload.data.current?.routing;
      setSenderPhone(routing?.senderPhone ?? "");
      setMessagingServiceSid(routing?.messagingServiceSid ?? "");
      setTimeZone(routing?.timeZone ?? "");
      setInboundEnabled(Boolean(routing?.inboundEnabled));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load Twilio routing state.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/integrations/twilio/sms-routing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ senderPhone, messagingServiceSid: messagingServiceSid.trim() || null, timeZone: timeZone.trim() || null, inboundEnabled }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save Twilio routing.");
      setNotice("Routing saved. Provider verification was reset because routing changed; verify it before any patient SMS can send.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save Twilio routing.");
    } finally {
      setSaving(false);
    }
  }

  async function verifyRouting() {
    setVerifying(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/integrations/twilio/sms-routing/verify", { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Twilio could not verify this sender and Messaging Service.");
      setNotice("Twilio verified that this sender belongs to the platform account and the configured Messaging Service. Production sending is still separately gated.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Twilio routing verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  async function copyWebhook() {
    if (!data?.webhookUrl || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(data.webhookUrl);
      setCopied(true);
      setNotice("Canonical webhook URL copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the webhook URL. Select and copy it manually.");
    }
  }

  const routing = data?.current?.routing;
  const inboundReady = Boolean(routing?.senderPhone && routing.inboundEnabled);
  const policyReady = Boolean(inboundReady && routing?.timeZone);
  const providerVerified = Boolean(routing?.providerVerifiedAt && routing?.providerPhoneNumberSid && routing?.providerMessagingServiceSid === routing?.messagingServiceSid);
  const canVerify = Boolean(canManage && routing?.senderPhone && routing?.messagingServiceSid && !saving && !verifying);

  return (
    <Card className="overflow-hidden border-slate-200">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2"><MessageSquareText aria-hidden="true" className="size-5 text-teal-700" /><h2 className="text-base font-extrabold text-slate-950">Twilio SMS routing</h2></div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Klinikos uses a platform-managed Twilio account and assigns a sender to each organization. This screen stores non-secret routing metadata only. Bring-your-own Twilio accounts are not a current production capability.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Twilio routing readiness">
          <Badge tone={inboundReady ? "teal" : "amber"}>{inboundReady ? "Inbound routing mapped" : "Inbound routing incomplete"}</Badge>
          <Badge tone={providerVerified ? "teal" : "amber"}>{providerVerified ? "Provider routing verified" : "Provider verification required"}</Badge>
          <Badge tone={policyReady ? "teal" : "amber"}>{policyReady ? "Timezone policy mapped" : "Timezone required"}</Badge>
          <Badge tone="slate">{data?.current?.integrationStatus ?? "pending connection"}</Badge>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[1fr_.8fr]">
        <div className="space-y-4">
          {loading ? <div aria-live="polite" className="flex items-center gap-2 text-sm text-slate-600" role="status"><Loader2 aria-hidden="true" className="size-4 animate-spin" /> Loading Twilio routing…</div> : null}
          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" role="alert">{error}</div> : null}
          {notice ? <div aria-live="polite" className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900" role="status">{notice}</div> : null}

          {!loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5"><Phone aria-hidden="true" className="size-4" /> Tenant-assigned sender number</span>
                <input autoComplete="tel" className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 disabled:bg-slate-50 ${focusClass}`} disabled={!canManage || saving || verifying} inputMode="tel" onChange={(event) => setSenderPhone(event.target.value)} placeholder="+12125550123" value={senderPhone} />
                <span className="block text-xs font-normal leading-5 text-slate-500">One normalized sender can belong to only one Klinikos organization. Saving any routing change invalidates prior provider verification.</span>
              </label>

              <label className="space-y-1.5 text-xs font-bold text-slate-700">
                Messaging Service SID for patient SMS
                <input className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 disabled:bg-slate-50 ${focusClass}`} disabled={!canManage || saving || verifying} onChange={(event) => setMessagingServiceSid(event.target.value)} placeholder="MG + 32 hexadecimal characters" value={messagingServiceSid} />
                <span className="block text-xs font-normal leading-5 text-slate-500">Required for the governed patient rail so the specific sender remains associated with Messaging Service behavior such as Advanced Opt-Out. This identifier is not a secret.</span>
              </label>

              <label className="space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
                Organization SMS timezone
                <input className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 disabled:bg-slate-50 ${focusClass}`} disabled={!canManage || saving || verifying} onChange={(event) => setTimeZone(event.target.value)} placeholder="America/New_York" value={timeZone} />
                <span className="block text-xs font-normal leading-5 text-slate-500">Use an IANA timezone. Ordinary SMS is held outside Klinikos policy hours of 09:00–20:00 local time. No area-code guessing.</span>
              </label>
            </div>
          ) : null}

          {!loading ? (
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
              <input className={`mt-1 size-5 accent-teal-700 ${focusClass}`} checked={inboundEnabled} disabled={!canManage || saving || verifying} onChange={(event) => setInboundEnabled(event.target.checked)} type="checkbox" />
              <span><span className="block font-extrabold text-slate-950">Enable signed inbound routing for this sender</span><span className="mt-1 block leading-6 text-slate-600">Outbound patient SMS is not allowed unless STOP/START callbacks can route back to this organization. This setting still does not turn on production sending.</span></span>
            </label>
          ) : null}

          {canManage && !loading ? (
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving || verifying || !senderPhone.trim()} onClick={save} type="button" variant="primary">{saving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Check aria-hidden="true" className="size-4" />} Save routing</Button>
              <Button disabled={!canVerify} onClick={verifyRouting} type="button" variant="secondary">{verifying ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <BadgeCheck aria-hidden="true" className="size-4" />} Verify with Twilio</Button>
            </div>
          ) : null}
          {providerVerified && routing?.providerVerifiedAt ? <p className="text-xs leading-5 text-slate-600">Last provider routing verification: {new Date(routing.providerVerifiedAt).toLocaleString()}.</p> : null}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2"><Webhook aria-hidden="true" className="size-5 text-slate-600" /><h3 className="text-sm font-extrabold text-slate-950">Canonical inbound webhook</h3></div>
            <p className="mt-2 break-all rounded-lg bg-white p-3 font-mono text-xs leading-5 text-slate-700 ring-1 ring-slate-200">{data?.webhookUrl ?? "Unavailable until NEXT_PUBLIC_APP_URL is valid."}</p>
            <Button aria-label="Copy canonical Twilio inbound webhook URL" className="mt-3" disabled={!data?.webhookUrl} onClick={copyWebhook} size="sm" type="button" variant="secondary"><Clipboard aria-hidden="true" className="size-4" /> {copied ? "Copied" : "Copy webhook URL"}</Button>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3"><ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><h3 className="text-sm font-extrabold text-amber-950">Private server configuration remains separate</h3><p className="mt-1 text-sm leading-6 text-amber-900">Inbound verification requires private server values for {(data?.requiredServerSecrets ?? ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]).join(" and ")}. They never belong in this UI. Restricted outbound API credentials, messaging registration, consent policy, and controlled live proof remain separate gates.</p></div></div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><strong>Production SMS is not authorized by this panel.</strong> Provider verification proves sender ownership and Messaging Service membership only. The production send gate, registration, patient verification, message-class permission, quiet-hours policy, and controlled live proof remain separate.</div>
        </div>
      </div>
    </Card>
  );
}
