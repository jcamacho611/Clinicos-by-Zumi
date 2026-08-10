import Link from "next/link";
import { Clock } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { PaymentReferenceForm } from "@/components/commerce/payment-reference-form";
import { Button } from "@/components/ui/button";

/**
 * Post-checkout landing page.
 *
 * Deliberately does not claim the payment succeeded. The browser arriving here
 * proves only that the provider redirected; settlement is confirmed by webhook or
 * by a human reviewer.
 */

export const dynamic = "force-dynamic";

export const metadata = { title: "Payment received — next steps" };

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-sm font-extrabold">Klinikos</p>
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7a1f]">Checkout complete</p>
          </div>
        </div>

        <Clock className="mt-10 size-9 text-amber-600" />
        <h1 className="mt-5 text-4xl font-extrabold tracking-[-.055em]">Thanks — your purchase is being confirmed.</h1>
        <p className="mt-5 text-sm leading-7 text-slate-600">
          Returning to this page means the provider sent you back, not that the payment has settled. Klinikos confirms settlement against
          the payment provider before recording anything, so your access state may not change for a few minutes.
        </p>

        <ol className="mt-8 grid gap-3 border-y border-slate-200 py-6">
          {[
            "The payment provider confirms your transaction to Klinikos.",
            "Where a product requires it, a reviewer checks your credentials, listing, or clinic details.",
            "Your portal opens only after both steps complete.",
          ].map((step, index) => (
            <li className="flex gap-3 text-sm leading-6 text-slate-600" key={step}>
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center bg-slate-950 text-[10px] font-extrabold text-white">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-lg font-extrabold tracking-[-.03em]">Not confirmed after a few minutes?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Submit your payment reference and a reviewer will match it manually.
        </p>
        <div className="mt-5">
          <PaymentReferenceForm />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary"><Link href="/pricing">Back to pricing</Link></Button>
          <Button asChild variant="secondary"><Link href="/login">Sign in</Link></Button>
        </div>
      </div>
    </main>
  );
}
