"use client";

import { useState } from "react";

export function LuxeLeadClaimButton({ leadId }: { leadId: string }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function claim() {
    setBusy(true);
    setNotice("Claiming…");
    try {
      const response = await fetch(`/api/luxe-medi/leads/${encodeURIComponent(leadId)}/claim`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Lead could not be claimed.");
      setNotice(payload.data?.claimed === false ? "Already assigned to you." : "Lead assigned to you. Updating queue…");
      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Lead could not be claimed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12px] font-extrabold uppercase tracking-[.1em] text-slate-700 hover:bg-slate-100 disabled:opacity-50" disabled={busy} onClick={claim} type="button">{busy ? "Claiming…" : "Claim this lead"}</button>
      <p aria-live="polite" className="text-[12px] text-slate-500">{notice}</p>
    </div>
  );
}
