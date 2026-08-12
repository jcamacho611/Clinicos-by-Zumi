"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, AudioLines, BadgeCheck, Bot, Check, CheckCircle2,
  CircleDashed, FileClock, Fingerprint, LoaderCircle, LockKeyhole, Mic, Orbit,
  Route, Send, ShieldCheck, Sparkles, UserCheck, X,
} from "lucide-react";
import { VoiceInputButton } from "@/components/clinic/voice-input";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CopilotDecision } from "@/lib/copilot-rules";
import type { CopilotWorkspace as CopilotWorkspaceData } from "@/lib/repositories/copilot-repository";

const examples = [
  "Show me the synthetic referrals still waiting for a response.",
  "Prepare a follow-up task for the synthetic no-show queue.",
  "Can you guarantee this visit is covered by insurance?",
  "Send the whole patient chart to the imaging center.",
];

const phases = ["Reading the confirmed request", "Applying clinical and privacy boundaries", "Selecting the responsible human queue", "Saving the audit and review record"];

function riskTone(riskLevel: string) {
  if (riskLevel === "URGENT" || riskLevel === "DO_NOT_AUTOMATE") return "rose" as const;
  if (riskLevel === "NEEDS_PROVIDER" || riskLevel === "NEEDS_STAFF") return "amber" as const;
  return "teal" as const;
}

