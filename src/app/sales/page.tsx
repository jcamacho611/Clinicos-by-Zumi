import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MissionPhaseProgress, ZumiBriefingPanel, ZumiCommandShell } from "@/components/command/zumi-command-shell";
import { ZumiInterview } from "@/components/command/zumi-interview";

export const metadata = {
  title: "Clinic Operating Analysis — Klinikos by Zumi",
  description: "Tell Zumi how the clinic actually runs. Klinikos builds a preliminary operating map before a paid AI-assisted, specialist-reviewed Operational Audit is recommended.",
};

export default function ClinicOperatingAnalysisPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="mission-brief-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-12 lg:py-24">
          <div>
            <MissionPhaseProgress current="brief" />
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#b89a5b]">Operating intelligence built for the real clinic day</p>
            <h1 className="mt-4 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl" id="mission-brief-heading">
              Your clinic does not need another dashboard. It needs an operating system.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
              We built Klinikos from the operator side of healthcare: too many systems, too much after-hours work, and too many places for follow-up, revenue and accountability to disappear. Zumi starts by learning where your clinic feels that strain.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-none bg-[#f1f0eb] text-[#0b1e3a] hover:bg-white" size="lg"><Link href="#analysis">Start Clinic Operating Analysis <ArrowRight aria-hidden="true" className="size-4" /></Link></Button>
              <Button asChild className="rounded-none border border-white/20 bg-transparent text-slate-200 hover:bg-white/[.04] hover:text-white" size="lg" variant="secondary"><Link href="/founding-clinic">See the Founding Clinic pathway</Link></Button>
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-white/35">No PHI required · preliminary signals only · human review required</p>
          </div>
          <ZumiBriefingPanel active>
            I&apos;ll ask one operating question at a time, build your clinic map beside us, and estimate the correct Operational Audit tier from the provider scale you report. The paid audit is where AI analysis and a specialist verify the real numbers.
          </ZumiBriefingPanel>
        </div>
      </section>
      <div id="analysis"><ZumiInterview /></div>
    </ZumiCommandShell>
  );
}
