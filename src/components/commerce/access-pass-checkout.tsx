"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CircleAlert, LoaderCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AccessPassView = {
  key: string;
  name: string;
  audience: string;
  summary: string;
  capabilities: string[];
  requiredLegalDocuments: string[];
  postPurchaseReview: string;
  purchasable: boolean;
};

type CheckoutResponse = {
  error?: string;
  checkoutUrl?: string;
  verificationUrl?: string;
  postPurchaseReview?: string;
};

const capabilityLabels: Record<string, string> = {
  evaluation_materials: "Protected evaluation materials",
  clinic_workspace: "Clinic workspace entry",
  grid_browse: "Browse the GRID marketplace",
  grid_publish_listing: "Publish service listings",
  grid_send_request: "Send GRID requests",
  grid_receive_request: "Receive and decide GRID requests",
  grid_list_location: "List chairs, rooms, and partner locations",
  grid_receive_payout: "Receive GRID payout records",
};

export function AccessPassCheckout({ passes, adapterConfigured }: { passes: AccessPassView[]; adapterConfigured: boolean }) {
  const [selected, setSelected] = useState<string>(passes.find((pass) => pass.purchasable)?.key ?? passes[0]?.key ?? "");
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [verificationNeeded, setVerificationNeeded] = useState(false);

  const activePass = passes.find((pass) => pass.key === selected);
  const canSubmit = Boolean(activePass?.purchasable) && accepted && email.trim().length > 3 && !submitting;

  async function startCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !activePass) return;
    setError("");
    setVerificationNeeded(false);
    setSubmitting(true);
    try {
      const response = await fetch("/api/whop/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tierKey: activePass.key, email: email.trim().toLowerCase(), acceptedTerms: true }),
      });
      const result = await response.json() as CheckoutResponse;
      if (!response.ok || !result.checkoutUrl) {
        setVerificationNeeded(Boolean(result.verificationUrl));
        setError(result.error ?? "We could not start checkout. Please try again.");
        return;
      }
      window.location.assign(result.checkoutUrl);
    } catch {
      setError("We could not reach the checkout service. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-8 lg:grid-cols-[1fr_.72fr] lg:items-start" onSubmit={startCheckout}>
      <div className="grid gap-4">
        {passes.map((pass) => {
          const active = pass.key === selected;
          return (
            <label
              className={`cursor-pointer border p-6 transition ${active ? "border-slate-950 bg-white shadow-[0_18px_50px_rgba(0,0,0,.08)]" : "border-slate-200 bg-white/70 hover:border-slate-400"}`}
              key={pass.key}
            >
              <div className="flex items-start gap-4">
                <input
                  checked={active}
                  className="mt-1.5 accent-slate-950"
                  name="access-pass"
                  onChange={() => setSelected(pass.key)}
                  type="radio"
                  value={pass.key}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-extrabold tracking-[-.03em]">{pass.name}</p>
                    {!pass.purchasable && (
                      <span className="border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-amber-800">
                        Pending Connection
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{pass.summary}</p>
                  <ul className="mt-4 grid gap-1.5">
                    {pass.capabilities.map((capability) => (
                      <li className="text-xs leading-5 text-slate-600" key={capability}>
                        · {capabilityLabels[capability] ?? capability}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-slate-200 pt-3 text-[11px] leading-5 text-slate-500">
                    <strong className="font-bold text-slate-700">After purchase:</strong> {pass.postPurchaseReview}
                  </p>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <aside className="border border-slate-200 bg-white p-6 sm:p-7">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
          <Lock className="size-5 text-[#9a7a1f]" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#9a7a1f]">Checkout</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-.035em]">Continue on Whop</h2>
          </div>
        </div>

        {!adapterConfigured && (
          <p className="mt-5 border border-amber-300 bg-amber-50 px-3 py-3 text-[11px] font-semibold leading-5 text-amber-900">
            Paid entry is <strong>Pending Connection</strong> in this deployment. Whop credentials are not configured, so no checkout can
            be started yet.
          </p>
        )}

        <label className="mt-5 block text-xs font-bold text-slate-700">
          Verified work email
          <Input
            autoComplete="email"
            className="mt-2 h-12"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
            type="email"
            value={email}
          />
        </label>
        <p className="mt-2 text-[10px] leading-4 text-slate-500">
          Use the address you verified at the access gate. Purchases are bound to that verified address.
        </p>

        <label className="mt-5 flex cursor-pointer items-start gap-3 border border-slate-200 p-4 text-[11px] leading-5 text-slate-600">
          <input checked={accepted} className="mt-1 accent-slate-950" onChange={(event) => setAccepted(event.target.checked)} required type="checkbox" />
          <span>
            I agree to the agreements required for this pass
            {activePass?.requiredLegalDocuments.length ? ` (${activePass.requiredLegalDocuments.join(", ").replace(/_/g, " ")})` : ""} and
            understand that purchase does not grant clinical authority, credential verification, or production readiness.
          </span>
        </label>

        {error && (
          <div className="mt-4 flex gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              {error}
              {verificationNeeded && (
                <>
                  {" "}
                  <Link className="underline" href="/access">Verify your work email</Link>.
                </>
              )}
            </span>
          </div>
        )}

        <Button className="mt-5 w-full" disabled={!canSubmit} size="lg" type="submit" variant="primary">
          {submitting ? <><LoaderCircle className="size-4 animate-spin" /> Starting checkout...</> : <>Continue to Whop <ArrowRight className="size-4" /></>}
        </Button>

        <p className="mt-5 border-t border-slate-200 pt-4 text-[10px] leading-5 text-slate-500">
          Payment is processed by Whop. Klinikos records access only after Whop confirms the purchase; a completed payment never bypasses
          credential verification, facility authority review, or clinical safety boundaries.
        </p>
      </aside>
    </form>
  );
}
