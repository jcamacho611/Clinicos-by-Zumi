import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Network, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { publicCompanyStory } from "@/lib/brand/public-company-story";

export const metadata: Metadata = {
  title: "Our Mission",
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
    <main className="min-h-screen bg-[#070b13] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b13]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <span>
              <span className="block text-sm font-black tracking-[-.03em]">Klinikos</span>
              <span className="block text-[12px] font-extrabold uppercase tracking-[.16em] text-cyan-100">Mission & company story</span>
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-[11px] font-extrabold uppercase tracking-[.12em] text-white/70 md:flex" aria-label="About navigation">
            <Link className="hover:text-white" href="/trust">Trust</Link>
            <Link className="hover:text-white" href="/pricing">Pricing</Link>
            <Link className="hover:text-white" href="/grid">Grid</Link>
            <Link className="hover:text-white" href="/login">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10 px-5 py-20 sm:px-8 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(22,163,174,.18),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(47,86,162,.16),transparent_35%)]" />
        <div className="relative mx-auto max-w-[1500px]">
          <Link className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-white/70 hover:text-white" href="/"><ArrowLeft className="size-3.5" aria-hidden="true" />Back to Klinikos</Link>
          <div className="mt-14 grid gap-12 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.22em] text-cyan-100">{story.mission.eyebrow}</p>
              <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[.94] tracking-[-.07em] sm:text-6xl lg:text-8xl">{story.mission.headline}</h1>
              <p className="mt-8 max-w-4xl text-base leading-8 text-white/70 sm:text-lg">{story.mission.statement}</p>
            </div>
            <div className="border border-white/15 bg-white/[.04] p-6 sm:p-8">
              <p className="text-[12px] font-extrabold uppercase tracking-[.16em] text-amber-100">Why this exists</p>
              <div className="mt-5 space-y-5">{story.why.map((paragraph) => <p className="text-sm leading-7 text-white/70" key={paragraph}>{paragraph}</p>)}</div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="inline-flex min-h-11 items-center gap-2 bg-cyan-200 px-4 text-xs font-extrabold text-slate-950 hover:bg-cyan-100" href="/how-it-works">See how it works <ArrowRight className="size-4" aria-hidden="true" /></Link>
                <Link className="inline-flex min-h-11 items-center gap-2 border border-white/20 px-4 text-xs font-extrabold text-white/85 hover:bg-white/[.06]" href="/trust">Review readiness <ArrowRight className="size-4" aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-[1500px]">
          <div className="max-w-4xl"><p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-100">One ecosystem</p><h2 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-5xl">Different surfaces. One continuity model underneath.</h2></div>
          <div className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
            {story.ecosystem.map((item, index) => <article className="bg-[#090e18] p-6" key={item.name}><span className="text-[12px] font-black uppercase tracking-[.16em] text-white/60">0{index + 1}</span><h3 className="mt-5 text-2xl font-black tracking-[-.04em]">{item.name}</h3><p className="mt-1 text-[12px] font-extrabold uppercase tracking-[.12em] text-cyan-100">{item.role}</p><p className="mt-5 text-xs leading-6 text-white/65">{item.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#090e18] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1500px] gap-12 xl:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-amber-100">{story.founder.label}</p>
            <h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-.055em] sm:text-5xl">{story.founder.headline}</h2>
            <div className="mt-8 space-y-5">{story.founder.paragraphs.map((paragraph) => <p className="text-sm leading-7 text-white/70" key={paragraph}>{paragraph}</p>)}</div>
            <div className="mt-8 border-l-2 border-cyan-200/70 pl-5"><p className="text-xs font-extrabold uppercase tracking-[.12em] text-cyan-100">Leadership diligence</p><p className="mt-2 text-xs leading-6 text-white/65">Public marketing is intentionally product-led. Qualified buyers should verify leadership identity, the contracting party, insurance, security posture, and applicable professional relationships before executing a production agreement.</p></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {story.accolades.map((item, index) => { const Icon = credibilityIcons[index] ?? ShieldCheck; return <article className="border border-white/15 bg-black/20 p-5" key={item.title}><Icon className="size-5 text-cyan-100" aria-hidden="true" /><h3 className="mt-5 text-lg font-black tracking-[-.03em]">{item.title}</h3><p className="mt-2 text-xs leading-6 text-white/65">{item.detail}</p></article>; })}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-10 xl:grid-cols-[.75fr_1.25fr]">
            <div><p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-100">How we build</p><h2 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-5xl">Principles before promises.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-white/65">The system is deliberately broad in scope, but each resource class, regulated workflow, and consequential action keeps the boundary it actually requires.</p></div>
            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">{story.principles.map((principle, index) => <article className="bg-[#070b13] p-6" key={principle.title}><span className="text-[12px] font-black uppercase tracking-[.14em] text-white/60">0{index + 1}</span><h3 className="mt-4 text-lg font-black">{principle.title}</h3><p className="mt-3 text-xs leading-6 text-white/65">{principle.description}</p></article>)}</div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-[1500px] rounded-[2rem] border border-amber-300/20 bg-amber-300/[.04] p-6 sm:p-9">
          <div className="grid gap-8 xl:grid-cols-[.6fr_1.4fr]">
            <div><ShieldCheck className="size-6 text-amber-100" aria-hidden="true" /><p className="mt-5 text-[11px] font-black uppercase tracking-[.18em] text-amber-100">Public truth boundary</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em]">What we refuse to blur.</h2></div>
            <div className="grid gap-3">{story.publicBoundaries.map((boundary) => <div className="flex items-start gap-3 border-b border-white/10 pb-3 text-xs leading-6 text-white/70" key={boundary}><CheckCircle2 className="mt-1 size-4 shrink-0 text-amber-100" aria-hidden="true" /><span>{boundary}</span></div>)}</div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 text-[11px] font-extrabold uppercase tracking-[.12em] text-white/65"><span>Klinikos</span><span aria-hidden="true">•</span><span>Healthcare operating infrastructure</span><span aria-hidden="true">•</span><Link className="ml-auto hover:text-white" href="/trust">Trust</Link><Link className="hover:text-white" href="/pricing">Pricing</Link><Link className="hover:text-white" href="/legal/privacy">Privacy</Link></div></footer>
    </main>
  );
}
