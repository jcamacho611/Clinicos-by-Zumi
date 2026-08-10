"use client";

import { useState } from "react";
import { ArrowRight, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Manual payment-reference submission.
 *
 * Submitting here does not confirm a payment. It queues the reference for a human
 * reviewer, and the copy says so.
 */
export function PaymentReferenceForm() {
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/commerce/payments/reference", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ buyerEmail: email.trim().toLowerCase(), externalPaymentReference: reference.trim() }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "We could not record that reference.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("We could not reach the service. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-teal-200 bg-teal-50 p-6">
        <CircleCheck className="size-7 text-teal-700" />
        <p className="mt-4 text-sm font-bold text-slate-950">Reference recorded.</p>
        <p className="mt-2 text-xs leading-6 text-slate-600">
          A reviewer will confirm your payment against the provider record. Your portal opens only after that confirmation and any
          required credential or listing review.
        </p>
      </div>
    );
  }

  return (
    <form className="border border-slate-200 bg-white p-6 sm:p-7" onSubmit={submit}>
      <label className="block text-xs font-bold text-slate-700">
        Email used at checkout
        <Input autoComplete="email" className="mt-2 h-12" onChange={(event) => setEmail(event.target.value)} placeholder="you@clinic.com" required type="email" value={email} />
      </label>
      <label className="mt-5 block text-xs font-bold text-slate-700">
        Payment reference or receipt id
        <Input className="mt-2 h-12" onChange={(event) => setReference(event.target.value)} placeholder="e.g. inv_1a2b3c" required value={reference} />
      </label>

      {error && (
        <div className="mt-4 flex gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button className="mt-5 w-full" disabled={submitting || !email.trim() || !reference.trim()} size="lg" type="submit" variant="primary">
        {submitting ? <><LoaderCircle className="size-4 animate-spin" /> Recording...</> : <>Submit for review <ArrowRight className="size-4" /></>}
      </Button>

      <p className="mt-5 border-t border-slate-200 pt-4 text-[10px] leading-5 text-slate-500">
        Submitting a reference does not confirm payment or grant access. A reviewer checks it against the provider record first.
      </p>
    </form>
  );
}
