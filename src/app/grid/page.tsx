import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, HeartHandshake, Network, PackageSearch, Sparkles, Stethoscope, Users, Wrench } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { GridExchangeField } from "@/components/grid/grid-exchange-field";

export const metadata = {
  title: "Klinikos Grid — Universal healthcare exchange",
  description:
    "Klinikos Grid routes healthcare people, work, spaces, products, equipment, services, education, organizations, and capacity into the right marketplace lane with minimal friction.",
};

const buyLanes = [
  { icon: BriefcaseBusiness, title: "Find work", body: "Per-diem, PRN, contract, coverage, project, and professional opportunities.", href: "/grid/browse?intent=work" },
  { icon: Users, title: "Find a provider", body: "Browse available healthcare professionals and provider capacity.", href: "/grid/browse?intent=provider" },
  { icon: Building2, title: "Find space", body: "Treatment rooms, chairs, clinics, offices, and approved capacity.", href: "/grid/browse?intent=space" },
  { icon: PackageSearch, title: "Find products & supplies", body: "Discover permitted supplies, consumables, inventory, and purchasable resources available through Grid sellers.", href: "/grid/browse?intent=product" },
  { icon: Wrench, title: "Find equipment", body: "Find rentable equipment, diagnostic capacity, treatment devices, and other approved resources.", href: "/grid/browse?intent=equipment" },
  { icon: Sparkles, title: "Find a service", body: "Billing, credentialing, staffing, consulting, operations, and business support.", href: "/grid/browse?intent=service" },
  { icon: Network, title: "Find network capacity", body: "Partner organizations, handoffs, referrals, and available healthcare capacity.", href: "/grid/browse?intent=network" },
  { icon: GraduationCap, title: "Find education access", body: "Preceptors, placements, training capacity, and learning opportunities.", href: "/grid/browse?intent=education" },
  { icon: Stethoscope, title: "Find an organization", body: "Clinics, med spas, labs, imaging centers, specialty partners, and healthcare organizations.", href: "/grid/browse?intent=organization" },
  { icon: HeartHandshake, title: "Find referral access", body: "Discover permitted partner capacity for referrals, consultations, diagnostics, and follow-through.", href: "/grid/browse?intent=referral" },
] as const;

const sellLanes = [
  ["I want work", "Create a professional profile, submit the credentials required for regulated work, and tell Grid when and where you want opportunities.", "/grid/join"],
  ["I have space", "Create a space-owner account and submit a real room, chair, facility, lab, imaging, or training-capacity record for review.", "/grid/join/location"],
  ["I sell products or supplies", "Create a seller account and submit permitted non-prescription healthcare supply inventory for review.", "/grid/join/seller?type=product"],
  ["I have equipment", "Create an equipment-owner account with capacity, availability, permitted use, and pricing.", "/grid/join/seller?type=equipment"],
  ["I provide a service", "Create a service-provider account for billing, credentialing, recruiting, consulting, IT, cybersecurity, or other healthcare business support.", "/grid/join/seller?type=service"],
  ["I represent an organization", "Create an organization Grid account and publish real clinic, facility, lab, imaging, specialty, or network capacity for review.", "/grid/join/location?type=organization"],
  ["I have education capacity", "Create an education-partner account for preceptorships, placements, training seats, or other learning capacity.", "/grid/join/seller?type=education"],
  ["I have referral capacity", "Create a referral-partner account for governed consultation, diagnostic, specialty, or partner capacity.", "/grid/join/seller?type=referral"],
] as const;

