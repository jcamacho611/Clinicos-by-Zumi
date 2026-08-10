import Link from "next/link";
import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Button } from "@/components/ui/button";
import { getAccessTier } from "@/lib/commerce/whop-catalog";
import { completeCheckoutReturn } from "@/lib/commerce/whop-entitlements";
import { checkoutReturnSchema } from "@/lib/commerce/whop-rules";

/**
 * Checkout return leg.
 *
 * Everything shown here is derived from a server-side lookup keyed by the opaque
 * state value. The browser cannot assert which tier it bought or that a payment
 * succeeded. When the return cannot be confirmed, the webhook remains the
 * authoritative path and the page says so rather than implying access was granted.
 */

export const dynamic = "force-dynamic";

const failureCopy: Record<string, { title: string; body: string; tone: "warn" | "error" }> = {
  unknown_state: { title: "We could not match this checkout.", body: "The return link did not correspond to a checkout we issued. If your payment completed, access is still applied automatically once Whop confirms it.", tone: "error" },
  expired: { title: "This checkout session expired.", body: "Start a new checkout. If a payment already completed, access is applied automatically once Whop confirms it.", tone: "warn" },
  not_configured: { title: "Purchase confirmation is Pending Connection.", body: "Whop credentials are not configured in this deployment, so the purchase cannot be confirmed here.", tone: "warn" },
  unverified: { title: "We could not confirm this purchase yet.", body: "Whop did not confirm an active membership for this checkout. If payment succeeded, the webhook applies access shortly.", tone: "warn" },
  tier_mismatch: { title: "This purchase does not match the requested pass.", body: "The confirmed membership is for a different plan than the one this checkout started. No access was changed.", tone: "error" },
  membership_required: { title: "Waiting on Whop confirmation.", body: "The return did not include a membership reference. Access is applied automatically once the Whop webhook confirms the purchase.", tone: "warn" },
};

export default async function EntryReturnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const parsed = checkoutReturnSchema.safeParse({
    state: first(params.state) ?? "",
    membershipId: first(params.membership_id) ?? first(params.membershipId) ?? undefined,
  });

  let outcome:
    | { ok: true; tierKey: string; state: string; alreadyCompleted: boolean }
    | { ok: false; reason: string };

  if (!parsed.success) {
    outcome = { ok: false, reason: "unknown_state" };
  } else if (!process.env.DATABASE_URL) {
    outcome = { ok: false, reason: "not_configured" };
  } else {
    try {
      const result = await completeCheckoutReturn(parsed.data);
      outcome = result.ok
        ? { ok: true, tierKey: result.tierKey, state: result.state, alreadyCompleted: result.alreadyCompleted }
        : { ok: false, reason: result.reason };
    } catch {
      outcome = { ok: false, reason: "unverified" };
    }
  }

  const tier = outcome.ok ? getAccessTier(outcome.tierKey) : undefined;
  const grantActive = outcome.ok && outcome.state === "active";
  const failure = outcome.ok ? null : (failureCopy[outcome.reason] ?? failureCopy.unverified);

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-14 sm:px-8">
        <section className="w-full border-y border-slate-200 bg-white py-14 sm:px-10">
          <div className="mx-auto max-w-xl px-5 sm:px-0">
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <p className="text-sm font-extrabold">Klinikos</p>
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7a1f]">Purchase confirmation</p>
              </div>
            </div>

            {outcome.ok ? (
              <>
                {grantActive ? <CircleCheck className="mt-10 size-9 text-teal-700" /> : <Clock className="mt-10 size-9 text-amber-600" />}
                <h1 className="mt-5 text-4xl font-extrabold tracking-[-.055em]">
                  {grantActive ? `${tier?.name ?? "Access"} is active.` : "Purchase recorded, access not active yet."}
                </h1>
                <p className="mt-5 text-sm leading-7 text-slate-600">
                  {grantActive
                    ? `Klinikos confirmed this membership with Whop and recorded your access grant${outcome.alreadyCompleted ? " (already applied earlier)" : ""}.`
                    : `Whop reports this membership as ${outcome.state.replace(/_/g, " ")}. Access unlocks automatically once Whop reports it active.`}
                </p>
                {tier && (
                  <p className="mt-5 border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] leading-5 text-slate-600">
                    <strong className="font-bold text-slate-800">Still required:</strong> {tier.postPurchaseReview}
                  </p>
                )}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="primary"><Link href="/login">Sign in to Klinikos</Link></Button>
                  <Button asChild variant="secondary"><Link href="/entry">Back to access passes</Link></Button>
                </div>
              </>
            ) : (
              <>
                <CircleAlert className={`mt-10 size-9 ${failure?.tone === "error" ? "text-rose-600" : "text-amber-600"}`} />
                <h1 className="mt-5 text-4xl font-extrabold tracking-[-.055em]">{failure?.title}</h1>
                <p className="mt-5 text-sm leading-7 text-slate-600">{failure?.body}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="primary"><Link href="/entry">Back to access passes</Link></Button>
                  <Button asChild variant="secondary"><Link href="/">Return to public site</Link></Button>
                </div>
              </>
            )}

            <p className="mt-8 border-t border-slate-200 pt-6 text-[10px] leading-5 text-slate-500">
              Billing, refunds, and cancellation are handled by Whop. Klinikos records the resulting access grant and revokes it when Whop
              reports the membership is no longer valid.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
