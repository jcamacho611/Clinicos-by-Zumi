"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Loader2, MessageSquareText, Phone, ShieldAlert, Webhook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Routing = {
  senderPhone: string;
  messagingServiceSid?: string | null;
  inboundEnabled: boolean;
  configuredAt?: string | null;
  configuredBy?: string | null;
};
type RoutingResponse = {
  current?: { integrationId: string; integrationStatus: string; routing: Routing | null } | null;
  webhookPath: string;
  requiredServerSecret: string;
  note?: string;
};

export function TwilioRoutingPanel({ canManage }: { canManage: boolean }) {
  const [data, setData] = useState<RoutingResponse | null>(null);
  const [senderPhone, setSenderPhone] = useState("");
  const [messagingServiceSid, setMessagingServiceSid] = useState("");
  const [inboundEnabled, setInboundEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setInboundEnabled(Boolean(routing?.inboundEnabled));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load Twilio routing state.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const webhookUrl = useMemo(() => {
    if (!data?.webhookPath) return "";
    if (typeof window === "undefined") return data.webhookPath;
    return `${window.location.origin}${data.webhookPath}`;
  }, [data?.webhookPath]);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/integrations/twilio/sms-routing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          senderPhone,
          messagingServiceSid: messagingServiceSid.trim() || null,
          inboundEnabled,
        }),
      });
      const payload = await response.json() as { data?: unknown; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save Twilio routing.");
      setNotice("Twilio sender routing saved. This does not authorize production SMS.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save Twilio routing.");
    } finally {
      setSaving(false);
    }
  }

  async function copyWebhook() {
    if (!webhookUrl || !navigator.clipboard) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const routing = data?.current?.routing;
  const routingReady = Boolean(routing?.senderPhone && routing.inboundEnabled);

  return (
    <Card className="overflow-hidden border-slate-200">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2"><MessageSquareText className="size-4 text-teal-700" /><p className="text-sm font-extrabold text-slate-950">Twilio SMS routing</p></div>
          <p className="mt-2 max-w-3xl text-[10px] leading-5 text-slate-500">Connect a clinic-owned Twilio sender to this organization for signed inbound STOP/START handling. This screen stores routing metadata only. API keys and Auth Tokens never belong in the browser or database config.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={routingReady ? "teal" : "amber"}>{routingReady ? "Inbound routing mapped" : "Routing incomplete"}</Badge>
          <Badge tone="slate">{data?.current?.integrationStatus ?? "pending connection"}</Badge>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[1fr_.8fr]">
        <div className="space-y-4">
          {loading ? <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading Twilio routing…</div> : null}
          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] text-rose-800">{error}</div> : null}
          {notice ? <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-[10px] text-teal-800">{notice}</div> : null}

          {!loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[.12em] text-slate-400"><Phone className="size-3" /> Clinic sender number</span>
                <input
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-500 disabled:bg-slate-50"
                  disabled={!canManage || saving}
                  onChange={(event) => setSenderPhone(event.target.value)}
                  placeholder="+12125550123"
                  value={senderPhone}
                />
                <p className="text-[9px] leading-4 text-slate-400">One sender can belong to only one Klinikos organization.</p>
              </label>
              <label className="space-y-1.5">
                <span className="text-[8px] font-extrabold uppercase tracking-[.12em] text-slate-400">Messaging Service SID</span>
                <input
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-500 disabled:bg-slate-50"
                  disabled={!canManage || saving}
                  onChange={(event) => setMessagingServiceSid(event.target.value)}
                  placeholder="MG… (optional routing consistency check)"
                  value={messagingServiceSid}
                />
                <p className="text-[9px] leading-4 text-slate-400">This identifier is not a secret. Do not paste an Auth Token or API key here.</p>
              </label>
            </div>
          ) : null}

          {!loading ? (
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input className="mt-0.5 size-4 accent-teal-700" checked={inboundEnabled} disabled={!canManage || saving} onChange={(event) => setInboundEnabled(event.target.checked)} type="checkbox" />
              <span><span className="block text-xs font-extrabold text-slate-900">Enable inbound routing for this sender</span><span className="mt-1 block text-[10px] leading-5 text-slate-500">Only signed Twilio callbacks matching this sender can update recipient suppression state. Enabling routing does not enable outbound texting.</span></span>
            </label>
          ) : null}

          {canManage && !loading ? <Button disabled={saving || !senderPhone.trim()} onClick={save} type="button" variant="primary">{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save routing</Button> : null}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2"><Webhook className="size-4 text-slate-600" /><p className="text-xs font-extrabold text-slate-900">Inbound webhook</p></div>
            <p className="mt-2 break-all rounded-lg bg-white p-3 font-mono text-[9px] text-slate-600 ring-1 ring-slate-200">{webhookUrl || "/api/webhooks/twilio/sms"}</p>
            <Button className="mt-3" disabled={!webhookUrl} onClick={copyWebhook} size="sm" type="button" variant="secondary"><Clipboard className="size-3.5" /> {copied ? "Copied" : "Copy webhook URL"}</Button>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" /><div><p className="text-xs font-extrabold text-amber-950">Server configuration is still separate</p><p className="mt-1 text-[10px] leading-5 text-amber-800">The server must have <code className="font-mono">{data?.requiredServerSecret ?? "TWILIO_AUTH_TOKEN"}</code> configured privately so inbound signatures can be verified. Never enter that secret in Klinikos UI. Twilio API credentials, Messaging Service activation, A2P requirements, consent policy, and live proof remain separate gates.</p></div></div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[10px] leading-5 text-rose-800"><strong>Production SMS is not authorized by this panel.</strong> Clinical/PHI-bearing SMS stays blocked, recipient opt-outs remain authoritative, and Zumi cannot treat this routing state as permission to contact anyone.</div>
        </div>
      </div>
    </Card>
  );
}
