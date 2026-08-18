import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";

export const metadata: Metadata = {
  title: "Trust & Safety — Klinikos",
  description: "A buyer-safe overview of Klinikos privacy, security, human-review, and production-use boundaries.",
};

const principles = [
  {
    title: "Private work stays behind access controls",
    body: "Authenticated workspaces, organization data, patient-facing protected experiences, administrative tools, and private APIs are separated from the ordinary public website and require the applicable server-side authorization.",
    icon: LockKeyhole,
  },
  {
    title: "Public surfaces are not PHI intake",
    body: "Public conversations, marketing forms, qualification experiences, and demonstrations tell visitors not to submit patient information. Production patient-data use requires a separately approved environment and applicable contractual, privacy, and security controls.",
    icon: ShieldCheck,
  },
  {
    title: "Human authority remains consequential",
    body: "Klinikos can organize, surface, draft, and assist. Clinical, credentialing, payment, record-release, and other consequential actions remain subject to the appropriate authorization, evidence, and human review.",
    icon: CheckCircle2,
  },
  {
    title: "Contracts match the relationship",
    body: "Public website terms do not replace the additional agreements required for protected evaluations, clinics, providers, marketplace activity, patient services, data processing, or regulated production use.",
    icon: Scale,
  },
] as const;

const boundaries = [
  "A browser redirect is not proof that money moved.",
  "A public demo is not a production clinical environment.",
  "A software subscription does not by itself authorize production patient-data use.",
  "An AI response does not replace licensed or authorized human judgment.",
  "A listing or uploaded credential is not automatically treated as verified.",
  "No public page grants permission to scrape, probe, reverse engineer, or test Klinikos security.",
] as const;

export default function TrustPage() {
  return (
    <main className="min-h-screen bg-[#070b13] text-white">
      <header className="border-b border-white/10 bg-[#070b13]/95">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-5 px-5 sm:px-8">
          <KlinikosWordmark href="/" inverse markClassName="h-8 w-8" textClassName="h-[18px] w-[160px]" />
          <nav className="ml-auto flex items-center gap-4 text-xs font-semibold text-white/70" aria-label="Trust navigation">
            <Link className="hover:text-white" href="/pricing">Pricing</Link>
            <Link className="hidden hover:text-white sm:inline" href="/legal/terms">Terms</Link>
            <Link className="hover:text-white" href="/login">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-white/10 px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-cyan-200">Trust & safety</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[.96] tracking-[-.06em] sm:text-6xl">Clear boundaries without publishing the security blueprint.</h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/65">
            Klinikos explains the protections and limits that matter to customers while keeping sensitive architecture, provider configuration, deployment details, security controls, internal readiness evidence, and operational diagnostics out of the public website.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8" aria-labelledby="principles-heading">
        <div className="max-w-3xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-cyan-200">What you can rely on</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight" id="principles-heading">The public trust model.</h2>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {principles.map(({ title, body, icon: Icon }) => (
            <article className="rounded-2xl border border-white/10 bg-white/[.025] p-6" key={title}>
              <Icon className="size-5 text-cyan-200" aria-hidden="true" />
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/60">{body}</p>
            </article>
          ))}
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
          <TrustLink title="Website terms" body="Rules governing ordinary public access, intellectual property, prohibited conduct, disclaimers, and dispute terms." href="/legal/terms" />
          <TrustLink title="Privacy notice" body="How public-site information is handled and where production healthcare privacy requires separate controls." href="/legal/privacy" />
          <TrustLink title="Acceptable use" body="Security, scraping, reverse-engineering, data-use, fraud, and platform-integrity restrictions." href="/legal/acceptable-use" />
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-200 px-5 text-xs font-extrabold text-slate-950 hover:bg-cyan-100" href="/founding-clinic">Evaluate a clinic fit <ArrowRight className="size-4" aria-hidden="true" /></Link>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-xs font-extrabold text-white/80 hover:border-white/30 hover:text-white" href="/">Return home</Link>
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
