import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, GraduationCap, HeartHandshake, Network, Sparkles, Stethoscope } from "lucide-react";

const continuity = [
  ["01", "Someone owns it", "Work stops disappearing between calls, inboxes, spreadsheets, and systems."],
  ["02", "The next step stays visible", "Follow-up, referrals, results, paperwork, and revenue work keep a clear next action."],
  ["03", "Humans stay in control", "Clinical judgment, regulated decisions, sensitive releases, and irreversible actions remain human-governed."],
] as const;

const ecosystem = [
  {
    icon: Stethoscope,
    name: "Clinic OS",
    body: "Patients, scheduling, intake, tasks, follow-up, referrals, results, revenue readiness, and owner visibility.",
    href: "/start",
    action: "Run a clinic",
  },
  {
    icon: Network,
    name: "Grid",
    body: "Healthcare work, people, space, services, equipment, organizations, education capacity, and other reviewed resources.",
    href: "/grid",
    action: "Explore Grid",
  },
  {
    icon: GraduationCap,
    name: "Klinikos EDU",
    body: "Courses, simulations, scenarios, evidence, feedback, and readiness experiences connected to the wider ecosystem.",
    href: "/edu",
    action: "Open EDU",
  },
  {
    icon: HeartHandshake,
    name: "Connected care",
    body: "Referrals, handoffs, partner capacity, patient navigation, and continuity across organizations without pretending every vendor is already connected.",
    href: "/how-it-works",
    action: "See how it connects",
  },
] as const;

const engagements = [
  { step: "01", name: "Clinic Operating Analysis", price: "$500", detail: "Map where work gets lost and leave with a concrete operating picture.", href: "/private-demo", action: "Start the analysis" },
  { step: "02", name: "Implementation Blueprint", price: "$1,500", detail: "Go deeper on systems, staffing, workflow loss, sequencing, and implementation fit.", href: "/founding-clinic", action: "Review the blueprint path" },
  { step: "03", name: "Founding Clinic Implementation", price: "from $8,000", detail: "Configure Klinikos around a real clinic with explicit production and external-connection gates.", href: "/founding-clinic", action: "Explore implementation" },
] as const;

