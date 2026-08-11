import Link from "next/link";
import { commandSurfaces, HUMAN_REVIEW_NOTICE } from "@/lib/design/command-system";
import { MarketingShell, MarketingSection } from "@/components/growth/marketing-shell";
import { GuidedTour } from "@/components/growth/guided-tour";
import { IntentBeacon } from "@/components/growth/intent-beacon";

/**
 * The guided product tour.
 *
 * Not a trial and not a sandbox. A visitor walks one lead from arrival to recovered
 * revenue and sees which Klinikos surface owns each step. There is no command input,
 * because operational Klinikos is what the subscription buys.
 */

export const metadata = {
  title: "See Klinikos work — Klinikos by Zumi",
  description:
    "Walk one lead from arrival to recovered revenue: where it slips, how Klinikos notices, what Zumi explains, and who confirms the action.",
};

export default function DemoPage() {
  return (
    <MarketingShell>
      <IntentBeacon event="demo_started" path="/demo" />

      <section aria-labelledby="demo-heading" className="border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
          <p className={commandSurfaces.eyebrow}>Guided walkthrough</p>
          <h1 className={`${commandSurfaces.headline} mt-4 max-w-4xl text-balance text-5xl leading-[.96] sm:text-6xl`} id="demo-heading">
            One lead. Seven steps. The revenue most clinics never notice leaving.
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
            This is the ordinary way a consultation enquiry is lost — and the point at which Klinikos
            interrupts it. Advance through it at your own pace.
          </p>

          <GuidedTour />
        </div>
      </section>

      <MarketingSection
        eyebrow="What this is"
        id="demo-boundary"
        lead="Klinikos does not offer an open trial of the operating system. This walkthrough uses fixed demonstration content so you can see exactly how the product behaves before you buy anything."
        title="A demonstration, not an account."
      >
        <p className={`${commandSurfaces.panelReview} mt-8 max-w-3xl p-5 text-[13px] leading-7 text-slate-200`}>{HUMAN_REVIEW_NOTICE}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/pricing">
            See pricing
          </Link>
          <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-white/15 bg-white/[.04] px-5 text-sm font-extrabold text-slate-200`} href="/operational-audit">
            Start with an Operational Audit
          </Link>
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
