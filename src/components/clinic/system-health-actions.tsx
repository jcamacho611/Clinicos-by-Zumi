"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SystemHealthWorkspace } from "@/lib/repositories/system-health-repository";

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "System health action failed.");
}

export function ReliabilityEventCreateAction({ enabled }: { enabled: boolean }) {
  const [category, setCategory] = useState("incident");
  const [severity, setSeverity] = useState("needs_attention");
  const [title, setTitle] = useState("Manual interface review");
  const [summary, setSummary] = useState("Document an integration or operational issue while the adapter is unavailable.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post("/api/system-health", { category, severity, title, summary, source: "manual_fallback" }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create event."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Your role can review health but cannot create events.</p>;
  return <div className="space-y-3 p-5"><div className="grid gap-3 sm:grid-cols-2"><select aria-label="Reliability event category" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" onChange={(event) => setCategory(event.target.value)} value={category}><option value="incident">Incident</option><option value="maintenance">Maintenance</option><option value="deployment">Deployment</option><option value="backup">Backup</option><option value="service">Service status</option></select><select aria-label="Reliability event severity" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" onChange={(event) => setSeverity(event.target.value)} value={severity}><option value="normal">Normal</option><option value="needs_attention">Needs attention</option><option value="urgent">Urgent</option></select></div><input aria-label="Reliability event title" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-teal-400" onChange={(event) => setTitle(event.target.value)} value={title} /><textarea aria-label="Reliability event summary" className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-teal-400" onChange={(event) => setSummary(event.target.value)} value={summary} /><Button disabled={busy || title.trim().length < 4} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Log event</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function IntegrationRetryAction({ eventId, enabled }: { eventId: string; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function retry() {
    setBusy(true); setError(null);
    try { await post(`/api/system-health/integration-events/${eventId}/retry`, { note: "Human operator queued a retry; adapter delivery remains separately verified." }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not queue retry."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="flex items-center gap-2"><Button disabled={busy} onClick={retry} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />} Queue retry</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function ReliabilityEventTransitionAction({ event, enabled }: { event: SystemHealthWorkspace["events"][number]; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const action = event.status === "resolved" ? "reopen" : event.status === "open" ? "acknowledge" : "resolve";
  async function transition() {
    setBusy(true); setError(null);
    try { await post(`/api/system-health/events/${event.id}/transition`, { action, note: `Human operator recorded ${action} for this reliability event.` }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not transition event."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="flex items-center gap-2"><Button disabled={busy} onClick={transition} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} {action === "acknowledge" ? "Acknowledge" : action === "resolve" ? "Resolve" : "Reopen"}</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}
