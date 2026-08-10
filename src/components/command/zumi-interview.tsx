"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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
import {
  deriveOperatingMap,
  deriveSignalSummary,
  engagementOffers,
  guidedQuestions,
  interviewProgress,
  type InterviewAnswers,
  type MissionPhaseKey,
} from "@/lib/sales/zumi-command";

/**
 * The Zumi interview.
 *
 * One focused question at a time. Each answer becomes a clinic signal and the
 * operating map updates beside it, so the operator watches their own clinic being
 * organised rather than filling in a form.
 *
 * Everything here is client-side reasoning over the operator's own answers — no
 * clinical inference, and no PHI is requested at any point.
 */

export function ClinicSignalChips({ signals }: { signals: string[] }) {
  if (!signals.length) return null;
  return (
    <ul aria-label="Clinic signals captured" className="flex flex-wrap gap-1.5">
      {signals.map((signal) => (
        <li className="border border-cyan-300/30 bg-cyan-400/[.08] px-2.5 py-1 text-[10px] font-bold text-cyan-100" key={signal}>
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
    <div
      aria-labelledby={groupLabelId}
      className="border border-white/10 bg-white/[.04] p-6 sm:p-8"
      role="group"
    >
      <ZumiAssistantOrb active />
      <h2 className="mt-5 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-3xl" id={groupLabelId}>
        {question.prompt}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">{question.helper}</p>

      <div className="mt-7 flex flex-wrap gap-2">
        {question.options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              aria-pressed={isSelected}
              className={`flex min-h-[44px] items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                isSelected
                  ? "border-cyan-300 bg-cyan-400/15 text-white"
                  : "border-white/15 bg-white/[.02] text-slate-300 hover:border-white/40 hover:text-white"
              }`}
              key={option.value}
              onClick={() => onToggle(option.value)}
              type="button"
            >
              {isSelected && <Check aria-hidden="true" className="size-4 text-cyan-300" />}
              {option.label}
            </button>
          );
        })}
      </div>

      {!question.multiSelect && <p className="mt-4 text-[11px] text-slate-500">Choose one.</p>}
      {question.multiSelect && <p className="mt-4 text-[11px] text-slate-500">Choose as many as apply.</p>}
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
    () =>
      guidedQuestions
        .flatMap((entry) => entry.options.filter((option) => (answers[entry.key] ?? []).includes(option.value)))
        .map((option) => option.signal),
    [answers],
  );

  const map = useMemo(() => deriveOperatingMap(answers), [answers]);
  const summary = useMemo(() => deriveSignalSummary(answers), [answers]);

  const phase: MissionPhaseKey = progress.complete ? "signal" : progress.answered > 0 ? "map" : "interview";

  function toggle(value: string) {
    setAnswers((current) => {
      const existing = current[question.key] ?? [];
      if (!question.multiSelect) return { ...current, [question.key]: [value] };
      return {
        ...current,
        [question.key]: existing.includes(value) ? existing.filter((entry) => entry !== value) : [...existing, value],
      };
    });
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:py-16">
      <MissionPhaseProgress current={phase} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
        <div>
          <GuidedQuestionCard onToggle={toggle} question={question} selected={selected} />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              className="border border-white/15 bg-transparent text-slate-300 hover:text-white"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              type="button"
              variant="secondary"
            >
              <ArrowLeft aria-hidden="true" className="size-4" /> Back
            </Button>
            <Button
              disabled={selected.length === 0 || step === guidedQuestions.length - 1}
              onClick={() => setStep((current) => Math.min(guidedQuestions.length - 1, current + 1))}
              type="button"
              variant="primary"
            >
              Confirm &amp; continue <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <p aria-live="polite" className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">
              Phase {step + 1} of {guidedQuestions.length}
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <ClinicSignalChips signals={signals} />
            <NoPHINotice />
          </div>

          {finished && (
            <div className="mt-8 grid gap-5">
              <NextBestActionPanel summary={summary} />
              <div className="grid gap-5 sm:grid-cols-2">
                <WorkflowLeakageCard summary={summary} />
                <RevenueSignalCard summary={summary} />
              </div>
              <QualificationSummary answeredCount={progress.answered} summary={summary} totalCount={progress.total} />

              <section aria-labelledby="engagement-heading">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[.18em] text-cyan-300" id="engagement-heading">
                  Choose how to proceed
                </h2>
                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  {engagementOffers.map((offer) => (
                    <article className="flex flex-col border border-white/10 bg-white/[.04] p-6" key={offer.key}>
                      <h3 className="text-lg font-extrabold tracking-[-.03em] text-white">{offer.name}</h3>
                      <p className="mt-2 text-2xl font-extrabold tracking-[-.04em] text-[#e6c55b]">{offer.shortPrice}</p>
                      <p className="mt-4 text-[12px] leading-6 text-slate-400"><strong className="font-bold text-slate-200">Best for:</strong> {offer.bestFor}</p>
                      <p className="mt-3 text-[12px] leading-6 text-slate-400"><strong className="font-bold text-slate-200">What happens:</strong> {offer.whatHappens}</p>
                      <p className="mt-3 text-[11px] leading-5 text-slate-500">{offer.creditForward}</p>
                      <div className="mt-auto pt-6">
                        <Button asChild className="w-full" variant="primary"><Link href="/private-demo">{offer.cta}</Link></Button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="mt-5"><HumanReviewBanner /></div>
              </section>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-8">
          <ZumiBriefingPanel active={!progress.complete}>
            {progress.complete
              ? "Your operating map is built. Review the signal below, then choose how you want to proceed. A human reviews every request before anything is activated."
              : "I ask one operational question at a time and turn each answer into a clinic signal. Your operating map builds beside this as we go. Do not enter patient names, records, diagnoses, or any PHI."}
          </ZumiBriefingPanel>
          <div className="mt-6">
            <OperatingMapPanel signals={map} />
          </div>
        </aside>
      </div>
    </div>
  );
}
