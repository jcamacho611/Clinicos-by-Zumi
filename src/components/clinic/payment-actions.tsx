"use client";

import { useState, type FormEvent } from "react";
import { CreditCard, Link2, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { PaymentWorkspace } from "@/lib/repositories/payment-repository";

function parseError(response: Response, payload: unknown) {
  if (response.ok) return null;
  return payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "Payment action failed.";
}

export function PaymentConsole({ workspace }: { workspace: PaymentWorkspace }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(url: string, body: Record<string, unknown>) {
    setBusy(true); setNotice(null);
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      const error = parseError(response, payload);
      if (error) throw new Error(error);
      setNotice("Saved and audited. Refreshing the billing worklist.");
      window.location.reload();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Payment action failed."); }
    finally { setBusy(false); }
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submit("/api/payments", { patientId: form.get("patientId"), amountCents: Math.round(Number(form.get("amount")) * 100), source: form.get("source") });
  }

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submit("/api/payments/links", { patientId: form.get("patientId"), amountCents: Math.round(Number(form.get("linkAmount")) * 100), expiresInDays: 7 });
  }

  async function refund(paymentId: string) {
    const reason = window.prompt("Document the refund reason.", "Patient refund requested and reviewed by billing staff.");
    if (reason) await submit(`/api/payments/${paymentId}/transition`, { action: "refund", reason });
  }

  const outstanding = workspace.balances.reduce((total, balance) => total + balance.balanceCents, 0);
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-400">Open patient balances</p><p className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(outstanding / 100)}</p><p className="mt-1 text-[12px] text-slate-500">Latest tenant-scoped balance snapshots</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-400">Payment links</p><p className="mt-2 text-2xl font-black text-slate-950">{workspace.paymentLinks.filter((link) => link.status === "active").length}</p><p className="mt-1 text-[12px] text-slate-500">Manual fallback ready for checkout adapters</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-400">Payment events</p><p className="mt-2 text-2xl font-black text-slate-950">{workspace.events.length}</p><p className="mt-1 text-[12px] text-slate-500">Every post, link, refund, and package action is logged</p></div>
    </div>
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><CreditCard className="size-4" /></span><div><h3 className="text-sm font-extrabold text-slate-950">Record a payment</h3><p className="mt-1 text-[12px] text-slate-500">Manual posting is available before Stripe or Square is connected.</p></div></div>
          <form className="mt-5 space-y-3" onSubmit={recordPayment}><select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs" name="patientId" required defaultValue=""><option disabled value="">Select patient</option>{workspace.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select><div className="grid grid-cols-2 gap-3"><input className="h-10 rounded-xl border border-slate-200 px-3 text-xs" min="0.01" name="amount" placeholder="Amount" step="0.01" type="number" required /><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs" defaultValue="manual_card" name="source"><option value="manual_card">Manual card</option><option value="manual_cash">Cash</option><option value="stripe">Stripe adapter</option><option value="square">Square adapter</option></select></div><Button className="w-full" disabled={busy} size="sm" type="submit">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <CreditCard className="size-3.5" />} Post payment</Button></form>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700"><Link2 className="size-4" /></span><div><h3 className="text-sm font-extrabold text-slate-950">Create a payment link</h3><p className="mt-1 text-[12px] text-slate-500">The token is returned once and does not contain patient information.</p></div></div><form className="mt-5 space-y-3" onSubmit={createLink}><select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs" name="patientId" required defaultValue=""><option disabled value="">Select patient</option>{workspace.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select><input className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs" min="0.01" name="linkAmount" placeholder="Amount" step="0.01" type="number" required /><Button className="w-full" disabled={busy} size="sm" type="submit" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />} Generate link</Button></form></section>
        {notice && <p className="rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white">{notice}</p>}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-extrabold text-slate-950">Payment activity</h3><p className="mt-1 text-[12px] text-slate-500">Tenant-filtered, patient-linked, and ready for reconciliation.</p></div><Badge tone="teal">Manual fallback</Badge></div><div className="divide-y divide-slate-100">{workspace.payments.length ? workspace.payments.slice(0, 8).map((payment) => <div className="flex items-center gap-3 px-5 py-4" key={payment.id}><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><CreditCard className="size-3.5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{payment.patientName}</p><p className="mt-1 text-[12px] text-slate-400">{payment.source.replaceAll("_", " ")} · {new Date(payment.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p></div><p className="text-xs font-black text-slate-950">{formatCurrency(payment.amountCents / 100)}</p><Badge>{payment.status}</Badge>{payment.status === "posted" && <Button aria-label={`Refund payment for ${payment.patientName}`} onClick={() => refund(payment.id)} size="icon" variant="ghost"><RotateCcw className="size-3.5" /></Button>}</div>) : <p className="p-6 text-xs text-slate-500">No payments posted yet.</p>}</div></section>
    </div>
    <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-extrabold text-slate-950">Memberships and packages</h3><p className="mt-1 text-[12px] text-slate-500">Luxe Medi-ready structures for recurring and session-based services.</p></div><div className="grid gap-3 p-4 sm:grid-cols-2">{workspace.plans.map((plan) => <div className="rounded-xl bg-slate-50 p-4" key={plan.id}><p className="text-xs font-extrabold text-slate-900">{plan.name}</p><p className="mt-1 text-[12px] text-slate-500">{formatCurrency(plan.priceCents / 100)} · {plan.billingInterval} · {plan.includedSessions} sessions</p></div>)}{workspace.memberships.map((membership) => <div className="rounded-xl border border-teal-100 bg-teal-50 p-4" key={membership.id}><p className="text-xs font-extrabold text-teal-950">{membership.patientName}</p><p className="mt-1 text-[12px] text-teal-800">{membership.planName} · {membership.remainingSessions} sessions remaining</p></div>)}{workspace.packagePurchases.map((purchase) => <div className="rounded-xl border border-sky-100 bg-sky-50 p-4" key={purchase.id}><p className="text-xs font-extrabold text-sky-950">{purchase.patientName}</p><p className="mt-1 text-[12px] text-sky-800">{purchase.packageName} · {purchase.remainingSessions} sessions remaining</p></div>)}</div></section><section className="rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-extrabold text-slate-950">Open balances</h3><p className="mt-1 text-[12px] text-slate-500">No payment processor is allowed to receive PHI in descriptions.</p></div><div className="divide-y divide-slate-100">{workspace.balances.map((balance) => <div className="flex items-center gap-3 px-5 py-4" key={balance.id}><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{balance.patientName}</p><p className="mt-1 text-[12px] text-slate-400">{balance.mrn} · as of {new Date(balance.asOf).toLocaleDateString("en-US")}</p></div><p className={`text-sm font-black ${balance.balanceCents > 0 ? "text-rose-700" : "text-teal-700"}`}>{formatCurrency(balance.balanceCents / 100)}</p></div>)}</div></section></div>
  </div>;
}
