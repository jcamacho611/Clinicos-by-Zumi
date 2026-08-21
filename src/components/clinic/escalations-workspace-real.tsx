import Link from "next/link";
import { AlertOctagon, ArrowRight, Check, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EscalationActions } from "@/components/clinic/care-coordination-actions";
import { StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { CareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";

export function EscalationsWorkspaceReal({ workspace }: { workspace: CareCoordinationWorkspace }) {
  const open = workspace.escalations.filter((escalation) => escalation.status !== "resolved");
  const urgent = open.filter((escalation) => escalation.riskLevel === "URGENT").length;

  return <div className="space-y-6">
    <div className="rounded-[26px] bg-rose-950 p-7 text-white">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-rose-300">Human review queue</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-.05em]">{open.length} items are safely held.</h2>
          <p className="mt-3 max-w-2xl text-xs leading-6 text-rose-100/70">Urgent or sensitive work stays with an authorized human. Klinikos does not pretend an external callback was placed when no communications rail is connected.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-white text-rose-950 hover:bg-rose-50" variant="secondary"><Link href="/tasks">Open task queue <ArrowRight className="size-4" /></Link></Button>
          <Button asChild className="border-white/20 text-white hover:bg-white/10" variant="ghost"><Link href="/integrations">Calling connection</Link></Button>
        </div>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-4">
      <StatCard accent="rose" detail="Require human action" icon={<AlertOctagon className="size-4" />} label="Open" value={String(open.length)} />
      <StatCard accent="rose" detail="Highest held risk level" icon={<ShieldAlert className="size-4" />} label="Urgent" value={String(urgent)} />
      <StatCard accent="amber" detail="Tenant-visible escalation records" icon={<ShieldAlert className="size-4" />} label="Total" value={String(workspace.escalations.length)} />
      <StatCard accent="teal" detail="Resolved with a human note" icon={<Check className="size-4" />} label="Resolved" value={String(workspace.escalations.length - open.length)} />
    </div>

    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><strong>Callback boundary:</strong> phone/SMS/voice actions remain external-connection work. Until that rail is approved, staff can resolve the escalation, create internal tasks/messages, or use their existing clinic phone system outside Klinikos.</div>

    <div className="space-y-4">
      {workspace.escalations.map((item, index) => <Card className={`klinikos-deep-target scroll-mt-24 p-5 ${index === 0 ? "border-rose-300 shadow-[0_18px_45px_rgba(190,24,93,.12)]" : ""}`} id={`escalation-${item.id}`} key={item.id}>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.7fr_.8fr] lg:items-start">
          <div className="flex items-start gap-4">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.riskLevel === "URGENT" ? "bg-rose-100 text-rose-700" : "bg-amber-50 text-amber-700"}`}><ShieldAlert className="size-5" /></span>
            <div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold text-slate-950">{item.category.replaceAll("_", " ")}</p><StatusBadge status={item.riskLevel.replaceAll("_", " ")} /></div><p className="mt-1 text-[12px] text-slate-400">{item.patientName} · {item.sourceType} · {new Date(item.createdAt).toLocaleString()}</p><p className="mt-2 text-[12px] leading-5 text-slate-600">Source: {item.sourceId} · Assigned team: {item.assignedTeam}</p></div>
          </div>
          <div><p className="text-[11px] font-bold text-slate-400">STATUS</p><p className="mt-1 text-xs font-bold text-slate-700">{item.status}</p><p className="mt-2 text-[12px] leading-5 text-slate-500">{item.resolution ?? "No human resolution note yet."}</p></div>
          <EscalationActions escalationId={item.id} status={item.status} />
        </div>
      </Card>)}
      {!workspace.escalations.length && <Card className="p-6 text-xs text-slate-500">No escalations are recorded for this organization.</Card>}
    </div>
  </div>;
}
