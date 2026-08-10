"use client";

import { useState } from "react";
import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PricingProductView = {
  key: string;
  name: string;
  amountCents: number;
  currency: string;
  roleTarget: string;
  summary: string;
  includes: string[];
  doesNotInclude: string[];
  requiresHumanReview: boolean;
  purchasable: boolean;
};

function formatPrice(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountCents / 100);
}

export function PricingCatalog({ products }: { products: PricingProductView[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function startPurchase(productKey: string) {
    if (!email.trim()) {
      setError("Enter the email you want the purchase recorded against.");
      return;
    }
    setError("");
    setPending(productKey);
    try {
      const response = await fetch("/api/commerce/payments/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productKey, buyerEmail: email.trim().toLowerCase(), acceptedTerms: true }),
      });
      const result = await response.json() as { error?: string; checkoutUrl?: string };
      if (!response.ok || !result.checkoutUrl) {
        setError(result.error ?? "We could not start checkout. Please try again.");
        return;
      }
      window.location.assign(result.checkoutUrl);
    } catch {
      setError("We could not reach the checkout service. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="max-w-md">
        <label className="text-xs font-bold text-slate-700">
          Your email
          <Input
            autoComplete="email"
            className="mt-2 h-12"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@clinic.com"
            type="email"
            value={email}
          />
        </label>
        <p className="mt-2 text-[10px] leading-4 text-slate-500">Your purchase and review decision are recorded against this address.</p>
      </div>

      {error && (
        <div className="mt-5 flex max-w-md gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {products.map((product) => (
          <article className="flex flex-col border border-slate-200 bg-white p-6 sm:p-7" key={product.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-xl font-extrabold tracking-[-.035em]">{product.name}</h2>
              <p className="text-2xl font-extrabold tracking-[-.04em]">{formatPrice(product.amountCents, product.currency)}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{product.summary}</p>

            <ul className="mt-5 grid gap-1.5">
              {product.includes.map((item) => (
                <li className="text-xs leading-5 text-slate-600" key={item}>· {item}</li>
              ))}
            </ul>

            <button
              className="mt-5 self-start text-[11px] font-bold text-slate-700 underline"
              onClick={() => setOpenKey(openKey === product.key ? null : product.key)}
              type="button"
            >
              {openKey === product.key ? "Hide what this does not include" : "What this does not include"}
            </button>
            {openKey === product.key && (
              <ul className="mt-3 grid gap-1.5 border-l-2 border-amber-300 pl-4">
                {product.doesNotInclude.map((item) => (
                  <li className="text-xs leading-5 text-slate-600" key={item}>{item}</li>
                ))}
              </ul>
            )}

            {product.requiresHumanReview && (
              <p className="mt-5 border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-600">
                Payment opens a review. A human decision is still required before portal access.
              </p>
            )}

            <div className="mt-auto pt-6">
              {product.purchasable ? (
                <Button className="w-full" disabled={pending !== null} onClick={() => startPurchase(product.key)} size="lg" type="button" variant="primary">
                  {pending === product.key ? <><LoaderCircle className="size-4 animate-spin" /> Starting checkout...</> : <>Continue to checkout <ArrowRight className="size-4" /></>}
                </Button>
              ) : (
                <p className="border border-amber-300 bg-amber-50 px-3 py-3 text-center text-[11px] font-extrabold uppercase tracking-[.12em] text-amber-800">
                  Pending Connection
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
