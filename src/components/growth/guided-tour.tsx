"use client";

import Link from "next/link";
import { useState } from "react";
import { commandSurfaces } from "@/lib/design/command-system";
import { DEMONSTRATION_DATA_NOTICE, guidedTour } from "@/lib/growth/demonstration";
import { recordIntent } from "@/components/growth/intent-beacon";

/**
 * The guided product tour.
 *
 * Seven fixed steps a visitor advances through. There is no way to enter a command
 * and no account is created, because operational Klinikos is what the subscription
 * buys — this shows the product rather than lending it out.
 *
 * Each step names the surface it happens on and what the clinic would have lost
 * without it. The second column is the whole argument: a tour that only shows the
 * happy path does not explain why anyone should change software.
 */
export function GuidedTour() {
  const [step, setStep] = useState(1);
  const current = guidedTour[step - 1];
  const atEnd = step === guidedTour.length;

  function go(next: number) {
    const bounded = Math.min(guidedTour.length, Math.max(1, next));
    setStep(bounded);
    if (bounded === 2) recordIntent("demo_started", "guided_tour");
    if (bounded === guidedTour.length) recordIntent("demo_completed", "guided_tour");
  }

  return (
    <div className="mt-10">
      <ol className="flex flex-wrap gap-2" aria-label="Tour steps">
        {guidedTour.map((entry) => {
          const state = entry.index === step ? "current" : entry.index < step ? "done" : "upcoming";
          return (
            <li key={entry.index}>
              <button
                aria-current={state === "current" ? "step" : undefined}
                className={`${commandSurfaces.interactive} min-w-[44px] border px-3 text-[12px] font-extrabold tabular-nums ${
                  state === "current"
                    ? "border-cyan-300/50 bg-cyan-400/[.1] text-cyan-200"
                    : state === "done"
                      ? "border-white/20 bg-white/[.05] text-slate-300"
                      : "border-white/10 bg-transparent text-slate-500"
                }`}
                onClick={() => go(entry.index)}
                type="button"
              >
                {entry.index}
              </button>
            </li>
          );
        })}
      </ol>

      <div className={`${commandSurfaces.panelRaised} mt-6 p-6 sm:p-8`}>
        <p className={commandSurfaces.eyebrow}>
          Step {current.index} of {guidedTour.length} · {current.surface}
        </p>
        <h3 className={`${commandSurfaces.headline} mt-3 text-2xl sm:text-3xl`}>{current.title}</h3>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">{current.body}</p>

        <div className={`${commandSurfaces.panelBoundary} mt-6 p-4`}>
          <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-rose-300">Without Klinikos</p>
          <p className="mt-1.5 text-[13px] leading-6 text-slate-200">{current.withoutKlinikos}</p>
        </div>

        <div className="mt-7 flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button
            className={`${commandSurfaces.interactive} border border-white/15 bg-white/[.04] px-4 text-sm font-extrabold text-slate-200 disabled:opacity-40`}
            disabled={step === 1}
            onClick={() => go(step - 1)}
            type="button"
          >
            Back
          </button>
          <button
            className={`${commandSurfaces.interactive} border border-cyan-300/40 bg-cyan-400/[.08] px-4 text-sm font-extrabold text-cyan-200 disabled:opacity-40`}
            disabled={atEnd}
            onClick={() => go(step + 1)}
            type="button"
          >
            Next
          </button>
          {atEnd && (
            <Link
              className={`${commandSurfaces.interactive} inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-4 text-sm font-extrabold text-[#f0dda0]`}
              href="/pricing"
              onClick={() => recordIntent("pricing_viewed", "guided_tour")}
            >
              See what Klinikos costs
            </Link>
          )}
        </div>
      </div>

      <p className="mt-5 text-[11px] leading-5 text-slate-500">{DEMONSTRATION_DATA_NOTICE}</p>
    </div>
  );
}
