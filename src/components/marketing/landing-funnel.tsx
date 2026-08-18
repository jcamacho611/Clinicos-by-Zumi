"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

/** A price line as the marketing surface renders it. Values come from the caller. */
export type FunnelTier = {
  tag: string;
  price: string;
  unit: string;
  body: string;
  includes: readonly string[];
  excludes: readonly string[];
  primary?: boolean;
};

export type FunnelPriceGroup = {
  key: string;
  label: string;
  note: string;
  tiers: readonly FunnelTier[];
};

export type FunnelAudience = {
  key: string;
  label: string;
  title: string;
  body: string;
  surfaces: readonly string[];
  next: string;
};

const GAPS = [
  "Recall and follow-up",
  "Referral loops never close",
  "Result acknowledgment",
  "Prior authorization",
  "No-show recovery",
  "Intake and consent",
  "Charge capture and claim readiness",
  "Coverage and staffing",
  "Idle rooms or chairs",
] as const;

const SETTINGS = [
  ["Independent practice owner", "One location; you carry operations and payroll"],
  ["Practice manager or administrator", "You own the schedule, staffing and the queues"],
  ["Provider — MD, DO, NP, PA", "You carry the panel and the clinical decisions"],
  ["Nurse or clinical staff", "You run intake, follow-up and coordination"],
  ["Multi-site or group operator", "Two or more locations under one roof"],
  ["Student or newly licensed", "Not practicing independently yet"],
] as const;

/**
 * What Klinikos would look at first, for each gap a person selects.
 *
 * This is the whole "operating analysis": a deterministic restatement of the
 * answers, naming the engine that owns each one. It is not a diagnosis, a benchmark,
 * or a projection — the page has no access to the reader's clinic, so anything
 * beyond their own answers would be invented. The surface says so out loud.
 */
const GAP_ROUTES: Record<string, { engine: string; step: string }> = {
  "Recall and follow-up": { engine: "Clinic OS", step: "Name every unreturned contact and give it an owner." },
  "Referral loops never close": { engine: "Clinic OS", step: "Find referrals with no acknowledgment and assign the next step." },
  "Result acknowledgment": { engine: "Care", step: "Surface results outside range that have not been released or reviewed." },
  "Prior authorization": { engine: "Billing", step: "Track authorization state against the visits that depend on it." },
  "No-show recovery": { engine: "Clinic OS", step: "Rebook the visits that were never rescheduled." },
  "Intake and consent": { engine: "Clinic OS", step: "Show arrivals missing intake or consent before they arrive." },
  "Charge capture and claim readiness": { engine: "Billing", step: "Queue closed visits that are not yet claim-ready." },
  "Coverage and staffing": { engine: "Grid", step: "Draft the coverage need with hours, scope and location." },
  "Idle rooms or chairs": { engine: "Grid", step: "List the room, its hours, and what may lawfully be done in it." },
};

