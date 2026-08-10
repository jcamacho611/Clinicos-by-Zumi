import Link from "next/link";
import { BrandMark } from "@/components/clinic/brand-mark";
import { PaymentReferenceForm } from "@/components/commerce/payment-reference-form";
import { Button } from "@/components/ui/button";

/**
 * Standalone manual payment-reference submission, for buyers who left the
 * post-checkout page before their payment was confirmed.
 */

export const dynamic = "force-dynamic";

export const metadata = { title: "Submit a payment reference" };

export default function PaymentVerifyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-sm font-extrabold">Klinikos</p>
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7a1f]">Payment reference</p>
          </div>
        </div>

        <h1 className="mt-10 text-4xl font-extrabold tracking-[-.055em]">Submit your payment reference.</h1>
        <p className="mt-5 text-sm leading-7 text-slate-600">
          Use this if you paid but your access has not opened. A reviewer matches your reference against the provider record before
          anything is recorded as paid.
        </p>

        <div className="mt-8">
          <PaymentReferenceForm />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary"><Link href="/pricing">Back to pricing</Link></Button>
        </div>
      </div>
    </main>
  );
}
