import Link from "next/link";
import { commandSurfaces } from "@/lib/design/command-system";
import { MarketingShell } from "@/components/growth/marketing-shell";
import { provisioningStatusForEmail } from "@/lib/provisioning/provisioning-service";
import { getClinicSession } from "@/lib/auth/session";
import {
  PAYMENT_DOES_NOT_GRANT,
  provisioningStepLabels,
  provisioningSteps,
  type ProvisioningStep,
  type StepState,
} from "@/lib/provisioning/provisioning-rules";

/**
 * The post-purchase surface.
 *
 * Shows what a payment actually activated and what is still waiting, step by step.
 * The blocked steps are shown as blocked with the reason attached rather than as a
 * spinner over work that will never finish on its own — a clinic watching a progress
 * bar for a lab connection nobody has signed is a clinic being misled.
 *
 * State is resolved from the signed-in session, never from a query string. A page
 * that took an email from the URL would let anyone read anyone else's provisioning.
 */

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome to Klinikos" };

const STATE_STYLES: Record<StepState, string> = {
  complete: "border-emerald-400/40 bg-emerald-400/[.08] text-emerald-200",
  pending: "border-white/15 bg-white/[.04] text-slate-300",
  in_progress: "border-cyan-300/40 bg-cyan-400/[.08] text-cyan-200",
  blocked: "border-[#e6c55b]/40 bg-[#e6c55b]/[.09] text-[#f0dda0]",
  not_applicable: "border-white/10 bg-transparent text-slate-500",
};

const STATE_LABELS: Record<StepState, string> = {
  complete: "Done",
  pending: "Pending",
  in_progress: "In progress",
  blocked: "Needs you or us",
  not_applicable: "Not included",
};

export default async function WelcomePage() {
  const session = await getClinicSession();

  if (!session) {
    return (
      <MarketingShell>
        <section className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8">
          <h1 className={`${commandSurfaces.headline} text-4xl`}>Sign in to see your setup</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            Your provisioning status is tied to your Klinikos account. Sign in and this page will show
            exactly what your purchase activated and what is still outstanding.
          </p>
          <Link className={`${commandSurfaces.interactive} mt-8 inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/login">
            Sign in
          </Link>
        </section>
      </MarketingShell>
    );
  }

  const status = process.env.DATABASE_URL ? await provisioningStatusForEmail(session.email) : null;

  return (
    <MarketingShell>
      <section aria-labelledby="welcome-heading" className="border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-20">
          <p className={commandSurfaces.eyebrow}>Welcome to Klinikos</p>
          <h1 className={`${commandSurfaces.headline} mt-4 max-w-3xl text-balance text-4xl leading-[1] sm:text-5xl`} id="welcome-heading">
            {status ? "Here is exactly where your setup stands." : "We have not recorded a purchase for this account yet."}
          </h1>

          {!status && (
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
              If you have just paid, this can take a few minutes — Klinikos waits for the payment provider
              to confirm rather than trusting the page you were redirected from. If it stays empty, contact
              us and we will reconcile it by hand.
            </p>
          )}

          {status && (
            <>
              <ol className="mt-10 grid gap-px bg-white/10">
                {provisioningSteps.map((step) => {
                  const state = (status.steps[step as ProvisioningStep] ?? "pending") as StepState;
                  return (
                    <li className="flex flex-wrap items-center gap-4 bg-[#05090f] p-5" key={step}>
                      <span className={`border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.1em] ${STATE_STYLES[state]}`}>
                        {STATE_LABELS[state]}
                      </span>
                      <span className="text-sm font-bold text-white">{provisioningStepLabels[step]}</span>
                    </li>
                  );
                })}
              </ol>

              {status.modules.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-500">Capabilities activated</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {status.modules.map((module) => (
                      <li className="border border-white/15 bg-white/[.04] px-3 py-1.5 text-[12px] font-semibold text-slate-200" key={module}>
                        {module.replace(/_/g, " ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {status.outstanding.length > 0 && (
                <div className={`${commandSurfaces.panelReview} mt-10 max-w-3xl p-5`}>
                  <h2 className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#e6c55b]">Still outstanding</h2>
                  <ul className="mt-3 grid gap-2.5">
                    {status.outstanding.map((entry) => (
                      <li className="text-[13px] leading-6 text-slate-200" key={entry}>{entry}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className={`${commandSurfaces.panelBoundary} mt-10 max-w-3xl p-5`}>
            <h2 className="text-[11px] font-extrabold uppercase tracking-[.14em] text-rose-300">What a payment does not activate</h2>
            <ul className="mt-3 grid gap-2">
              {PAYMENT_DOES_NOT_GRANT.map((entry) => (
                <li className="text-[13px] leading-6 text-slate-200" key={entry}>{entry}</li>
              ))}
            </ul>
          </div>

          <Link className={`${commandSurfaces.interactive} mt-10 inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/dashboard">
            Open Klinikos
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
