import Link from "next/link";
import { commandSurfaces } from "@/lib/design/command-system";
import { MarketingShell, MarketingSection } from "@/components/growth/marketing-shell";
import { ZumiDemonstration } from "@/components/growth/zumi-demonstration";
import { IntentBeacon } from "@/components/growth/intent-beacon";

/**
 * The Zumi page.
 *
 * Sells Zumi without giving Zumi away. There is no chat box on this page and nothing
 * here reaches the AI gateway — the demonstration is scripted. Zumi is a paid
 * capability that activates after purchase, and a page that hands out operational
 * access as a lead magnet would be giving away the product.
 */

export const metadata = {
  title: "Zumi — the intelligence layer inside Klinikos",
  description:
    "Zumi reads your clinic's own operating record and tells you what is waiting on someone, why it was flagged, and what to do next. A person confirms every action.",
};

const CAPABILITIES = [
  { title: "It reads your operating record, not the internet", body: "Every statement Zumi makes cites the appointment, task, result, or claim it came from. If the record does not support it, Zumi says the information is not available." },
  { title: "It raises work, it does not perform it", body: "Zumi prepares suggestions marked Suggested by Zumi. A person with the right permission confirms them. Higher-risk actions can only ever be proposed." },
  { title: "It cannot practise medicine", body: "Zumi does not diagnose, prescribe, decide treatment, interpret a result as final, or guarantee coverage. These are refused in code before anything else is checked." },
  { title: "It never widens what a role can see", body: "If a user cannot open a record, Zumi will not read it to them. Access is checked against the same permissions the rest of Klinikos uses." },
] as const;

export default function ZumiPage() {
  return (
    <MarketingShell>
      <IntentBeacon event="zumi_page_viewed" path="/zumi" />

      <section aria-labelledby="zumi-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-start lg:py-24">
          <div>
            <p className={commandSurfaces.eyebrowAi}>Zumi</p>
            <h1 className={`${commandSurfaces.headline} mt-4 text-balance text-5xl leading-[.96] sm:text-6xl`} id="zumi-heading">
              Ask your clinic what needs attention. Get an answer with the receipts.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-slate-300">
              Zumi is the intelligence layer inside Klinikos. It reads the operating record your clinic
              is already producing and turns it into a short, sourced list of what is waiting on someone.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/pricing">
                Get Klinikos and Zumi
              </Link>
              <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-white/15 bg-white/[.04] px-5 text-sm font-extrabold text-slate-200`} href="/demo">
                See how it works
              </Link>
            </div>
          </div>

          <ZumiDemonstration />
        </div>
      </section>

      <MarketingSection
        eyebrow="What Zumi is"
        id="zumi-capabilities"
        lead="An operations layer with hard limits, stated here because they are enforced in code rather than promised in marketing."
        title="Four things that are always true."
      >
        <ul className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2">
          {CAPABILITIES.map((capability) => (
            <li className="bg-[#05090f] p-6" key={capability.title}>
              <h3 className="text-base font-extrabold tracking-[-.02em] text-white">{capability.title}</h3>
              <p className="mt-3 text-[13px] leading-7 text-slate-400">{capability.body}</p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection
        eyebrow="Access"
        id="zumi-access"
        lead="Zumi activates with your Klinikos plan once payment is verified and your clinic is provisioned. There is no open public access to the operational assistant, which is why this page demonstrates it rather than handing it to you."
        title="Zumi comes with Klinikos."
      >
        <Link className={`${commandSurfaces.interactive} mt-8 inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/pricing">
          See pricing
        </Link>
      </MarketingSection>
    </MarketingShell>
  );
}
