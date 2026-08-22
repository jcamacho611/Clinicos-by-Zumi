"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STACK_CATEGORIES, computeStackSavings, type StackCategory } from "@/lib/commercial/clinic-stack-savings";

/**
 * The clinic enters what it already pays. Klinikos shows what it would and would not
 * replace, what is only a transition target today, and what the checkable difference is.
 */

const currency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

function categoryStatus(category: StackCategory) {
  if (category.disposition === "connected") {
    return { label: "Stays connected", color: "#a8c4ea" };
  }
  if (category.disposition === "partial") {
    return { label: "Partly replaced", color: "#f3c98a" };
  }
  if (category.replacementReadiness === "counted_now") {
    return { label: "Counted as replaceable", color: "#8fd9bd" };
  }
  if (category.replacementReadiness === "external_connection_required") {
    return { label: "Connection required", color: "#f3c98a" };
  }
  return { label: "Keep during transition", color: "#f3c98a" };
}

export function StackAnalysis({ klinikosMonthlyCents, implementationCents }: { klinikosMonthlyCents: number; implementationCents: number }) {
  const [entries, setEntries] = useState<Record<string, string>>({});

  const lines = useMemo(
    () => Object.entries(entries)
      .map(([key, raw]) => ({ key, monthlyCents: Math.round((Number.parseFloat(raw) || 0) * 100) }))
      .filter((line) => line.monthlyCents > 0),
    [entries],
  );

  const result = useMemo(
    () => computeStackSavings(lines, klinikosMonthlyCents, implementationCents),
    [lines, klinikosMonthlyCents, implementationCents],
  );

  const answered = lines.length;
  const saving = result.netMonthlyChangeCents > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
      <section>
        <h2 className="text-xl font-semibold tracking-[-.02em]" style={{ color: "var(--text-primary)" }}>
          What does your clinic pay each month?
        </h2>
        <p className="mt-2 max-w-xl text-[13px] leading-6" style={{ color: "var(--text-secondary)" }}>
          Enter what you know. Leave the rest blank. Klinikos counts a bill as replaceable only when the current
          product path is ready enough to defend that claim; transition and external-connection items stay out of savings.
        </p>

        <div className="mt-6 space-y-3">
          {STACK_CATEGORIES.map((category) => {
            const status = categoryStatus(category);
            const transition = category.disposition === "replaced" && category.replacementReadiness !== "counted_now";
            return (
              <div
                className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                key={category.key}
                style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-sm font-semibold" htmlFor={`stack-${category.key}`} style={{ color: "var(--text-primary)" }}>
                      {category.label}
                    </label>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                      style={{ color: status.color, borderColor: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>{category.examples}</p>
                  {transition ? (
                    <p className="mt-1 text-[11px] leading-5" style={{ color: "var(--text-secondary)" }}>
                      {category.readinessReason}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>$</span>
                  <input
                    className="w-24 rounded-lg border px-2 py-2 text-sm"
                    id={`stack-${category.key}`}
                    inputMode="decimal"
                    onChange={(event) => setEntries((prior) => ({ ...prior, [category.key]: event.target.value }))}
                    placeholder="0"
                    style={{ borderColor: "var(--line-dark)", background: "var(--surface-raised)", color: "var(--text-primary)" }}
                    value={entries[category.key] ?? ""}
                  />
                  <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>/mo</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-2xl border p-6" style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}>
          <h2 className="text-xl font-semibold tracking-[-.02em]" style={{ color: "var(--text-primary)" }}>Your comparison</h2>

          {answered === 0 ? (
            <p className="mt-4 text-[13px] leading-6" style={{ color: "var(--text-secondary)" }}>
              Enter at least one line and the comparison appears here. Nothing is estimated on your behalf.
            </p>
          ) : (
            <>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt style={{ color: "var(--text-secondary)" }}>What you told us you pay</dt>
                  <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>{currency(result.currentMonthlyCents)}/mo</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt style={{ color: "var(--text-secondary)" }}>Counted as replaceable now</dt>
                  <dd className="font-semibold" style={{ color: "#8fd9bd" }}>{currency(result.replaceableMonthlyCents)}/mo</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt style={{ color: "var(--text-secondary)" }}>Replacement target, not counted yet</dt>
                  <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>{currency(result.transitionMonthlyCents)}/mo</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt style={{ color: "var(--text-secondary)" }}>Stays connected, keeps its bill</dt>
                  <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>{currency(result.connectedMonthlyCents)}/mo</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt style={{ color: "var(--text-secondary)" }}>Partly replaced, not counted as saved</dt>
                  <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>{currency(result.partialMonthlyCents)}/mo</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t pt-3" style={{ borderColor: "var(--line-dark)" }}>
                  <dt style={{ color: "var(--text-secondary)" }}>Klinikos</dt>
                  <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>{currency(result.klinikosMonthlyCents)}/mo</dd>
                </div>
              </dl>

              <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--line-dark)", background: "var(--surface-raised)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-[.14em]" style={{ color: "var(--text-secondary)" }}>
                  {saving ? "Estimated monthly software change" : "Counted replacement spend is below Klinikos today"}
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-[-.04em]" style={{ color: saving ? "#8fd9bd" : "var(--text-primary)" }}>
                  {saving ? "−" : "+"}{currency(Math.abs(result.netMonthlyChangeCents))}/mo
                </p>
                <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--text-secondary)" }}>
                  {saving
                    ? `About ${currency(Math.abs(result.netAnnualChangeCents))} a year in currently countable software savings, before implementation.`
                    : "On currently countable software replacement alone, Klinikos would cost you more. Transition targets are deliberately excluded until their real deployment dependencies are closed."}
                </p>
                {result.paybackMonths !== null ? (
                  <p className="mt-3 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    Implementation {currency(result.implementationCents)} · software-only payback in about{" "}
                    <strong style={{ color: "var(--text-primary)" }}>{result.paybackMonths} months</strong>.
                  </p>
                ) : null}
              </div>

              {result.transitionCategories.length > 0 ? (
                <p className="mt-4 text-[12px] leading-5" style={{ color: "var(--text-secondary)" }}>
                  Not counted as removable yet: {result.transitionCategories.join(", ")}.
                </p>
              ) : null}

              {result.unansweredCategories.length > 0 ? (
                <p className="mt-4 text-[12px] leading-5" style={{ color: "var(--text-secondary)" }}>
                  Not counted, because you did not enter them: {result.unansweredCategories.join(", ")}.
                </p>
              ) : null}

              <p className="mt-4 text-[12px] leading-5" style={{ color: "var(--text-secondary)" }}>
                Every cost is what you typed. This comparison covers software only. It does not claim recovered
                revenue, staff-time savings, a production connector that has not been verified, or a vendor cutover before implementation approves it.
              </p>

              <Link
                className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                href="/founding-clinic"
                style={{ background: "var(--accent-intelligence)", color: "#1a090a" }}
              >
                Take this to a real conversation <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
