import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZumiCommandShell, ZumiBriefingPanel, MissionPhaseProgress } from "@/components/command/zumi-command-shell";
import { ZumiInterview } from "@/components/command/zumi-interview";

/**
 * Clinic Operating Analysis — the Zumi command experience.
 *
 * Replaces the previous full-page intake form. The interaction model is the change:
 * Zumi asks one operational question at a time and builds a live operating map,
 * rather than presenting a wall of fields for the operator to fill in.
 */

export const metadata = {
  title: "Clinic Operating Analysis — Klinikos by Zumi",
  description:
    "Zumi maps where your clinic loses control — follow-ups, paperwork, referrals, results, billing readiness, staff ownership and revenue signals — then prepares a private workflow review for human approval.",
};

export default function ClinicOperatingAnalysisPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="mission-brief-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div>
            <MissionPhaseProgress current="brief" />
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6c55b]">Clinic Operating Analysis</p>
            <h1
              className="mt-4 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl"
              id="mission-brief-heading"
            >
              Your clinic does not need another dashboard. It needs an operating system.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
              Klinikos by Zumi maps the work your clinic is losing track of — follow-ups, paperwork, referrals, results, billing
              readiness, staff tasks, med spa leads and revenue opportunities — then prepares a private workflow review for human
              approval.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="primary">
                <Link href="#analysis">Start Clinic Operating Analysis <ArrowRight aria-hidden="true" className="size-4" /></Link>
              </Button>
              <Button asChild className="border border-white/20 bg-transparent text-slate-200 hover:text-white" size="lg" variant="secondary">
                <Link href="/founding-clinic">View Founding Clinic Qualification</Link>
              </Button>
            </div>
          </div>

          <ZumiBriefingPanel active>
            I&apos;ll ask a few operational questions, build your workflow map, and show what needs review. Do not enter patient names,
            records, diagnoses, or PHI.
          </ZumiBriefingPanel>
        </div>
      </section>

      <div id="analysis">
        <ZumiInterview />
      </div>
    </ZumiCommandShell>
  );
}
