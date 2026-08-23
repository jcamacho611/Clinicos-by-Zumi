import { AlertOctagon, Check, Clock3, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskActions } from "@/components/clinic/care-coordination-actions";
import { TaskCreateAction } from "@/components/clinic/task-create-action";
import { UniversalObligationSummary } from "@/components/clinic/universal-obligation-summary";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { UniversalObligationWorkspace } from "@/lib/obligations/universal-obligation-repository";
import type { CareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";

export function TasksWorkspaceReal({ workspace, obligations }: { workspace: CareCoordinationWorkspace; obligations: UniversalObligationWorkspace }) {
  const open = workspace.tasks.filter((task) => task.status !== "completed");
  const urgent = open.filter((task) => task.priority === "urgent" || task.riskLevel === "URGENT").length;
  const dueToday = open.filter((task) => task.dueAt && new Date(task.dueAt).toDateString() === new Date().toDateString()).length;

  return <div className="space-y-6">
    <PageIntro
      title="Every task has an owner and a reason."
      description="Create, assign, complete, and reopen tenant work without leaving Klinikos. Every create and transition produces an audit trail."
      action={<TaskCreateAction />}
    />
    <div className="grid gap-4 sm:grid-cols-4">
      <StatCard accent="rose" detail="Needs action now" icon={<AlertOctagon className="size-4" />} label="Urgent" value={String(urgent)} />
      <StatCard accent="amber" detail="Based on the current date" icon={<Clock3 className="size-4" />} label="Due today" value={String(dueToday)} />
      <StatCard accent="sky" detail="Tenant-filtered work queue" icon={<Workflow className="size-4" />} label="Open" value={String(open.length)} />
      <StatCard accent="teal" detail="Completed in this workspace" icon={<Check className="size-4" />} label="Completed" value={String(workspace.tasks.length - open.length)} />
    </div>
    <UniversalObligationSummary workspace={obligations} />
    <SectionCard title="Team work queue" description="Every transition requires a human note and produces an audit receipt.">
      <div className="divide-y divide-slate-100">
        {workspace.tasks.map((task) => <div className="p-5" key={task.id}>
          <div className="grid gap-4 md:grid-cols-[1.4fr_.6fr_.5fr_auto] md:items-start">
            <div>
              <div className="flex items-center gap-2"><StatusBadge status={task.priority} /><Badge tone="slate">{task.category}</Badge></div>
              <p className="mt-3 text-xs font-extrabold text-slate-900">{task.title}</p>
              <p className="mt-1 text-[12px] text-slate-400">{task.patientName}</p>
              {task.details ? <p className="mt-2 text-[12px] leading-5 text-slate-500">{task.details}</p> : null}
            </div>
            <div><p className="text-[11px] font-bold text-slate-400">OWNER</p><p className="mt-1 break-all text-xs font-bold text-slate-700">{task.ownerId ?? "Unassigned"}</p></div>
            <div><p className="text-[11px] font-bold text-slate-400">DUE</p><p className="mt-1 text-xs font-bold text-slate-700">{task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due time"}</p></div>
            <StatusBadge status={task.status} />
          </div>
          <TaskActions taskId={task.id} status={task.status} />
        </div>)}
        {!workspace.tasks.length && <p className="p-6 text-xs text-slate-500">No tenant tasks are recorded. Create the first task above.</p>}
      </div>
    </SectionCard>
  </div>;
}
