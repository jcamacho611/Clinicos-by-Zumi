import Link from "next/link";
import { ArrowRight, BrainCircuit, Building2, Network, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";

export const metadata = {
  title: "How Klinikos Works",
  description: "How Klinikos brings clinic operations, Zumi intelligence, and Grid resource coordination into one governed operating system.",
};

const layers = [
  {
    icon: Building2,
    title: "Klinikos runs the operation",
    body: "Appointments, intake, tasks, documents, follow-up, referrals, revenue work, staff ownership, and operating visibility stay connected to the clinic's real workspace.",
  },
  {
    icon: BrainCircuit,
    title: "Zumi helps the team see what matters",
    body: "Zumi is the intelligence inside Klinikos. It can organize authorized operational context, explain signals, and prepare governed next steps. It does not replace licensed clinical judgment or bypass human review.",
  },
  {
    icon: Network,
    title: "Grid connects healthcare resources",
    body: "Grid helps organizations and participants express what they need or have, find candidates, enforce contextual eligibility, make offers, reserve resources, fulfill work, and preserve trust history.",
  },
] as const;

const flow = [
  "A clinic chooses an approved commercial path.",
  "Payment or pilot authorization is verified by Klinikos before paid access changes.",
  "Your clinic workspace is created, and you are set up as its owner.",
  "The owner completes guided setup and lands in the Living Home operating view.",
  "Klinikos surfaces real work that needs attention and safely advances what it is allowed to handle.",
  "External services stay marked Pending Connection or Manual Fallback until their real readiness gates are satisfied.",
] as const;

export default function HowKlinikosWorksPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#0b1220]">
      <header className="border-b border-[#e2e6ea] bg-white">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/"><BrandMark /><span className="text-sm font-black">Klinikos</span></Link>
          <div className="ml-auto flex items-center gap-5 text-xs font-bold text-[#5b6675]">
            <Link href="/pricing">Pricing</Link>
            <Link className="text-[#174ea6]" href="/start">Start an operating analysis</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-[#dfe3e8] bg-[#07131f] text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-cyan-300">How it works</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[.96] tracking-[-.06em] sm:text-7xl">One operating layer for the work that falls between systems.</h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300">Klinikos is the platform. Zumi is the intelligence inside it. Grid is the healthcare resource network. The product connects operational truth first, then lets automation and outside services participate only through governed boundaries.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center gap-2 bg-cyan-300 px-5 text-xs font-extrabold text-[#07131f]" href="/start">See your operating path <ArrowRight className="size-4" /></Link>
            <Link className="inline-flex min-h-11 items-center border border-white/20 px-5 text-xs font-extrabold text-white" href="/grid">Explore Grid</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {layers.map(({ icon: Icon, title, body }) => (
            <article className="border border-[#dfe3e8] bg-white p-6" key={title}>
              <Icon className="size-5 text-[#174ea6]" />
              <h2 className="mt-5 text-xl font-black tracking-[-.035em]">{title}</h2>
              <p className="mt-3 text-[12px] leading-6 text-[#5b6675]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#dfe3e8] bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-14 sm:px-8">
          <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">From interest to daily use</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">A controlled path, not a collection of disconnected signups.</h2>
          <ol className="mt-8 grid gap-3">
            {flow.map((item, index) => (
              <li className="flex gap-4 border border-[#e6e9ed] bg-[#fafbfc] p-4" key={item}>
                <span className="grid size-8 shrink-0 place-items-center bg-[#0b1220] text-[12px] font-black text-white">{String(index + 1).padStart(2, "0")}</span>
                <p className="pt-1 text-[12px] leading-6 text-[#4f5a68]">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-14 sm:px-8">
        <div className="flex gap-4 border border-[#d8dee5] bg-white p-6">
          <ShieldCheck className="size-5 shrink-0 text-[#9a7a1f]" />
          <div>
            <h2 className="text-sm font-black">Paying turns on software, not permission.</h2>
            <p className="mt-2 text-[12px] leading-6 text-[#5b6675]">Paying turns on what you bought. It never changes who can sign in, what your team can see, what stays private, who may make a clinical decision, or what still needs a person to approve. Production patient-data use requires its own deployment and compliance readiness.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