export default function GridGatewayPage() {
  return (
    <main className="grid-canvas min-h-screen bg-[#050303] text-[#f8efed]" data-klinikos-ds>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(139,35,42,.22),transparent_34%),radial-gradient(circle_at_88%_74%,rgba(230,129,123,.035),transparent_26%)]" />
      <header className="relative z-20 border-b border-[#e28b85]/10 bg-[#050303]/88 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
          <KlinikosWordmark href="/" framed inverse markClassName="h-12 w-12" textClassName="h-[21px] w-[188px]" className="gap-3" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-[.18em] text-[#e6817b] md:block">Grid</span>
          <Link className="ml-auto hidden text-xs font-semibold text-[#9f8985] hover:text-[#f8efed] sm:block" href="/grid/pricing">Pricing</Link>
          <Link className="text-xs font-semibold text-[#9f8985] hover:text-[#f8efed]" href="/grid/browse">Browse everything</Link>
          <Link className="ml-3 inline-flex min-h-[44px] items-center rounded-full border border-[#efaaa1]/18 bg-[#e6817b] px-5 text-xs font-semibold text-[#19090b] transition hover:bg-[#efaaa1]" href="/login">Sign in</Link>
        </div>
      </header>

      <section className="relative z-10 border-b border-[#e28b85]/10">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
          <p className="text-[12px] font-semibold uppercase tracking-[.24em] text-[#e6817b]">Klinikos Grid</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div><h1 className="max-w-5xl text-balance text-5xl font-light leading-[.94] tracking-[-.065em] sm:text-7xl lg:text-[88px]">What are you here to get done?</h1><p className="mt-7 max-w-3xl text-base leading-8 text-[#bca5a1] sm:text-lg">Grid is the exchange layer for healthcare people, work, spaces, products, equipment, services, organizations, education, and capacity. Choose the outcome. Grid sorts the rest.</p></div>
            <div className="rounded-[28px] border border-[#e28b85]/14 bg-[#12090b]/62 p-3 shadow-[0_28px_90px_rgba(0,0,0,.25)] backdrop-blur-xl"><GridExchangeField /></div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:py-20">
        <p className="text-[12px] font-semibold uppercase tracking-[.2em] text-[#e6817b]">I need something</p><h2 className="mt-3 text-3xl font-light tracking-[-.05em] sm:text-4xl">What do you want access to?</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {buyLanes.map(({ icon: Icon, title, body, href }) => <Link className="group rounded-[18px] border border-[#e28b85]/12 bg-[#100708]/68 p-6 transition hover:border-[#e6817b]/28 hover:bg-[#170b0d]/78" href={href} key={title}><div className="flex items-start justify-between gap-4"><Icon className="size-5 text-[#d98e87]" /><ArrowRight className="size-4 text-[#725d59] transition group-hover:translate-x-1 group-hover:text-[#e6817b]" /></div><h3 className="mt-8 text-base font-semibold tracking-[-.03em] text-[#f8efed]">{title}</h3><p className="mt-3 text-[12px] leading-6 text-[#9f8985]">{body}</p></Link>)}
        </div>
      </section>

      <section className="relative z-10 border-y border-[#e28b85]/10 bg-[#090506]/88 text-[#f8efed]">
        <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:py-20">
          <p className="text-[12px] font-semibold uppercase tracking-[.2em] text-[#e6817b]">I have something</p>
          <div className="mt-3 grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><h2 className="text-4xl font-light tracking-[-.055em] sm:text-5xl">Put any legitimate healthcare resource on Grid.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-[#9f8985]">People should not have to understand marketplace infrastructure. They tell Grid what they have, what it can be used for, where it is, when it is available, and what they want for it. Grid handles the lane and policy.</p></div><div className="border-t border-[#e28b85]/10">{sellLanes.map(([title, body, href]) => <Link className="group grid gap-3 border-b border-[#e28b85]/10 py-6 sm:grid-cols-[1fr_1.5fr_auto] sm:items-center" href={href} key={title}><h3 className="text-base font-semibold text-[#f8efed]">{title}</h3><p className="text-[13px] leading-6 text-[#9f8985]">{body}</p><ArrowRight className="size-4 text-[#725d59] transition group-hover:translate-x-1 group-hover:text-[#e6817b]" /></Link>)}</div></div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 py-12 sm:px-8"><p className="max-w-5xl text-[11px] leading-6 text-[#806965]">Grid is intentionally broader than any one profession or transaction type. Policy is applied by resource class: regulated clinical work, space, equipment, products, professional services, education, organizations, and referrals each get the eligibility and review rules they actually require. Regulated items and services remain subject to applicable law, contracts, licensing, credentialing, facility rules, and human review.</p></section>
    </main>
  );
}
