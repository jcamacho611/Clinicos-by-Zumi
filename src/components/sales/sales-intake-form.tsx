"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  CircleCheckBig,
  LoaderCircle,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { StatusPill } from "@/components/sales/status-pill";
import {
  buildSyntheticDemoScenario,
  type SalesPainPoint,
} from "@/lib/sales-demo-rules";
import type { PaidAnalysisHandoff } from "@/lib/sales/intake-handoff";

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[.045] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#e6817b]/50 focus:bg-white/[.07] focus:ring-4 focus:ring-[#e6817b]/[.06]";
const labelClass = "mb-2 block text-[12px] font-black uppercase tracking-[.14em] text-slate-500";

export type PublicAnalysisOffer = {
  name: string;
  priceLabel: string;
  creditForward: string;
};

type CheckoutIdentity = {
  clinicName: string;
  contactName: string;
  contactEmail: string;
  acknowledgesSyntheticData: boolean;
  website: string;
};

type SubmissionState = {
  reservationId: string;
  scenarioTitle: string;
  checkoutNotice: string;
};

function initialIdentity(): CheckoutIdentity {
  return {
    clinicName: "",
    contactName: "",
    contactEmail: "",
    acknowledgesSyntheticData: false,
    website: "",
  };
}

export function SalesIntakeForm({
  analysisOffer,
  initialContext,
}: {
  analysisOffer: PublicAnalysisOffer;
  initialContext?: PaidAnalysisHandoff;
}) {
  const [form, setForm] = useState<CheckoutIdentity>(initialIdentity);
  const [submission, setSubmission] = useState<SubmissionState | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const clinicType = initialContext?.clinicType ?? "Other independent clinic";
  const painPoints = useMemo<SalesPainPoint[]>(
    () =>
      initialContext?.painPoints.length
        ? [...initialContext.painPoints]
        : ["follow_ups"],
    [initialContext],
  );
  const biggestPainPoint = initialContext?.biggestPainPoint ?? painPoints[0] ?? "follow_ups";
  const scenario = useMemo(
    () => buildSyntheticDemoScenario({ clinicType, biggestPainPoint, painPoints }),
    [biggestPainPoint, clinicType, painPoints],
  );

  function setField<K extends keyof CheckoutIdentity>(key: K, value: CheckoutIdentity[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/sales/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clinicName: form.clinicName,
            contactName: form.contactName,
            contactEmail: form.contactEmail,
            clinicType,
            biggestPainPoint,
            painPoints,
            acknowledgesSyntheticData: form.acknowledgesSyntheticData,
            website: form.website,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "The request could not be saved.");

        const checkoutUrl = payload.data.checkout?.checkoutUrl ?? null;
        if (checkoutUrl) {
          const target = new URL(checkoutUrl, window.location.origin);
          if (target.protocol !== "https:" && target.origin !== window.location.origin) {
            throw new Error("The secure checkout URL could not be verified.");
          }
          window.location.assign(target.toString());
          return;
        }

        setSubmission({
          reservationId: payload.data.reservation.id,
          scenarioTitle: payload.data.scenario.title,
          checkoutNotice:
            payload.data.checkoutNotice ??
            "Your analysis is saved. We can continue from this reservation without making you start over.",
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The request could not be saved.");
      }
    });
  }

  if (submission) {
    return (
      <section
        aria-live="polite"
        className="relative overflow-hidden rounded-[32px] border border-[#e6817b]/20 bg-[linear-gradient(145deg,rgba(230,129,123,.1),rgba(255,255,255,.035))] p-7 shadow-[0_40px_120px_rgba(0,0,0,.4)] sm:p-10"
      >
        <div className="absolute right-0 top-0 size-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#e6817b]/10 blur-3xl" />
        <CircleCheckBig className="size-12 text-[#efaaa1]" strokeWidth={1.5} />
        <p className="mt-7 text-[12px] font-black uppercase tracking-[.2em] text-[#efaaa1]">Saved</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">
          Your {analysisOffer.name} is reserved.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{submission.checkoutNotice}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">Reservation</p>
            <p className="mt-2 break-all text-xs font-bold text-white">{submission.reservationId}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">Prepared analysis</p>
            <p className="mt-2 text-xs font-bold text-white">{submission.scenarioTitle}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-5 text-[12px] leading-6 text-amber-100/75">
          The reservation is safe. Klinikos will not invent a different amount or mark this purchase paid without verified payment evidence.
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-full border border-white/15 px-5 py-3 text-xs font-black text-white" href="/pricing">
            Review pricing
          </Link>
          <Link className="rounded-full border border-white/15 px-5 py-3 text-xs font-black text-white" href="/">
            Return home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]" onSubmit={submit}>
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0e14]/90 shadow-[0_40px_120px_rgba(0,0,0,.42)]">
        <div className="border-b border-white/[.08] px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[.2em] text-[#efaaa1]">One step to checkout</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Tell us who the analysis is for. That’s it.</h2>
            </div>
            <StatusPill status="Live" />
          </div>
        </div>

        <div className="space-y-7 p-6 sm:p-8">
          {initialContext?.summaryLabels.length ? (
            <section className="rounded-2xl border border-[#e6817b]/18 bg-[#e6817b]/[.055] p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" />
                <div>
                  <p className="text-xs font-black text-[#ffe2de]">Your Zumi operating map is already attached</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-400">
                    We carried forward only the safe clinic-type and workflow categories you already chose. No need to answer them twice.
                  </p>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {initialContext.summaryLabels.map((label) => (
                  <li className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[12px] font-bold text-slate-300" key={label}>
                    {label}
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" />
                <p className="text-[12px] leading-5 text-slate-400">
                  You can purchase the analysis now. Detailed clinic sizing, vendor stack, and workflow discovery happen after payment instead of blocking checkout.
                </p>
              </div>
            </section>
          )}

          <section>
            <p className="mb-4 text-[12px] font-black uppercase tracking-[.18em] text-slate-500">Who is this for?</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass}>Clinic name</span>
                <input
                  autoComplete="organization"
                  className={inputClass}
                  required
                  value={form.clinicName}
                  onChange={(event) => setField("clinicName", event.target.value)}
                  placeholder="Northstar Family Practice"
                />
              </label>
              <label>
                <span className={labelClass}>Your name</span>
                <input
                  autoComplete="name"
                  className={inputClass}
                  required
                  value={form.contactName}
                  onChange={(event) => setField("contactName", event.target.value)}
                  placeholder="Jordan Rivera"
                />
              </label>
              <label>
                <span className={labelClass}>Email</span>
                <input
                  autoComplete="email"
                  className={inputClass}
                  required
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => setField("contactEmail", event.target.value)}
                  placeholder="you@clinic.com"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e6817b]/28 bg-[#e6817b]/[.07] p-5">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-sm font-black text-white">{analysisOffer.name}</p>
                <p className="mt-2 max-w-xl text-[12px] leading-5 text-slate-400">
                  Clinic-specific operating review, synthetic workflow analysis, and a human-reviewed recommendation.
                </p>
              </div>
              <p className="text-3xl font-black tracking-[-.04em] text-[#d6b787]">{analysisOffer.priceLabel}</p>
            </div>
            <p className="mt-4 border-t border-white/10 pt-4 text-[12px] leading-5 text-slate-500">{analysisOffer.creditForward}</p>
          </section>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.055] p-4">
            <input
              className="mt-0.5 size-4 accent-amber-300"
              checked={form.acknowledgesSyntheticData}
              required
              type="checkbox"
              onChange={(event) => setField("acknowledgesSyntheticData", event.target.checked)}
            />
            <span>
              <span className="block text-xs font-black text-amber-100">Keep patient information out of this purchase flow.</span>
              <span className="mt-1 block text-[11px] leading-5 text-amber-100/60">
                Analysis preparation uses synthetic examples only. We’ll gather the business and workflow details we actually need after purchase.
              </span>
            </span>
          </label>

          <input
            aria-hidden="true"
            autoComplete="off"
            className="hidden"
            tabIndex={-1}
            value={form.website}
            onChange={(event) => setField("website", event.target.value)}
          />

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[.07] p-4 text-xs leading-5 text-rose-100" role="alert">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-[#efaaa1] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || !form.acknowledgesSyntheticData}
            type="submit"
          >
            {pending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" /> Preparing secure checkout
              </>
            ) : (
              <>
                Continue to secure payment · {analysisOffer.priceLabel}
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </>
            )}
          </button>

          <div className="flex items-start gap-3 text-[11px] leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" />
            <p>
              Klinikos saves the reservation first, locks the server-owned price, and then opens the configured payment provider. Returning from checkout never counts as payment by itself.
            </p>
          </div>
        </div>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(15,23,42,.94),rgba(6,10,15,.98))] shadow-[0_40px_120px_rgba(0,0,0,.45)]">
          <div className="border-b border-white/[.08] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-2xl border border-[#e6817b]/15 bg-[#e6817b]/[.06] text-[#efaaa1]">
                <Radar className="size-5" />
              </span>
              <StatusPill status="Demo" />
            </div>
            <p className="mt-7 text-[12px] font-black uppercase tracking-[.2em] text-[#efaaa1]">
              {initialContext ? "Your operating signal" : "What happens next"}
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-[-.055em]">{scenario.title}</h3>
            <p className="mt-4 text-sm leading-6 text-slate-400">{scenario.summary}</p>
          </div>

          <div className="space-y-3 p-6 sm:p-8">
            <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4">
              <p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-600">1 / Purchase</p>
              <p className="mt-2 text-xs font-bold text-slate-200">Secure the Clinic Operating Analysis.</p>
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4">
              <p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-600">2 / Discovery</p>
              <p className="mt-2 text-xs font-bold text-slate-200">Then we collect clinic size, systems, workflow details, and priorities.</p>
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4">
              <p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-600">3 / Analysis</p>
              <p className="mt-2 text-xs font-bold text-slate-200">You receive a human-reviewed operating recommendation and next-step path.</p>
            </div>
          </div>

          <div className="border-t border-white/[.08] bg-[#e6817b]/[.035] p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-200" />
              <p className="text-[12px] leading-5 text-slate-500">
                No diagnosis, treatment, coverage decision, claim submission, record release, or live patient-data processing occurs in this purchase flow.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
