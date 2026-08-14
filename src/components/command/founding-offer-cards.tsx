import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Card } from "@/components/ds";
import { HumanReviewBanner } from "@/components/command/zumi-command-shell";
import { engagementOffers } from "@/lib/sales/zumi-command";

/**
 * Engagement options under Klinikos commercial law.
 *
 * Prices come from the server-controlled sales catalog via `engagementOffers`;
 * this component never states an amount of its own.
 */
export function FoundingOfferCards({ headingId = "engagement-heading", ctaHref = "/private-demo" }: { headingId?: string; ctaHref?: string }) {
  return (
    <section aria-labelledby={headingId}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="mapping">Engagement options</Badge>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight" id={headingId}>Choose how to proceed.</h2>
        </div>
        <p className="max-w-xl text-xs leading-6" style={{ color: "var(--text-secondary)" }}>
          Each option has a different job. The displayed amount, credit-forward rule, and next step come from the server-controlled commercial catalog.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {engagementOffers.map((offer, index) => (
          <Card dark className="flex h-full flex-col" key={offer.key}>
            <Badge tone={index === 0 ? "observing" : "neutral"}>{index === 0 ? "Start here" : "Qualified next step"}</Badge>
            <h3 className="mt-5 text-lg font-extrabold tracking-tight">{offer.name}</h3>
            <p className="mt-3 text-3xl font-extrabold tracking-tight" style={{ color: "var(--gold-300)" }}>{offer.shortPrice}</p>

            <dl className="mt-6 grid gap-5 pt-5" style={{ borderTop: "var(--border-hair-dark)" }}>
              <div>
                <dt className="text-[10px] font-bold uppercase" style={{ color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)" }}>Best for</dt>
                <dd className="mt-2 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{offer.bestFor}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase" style={{ color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)" }}>What happens</dt>
                <dd className="mt-2 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{offer.whatHappens}</dd>
              </div>
            </dl>

            <p className="mt-5 text-[10px] leading-5" style={{ color: "var(--text-secondary)" }}>{offer.creditForward}</p>

            <Link
              className="mt-auto inline-flex min-h-11 items-center justify-between gap-3 pt-7 text-xs font-extrabold"
              href={ctaHref}
              style={{ color: "var(--cyan-300)" }}
            >
              {offer.cta} <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Card>
        ))}
      </div>

      <div className="mt-6"><HumanReviewBanner /></div>
    </section>
  );
}
