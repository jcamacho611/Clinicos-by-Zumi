import { ArrowRight, Check, CircleDashed } from "lucide-react";
import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";
import type {
  MemberObjectProjection,
  MemberTimelineProjection,
} from "@/components/living-universe/universe-shell";
import type { MemberPlaneLensProjection } from "@/components/living-universe/plane-lens";

type ObjectStageProps = {
  object: MemberObjectProjection;
  timeline: MemberTimelineProjection;
  activeLens: CanonicalPlaneId;
  lens: MemberPlaneLensProjection;
};

export function ObjectStage({ object, timeline, activeLens, lens }: ObjectStageProps) {
  const timelineItems = [
    { key: "before", label: "Before", body: timeline.before, icon: Check },
    { key: "now", label: "Now", body: timeline.now, icon: CircleDashed },
    { key: "next", label: "Next", body: timeline.next, icon: ArrowRight },
  ] as const;

  return (
    <section
      aria-labelledby="member-object-title"
      className="relative min-w-0 overflow-hidden rounded-[30px] border border-[#b77a72]/20 bg-[#130b0d]/90 px-5 py-6 shadow-[0_32px_100px_rgba(0,0,0,.36)] sm:px-8 sm:py-8"
      data-active-plane={activeLens}
      data-living-object-id={object.id}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 size-[360px] rounded-full border border-[#ba7b73]/10 bg-[radial-gradient(circle,rgba(196,124,114,.12),rgba(196,124,114,.025)_42%,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 top-8 size-28 rounded-full border border-[#e3b1a8]/10"
      />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#b98c85]">
              Active object · {object.kind}
            </p>
            <h1
              className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,5vw,3.65rem)] font-extralight leading-[1.02] tracking-[-.045em] text-[#f5efeb]"
              id="member-object-title"
            >
              {object.title}
            </h1>
          </div>
          <span className="rounded-full border border-[#d09288]/25 bg-[#d09288]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.12em] text-[#e5b1a9]">
            {object.state}
          </span>
        </div>

        <p className="mt-5 max-w-2xl text-[14px] leading-7 text-[#c4b2ad]">{object.summary}</p>

        {object.claimStatus === "claimed" ? (
          <div className="mt-6 rounded-2xl border border-[#c6a36a]/20 bg-[#c6a36a]/[.06] px-4 py-3.5">
            <p className="text-[11px] font-semibold text-[#e5c995]">
              Claimed information · not verified authority
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-[#b8a590]">
              {object.authorityNotice ?? "A claim remains a claim until the relevant source reviews it."}
            </p>
          </div>
        ) : object.authorityNotice ? (
          <p className="mt-6 border-l border-[#a67670]/35 pl-4 text-[12px] leading-6 text-[#ad9994]">
            {object.authorityNotice}
          </p>
        ) : null}

        <div className="mt-8 border-y border-white/[.065] py-5" aria-live="polite">
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#9f8985]">
            Seen through {lens.title}
          </p>
          <p className="mt-2 max-w-2xl text-[12px] leading-6 text-[#ad9a95]">{lens.description}</p>
        </div>

        <ol className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-white/[.065] bg-white/[.055] sm:grid-cols-3" aria-label="Before, now, next">
          {timelineItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === "now";
            return (
              <li className={`min-h-[148px] bg-[#0d0809] p-5 ${active ? "bg-[#1d1012]" : ""}`} key={item.key}>
                <div className="flex items-center gap-2.5">
                  <span className={`grid size-7 place-items-center rounded-full border ${active ? "border-[#d38b81]/40 bg-[#b96f67]/15 text-[#e3a39a]" : "border-white/10 text-[#806f6b]"}`}>
                    <Icon aria-hidden="true" className="size-3.5" />
                  </span>
                  <h2 className={`text-[11px] font-semibold uppercase tracking-[.16em] ${active ? "text-[#e2aaa2]" : "text-[#8d7a76]"}`}>
                    {item.label}
                  </h2>
                </div>
                <p className="mt-4 text-[12px] leading-6 text-[#b6a39e]">{item.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
