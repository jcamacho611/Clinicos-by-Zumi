"use client";

import { useState, type FormEvent } from "react";

export function LuxeBookingEvidenceForm({ leadId }: { leadId: string }) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const scheduledValue = String(form.get("scheduledAt") ?? "");
    const receivedValue = String(form.get("receivedAt") ?? "");
    const scheduledAt = scheduledValue ? new Date(scheduledValue) : null;
    const receivedAt = receivedValue ? new Date(receivedValue) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || !receivedAt || Number.isNaN(receivedAt.getTime())) {
      setNotice("Enter a valid appointment time and evidence received time.");
      return;
    }

    setBusy(true);
    setNotice("Verifying booking evidence…");
    try {
      const response = await fetch(`/api/luxe-medi/leads/${encodeURIComponent(leadId)}/booking-evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: String(form.get("provider") ?? ""),
          externalReference: String(form.get("externalReference") ?? ""),
          scheduledAt: scheduledAt.toISOString(),
          evidenceSource: String(form.get("evidenceSource") ?? ""),
          receivedAt: receivedAt.toISOString(),
          note: String(form.get("note") ?? ""),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Booking evidence could not be verified.");
      if (payload.data?.inserted === false) {
        setNotice("That booking reference is already verified for this lead.");
        return;
      }
      formElement.reset();
      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Booking evidence could not be verified.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
      <summary className="cursor-pointer text-[12px] font-extrabold uppercase tracking-[.12em] text-emerald-800">Verify booking evidence</summary>
      <p className="mt-2 text-[12px] leading-5 text-emerald-900/70">
        Use only after checking the authoritative booking source. This verifies the appointment booking only; it does not verify payment, treatment eligibility, or service completion.
      </p>
      <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-[12px] font-bold text-slate-600">
          Booking source
          <select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" defaultValue="godaddy_booking" name="provider">
            <option value="godaddy_booking">GoDaddy booking system</option>
            <option value="internal_scheduler">Internal scheduler</option>
            <option value="phone_confirmation">Phone-confirmed booking</option>
            <option value="other">Other authoritative source</option>
          </select>
        </label>
        <label className="text-[12px] font-bold text-slate-600">
          Evidence source
          <select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" defaultValue="booking_dashboard" name="evidenceSource">
            <option value="booking_dashboard">Booking dashboard</option>
            <option value="confirmation_email">Confirmation email</option>
            <option value="internal_scheduler">Internal scheduler</option>
            <option value="staff_phone_confirmation">Staff phone confirmation</option>
            <option value="other_authoritative_source">Other authoritative source</option>
          </select>
        </label>
        <label className="text-[12px] font-bold text-slate-600">
          Booking reference
          <input autoComplete="off" className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" maxLength={180} minLength={4} name="externalReference" required />
        </label>
        <label className="text-[12px] font-bold text-slate-600">
          Appointment time
          <input className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" name="scheduledAt" required type="datetime-local" />
        </label>
        <label className="text-[12px] font-bold text-slate-600 sm:col-span-2">
          Evidence checked at
          <input className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" name="receivedAt" required type="datetime-local" />
        </label>
        <label className="text-[12px] font-bold text-slate-600 sm:col-span-2">
          Verification note
          <textarea className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" maxLength={800} minLength={8} name="note" placeholder="Document what source you checked and what booking details were confirmed. Do not add clinical information." required />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button className="rounded-lg bg-emerald-950 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50" disabled={busy} type="submit">
            {busy ? "Verifying…" : "Verify booking evidence"}
          </button>
          <p aria-live="polite" className="text-[12px] text-slate-500">{notice}</p>
        </div>
      </form>
    </details>
  );
}
