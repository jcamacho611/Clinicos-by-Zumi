import { commandSurfaces, NO_PHI_NOTICE } from "@/lib/design/command-system";
import { MarketingShell } from "@/components/growth/marketing-shell";
import { IntentBeacon } from "@/components/growth/intent-beacon";
import { LeadCaptureForm } from "@/components/growth/lead-capture-form";

export const metadata = {
  title: "Contact Klinikos",
  description: "Tell us how your clinic runs. A person reads every request.",
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <IntentBeacon event="contact_submitted" path="/contact" />

      <section aria-labelledby="contact-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-24">
          <div>
            <p className={commandSurfaces.eyebrow}>Contact</p>
            <h1 className={`${commandSurfaces.headline} mt-4 text-balance text-5xl leading-[.96] sm:text-6xl`} id="contact-heading">
              Tell us how your clinic runs.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-slate-300">
              A person reads every request. If Klinikos is a poor fit for how your clinic works, we would
              rather tell you that than sell you a subscription you cancel in three months.
            </p>
            <p className={`${commandSurfaces.panelBoundary} mt-8 max-w-xl p-4 text-[12px] leading-6 text-slate-200`}>
              {NO_PHI_NOTICE}
            </p>
          </div>

          <div>
            <LeadCaptureForm interest="other" submitLabel="Send" />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
