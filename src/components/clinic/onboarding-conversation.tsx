"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { commandSurfaces } from "@/lib/design/command-system";
import { ZumiAssistantOrb } from "@/components/command/zumi-command-shell";
import {
  currentSystemLabels,
  currentSystems,
  migrationOutlook,
  nextStep,
  onboardingProgress,
  ONBOARDING_HONESTY_NOTICE,
  operationalPriorities,
  priorityLabels,
  specialties,
  specialtyLabels,
  type KnownContext,
  type OnboardingAnswers,
} from "@/lib/onboarding/onboarding-rules";

/**
 * Zumi-guided clinic setup.
 *
 * One question at a time, in the order a person would ask them, with everything
 * Klinikos already knows shown as a proposal to correct rather than a blank to fill.
 * Steps whose answer is already known are skipped entirely — confirming a fact nobody
 * disputed is still homework.
 *
 * Choices are presented as options rather than free text wherever the answer is one
 * of a known set, because picking is faster than typing and produces data Klinikos
 * can act on.
 */
export function OnboardingConversation({ context }: { context: KnownContext }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [clinicNameDraft, setClinicNameDraft] = useState(context.clinicName ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const step = useMemo(() => nextStep(context, answers), [context, answers]);
  const progress = onboardingProgress(context, answers);

  function answer(patch: OnboardingAnswers) {
    setAnswers((current) => ({ ...current, ...patch }));
  }

  function finish() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, clinicName: answers.clinicName ?? context.clinicName ?? undefined }),
      }).catch(() => null);

      if (!response?.ok) {
        const payload = await response?.json().catch(() => null);
        setError(payload?.error ?? "Setup could not be saved.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  const outlook = migrationOutlook(answers.currentSystem);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <div className="flex items-center gap-4">
        <ZumiAssistantOrb active />
        <div>
          <p className={commandSurfaces.eyebrowAi}>Zumi is setting up your clinic</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {progress.done} of {progress.total} answered
          </p>
        </div>
      </div>

      <div className={`${commandSurfaces.panelRaised} mt-8 p-6 sm:p-8`}>
        <p className="text-lg leading-8 text-white">{step.prompt(context, answers)}</p>

        {step.key === "identity" && (
          <div className="mt-6 grid gap-3">
            <input
              aria-label="Clinic name"
              className="min-h-[44px] border border-white/10 bg-[#05090f] px-3 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              onChange={(event) => setClinicNameDraft(event.target.value)}
              value={clinicNameDraft}
            />
            <Primary disabled={clinicNameDraft.trim().length < 2} onClick={() => answer({ clinicName: clinicNameDraft.trim() })}>
              {context.clinicName === clinicNameDraft ? "That is right" : "Use this name"}
            </Primary>
          </div>
        )}

        {step.key === "specialty" && (
          <Options
            onSelect={(value) => answer({ specialty: value })}
            options={specialties.map((value) => ({ value, label: specialtyLabels[value] }))}
          />
        )}

        {step.key === "scale" && (
          <div className="mt-6 grid gap-6">
            <Scale label="Providers" onSelect={(value) => answer({ providerCount: value })} selected={answers.providerCount} />
            <Scale label="Locations" onSelect={(value) => answer({ locationCount: value })} selected={answers.locationCount} />
          </div>
        )}

        {step.key === "current_system" && (
          <Options
            onSelect={(value) => answer({ currentSystem: value })}
            options={currentSystems.map((value) => ({ value, label: currentSystemLabels[value] }))}
          />
        )}

        {step.key === "priorities" && (
          <div className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {operationalPriorities.map((priority) => {
                const active = answers.priorities?.includes(priority) ?? false;
                return (
                  <li key={priority}>
                    <button
                      aria-pressed={active}
                      className={`${commandSurfaces.interactive} border px-3.5 text-[13px] font-semibold ${
                        active ? "border-cyan-300/50 bg-cyan-400/[.1] text-cyan-200" : "border-white/15 bg-white/[.04] text-slate-300"
                      }`}
                      onClick={() =>
                        setAnswers((current) => {
                          const chosen = new Set(current.priorities ?? []);
                          if (chosen.has(priority)) chosen.delete(priority);
                          else chosen.add(priority);
                          return { ...current, priorities: [...chosen] };
                        })
                      }
                      type="button"
                    >
                      {priorityLabels[priority]}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Primary
              disabled={(answers.priorities?.length ?? 0) === 0}
              onClick={() => answer({ priorities: answers.priorities })}
            >
              These are the ones
            </Primary>
          </div>
        )}

        {step.key === "review" && (
          <div className="mt-6 grid gap-5">
            <Summary label="Clinic" value={answers.clinicName ?? context.clinicName ?? "—"} />
            <Summary label="Type" value={answers.specialty ? specialtyLabels[answers.specialty as keyof typeof specialtyLabels] : "—"} />
            <Summary label="Scale" value={`${(answers.providerCount ?? context.providerCount ?? "—").replace(/_/g, "–")} providers · ${(answers.locationCount ?? context.locationCount ?? "—").replace(/_/g, "–")} locations`} />
            <Summary label="Leaving" value={answers.currentSystem ? currentSystemLabels[answers.currentSystem as keyof typeof currentSystemLabels] : "—"} />

            <div className={`${commandSurfaces.panelAi} p-4`}>
              <p className={commandSurfaces.eyebrowAi}>What Klinikos can migrate</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-200">{outlook.note}</p>
              {outlook.needsExport.length > 0 && (
                <p className="mt-3 text-[12px] leading-6 text-slate-400">
                  Needs from you: {outlook.needsExport.join(", ")}.
                </p>
              )}
              {outlook.needsReview.length > 0 && (
                <p className="mt-1.5 text-[12px] leading-6 text-slate-400">
                  Needs review: {outlook.needsReview.join(", ")}.
                </p>
              )}
            </div>

            <p className={`${commandSurfaces.panelReview} p-4 text-[12px] leading-6 text-slate-200`}>{ONBOARDING_HONESTY_NOTICE}</p>

            <Primary disabled={pending} onClick={finish}>
              {pending ? "Setting up…" : "Set up my clinic"}
            </Primary>
            {error && <p className="text-[12px] text-rose-300">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Primary({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      className={`${commandSurfaces.interactive} mt-5 inline-flex items-center justify-self-start border border-cyan-300/40 bg-cyan-400/[.08] px-5 text-sm font-extrabold text-cyan-200 disabled:opacity-40`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Options<T extends string>({ options, onSelect }: { options: { value: T; label: string }[]; onSelect: (value: T) => void }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {options.map((option) => (
        <li key={option.value}>
          <button
            className={`${commandSurfaces.interactive} border border-white/15 bg-white/[.04] px-3.5 text-[13px] font-semibold text-slate-200 hover:border-white/35`}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

const SCALE_BANDS = ["1", "2_5", "6_15", "16_30", "30_plus"] as const;
const SCALE_LABELS: Record<(typeof SCALE_BANDS)[number], string> = {
  "1": "1", "2_5": "2–5", "6_15": "6–15", "16_30": "16–30", "30_plus": "30+",
};

function Scale({ label, selected, onSelect }: { label: string; selected?: string; onSelect: (value: string) => void }) {
  return (
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">{label}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {SCALE_BANDS.map((band) => (
          <li key={band}>
            <button
              aria-pressed={selected === band}
              className={`${commandSurfaces.interactive} border px-4 text-[13px] font-extrabold tabular-nums ${
                selected === band ? "border-cyan-300/50 bg-cyan-400/[.1] text-cyan-200" : "border-white/15 bg-white/[.04] text-slate-300"
              }`}
              onClick={() => onSelect(band)}
              type="button"
            >
              {SCALE_LABELS[band]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
