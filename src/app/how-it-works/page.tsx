import Link from "next/link";
import { ArrowRight, BrainCircuit, Cable, CheckCircle2, CircleDollarSign, Grid3X3, Layers3, ShieldCheck } from "lucide-react";
import { commandSurfaces } from "@/lib/design/command-system";

export const metadata = {
  title: "How Klinikos Works | Klinikos",
  description:
    "See how Klinikos brings clinic operations into one operating layer, connects external healthcare networks, and uses Zumi to organize work without replacing human authority.",
};

const stages = [
  {
    step: "01",
    title: "Work becomes visible",
    body: "Appointments, forms, tasks, referrals, results, leads, billing readiness, Grid activity, and other operating work stop disappearing into separate queues.",
  },
  {
    step: "02",
    title: "Klinikos keeps the operating state",
    body: "The database, permissions, workflows, events, and audit trail remain the source of truth. The system records what is open, who owns it, and what changed.",
  },
  {
    step: "03",
    title: "Zumi helps make sense of it",
    body: "Zumi can summarize, search, organize, explain, and prepare permitted next actions. It does not become the source of truth and cannot buy or reason its way around policy.",
  },
  {
    step: "04",
    title: "Rules decide what may happen",
    body: "Tenant isolation, role permissions, clinical boundaries, Grid eligibility, payment state, customer-funded usage, and connector readiness are checked on the server before consequential work proceeds.",
  },
  {
    step: "05",
    title: "Actions are verified",
    body: "Safe work can move through controlled workflows. Higher-risk actions stop for human review. Consequential writes are recorded and checked rather than reported as successful because a model said so.",
  },
] as const;

const replaces = [
  "Disconnected operational task lists",
  "Separate lead and follow-up trackers",
  "Standalone paperwork chasing",
  "Fragmented referral and results tracking",
  "Disconnected billing-readiness work",
  "Separate clinic capacity and resource coordination",
] as const;

const connects = [
  "Payment networks",
  "Laboratories and imaging",
  "Payer and clearinghouse rails",
  "Messaging and voice providers",
  "Maps and identity services",
  "External EHR, PMS, pharmacy, and credential networks where approved",
] as const;

const principles = [
  { icon: BrainCircuit, title: "Zumi is inside Klinikos", body: "The intelligence layer can change models or providers without changing the product identity or the authority model." },
  { icon: ShieldCheck, title: "Policy is not optional", body: "Payment, AI output, or administrator convenience cannot override clinical, privacy, credential, tenant, or Grid eligibility rules." },
  { icon: CircleDollarSign, title: "Customer-funded variable cost", body: "Paid production capability and metered vendor usage are admitted only when the customer has the right entitlement and enough funded allowance, prepaid balance, or authorized bounded overage." },
  { icon: Cable, title: "Connectors fail truthfully", body: "A disconnected external service is shown as disconnected. Klinikos keeps a manual or blocked fallback where appropriate instead of manufacturing success." },
] as const;

