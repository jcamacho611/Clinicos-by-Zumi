"use client";

import { FormEvent, useState } from "react";

function dollarsToCents(value: string) {
  const trimmed = value.trim();
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = Number.parseInt(whole, 10) * 100 + Number.parseInt((fraction + "00").slice(0, 2), 10);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function LuxePaymentEvidenceForm({ leadId }: { leadId: string }) {
  const [state, setState] = useState<{ busy: boolean; message: string; ok: boolean }>({ busy: false, message: "", ok: false });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amountCents = dollarsToCents(String(form.get("amount") ?? ""));
    const receivedLocal = String(form.get("receivedAt") ?? "");
    if (!amountCents || !receivedLocal) {
      setState({ busy: false, ok: false, message: "Enter a valid amount and received time." });
      return;
    }

    const receivedAt = new Date(receivedLocal);
    if (Number.isNaN(receivedAt.getTime())) {
      setState({ busy: false, ok: false, message: "Received time is not valid." });
      return;
    }

    setState({ busy: true, ok: false, message: "Recording evidence…" });
    try {
      const response = await fetch(`/api/luxe-medi/leads/${encodeURIComponent(leadId)}/payment-evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: form.get("provider"),
          externalReference: form.get("externalReference"),
          amountCents,
          currency: "USD",
          paymentKind: form.get("paymentKind"),
          evidenceSource: form.get("evidenceSource"),
          receivedAt: receivedAt.toISOString(),
          note: form.get("note"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Payment evidence could not be recorded.");
      setState({ busy: false, ok: true, message: payload.data?.inserted === false ? "This evidence was already recorded." : "Payment evidence recorded. Refresh to update attribution totals." });
      if (payload.data?.inserted !== false) event.currentTarget.reset();
    } catch (error) {
      setState({ busy: false, ok: false, message: error instanceof Error ? error.message : "Payment evidence could not be recorded." });
    }
  }

  return (
    <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <summary className="cursor-pointer text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-600">Record payment evidence</summary>
      <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-[10px] font-bold text-slate-600">Provider<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" defaultValue="godaddy_payments" name="provider"><option value="godaddy_payments">GoDaddy Payments</option><option value="square">Square</option><option value="stripe">Stripe</option><option value="cash">Cash</option><option value="other">Other</option></select></label>
        <label className="text-[10px] font-bold text-slate-600">Payment type<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" defaultValue="deposit" name="paymentKind"><option value="deposit">Deposit</option><option value="service_payment">Service payment</option><option value="membership">Membership</option><option value="package">Package</option><option value="other">Other</option></select></label>
        <label className="text-[10px] font-bold text-slate-600">External reference<input autoComplete="off" className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" maxLength={180} minLength={4} name="externalReference" placeholder="Processor receipt / transaction ID" required /></label>
        <label className="text-[10px] font-bold text-slate-600">Amount (USD)<input className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" inputMode="decimal" name="amount" placeholder="150.00" required /></label>
        <label className="text-[10px] font-bold text-slate-600">Evidence source<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" defaultValue="processor_dashboard" name="evidenceSource"><option value="processor_dashboard">Processor dashboard</option><option value="receipt">Receipt</option><option value="bank_record">Bank record</option><option value="cash_log">Cash log</option><option value="other">Other</option></select></label>
        <label className="text-[10px] font-bold text-slate-600">Received at<input className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" name="receivedAt" required type="datetime-local" /></label>
        <label className="text-[10px] font-bold text-slate-600 sm:col-span-2">Reconciliation note<textarea className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" maxLength={800} minLength={8} name="note" placeholder="What authoritative source did you check? Do not enter card numbers or sensitive authentication data." required /></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50" disabled={state.busy} type="submit">{state.busy ? "Recording…" : "Record reconciliation"}</button><p aria-live="polite" className={`text-[10px] ${state.ok ? "text-emerald-700" : "text-slate-500"}`}>{state.message}</p></div>
      </form>
    </details>
  );
}
