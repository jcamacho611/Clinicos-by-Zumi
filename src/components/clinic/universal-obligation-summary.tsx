import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { UniversalObligationWorkspace } from "@/lib/obligations/universal-obligation-repository";

function sourceLabel(sourceType: string) {
  return sourceType === "referral" ? "Referral" : "Task";
}

function dueLabel(dueAt: string | null) {
  if (!dueAt) return "No due time";
  return new Date(dueAt).toLocaleString();
}

export function UniversalObligationSummary({ workspace }: { workspace: UniversalObligationWorkspace }) {
  const open = workspace.obligations.filter((obligation) => obligation.open);
  const visible = open.slice(0, 8);

  return (
    <SectionCard
      title="What still needs to happen?"
      description="A shared view of unfinished work from existing domain records. Tasks and referrals remain authoritative in their own workflows."
    >
      <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-400">Open</p><p className="mt-1 text-xl font-black text-slate-950">{workspace.metrics.open}</p></div>
        <div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-amber-700">Overdue</p><p className="mt-1 text-xl font-black text-amber-950">{workspace.metrics.overdue}</p></div>
        <div className="rounded-xl bg-rose-50 p-3"><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-rose-700">Blocked</p><p className="mt-1 text-xl font-black text-rose-950">{workspace.metrics.blocked}</p></div>
        <div className="rounded-xl bg-sky-50 p-3"><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-sky-700">Referral work</p><p className="mt-1 text-xl font-black text-sky-950">{workspace.metrics.referralOpen}</p></div>
      </div>

      {!workspace.sourceWindowComplete ? (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-[11px] leading-5 text-amber-900">
          <AlertTriangle className="mr-2 inline size-4" />This is a bounded operational window because at least one source exceeded 100 loaded records. Treat counts as loaded-work counts, not exhaustive totals.
        </div>
      ) : null}

      <div className="divide-y divide-slate-100">
        {visible.map((obligation) => (
          <div className="flex flex-wrap items-start gap-3 p-4" key={obligation.id}>
            <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${obligation.state === "BLOCKED" ? "bg-rose-50 text-rose-700" : obligation.overdue ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}`}>
              {obligation.state === "BLOCKED" ? <AlertTriangle className="size-4" /> : obligation.open ? <Clock3 className="size-4" /> : <CheckCircle2 className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-extrabold text-slate-900">{obligation.title}</p>
                <Badge tone={obligation.sourceType === "referral" ? "sky" : "slate"}>{sourceLabel(obligation.sourceType)}</Badge>
                <StatusBadge status={obligation.state.toLowerCase()} />
                {obligation.overdue ? <Badge tone="amber">Overdue</Badge> : null}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Source status {obligation.sourceStatus} · Due {dueLabel(obligation.dueAt)}</p>
            </div>
            {obligation.sourceType === "referral" ? (
              <Link className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-sky-200 px-3 text-[11px] font-extrabold text-sky-800 hover:bg-sky-50" href="/referrals">
                Open referral workflow <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.1em] text-slate-400"><Route className="size-3.5" />Managed below</span>
            )}
          </div>
        ))}
        {!visible.length ? <p className="p-5 text-xs text-slate-500">No unfinished Task or source-owned Referral obligations are loaded.</p> : null}
      </div>
      {open.length > visible.length ? <p className="border-t border-slate-100 p-4 text-[11px] text-slate-500">Showing the 8 highest-priority loaded obligations. Domain workspaces retain the full records and actions.</p> : null}
    </SectionCard>
  );
}
