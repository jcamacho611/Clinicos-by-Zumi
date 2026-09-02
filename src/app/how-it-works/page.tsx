import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Building2, Network, ShieldCheck } from "lucide-react";
import { PublicExperienceShell } from "@/components/marketing/public-experience-shell";
import { ProductEvidenceFigure } from "@/components/marketing/product-evidence-figure";

export const metadata: Metadata = {
  title: "How Klinikos Works",
  description: "See the screen a clinic actually opens: what needs a person now, what is with someone else, and what is already done.",
};

const layers = [
  {
    icon: Building2,
    title: "Klinikos runs the operation",
    body: "Appointments, intake, tasks, documents, follow-up, referrals, revenue work, staff ownership, and operating visibility stay connected to the clinic's real workspace.",
  },
  {
    icon: BrainCircuit,
    title: "Zumi helps the team see what matters",
    body: "Zumi is the intelligence inside Klinikos. It can organize authorized operational context, explain signals, and prepare governed next steps. It does not replace licensed clinical judgment or bypass human review.",
  },
  {
    icon: Network,
    title: "Grid connects healthcare resources",
    body: "Grid helps organizations and participants express what they need or have, find candidates, enforce contextual eligibility, make offers, reserve resources, fulfill work, and preserve trust history.",
  },
] as const;

const flow = [
  "A clinic chooses an approved commercial path.",
  "Payment or pilot authorization is verified by Klinikos before paid access changes.",
  "Your clinic workspace is created, and you are set up as its owner.",
  "The owner completes guided setup and lands in the Living Home operating view.",
  "Klinikos surfaces real work that needs attention and safely advances what it is allowed to handle.",
  "External services stay marked Pending Connection or Manual Fallback until their real readiness gates are satisfied.",
] as const;

export default function HowKlinikosWorksPage() {
  return (
    <PublicExperienceShell contextLabel="How Klinikos works">
      <main>

      <section className="border-b border-[var(--k-line)] bg-[var(--k-ambient)] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-[12px] font-extrabold uppercase tracking-[.22em] text-[var(--k-accent)]">How it works</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-light leading-[1] tracking-[-.05em] sm:text-6xl">One operating layer for the work that falls between systems.</h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-[var(--k-muted)]">Klinikos is the platform. Zumi is the intelligence inside it. Grid is the healthcare resource network. The product connects operational truth first, then lets automation and outside services participate only through governed boundaries.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="k-primary-action min-h-11 rounded-full px-6 text-xs font-extrabold" href="/operational-audit">See what Klinikos would replace <ArrowRight className="size-4" /></Link>
            <Link className="k-secondary-action min-h-11 rounded-full px-6 text-xs font-extrabold" href="/grid">Explore Grid</Link>
          </div>
        </div>
      </section>

      {/* The reason this page exists. Describing the product in categories is what left an
          outside reviewer unable to say what it does; this shows the screen instead. It
          renders the real ActionCenterWorkspace rather than a picture of it, so what a
          reader sees here cannot drift away from what a clinic gets. */}
      <section className="border-b border-[var(--k-line)] px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-[12px] font-extrabold uppercase tracking-[.22em] text-[var(--k-accent)]">The screen you open</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-light leading-[1.1] tracking-[-.04em] sm:text-4xl">Most software shows you everything that happened. Klinikos shows you what has not reached its owner yet.</h2>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-[var(--k-muted)]">Work is split by whose hands it is in, so a person can pick up what is theirs and put down what is not. Urgency is carried by a word as well as a colour. No row names a patient, because this summary ends up on shared screens.</p>

          <aside className="mt-8 border border-[var(--k-line)] bg-[var(--k-public-raised)] p-5" data-public-example-disclosure="true" role="note">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--k-premium)]">Illustrative reference environment</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--k-muted)]">The workspace below uses clearly illustrative, non-patient content to show the real interface component. It is product evidence, not a live clinic, customer deployment, or production activity feed.</p>
          </aside>
          <ProductEvidenceFigure className="mt-10" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {layers.map(({ icon: Icon, title, body }) => (
            <article className="rounded-2xl border border-[var(--k-line)] bg-[var(--k-public-surface)] p-6" key={title}>
              <Icon aria-hidden="true" className="size-5 text-[var(--k-accent)]" />
              <h2 className="mt-5 text-xl font-semibold tracking-[-.035em]">{title}</h2>
              <p className="mt-3 text-[13px] leading-6 text-[var(--k-muted)]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--k-line)] bg-[var(--k-public-surface)]">
        <div className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8">
          <p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-[var(--k-accent)]">From interest to daily use</p>
          <h2 className="mt-3 text-3xl font-light tracking-[-.04em]">A controlled path, not a collection of disconnected signups.</h2>
          <ol className="mt-8 grid gap-3">
            {flow.map((item, index) => (
              <li className="flex gap-4 rounded-xl border border-[var(--k-line)] bg-[var(--k-public-raised)] p-4" key={item}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--k-public-bg)] text-[12px] font-extrabold text-[var(--k-accent)]">{String(index + 1).padStart(2, "0")}</span>
                <p className="pt-1 text-[13px] leading-6 text-[var(--k-muted)]">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8">
        <div className="flex gap-4 rounded-2xl border border-[var(--k-line)] bg-[var(--k-public-raised)] p-6">
          <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-[var(--k-premium)]" />
          <div>
            <h2 className="text-sm font-extrabold">Paying turns on software, not permission.</h2>
            <p className="mt-2 text-[13px] leading-6 text-[var(--k-muted)]">Paying turns on what you bought. It never changes who can sign in, what your team can see, what stays private, who may make a clinical decision, or what still needs a person to approve. Production patient-data use requires its own deployment and compliance readiness.</p>
          </div>
        </div>
      </section>
      </main>
    </PublicExperienceShell>
  );
}
