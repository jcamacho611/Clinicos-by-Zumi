import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, LockKeyhole, Scale, ShieldCheck, TriangleAlert } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";

export const metadata: Metadata = {
  title: "Trust & Readiness",
  description: "A public, non-certification summary of what Klinikos has built, what still needs external verification, and what is intentionally blocked until production requirements are met.",
};

type Status = "built" | "connected" | "pending" | "blocked" | "review";

const statusMeta: Record<Status, { label: string; icon: typeof CheckCircle2; className: string }> = {
  built: { label: "Built", icon: CheckCircle2, className: "text-emerald-200" },
  connected: { label: "Connected, proof still bounded", icon: ShieldCheck, className: "text-cyan-200" },
  pending: { label: "Pending runtime proof", icon: CircleDashed, className: "text-amber-200" },
  blocked: { label: "Blocked until approved", icon: LockKeyhole, className: "text-rose-200" },
  review: { label: "Counsel / diligence review", icon: Scale, className: "text-violet-200" },
};

const items: Array<{ title: string; status: Status; summary: string; evidence: string }> = [
  {
    title: "Public Zumi navigation",
    status: "built",
    summary: "The public Living Home keeps a conversation-first interface while routing requests through deterministic navigation rules into real Klinikos surfaces.",
    evidence: "The public surface does not open private clinic records or execute work. The interface now states that this page uses fixed routing rules rather than representing the navigation response as a live model conversation.",
  },
  {
    title: "Clinic commercial payment evidence",
    status: "pending",
    summary: "The repository contains server-owned commercial intents, Stripe-hosted Checkout integration, signed webhook verification, replay protection, refunds/failure truth, and manual fallback boundaries.",
    evidence: "Repository presence does not prove the deployed endpoint, live account configuration, or an end-to-end production payment. Controlled production evidence determines what may be called verified live.",
  },
  {
    title: "Recurring Clinic OS subscriptions",
    status: "pending",
    summary: "The repository contains native monthly Stripe subscription code behind an explicit production feature gate.",
    evidence: "The production gate should remain off until the deployed application SHA is confirmed and a controlled subscription invoice lifecycle proves activation, renewal, failure, and cancellation behavior.",
  },
  {
    title: "Grid discovery and geolocation",
    status: "built",
    summary: "Grid supports public discovery, explicit browser geolocation, deterministic distance logic, privacy-reduced public coordinates, and a keyless OpenFreeMap/MapLibre path.",
    evidence: "Inventory remains truth-bound: Klinikos does not create fake nearby supply or invent availability.",
  },
  {
    title: "SMS consent and inbound opt-out controls",
    status: "pending",
    summary: "Tenant-scoped SMS permission, suppression, signed inbound Twilio routing, STOP/START handling, and durable replay evidence exist in the application.",
    evidence: "Production sender/account configuration and controlled delivery proofs are separate from code presence. PHI-bearing SMS remains independently blocked.",
  },
  {
    title: "Production PHI",
    status: "blocked",
    summary: "Public/demo capability and paid software access do not authorize production PHI processing.",
    evidence: "Production PHI remains fail-closed until the applicable infrastructure, vendor, contract/BAA, retention, access-control, security, and workload posture is independently approved.",
  },
  {
    title: "Legal and contractual suite",
    status: "review",
    summary: "Klinikos tracks public terms, privacy, clinic agreements, BAA, security terms, AI terms, Grid terms, and communications terms as separate governed documents.",
    evidence: "Draft or registry presence is not counsel approval. Final contractual language must be reviewed for the actual launch scope and jurisdiction before reliance.",
  },
  {
    title: "Release verification",
    status: "pending",
    summary: "The application exposes a non-secret deployed release identity and the repository contains quality/deploy gates.",
    evidence: "Recent GitHub-hosted Actions runs have been refused before step 1 by an external account-level runner condition, so those exact merged heads are not represented as CI-green.",
  },
];

