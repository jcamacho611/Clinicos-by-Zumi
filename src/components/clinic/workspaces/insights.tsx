import Link from "next/link";
import { Lightbulb } from "lucide-react";
import type { InsightsPicture } from "@/lib/insights/observations";

/**
 * Conclusions first. Charts, if ever, much later.
 *
 * The directive this follows is "Klinikos noticed…", not a wall of analytics. Each row
 * is a sentence a person can act on, with the count it came from directly underneath —
 * so an owner who does not believe it can check it rather than trust it.
 *
 * The state that matters most is the empty one. A clinic with three weeks of history has
 * no patterns worth reporting, and saying so is more valuable than manufacturing an
 * observation from six rows. "Not enough history yet" and "nothing needs attention" are
 * different facts and this surface never conflates them.
 */
export function InsightsWorkspace({ picture }: { picture: InsightsPicture }) {
  if (picture.observations === null) {
    return (
      <div className="space-y-[var(--space-5)]">
        <h2 className="text-2xl font-light tracking-[-.04em]" style={{ color: "var(--text-primary)" }}>
          Insights are not available for your role.
        </h2>
        <p className="max-w-2xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          Insights read across the schedule and follow-up work. Ask an administrator if you need access.
        </p>
      </div>
    );
  }

  if (!picture.baselineEstablished) {
    return (
      <div className="space-y-[var(--space-5)]">
        <h2 className="text-2xl font-light tracking-[-.04em] sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          Not enough history yet.
        </h2>
        <p className="max-w-2xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          Klinikos has {picture.sampleSize} {picture.sampleSize === 1 ? "visit" : "visits"} in the last {picture.windowDays} days
          — too few for any pattern to mean anything. Rather than describe a trend from a handful of records, it will wait
          until there is enough to be worth telling you.
        </p>
      </div>
    );
  }

  if (picture.observations.length === 0) {
    return (
      <div className="space-y-[var(--space-5)]">
        <h2 className="text-2xl font-light tracking-[-.04em] sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          Nothing stands out.
        </h2>
        <p className="max-w-2xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          Klinikos looked across {picture.sampleSize} visits from the last {picture.windowDays} days and found no pattern
          worth raising. It will say something here when that changes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <div>
        <h2 className="text-2xl font-light tracking-[-.04em] sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          Klinikos noticed
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          From {picture.sampleSize} visits over the last {picture.windowDays} days.
        </p>
      </div>

      <div
        className="divide-y rounded-[var(--radius-lg,18px)] border"
        style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}
      >
        {picture.observations.map((observation) => (
          <div className="grid gap-3 p-[var(--space-6)] sm:grid-cols-[1fr_auto] sm:items-center" key={observation.id}>
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: "var(--accent-intelligence)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{observation.headline}</p>
                  {/* The count directly under the claim, so it can be checked rather than trusted. */}
                  <p className="mt-1.5 text-[13px] leading-6" style={{ color: "var(--text-secondary)" }}>{observation.evidence}</p>
                </div>
              </div>
            </div>
            {observation.action ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-xs font-semibold transition"
                href={observation.action.href}
                style={{ background: "var(--accent-intelligence)", color: "var(--obsidian)" }}
              >
                {observation.action.label}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
