"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Copy, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";

type CheckoutView = {
  id: string;
  state: string;
  provider: string;
  productKey: string;
  productLabel: string;
  clinicName: string;
  email: string;
  organizationId: string | null;
  status: string;
  expectedAmountCents: number | null;
  currency: string;
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
};

type Plan = { key: string; label: string; priceLabel: string };

function money(cents: number | null) {
  if (cents === null) return "Review required";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function ClinicActivationDesk({ initialCheckouts, plans }: { initialCheckouts: CheckoutView[]; plans: Plan[] }) {
  const [checkouts, setCheckouts] = useState(initialCheckouts);
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [productKey, setProductKey] = useState(plans[0]?.key ?? "clinic_core");
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [activationUrl, setActivationUrl] = useState("");
  const [confirmIntentId, setConfirmIntentId] = useState("");
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const response = await fetch("/api/admin/commercial/clinic-checkouts", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not refresh clinic checkouts.");
    setCheckouts(payload.checkouts);
  }

  function createCheckout() {
    setError("");
    setActivationUrl("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/commercial/clinic-checkouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_checkout", clinicName, email, productKey }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Checkout could not be created.");
        setCheckoutUrl(payload.result.checkoutUrl);
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Checkout could not be created.");
      }
    });
  }

  function reconcile(intentId: string) {
    if (confirmIntentId !== intentId) {
      setConfirmIntentId(intentId);
      return;
    }
    setError("");
    setCheckoutUrl("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/commercial/clinic-checkouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reconcile", intentId, confirmation: "I_VERIFIED_PAYMENT" }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Payment could not be reconciled.");
        setActivationUrl(payload.result.activationUrl);
        setConfirmIntentId("");
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Payment could not be reconciled.");
      }
    });
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-[#071018] p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.16)] sm:p-9">
        <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Commercial activation</p>
        <h1 className="mt-4 text-4xl font-black tracking-[-.055em]">Payment first. Access second.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">Create the server-owned clinic subscription checkout here. GoDaddy is checkout-only, so payment must be independently reviewed before Klinikos activates the subscription or issues the owner setup link.</p>
      </section>

      {error && <div className="border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800" role="alert">{error}</div>}

      <section className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
        <article className="border border-slate-200 bg-white p-6">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#174ea6]">1. Create subscription checkout</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600">Clinic name<input className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#174ea6]" value={clinicName} onChange={(event) => setClinicName(event.target.value)} /></label>
            <label className="text-xs font-bold text-slate-600">Owner email<input className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#174ea6]" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          </div>
          <label className="mt-4 block text-xs font-bold text-slate-600">Clinic plan<select className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#174ea6]" value={productKey} onChange={(event) => setProductKey(event.target.value)}>{plans.map((plan) => <option key={plan.key} value={plan.key}>{plan.label} · {plan.priceLabel}</option>)}</select></label>
          <button className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#174ea6] px-5 text-xs font-black text-white disabled:opacity-50" disabled={pending || !clinicName.trim() || !email.trim()} onClick={createCheckout}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />} Create checkout</button>
          {checkoutUrl && <div className="mt-5 border border-cyan-200 bg-cyan-50 p-4"><p className="text-xs font-black text-cyan-950">Checkout created. Send/open the official payment rail.</p><div className="mt-3 flex flex-wrap gap-2"><a className="inline-flex min-h-10 items-center gap-2 bg-cyan-800 px-4 text-xs font-black text-white" href={checkoutUrl} target="_blank" rel="noreferrer">Open checkout <ExternalLink className="size-3.5" /></a><button className="inline-flex min-h-10 items-center gap-2 border border-cyan-300 px-4 text-xs font-black text-cyan-900" onClick={() => copy(checkoutUrl)}>Copy link <Copy className="size-3.5" /></button></div><p className="mt-3 text-[10px] leading-5 text-cyan-800">Opening or returning from checkout does not mark payment successful.</p></div>}
        </article>

        <article className="border border-amber-200 bg-amber-50 p-6">
          <ShieldCheck className="size-5 text-amber-700" />
          <h2 className="mt-4 text-lg font-black text-amber-950">Manual reconciliation is a consequential action.</h2>
          <p className="mt-3 text-xs leading-6 text-amber-900">Only confirm after you independently see the expected payment in the real GoDaddy payment records. The first click arms the action. The second records manual evidence, activates the paid plan, initializes configured allowances, and issues a signed owner-activation link.</p>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.12em] text-amber-800">Processor verification remains false until a real processor verification connector exists.</p>
        </article>
      </section>

      {activationUrl && <section className="border border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" /><div className="min-w-0"><p className="text-sm font-black text-emerald-950">Payment recorded and subscription activated.</p><p className="mt-1 text-xs leading-6 text-emerald-800">Send this signed setup link to the clinic owner. It expires automatically and cannot choose a different organization, email, plan, role, or price.</p><div className="mt-3 flex flex-wrap gap-2"><button className="inline-flex min-h-10 items-center gap-2 bg-emerald-800 px-4 text-xs font-black text-white" onClick={() => copy(activationUrl)}>Copy activation link <Copy className="size-3.5" /></button><a className="inline-flex min-h-10 items-center gap-2 border border-emerald-300 px-4 text-xs font-black text-emerald-900" href={activationUrl} target="_blank" rel="noreferrer">Open link <ExternalLink className="size-3.5" /></a></div></div></div></section>}

      <section className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-5"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Clinic subscription checkouts</p><p className="mt-1 text-xs text-slate-500">{checkouts.length} recent records</p></div><button className="inline-flex min-h-10 items-center gap-2 border border-slate-300 px-4 text-xs font-black text-slate-700 disabled:opacity-50" disabled={pending} onClick={() => startTransition(() => refresh().catch((caught) => setError(caught instanceof Error ? caught.message : "Refresh failed.")))}><RefreshCw className="size-3.5" /> Refresh</button></div>
        <div className="divide-y divide-slate-100">{checkouts.length === 0 ? <p className="p-6 text-sm text-slate-500">No clinic subscription checkouts yet.</p> : checkouts.map((checkout) => <article className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center" key={checkout.id}><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-slate-950">{checkout.clinicName}</p><span className="bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-slate-600">{checkout.status}</span></div><p className="mt-1 text-xs text-slate-500">{checkout.email} · {checkout.productLabel} · {money(checkout.expectedAmountCents)}</p><p className="mt-2 text-[10px] text-slate-400">Intent {checkout.id.slice(0, 8)} · {checkout.organizationId ? "organization linked" : "pre-provisioning"}</p></div><div>{checkout.status === "created" ? <button className={`min-h-10 px-4 text-xs font-black ${confirmIntentId === checkout.id ? "bg-amber-600 text-white" : "border border-slate-300 text-slate-700"}`} disabled={pending} onClick={() => reconcile(checkout.id)}>{confirmIntentId === checkout.id ? "Confirm: payment verified" : "Record verified payment"}</button> : <span className="text-xs font-black text-emerald-700">Payment evidence applied</span>}</div></article>)}</div>
      </section>
    </div>
  );
}