export function KlinikosHomepage() {
  return (
    <div className="k-page">
      <section id="fragmentation" className="mx-auto max-w-[1500px] px-5 py-28 sm:px-8 lg:px-12 lg:py-44">
        <div className="grid gap-16 lg:grid-cols-[.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="k-kicker">The actual problem</p>
            <p className="k-muted mt-5 max-w-sm text-sm leading-7">Healthcare organizations already have software. The expensive failures usually happen between the software, the people, and the next step.</p>
          </div>
          <div>
            <h2 className="max-w-5xl text-balance text-5xl font-semibold leading-[.96] tracking-[-.065em] sm:text-6xl lg:text-7xl">Your clinic is not missing another dashboard.</h2>
            <p className="mt-8 max-w-3xl text-2xl font-medium leading-9 tracking-[-.03em] text-[var(--k-accent)] sm:text-3xl">It is missing continuity.</p>
          </div>
        </div>

        <div className="mt-24 grid border-y k-rule md:grid-cols-3">
          {continuity.map(([number, title, body], index) => (
            <article className={`py-8 md:py-10 ${index > 0 ? "md:border-l md:pl-9 lg:pl-12" : ""} ${index < 2 ? "border-b md:border-b-0" : ""} k-rule`} key={number}>
              <p className="k-muted text-xs font-semibold">{number}</p>
              <h3 className="mt-8 text-xl font-semibold tracking-[-.03em]">{title}</h3>
              <p className="k-muted mt-4 max-w-sm text-sm leading-7">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="k-raised border-y k-rule">
        <div className="mx-auto max-w-[1500px] px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:gap-24">
            <div>
              <p className="k-kicker">One operating layer</p>
              <h2 className="mt-7 max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl">See the thread. See who owns it. See what happens next.</h2>
            </div>
            <p className="k-muted max-w-xl text-base leading-8">Klinikos sits across the work that normally falls between systems. It does not need to replace everything in order to make the operating picture clearer.</p>
          </div>

          <div className="mt-20 overflow-x-auto border-y k-rule">
            <div className="grid min-w-[760px] grid-cols-5 py-7">
              {["Signal", "Owner", "Next action", "Human review", "Outcome"].map((item, index) => (
                <div className={`${index ? "border-l pl-6" : ""} k-rule`} key={item}>
                  <p className="k-muted text-[12px] font-semibold uppercase tracking-[.14em]">0{index + 1}</p>
                  <p className="mt-3 text-sm font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="surfaces" className="mx-auto max-w-[1500px] px-5 py-28 sm:px-8 lg:px-12 lg:py-44">
        <div className="max-w-4xl">
          <p className="k-kicker">The ecosystem</p>
          <h2 className="mt-7 text-balance text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl">Different jobs. One Klinikos.</h2>
          <p className="k-muted mt-7 max-w-2xl text-base leading-8">The product can be broad underneath without forcing every user to see everything at once. Each role enters through the surface that matters to them.</p>
        </div>

        <div className="mt-20 divide-y divide-[var(--k-line)] border-y border-[var(--k-line)]">
          {ecosystem.map(({ icon: Icon, name, body, href, action }, index) => (
            <Link className="group grid gap-7 py-9 sm:grid-cols-[70px_.55fr_1fr_auto] sm:items-center sm:gap-8 lg:py-11" href={href} key={name}>
              <span className="k-muted text-sm font-semibold">0{index + 1}</span>
              <span className="flex items-center gap-4"><span className="grid size-10 place-items-center rounded-full bg-[var(--k-public-raised)] text-[var(--k-accent)]"><Icon className="size-[18px]" /></span><span className="text-xl font-semibold tracking-[-.03em]">{name}</span></span>
              <span className="k-muted max-w-2xl text-sm leading-7">{body}</span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--k-accent)]">{action}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section id="intelligence" className="k-hero border-y k-rule">
        <div className="mx-auto grid max-w-[1500px] gap-16 px-5 py-28 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:gap-24 lg:px-12 lg:py-44">
          <div>
            <span className="grid size-12 place-items-center rounded-full bg-[var(--k-public-surface)] text-[var(--k-accent)] shadow-[var(--k-shadow)]"><Sparkles className="size-5" /></span>
            <p className="k-kicker mt-8">Klinikos Intelligence</p>
            <h2 className="mt-7 text-balance text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl">Intelligence where the work is. Not another chatbot to babysit.</h2>
          </div>
          <div>
            <p className="k-muted max-w-2xl text-base leading-8">Zumi helps users understand, summarize, research, prepare, and navigate. Deterministic Klinikos systems still own authorization, payment state, eligibility, credentials, transaction state, and safety boundaries.</p>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div className="border-t pt-5 k-rule"><p className="text-sm font-semibold">Make complexity understandable</p><p className="k-muted mt-3 text-xs leading-6">Surface what matters without making your team learn how the system works underneath.</p></div>
              <div className="border-t pt-5 k-rule"><p className="text-sm font-semibold">Keep decisions grounded</p><p className="k-muted mt-3 text-xs leading-6">Sensitive or consequential actions remain permission-aware, evidence-aware, and human-reviewed where required.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="levels" className="mx-auto max-w-[1500px] px-5 py-28 sm:px-8 lg:px-12 lg:py-44">
        <div className="grid gap-16 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
          <div>
            <p className="k-kicker">Start commercially</p>
            <h2 className="mt-7 text-balance text-4xl font-semibold leading-[1.04] tracking-[-.055em] sm:text-5xl">Buy the amount of certainty you need.</h2>
            <p className="k-muted mt-6 max-w-md text-sm leading-7">Each step has a different job. Payment never silently creates clinical authority or turns an unconnected vendor into a live integration.</p>
          </div>

          <div className="divide-y divide-[var(--k-line)] border-y border-[var(--k-line)]">
            {engagements.map(({ step, name, price, detail, href, action }) => (
              <Link className="group grid gap-5 py-8 sm:grid-cols-[56px_1fr_auto] sm:items-start sm:gap-7" href={href} key={step}>
                <p className="k-muted text-sm font-semibold">{step}</p>
                <div><div className="flex flex-wrap items-baseline gap-x-4 gap-y-2"><h3 className="text-xl font-semibold tracking-[-.03em]">{name}</h3><span className="text-lg font-semibold text-[var(--k-premium)]">{price}</span></div><p className="k-muted mt-3 max-w-xl text-sm leading-7">{detail}</p><p className="mt-4 text-xs font-semibold text-[var(--k-accent)]">{action}</p></div>
                <ArrowRight className="mt-1 size-4 text-[var(--k-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--k-accent)]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="k-raised border-y k-rule">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-9 px-5 py-24 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-32">
          <div>
            <p className="k-kicker">Klinikos</p>
            <h2 className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">Operate the complexity underneath. Keep the experience above it clear.</h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link className="k-primary-action min-h-12 rounded-full px-6 text-sm font-semibold" href="/start">Start <ArrowRight className="size-4" /></Link>
            <Link className="k-secondary-action min-h-12 rounded-full px-6 text-sm font-semibold" href="/grid"><BriefcaseBusiness className="size-4" /> Explore Grid</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