const boundaries = [
  "A browser redirect is not payment evidence.",
  "A configured credential is not a verified-live integration.",
  "Payment does not override tenant, role, clinical, credentialing, privacy, or human-review controls.",
  "Synthetic/demo behavior is not represented as production clinical deployment.",
  "Klinikos does not claim HIPAA readiness merely because application controls exist.",
  "Grid booking, fulfillment, obligation, payout, and settlement remain distinct states.",
] as const;

export default function TrustPage() {
  return (
    <main className="min-h-screen bg-[#070b13] text-white">
      <header className="border-b border-white/10 bg-[#070b13]/95">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-5 px-5 sm:px-8">
          <KlinikosWordmark href="/" inverse markClassName="h-8 w-8" textClassName="h-[18px] w-[160px]" />
          <nav className="ml-auto flex items-center gap-4 text-xs font-semibold text-white/70" aria-label="Trust navigation">
            <Link className="hover:text-white" href="/pricing">Pricing</Link>
            <Link className="hidden hover:text-white sm:inline" href="/about">About</Link>
            <Link className="hover:text-white" href="/login">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-white/10 px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-cyan-200">Trust & readiness · updated 2026-08-18</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[.96] tracking-[-.06em] sm:text-6xl">Proof before promises.</h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/65">
              This page is a public product-readiness summary, not a certification, legal opinion, security attestation, or substitute for customer diligence. Its purpose is to make the boundary between built, connected, externally unverified, and blocked visible before a buyer has to ask.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-6">
            <TriangleAlert className="size-5 text-amber-200" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold">Production clinical use is not implied.</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">A paid subscription can establish software entitlement. It does not establish PHI approval, compliance certification, a vendor BAA, clinical authorization, or an externally verified integration.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8" aria-labelledby="readiness-heading">
        <div className="max-w-3xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-cyan-200">Readiness register</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight" id="readiness-heading">What a buyer can and cannot infer today.</h2>
        </div>

        <div className="mt-9 divide-y divide-white/10 border-y border-white/10">
          {items.map((item) => {
            const meta = statusMeta[item.status];
            const Icon = meta.icon;
            return (
              <article className="grid gap-5 py-7 lg:grid-cols-[220px_1fr_1fr] lg:items-start" key={item.title}>
                <div>
                  <div className={`flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] ${meta.className}`}><Icon className="size-4" aria-hidden="true" />{meta.label}</div>
                  <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
                </div>
                <p className="text-sm leading-7 text-white/70">{item.summary}</p>
                <p className="text-xs leading-6 text-white/50">{item.evidence}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.025] px-5 py-14 sm:px-8" aria-labelledby="boundaries-heading">
        <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[.7fr_1.3fr]">
          <div><ShieldCheck className="size-6 text-cyan-200" aria-hidden="true" /><h2 className="mt-4 text-3xl font-extrabold tracking-tight" id="boundaries-heading">What Klinikos refuses to blur.</h2></div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {boundaries.map((boundary) => <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-4 text-xs leading-6 text-white/65" key={boundary}><CheckCircle2 className="mt-1 size-4 shrink-0 text-cyan-200" aria-hidden="true" />{boundary}</li>)}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <TrustLink title="Commercial model" body="See current public pricing anchors, implementation economics, and customer-funded usage rules." href="/pricing" />
          <TrustLink title="Privacy notice" body="Read the current product-facing privacy notice and its explicit production boundary." href="/legal/privacy" />
          <TrustLink title="Legal document status" body="See the governed legal-document registry status without treating draft language as counsel-approved." href="/legal/terms" />
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-200 px-5 text-xs font-extrabold text-slate-950 hover:bg-cyan-100" href="/founding-clinic">Evaluate a clinic fit <ArrowRight className="size-4" aria-hidden="true" /></Link>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-xs font-extrabold text-white/80 hover:border-white/30 hover:text-white" href="/">Return to Living Home</Link>
        </div>
      </section>
    </main>
  );
}

function TrustLink({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link className="group rounded-2xl border border-white/10 bg-white/[.025] p-6 hover:border-cyan-200/30" href={href}>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-3 text-xs leading-6 text-white/55">{body}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-cyan-200">Open <ArrowRight className="size-3.5 transition group-hover:translate-x-1" aria-hidden="true" /></span>
    </Link>
  );
}
