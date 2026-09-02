import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Network, ShieldCheck, Sparkles } from "lucide-react";
import { PublicExperienceShell } from "@/components/marketing/public-experience-shell";
import { publicCompanyStory } from "@/lib/brand/public-company-story";

export const metadata: Metadata = {
  title: "Our Mission | Klinikos",
  description: "Why Klinikos exists, the operating principles behind the system, and the product and diligence standards guiding the build.",
  openGraph: {
    title: "Our Mission | Klinikos",
    description: publicCompanyStory.mission.headline,
    type: "website",
  },
};

const credibilityIcons = [Building2, ShieldCheck, Sparkles, Network] as const;

export default function AboutPage() {
  const story = publicCompanyStory;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Klinikos",
    url: "https://www.klinikos.io/about",
    description: story.mission.statement,
    slogan: story.mission.headline,
  };

  return (
    <PublicExperienceShell contextLabel="Mission & company story">
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="relative overflow-hidden border-b border-[var(--k-line)] bg-[var(--k-ambient)] px-5 py-20 sm:px-8 lg:py-28">
        <div className="relative mx-auto max-w-[1500px]">
          <Link className="inline-flex min-h-11 items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-[var(--k-muted)] hover:text-[var(--k-text)]" href="/"><ArrowLeft className="size-3.5" aria-hidden="true" />Back to Klinikos</Link>
          <div className="mt-14 grid gap-12 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.22em] text-[var(--k-accent)]">{story.mission.eyebrow}</p>
              <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[.94] tracking-[-.07em] sm:text-6xl lg:text-8xl">{story.mission.headline}</h1>
              <p className="mt-8 max-w-4xl text-base leading-8 text-[var(--k-muted)] sm:text-lg">{story.mission.statement}</p>
            </div>
            <div className="border border-[var(--k-line)] bg-[var(--k-public-surface)] p-6 shadow-[var(--k-shadow)] sm:p-8">
              <p className="text-[12px] font-extrabold uppercase tracking-[.16em] text-[var(--k-premium)]">Why this exists</p>
              <div className="mt-5 space-y-5">{story.why.map((paragraph) => <p className="text-sm leading-7 text-[var(--k-muted)]" key={paragraph}>{paragraph}</p>)}</div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="k-primary-action min-h-11 px-4 text-xs font-extrabold" href="/how-it-works">See how it works <ArrowRight className="size-4" aria-hidden="true" /></Link>
                <Link className="k-secondary-action min-h-11 px-4 text-xs font-extrabold" href="/trust">Review readiness <ArrowRight className="size-4" aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--k-line)] px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-[1500px]">
          <div className="max-w-4xl"><p className="text-[11px] font-black uppercase tracking-[.18em] text-[var(--k-accent)]">One ecosystem</p><h2 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-5xl">Different surfaces. One continuity model underneath.</h2></div>
          <div className="mt-10 grid gap-px overflow-hidden border border-[var(--k-line)] bg-[var(--k-line)] md:grid-cols-2 xl:grid-cols-4">
            {story.ecosystem.map((item, index) => <article className="bg-[var(--k-public-surface)] p-6" key={item.name}><span className="text-[12px] font-black uppercase tracking-[.16em] text-[var(--k-muted)]">0{index + 1}</span><h3 className="mt-5 text-2xl font-black tracking-[-.04em]">{item.name}</h3><p className="mt-1 text-[12px] font-extrabold uppercase tracking-[.12em] text-[var(--k-accent)]">{item.role}</p><p className="mt-5 text-xs leading-6 text-[var(--k-muted)]">{item.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--k-line)] bg-[var(--k-public-surface)] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1500px] gap-12 xl:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-[var(--k-premium)]">{story.founder.label}</p>
            <h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-.055em] sm:text-5xl">{story.founder.headline}</h2>
            <div className="mt-8 space-y-5">{story.founder.paragraphs.map((paragraph) => <p className="text-sm leading-7 text-[var(--k-muted)]" key={paragraph}>{paragraph}</p>)}</div>
            <div className="mt-8 border-l-2 border-[var(--k-accent)] pl-5"><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-accent)]">Leadership diligence</p><p className="mt-2 text-xs leading-6 text-[var(--k-muted)]">Public marketing is intentionally product-led. Qualified buyers should verify leadership identity, the contracting party, insurance, security posture, and applicable professional relationships before executing a production agreement.</p></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {story.accolades.map((item, index) => { const Icon = credibilityIcons[index] ?? ShieldCheck; return <article className="border border-[var(--k-line)] bg-[var(--k-public-raised)] p-5" key={item.title}><Icon className="size-5 text-[var(--k-accent)]" aria-hidden="true" /><h3 className="mt-5 text-lg font-black tracking-[-.03em]">{item.title}</h3><p className="mt-2 text-xs leading-6 text-[var(--k-muted)]">{item.detail}</p></article>; })}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--k-line)] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-10 xl:grid-cols-[.75fr_1.25fr]">
            <div><p className="text-[11px] font-black uppercase tracking-[.18em] text-[var(--k-accent)]">How we build</p><h2 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-5xl">Principles before promises.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-[var(--k-muted)]">The system is deliberately broad in scope, but each resource class, regulated workflow, and consequential action keeps the boundary it actually requires.</p></div>
            <div className="grid gap-px overflow-hidden border border-[var(--k-line)] bg-[var(--k-line)] sm:grid-cols-2">{story.principles.map((principle, index) => <article className="bg-[var(--k-public-surface)] p-6" key={principle.title}><span className="text-[12px] font-black uppercase tracking-[.14em] text-[var(--k-muted)]">0{index + 1}</span><h3 className="mt-4 text-lg font-black">{principle.title}</h3><p className="mt-3 text-xs leading-6 text-[var(--k-muted)]">{principle.description}</p></article>)}</div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-[1500px] rounded-[2rem] border border-[var(--k-line)] bg-[var(--k-public-raised)] p-6 sm:p-9">
          <div className="grid gap-8 xl:grid-cols-[.6fr_1.4fr]">
            <div><ShieldCheck className="size-6 text-[var(--k-premium)]" aria-hidden="true" /><p className="mt-5 text-[11px] font-black uppercase tracking-[.18em] text-[var(--k-premium)]">Public truth boundary</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em]">What we refuse to blur.</h2></div>
            <div className="grid gap-3">{story.publicBoundaries.map((boundary) => <div className="flex items-start gap-3 border-b border-[var(--k-line)] pb-3 text-xs leading-6 text-[var(--k-muted)]" key={boundary}><CheckCircle2 className="mt-1 size-4 shrink-0 text-[var(--k-premium)]" aria-hidden="true" /><span>{boundary}</span></div>)}</div>
          </div>
        </div>
      </section>
      </main>
    </PublicExperienceShell>
  );
}
