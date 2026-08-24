import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductEvidenceFigure } from "@/components/marketing/product-evidence-figure";

/**
 * The homepage's answer to "what does it actually do".
 *
 * The hero says what Klinikos is and the composer invites a question, but a visitor who
 * wanted to see the product had to leave the page to find one. That is the gap an outside
 * reviewer hit before asking for a pitch deck, so the evidence belongs on the page people
 * land on, not only on the explainer they may never open.
 */
export function ProductEvidenceSection() {
  return (
    <section className="border-t border-[rgba(226,139,133,.16)] bg-[#050303] px-5 py-16 sm:px-8 lg:py-24" id="what-it-does">
      <div className="mx-auto max-w-5xl">
        <p className="text-[12px] font-extrabold uppercase tracking-[.22em] text-[#e6817b]">What it actually does</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-light leading-[1.1] tracking-[-.04em] text-[#f8efed] sm:text-4xl">
          Most software shows you everything that happened. Klinikos shows you what has not reached its owner yet.
        </h2>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-[#b89f9b]">
          Work is split by whose hands it is in, so a person can pick up what is theirs and put down what is not.
          Urgency is carried by a word as well as a colour. No row names a patient, because this summary ends up on
          shared screens.
        </p>

        <ProductEvidenceFigure className="mt-10" />

        <div className="mt-10 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6817b] px-6 text-xs font-extrabold text-[#1a0c0f]" href="/how-it-works">
            See how the rest works <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-full border border-[rgba(226,139,133,.3)] px-6 text-xs font-extrabold text-[#f8efed] hover:bg-[rgba(226,139,133,.08)]" href="/operational-audit">
            See what Klinikos would replace
          </Link>
        </div>
      </div>
    </section>
  );
}
