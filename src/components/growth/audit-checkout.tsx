"use client";

import { useState } from "react";
import { commandSurfaces } from "@/lib/design/command-system";
import { AUDIT_PAYMENT_NOTICE } from "@/lib/growth/audit-checkout";
import { LeadCaptureForm } from "@/components/growth/lead-capture-form";
import { recordIntent } from "@/components/growth/intent-beacon";

/**
 * Purchase panel for the Operational Audit.
 *
 * Two deliberate properties:
 *
 *   - Details are captured *before* the payment page opens. Otherwise a clinic that
 *     pays and never returns is an unattributable payment and nobody to contact.
 *   - Clicking through records intent and nothing else. A browser redirect is never
 *     treated as payment, so nothing here grants access or marks anything as paid.
 */
export function AuditCheckout({ checkoutUrl }: { checkoutUrl: string }) {
  const [stage, setStage] = useState<"details" | "pay">("details");

  if (stage === "details") {
    return (
      <div>
        <p className={commandSurfaces.eyebrow}>Step 1 of 2 · Your clinic</p>
        <p className="mt-3 text-[13px] leading-6 text-slate-400">
          So we know whose audit this is and can reach you once payment is confirmed.
        </p>
        <div className="mt-5">
          <LeadCaptureForm interest="operational_audit" submitLabel="Continue to payment" />
        </div>
        <button
          className="mt-4 text-[12px] font-semibold text-slate-400 underline underline-offset-4 hover:text-slate-200"
          onClick={() => setStage("pay")}
          type="button"
        >
          I have already sent my details
        </button>
      </div>
    );
  }

  return (
    <div className={`${commandSurfaces.panelRaised} p-6`}>
      <p className={commandSurfaces.eyebrow}>Step 2 of 2 · Payment</p>
      <h2 className={`${commandSurfaces.headline} mt-3 text-2xl`}>Purchase the Operational Audit</h2>
      <p className="mt-4 text-[13px] leading-7 text-slate-300">
        Payment is handled on the Klinikos hosted payment page. Choose the amount matching your clinic size
        from the table below.
      </p>

      <a
        className={`${commandSurfaces.interactive} mt-6 inline-flex w-full items-center justify-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`}
        href={checkoutUrl}
        onClick={() => recordIntent("audit_checkout_clicked", "operational_audit")}
        rel="noreferrer noopener"
        target="_blank"
      >
        Purchase Operational Audit
      </a>

      <p className="mt-5 text-[11px] leading-5 text-slate-500">{AUDIT_PAYMENT_NOTICE}</p>

      <button
        className="mt-4 text-[12px] font-semibold text-slate-400 underline underline-offset-4 hover:text-slate-200"
        onClick={() => setStage("details")}
        type="button"
      >
        Back to details
      </button>
    </div>
  );
}
