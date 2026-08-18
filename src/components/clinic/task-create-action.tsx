"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TaskOptions = {
  patients: Array<{ id: string; name: string; mrn: string }>;
  users: Array<{ id: string; name: string; roleKey: string }>;
  currentUserId: string;
};

const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50";

export function TaskCreateAction() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<TaskOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [patientId, setPatientId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [category, setCategory] = useState("follow_up");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<"normal" | "high" | "urgent">("normal");
  const [dueAt, setDueAt] = useState("");

  async function openForm() {
    setOpen(true); setError("");
    if (options || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/tasks/options", { headers: { Accept: "application/json" }, cache: "no-store" });
      const payload = await response.json().catch(() => null) as { error?: string; data?: TaskOptions } | null;
      if (!response.ok || !payload?.data) throw new Error(payload?.error ?? "Task options could not be loaded.");
      setOptions(payload.data);
      setOwnerId(payload.data.currentUserId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Task options could not be loaded.");
    } finally { setLoading(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const parsedDueAt = dueAt ? new Date(dueAt) : null;
      if (parsedDueAt && !Number.isFinite(parsedDueAt.getTime())) throw new Error("Choose a valid task due date and time.");
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          patientId: patientId || null,
          ownerId: ownerId || null,
          category,
          title,
          details: details || null,
          priority,
          dueAt: parsedDueAt?.toISOString() ?? null,
        }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "The task could not be created.");
      setOpen(false); setPatientId(""); setCategory("follow_up"); setTitle(""); setDetails(""); setPriority("normal"); setDueAt("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The task could not be created.");
    } finally { setSubmitting(false); }
  }

  if (!open) return <Button onClick={() => void openForm()} variant="primary"><Plus className="size-4" /> New task</Button>;

  return <form className="w-full max-w-2xl rounded-2xl border border-teal-200 bg-teal-50/70 p-5" onSubmit={submit}>
    <div className="flex items-start gap-3"><div><p className="text-sm font-extrabold text-slate-950">Create task</p><p className="mt-1 text-[12px] leading-5 text-slate-500">Tasks stay inside this organization, create an audit receipt, and notify another assigned user when applicable.</p></div><Button aria-label="Close task form" className="ml-auto" disabled={submitting} onClick={() => setOpen(false)} size="icon" type="button" variant="ghost"><X className="size-4" /></Button></div>
    {loading && <p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><LoaderCircle className="size-4 animate-spin" /> Loading authorized task options…</p>}
    {options && <>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-xs font-bold text-slate-700">Patient<select className={`mt-2 ${selectClass}`} onChange={(event) => setPatientId(event.target.value)} value={patientId}><option value="">Organization task</option>{options.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-700">Owner<select className={`mt-2 ${selectClass}`} onChange={(event) => setOwnerId(event.target.value)} required value={ownerId}>{options.users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.roleKey.replaceAll("_", " ")}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-700">Category<Input className="mt-2" maxLength={80} onChange={(event) => setCategory(event.target.value)} required value={category} /></label>
        <label className="text-xs font-bold text-slate-700">Priority<select className={`mt-2 ${selectClass}`} onChange={(event) => setPriority(event.target.value as "normal" | "high" | "urgent")} value={priority}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
        <label className="text-xs font-bold text-slate-700 md:col-span-2">Title<Input className="mt-2" maxLength={200} onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
        <label className="text-xs font-bold text-slate-700">Due date and time<Input className="mt-2" onChange={(event) => setDueAt(event.target.value)} type="datetime-local" value={dueAt} /></label>
        <label className="text-xs font-bold text-slate-700">Details<Input className="mt-2" maxLength={2000} onChange={(event) => setDetails(event.target.value)} placeholder="Optional context" value={details} /></label>
      </div>
      <div className="mt-5 flex justify-end"><Button disabled={submitting || title.trim().length < 3 || category.trim().length < 2 || !ownerId} type="submit">{submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Create task</Button></div>
    </>}
    {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}
  </form>;
}
