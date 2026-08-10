import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Compass, Radar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HumanReviewBanner, MissionPhaseProgress, NoPHINotice, ZumiBriefingPanel, ZumiCommandShell } from "@/components/command/zumi-command-shell";
import { getClinicSession } from "@/lib/auth/session";

export const metadata = {
  title: "Start — Klinikos by Zumi",
  description: "Enter the Klinikos Clinic Operating Analysis, Founding Clinic pathway, or GRID network from the Zumi command experience.",
};

const entryPaths = [
  {
    icon: Radar,
    eyebrow: "Most clinic operators start here",
    title: "Clinic Operating Analysis",
    body: "Tell Zumi how the clinic actually runs. A live map forms around your reported cost, workflow and revenue pressure before a paid audit is recommended.",
    href: "/sales",
    cta: "Start the analysis",
    primary: true,
  },
  {
    icon: Compass,
    eyebrow: "Understand the commercial pathway",
    title: "Founding Clinic Qualification",
    body: "See the paid Operational Audit, $8,000 Founding Clinic implementation, Founder Promise and the boundary between analysis and production activation.",
    href: "/founding-clinic",
    cta: "View qualification",
    primary: false,
  },
  {
    icon: ShieldCheck,
    eyebrow: "Independent provider network",
    title: "Klinikos GRID",
    body: "For qualified providers and locations entering the governed capacity network. Credential and production requirements remain subject to human review.",
    href: "/grid/join",
    cta: "Explore GRID entry",
    primary: false,
  },
] as const;

export default async function StartPage() {
  if (await getClinicSession()) redirect("/dashboard");
  return (
    <ZumiCommandShell>
      <section aria-labelledby="start-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-12 lg:py-24">
          <div>
            <MissionPhaseProgress current="brief" />
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#b89a5b]">Command center entry</p>
            <h1 className="mt-4 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl" id="start-heading">Tell Zumi how the clinic actually runs.</h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">Klinikos starts with the operator&apos;s reality, not a software tour. We map the strain first, then decide whether a paid Operational Audit is justified and whether the clinic should ever be offered implementation.</p>
          </div>
          <ZumiBriefingPanel active>Pick the path that matches where you are. If you are not sure, start with the Clinic Operating Analysis. I&apos;ll keep the conversation focused on clinic operations and business systems, not patient information.</ZumiBriefingPanel>
        </div>
      </section>

      <section aria-labelledby="paths-heading" className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:px-12">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#43d9ff]" id="paths-heading">Choose your entry</h2>
        <ul className="mt-6 grid gap-5 lg:grid-cols-3">
          {entryPaths.map((path) => <li className="flex" key={path.href}><article className={`flex w-full flex-col p-6 sm:p-7 ${path.primary ? "border border-[#43d9ff]/30 bg-[#43d9ff]/[.06]" : "border border-white/10 bg-white/[.04]"}`}><path.icon aria-hidden="true" className={`size-5 ${path.primary ? "text-[#43d9ff]" : "text-slate-400"}`} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{path.eyebrow}</p><h3 className="mt-2 text-lg font-extrabold tracking-[-.03em] text-white">{path.title}</h3><p className="mt-3 text-[12px] leading-6 text-slate-300">{path.body}</p><div className="mt-auto pt-6"><Button asChild className={path.primary ? "w-full rounded-none bg-[#1677a8] text-white hover:bg-[#1a84ba]" : "w-full rounded-none border border-white/20 bg-transparent text-slate-200 hover:bg-white/[.04] hover:text-white"} variant={path.primary ? "default" : "secondary"}><Link href={path.href}>{path.cta} <ArrowRight aria-hidden="true" className="size-4" /></Link></Button></div></article></li>)}
        </ul>
        <div className="mt-10 grid gap-4 lg:grid-cols-2"><NoPHINotice /><HumanReviewBanner /></div>
      </section>
    </ZumiCommandShell>
  );
}