function Rule({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-3xl text-xs leading-6 text-[var(--text-secondary)]">{children}</p>;
}

function TierCard({ tier }: { tier: FunnelTier }) {
  return (
    <div
      className="flex h-full flex-col rounded-[18px] border px-6 py-7"
      style={{
        borderColor: tier.primary ? "var(--accent-intelligence)" : "var(--line-dark)",
        background: tier.primary ? "var(--surface-raised)" : "transparent",
      }}
    >
      <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">{tier.tag}</p>
      <p className="mt-4 text-3xl font-light tracking-[var(--tracking-tight)]">{tier.price}</p>
      <p className="mt-1 text-[var(--text-micro)] text-[var(--text-secondary)]">{tier.unit}</p>
      <p className="mt-4 text-xs leading-6 text-[var(--text-secondary)]">{tier.body}</p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {tier.includes.map((line) => (
          <li className="flex gap-2.5 text-xs leading-5" key={line}>
            <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--status-resolved)]" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
        {tier.excludes.map((line) => (
          <li className="flex gap-2.5 text-xs leading-5 text-[var(--text-secondary)]" key={line}>
            <Minus className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFunnel({
  audiences,
  priceGroups,
  analysisPriceLabel,
  analysisCredit,
  contactEmail,
}: {
  audiences: readonly FunnelAudience[];
  priceGroups: readonly FunnelPriceGroup[];
  analysisPriceLabel: string;
  analysisCredit: string;
  contactEmail: string;
}) {
  const [audienceKey, setAudienceKey] = useState(audiences[0]?.key ?? "");
  const [priceKey, setPriceKey] = useState(priceGroups[0]?.key ?? "");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [setting, setSetting] = useState<string | null>(null);
  const [gaps, setGaps] = useState<string[]>([]);

  const audience = audiences.find((entry) => entry.key === audienceKey) ?? audiences[0];
  const priceGroup = priceGroups.find((entry) => entry.key === priceKey) ?? priceGroups[0];
  const routes = useMemo(() => gaps.map((gap) => ({ gap, ...GAP_ROUTES[gap] })).filter((route) => route.engine), [gaps]);

  function toggleGap(gap: string) {
    setGaps((current) => (current.includes(gap) ? current.filter((entry) => entry !== gap) : [...current, gap]));
  }

  return (
    <div className="bg-[var(--surface-primary)] text-[var(--text-primary)]">
      <section className="mx-auto max-w-[var(--container-max)] px-5 py-20 sm:px-8 lg:px-12 lg:py-28" id="top">
        <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wider)] text-[var(--accent-intelligence)]">
          Klinikos
        </p>
        <h1
          className="mt-6 max-w-5xl text-balance font-extralight tracking-[var(--tracking-tighter)]"
          style={{ fontSize: "var(--text-h1)", lineHeight: "var(--leading-tight)" }}
        >
          Your clinic isn&rsquo;t missing software.{" "}
          <span className="text-[var(--accent-intelligence)]">It&rsquo;s missing continuity.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
          The work doesn&rsquo;t fail loudly. A referral goes out and nothing comes back. A result lands and nobody
          releases it. A room sits empty on the day you&rsquo;re closed. Klinikos keeps the thread.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--accent-intelligence)] px-7 text-xs font-semibold text-[var(--surface-primary)] transition-opacity hover:opacity-90"
            href="#funnel"
          >
            Start the operating analysis <ArrowRight className="size-4" />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--line-dark)] px-7 text-xs font-semibold transition-opacity hover:opacity-80"
            href="#pricing"
          >
            See pricing
          </Link>
        </div>
      </section>

      <section className="border-t border-[var(--line-dark)]" id="who">
        <div className="mx-auto max-w-[var(--container-max)] px-5 py-20 sm:px-8 lg:px-12">
          <h2 className="max-w-3xl text-3xl font-light tracking-[var(--tracking-tight)]">
            Same platform. Different stage of the same career.
          </h2>

          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Who Klinikos is for">
            {audiences.map((entry) => (
              <button
                aria-selected={entry.key === audience?.key}
                className="min-h-11 rounded-full border px-5 text-xs font-semibold transition-opacity hover:opacity-85"
                key={entry.key}
                onClick={() => setAudienceKey(entry.key)}
                role="tab"
                style={{
                  borderColor: entry.key === audience?.key ? "var(--accent-intelligence)" : "var(--line-dark)",
                  color: entry.key === audience?.key ? "var(--accent-intelligence)" : "var(--text-secondary)",
                }}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>

          {audience ? (
            <div className="mt-9 grid gap-10 rounded-[20px] border border-[var(--line-dark)] px-6 py-9 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-9">
              <div>
                <h3 className="text-xl font-semibold tracking-[var(--tracking-tight)]">{audience.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{audience.body}</p>
                <p className="mt-6 text-xs leading-6 text-[var(--status-analyzing)]">{audience.next}</p>
              </div>
              <ul className="space-y-3">
                {audience.surfaces.map((surface) => (
                  <li className="flex gap-3 text-xs leading-6" key={surface}>
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent-intelligence)]" />
                    <span>{surface}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t border-[var(--line-dark)]" id="pricing">
        <div className="mx-auto max-w-[var(--container-max)] px-5 py-20 sm:px-8 lg:px-12">
          <h2 className="max-w-3xl text-3xl font-light tracking-[var(--tracking-tight)]">
            Priced per location, not per seat.
          </h2>
          <Rule>
            Adding a person to your clinic should not cost you money. Every price below is the published Klinikos
            price; nothing on this page is a personalised quote.
          </Rule>

          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Pricing areas">
            {priceGroups.map((group) => (
              <button
                aria-selected={group.key === priceGroup?.key}
                className="min-h-11 rounded-full border px-5 text-xs font-semibold transition-opacity hover:opacity-85"
                key={group.key}
                onClick={() => setPriceKey(group.key)}
                role="tab"
                style={{
                  borderColor: group.key === priceGroup?.key ? "var(--accent-intelligence)" : "var(--line-dark)",
                  color: group.key === priceGroup?.key ? "var(--accent-intelligence)" : "var(--text-secondary)",
                }}
                type="button"
              >
                {group.label}
              </button>
            ))}
          </div>

          {priceGroup ? (
            <>
              <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {priceGroup.tiers.map((tier) => <TierCard key={tier.tag} tier={tier} />)}
              </div>
              <Rule>{priceGroup.note}</Rule>
            </>
          ) : null}
        </div>
      </section>

      <section className="border-t border-[var(--line-dark)]" id="payment-truth">
        <div className="mx-auto max-w-[var(--container-max)] px-5 py-20 sm:px-8 lg:px-12">
          <h2 className="max-w-3xl text-3xl font-light tracking-[var(--tracking-tight)]">
            You always see what you tried to do, and what happens after you pay.
          </h2>
          <div className="mt-9 grid gap-8 lg:grid-cols-3 lg:gap-12">
            {[
              ["Returning from checkout is not payment", "A redirect back from a payment page means the browser came back — nothing more. Klinikos activates paid capability only after the payment is independently confirmed."],
              ["Payment never overrides governance", "Paying does not widen role permissions, tenant boundaries, clinical authority, credentialing, privacy rules, or record release. Money buys capability, never authority."],
              ["A saved card is not a blank cheque", "Variable vendor spend runs against an included allowance or prepaid funds. Nothing bills through to you unbounded because a card is on file."],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line-dark)] bg-[var(--surface-raised)]" id="funnel">
        <div className="mx-auto max-w-[var(--container-max)] px-5 py-20 sm:px-8 lg:px-12">
          <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">
            Clinic Operating Analysis · {analysisPriceLabel}
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-light tracking-[var(--tracking-tight)]">
            Two questions. Then what Klinikos would look at first.
          </h2>
          <Rule>
            No PHI. No integration. Nothing is sent anywhere — this runs in your browser and reflects only what you
            select. {analysisCredit}
          </Rule>

          {step === 1 ? (
            <div className="mt-10">
              <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">Step 1 · Your setting</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {SETTINGS.map(([label, detail]) => (
                  <button
                    className="rounded-[16px] border px-5 py-5 text-left transition-opacity hover:opacity-85"
                    key={label}
                    onClick={() => { setSetting(label); setStep(2); }}
                    style={{ borderColor: setting === label ? "var(--accent-intelligence)" : "var(--line-dark)" }}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-2 block text-xs leading-5 text-[var(--text-secondary)]">{detail}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-10">
              <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">
                Step 2 · Where continuity breaks — select all that apply
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {GAPS.map((gap) => (
                  <button
                    aria-pressed={gaps.includes(gap)}
                    className="min-h-11 rounded-full border px-5 text-xs font-semibold transition-opacity hover:opacity-85"
                    key={gap}
                    onClick={() => toggleGap(gap)}
                    style={{
                      borderColor: gaps.includes(gap) ? "var(--accent-intelligence)" : "var(--line-dark)",
                      color: gaps.includes(gap) ? "var(--accent-intelligence)" : "var(--text-secondary)",
                    }}
                    type="button"
                  >
                    {gap}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="min-h-12 rounded-full border border-[var(--line-dark)] px-6 text-xs font-semibold transition-opacity hover:opacity-80"
                  onClick={() => setStep(1)}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="min-h-12 rounded-full bg-[var(--accent-intelligence)] px-7 text-xs font-semibold text-[var(--surface-primary)] transition-opacity hover:opacity-90 disabled:opacity-40"
                  disabled={!gaps.length}
                  onClick={() => setStep(3)}
                  type="button"
                >
                  Show what Klinikos would look at
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-10">
              <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">
                Based only on what you selected
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-[var(--tracking-tight)]">
                {setting} · {routes.length} {routes.length === 1 ? "area" : "areas"} to work
              </h3>

              <ol className="mt-7 divide-y divide-[var(--line-dark)] overflow-hidden rounded-[18px] border border-[var(--line-dark)] px-6">
                {routes.map((route) => (
                  <li className="grid gap-3 py-5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6" key={route.gap}>
                    <span className="text-sm font-semibold">{route.gap}</span>
                    <span className="text-xs leading-6 text-[var(--text-secondary)]">{route.step}</span>
                    <span className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">
                      {route.engine}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-6 max-w-3xl text-xs leading-6 text-[var(--status-analyzing)]">
                This restates what you selected and names which part of Klinikos owns each one. It is not a diagnosis
                or an estimate: this page cannot see your clinic, so it will not tell you what any of it costs you.
                The paid Clinic Operating Analysis is where a person looks at your actual operation.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="min-h-12 rounded-full border border-[var(--line-dark)] px-6 text-xs font-semibold transition-opacity hover:opacity-80"
                  onClick={() => setStep(2)}
                  type="button"
                >
                  Change answers
                </button>
                {contactEmail ? (
                  <a
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--accent-intelligence)] px-7 text-xs font-semibold text-[var(--surface-primary)] transition-opacity hover:opacity-90"
                    href={`mailto:${contactEmail}?subject=${encodeURIComponent("Clinic Operating Analysis")}&body=${encodeURIComponent(`Setting: ${setting}\n\nWhere continuity breaks:\n${gaps.map((gap) => `- ${gap}`).join("\n")}`)}`}
                  >
                    Book the {analysisPriceLabel} analysis <ArrowRight className="size-4" />
                  </a>
                ) : (
                  <Link
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--accent-intelligence)] px-7 text-xs font-semibold text-[var(--surface-primary)] transition-opacity hover:opacity-90"
                    href="/pricing"
                  >
                    See how the analysis works <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
