"use client";

import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";

export const MEMBER_PLANE_LENSES = [
  {
    id: "healthcare_universe",
    number: "I",
    label: "Healthcare universe",
    shortLabel: "People",
  },
  {
    id: "economic_resource",
    number: "II",
    label: "Economic & resource",
    shortLabel: "Resources",
  },
  {
    id: "lifecycle",
    number: "III",
    label: "Lifecycle",
    shortLabel: "Your path",
  },
  {
    id: "operating_infrastructure",
    number: "IV",
    label: "Operating infrastructure",
    shortLabel: "Coordination",
  },
  {
    id: "compounding_business",
    number: "V",
    label: "Compounding business",
    shortLabel: "Value over time",
  },
] as const satisfies readonly {
  id: CanonicalPlaneId;
  number: string;
  label: string;
  shortLabel: string;
}[];

export type MemberPlaneLensProjection = {
  id: CanonicalPlaneId;
  title: string;
  description: string;
  status: string;
};

type PlaneLensProps = {
  lenses: MemberPlaneLensProjection[];
  activeLens: CanonicalPlaneId;
  onSelect: (lens: CanonicalPlaneId) => void;
};

function statusLabel(status: string) {
  return status.trim().replaceAll("_", " ");
}

export function PlaneLens({ lenses, activeLens, onSelect }: PlaneLensProps) {
  return (
    <nav aria-label="Five-plane view" className="relative">
      <div
        aria-hidden="true"
        className="absolute bottom-5 left-[18px] top-5 hidden w-px bg-gradient-to-b from-transparent via-[#a96c64]/45 to-transparent lg:block"
      />

      <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:gap-1.5 lg:overflow-visible lg:pb-0">
        {MEMBER_PLANE_LENSES.map((presentation) => {
          const projected = lenses.find((lens) => lens.id === presentation.id);
          const active = activeLens === presentation.id;

          return (
            <button
              aria-pressed={active}
              className={`group relative min-h-11 min-w-[152px] rounded-2xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d99287] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080506] motion-reduce:transition-none lg:min-w-0 lg:border-transparent lg:bg-transparent lg:pl-11 ${
                active
                  ? "border-[#b97870]/45 bg-[#2a1517]/80 text-[#fff8f5] lg:border-[#b97870]/25 lg:bg-[#1b0e10]/70"
                  : "border-white/[.08] bg-white/[.025] text-[#aa9792] hover:border-[#a96c64]/30 hover:text-[#eaded9]"
              }`}
              key={presentation.id}
              onClick={() => onSelect(presentation.id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`mb-2 grid size-7 place-items-center rounded-full border font-mono text-[11px] tracking-[.08em] lg:absolute lg:left-1 lg:top-1/2 lg:mb-0 lg:-translate-y-1/2 ${
                  active
                    ? "border-[#df9a8f] bg-[#c47c72] text-[#16090a] shadow-[0_0_28px_rgba(196,124,114,.32)]"
                    : "border-white/15 bg-[#0e090a] text-[#8d7772]"
                }`}
              >
                {presentation.number}
              </span>
              <span className="block text-[11px] font-semibold tracking-[-.01em]">
                {presentation.shortLabel}
              </span>
              <span className="mt-1 block truncate text-[11px] uppercase tracking-[.16em] text-[#816e6a]">
                {projected ? statusLabel(projected.status) : "not projected"}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
