"use client";

import { useMemo, useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AccessPaymentRow = {
  id: string;
  provider: string;
  productKey: string;
  roleTarget: string;
  buyerEmail: string;
  amountCents: number;
  currency: string;
  status: string;
  portalAccessStatus: string;
  externalPaymentReference: string | null;
  /**
   * References the buyer submitted through the public form. Claims, not facts — the
   * form knows the buyer only by the email they typed, so a person confirms one against
   * the payment provider before it becomes the payment's reference.
   */
  referenceClaims?: { reference: string; at: string }[];
  verifiedAt: string | null;
  createdAt: string;
  onboarding: { id: string; status: string; reviewApproved: boolean } | null;
};

const actions = [
  { key: "verify", label: "Mark paid" },
  { key: "hold", label: "Hold" },
  { key: "fail", label: "Fail" },
  { key: "refund", label: "Refund" },
  { key: "reconcile", label: "Reconcile" },
] as const;

const statusTone: Record<string, string> = {
  created: "bg-slate-100 text-slate-700",
  pending_verification: "bg-amber-100 text-amber-900",
  verified_paid: "bg-teal-100 text-teal-900",
  reconciled: "bg-teal-100 text-teal-900",
  failed: "bg-rose-100 text-rose-900",
  refunded: "bg-rose-100 text-rose-900",
  disputed: "bg-rose-100 text-rose-900",
  held: "bg-amber-100 text-amber-900",
};

/**
 * Whether this row is waiting on the onboarding decision.
 *
 * Settled, has an onboarding record, and nobody has approved it yet. Products that
 * need no review never produce one, so they never show these controls.
 */
function awaitingReview(row: AccessPaymentRow) {
  return ["verified_paid", "reconciled"].includes(row.status) && Boolean(row.onboarding) && !row.onboarding!.reviewApproved;
}

function money(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

export function AccessPaymentsWorkspace({ initialRows }: { initialRows: AccessPaymentRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      row.buyerEmail.includes(term) || row.productKey.includes(term) || row.status.includes(term) || row.roleTarget.includes(term));
  }, [rows, filter]);

  /**
   * Record a decision.
   *
   * `kind: "payment"` settles, holds, fails, refunds or reconciles the payment.
   * `kind: "review"` is the onboarding decision — the one that actually opens the
   * portal for a product requiring human review, and the one this workspace had no
   * control for. The API has accepted it since the review path shipped; without a
   * button, every Founding Clinic purchase sat at `pending` forever unless somebody
   * hand-built the request.
   */
  async function record(paymentId: string, action: string, kind: "payment" | "review" = "payment") {
    if (note.trim().length < 8) {
      setError("A note of at least 8 characters is required for every decision.");
      return;
    }
    setError("");
    setPendingAction(`${paymentId}:${action}`);
    try {
      const response = await fetch("/api/commerce/payments/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          kind === "review"
            ? { paymentId, reviewDecision: action, note: note.trim() }
            : { paymentId, action, note: note.trim(), externalPaymentReference: reference.trim() || undefined },
        ),
      });
      const result = await response.json() as {
        error?: string;
        data?: AccessPaymentRow;
        reviewApproved?: boolean;
        provisioning?: { ok: boolean; reason?: string };
      };
      if (!response.ok || !result.data) {
        setError(result.error ?? "That decision could not be recorded.");
        return;
      }
      // The decision was recorded; the access it grants was not built. Saying nothing
      // here would leave the operator believing a buyer can sign in when they cannot.
      if (result.provisioning && !result.provisioning.ok) {
        setError(
          `Decision recorded, but the buyer's access was not provisioned (${result.provisioning.reason ?? "unknown"}). They cannot sign in yet.`,
        );
      }
      // The response carries the payment, not its onboarding record, so the review
      // outcome is folded in separately — otherwise an approved row keeps offering the
      // approve button it has already been given.
      setRows((current) =>
        current.map((row) =>
          row.id === paymentId
            ? {
                ...row,
                ...result.data,
                onboarding:
                  row.onboarding && result.reviewApproved !== undefined
                    ? { ...row.onboarding, reviewApproved: result.reviewApproved }
                    : row.onboarding,
              }
            : row,
        ),
      );
      setNote("");
      setReference("");
      setActiveId(null);
    } catch {
      setError("We could not reach the service. Try again.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="p-5 sm:p-8">
      <header>
        <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">Marketplace</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.045em]">Access payments</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          One-time review and onboarding fees. Verifying a payment records settlement only; where a product requires human review, the
          buyer&apos;s portal stays closed until that review is also approved.
        </p>
      </header>

      <div className="mt-6 max-w-sm">
        <Input onChange={(event) => setFilter(event.target.value)} placeholder="Filter by email, product, status, role" value={filter} />
      </div>

      {error && (
        <div className="mt-5 flex max-w-2xl gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 overflow-x-auto border border-slate-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-500">
            <tr>
              {["Buyer", "Product", "Amount", "Status", "Portal access", "Reference", "Actions"].map((heading) => (
                <th className="px-4 py-3 font-extrabold" key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr className="border-t border-slate-200 align-top" key={row.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-950">{row.buyerEmail}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{row.roleTarget.replace(/_/g, " ")}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{row.productKey.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 font-semibold text-slate-950">{money(row.amountCents, row.currency)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] ${statusTone[row.status] ?? "bg-slate-100 text-slate-700"}`}>
                    {row.status.replace(/_/g, " ")}
                  </span>
                  {row.onboarding && !row.onboarding.reviewApproved && (
                    <p className="mt-2 text-[10px] leading-4 text-amber-800">Awaiting human review</p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {row.portalAccessStatus}
                  {awaitingReview(row) ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">Needs review</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-500">{row.externalPaymentReference ?? "—"}</td>
                <td className="px-4 py-3">
                  {activeId === row.id ? (
                    <div className="grid w-64 gap-2">
                      <Input onChange={(event) => setNote(event.target.value)} placeholder="Decision note (required)" value={note} />
                      <Input onChange={(event) => setReference(event.target.value)} placeholder="Provider reference" value={reference} />
                      {(row.referenceClaims?.length ?? 0) > 0 ? (
                        <div className="grid gap-1">
                          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">
                            Submitted by the buyer — confirm before use
                          </p>
                          {row.referenceClaims!.map((claim) => (
                            <button
                              className="truncate rounded border border-slate-200 px-2 py-1 text-left text-[11px] font-mono text-slate-700 hover:bg-slate-50"
                              key={`${claim.reference}-${claim.at}`}
                              onClick={() => setReference(claim.reference)}
                              type="button"
                            >
                              {claim.reference}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {awaitingReview(row) ? (
                        <div className="grid gap-1.5 rounded border border-amber-200 bg-amber-50 p-2">
                          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-amber-900">
                            Awaiting your review — access opens on approval
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              disabled={pendingAction !== null}
                              onClick={() => record(row.id, "approve", "review")}
                              size="sm"
                              type="button"
                            >
                              {pendingAction === `${row.id}:approve` ? <LoaderCircle className="size-3 animate-spin" /> : "Approve onboarding"}
                            </Button>
                            <Button
                              disabled={pendingAction !== null}
                              onClick={() => record(row.id, "reject", "review")}
                              size="sm"
                              type="button"
                              variant="secondary"
                            >
                              {pendingAction === `${row.id}:reject` ? <LoaderCircle className="size-3 animate-spin" /> : "Reject"}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-1.5">
                        {actions.map((action) => (
                          <Button
                            disabled={pendingAction !== null}
                            key={action.key}
                            onClick={() => record(row.id, action.key)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            {pendingAction === `${row.id}:${action.key}` ? <LoaderCircle className="size-3 animate-spin" /> : action.label}
                          </Button>
                        ))}
                      </div>
                      <button className="text-left text-[11px] font-bold text-slate-500 underline" onClick={() => setActiveId(null)} type="button">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button onClick={() => { setActiveId(row.id); setNote(""); setReference(row.externalPaymentReference ?? ""); }} size="sm" type="button" variant="secondary">
                      Record decision
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr><td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={7}>No access payments match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-[11px] leading-5 text-slate-500">
        Every decision writes an audit receipt with the acting user, the transition, and the note. Payments cannot be recorded as settled
        without a provider reference.
      </p>
    </section>
  );
}
