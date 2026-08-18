"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, GraduationCap, HeartHandshake, Network, Stethoscope, Users } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { cn } from "@/lib/utils";

type EntryKey = "student" | "licensed" | "clinic" | "space" | "staff" | "teach" | "care";

type Entry = {
  key: EntryKey;
  label: string;
  statement: string;
  description: string;
  stages: string[];
  action: { label: string; href: string };
  icon: typeof Users;
};

const stages = [
  { key: "edu", label: "EDU", detail: "Learning and simulation" },
  { key: "competency", label: "Competency", detail: "Evidence of demonstrated readiness" },
  { key: "credentials", label: "Credentials", detail: "Requirements that affect eligibility" },
  { key: "grid", label: "Grid", detail: "Opportunity and capacity" },
  { key: "work", label: "Work", detail: "Real governed activity" },
  { key: "experience", label: "Experience", detail: "History and evidence" },
  { key: "reputation", label: "Reputation", detail: "Trust without bypassing eligibility" },
  { key: "independence", label: "Independence", detail: "Professional mobility" },
  { key: "clinic", label: "Clinic OS", detail: "Operate the practice" },
  { key: "capacity", label: "Capacity", detail: "What the organization can offer" },
  { key: "network", label: "Network", detail: "Relationships and connected care" },
  { key: "opportunity", label: "More opportunity", detail: "Demand compounds the ecosystem" },
] as const;

const entries: Entry[] = [
  { key: "student", label: "I’m a student", statement: "Learn → prove readiness → find the next governed opportunity.", description: "Klinikos connects education to competency and placement capacity without pretending a course automatically grants professional authority or guarantees placement.", stages: ["edu", "competency", "credentials", "grid", "work"], action: { label: "Explore Klinikos EDU", href: "/edu" }, icon: GraduationCap },
  { key: "licensed", label: "I’m already licensed", statement: "Readiness → availability → eligible opportunity → experience.", description: "Grid can help surface work and capacity after the requirements of the specific opportunity are satisfied.", stages: ["credentials", "grid", "work", "experience", "reputation", "independence"], action: { label: "Explore professional routes", href: "/login?next=%2Fpaths" }, icon: Stethoscope },
  { key: "clinic", label: "I run a clinic", statement: "Operate → find leakage → fill needs → monetize real capacity.", description: "Clinic OS, Billing, Grid, Insights and Network converge around the clinic’s actual operating state instead of forcing the owner to stitch modules together.", stages: ["clinic", "capacity", "network", "opportunity", "grid"], action: { label: "See the clinic path", href: "/founding-clinic" }, icon: Building2 },
  { key: "space", label: "I have space or capacity", statement: "Idle capacity → readiness → publication → eligible demand.", description: "Rooms, hours, services, education capacity and other permitted resources can become Grid supply when the organization is actually allowed to offer them.", stages: ["capacity", "network", "opportunity", "grid"], action: { label: "Put capacity on Grid", href: "/grid/join/location" }, icon: Network },
  { key: "staff", label: "I need staff or coverage", statement: "Real need → eligibility → availability → offer → confirmation.", description: "Grid puts hard eligibility before price and ranking. A person who is missing a required credential or malpractice evidence is not presented as an eligible match.", stages: ["clinic", "grid", "work", "network"], action: { label: "Open Grid", href: "/grid" }, icon: Users },
  { key: "teach", label: "I teach or precept", statement: "Teaching capacity → institutional requirements → eligible learner opportunity.", description: "Klinikos can connect educators and organizations to education demand while keeping school agreements, supervision and program requirements explicit.", stages: ["experience", "reputation", "edu", "capacity", "grid"], action: { label: "Explore education capacity", href: "/grid/browse?intent=education" }, icon: HeartHandshake },
  { key: "care", label: "I’m looking for care", statement: "Describe the need → find an appropriate provider entry → continue in a patient-safe experience.", description: "A new care seeker should start with public discovery rather than an existing-patient portal. Klinikos can surface reviewed provider capacity without diagnosing, overriding clinical triage, guaranteeing availability, or treating a listing as authorization for care.", stages: ["network", "capacity", "grid"], action: { label: "Find providers on Grid", href: "/grid/browse?intent=provider" }, icon: HeartHandshake },
];