function readable(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function ReviewActions({ canReview, runId, status }: { canReview: boolean; runId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reviewable = status === "awaiting_review" || status === "urgent_hold";

  async function review(decision: "approve" | "reject") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/copilot/runs/${runId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: decision === "approve"
            ? "Human reviewer accepted this as an administrative draft only. No downstream action or message was executed."
            : "Human reviewer rejected this draft. No downstream action or message was executed.",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Copilot review failed.");
      startTransition(() => router.refresh());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Copilot review failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!canReview || !reviewable) return null;
  return <div className="mt-4 flex flex-wrap gap-2">
    <Button disabled={busy} onClick={() => review("approve")} size="sm" variant="secondary"><Check className="size-3.5" /> Accept as staff draft</Button>
    <Button disabled={busy} onClick={() => review("reject")} size="sm" variant="ghost"><X className="size-3.5" /> Reject draft</Button>
    {error && <p className="basis-full text-[10px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}

export function CopilotWorkspace({
  canCreate,
  canReview,
  canUseVoice,
  focusMode = "command",
  workspace,
}: {
  canCreate: boolean;
  canReview: boolean;
  canUseVoice: boolean;
  focusMode?: "command" | "voice";
  workspace: CopilotWorkspaceData;
}) {
  const router = useRouter();
  const [input, setInput] = useState(examples[0]);
  const deferredInput = useDeferredValue(input);
  const [inputMode, setInputMode] = useState<"typed" | "voice">(focusMode === "voice" ? "voice" : "typed");
  const [patientId, setPatientId] = useState<string>("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(-1);
  const [result, setResult] = useState<CopilotDecision | null>(null);
  const [resultRunId, setResultRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openRuns = workspace.runs.filter((run) => run.status === "awaiting_review" || run.status === "urgent_hold");
  const urgentRuns = workspace.runs.filter((run) => run.status === "urgent_hold");
  const voiceRuns = workspace.runs.filter((run) => run.inputMode === "voice");

  async function runCopilot() {
    if (!canCreate || busy || input.trim().length < 4 || !acknowledged) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setResultRunId(null);
    setPhaseIndex(0);
    const timer = window.setInterval(() => setPhaseIndex((current) => Math.min(current + 1, phases.length - 1)), 360);
    try {
      const [response] = await Promise.all([
        fetch("/api/copilot/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputText: input, inputMode, patientId: patientId || null, demoAcknowledged: true }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 1180)),
      ]);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Zumi Copilot could not process this request.");
      setPhaseIndex(phases.length);
      setResult(payload.data.result);
      setResultRunId(payload.data.run.id);
      startTransition(() => router.refresh());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Zumi Copilot could not process this request.");
      setPhaseIndex(-1);
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  }

  function acceptTranscript(transcript: string) {
    setInput(transcript);
    setInputMode("voice");
  }

  return <div className="space-y-6">
    <PageIntro
      aside={<div className="flex flex-wrap gap-2"><Badge tone="teal">Demo</Badge><Badge tone="amber">Human review required</Badge></div>}
      description="Speak or type one administrative request. Zumi shows its processing, saves the result on this page, and holds every draft for an authorized person."
      title="Zumi Copilot turns clinic chaos into a reviewable next action."
    />

    <section className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-[#05090f] text-white shadow-[0_36px_90px_rgba(2,8,23,.28)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,.13),transparent_33%),radial-gradient(circle_at_85%_20%,rgba(52,211,153,.1),transparent_32%),linear-gradient(135deg,transparent_40%,rgba(255,255,255,.025)_40%,rgba(255,255,255,.025)_41%,transparent_41%)]" />
      <div className="relative grid xl:grid-cols-[1.1fr_.9fr]">
        <div className="border-b border-white/10 p-5 sm:p-7 xl:border-b-0 xl:border-r">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-inset ring-cyan-200/15"><Orbit className="size-5" /></span>
            <div><p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Zumi workflow intelligence</p><p className="mt-1 text-xs text-slate-400">Deterministic local engine · {workspace.rulesVersion}</p></div>
            <Badge className="ml-auto bg-white/8 text-white ring-white/10">No auto-send</Badge>
          </div>

          <div className="mt-7 rounded-[22px] bg-white/[.055] p-4 ring-1 ring-inset ring-white/10">
            <textarea
              aria-label="Ask Zumi for administrative workflow help"
              className="min-h-32 w-full resize-none bg-transparent text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-600"
              onChange={(event) => { setInput(event.target.value); setInputMode("typed"); }}
              placeholder="Ask Zumi what needs attention..."
              value={input}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <select aria-label="Optional synthetic patient context" className="h-10 min-w-0 rounded-xl border border-white/10 bg-[#0c121c] px-3 text-xs font-bold text-slate-300 outline-none" onChange={(event) => setPatientId(event.target.value)} value={patientId}>
                <option value="">Organization workflow · no patient selected</option>
                {workspace.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.mrn}</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                {canUseVoice ? <VoiceInputButton className="[&_button]:border-white/10 [&_button]:bg-white/8 [&_button]:text-white [&_button]:hover:bg-white/15" onTranscript={acceptTranscript} /> : <Badge className="bg-white/8 text-slate-300 ring-white/10"><Mic className="mr-1 size-3" /> Voice unavailable</Badge>}
                <Button className="bg-cyan-200 text-slate-950 hover:bg-cyan-100" disabled={!canCreate || busy || input.trim().length < 4 || !acknowledged} onClick={runCopilot} size="sm">
                  {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Process here
                </Button>
              </div>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-3 text-[10px] leading-5 text-amber-100">
              <input checked={acknowledged} className="mt-1" onChange={(event) => setAcknowledged(event.target.checked)} type="checkbox" />
              <span><strong>Synthetic demo only.</strong> I will not enter real patient information. Production use requires security, consent, retention, and vendor review.</span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {examples.map((example, index) => <button className="rounded-full bg-white/6 px-3 py-1.5 text-[9px] font-bold text-slate-400 ring-1 ring-inset ring-white/8 transition hover:bg-white/10 hover:text-white" key={example} onClick={() => { setInput(example); setInputMode("typed"); }}>Scenario {index + 1}</button>)}
          </div>
          <p className="mt-4 truncate text-[9px] text-slate-600">Visible input preview: {deferredInput || "No request entered"}</p>
        </div>

        <div className="relative min-h-[520px] p-5 sm:p-7">
          {!busy && !result && !error && <div className="grid min-h-[455px] place-items-center text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-[22px] bg-white/6 text-slate-300 ring-1 ring-inset ring-white/10"><Bot className="size-7" /></span><h3 className="mt-5 text-xl font-black tracking-[-.04em]">One surface. No confusing second page.</h3><p className="mx-auto mt-3 max-w-sm text-xs leading-6 text-slate-500">Zumi will classify the request, show its limits, select the human queue, and save the review receipt right here.</p></div></div>}
          {busy && <div className="flex min-h-[455px] flex-col justify-center"><p className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-300">Processing visibly</p><h3 className="mt-3 text-2xl font-black tracking-[-.045em]">Zumi is organizing the next action.</h3><div className="mt-8 space-y-3">{phases.map((phase, index) => { const complete = index < phaseIndex; const active = index === phaseIndex; return <div className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ring-inset ${active ? "bg-cyan-300/10 ring-cyan-300/20" : complete ? "bg-emerald-300/8 ring-emerald-300/15" : "bg-white/[.025] ring-white/5"}`} key={phase}>{complete ? <CheckCircle2 className="size-4 text-emerald-300" /> : active ? <LoaderCircle className="size-4 animate-spin text-cyan-200" /> : <CircleDashed className="size-4 text-slate-700" />}<p className={`text-xs font-bold ${active || complete ? "text-slate-200" : "text-slate-700"}`}>{phase}</p></div>; })}</div><p className="mt-6 text-[10px] text-slate-500">No external message or workflow action is being sent.</p></div>}
          {error && <div className="grid min-h-[455px] place-items-center text-center"><div className="max-w-sm rounded-2xl border border-rose-400/20 bg-rose-400/8 p-5"><AlertTriangle className="mx-auto size-6 text-rose-300" /><p className="mt-3 text-sm font-black">Zumi stopped safely</p><p className="mt-2 text-xs leading-5 text-rose-100/70">{error}</p></div></div>}
          {result && <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex flex-wrap items-start gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-200 ring-1 ring-inset ring-emerald-200/15"><ShieldCheck className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">Saved for review</p><h3 className="mt-1 text-xl font-black tracking-[-.04em]">{result.headline}</h3></div><Badge className="bg-white/8 text-white ring-white/10">{Math.round(result.confidence * 100)}% rules match</Badge></div>
            <p className="mt-5 text-xs leading-6 text-slate-400">{result.explanation}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white/[.045] p-4 ring-1 ring-inset ring-white/8"><p className="text-[9px] font-black text-slate-600">ROUTE</p><p className="mt-2 text-sm font-black">{result.assignedTeam}</p></div><div className="rounded-2xl bg-white/[.045] p-4 ring-1 ring-inset ring-white/8"><p className="text-[9px] font-black text-slate-600">STATUS</p><p className="mt-2 text-sm font-black">{readable(result.status)}</p></div></div>
            <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.055] p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200">Draft · not sent</p><p className="mt-3 text-xs leading-6 text-slate-200">{result.draft}</p></div>
            <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[.055] p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-amber-200">Next human action</p><p className="mt-2 text-xs font-bold leading-5 text-amber-50">{result.nextAction}</p></div>
            <div className="mt-4 flex flex-wrap gap-2">{result.blockedActions.map((action) => <Badge className="bg-rose-300/8 text-rose-200 ring-rose-300/15" key={action}><LockKeyhole className="mr-1 size-3" /> {action} blocked</Badge>)}</div>
            {resultRunId && <ReviewActions canReview={canReview} runId={resultRunId} status={result.status} />}
          </div>}
        </div>
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-4">
      <StatCard accent="amber" detail="Execution remains blocked" icon={<FileClock className="size-4" />} label="Awaiting review" value={String(openRuns.length)} />
      <StatCard accent="rose" detail="Routine processing stopped" icon={<AlertTriangle className="size-4" />} label="Urgent holds" value={String(urgentRuns.length)} />
      <StatCard accent="sky" detail="Browser transcript adapter" icon={<AudioLines className="size-4" />} label="Voice runs" value={String(voiceRuns.length)} />
      <StatCard accent="teal" detail="Append-only run events" icon={<Fingerprint className="size-4" />} label="Audit receipts" value={String(workspace.runs.reduce((total, run) => total + run.events.length, 0))} />
    </div>

    <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <SectionCard description="Every result remains tenant-scoped, blocked from execution, and traceable to the rule set that produced it." title="Recent Zumi runs">
        <div className="divide-y divide-slate-100">
          {workspace.runs.map((run) => <div className="p-5" key={run.id}>
            <div className="flex flex-wrap items-start gap-3"><span className={`grid size-10 place-items-center rounded-xl ${run.inputMode === "voice" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-700"}`}>{run.inputMode === "voice" ? <AudioLines className="size-4" /> : <Sparkles className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-slate-950">{run.category}</p><StatusBadge status={readable(run.status)} /><Badge tone={riskTone(run.riskLevel)}>{readable(run.riskLevel)}</Badge></div><p className="mt-1 text-[10px] text-slate-400">{run.patient ? `${run.patient.name} · ${run.patient.mrn} · ` : "Organization workflow · "}{new Date(run.createdAt).toLocaleString()}</p></div><p className="text-[10px] font-black text-slate-500">{run.confidence ? `${Math.round(run.confidence * 100)}%` : "No score"}</p></div>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-700">{run.inputText}</p>
            {run.result && <div className="mt-3 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-slate-200 p-3"><p className="text-[8px] font-black text-slate-400">NEXT ACTION</p><p className="mt-1 text-[10px] font-bold leading-5 text-slate-700">{run.result.nextAction}</p></div><div className="rounded-xl border border-slate-200 p-3"><p className="text-[8px] font-black text-slate-400">RESPONSIBLE TEAM</p><p className="mt-1 text-[10px] font-bold text-slate-700">{run.assignedTeam}</p></div></div>}
            <ReviewActions canReview={canReview} runId={run.id} status={run.status} />
          </div>)}
          {!workspace.runs.length && <div className="p-8 text-center"><Bot className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-xs font-bold text-slate-500">No tenant Copilot runs have been saved yet.</p></div>}
        </div>
      </SectionCard>

      <div className="space-y-6">
        <Card className="border-slate-800 bg-slate-950 p-5 text-white">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200"><BadgeCheck className="size-4" /></span><div><p className="text-xs font-black">Truth panel</p><p className="text-[10px] text-slate-500">What is actually connected</p></div></div>
          <div className="mt-5 space-y-2">{[
            ["Typed workflow input", "Live"], ["Browser push-to-talk", "Demo"], ["Local safety engine", "Live"], ["AI provider adapter", "Pending connection"], ["Patient message send", "Human review required"], ["Production PHI use", "Requires production review"],
          ].map(([label, status]) => <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-inset ring-white/8" key={label}><p className="text-[10px] font-bold text-slate-300">{label}</p><span className="text-right text-[9px] font-black text-emerald-200">{status}</span></div>)}</div>
        </Card>
        <SectionCard description="Each Copilot output records its path instead of hiding behind a generic AI label." title="Processing contract">
          <div className="space-y-3 p-4">{[
            [Activity, "Classify", "Apply deterministic rules and risk boundaries."],
            [Route, "Route", "Choose a responsible human queue."],
            [UserCheck, "Review", "An authorized person accepts or rejects the draft."],
            [LockKeyhole, "Hold", "No downstream action executes from this surface."],
          ].map(([Icon, title, detail]) => { const IconComponent = Icon as typeof Activity; return <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3" key={String(title)}><IconComponent className="mt-0.5 size-4 text-teal-600" /><div><p className="text-xs font-black text-slate-900">{String(title)}</p><p className="mt-1 text-[10px] leading-5 text-slate-500">{String(detail)}</p></div></div>; })}</div>
        </SectionCard>
      </div>
    </section>
  </div>;
}
