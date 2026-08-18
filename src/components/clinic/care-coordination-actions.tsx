"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function submitTransition(url: string, action: string, note: string) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note }) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Transition failed.");
}

function ActionRow({ url, actions }: { url: string; actions: Array<{ action: string; label: string; variant?: "primary" | "secondary" | "danger" }> }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(action: string) {
    setBusy(true);
    setError(null);
    try { await submitTransition(url, action, note); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Transition failed."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 border-t border-slate-100 pt-3"><Input aria-label="Transition note" onChange={(event) => setNote(event.target.value)} placeholder="Required human action note" value={note} /><div className="mt-2 flex flex-wrap gap-2">{actions.map((item) => <Button disabled={busy || note.trim().length < 8} key={item.action} onClick={() => run(item.action)} size="sm" variant={item.variant ?? "secondary"}>{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : null}{item.label}</Button>)}</div>{error && <p className="mt-2 text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function HandoffActions({ handoffId, status }: { handoffId: string; status: string }) {
  if (status === "resolved" || status === "rejected") return null;
  return <ActionRow url={`/api/care-handoffs/${handoffId}/transition`} actions={status === "sent" ? [{ action: "acknowledge", label: "Acknowledge", variant: "primary" }, { action: "clarify", label: "Request clarification" }, { action: "escalate", label: "Escalate", variant: "danger" }] : [{ action: "resolve", label: "Resolve", variant: "primary" }, { action: "clarify", label: "Request clarification" }, { action: "escalate", label: "Escalate", variant: "danger" }]} />;
}

export function TaskActions({ taskId, status }: { taskId: string; status: string }) {
  return <ActionRow url={`/api/tasks/${taskId}/transition`} actions={status === "completed" ? [{ action: "reopen", label: "Reopen" }] : [{ action: "complete", label: "Complete", variant: "primary" }]} />;
}

export function EscalationActions({ escalationId, status }: { escalationId: string; status: string }) {
  return <ActionRow url={`/api/escalations/${escalationId}/transition`} actions={status === "resolved" ? [{ action: "reopen", label: "Reopen" }] : status === "open" ? [{ action: "acknowledge", label: "Acknowledge", variant: "primary" }, { action: "resolve", label: "Resolve", variant: "danger" }] : [{ action: "resolve", label: "Resolve", variant: "danger" }]} />;
}
