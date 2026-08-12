"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck } from "lucide-react";

type CheckoutState = {
  provider: string;
  productKey: string;
  productLabel: string;
  status: "created" | "completed" | "expired" | "abandoned";
  completedAt: string | null;
  expiresAt: string;
  processorVerificationAvailable: boolean;
};

export function CommercialReturnClient({ state }: { state: string }) {
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function check() {
      attempts += 1;
      try {
        const response = await fetch(`/api/commercial/checkout/status?state=${encodeURIComponent(state)}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as { data?: CheckoutState; error?: string } | null;
        if (cancelled) return;
        if (!response.ok || !payload?.data) {
          setError(payload?.error ?? "We could not verify this checkout yet.");
          setChecking(false);
          return;
        }

        setCheckout(payload.data);
        setError(null);
        if (payload.data.status === "completed" || payload.data.status === "expired" || payload.data.status === "abandoned") {
          setChecking(false);
          return;
        }

        if (payload.data.provider === "godaddy") {
          setChecking(false);
          return;
        }

        if (attempts < 30) timer = setTimeout(check, 2_000);
        else setChecking(false);
      } catch {
        if (!cancelled) {
          setError("We could not verify this checkout yet.");
          setChecking(false);
        }
      }
    }

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [state]);

  const completed = checkout?.status === "completed";
  const manual = checkout?.provider === "godaddy" && checkout.status === "created";

  return (
    <main className="min-h-screen bg-[#05090f] px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[#070d15] p-7 shadow-2xl sm:p-10">
        <div className={`grid size-12 place-items-center rounded-full border ${completed ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-cyan-300/25 bg-cyan-300/10 text-cyan-200"}`}>
          {completed ? <CheckCircle2 className="size-6" /> : checking ? <RefreshCw className="size-6 animate-spin" /> : <Clock3 className="size-6" />}
        </div>

        <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#e6c55b]">Klinikos checkout</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">
          {completed ? "Payment confirmed. Klinikos access is updated." : manual ? "Payment received by the checkout provider. Klinikos is waiting for reconciliation." : "Klinikos is verifying your payment."}
        </h1>

        <p className="mt-5 text-sm leading-7 text-slate-300">
          {completed
            ? `${checkout?.productLabel ?? "Your Klinikos access"} is now recorded against your organization. Product, clinical, privacy, credential, Grid eligibility, and connector gates still apply independently.`
            : manual
              ? "The current GoDaddy rail does not provide Klinikos a signed server callback, so a browser return is not treated as proof of payment. Access changes only after the payment is reconciled on the server."
              : "Do not pay again while this screen is checking. Klinikos updates access only after a verified server event is linked to your organization."}
        </p>

        {error ? <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">{error}</p> : null}

        <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.035] p-4 text-xs leading-6 text-slate-400">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-300" />
          Payment never overrides identity, tenant isolation, permissions, clinical boundaries, credentialing, or deterministic Grid eligibility.
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-extrabold text-slate-950" href="/clinic">Open Klinikos</Link>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-extrabold text-white" href="/grid">Open Grid</Link>
        </div>
      </div>
    </main>
  );
}
