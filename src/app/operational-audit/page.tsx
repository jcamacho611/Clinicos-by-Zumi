import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StackAnalysis } from "@/app/operational-audit/stack-analysis";
import { clinicCommercialOffers, clinicPlans } from "@/lib/commercial/klinikos-commercial";
import { KLINIKOS_ECONOMIC_THESIS } from "@/lib/brand/canonical-messaging";

export const metadata: Metadata = {
  title: "What would Klinikos replace?",
  description:
    "Enter what your clinic pays for software today and see what Klinikos would replace, what stays "
    + "connected, and what the difference costs. Software only, no invented savings.",
};

/**
 * The destination of the homepage's primary call to action.
 *
 * The price lives on the server. This page reads `clinicPlans.core` rather than printing
 * a number, so the figure a buyer compares against is the same one checkout would use.
 */
export default function OperationalAuditPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--surface-base, #070304)" }}>
      <header className="border-b" style={{ borderColor: "var(--line-dark)" }}>
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link className="text-sm font-semibold" href="/" style={{ color: "var(--text-primary)" }}>Klinikos</Link>
          <Link className="inline-flex items-center gap-2 text-sm" href="/" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft aria-hidden="true" className="size-4" />Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[.24em]" style={{ color: "var(--accent-intelligence)" }}>
          Clinic operating analysis
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-light tracking-[-.04em] sm:text-5xl" style={{ color: "var(--text-primary)" }}>
          See what Klinikos would replace.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: "var(--text-secondary)" }}>
          {KLINIKOS_ECONOMIC_THESIS}
        </p>

        <div className="mt-10">
          <StackAnalysis
            implementationCents={clinicCommercialOffers.foundingImplementation.priceCents}
            klinikosMonthlyCents={clinicPlans.core.monthlyPriceCents}
          />
        </div>
      </section>
    </main>
  );
}
