import Link from "next/link";
import { ArrowRight, Compass, Radar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HumanReviewBanner,
  MissionPhaseProgress,
  NoPHINotice,
  ZumiBriefingPanel,
  ZumiCommandShell,
} from "@/components/command/zumi-command-shell";

/**
 * Klinikos entry router.
 *
 * It establishes what the user needs, then routes them into the right experience.
 * No fields are collected here and no payment or clinical state changes here.
 */

export const metadata = {
  title: "Start | Klinikos",
  description:
    "Choose the Klinikos path that fits your goal. Zumi guides the operating analysis inside Klinikos and keeps consequential decisions with people.",
};

const entryPaths = [
  {
    icon: Radar,
    eyebrow: "For clinic operators",
    title: "Clinic Operating Analysis",
    body: "Answer a short sequence of operational questions. Zumi builds your operating map and shows where work may be losing continuity.",
    href: "/sales",
    cta: "Start the analysis",
    primary: true,
  },
  {
    icon: Compass,
    eyebrow: "For clinics ready to evaluate",
    title: "Founding Clinic Qualification",
    body: "Review whether Klinikos fits your clinic, what would be included, what still depends on external connections, and what production readiness requires.",
    href: "/founding-clinic",
    cta: "View qualification",
    primary: false,
  },
  {
    icon: ShieldCheck,
    eyebrow: "Healthcare opportunity network",
    title: "Klinikos Grid",
    body: "Find or offer eligible healthcare work, services, space, capacity, education, and other permitted resources. Regulated participation remains policy- and human-gated.",
    href: "/grid",
    cta: "Explore Grid",
    primary: false,
  },
] as const;

export default function StartPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="start-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div>
            <MissionPhaseProgress current="brief" />
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6c55b]">Choose your Klinikos path</p>
            <h1
              className="mt-4 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl"
              id="start-heading"
            >
              Start with what you need.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
              Klinikos routes you into the right experience. Zumi is the operating intelligence inside Klinikos, helping organize information and prepare the next step without replacing human review.
            </p>
          </div>

          <ZumiBriefingPanel active>
            Pick the path that matches your goal. If you are not sure, start with the Clinic Operating Analysis. Do not enter patient names,
            records, diagnoses, or PHI anywhere in the public qualification flow.
          </ZumiBriefingPanel>
        </div>
      </section>

      <section aria-labelledby="paths-heading" className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[.18em] text-cyan-300" id="paths-heading">Choose your entry</h2>

        <ul className="mt-6 grid gap-5 lg:grid-cols-3">
          {entryPaths.map((path) => (
            <li className="flex" key={path.href}>
              <article className={`flex w-full flex-col p-6 sm:p-7 ${path.primary ? "border border-cyan-300/30 bg-cyan-400/[.06]" : "border border-white/10 bg-white/[.04]"}`}>
                <path.icon aria-hidden="true" className={`size-5 ${path.primary ? "text-cyan-300" : "text-slate-400"}`} />
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{path.eyebrow}</p>
                <h3 className="mt-2 text-lg font-extrabold tracking-[-.03em] text-white">{path.title}</h3>
                <p className="mt-3 text-[12px] leading-6 text-slate-300">{path.body}</p>
                <div className="mt-auto pt-6">
                  <Button
                    asChild
                    className={path.primary ? "w-full" : "w-full border border-white/20 bg-transparent text-slate-200 hover:text-white"}
                    variant={path.primary ? "primary" : "secondary"}
                  >
                    <Link href={path.href}>{path.cta} <ArrowRight aria-hidden="true" className="size-4" /></Link>
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <NoPHINotice />
          <HumanReviewBanner />
        </div>
      </section>
    </ZumiCommandShell>
  );
}
