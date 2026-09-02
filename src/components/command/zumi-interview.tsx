"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HumanReviewBanner,
  MissionPhaseProgress,
  NoPHINotice,
  ZumiAssistantOrb,
  ZumiBriefingPanel,
} from "@/components/command/zumi-command-shell";
import {
  NextBestActionPanel,
  OperatingMapPanel,
  QualificationSummary,
  RevenueSignalCard,
  WorkflowLeakageCard,
} from "@/components/command/zumi-operating-map";
import { buildFirstValueHandoffHref } from "@/lib/sales/intake-handoff";
import {
  deriveOperatingMap,
  deriveSignalSummary,
  guidedQuestions,
  interviewProgress,
  type InterviewAnswers,
  type MissionPhaseKey,
} from "@/lib/sales/zumi-command";

export function ClinicSignalChips({ signals }: { signals: string[] }) {
  if (!signals.length) return null;
  return (
    <ul aria-label="Operating signals captured" className="flex flex-wrap gap-1.5">
      {signals.map((signal) => (
        <li className="border border-[#e6817b]/25 bg-[#e6817b]/[.07] px-2.5 py-1 text-[12px] font-bold text-[#efaaa1]" key={signal}>
          {signal}
        </li>
      ))}
    </ul>
  );
}

export function GuidedQuestionCard({
  question,
  selected,
  onToggle,
}: {
  question: (typeof guidedQuestions)[number];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const groupLabelId = `question-${question.key}`;
  return (
    <div aria-labelledby={groupLabelId} className="border border-white/10 bg-white/[.04] p-6 sm:p-8" role="group">
      <ZumiAssistantOrb active />
      <h2 className="mt-5 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-3xl" id={groupLabelId}>{question.prompt}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">{question.helper}</p>
      <div className="mt-7 flex flex-wrap gap-2">
        {question.options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              aria-pressed={isSelected}
              className={`flex min-h-[44px] items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6817b] ${isSelected ? "border-[#e6817b]/45 bg-[#e6817b]/12 text-white" : "border-white/15 bg-white/[.02] text-slate-300 hover:border-white/40 hover:text-white"}`}
              key={option.value}
              onClick={() => onToggle(option.value)}
              type="button"
            >
              {isSelected && <Check aria-hidden="true" className="size-4 text-[#efaaa1]" />}
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] text-slate-500">{question.multiSelect ? "Choose as many as apply." : "Choose one."}</p>
    </div>
  );
}

export function ZumiInterview() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const question = guidedQuestions[step];
  const selected = answers[question.key] ?? [];
  const progress = interviewProgress(answers);
  const finished = step >= guidedQuestions.length - 1 && selected.length > 0;

  const signals = useMemo(
    () => guidedQuestions.flatMap((entry) => entry.options.filter((option) => (answers[entry.key] ?? []).includes(option.value))).map((option) => option.signal),
    [answers],
  );
  const map = useMemo(() => deriveOperatingMap(answers), [answers]);
  const summary = useMemo(() => deriveSignalSummary(answers), [answers]);
  const firstValueHref = useMemo(() => buildFirstValueHandoffHref(answers), [answers]);
  const phase: MissionPhaseKey = progress.complete ? "first_value" : progress.answered > 0 ? "map" : "interview";

  function toggle(value: string) {
    setAnswers((current) => {
      const existing = current[question.key] ?? [];
      if (!question.multiSelect) return { ...current, [question.key]: [value] };
      return { ...current, [question.key]: existing.includes(value) ? existing.filter((entry) => entry !== value) : [...existing, value] };
    });
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:py-16">
      <MissionPhaseProgress current={phase} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
        <div>
          <GuidedQuestionCard onToggle={toggle} question={question} selected={selected} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button className="border border-white/15 bg-transparent text-slate-300 hover:text-white" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} type="button" variant="secondary">
              <ArrowLeft aria-hidden="true" className="size-4" /> Back
            </Button>
            <Button disabled={selected.length === 0 || step === guidedQuestions.length - 1} onClick={() => setStep((current) => Math.min(guidedQuestions.length - 1, current + 1))} type="button" variant="primary">
              Confirm &amp; continue <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <p aria-live="polite" className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">Phase {step + 1} of {guidedQuestions.length}</p>
          </div>

          <div className="mt-6 grid gap-3"><ClinicSignalChips signals={signals} /><NoPHINotice /></div>

          {finished && (
            <div className="mt-8 grid gap-5">
              <NextBestActionPanel summary={summary} />
              <div className="grid gap-5 sm:grid-cols-2"><WorkflowLeakageCard summary={summary} /><RevenueSignalCard summary={summary} /></div>
              <QualificationSummary answeredCount={progress.answered} summary={summary} totalCount={progress.total} />

              <section aria-labelledby="first-value-heading" className="overflow-hidden border border-[#e6817b]/16 bg-[#100708]">
                <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-[#efaaa1]">First useful result</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white" id="first-value-heading">Show Klinikos the unfinished work.</h2>
                    <p className="mt-4 max-w-2xl text-xs leading-6 text-slate-400">
                      Carry only the operating categories you selected into a synthetic, human-reviewed first-value request. No payment is requested here, no production authority is created, and no meeting is scheduled automatically.
                    </p>
                  </div>
                  <Button asChild className="min-w-[230px]" variant="primary">
                    <Link href={firstValueHref}>Continue to first value <ArrowRight className="size-4" /></Link>
                  </Button>
                </div>
                <div className="grid gap-4 border-t border-white/10 bg-black/15 px-6 py-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="flex items-start gap-3 text-[11px] leading-5 text-slate-400">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" />
                    Only predefined operating categories are carried forward. Contact details, patient data, exact counts, vendor names, and financial values are not placed in the continuation URL.
                  </div>
                  <div className="flex flex-wrap gap-4 text-[11px] font-bold">
                    <Link className="text-[#efaaa1] hover:text-white" href="/pricing">See governed capabilities</Link>
                    <Link className="text-[#efaaa1] hover:text-white" href="/start">Explore Klinikos</Link>
                  </div>
                </div>
              </section>
              <HumanReviewBanner />
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-8">
          <ZumiBriefingPanel active={!progress.complete}>
            {progress.complete
              ? "Your unfinished-work map is ready. The next step is one bounded first useful result. Paid capability comes later only if additional economic value is demonstrated and a governed offer fits."
              : "I ask one operating question at a time and turn each answer into a reviewable signal. Do not enter patient names, records, diagnoses, or PHI."}
          </ZumiBriefingPanel>
          <div className="mt-6"><OperatingMapPanel signals={map} /></div>
        </aside>
      </div>
    </div>
  );
}
