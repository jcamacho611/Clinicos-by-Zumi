"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicLivingUniverseProjection } from "@/lib/orchestration/public-living-universe";

/**
 * The interactive half of the action-first surface.
 *
 * This component receives a finished projection and renders it. It deliberately imports
 * no engine and no catalog: the public bundle is the most exposed code Klinikos ships,
 * and Path routing is server authority. Everything here is plain data handed down from
 * the server component.
 */

const PATH_STATE_DOT: Record<PublicLivingUniverseProjection["steps"][number]["state"], string> = {
  complete: "bg-white/25",
  current: "bg-[#efaaa1]",
  upcoming: "bg-white/20",
  blocked: "bg-[#f0897e]",
};

const PATH_STATE_COPY: Record<PublicLivingUniverseProjection["steps"][number]["state"], string> = {
  complete: "Earlier modeled step",
  current: "Current modeled stage",
  upcoming: "Later modeled stage",
  blocked: "Blocked pending requirements",
};

const AVAILABILITY_TONE: Record<PublicLivingUniverseProjection["availability"], string> = {
  available_now: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  requires_setup: "border-[#d6b787]/25 bg-[#d6b787]/10 text-[#efd8ad]",
  requires_verification: "border-[#e6817b]/28 bg-[#e6817b]/10 text-[#efaaa1]",
  requires_organization_connection: "border-violet-300/25 bg-violet-300/10 text-violet-200",
  defined: "border-white/12 bg-white/[.04] text-[#b89f9b]",
};

/**
 * One Path, rendered as the Object Stage. Shared deliberately: the static front-door
 * stage and the stage Zumi recomposes after an answer are the same component, so a
 * visitor is never handed a second, differently-shaped application.
 */
export function PublicLivingUniverseObjectStage({
  item,
  signupEnabled,
}: {
  item: PublicLivingUniverseProjection;
  signupEnabled: boolean;
}) {
  const currentStep = item.steps.find((step) => step.state === "current") ?? item.steps[0];
  const currentIndex = currentStep ? item.steps.indexOf(currentStep) : -1;
  const nextStep = item.steps.slice(currentIndex + 1).find((step) => step.state === "upcoming" || step.state === "blocked")
    ?? item.steps.find((step) => step.state === "upcoming" || step.state === "blocked");
  const narrative = [
    {
      key: "before",
      label: "Starting point",
      eyebrow: "Path entry boundary",
      title: item.from,
      detail: "This describes the path's entry boundary. It is not a claim that you already hold a role, credential, reservation, eligibility decision, or authority.",
    },
    {
      key: "now",
      label: "Orchestration",
      eyebrow: "What Klinikos can organize first",
      title: currentStep?.label ?? item.title,
      detail: currentStep?.description ?? item.summary,
    },
    {
      key: "next",
      label: "Continuation",
      eyebrow: "What remains governed",
      title: nextStep?.label ?? item.to,
      detail: nextStep?.description ?? "Continue only after the required identity, eligibility, availability, authority, and transaction checks.",
    },
  ] as const;
  const gridDiscovery = item.pathId === "find-healthcare-resource" || item.pathId === "clinic-monetize-capacity";
  const signupHref = `/signup?returnTo=${encodeURIComponent(item.continuationHref)}`;

  return (
    <article
      className="overflow-hidden rounded-[28px] border border-white/[.09] bg-[#12090b] bg-[linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.012))] shadow-[0_28px_90px_rgba(0,0,0,.25)]"
      data-material="obsidian"
      data-object-stage="true"
    >
      <div className="p-5 sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[.16em] text-[#8e7c79]">
            Path preview
          </p>
          <h3 className="mt-3 text-xl font-medium tracking-[-.02em] text-[#f5edeb]">{item.title}</h3>
        </div>
        <span
          className={`ml-auto shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${AVAILABILITY_TONE[item.availability]}`}
        >
          {item.availabilityCopy}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-[#c6aeaa]">{item.summary}</p>

      <ol aria-label="Starting point, orchestration, continuation" className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.07] md:grid-cols-3">
        {narrative.map((moment) => (
          <li className="min-w-0 bg-[#0b0607]/95 p-5" key={moment.key}>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-2 rounded-full ${moment.key === "before" ? PATH_STATE_DOT.complete : moment.key === "now" ? PATH_STATE_DOT.current : PATH_STATE_DOT.upcoming}`} />
              <p className="text-[12px] font-semibold uppercase tracking-[.2em] text-[#e89b94]">{moment.label}</p>
            </div>
            <p className="mt-4 text-[12px] font-semibold uppercase tracking-[.14em] text-[#9f8985]">{moment.eyebrow}</p>
            <p className="mt-2 text-[13px] font-medium leading-5 text-[#f5edeb]">{moment.title}</p>
            <p className="mt-2 text-[12px] leading-5 text-[#a68e8a]">{moment.detail}</p>
          </li>
        ))}
      </ol>

      <aside aria-label="Inspector" className="mt-7 grid gap-5 border-t border-white/[.07] pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,.55fr)]">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.16em] text-[#8e7c79]">Inspector</p>
          <p className="mt-3 text-[12.5px] leading-6 text-[#bda5a1]">{item.governance}</p>
          {item.commercialBoundary ? <p className="mt-3 text-[12px] leading-6 text-[#8e7c79]">{item.commercialBoundary}</p> : null}
        </div>
        <details className="rounded-2xl border border-white/[.07] bg-black/10 p-4">
          <summary className="flex min-h-11 cursor-pointer items-center text-[12px] font-semibold uppercase tracking-[.14em] text-[#cdb7b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b]">Path checkpoints</summary>
          <ol className="mt-4 space-y-3">
            {item.steps.map((step, index) => (
              <li className="flex gap-3" key={`${item.id}-checkpoint-${index}`}>
                <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${PATH_STATE_DOT[step.state]}`} />
                <span className="text-[12px] leading-5 text-[#9d8884]">
                  {step.label}<span className="block text-[12px] text-[#9f8985]">{PATH_STATE_COPY[step.state]}</span>
                </span>
              </li>
            ))}
          </ol>
        </details>
      </aside>
      </div>

      <footer aria-label="Action dock" className="flex flex-wrap items-center gap-3 border-t border-white/[.08] bg-black/15 px-5 py-4 sm:px-7 lg:px-8">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6817b] px-5 text-[13px] font-semibold text-[#1a090a] transition hover:bg-[#efaaa1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f8c2bc] motion-reduce:transition-none"
          href={signupHref}
        >
          {signupEnabled ? "Join free and start here" : "View free membership status"} <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        {gridDiscovery ? (
          <Link className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-4 text-[12px] font-semibold text-[#e8cbc7] hover:border-[#efaaa1]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b]" href="/grid/browse">
            Explore Grid map and results
          </Link>
        ) : null}
        <span className="text-[12px] text-[#8e7c79]">
          {signupEnabled ? "Joining costs nothing and is not a credential." : "Account creation remains closed until its release evidence is complete."}
        </span>
      </footer>
    </article>
  );
}
