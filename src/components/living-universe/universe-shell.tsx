"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleUserRound, Sparkles } from "lucide-react";
import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";
import type { RealityProjection } from "@/lib/living-reality/reality-projection";
import { ObjectStage } from "@/components/living-universe/object-stage";
import {
  PlaneLens,
  type MemberPlaneLensProjection,
} from "@/components/living-universe/plane-lens";
import { Inspector } from "@/components/living-universe/inspector";
import { ActionDock } from "@/components/living-universe/action-dock";
import { LivingRealityLayer } from "@/components/living-reality/living-reality-layer";

export type MemberObjectProjection = {
  id: string;
  title: string;
  kind: string;
  state: string;
  summary: string;
  claimStatus?: "claimed" | "verified" | "in_review" | "unverified";
  authorityNotice?: string;
};

export type MemberTimelineProjection = {
  before: string;
  now: string;
  next: string;
};

export type MemberInspectorProjection = {
  eyebrow: string;
  title: string;
  body: string;
  evidence: string[];
  authority: string[];
};

export type MemberHomeAction = {
  id: string;
  label: string;
  /** Server-projected same-origin route. Every destination still enforces its own auth. */
  href: `/${string}`;
  description?: string;
};

export type MemberHomeProjection = {
  person: {
    displayName: string;
  };
  activeLens: CanonicalPlaneId;
  lenses: MemberPlaneLensProjection[];
  object: MemberObjectProjection;
  timeline: MemberTimelineProjection;
  inspector: MemberInspectorProjection;
  actions: MemberHomeAction[];
};

function lensProjection(
  lenses: MemberPlaneLensProjection[],
  id: CanonicalPlaneId,
): MemberPlaneLensProjection {
  const projected = lenses.find((lens) => lens.id === id);

  return projected ?? {
    id,
    number: "--",
    title: "Unavailable plane",
    description: "This lens has no additional projection for the current object.",
    status: "not_projected",
  };
}

export function UniverseShell({
  projection,
  realityProjection,
}: {
  projection: MemberHomeProjection;
  realityProjection: RealityProjection;
}) {
  // A member arrives in their lifecycle first. Switching lenses changes only the
  // explanation around this same object; it never asks the server to mutate authority.
  const [activeLens, setActiveLens] = useState<CanonicalPlaneId>(projection.activeLens);
  const lens = useMemo(
    () => lensProjection(projection.lenses, activeLens),
    [activeLens, projection.lenses],
  );

  return (
    <main
      className="relative isolate min-h-screen overflow-x-hidden bg-[#070405] bg-[radial-gradient(circle_at_54%_12%,rgba(181,111,103,.12),transparent_27%),radial-gradient(circle_at_0%_84%,rgba(101,68,64,.10),transparent_26%),linear-gradient(180deg,#080506_0%,#050304_100%)] text-[#f3ece8]"
      data-living-reality-host="member"
      data-member-living-universe="true"
      data-person-object-id={projection.object.id}
      data-reality-id={realityProjection.realityId}
    >
      <LivingRealityLayer projection={realityProjection} />
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#d08a80]/40 to-transparent" />

      <header className="relative z-10 mx-auto flex min-h-[88px] max-w-[1500px] items-center gap-4 px-4 sm:px-7 lg:px-10">
        <Link
          aria-label="Klinikos member home"
          className="flex min-h-11 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d99287]"
          href="/member"
        >
          <span className="grid size-10 place-items-center rounded-[14px] border border-[#bf7e76]/30 bg-[#160d0f] text-lg font-light text-[#ecc5be] shadow-[0_0_28px_rgba(183,105,98,.12)]">
            K
          </span>
          <span>
            <span className="block text-[11px] font-semibold tracking-[.24em] text-[#eee3df]">KLINIKOS</span>
            <span className="mt-0.5 block text-[11px] uppercase tracking-[.2em] text-[#9f8985]">Living home</span>
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-3 rounded-full border border-white/[.07] bg-white/[.025] py-1.5 pl-2 pr-2 backdrop-blur-md">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#261416] text-[#d79a91]">
            <CircleUserRound aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold text-[#e9ddda]">{projection.person.displayName}</span>
            <span className="block text-[11px] uppercase tracking-[.16em] text-[#9f8985]">One person · governed paths</span>
          </span>
          <form action="/api/auth/logout" method="post">
            <button
              className="min-h-9 rounded-full border border-white/[.08] px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-[#a9908b] transition hover:border-[#c7867d]/40 hover:text-[#eaded9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d99287] motion-reduce:transition-none"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 pb-8 sm:px-7 lg:px-10">
        <section className="mb-5 border-y border-white/[.055] py-4" aria-labelledby="member-context-title">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#9b7872]" id="member-context-title">
              <Sparkles aria-hidden="true" className="size-3.5" /> Your living context
            </p>
            <p className="text-[11px] leading-5 text-[#9f8c87]">
              The lens may change. Your Person identity and the evidence behind it do not.
            </p>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_270px]">
          <aside className="min-w-0 rounded-[24px] border border-white/[.06] bg-[#0c0809]/72 p-3 backdrop-blur-md lg:p-4">
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#9f8985]">Five-plane lens</p>
            <PlaneLens
              activeLens={activeLens}
              lenses={projection.lenses}
              onSelect={setActiveLens}
            />
          </aside>

          <div className="min-w-0">
            <ObjectStage
              activeLens={activeLens}
              lens={lens}
              object={projection.object}
              timeline={projection.timeline}
            />
            <ActionDock actions={projection.actions} />
          </div>

          <div className="min-w-0">
            <Inspector activeLens={activeLens} inspector={projection.inspector} lens={lens} />
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-5 text-[#9f8985]">
          Klinikos can organize claims, evidence, opportunities, and next steps. Verification and authority remain separate governed decisions.
        </p>
      </div>
    </main>
  );
}
