import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ds";
import { ZumiCommandShell, ZumiBriefingPanel, MissionPhaseProgress } from "@/components/command/zumi-command-shell";
import { ZumiInterview } from "@/components/command/zumi-interview";

export const metadata = {
  title: "Find the unfinished work — Klinikos",
  description:
    "Show Klinikos where work gets stuck. Zumi builds a truthful unfinished-work map, prepares a bounded first useful result, and advances paid capability only when additional economic value is demonstrated.",
};

export default function KlinikosCommercialEntryPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="mission-brief-heading" style={{ borderBottom: "var(--border-hair-dark)" }}>
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div>
            <MissionPhaseProgress current="brief" />
            <div className="mt-8"><Badge tone="mapping">First useful result</Badge></div>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] sm:text-6xl lg:text-7xl" id="mission-brief-heading">
              Show Klinikos what still needs to happen.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8" style={{ color: "var(--text-secondary)" }}>
              Start with unfinished work—not a software pitch. Klinikos organizes what is getting lost across follow-up, paperwork,
              referrals, results, billing readiness, staff ownership, access, capacity, and revenue work, then prepares one bounded
              result to review. Paid capability follows only when it creates additional economic value.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="#first-value" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-200 px-5 text-xs font-extrabold text-slate-950 hover:bg-rose-100">
                Map the unfinished work <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-5 text-xs font-extrabold text-white hover:border-rose-200/35">
                Explore governed capabilities
              </Link>
            </div>
          </div>

          <ZumiBriefingPanel active>
            I&apos;ll ask a few operating questions and build a reviewable map from what you report. Do not enter patient names,
            records, diagnoses, or PHI. Nothing here activates production access, creates authority, charges a card, or schedules a meeting.
          </ZumiBriefingPanel>
        </div>
      </section>

      <div id="first-value"><ZumiInterview /></div>
    </ZumiCommandShell>
  );
}
