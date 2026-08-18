"use client";

import { useState, type FormEvent } from "react";

export function LuxeReactivationReviewForm({ leadId }: { leadId: string }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const dueValue = String(form.get("followUpDueAt") ?? "");
    const due = dueValue ? new Date(dueValue) : null;
    if (!due || Number.isNaN(due.getTime())) {
      setNotice("Choose a valid review due time.");
      return;
    }

    setBusy(true);
    setNotice("Creating review task…");
    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reactivate",
          note: String(form.get("note") ?? ""),
          followUpDueAt: due.toISOString(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Reactivation review could not be created.");
      setNotice("Moved to reactivation review. No message was sent.");
      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Reactivation review could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
      <summary className="cursor-pointer text-[12px] font-extrabold uppercase tracking-[.12em] text-amber-800">Review for reactivation</summary>
      <form className="mt-3 grid gap-3" onSubmit={submit}>
        <p className="text-[12px] leading-4 text-amber-800">This creates human follow-up work only. Confirm the appropriate communication channel and consent before contacting the person.</p>
        <label className="text-[12px] font-bold text-slate-600">Review due at<input className="mt-1 w-full rounded-lg border border-amber-200 bg-white p-2 text-xs" name="followUpDueAt" required type="datetime-local" /></label>
        <label className="text-[12px] font-bold text-slate-600">Reason for reopening<textarea className="mt-1 min-h-20 w-full rounded-lg border border-amber-200 bg-white p-2 text-xs" maxLength={800} minLength={8} name="note" placeholder="Why is this opportunity worth a human reactivation review now?" required /></label>
        <div className="flex flex-wrap items-center gap-3"><button className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50" disabled={busy} type="submit">{busy ? "Creating…" : "Create reactivation review"}</button><p aria-live="polite" className="text-[12px] text-amber-800">{notice}</p></div>
      </form>
    </details>
  );
}