export default function HowKlinikosWorksPage() {
  return (
    <main className={commandSurfaces.shell}>
      <div className={commandSurfaces.aegeanField} />
      <header className="border-b border-white/10">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-5 px-5 sm:px-8">
          <Link className="text-sm font-black tracking-[-.03em] text-white" href="/">KLINIKOS</Link>
          <nav className="flex items-center gap-5 text-xs font-bold text-slate-400" aria-label="Product navigation">
            <Link className="hover:text-white" href="/grid">Grid</Link>
            <Link className="hover:text-white" href="/edu">Education</Link>
            <Link className="hover:text-white" href="/login">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 lg:py-28">
          <p className={commandSurfaces.eyebrow}>How Klinikos works</p>
          <h1 className={`${commandSurfaces.headline} mt-5 max-w-5xl text-balance text-5xl leading-[.94] sm:text-7xl`}>
            One operating layer. Clear authority. Fewer gaps.
          </h1>
          <p className="mt-8 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Klinikos brings the work around healthcare operations into one system, connects the external networks that still matter,
            and gives Zumi a governed way to understand and help with that work. Klinikos remains the source of operational truth.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link className={`${commandSurfaces.interactive} inline-flex items-center gap-2 bg-[#e6c55b] px-5 text-sm font-extrabold text-[#071019]`} href="/private-demo">
              See a synthetic workflow <ArrowRight className="size-4" />
            </Link>
            <Link className={`${commandSurfaces.interactive} inline-flex items-center gap-2 border border-white/15 px-5 text-sm font-extrabold text-slate-200`} href="/grid">
              Explore Grid <Grid3X3 className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8">
        <p className={commandSurfaces.eyebrowAi}>The operating loop</p>
        <h2 className="mt-4 text-3xl font-black tracking-[-.045em] text-white sm:text-5xl">Five steps, in order.</h2>
        <ol className="mt-10 grid gap-px border border-white/10 bg-white/10">
          {stages.map((stage) => (
            <li className="grid gap-5 bg-[#05090f] p-6 sm:grid-cols-[5rem_1fr] sm:p-8" key={stage.step}>
              <span className="text-2xl font-black tabular-nums text-[#e6c55b]">{stage.step}</span>
              <div>
                <h3 className="text-lg font-extrabold text-white">{stage.title}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">{stage.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-white/10 bg-[#070d15]">
        <div className="mx-auto grid max-w-[1500px] gap-px px-5 py-20 sm:px-8 lg:grid-cols-2">
          <div className="border border-white/10 p-7 sm:p-9">
            <p className={commandSurfaces.eyebrow}>Klinikos consolidates</p>
            <h2 className="mt-4 text-2xl font-black text-white">Operational software that should not need six separate homes.</h2>
            <ul className="mt-7 grid gap-3">
              {replaces.map((item) => <li className="flex gap-3 text-sm leading-6 text-slate-300" key={item}><CheckCircle2 className="mt-1 size-4 shrink-0 text-[#e6c55b]" />{item}</li>)}
            </ul>
          </div>
          <div className="border border-white/10 p-7 sm:p-9">
            <p className={commandSurfaces.eyebrowAi}>Klinikos connects</p>
            <h2 className="mt-4 text-2xl font-black text-white">External rails that remain separate businesses or regulated networks.</h2>
            <ul className="mt-7 grid gap-3">
              {connects.map((item) => <li className="flex gap-3 text-sm leading-6 text-slate-300" key={item}><Layers3 className="mt-1 size-4 shrink-0 text-cyan-300" />{item}</li>)}
            </ul>
            <p className="mt-7 text-xs leading-6 text-slate-500">A connector is not considered live merely because a settings screen exists. Readiness depends on credentials, contracts, configuration, policy, tests, and an actual successful connection.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8">
        <p className={commandSurfaces.eyebrow}>Design rules</p>
        <h2 className="mt-4 text-3xl font-black tracking-[-.045em] text-white sm:text-5xl">The backend stays stricter than the interface.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {principles.map(({ icon: Icon, title, body }) => (
            <article className="border border-white/10 bg-white/[.035] p-7" key={title}>
              <Icon className="size-5 text-cyan-300" />
              <h3 className="mt-5 text-lg font-extrabold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div><p className={commandSurfaces.eyebrow}>Next</p><h2 className="mt-3 text-2xl font-black text-white">Start with the part of the system you actually need.</h2></div>
          <div className="flex flex-wrap gap-3"><Link className={`${commandSurfaces.interactive} inline-flex items-center px-5 text-sm font-extrabold text-white border border-white/15`} href="/start">Choose your path</Link><Link className={`${commandSurfaces.interactive} inline-flex items-center px-5 text-sm font-extrabold text-cyan-200 border border-cyan-300/25`} href="/founding-clinic">Founding clinic pathway</Link></div>
        </div>
      </section>
    </main>
  );
}
