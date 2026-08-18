"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LockKeyhole, MessageCircle, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { CareTeamWorkspace } from "@/lib/repositories/care-team-repository";

export function CareTeamRoomPanel({ data, canCreate, canManage }: { data: CareTeamWorkspace; canCreate: boolean; canManage: boolean }) {
  const router = useRouter();
  const room = data.rooms[0];
  const [roomName, setRoomName] = useState("Maya · Connected Diabetes Care");
  const [patientId, setPatientId] = useState(data.patients[0]?.id ?? "");
  const [organizationId, setOrganizationId] = useState(data.organizations[0]?.id ?? "");
  const [memberRole, setMemberRole] = useState("diagnostic coordinator");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function post(url: string, payload: unknown, success: string) {
    setBusy(true); setMessage(null);
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setBusy(false);
    if (!response.ok) { setMessage(result?.error ?? "Action could not be completed."); return false; }
    setMessage(success); router.refresh(); return true;
  }

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await post("/api/care-teams", { patientId, name: roomName, sourceType: "manual", sharedPlan: { goals: ["Close the loop on the repeat A1C order"], nextActions: ["Provider review", "Diagnostic scheduling"], humanReviewRequired: true } }, "Care Team Room created.")) setRoomName("");
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (room) await post(`/api/care-teams/${room.id}/members`, { representedOrganizationId: organizationId, role: memberRole, accessLevel: "minimum_necessary" }, "Invitation recorded for human acceptance.");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!room || !body.trim()) return;
    if (await post(`/api/care-teams/${room.id}/messages`, { body }, "Secure team message recorded.")) setBody("");
  }

  return <div className="space-y-6">
    <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <SectionCard title="Care Team Room" description="A minimum-necessary collaboration room. Clinical decisions remain with licensed humans; every message and membership change is audited.">
        {room ? <div className="space-y-4 p-5"><div className="flex flex-wrap items-start gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Users className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-950">{room.name}</p><p className="mt-1 text-[12px] text-slate-500">{room.patient.firstName} {room.patient.lastName} · {room.patient.mrn} · {room.sourceType.replaceAll("_", " ")}</p></div><StatusBadge status={room.status} /><Badge tone="teal"><LockKeyhole className="mr-1 size-3" /> Minimum necessary</Badge></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-400">MEMBERS</p><p className="mt-1 text-xl font-black text-slate-950">{room.members.length}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-400">MESSAGES</p><p className="mt-1 text-xl font-black text-slate-950">{room.messages.length}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-400">TASKS</p><p className="mt-1 text-xl font-black text-slate-950">{room.tasks.length}</p></div></div><div className="rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-400">Shared plan</p><p className="mt-2 text-xs leading-6 text-slate-700">{JSON.stringify(room.sharedPlan ?? { goals: [], nextActions: [] })}</p></div><div className="space-y-2">{room.members.map((member) => <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3" key={`${member.id}-${member.role}`}><span className="grid size-8 place-items-center rounded-lg bg-sky-50 text-sky-700"><Users className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{member.provider}</p><p className="text-[12px] text-slate-500">{member.organization} · {member.role}</p></div><StatusBadge status={member.status} /></div>)}</div></div> : <form className="space-y-3 p-5" onSubmit={createRoom}><select aria-label="Patient" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold" onChange={(event) => setPatientId(event.target.value)} value={patientId}>{data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.mrn}</option>)}</select><input aria-label="Care Team Room name" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs" onChange={(event) => setRoomName(event.target.value)} placeholder="Room name" value={roomName} /><Button disabled={busy || !canCreate || !patientId || roomName.trim().length < 3} type="submit" variant="primary">Create Care Team Room <Plus className="size-4" /></Button>{message && <p className="text-[12px] text-slate-500">{message}</p>}</form>}
      </SectionCard>
      <div className="space-y-6">
        {room && <SectionCard title="Invite connected organization" description="The target organization must be connected and must explicitly accept before it can participate."><form className="space-y-3 p-5" onSubmit={addMember}><select aria-label="Represented organization" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold" onChange={(event) => setOrganizationId(event.target.value)} value={organizationId}><option value="">Select organization</option>{data.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name} · {organization.clinicType}</option>)}</select><input aria-label="Member role" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs" onChange={(event) => setMemberRole(event.target.value)} value={memberRole} /><Button disabled={busy || !canManage || !organizationId} type="submit" variant="secondary">Invite to room <Users className="size-4" /></Button></form></SectionCard>}
        <SectionCard title="Shared activity" description="Secure team messages are internal records with a source organization, patient link, author, and audit receipt."><div className="space-y-3 p-5"><div className="max-h-56 space-y-2 overflow-auto">{room?.messages.map((item) => <div className="rounded-xl bg-slate-50 p-3" key={item.id}><div className="flex items-center justify-between gap-2"><Badge tone="sky"><MessageCircle className="mr-1 size-3" /> Team message</Badge><span className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span></div><p className="mt-2 text-xs leading-5 text-slate-700">{item.body}</p></div>)}{room && !room.messages.length && <p className="text-xs text-slate-500">No team messages yet.</p>}{!room && <p className="text-xs text-slate-500">Create a room to open the secure activity stream.</p>}</div>{room && <form className="flex gap-2 border-t border-slate-100 pt-3" onSubmit={sendMessage}><input aria-label="Team message" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-xs" onChange={(event) => setBody(event.target.value)} placeholder="Write a coordination note" value={body} /><Button aria-label="Send team message" disabled={busy || !body.trim()} size="sm" type="submit" variant="primary">Send</Button></form>}{message && <p className="text-[12px] text-slate-500">{message}</p>}</div></SectionCard>
      </div>
    </div>
    {room && <SectionCard title="Room tasks and documents" description="Linked work remains visible without claiming that an external adapter delivered anything." ><div className="grid gap-3 p-5 md:grid-cols-2"><div>{room.tasks.map((task) => <div className="mb-2 rounded-xl border border-slate-200 p-3" key={task.id}><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold text-slate-900">{task.title}</p><StatusBadge status={task.status} /></div><p className="mt-1 text-[12px] text-slate-500">{task.details ?? "No task detail"} · {task.priority}</p></div>)}{!room.tasks.length && <p className="text-xs text-slate-500">No linked room tasks.</p>}</div><div>{room.documents.map((document) => <div className="mb-2 rounded-xl border border-slate-200 p-3" key={document.id}><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold text-slate-900">{document.name}</p><StatusBadge status={document.reviewStatus} /></div><p className="mt-1 text-[12px] text-slate-500">Patient-visible: {document.patientVisible ? "Yes" : "No"} · Release: {document.releaseStatus}</p></div>)}{!room.documents.length && <p className="text-xs text-slate-500">No linked room documents.</p>}</div></div></SectionCard>}
    {message && !room && <p className="text-[12px] text-slate-500">{message}</p>}
  </div>;
}
