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

          <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 sm:p-8">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#8e7c79]">
                  Where this goes
                </p>
                <h3 className="mt-3 text-xl font-medium tracking-[-.02em] text-[#f5edeb]">
                  {selected.title}
                </h3>
              </div>
              <span
                className={`ml-auto shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${AVAILABILITY_TONE[selected.availability]}`}
              >
                {selected.availabilityCopy}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-[#c6aeaa]">{selected.summary}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px] text-[#8e7c79]">
              <span className="text-[#b89f9b]">{selected.from}</span>
              <ArrowRight aria-hidden="true" className="size-3.5" />
              <span className="text-[#efaaa1]">{selected.to}</span>
            </div>

            <ol className="mt-7 space-y-4">
              {selected.steps.map((step, index) => (
                <li className="flex gap-3.5" key={`${selected.id}-${index}`}>
                  <span
                    aria-hidden="true"
                    className={`mt-[7px] size-2 shrink-0 rounded-full ${STATE_DOT[step.state]}`}
                  />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-[#f5edeb]">{step.label}</p>
                    <p className="mt-1 text-[12.5px] leading-6 text-[#a68e8a]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-7 border-t border-white/[.06] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#8e7c79]">
                What governs this
              </p>
              <p className="mt-2.5 text-[12.5px] leading-6 text-[#a68e8a]">{selected.governance}</p>
              {selected.commercialBoundary ? (
                <p className="mt-2.5 text-[12.5px] leading-6 text-[#a68e8a]">
                  {selected.commercialBoundary}
                </p>
              ) : null}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6817b] px-5 text-[13px] font-semibold text-[#1a090a] transition hover:bg-[#efaaa1]"
                href="/grid/join"
              >
                Join free and start here <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <span className="text-[12px] text-[#8e7c79]">
                Joining costs nothing and is not a credential.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
