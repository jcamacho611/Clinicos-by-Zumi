import Link from "next/link";
import { commandSurfaces } from "@/lib/design/command-system";
import { MarketingShell, MarketingSection } from "@/components/growth/marketing-shell";
import { IntentBeacon } from "@/components/growth/intent-beacon";

export const metadata = {
  title: "How Klinikos works",
  description:
    "Klinikos replaces the scattered software around your clinic and connects the healthcare networks you cannot replace, then puts one operating picture on top.",
};

const STAGES = [
  { step: "01", title: "Everything lands in one place", body: "Leads, appointments, intake, tasks, results, referrals and billing readiness stop living in separate tools. Klinikos becomes the place the work is." },
  { step: "02", title: "Klinikos watches the gaps", body: "Your own rules — a 24-hour follow-up window, a paperwork deadline — become signals when something crosses them. Nothing depends on a person remembering." },
  { step: "03", title: "Zumi explains what it found", body: "Not a score and not an alert. A short list of what is waiting, how long it has waited, and the records that prove it." },
  { step: "04", title: "A person decides", body: "Zumi prepares the task, the follow-up, the claim action. Someone with the right permission confirms it. That order never reverses." },
  { step: "05", title: "The owner sees the chain", body: "What slipped, what was caught, what it was worth. Traceable rather than anecdotal." },
] as const;

const REPLACES = [
  "Scheduling", "Patient intake and forms", "Task and staff workflow", "Follow-up tracking",
  "CRM and lead management", "Referral tracking", "Results tracking", "Billing-readiness workflow",
  "Document management", "Reporting", "Patient and provider portals", "Med spa CRM",
] as const;

const CONNECTS = [
  "Laboratories", "Imaging and radiology", "Payer and clearinghouse rails",
  "Pharmacy and e-prescribing networks", "Card and payment networks", "Government and credential sources",
] as const;

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <IntentBeacon event="how_it_works_viewed" path="/how-it-works" />

      <section aria-labelledby="hiw-heading" className="border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
          <p className={commandSurfaces.eyebrow}>How it works</p>
          <h1 className={`${commandSurfaces.headline} mt-4 max-w-4xl text-balance text-5xl leading-[.96] sm:text-6xl`} id="hiw-heading">
            Replace the software you should not be paying for. Connect the networks you cannot replace.
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
            Most clinics run on six or seven systems that do not speak to each other, and the work falls
            through the gaps between them. Klinikos closes the gaps by being the place the work lives.
          </p>
        </div>
      </section>

      <MarketingSection eyebrow="The loop" id="hiw-stages" title="Five stages, in order.">
        <ol className="mt-10 grid gap-px bg-white/10">
          {STAGES.map((stage) => (
            <li className="grid gap-4 bg-[#05090f] p-6 sm:grid-cols-[5rem_1fr] sm:gap-8 sm:p-8" key={stage.step}>
              <span className="text-2xl font-extrabold tabular-nums tracking-[-.05em] text-[#e6c55b]">{stage.step}</span>
              <div>
                <h3 className="text-lg font-extrabold tracking-[-.03em] text-white">{stage.title}</h3>
                <p className="mt-2.5 max-w-2xl text-[13px] leading-7 text-slate-400">{stage.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection
        eyebrow="Scope"
        id="hiw-scope"
        lead="The line is drawn on purpose. Klinikos is not trying to become a laboratory, a clearinghouse, or a card network — it is trying to make you stop paying for six operational tools and stop leaving the system to use the ones that remain."
        title="What Klinikos replaces, and what it connects."
      >
        <div className="mt-10 grid gap-px bg-white/10 lg:grid-cols-2">
          <div className="bg-[#05090f] p-6 sm:p-8">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#e6c55b]">Klinikos replaces</h3>
            <ul className="mt-5 grid gap-2">
              {REPLACES.map((item) => (
                <li className="border-t border-white/10 pt-2 text-[13px] leading-6 text-slate-200 first:border-t-0 first:pt-0" key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-[#05090f] p-6 sm:p-8">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[.16em] text-cyan-300">Klinikos connects</h3>
            <ul className="mt-5 grid gap-2">
              {CONNECTS.map((item) => (
                <li className="border-t border-white/10 pt-2 text-[13px] leading-6 text-slate-200 first:border-t-0 first:pt-0" key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-6 text-[11px] leading-5 text-slate-500">
              These connections require the clinic&rsquo;s own agreements, credentials, and enrolments. Klinikos
              builds the workflow and reports honestly on what is connected and what is not.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/demo">
            Walk through it
          </Link>
          <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-white/15 bg-white/[.04] px-5 text-sm font-extrabold text-slate-200`} href="/pricing">
            See pricing
          </Link>
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
