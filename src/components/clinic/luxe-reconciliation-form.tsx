"use client";

import { useState, type FormEvent } from "react";

function dollarsToCents(value: string) {
  const match = value.trim().match(/^(\d{1,7})(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const cents = Number.parseInt(match[1], 10) * 100 + Number.parseInt(((match[2] ?? "") + "00").slice(0, 2), 10);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function LuxeReconciliationForm({ leadId }: { leadId: string }) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const amountCents = dollarsToCents(String(form.get("amount") ?? ""));
    const receivedValue = String(form.get("receivedAt") ?? "");
    const receivedAt = receivedValue ? new Date(receivedValue) : null;
    if (!amountCents || !receivedAt || Number.isNaN(receivedAt.getTime())) {
      setNotice("Enter a valid amount and received time.");
      return;
    }

    setBusy(true);
    setNotice("Recording evidence…");
    try {
      const response = await fetch(`/api/luxe-medi/leads/${encodeURIComponent(leadId)}/payment-evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: String(form.get("provider") ?? ""),
          externalReference: String(form.get("externalReference") ?? ""),
          amountCents,
          currency: "USD",
          paymentKind: String(form.get("paymentKind") ?? ""),
          evidenceSource: String(form.get("evidenceSource") ?? ""),
          receivedAt: receivedAt.toISOString(),
          note: String(form.get("note") ?? ""),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Evidence could not be recorded.");
      if (payload.data?.inserted === false) {
        setNotice("That reference is already recorded for this lead.");
        return;
      }
      formElement.reset();
      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Evidence could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <summary className="cursor-pointer text-[12px] font-extrabold uppercase tracking-[.12em] text-slate-600">Record payment evidence</summary>
      <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-[12px] font-bold text-slate-600">Provider<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" defaultValue="godaddy_payments" name="provider"><option value="godaddy_payments">GoDaddy Payments</option><option value="square">Square</option><option value="stripe">Stripe</option><option value="cash">Cash</option><option value="other">Other</option></select></label>
        <label className="text-[12px] font-bold text-slate-600">Type<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" defaultValue="deposit" name="paymentKind"><option value="deposit">Deposit</option><option value="service_payment">Service payment</option><option value="membership">Membership</option><option value="package">Package</option><option value="other">Other</option></select></label>
        <label className="text-[12px] font-bold text-slate-600">External reference<input autoComplete="off" className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" maxLength={180} minLength={4} name="externalReference" required /></label>
        <label className="text-[12px] font-bold text-slate-600">Amount (USD)<input className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" inputMode="decimal" name="amount" placeholder="150.00" required /></label>
        <label className="text-[12px] font-bold text-slate-600">Evidence source<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" defaultValue="processor_dashboard" name="evidenceSource"><option value="processor_dashboard">Processor dashboard</option><option value="receipt">Receipt</option><option value="bank_record">Bank record</option><option value="cash_log">Cash log</option><option value="other">Other</option></select></label>
        <label className="text-[12px] font-bold text-slate-600">Received at<input className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" name="receivedAt" required type="datetime-local" /></label>
        <label className="text-[12px] font-bold text-slate-600 sm:col-span-2">Review note<textarea className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" maxLength={800} minLength={8} name="note" placeholder="Document the source you checked and what you confirmed." required /></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50" disabled={busy} type="submit">{busy ? "Recording…" : "Record reconciliation"}</button><p aria-live="polite" className="text-[12px] text-slate-500">{notice}</p></div>
      </form>
    </details>
  );
}
