"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Cpu, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HumanReviewBanner, MissionPhaseProgress, NoPHINotice, ZumiAssistantOrb, ZumiBriefingPanel } from "@/components/command/zumi-command-shell";
import { NextBestActionPanel, OperatingMapPanel, QualificationSummary, RevenueSignalCard, WorkflowLeakageCard } from "@/components/command/zumi-operating-map";
import { auditPriceForAnswers, deriveOperatingMap, deriveSignalSummary, guidedQuestions, interviewProgress, preliminaryAuditScore, preliminaryQualificationLabel, type InterviewAnswers, type MissionPhaseKey } from "@/lib/sales/zumi-command";

export function ClinicSignalChips({ signals }: { signals: string[] }) {
  if (!signals.length) return null;
  return <ul aria-label="Clinic signals captured" className="flex flex-wrap gap-1.5">{signals.slice(-8).map((signal, index) => <li className="border border-[#43d9ff]/30 bg-[#43d9ff]/[.08] px-2.5 py-1 text-[10px] font-bold text-[#bcefff]" key={`${signal}-${index}`}>{signal}</li>)}</ul>;
}

export function GuidedQuestionCard({ question, selected, onToggle }: { question: (typeof guidedQuestions)[number]; selected: string[]; onToggle: (value: string) => void }) {
  const groupLabelId = `question-${question.key}`;
  return <div aria-labelledby={groupLabelId} className="border border-white/10 bg-white/[.04] p-6 sm:p-8" role="group">
    <ZumiAssistantOrb active />
    <h2 className="mt-5 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-3xl" id={groupLabelId}>{question.prompt}</h2>
    <p className="mt-3 text-sm leading-6 text-slate-400">{question.helper}</p>
    <div className="mt-7 flex flex-wrap gap-2">{question.options.map((option) => {
      const isSelected = selected.includes(option.value);
      return <button aria-pressed={isSelected} className={`flex min-h-[44px] items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#43d9ff] ${isSelected ? "border-[#43d9ff] bg-[#43d9ff]/15 text-white" : "border-white/15 bg-white/[.02] text-slate-300 hover:border-white/40 hover:text-white"}`} key={option.value} onClick={() => onToggle(option.value)} type="button">{isSelected && <Check aria-hidden="true" className="size-4 text-[#43d9ff]" />}{option.label}</button>;
    })}</div>
    <p className="mt-4 text-[11px] text-slate-500">{question.multiSelect ? "Choose as many as apply." : "Choose one."}</p>
  </div>;
}

export function ZumiInterview() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const question = guidedQuestions[step];
  const selected = answers[question.key] ?? [];
  const progress = interviewProgress(answers);
  const finished = progress.complete;
  const signals = useMemo(() => guidedQuestions.flatMap((entry) => entry.options.filter((option) => (answers[entry.key] ?? []).includes(option.value))).map((option) => option.signal), [answers]);
  const map = useMemo(() => deriveOperatingMap(answers), [answers]);
  const summary = useMemo(() => deriveSignalSummary(answers), [answers]);
  const score = useMemo(() => preliminaryAuditScore(answers), [answers]);
  const qualificationLabel = preliminaryQualificationLabel(score);
  const auditPrice = auditPriceForAnswers(answers);
  const phase: MissionPhaseKey = finished ? "offer" : progress.answered > 0 ? "map" : "interview";

  function toggle(value: string) {
    setAnswers((current) => {
      const existing = current[question.key] ?? [];
      if (!question.multiSelect) return { ...current, [question.key]: [value] };
      return { ...current, [question.key]: existing.includes(value) ? existing.filter((entry) => entry !== value) : [...existing, value] };
    });
  }

  return <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
    <MissionPhaseProgress current={phase} />
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
      <div>
        <GuidedQuestionCard onToggle={toggle} question={question} selected={selected} />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button className="border border-white/15 bg-transparent text-slate-300 hover:bg-white/[.04] hover:text-white" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} type="button" variant="secondary"><ArrowLeft aria-hidden="true" className="size-4" /> Back</Button>
          <Button className="bg-[#1677a8] text-white hover:bg-[#1a84ba]" disabled={selected.length === 0 || step === guidedQuestions.length - 1} onClick={() => setStep((current) => Math.min(guidedQuestions.length - 1, current + 1))} type="button">Confirm &amp; continue <ArrowRight aria-hidden="true" className="size-4" /></Button>
          <p aria-live="polite" className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">Phase {step + 1} of {guidedQuestions.length}</p>
        </div>
        <div className="mt-6 grid gap-3"><ClinicSignalChips signals={signals} /><NoPHINotice /></div>

        {finished && <div className="mt-8 grid gap-5">
          <NextBestActionPanel summary={summary} />
          <div className="grid gap-5 sm:grid-cols-2"><WorkflowLeakageCard summary={summary} /><RevenueSignalCard summary={summary} /></div>
          <QualificationSummary answeredCount={progress.answered} auditPrice={auditPrice} label={qualificationLabel} score={score} summary={summary} totalCount={progress.total} />
          <section className="border border-[#b89a5b]/35 bg-[#b89a5b]/[.07] p-6 sm:p-8" aria-labelledby="audit-offer-heading">
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#d9c59b]">The first paid product</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_.62fr] lg:items-end">
              <div><h2 className="text-3xl font-extrabold tracking-[-.05em] text-white" id="audit-offer-heading">Klinikos Operational Audit</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Your preliminary starting fee is <strong className="text-white">${auditPrice.toLocaleString()}</strong> based on the provider scale you reported. The fee covers AI/API analysis, specialist labor, operating-cost review, workflow analysis and preparation of the Clinic Operating Report.</p><p className="mt-3 text-[11px] leading-5 text-slate-500">A specialist confirms clinic size and scope before payment. The audit is a real standalone service and does not guarantee Founding Clinic acceptance.</p></div>
              <div className="grid gap-3"><div className="flex items-center gap-3 border border-white/10 bg-black/20 p-4 text-xs text-slate-300"><Cpu className="size-4 text-[#43d9ff]" /> AI-assisted operating analysis</div><div className="flex items-center gap-3 border border-white/10 bg-black/20 p-4 text-xs text-slate-300"><UserCheck className="size-4 text-[#b89a5b]" /> Specialist verification and review</div><Button asChild className="h-12 rounded-none bg-[#f1f0eb] text-[#0b1e3a] hover:bg-white"><Link href="/founding-clinic">Review the paid audit pathway <ArrowRight className="size-4" /></Link></Button></div>
            </div>
          </section>
          <HumanReviewBanner />
        </div>}
      </div>
      <aside className="lg:sticky lg:top-8"><ZumiBriefingPanel active={!finished}>{finished ? "Your preliminary operating map is built. The next step is not a generic software demo. A specialist confirms whether the paid Operational Audit is justified and verifies the fee before payment." : "I ask one operating question at a time and turn each answer into a clinic signal. Your operating map builds beside us. Do not enter patient names, records, diagnoses, insurance identifiers, or any PHI."}</ZumiBriefingPanel><div className="mt-6"><OperatingMapPanel signals={map} /></div></aside>
    </div>
  </div>;
}
