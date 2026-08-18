import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Badge, Card } from "@/components/ds";
import { HumanReviewBanner } from "@/components/command/zumi-command-shell";
import { demoOffers, type DemoOfferKey } from "@/lib/sales-demo-rules";

const sequence: readonly {
  key: DemoOfferKey;
  stage: string;
  timing: string;
  bestFor: string;
  whatHappens: string;
  action: { label: string; href: string } | null;
}[] = [
  {
    key: "private_workflow_demo",
    stage: "01",
    timing: "Start here",
    bestFor: "Clinics that want Klinikos to map where work is getting lost before committing to implementation.",
    whatHappens: "The clinic completes a paid operating analysis, then a human reviews the map, workflow evidence, and recommended next step.",
    action: { label: "Start Clinic Operating Analysis", href: "/sales" },
  },
  {
    key: "founding_clinic_evaluation",
    stage: "02",
    timing: "After analysis + human review",
    bestFor: "Clinics whose analysis supports deeper implementation planning and a scoped system design.",
    whatHappens: "Klinikos maps workflow requirements, roles, migration needs, integrations, production gates, implementation scope, and launch sequencing.",
    action: { label: "Review current pricing", href: "/pricing" },
  },
  {
    key: "founding_clinic_program",
    stage: "03",
    timing: "After Blueprint + scope approval",
    bestFor: "Clinics ready for a reviewed implementation under agreed scope, production gates, and commercial terms.",
    whatHappens: "Klinikos provisions the approved operating slices, configures workflows and roles, and moves toward production only as independent security, privacy, integration, and operational gates are satisfied.",
    action: { label: "Review implementation pricing", href: "/pricing" },
  },
];

/**
 * Founding commercial sequence under Klinikos payment and production law.
 *
 * Compatibility keys remain internal. Public labels/prices come from `demoOffers`,
 * which mirrors the canonical commercial catalog. Later stages are informational
 * until the preceding human-reviewed gate has been satisfied.
 */
export function FoundingOfferCards({ headingId = "engagement-heading" }: { headingId?: string }) {
  return (
    <section aria-labelledby={headingId}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="mapping">Commercial sequence</Badge>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight" id={headingId}>One paid starting point. Later steps unlock after review.</h2>
        </div>
        <p className="max-w-xl text-xs leading-6" style={{ color: "var(--text-secondary)" }}>
          Analysis, planning, and implementation are separate states. Paying for one does not silently purchase or activate the next.
        </p>
      </div>

      <ol className="mt-8 grid gap-5 lg:grid-cols-3">
        {sequence.map((step, index) => {
          const offer = demoOffers[step.key];
          return (
            <li key={step.key}>
              <Card dark className="flex h-full flex-col">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone={index === 0 ? "observing" : "neutral"}>{step.timing}</Badge>
                  <span className="text-[12px] font-extrabold tracking-[.16em] text-rose-200">{step.stage}</span>
                </div>
                <h3 className="mt-5 text-lg font-extrabold tracking-tight">{offer.name}</h3>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-amber-200">{offer.shortPrice}</p>

                <dl className="mt-6 grid gap-5 border-t border-white/10 pt-5">
                  <div>
                    <dt className="text-[12px] font-bold uppercase tracking-[.14em] text-slate-500">Best for</dt>
                    <dd className="mt-2 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{step.bestFor}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] font-bold uppercase tracking-[.14em] text-slate-500">What happens</dt>
                    <dd className="mt-2 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{step.whatHappens}</dd>
                  </div>
                </dl>

                <p className="mt-5 text-[12px] leading-5" style={{ color: "var(--text-secondary)" }}>{offer.creditForward}</p>

                {step.action ? (
                  <Link className="mt-auto inline-flex min-h-11 items-center justify-between gap-3 pt-7 text-xs font-extrabold text-rose-200" href={step.action.href}>
                    {step.action.label} <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                ) : (
                  <p className="mt-auto flex items-center gap-2 pt-7 text-[12px] font-bold uppercase tracking-[.12em] text-slate-500"><LockKeyhole className="size-3.5" /> Requires prior review</p>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="mt-6"><HumanReviewBanner /></div>
    </section>
  );
}
