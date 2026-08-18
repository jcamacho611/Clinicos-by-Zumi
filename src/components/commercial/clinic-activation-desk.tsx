"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Copy, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge, Button, Card, DsSurface, Input, type BadgeTone } from "@/components/ds";

type CheckoutView = {
  id: string;
  state: string;
  provider: string;
  productKey: string;
  productLabel: string;
  clinicName: string;
  email: string;
  organizationId: string | null;
  status: string;
  expectedAmountCents: number | null;
  currency: string;
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
};

type RailProvider = "stripe" | "godaddy" | null;
type Plan = { key: string; label: string; priceLabel: string; checkoutConfigured: boolean; railProvider: RailProvider };
type RailSummary = { configuredPlanCount: number; totalPlanCount: number; nativeStripeReady: boolean };

function money(cents: number | null) {
  if (cents === null) return "Review required";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function checkoutTone(status: string): BadgeTone {
  if (["paid", "completed", "activated", "reconciled"].includes(status.toLowerCase())) return "resolved";
  if (status.toLowerCase() === "created") return "analyzing";
  return "neutral";
}

function railLabel(provider: RailProvider) {
  if (provider === "stripe") return "Stripe recurring";
  if (provider === "godaddy") return "GoDaddy manual";
  return "Not configured";
}

export function ClinicActivationDesk({
  initialCheckouts,
  plans,
  railSummary,
}: {
  initialCheckouts: CheckoutView[];
  plans: Plan[];
  railSummary: RailSummary;
}) {
  const firstConfiguredPlan = plans.find((plan) => plan.checkoutConfigured)?.key ?? "";
  const [checkouts, setCheckouts] = useState(initialCheckouts);
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [productKey, setProductKey] = useState(firstConfiguredPlan);
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [activationUrl, setActivationUrl] = useState("");
  const [confirmIntentId, setConfirmIntentId] = useState("");
  const [pending, startTransition] = useTransition();
  const selectedPlan = useMemo(() => plans.find((plan) => plan.key === productKey) ?? null, [plans, productKey]);
  const allRailsReady = railSummary.configuredPlanCount === railSummary.totalPlanCount;

  async function refresh() {
    const response = await fetch("/api/admin/commercial/clinic-checkouts", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not refresh clinic checkouts.");
    setCheckouts(payload.checkouts);
  }

  function createCheckout() {
    if (!selectedPlan?.checkoutConfigured) {
      setError("This recurring plan does not have an approved checkout rail configured.");
      return;
    }
    setError("");
    setActivationUrl("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/commercial/clinic-checkouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_checkout", clinicName, email, productKey }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Checkout could not be created.");
        setCheckoutUrl(payload.result.checkoutUrl);
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Checkout could not be created.");
      }
    });
  }

  function reconcile(intentId: string) {
    if (confirmIntentId !== intentId) {
      setConfirmIntentId(intentId);
      return;
    }
    setError("");
    setCheckoutUrl("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/commercial/clinic-checkouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reconcile", intentId, confirmation: "I_VERIFIED_PAYMENT" }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Payment could not be reconciled.");
        setActivationUrl(payload.result.activationUrl);
        setConfirmIntentId("");
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Payment could not be reconciled.");
      }
    });
  }

  function issueActivation(intentId: string) {
    setError("");
    setCheckoutUrl("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/commercial/clinic-checkouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "issue_activation", intentId }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Activation link could not be issued.");
        setActivationUrl(payload.result.activationUrl);
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Activation link could not be issued.");
      }
    });
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <DsSurface>
      <div className="space-y-8">
        <section
          className="relative overflow-hidden p-7 sm:p-9"
          style={{ background: "var(--obsidian)", color: "var(--text-primary)", borderRadius: "var(--radius-lg)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(circle at 82% 20%, color-mix(in oklch, var(--gold-500) 15%, transparent), transparent 28%), radial-gradient(circle at 16% 85%, color-mix(in oklch, var(--accent-signal) 16%, transparent), transparent 30%)" }}
          />
          <div className="relative max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="mapping">Commercial activation</Badge>
              <Badge tone={allRailsReady ? "resolved" : railSummary.configuredPlanCount ? "analyzing" : "signal"}>
                {railSummary.configuredPlanCount}/{railSummary.totalPlanCount} recurring rails configured
              </Badge>
              {railSummary.nativeStripeReady ? <Badge tone="resolved">Native Stripe recurring</Badge> : <Badge tone="observing">Manual fallback</Badge>}
            </div>
            <h1 className="mt-6 text-balance font-extrabold" style={{ fontSize: "var(--text-h1)", letterSpacing: "var(--tracking-tight)", lineHeight: "var(--leading-tight)" }}>
              Money first. Evidence second. Access only after both agree.
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
              {railSummary.nativeStripeReady
                ? "Native Stripe recurring Checkout is the preferred clinic-plan rail. Only signed live invoice evidence can activate or renew access; browser return never does. Exact-plan GoDaddy links remain the operator-managed fallback when native recurring Stripe is not enabled."
                : "Exact-plan GoDaddy paylinks remain the current operator-managed recurring fallback. A plan is sellable here only when its own approved rail is configured, and staff reconcile payment manually because this fallback has no processor webhook or authoritative verification API."}
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Recurring plan checkout readiness">
          {plans.map((plan) => (
            <Card key={plan.key}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold">{plan.label}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>{plan.priceLabel}</p>
                </div>
                <Badge tone={plan.checkoutConfigured ? "resolved" : "signal"}>{plan.checkoutConfigured ? "Rail ready" : "Not configured"}</Badge>
              </div>
              <p className="mt-3 text-[10px] font-extrabold uppercase" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wide)" }}>{railLabel(plan.railProvider)}</p>
              <p className="mt-2 text-[10px] leading-5" style={{ color: "var(--text-on-paper-dim)" }}>
                {plan.railProvider === "stripe"
                  ? "Server-owned monthly price. Signed Stripe invoice evidence controls activation and renewal."
                  : plan.railProvider === "godaddy"
                    ? "Exact plan paylink is configured. Payment still requires human reconciliation before access changes."
                    : "No approved recurring checkout rail is configured for this plan, so this desk will not create its checkout."}
              </p>
            </Card>
          ))}
        </section>

        {error ? (
          <div className="p-4 text-xs font-bold" role="alert" style={{ color: "var(--status-signal)", background: "color-mix(in oklch, var(--status-signal) 8%, var(--surface-paper))", border: "1px solid color-mix(in oklch, var(--status-signal) 30%, transparent)", borderRadius: "var(--radius-md)" }}>
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wider)" }}>01 · Create checkout</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight">Bind the buyer to the exact plan before they pay.</h2>
              </div>
              <Badge tone="observing">Server-owned intent</Badge>
            </div>

            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <Input label="Clinic name" value={clinicName} onChange={(event) => setClinicName(event.target.value)} />
              <Input label="Owner email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>

            <label className="mt-6 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>Clinic plan</span>
              <select
                className="min-h-11 bg-transparent px-1 text-sm outline-none"
                style={{ color: "var(--text-on-paper)", border: "none", borderBottom: "var(--border-hair-light)" }}
                value={productKey}
                onChange={(event) => setProductKey(event.target.value)}
              >
                {!firstConfiguredPlan ? <option value="">No recurring plan rail configured</option> : null}
                {plans.map((plan) => (
                  <option disabled={!plan.checkoutConfigured} key={plan.key} value={plan.key}>
                    {plan.label} · {plan.priceLabel}{plan.checkoutConfigured ? ` · ${railLabel(plan.railProvider)}` : " · not configured"}
                  </option>
                ))}
              </select>
            </label>

            {!selectedPlan?.checkoutConfigured ? (
              <div className="mt-5 flex items-start gap-3 p-4" style={{ background: "color-mix(in oklch, var(--status-signal) 7%, var(--surface-paper))", border: "1px solid color-mix(in oklch, var(--status-signal) 25%, transparent)", borderRadius: "var(--radius-md)" }}>
                <TriangleAlert className="mt-0.5 size-4 shrink-0" style={{ color: "var(--status-signal)" }} aria-hidden="true" />
                <p className="text-[10px] leading-5" style={{ color: "var(--text-on-paper-dim)" }}>Checkout creation is blocked until an approved recurring rail is configured for the selected plan. Klinikos will not substitute the $500 analysis link or another plan&apos;s paylink.</p>
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Button disabled={pending || !clinicName.trim() || !email.trim() || !selectedPlan?.checkoutConfigured} onClick={createCheckout}>
                {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ExternalLink className="size-4" aria-hidden="true" />}
                Create checkout
              </Button>
              <p className="max-w-md text-[10px] leading-5" style={{ color: "var(--text-on-paper-dim)" }}>
                Creating the checkout does not grant access and does not establish that money moved.
              </p>
            </div>

            {checkoutUrl ? (
              <div className="mt-7 p-5" style={{ background: "color-mix(in oklch, var(--accent-signal) 8%, var(--surface-paper))", border: "1px solid color-mix(in oklch, var(--accent-signal) 26%, transparent)", borderRadius: "var(--radius-md)" }}>
                <Badge tone="mapping">Checkout ready</Badge>
                <p className="mt-4 text-sm font-extrabold">Send or open the exact plan payment rail.</p>
                <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>Opening or returning from checkout is never payment evidence.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a className="inline-flex min-h-11 items-center gap-2 px-4 text-xs font-extrabold" href={checkoutUrl} target="_blank" rel="noreferrer" style={{ background: "var(--accent-signal)", color: "var(--obsidian)", borderRadius: "var(--radius-sm)" }}>
                    Open checkout <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                  <Button variant="outline" size="sm" onClick={() => copy(checkoutUrl)}>Copy link <Copy className="size-3.5" aria-hidden="true" /></Button>
                </div>
              </div>
            ) : null}
          </Card>

          <Card dark>
            <Badge tone="analyzing">02 · Payment truth</Badge>
            <ShieldCheck className="mt-6 size-6" style={{ color: "var(--gold-300)" }} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Processor evidence is consequential.</h2>
            <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
              {railSummary.nativeStripeReady
                ? "For native Stripe recurring checkout, signed live invoice evidence activates or renews the paid plan and its configured allowances. Staff cannot manually mark a Stripe checkout paid. GoDaddy fallback checkouts remain a two-click human reconciliation process."
                : "For the GoDaddy fallback, confirm only after independently seeing the expected payment in real processor records. The first click arms the action; the second records manual evidence, activates the paid plan, initializes configured allowances, and issues the signed owner setup link."}
            </p>
            <div className="mt-7 border-t pt-5" style={{ borderColor: "var(--line-dark)" }}>
              <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--status-analyzing)", letterSpacing: "var(--tracking-wide)" }}>External truth</p>
              <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>A browser return never activates software. Payment entitlement also does not enable production PHI, approve connectors, or certify deployment readiness.</p>
            </div>
          </Card>
        </section>

        {activationUrl ? (
          <section className="p-6" style={{ background: "color-mix(in oklch, var(--status-resolved) 9%, var(--surface-paper))", border: "1px solid color-mix(in oklch, var(--status-resolved) 30%, transparent)", borderRadius: "var(--radius-md)" }}>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-0.5 size-6 shrink-0" style={{ color: "var(--status-resolved)" }} aria-hidden="true" />
              <div className="min-w-0">
                <Badge tone="resolved">Subscription activated</Badge>
                <h2 className="mt-4 text-xl font-extrabold">The owner setup link is ready.</h2>
                <p className="mt-2 max-w-3xl text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>
                  Verified paid software access is active. This does not enable production PHI, approve connectors, or certify deployment readiness. The signed setup link expires automatically and cannot choose a different organization, email, plan, role, or price.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="gold" size="sm" onClick={() => copy(activationUrl)}>Copy activation link <Copy className="size-3.5" aria-hidden="true" /></Button>
                  <a className="inline-flex min-h-10 items-center gap-2 px-4 text-xs font-extrabold" href={activationUrl} target="_blank" rel="noreferrer" style={{ border: "var(--border-hair-light)", borderRadius: "var(--radius-sm)" }}>
                    Open link <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="checkout-ledger-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wider)" }}>03 · Activation ledger</p>
              <h2 id="checkout-ledger-heading" className="mt-2 text-2xl font-extrabold tracking-tight">Recent clinic checkouts</h2>
              <p className="mt-2 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>{checkouts.length} recent records</p>
            </div>
            <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(() => refresh().catch((caught) => setError(caught instanceof Error ? caught.message : "Refresh failed.")))}>
              <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
            </Button>
          </div>

          <div className="mt-6 divide-y" style={{ borderTop: "var(--border-hair-light)", borderBottom: "var(--border-hair-light)", borderColor: "var(--line-light)" }}>
            {checkouts.length === 0 ? (
              <p className="py-8 text-sm" style={{ color: "var(--text-on-paper-dim)" }}>No clinic subscription checkouts yet.</p>
            ) : checkouts.map((checkout) => (
              <article className="grid gap-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center" key={checkout.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-extrabold">{checkout.clinicName}</p>
                    <Badge tone={checkoutTone(checkout.status)}>{checkout.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>{checkout.email} · {checkout.productLabel} · {money(checkout.expectedAmountCents)}</p>
                  <p className="mt-2 text-[10px]" style={{ color: "var(--text-on-paper-dim)" }}>Intent {checkout.id.slice(0, 8)} · {checkout.organizationId ? "organization linked" : "pre-provisioning"} · {checkout.provider}</p>
                </div>
                <div>
                  {checkout.status === "created" && checkout.provider === "godaddy" ? (
                    <Button
                      variant={confirmIntentId === checkout.id ? "gold" : "outline"}
                      size="sm"
                      disabled={pending}
                      onClick={() => reconcile(checkout.id)}
                    >
                      {confirmIntentId === checkout.id ? "Confirm: payment independently verified" : "Record reconciled payment"}
                    </Button>
                  ) : checkout.status === "created" && checkout.provider === "stripe" ? (
                    <span className="inline-flex items-center gap-2 text-xs font-extrabold" style={{ color: "var(--status-analyzing)" }}>
                      <ShieldCheck className="size-4" aria-hidden="true" /> Awaiting signed Stripe invoice
                    </span>
                  ) : checkout.status === "completed" && checkout.provider === "stripe" ? (
                    <Button variant="gold" size="sm" disabled={pending} onClick={() => issueActivation(checkout.id)}>
                      Issue owner activation link
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs font-extrabold" style={{ color: "var(--status-resolved)" }}>
                      <CheckCircle2 className="size-4" aria-hidden="true" /> Payment evidence applied
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DsSurface>
  );
}
