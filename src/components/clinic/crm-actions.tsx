"use client";

import { useState } from "react";
import { Check, LoaderCircle, MessageSquareText, Plus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CRMWorkspace } from "@/lib/repositories/crm-repository";

const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50";
const areaClass = "min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50";

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "CRM action failed.");
}

export function LeadCreateAction({ enabled }: { enabled: boolean }) {
  const [name, setName] = useState("New prospective client");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("website");
  const [serviceInterest, setServiceInterest] = useState("Consultation");
  const [value, setValue] = useState("250");
  const [followUp, setFollowUp] = useState("");
  const [notes, setNotes] = useState("Captured through the public request path.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post("/api/crm", { name, email: email || null, phone: phone || null, source, serviceInterest, estimatedValueCents: Math.round(Number(value || 0) * 100), followUpDueAt: followUp ? `${followUp}T00:00:00.000Z` : null, notes }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Lead creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Your role can review revenue recovery but cannot create leads.</p>;
  return <div className="space-y-3 p-5"><Input aria-label="Lead name" onChange={(event) => setName(event.target.value)} placeholder="Contact name" value={name} /><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Lead email" onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" value={email} /><Input aria-label="Lead phone" onChange={(event) => setPhone(event.target.value)} placeholder="Phone" value={phone} /></div><div className="grid gap-3 sm:grid-cols-2"><select aria-label="Lead source" className={selectClass} onChange={(event) => setSource(event.target.value)} value={source}><option value="website">Website</option><option value="social">Social</option><option value="phone">Phone</option><option value="referral">Referral</option><option value="walk_in">Walk-in</option><option value="reactivation">Reactivation</option><option value="other">Other</option></select><Input aria-label="Service interest" onChange={(event) => setServiceInterest(event.target.value)} placeholder="Service interest" value={serviceInterest} /></div><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Estimated lead value" min="0" onChange={(event) => setValue(event.target.value)} placeholder="Estimated value" type="number" value={value} /><Input aria-label="Lead follow-up due" onChange={(event) => setFollowUp(event.target.value)} type="date" value={followUp} /></div><textarea aria-label="Lead notes" className={areaClass} onChange={(event) => setNotes(event.target.value)} value={notes} /><Button disabled={busy || name.trim().length < 2} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Capture lead</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function LeadTransitionAction({ lead, enabled }: { lead: CRMWorkspace["leads"][number]; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function transition(action: "contact" | "book" | "lose" | "reactivate" | "complete") {
    setBusy(true); setError(null);
    try { await post(`/api/crm/leads/${lead.id}/transition`, { action, note: `Human revenue workflow recorded: ${action}.`, ...(action === "lose" ? { lostReason: "Lead did not convert after documented follow-up." } : {}) }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Lead transition failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="mt-4 flex flex-wrap gap-2">{["new", "contacted"].includes(lead.status) && <Button disabled={busy} onClick={() => transition("contact")} size="sm" variant="secondary"><MessageSquareText className="size-3.5" /> Contact</Button>}{["contacted", "new"].includes(lead.status) && <Button disabled={busy} onClick={() => transition("book")} size="sm" variant="primary"><Check className="size-3.5" /> Booked</Button>}{["new", "contacted"].includes(lead.status) && <Button disabled={busy} onClick={() => transition("lose")} size="sm" variant="ghost"><X className="size-3.5" /> Lost</Button>}{lead.status === "booked" && <Button disabled={busy} onClick={() => transition("complete")} size="sm" variant="secondary"><Check className="size-3.5" /> Completed</Button>}{lead.status === "lost" && <Button disabled={busy} onClick={() => transition("reactivate")} size="sm" variant="secondary">Reactivate</Button>}{error && <p className="basis-full text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function LeadMessageAction({ leadId, enabled }: { leadId: string; enabled: boolean }) {
  const [body, setBody] = useState("Checking in to help with your next appointment step.");
  const [channel, setChannel] = useState("sms");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post(`/api/crm/leads/${leadId}/messages`, { channel, body, direction: "OUTBOUND" }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Lead message failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-3"><div className="flex items-center gap-2"><select aria-label="Lead message channel" className={selectClass} onChange={(event) => setChannel(event.target.value)} value={channel}><option value="sms">SMS adapter</option><option value="email">Email adapter</option><option value="phone">Phone note</option><option value="social">Social inquiry</option></select><Send className="size-4 text-violet-600" /></div><textarea aria-label="Lead message body" className={`${areaClass} mt-2`} onChange={(event) => setBody(event.target.value)} value={body} /><Button disabled={busy || body.trim().length < 2} onClick={submit} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Record follow-up</Button>{error && <p className="mt-2 text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}