export function EcosystemFlywheel() {
  const [activeKey, setActiveKey] = useState<EntryKey>("clinic");
  const active = entries.find((entry) => entry.key === activeKey) ?? entries[0];
  const highlighted = new Set(active.stages);

  return (
    <main className="min-h-screen bg-[#050303] text-[#f8efed]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(150,41,48,.2),transparent_31%),radial-gradient(circle_at_18%_82%,rgba(230,129,123,.05),transparent_28%)]" />
      <header className="relative z-20 border-b border-[#e6817b]/10 bg-[#050303]/88 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-20 max-w-[1540px] items-center gap-5 px-5 sm:px-8">
          <KlinikosWordmark href="/" framed inverse markClassName="h-11 w-11" textClassName="h-[21px] w-[188px]" className="gap-3" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-[.18em] text-[#e6817b] sm:block">Ecosystem</span>
          <Link className="ml-auto text-xs font-semibold text-[#b89f9b] hover:text-[#fff8f6]" href="/grid">Grid</Link>
          <Link className="text-xs font-semibold text-[#b89f9b] hover:text-[#fff8f6]" href="/edu">EDU</Link>
          <Link className="rounded-full border border-[#e6817b]/20 bg-[#e6817b]/10 px-4 py-2.5 text-xs font-semibold text-[#efaaa1] hover:bg-[#e6817b]/16" href="/login?next=%2Fpaths">Open my routes</Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1540px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[.86fr_1.14fr] lg:items-end">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[.24em] text-[#e6817b]">One healthcare lifecycle</p>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-light leading-[.92] tracking-[-.065em] sm:text-7xl lg:text-[84px]">The parts make more sense when you see how people move through them.</h1>
          </div>
          <p className="max-w-2xl text-sm leading-8 text-[#b89f9b] sm:text-base">Klinikos is not a pile of clinic software. Education can create readiness. Readiness can unlock opportunity. Work creates experience. Experience can support independence. Clinics create capacity. Capacity creates more opportunity. Zumi helps each person find their next governed route through that system.</p>
        </div>

        <div className="mt-14 flex flex-wrap gap-2" aria-label="Choose where you enter the Klinikos ecosystem">
          {entries.map(({ key, label, icon: Icon }) => (
            <button
              aria-pressed={activeKey === key}
              className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition", activeKey === key ? "border-[#e6817b]/36 bg-[#e6817b]/14 text-[#fff8f6]" : "border-[#e6817b]/11 bg-[#100708]/65 text-[#9f8985] hover:border-[#e6817b]/24 hover:text-[#f8efed]")}
              key={key}
              onClick={() => setActiveKey(key)}
              type="button"
            ><Icon className="size-4" />{label}</button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 rounded-[30px] border border-[#e6817b]/12 bg-[#0d0608]/88 p-5 sm:p-7 lg:grid-cols-[1.35fr_.65fr] lg:p-9">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stages.map((stage, index) => {
              const activeStage = highlighted.has(stage.key);
              return (
                <div className={cn("relative min-h-[136px] rounded-[18px] border p-5 transition", activeStage ? "border-[#e6817b]/30 bg-[#e6817b]/[.08] shadow-[0_0_36px_rgba(230,129,123,.05)]" : "border-white/[.06] bg-[#080405]/60 opacity-55")} key={stage.key}>
                  <span className={cn("text-[11px] font-extrabold uppercase tracking-[.18em]", activeStage ? "text-[#e6817b]" : "text-[#655653]")}>{String(index + 1).padStart(2, "0")}</span>
                  <h2 className={cn("mt-4 text-base font-semibold", activeStage ? "text-[#fff8f6]" : "text-[#9f8985]")}>{stage.label}</h2>
                  <p className="mt-2 text-[11px] leading-5 text-[#806965]">{stage.detail}</p>
                  {activeStage ? <span aria-hidden="true" className="absolute right-4 top-4 size-2 rounded-full bg-[#e6817b] shadow-[0_0_14px_rgba(230,129,123,.72)]" /> : null}
                </div>
              );
            })}
          </div>

          <aside className="flex flex-col justify-between border-t border-[#e6817b]/12 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#e6817b]">Your route through the flywheel</p>
              <h2 className="mt-4 text-3xl font-light leading-tight tracking-[-.045em] text-[#fff8f6]">{active.statement}</h2>
              <p className="mt-5 text-xs leading-6 text-[#9f8985]">{active.description}</p>
            </div>
            <Link className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#efaaa1]" href={active.action.href}>{active.action.label}<ArrowRight className="size-4" /></Link>
          </aside>
        </div>
      </section>

      <section className="relative z-10 border-y border-[#e6817b]/10 bg-[#090506]">
        <div className="mx-auto grid max-w-[1540px] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:py-16">
          <div><p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-[#e6817b]">Why the ecosystem compounds</p><h2 className="mt-3 text-4xl font-light tracking-[-.055em] sm:text-5xl">Every real outcome can create useful context for the next one.</h2></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[["For people","Progress can carry from learning to readiness to opportunity without pretending those states are interchangeable."],["For clinics","Operations can create real Grid demand and supply, while Financial OS keeps payment and payout truth separate."],["For the network","More verified capacity and completed work can make future matching more useful without weakening eligibility or privacy."]].map(([title, body]) => <div className="border-l border-[#e6817b]/18 pl-5" key={title}><h3 className="text-sm font-semibold text-[#fff8f6]">{title}</h3><p className="mt-3 text-xs leading-6 text-[#9f8985]">{body}</p></div>)}
          </div>
        </div>
      </section>
    </main>
  );
}
