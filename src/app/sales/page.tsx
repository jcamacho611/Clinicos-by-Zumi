import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ds";
import { ZumiCommandShell, ZumiBriefingPanel, MissionPhaseProgress } from "@/components/command/zumi-command-shell";
import { ZumiInterview } from "@/components/command/zumi-interview";

/**
 * Clinic Operating Analysis — a Klinikos commercial qualification experience
 * guided by Klinikos Intelligence.
 */
export const metadata = {
  title: "Clinic Operating Analysis — Klinikos",
  description:
    "Klinikos maps where your clinic loses control — follow-ups, paperwork, referrals, results, billing readiness, staff ownership and revenue signals — then prepares a private workflow review for human approval.",
};

export default function ClinicOperatingAnalysisPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="mission-brief-heading" style={{ borderBottom: "var(--border-hair-dark)" }}>
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div>
            <MissionPhaseProgress current="brief" />
            <div className="mt-8"><Badge tone="mapping">Clinic Operating Analysis</Badge></div>
            <h1
              className="mt-5 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] sm:text-6xl lg:text-7xl"
              id="mission-brief-heading"
            >
              Your clinic does not need another dashboard. It needs an operating system.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8" style={{ color: "var(--text-secondary)" }}>
              Klinikos maps the work your clinic is losing track of — follow-ups, paperwork, referrals, results, billing readiness,
              staff tasks, med spa leads, and revenue opportunities — while Klinikos Intelligence guides the analysis and prepares
              a private workflow review for human approval.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#analysis"
                className="inline-flex min-h-12 items-center justify-center gap-2 px-5 text-xs font-extrabold"
                style={{ background: "var(--cyan-300)", color: "var(--obsidian)", borderRadius: "var(--radius-sm)" }}
              >
                Start Clinic Operating Analysis <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/founding-clinic"
                className="inline-flex min-h-12 items-center justify-center px-5 text-xs font-extrabold"
                style={{ color: "var(--text-primary)", border: "var(--border-hair-dark)", borderRadius: "var(--radius-sm)" }}
              >
                View Founding Clinic Qualification
              </Link>
            </div>
          </div>

          <ZumiBriefingPanel active>
            I&apos;ll ask a few operational questions, build your workflow map, and show what needs review. Do not enter patient names,
            records, diagnoses, or PHI. This analysis does not itself activate production access or external integrations.
          </ZumiBriefingPanel>
        </div>
      </section>

      <div id="analysis">
        <ZumiInterview />
      </div>
    </ZumiCommandShell>
  );
}
