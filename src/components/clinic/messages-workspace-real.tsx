"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, MessageCircle, Plus, RefreshCcw, Send, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/clinic/workspace-kit";
import type { InternalMessagingWorkspace } from "@/lib/repositories/internal-message-repository";

const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50";

type WorkspaceState = InternalMessagingWorkspace;

export function MessagesWorkspaceReal() {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("internal_coordination");
  const [assignedTeam, setAssignedTeam] = useState("front_desk");
  const [newBody, setNewBody] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async (preferredThreadId?: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/messages", { headers: { Accept: "application/json" }, cache: "no-store" });
      const payload = await response.json().catch(() => null) as { error?: string; data?: WorkspaceState } | null;
      if (!response.ok || !payload?.data) throw new Error(payload?.error ?? "Internal messages could not be loaded.");
      const data = payload.data;
      setWorkspace(data);
      setSelectedId((current) => preferredThreadId ?? current ?? data.threads[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Internal messages could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleThreads = useMemo(() => {
    if (!workspace) return [];
    const query = search.trim().toLocaleLowerCase();
    if (!query) return workspace.threads;
    return workspace.threads.filter((thread) => [thread.subject, thread.patientName, thread.patientMrn ?? "", thread.category, thread.assignedTeam ?? ""].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [workspace, search]);
  const selected = workspace?.threads.find((thread) => thread.id === selectedId) ?? visibleThreads[0] ?? null;

  async function createThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ patientId: patientId || null, subject, category, assignedTeam: assignedTeam || null, body: newBody }),
      });
      const payload = await response.json().catch(() => null) as { error?: string; data?: { threadId: string } } | null;
      const threadId = payload?.data?.threadId;
      if (!response.ok || !threadId) throw new Error(payload?.error ?? "The internal thread could not be created.");
      setPatientId(""); setSubject(""); setCategory("internal_coordination"); setAssignedTeam("front_desk"); setNewBody(""); setNewOpen(false);
      await load(threadId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The internal thread could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function createReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(selected.id)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "The internal message could not be added.");
      setReply("");
      await load(selected.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The internal message could not be added.");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !workspace) {
    return <Card className="flex min-h-72 items-center justify-center"><p className="flex items-center gap-2 text-sm font-bold text-slate-500"><LoaderCircle className="size-5 animate-spin" /> Loading internal messages…</p></Card>;
  }
  if (!workspace) {
    return <Card className="p-7"><p className="text-sm font-extrabold text-slate-950">Internal messaging is unavailable.</p><p className="mt-2 text-xs text-slate-500">{error || "The tenant message workspace could not be loaded."}</p><Button className="mt-4" onClick={() => void load()} size="sm" variant="secondary"><RefreshCcw className="size-3.5" /> Retry</Button></Card>;
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-teal-700">Messages</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-slate-950">Internal coordination is live. External delivery stays truthful.</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">Create patient-linked or organization threads inside Klinikos now. SMS, email, voice, and patient-facing delivery remain separate connections and are never represented as sent here.</p></div>
      <div className="flex flex-wrap gap-2">{workspace.canCreate && <Button onClick={() => setNewOpen(true)} variant="primary"><Plus className="size-4" /> New internal thread</Button>}<Button asChild variant="secondary"><Link href="/integrations">External connections <ArrowRight className="size-4" /></Link></Button></div>
    </div>

    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-4 shrink-0" /><p><strong>Delivery boundary:</strong> this surface writes only to the `klinikos_internal` channel. Patient delivery stays off until an approved connector passes its contract, security, PHI, and configuration gates.</p></div></div>

    {newOpen && workspace.canCreate && <Card className="p-5"><form onSubmit={createThread}><div className="flex items-start gap-3"><div><p className="text-sm font-extrabold text-slate-950">New internal thread</p><p className="mt-1 text-[10px] text-slate-500">Stored inside Klinikos. The patient is not contacted.</p></div><Button aria-label="Close new thread form" className="ml-auto" disabled={busy} onClick={() => setNewOpen(false)} size="icon" type="button" variant="ghost"><X className="size-4" /></Button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-xs font-bold text-slate-700">Patient<select className={`mt-2 ${selectClass}`} onChange={(event) => setPatientId(event.target.value)} value={patientId}><option value="">Organization thread</option>{workspace.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label><label className="text-xs font-bold text-slate-700">Assigned team<Input className="mt-2" maxLength={80} onChange={(event) => setAssignedTeam(event.target.value)} value={assignedTeam} /></label><label className="text-xs font-bold text-slate-700">Subject<Input className="mt-2" maxLength={160} onChange={(event) => setSubject(event.target.value)} required value={subject} /></label><label className="text-xs font-bold text-slate-700">Category<Input className="mt-2" maxLength={80} onChange={(event) => setCategory(event.target.value)} required value={category} /></label><label className="text-xs font-bold text-slate-700 md:col-span-2">Internal message<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50" maxLength={5000} onChange={(event) => setNewBody(event.target.value)} required value={newBody} /></label></div><div className="mt-5 flex justify-end"><Button disabled={busy || subject.trim().length < 3 || category.trim().length < 2 || !newBody.trim()} type="submit">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Create internal thread</Button></div></form></Card>}

    {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}

    <Card className="min-h-[620px] overflow-hidden"><div className="grid min-h-[620px] lg:grid-cols-[310px_1fr]">
      <aside className="border-b border-slate-200 bg-slate-50/60 lg:border-b-0 lg:border-r"><div className="border-b border-slate-200 p-4"><p className="text-xs font-extrabold text-slate-950">Internal threads</p><Input className="mt-3" onChange={(event) => setSearch(event.target.value)} placeholder="Search subject, patient, MRN..." type="search" value={search} /></div><div className="p-2">{visibleThreads.map((thread) => <button className={`w-full rounded-xl p-3 text-left transition ${selected?.id === thread.id ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-white"}`} key={thread.id} onClick={() => setSelectedId(thread.id)} type="button"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800"><MessageCircle className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-slate-900">{thread.subject}</p><p className="mt-1 truncate text-[10px] text-slate-500">{thread.patientName}{thread.patientMrn ? ` · ${thread.patientMrn}` : ""}</p><div className="mt-2 flex flex-wrap items-center gap-1.5"><StatusBadge status={thread.status} /><Badge tone="slate">{thread.messages.length} messages</Badge></div></div></div></button>)}{visibleThreads.length === 0 && <p className="p-4 text-xs text-slate-500">No internal threads match this view.</p>}</div></aside>
      <section className="flex min-w-0 flex-col bg-white">{selected ? <><div className="flex flex-wrap items-start gap-3 border-b border-slate-200 p-4"><div><p className="text-sm font-extrabold text-slate-950">{selected.subject}</p><p className="mt-1 text-[10px] text-slate-500">{selected.patientName}{selected.patientMrn ? ` · ${selected.patientMrn}` : ""} · {selected.category.replaceAll("_", " ")}{selected.assignedTeam ? ` · ${selected.assignedTeam.replaceAll("_", " ")}` : ""}</p></div><div className="ml-auto flex items-center gap-2"><Badge tone="teal">Klinikos internal</Badge>{selected.patientId && <Button asChild size="sm" variant="secondary"><Link href={`/patients/${selected.patientId}`}>Open chart</Link></Button>}</div></div><div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-5">{selected.messages.map((message) => <article className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-4" key={message.id}><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-extrabold text-slate-700">{message.authorName}</p><Badge tone="slate">internal</Badge><span className="ml-auto text-[9px] text-slate-400">{new Date(message.createdAt).toLocaleString()}</span></div><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-700">{message.body}</p></article>)}{selected.messages.length === 0 && <p className="text-xs text-slate-500">No internal messages are recorded in this thread.</p>}</div>{workspace.canCreate && <form className="border-t border-slate-200 p-4" onSubmit={createReply}><div className="rounded-2xl border border-slate-200 bg-white p-3"><textarea className="min-h-20 w-full resize-y text-xs leading-5 outline-none" maxLength={5000} onChange={(event) => setReply(event.target.value)} placeholder="Add an internal coordination message..." value={reply} /><div className="mt-2 flex items-center justify-between gap-3"><p className="text-[9px] text-slate-400">Stored inside Klinikos only. No SMS/email/voice delivery occurs.</p><Button disabled={busy || !reply.trim()} size="sm" type="submit">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Add internally</Button></div></div></form>}</> : <div className="flex flex-1 items-center justify-center p-8 text-center"><div><MessageCircle className="mx-auto size-7 text-slate-300" /><p className="mt-4 text-sm font-extrabold text-slate-800">No internal thread selected.</p><p className="mt-2 text-xs text-slate-500">Create or select a thread to coordinate inside Klinikos.</p></div></div>}</section>
    </div></Card>
  </div>;
}
