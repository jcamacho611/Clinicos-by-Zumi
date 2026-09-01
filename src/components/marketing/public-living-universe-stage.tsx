"use client";

import { useState } from "react";
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

const STATE_DOT: Record<PublicLivingUniverseProjection["steps"][number]["state"], string> = {
  complete: "bg-emerald-300/70",
  current: "bg-[#efaaa1]",
  upcoming: "bg-white/20",
  blocked: "bg-[#f0897e]",
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
export function PublicLivingUniverseObjectStage({ item }: { item: PublicLivingUniverseProjection }) {
  const currentStep = item.steps.find((step) => step.state === "current") ?? item.steps[0];
  const currentIndex = currentStep ? item.steps.indexOf(currentStep) : -1;
  const nextStep = item.steps.slice(currentIndex + 1).find((step) => step.state === "upcoming" || step.state === "blocked")
    ?? item.steps.find((step) => step.state === "upcoming" || step.state === "blocked");
  const narrative = [
    {
      key: "before",
      label: "Before",
      eyebrow: "What you brought",
      title: item.from,
      detail: "Your objective starts in plain language; no role, credential, reservation, or authority is inferred from it.",
    },
    {
      key: "now",
      label: "Now",
      eyebrow: "What Klinikos can organize",
      title: currentStep?.label ?? item.title,
      detail: currentStep?.description ?? item.summary,
    },
    {
      key: "next",
      label: "Next",
      eyebrow: "What remains governed",
      title: nextStep?.label ?? item.to,
      detail: nextStep?.description ?? "Continue only after the required identity, eligibility, availability, authority, and transaction checks.",
    },
  ] as const;
  const gridDiscovery = item.pathId === "find-healthcare-resource" || item.pathId === "clinic-monetize-capacity";

  return (
    <article
      className="overflow-hidden rounded-[28px] border border-white/[.09] bg-[linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.012))] shadow-[0_28px_90px_rgba(0,0,0,.25)]"
      data-object-stage="true"
    >
      <div className="p-5 sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#8e7c79]">
            Active object
          </p>
          <h3 className="mt-3 text-xl font-medium tracking-[-.02em] text-[#f5edeb]">{item.title}</h3>
        </div>
        <span
          className={`ml-auto shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${AVAILABILITY_TONE[item.availability]}`}
        >
          {item.availabilityCopy}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-[#c6aeaa]">{item.summary}</p>

      <ol aria-label="Before, Now, Next" className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.07] md:grid-cols-3">
        {narrative.map((moment) => (
          <li className="min-w-0 bg-[#0b0607]/95 p-5" key={moment.key}>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-2 rounded-full ${moment.key === "before" ? STATE_DOT.complete : moment.key === "now" ? STATE_DOT.current : STATE_DOT.upcoming}`} />
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#e89b94]">{moment.label}</p>
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.14em] text-[#786764]">{moment.eyebrow}</p>
            <p className="mt-2 text-[13px] font-medium leading-5 text-[#f5edeb]">{moment.title}</p>
            <p className="mt-2 text-[12px] leading-5 text-[#a68e8a]">{moment.detail}</p>
          </li>
        ))}
      </ol>

      <aside aria-label="Inspector" className="mt-7 grid gap-5 border-t border-white/[.07] pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,.55fr)]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#8e7c79]">Inspector</p>
          <p className="mt-3 text-[12.5px] leading-6 text-[#bda5a1]">{item.governance}</p>
          {item.commercialBoundary ? <p className="mt-3 text-[12px] leading-6 text-[#8e7c79]">{item.commercialBoundary}</p> : null}
        </div>
        <details className="rounded-2xl border border-white/[.07] bg-black/10 p-4">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[.14em] text-[#cdb7b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b]">Path checkpoints</summary>
          <ol className="mt-4 space-y-3">
            {item.steps.map((step, index) => (
              <li className="flex gap-3" key={`${item.id}-checkpoint-${index}`}>
                <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${STATE_DOT[step.state]}`} />
                <span className="text-[11.5px] leading-5 text-[#9d8884]">{step.label}</span>
              </li>
            ))}
          </ol>
        </details>
      </aside>
      </div>

      <footer aria-label="Action dock" className="flex flex-wrap items-center gap-3 border-t border-white/[.08] bg-black/15 px-5 py-4 sm:px-7 lg:px-8">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6817b] px-5 text-[13px] font-semibold text-[#1a090a] transition hover:bg-[#efaaa1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f8c2bc] motion-reduce:transition-none"
          href="/signup"
        >
          Join free and start here <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        {gridDiscovery ? (
          <Link className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-4 text-[12px] font-semibold text-[#e8cbc7] hover:border-[#efaaa1]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b]" href="/grid">
            Explore the live Grid map
          </Link>
        ) : null}
        <span className="text-[12px] text-[#8e7c79]">
          Joining costs nothing and is not a credential.
        </span>
      </footer>
    </article>
  );
}

export function PublicLivingUniverseStage({ items }: { items: PublicLivingUniverseProjection[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  if (!selected) return null;

  const needs = items.filter((item) => item.side === "need");
  const haves = items.filter((item) => item.side === "have");

  return (
    <section
      aria-labelledby="klinikos-living-universe-heading"
      className="border-t border-white/[.06] px-5 py-20 sm:px-9"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="klinikos-living-universe-heading"
          className="max-w-[22ch] text-3xl font-light tracking-[-.03em] text-[#f5edeb] sm:text-4xl"
        >
          Say what you need. Klinikos works out the rest.
        </h2>
        <p className="mt-5 max-w-[62ch] text-sm leading-7 text-[#c6aeaa]">
          You never have to know which part of Klinikos to open. Pick the sentence closest to
          yours and you will see the real route, what it takes, and where it stands today.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="space-y-6">
            {[
              { title: "I need something", list: needs },
              { title: "I have something", list: haves },
            ].map((group) => (
              <div key={group.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#8e7c79]">
                  {group.title}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.list.map((item) => {
                    const active = item.id === selected.id;
                    return (
                      <button
                        aria-pressed={active}
                        className={`min-h-11 rounded-full border px-4 text-left text-[13px] font-medium transition ${
                          active
                            ? "border-[#e6817b] bg-[#e6817b]/15 text-[#f6dfdc]"
                            : "border-white/12 text-[#c6aeaa] hover:border-[#e6817b]/40 hover:text-[#f5edeb]"
                        }`}
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <PublicLivingUniverseObjectStage item={selected} />
        </div>
      </div>
    </section>
  );
}
