import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HumanReviewBanner } from "@/components/command/zumi-command-shell";
import { engagementOffers } from "@/lib/sales/zumi-command";

/**
 * Engagement options, under command law.
 *
 * Prices come from the server-controlled `demoOffers` via `engagementOffers`; this
 * component never states an amount of its own. Each card says what the fee buys and
 * what happens next, and the human-review boundary sits under the set rather than
 * being repeated per card where it would read as fine print.
 */
export function FoundingOfferCards({ headingId = "engagement-heading", ctaHref = "/private-demo" }: { headingId?: string; ctaHref?: string }) {
  return (
    <section aria-labelledby={headingId}>
      <h2 className="text-[11px] font-extrabold uppercase tracking-[.18em] text-cyan-300" id={headingId}>
        Choose how to proceed
      </h2>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {engagementOffers.map((offer) => (
          <article className="flex flex-col border border-white/10 bg-white/[.04] p-6 sm:p-7" key={offer.key}>
            <h3 className="text-lg font-extrabold tracking-[-.03em] text-white">{offer.name}</h3>
            <p className="mt-2 text-3xl font-extrabold tracking-[-.05em] text-[#e6c55b]">{offer.shortPrice}</p>

            <dl className="mt-5 grid gap-3 border-t border-white/10 pt-5">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Best for</dt>
                <dd className="mt-1 text-[12px] leading-6 text-slate-300">{offer.bestFor}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">What happens</dt>
                <dd className="mt-1 text-[12px] leading-6 text-slate-300">{offer.whatHappens}</dd>
              </div>
            </dl>

            <p className="mt-4 text-[11px] leading-5 text-slate-500">{offer.creditForward}</p>

            <div className="mt-auto pt-6">
              <Button asChild className="w-full" variant="primary">
                <Link href={ctaHref}>{offer.cta} <ArrowRight aria-hidden="true" className="size-4" /></Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6"><HumanReviewBanner /></div>
    </section>
  );
}
