"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck, Clock3, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { AnalysisActivationForm } from "@/components/commercial/analysis-activation-form";
import type { ActivationView } from "@/lib/commercial/analysis-activation";

/**
 * The three honest things this page can say, and the work it lets someone do.
 *
 * It used to say one static thing to everybody: "we're confirming this with the payment
 * provider". That is true while payment is pending and false once it is recorded, and
 * either way it left a paying customer to work out what happens next on their own.
 *
 * The states are now distinguished by what the server actually knows:
 *
 *  - Payment recorded → say so, and get straight to the work.
 *  - Checkout underway, nothing verified → still the honest pending message. A browser
 *    return is not payment, and this page never pretends otherwise.
 *  - No usable reference → the generic message, because we genuinely do not know which
 *    purchase this is. Better than guessing at one.
 *
 * The activation questions appear in the first two states. Waiting for verification is
 * not a reason to make someone sit and do nothing: the details shape the analysis either
 * way, and collecting them early is the difference between a customer who has started
 * and a customer who has paid and stalled.
 */

const shell = "relative min-h-screen overflow-hidden bg-[#070304] px-5 py-8 text-[#fff9f7] sm:px-8 sm:py-12";

function Frame({ badge, children }: { badge: string; children: React.ReactNode }) {
  return (
    <main className={shell}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(161,74,70,.16),transparent_34%),radial-gradient(circle_at_78%_78%,rgba(111,49,49,.1),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <KlinikosWordmark href="/" framed inverse markClassName="h-10 w-10" textClassName="h-[19px] w-[170px]" className="gap-3" />
          <span className="rounded-full border border-[#efaaa1]/20 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#efaaa1]/70">{badge}</span>
        </header>
        <div className="flex-1 py-12">{children}</div>
        <footer className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-5 text-white/35">Your saved request remains available for authorized follow-up. Do not create a second reservation for the same purchase.</p>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-xs font-extrabold text-white/70 hover:bg-white/[.04]" href="/">Return home</Link>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b66d69] px-5 text-xs font-extrabold text-[#170708] hover:bg-[#ca807a]" href="/pricing">See what comes after the analysis <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function VerificationNote() {
  return (
    <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.02] p-5 text-[12px] leading-6 text-white/45">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" aria-hidden="true" />
      <span>
        Klinikos recognizes payment only after the processor sends valid signed server evidence, matched to the
        server-owned product, amount, currency, organization and environment. Payment does not bypass identity,
        privacy, eligibility, authorization, clinical or human-review controls, and the Clinic Operating Analysis
        does not activate production software.
      </span>
    </div>
  );
}

export function PaymentReturnExperience({ token, view }: { token: string | null; view: ActivationView }) {
  const [savedNextAction, setSavedNextAction] = useState<string | null>(null);

  if (view.state === "unknown_reference") {
    return (
      <Frame badge="Server verification">
        <p className="text-[12px] font-black uppercase tracking-[.28em] text-[#efaaa1]">Return received</p>
        <h1 className="mt-5 max-w-3xl text-5xl font-light leading-[.96] tracking-[-.065em] sm:text-6xl">
          We&rsquo;re confirming this with the payment provider.
        </h1>
        <p className="mt-7 max-w-2xl text-sm leading-7 text-white/55">
          You do not need to submit anything again. This browser return &mdash; whether checkout completed or was
          canceled &mdash; never marks an engagement paid.
        </p>
        <VerificationNote />
      </Frame>
    );
  }

  if (savedNextAction !== null) {
    return (
      <Frame badge={view.paymentVerified ? "Payment verified" : "Server verification"}>
        <div className="flex size-12 items-center justify-center rounded-full border border-[#efaaa1]/25 bg-[#efaaa1]/[.08]">
          <CircleCheck className="size-6 text-[#efaaa1]" aria-hidden="true" />
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-light leading-[1.02] tracking-[-.055em] sm:text-5xl">
          Thank you. We have what we need to start.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-white/55">{savedNextAction}</p>
        <p className="mt-4 max-w-2xl text-[13px] leading-6 text-white/40">
          Nothing else is needed from you right now. If anything is missing we will ask when we walk through it
          together.
        </p>
        <VerificationNote />
      </Frame>
    );
  }

  const verified = view.paymentVerified;

  return (
    <Frame badge={verified ? "Payment verified" : "Server verification"}>
      <div className="flex size-12 items-center justify-center rounded-full border border-[#efaaa1]/25 bg-[#efaaa1]/[.08]">
        {verified
          ? <CircleCheck className="size-6 text-[#efaaa1]" aria-hidden="true" />
          : <Clock3 className="size-6 text-[#efaaa1]" aria-hidden="true" />}
      </div>

      <p className="mt-6 text-[12px] font-black uppercase tracking-[.28em] text-[#efaaa1]">
        {verified ? "Payment verified" : "Return received"}
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-light leading-[1.02] tracking-[-.055em] sm:text-5xl">
        {verified
          ? "Your Clinic Operating Analysis is reserved."
          : "We’re confirming this with the payment provider."}
      </h1>
      {/* Do not invite details from someone who has already given them — the copy and
          the panel below it would contradict each other on the same screen. */}
      <p className="mt-6 max-w-2xl text-sm leading-7 text-white/55">
        {view.qualificationComplete
          ? verified
            ? `${view.clinicName} is booked in and we have what we need. We will be in touch to walk through the analysis with you.`
            : "You do not need to submit anything again, and this browser return never marks an engagement paid. We already have your clinic details."
          : verified
            ? `${view.clinicName} is booked in. While we prepare, a few details make the analysis sharper — or skip them and we will cover it on the call.`
            : "You do not need to submit anything again, and this browser return never marks an engagement paid. In the meantime, anything you tell us below goes straight into preparing the analysis."}
      </p>

      {view.qualificationComplete ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.02] p-6 text-[13px] leading-6 text-white/50">
          We already have your clinic details. Nothing further is needed from you right now.
        </div>
      ) : token ? (
        <AnalysisActivationForm onDone={(nextAction) => setSavedNextAction(nextAction)} token={token} />
      ) : null}

      <VerificationNote />
    </Frame>
  );
}
