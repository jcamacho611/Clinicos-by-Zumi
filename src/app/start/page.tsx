import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, Radar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HumanReviewBanner,
  MissionPhaseProgress,
  NoPHINotice,
  ZumiBriefingPanel,
  ZumiCommandShell,
} from "@/components/command/zumi-command-shell";

export const metadata = {
  title: "Start — Klinikos",
  description:
    "Choose how you want to use Klinikos: operate a clinic, join the Grid, learn through Klinikos EDU, or begin a clinic operating analysis.",
};

const entryPaths = [
  {
    icon: Radar,
    eyebrow: "Clinic owners & operators",
    title: "Map what is breaking first",
    body: "Answer a short set of operational questions. Klinikos turns the answers into a practical view of follow-up, paperwork, referrals, results, staffing, and revenue leakage.",
    href: "/sales",
    cta: "Start the clinic analysis",
    primary: true,
  },
  {
    icon: Building2,
    eyebrow: "Run a clinic",
    title: "Clinic OS",
    body: "Sign in to operate patients, schedules, tasks, forms, follow-up, referrals, results, revenue work, and the daily work that normally gets scattered across systems.",
    href: "/login",
    cta: "Enter Clinic OS",
    primary: false,
  },
  {
    icon: BriefcaseBusiness,
    eyebrow: "Work, space, services & capacity",
    title: "Klinikos Grid",
    body: "Find or offer healthcare work, rooms, chairs, services, equipment, products, organizations, referral capacity, and other reviewed healthcare resources.",
    href: "/grid",
    cta: "Explore Grid",
    primary: false,
  },
  {
    icon: GraduationCap,
    eyebrow: "Learn & build readiness",
    title: "Klinikos EDU",
    body: "Open courses, scenarios, evidence-based practice work, and the education pathway that can connect learning to future Grid opportunity and healthcare capacity.",
    href: "/edu",
    cta: "Explore EDU",
    primary: false,
  },
] as const;

export default function StartPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="start-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:py-32">
          <div>
            <MissionPhaseProgress current="brief" />
            <p className="mt-10 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6c55b]">Start with what you want to accomplish</p>
            <h1
              className="mt-5 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl"
              id="start-heading"
            >
              One Klinikos. Different ways in.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
              Operate a clinic, find or offer healthcare capacity, learn through EDU, or map an operational problem before you buy. Klinikos keeps the complexity underneath and gives each person the doorway that matches what they are here to do.
            </p>
          </div>

          <ZumiBriefingPanel active>
            Choose the closest starting point. You can move between Klinikos experiences later when your role and permissions allow it. Clinic intake should never include patient names, diagnoses, records, or PHI.
          </ZumiBriefingPanel>
        </div>
      </section>

      <section aria-labelledby="paths-heading" className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 lg:py-32">
        <div className="max-w-3xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-cyan-300">Choose your entry</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-.05em] text-white sm:text-5xl" id="paths-heading">Start where the value is obvious to you.</h2>
          <p className="mt-5 text-sm leading-7 text-slate-400">You do not need to understand the product architecture. Pick the outcome that matches why you came.</p>
        </div>

        <ul className="mt-14 grid gap-x-10 gap-y-14 lg:grid-cols-2">
          {entryPaths.map((path) => (
            <li className="flex border-t border-white/12 pt-7" key={path.href}>
              <article className="flex w-full flex-col">
                <div className="flex items-start gap-5">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${path.primary ? "bg-cyan-300 text-slate-950" : "border border-white/12 bg-white/[.035] text-slate-300"}`}>
                    <path.icon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{path.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-extrabold tracking-[-.04em] text-white">{path.title}</h3>
                    <p className="mt-4 max-w-xl text-[13px] leading-7 text-slate-400">{path.body}</p>
                    <div className="mt-7">
                      <Button
                        asChild
                        className={path.primary ? "" : "border border-white/20 bg-transparent text-slate-200 hover:text-white"}
                        variant={path.primary ? "primary" : "secondary"}
                      >
                        <Link href={path.href}>{path.cta} <ArrowRight aria-hidden="true" className="size-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-20 grid gap-5 lg:grid-cols-2">
          <NoPHINotice />
          <HumanReviewBanner />
        </div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-8 text-xs text-slate-500">
          <Link className="font-bold text-slate-300 hover:text-white" href="/access">Request evaluation access</Link>
          <Link className="font-bold text-slate-300 hover:text-white" href="/pricing">See clinic pricing</Link>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-3.5" /> Access, payment, credentials, and regulated actions remain separate gates.</span>
        </div>
      </section>
    </ZumiCommandShell>
  );
}
