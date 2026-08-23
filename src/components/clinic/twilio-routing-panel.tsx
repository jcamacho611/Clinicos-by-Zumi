"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, MessageSquareText, Phone, Save, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RoutingView = {
  configured: boolean;
  status: string;
  senderPhone: string | null;
  timeZone: string | null;
  inboundEnabled: boolean;
  messagingServiceConfigured: boolean;
  providerRoutingVerified: boolean;
  webhookPath: string;
};

const endpoint = "/api/integrations/twilio/sms-routing";
const verifyEndpoint = "/api/integrations/twilio/sms-routing/verify";

export function TwilioRoutingPanel({ canManage }: { canManage: boolean }) {
  const [state, setState] = useState<RoutingView | null>(null);
  const [senderPhone, setSenderPhone] = useState("");
  const [messagingServiceSid, setMessagingServiceSid] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [inboundEnabled, setInboundEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"save" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json() as { data?: RoutingView; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Could not load Twilio routing state.");
      setState(payload.data);
      setSenderPhone(payload.data.senderPhone ?? "");
      setTimeZone(payload.data.timeZone ?? "");
      setInboundEnabled(payload.data.inboundEnabled);
      setMessagingServiceSid("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load Twilio routing state.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveRouting() {
    setWorking("save");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          senderPhone,
          messagingServiceSid: messagingServiceSid.trim() || undefined,
          timeZone: timeZone.trim() || undefined,
          inboundEnabled,
        }),
      });
      const payload = await response.json() as { data?: RoutingView; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Could not save Twilio routing.");
      setNotice("Routing saved. Provider verification was reset because routing evidence changed.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save Twilio routing.");
    } finally {
      setWorking(null);
    }
  }

  async function verifyRouting() {
    setWorking("verify");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(verifyEndpoint, { method: "POST" });
      const payload = await response.json() as { data?: { providerRoutingVerified?: boolean; productionSendingAuthorized?: boolean }; error?: string };
      if (!response.ok || !payload.data?.providerRoutingVerified) throw new Error(payload.error || "Twilio could not verify this routing configuration.");
      setNotice("Twilio verified sender ownership and Messaging Service membership. Production patient SMS remains separately gated.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Twilio routing verification failed.");
    } finally {
      setWorking(null);
    }
  }

  return <div className="space-y-5">
    <Card className="overflow-hidden border-slate-200">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-5 md:flex-row md:items-start md:justify-between">
        <div><div className="flex items-center gap-2"><MessageSquareText className="size-5 text-teal-700" aria-hidden="true" /><h2 className="text-base font-extrabold text-slate-950">Twilio patient SMS routing</h2></div><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Configure non-secret tenant routing metadata. Provider proof, patient consent, phone possession, funding, quiet hours, and the production gate remain independent.</p></div>
        <div className="flex flex-wrap gap-2"><Badge tone={state?.messagingServiceConfigured ? "teal" : "amber"}>{state?.messagingServiceConfigured ? "Messaging Service configured" : "Messaging Service required"}</Badge><Badge tone={state?.providerRoutingVerified ? "teal" : "amber"}>{state?.providerRoutingVerified ? "Provider routing verified" : "Provider verification required"}</Badge><Badge tone={state?.inboundEnabled ? "teal" : "amber"}>{state?.inboundEnabled ? "Inbound routing enabled" : "Inbound routing required"}</Badge></div>
      </div>

      <div className="space-y-5 p-5">
        {loading ? <p className="flex items-center gap-2 text-sm text-slate-600" role="status"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Loading routing state…</p> : null}
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" role="alert">{error}</p> : null}
        {notice ? <p className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900" role="status">{notice}</p> : null}

        {!loading ? <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-xs font-bold text-slate-700"><span className="flex items-center gap-2"><Phone className="size-4" aria-hidden="true" />Tenant sender phone</span><input className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" disabled={!canManage || Boolean(working)} inputMode="tel" onChange={(event) => setSenderPhone(event.target.value)} placeholder="+12125550123" value={senderPhone} /></label>
          <label className="space-y-2 text-xs font-bold text-slate-700">Messaging Service SID<input className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" disabled={!canManage || Boolean(working)} onChange={(event) => setMessagingServiceSid(event.target.value)} placeholder="MG + 32 hexadecimal characters" value={messagingServiceSid} /><span className="block font-normal leading-5 text-slate-500">{state?.messagingServiceConfigured ? "Leave blank to keep the currently configured service." : "Enter the Messaging Service assigned to this tenant sender."}</span></label>
          <label className="space-y-2 text-xs font-bold text-slate-700 md:col-span-2">Organization SMS timezone<input className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" disabled={!canManage || Boolean(working)} onChange={(event) => setTimeZone(event.target.value)} placeholder="America/New_York" value={timeZone} /><span className="block font-normal leading-5 text-slate-500">Use an IANA timezone. Ordinary patient SMS is held outside 09:00–20:00 local time.</span></label>
        </div> : null}

        {!loading ? <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><input className="mt-1 size-5 accent-teal-700" checked={inboundEnabled} disabled={!canManage || Boolean(working)} onChange={(event) => setInboundEnabled(event.target.checked)} type="checkbox" /><span><strong className="block text-slate-950">Enable signed inbound STOP/START routing</strong><span className="mt-1 block leading-6">Patient SMS stays blocked unless opt-out callbacks can route back to this organization.</span></span></label> : null}

        {canManage && !loading ? <div className="flex flex-wrap gap-2"><Button disabled={Boolean(working) || !senderPhone.trim()} onClick={saveRouting} type="button" variant="primary">{working === "save" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}Save routing</Button><Button disabled={Boolean(working) || !state?.messagingServiceConfigured || !state?.senderPhone} onClick={verifyRouting} type="button" variant="secondary">{working === "verify" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <BadgeCheck className="size-4" aria-hidden="true" />}Verify with Twilio</Button></div> : null}
      </div>
    </Card>

    <Card className="border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" /><div><p className="text-sm font-extrabold text-amber-950">Production patient SMS remains separately gated</p><p className="mt-1 text-sm leading-6 text-amber-900">Provider routing verification proves only that Twilio recognizes this sender and Messaging Service relationship. It does not grant patient permission, approve PHI, fund vendor spend, complete messaging registration, or turn on production sending.</p><p className="mt-2 font-mono text-xs text-amber-800">Inbound webhook path: {state?.webhookPath ?? "/api/webhooks/twilio/sms"}</p></div></div></Card>
  </div>;
}
