"use client";

import { useState } from "react";
import { Check, LoaderCircle, Send, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classifyWorkflow } from "@/lib/workflow-rules";
import type { WorkflowDecision } from "@/lib/types";

const examples = [
  "I have chest pain and can't breathe",
  "Can someone explain my lab result?",
  "I need a refill sent to my pharmacy",
  "Is this definitely covered by insurance?",
];

export function AiWorkflowDemo() {
  const [input, setInput] = useState(examples[1]);
  const [decision, setDecision] = useState<WorkflowDecision | null>(null);
  const [phase, setPhase] = useState<string | null>(null);

  function runWorkflow() {
    if (!input.trim() || phase) return;
    setDecision(null);
    setPhase("Reading request");
    window.setTimeout(() => setPhase("Checking clinical safety rules"), 420);
    window.setTimeout(() => setPhase("Selecting the correct human queue"), 850);
    window.setTimeout(() => {
      setDecision(classifyWorkflow(input));
      setPhase(null);
    }, 1320);
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
      <div className="border-b border-slate-100 bg-slate-950 p-5 text-white sm:p-6">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-400/15 text-teal-300 ring-1 ring-inset ring-teal-300/20"><Sparkles className="size-5" /></span><div><p className="text-sm font-extrabold">Safe routing simulator</p><p className="mt-0.5 text-[10px] text-slate-400">Try an incoming patient or caller message</p></div><Badge className="ml-auto bg-white/10 text-white ring-white/15">Demo only</Badge></div>
        <div className="mt-5 rounded-2xl bg-white/7 p-3 ring-1 ring-inset ring-white/10">
          <textarea className="min-h-24 w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-slate-500" onChange={(event) => setInput(event.target.value)} value={input} aria-label="Message to classify" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex flex-1 flex-wrap gap-1.5">{examples.slice(0, 3).map((example, index) => <button className="rounded-full bg-white/8 px-2.5 py-1 text-[9px] font-bold text-slate-300 transition hover:bg-white/15" key={example} onClick={() => setInput(example)}>Example {index + 1}</button>)}</div>
            <Button className="bg-lime-300 text-slate-950 hover:bg-lime-200" disabled={Boolean(phase)} onClick={runWorkflow} size="sm">Analyze <Send className="size-3.5" /></Button>
          </div>
        </div>
      </div>

      <div className="min-h-[286px] p-5 sm:p-6">
        {!phase && !decision && <div className="grid min-h-[230px] place-items-center text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><ShieldAlert className="size-6" /></span><p className="mt-4 text-sm font-extrabold text-slate-900">Ready to classify safely</p><p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">The engine identifies risk, chooses a queue, and blocks unsafe automation on this same screen.</p></div></div>}
        {phase && <div className="grid min-h-[230px] place-items-center text-center"><div><LoaderCircle className="mx-auto size-8 animate-spin text-teal-600" /><p className="mt-4 text-sm font-extrabold text-slate-900">{phase}</p><div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 animate-pulse rounded-full bg-teal-500" /></div><p className="mt-3 text-[10px] text-slate-400">No message has been sent.</p></div></div>}
        {decision && (
          <div>
            <div className="flex flex-wrap items-start gap-3"><div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Check className="size-5" /></div><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">Classification</p><p className="mt-1 text-lg font-extrabold tracking-[-.03em] text-slate-950">{decision.category}</p></div><Badge className="ml-auto" tone={decision.riskLevel === "Urgent" ? "rose" : decision.riskLevel === "Needs Provider" ? "amber" : "sky"}>{decision.riskLevel}</Badge></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold text-slate-400">ROUTE</p><p className="mt-1 text-xs font-extrabold text-slate-900">{decision.assignedTeam}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold text-slate-400">HUMAN REVIEW</p><p className="mt-1 text-xs font-extrabold text-slate-900">{decision.requiresHumanReview ? "Required" : "Not required"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold text-slate-400">AUTO-SEND</p><p className="mt-1 text-xs font-extrabold text-slate-900">{decision.blockedFromAutoSend ? "Blocked" : "Allowed for office info"}</p></div></div>
            <div className="mt-4 rounded-xl border border-slate-200 p-3"><p className="text-[9px] font-bold text-slate-400">NEXT ACTION</p><p className="mt-1 text-xs font-semibold text-slate-700">{decision.action}</p></div>
            {decision.emergencyMessage && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold leading-5 text-rose-800">{decision.emergencyMessage}</div>}
            {decision.safetyMessage && <p className="mt-3 text-[10px] leading-5 text-slate-500">{decision.safetyMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
