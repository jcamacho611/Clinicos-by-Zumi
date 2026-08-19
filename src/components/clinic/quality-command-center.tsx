"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, ListChecks, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { QualityCommandCenterWorkspace } from "@/lib/repositories/quality-command-center-repository";

function dueLabel(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function timingLabel(value: "overdue" | "due_soon" | "open") {
  if (value === "overdue") return "Overdue";
  if (value === "due_soon") return "Due soon";
  return "Open";
}

export function QualityCommandCenter({ workspace }: { workspace: QualityCommandCenterWorkspace }) {
  const [busyGapId, setBusyGapId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const summaryCards: Array<{ label: string; value: number; icon: LucideIcon }> = workspace.summary ? [
    { label: "Open", value: workspace.summary.open, icon: ListChecks },
    { label: "Overdue", value: workspace.summary.overdue, icon: AlertTriangle },
    { label: "Due soon", value: workspace.summary.dueSoon, icon: Clock3 },
    { label: "High impact", value: workspace.summary.highImpact, icon: AlertTriangle },
    { label: "Tasks created", value: workspace.summary.materialized, icon: CheckCircle2 },
    { label: "Unassigned", value: workspace.summary.unassigned, icon: ListChecks },
    { label: "Human review", value: workspace.summary.humanReview, icon: ShieldCheck },
  ] : [];

  async function prepareTask(gapId: string) {
    setBusyGapId(gapId);
    setMessage("");
    try {
      const response = await fetch(`/api/quality/gaps/${encodeURIComponent(gapId)}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: null }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Quality follow-up task could not be prepared.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Quality follow-up task could not be prepared.");
      setBusyGapId(null);
    }
  }

  return <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 md:px-6 lg:px-8">
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(188,93,101,.16),transparent_38%),linear-gradient(145deg,rgba(20,8,11,.96),rgba(7,6,7,.98))] p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#d98f93]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Quality operations
          </div>
          <h1 className="text-3xl font-semibold tracking-[-.035em] text-[#fff7f2] md:text-5xl">
            {workspace.measuresConfigured === 0 ? "Quality is not being measured yet." : "Close the work before it becomes a problem."}
          </h1>
          {/* An empty backlog means two completely different things depending on whether
              anything is being measured, and the gap count cannot tell them apart.
              Telling a clinic that has never been evaluated it has nothing open reports
              that they are clean when nobody has looked. */}
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#c8b6b1] md:text-base">
            {workspace.measuresConfigured === 0
              ? "No measures are configured, so nothing has been evaluated. This is not the same as having no gaps — it means Klinikos has not been told what to watch for. Defining measures and their clinical criteria is deliberate setup work, and Klinikos will not guess them on your behalf."
              : "This command center turns persisted quality gaps into accountable clinic work. It tracks what still needs attention without representing operational tasks as proof of compliance."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[.04] px-4 text-xs font-semibold text-[#f8e9e5] transition hover:bg-white/[.08]" href="/tasks">
            Open tasks <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d98f93]/25 bg-[#d98f93]/10 px-4 text-xs font-semibold text-[#ffd9d7] transition hover:bg-[#d98f93]/15" href="/patients">
            Patient workspace <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>

    {summaryCards.length > 0 && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7" aria-label="Quality backlog summary">
      {summaryCards.map(({ label, value, icon: Icon }) => <article className="rounded-[20px] border border-white/8 bg-white/[.025] p-4" key={label}>
        <Icon className="h-4 w-4 text-[#d98f93]" aria-hidden="true" />
        <p className="mt-5 text-2xl font-semibold text-[#fff7f2]">{value}</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[.12em] text-[#9f8985]">{label}</p>
      </article>)}
    </section>}

    <section className="rounded-[24px] border border-white/8 bg-white/[.02] p-4 md:p-5">
      <div className="flex flex-col gap-2 border-b border-white/8 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#fff7f2]">Active quality backlog</h2>
          <p className="mt-1 text-xs text-[#9f8985]">Persisted unresolved work only. Program-specific population calculations require separately governed rule packages.</p>
        </div>
        <span className="w-fit rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-[#bca5a1]">
          {workspace.complete ? "Complete view" : "Coverage limited"}
        </span>
      </div>

      {workspace.warnings.length > 0 && <div className="mt-4 rounded-[18px] border border-[#d98f93]/15 bg-[#d98f93]/[.045] p-4">
        <ul className="space-y-2 text-xs leading-5 text-[#c9aba8]">
          {workspace.warnings.map((warning) => <li className="flex gap-2" key={warning}><span aria-hidden="true">•</span><span>{warning}</span></li>)}
        </ul>
      </div>}

      <p aria-live="polite" className="mt-3 min-h-5 text-xs text-[#e1aaa8]">{message}</p>

      {workspace.gaps.length ? <ul className="mt-2 divide-y divide-white/8">
        {workspace.gaps.map((gap) => <li className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(160px,.7fr)_minmax(180px,.8fr)_auto] lg:items-center" key={gap.id}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.1em] text-[#c7b1ad]">{timingLabel(gap.timing)}</span>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.1em] text-[#c7b1ad]">{gap.impact} impact</span>
              {gap.requiresReview && <span className="rounded-full border border-[#d98f93]/20 bg-[#d98f93]/[.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.1em] text-[#e9aaa8]">Human review</span>}
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-[#fff7f2]">{gap.measure.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9f8985]">
              <Link className="text-[#d5b8b4] hover:text-[#fff7f2]" href={`/patients/${encodeURIComponent(gap.patient.id)}`}>{gap.patient.displayName}</Link>
              <span>MRN {gap.patient.mrn}</span>
              {gap.measure.version && <span>Version {gap.measure.version}</span>}
              {!gap.measure.mapped && <span>Measure mapping required</span>}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#806d69]">Due</p>
            <p className="mt-1 text-sm text-[#d8c4c0]">{dueLabel(gap.dueAt)}</p>
            <p className="mt-1 text-xs capitalize text-[#8d7773]">{gap.workflowStatus.replaceAll("_", " ")}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#806d69]">Operational work</p>
            {gap.task ? <div className="mt-1">
              <p className="text-sm capitalize text-[#d8c4c0]">Task {gap.task.status.replaceAll("_", " ")}</p>
              <p className="mt-1 text-xs text-[#8d7773]">{gap.task.owner?.name ?? "Unassigned"} · {gap.task.priority} priority</p>
            </div> : <p className="mt-1 text-sm text-[#8d7773]">No linked task yet</p>}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {gap.task ? <Link className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-3.5 text-[11px] font-bold text-[#d8c4c0] hover:bg-white/[.05]" href="/tasks">
              Review task <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link> : workspace.canMaterializeTasks ? <button
              className="min-h-10 rounded-full bg-[#d98f93] px-4 text-[11px] font-bold text-[#210d10] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-50"
              disabled={busyGapId === gap.id}
              onClick={() => prepareTask(gap.id)}
              type="button"
            >
              {busyGapId === gap.id ? "Preparing…" : "Create follow-up task"}
            </button> : <span className="text-xs text-[#806d69]">Read only</span>}
          </div>
        </li>)}
      </ul> : <div className="py-14 text-center">
        <CheckCircle2 className="mx-auto h-6 w-6 text-[#9db6a1]" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-[#e6d6d2]">No unresolved quality gaps are visible in this scope.</p>
        <p className="mt-1 text-xs text-[#806d69]">This does not by itself establish program compliance.</p>
      </div>}
    </section>
  </div>;
}
