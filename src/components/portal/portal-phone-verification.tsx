"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, MessageSquareText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type VerificationState = {
  hasPhone: boolean;
  maskedPhone: string | null;
  verified: boolean;
  verifiedAt: string | null;
  verificationSource: string | null;
  fundingReady: boolean;
};

const endpoint = "/api/portal/phone-verification";
const fundingUnavailable = "Phone verification is not available until its funding policy is activated.";

export function PortalPhoneVerification() {
  const [state, setState] = useState<VerificationState | null>(null);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json() as { data?: VerificationState; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Could not load phone verification status.");
      setState(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load phone verification status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function sendCode() {
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const payload = await response.json() as { data?: { sent?: boolean; maskedPhone?: string | null }; error?: string };
      if (!response.ok || !payload.data?.sent) throw new Error(payload.error || fundingUnavailable);
      setCodeSent(true);
      setNotice(`Verification code sent to ${payload.data.maskedPhone ?? "your phone"}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : fundingUnavailable);
    } finally {
      setWorking(false);
    }
  }

  async function verifyCode() {
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = await response.json() as { data?: VerificationState; error?: string };
      if (!response.ok || !payload.data?.verified) throw new Error(payload.error || "The verification code was not approved.");
      setState(payload.data);
      setCode("");
      setCodeSent(false);
      setNotice("Phone possession verified. This does not grant SMS permission.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The verification code was not approved.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section aria-labelledby="phone-verification-heading" className="overflow-hidden rounded-[28px] border border-[#dce1d8] bg-[#faf9f5]">
      <div className="flex flex-col gap-3 border-b border-[#e7e7df] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#153f37] text-[#e7d182]"><ShieldCheck className="size-4" aria-hidden="true" /></span>
          <div>
            <h1 className="text-lg font-extrabold text-[#173c34]" id="phone-verification-heading">Verify your phone</h1>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#748b83]">This proves possession of the current phone number on your clinic record. It does not grant SMS permission, enroll you in marketing, or authorize clinical messaging.</p>
          </div>
        </div>
        <Badge tone={state?.verified ? "teal" : "slate"}>{state?.verified ? "Phone verified" : "Verification needed"}</Badge>
      </div>

      <div className="space-y-4 p-5">
        {loading ? <p className="flex items-center gap-2 text-sm text-[#657b73]" role="status"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Loading verification status…</p> : null}
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900" role="alert">{error}</p> : null}
        {notice ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-950" role="status">{notice}</p> : null}

        {!loading && state ? <>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#f3f0e8] p-4">
            <MessageSquareText className="size-5 text-[#3b7c6e]" aria-hidden="true" />
            <div className="min-w-0 flex-1"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#7b8e87]">Current phone on file</p><p className="mt-1 text-sm font-extrabold text-[#173c34]">{state.maskedPhone ?? "No valid phone number on file"}</p></div>
            {state.verified && state.verifiedAt ? <p className="text-[10px] text-[#748b83]">Verified {new Date(state.verifiedAt).toLocaleString()}</p> : null}
          </div>

          {!state.hasPhone ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">Ask your clinic to add or correct your phone number before verification.</p> : null}

          {state.hasPhone && !state.verified ? <div className="space-y-4">
            {!state.fundingReady ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-950"><strong>Cost control:</strong> {fundingUnavailable} Klinikos will not silently subsidize or charge this provider call.</div> : <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[12px] leading-5 text-emerald-950"><strong>Verification funding available.</strong> Sending a code still proves phone possession only and does not create SMS permission.</div>}
            <Button disabled={working || !state.fundingReady} onClick={sendCode} type="button" variant="secondary">{working && !codeSent ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <MessageSquareText className="size-4" aria-hidden="true" />}{codeSent ? "Send another code" : "Send verification code"}</Button>

            {codeSent ? <div className="max-w-md space-y-3 rounded-2xl border border-[#dce1d8] bg-white p-4">
              <label className="block text-xs font-extrabold text-[#173c34]" htmlFor="portal-phone-code">Verification code</label>
              <input autoComplete="one-time-code" className="h-12 w-full rounded-xl border border-[#cfd8d2] bg-white px-3 text-base font-bold tracking-[.18em] text-[#173c34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276c5e]" disabled={working} id="portal-phone-code" inputMode="numeric" maxLength={10} onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))} pattern="[0-9]*" placeholder="Enter code" value={code} />
              <Button disabled={working || code.length < 4} onClick={verifyCode} type="button" variant="primary">{working ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}Verify phone</Button>
            </div> : null}
          </div> : null}

          {state.verified ? <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p><strong>Phone possession verified.</strong> SMS still requires the appropriate permission, tenant routing, fixed message policy, funding authorization and production gate.</p></div> : null}
        </> : null}
      </div>
    </section>
  );
}
