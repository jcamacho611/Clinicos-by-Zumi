import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, Network, Search, Sparkles, Users } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";

export const metadata = {
  title: "Klinikos Grid — Tell us what you need",
  description:
    "Klinikos Grid routes people, clinics, spaces, services, education, and healthcare capacity into the right marketplace lane with minimal friction.",
};

const buyLanes = [
  {
    icon: BriefcaseBusiness,
    title: "Find work",
    body: "Per-diem, PRN, contract, coverage, project, and professional opportunities.",
    href: "/grid/browse?intent=work",
  },
  {
    icon: Users,
    title: "Find a provider",
    body: "Browse available healthcare professionals and provider capacity.",
    href: "/grid/browse?intent=provider",
  },
  {
    icon: Building2,
    title: "Find space",
    body: "Treatment rooms, chairs, clinics, offices, and approved capacity.",
    href: "/grid/browse?intent=space",
  },
  {
    icon: Sparkles,
    title: "Find a service",
    body: "Billing, credentialing, staffing, consulting, operations, and business support.",
    href: "/grid/browse?intent=service",
  },
  {
    icon: Network,
    title: "Find network capacity",
    body: "Partner organizations, handoffs, referrals, and available healthcare capacity.",
    href: "/grid/browse?intent=network",
  },
  {
    icon: GraduationCap,
    title: "Find education access",
    body: "Preceptors, placements, training capacity, and learning opportunities as they become available.",
    href: "/grid/browse?intent=education",
  },
] as const;

const sellLanes = [
  ["I want work", "Publish your availability, radius, work types, and opportunity preferences.", "/grid/join"],
  ["I have space", "List rooms, chairs, clinic capacity, and the times they are available.", "/grid/join/location"],
  ["I provide a service", "Offer healthcare business or professional services through Grid.", "/grid/join/seller"],
  ["I have capacity", "Make eligible provider, facility, partner, or network capacity discoverable.", "/grid/join"],
] as const;

export default function GridGatewayPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#0b1220]">
      <header className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <span>
              <span className="block text-sm font-extrabold tracking-[-.03em]">Klinikos Grid</span>
              <span className="block text-[9px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Opportunity network</span>
            </span>
          </Link>
          <Link className="ml-auto text-xs font-bold text-[#5b6675] hover:text-[#0b1220]" href="/grid/browse">Browse everything</Link>
          <Link className="ml-3 inline-flex min-h-[44px] items-center bg-[#0b1220] px-4 text-xs font-bold text-white hover:bg-[#174ea6]" href="/login">Sign in</Link>
        </div>
      </header>

      <section className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#174ea6]">Klinikos Grid</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <h1 className="max-w-5xl text-balance text-5xl font-black leading-[.94] tracking-[-.065em] sm:text-7xl lg:text-[88px]">What are you here to get done?</h1>
              <p className="mt-7 max-w-3xl text-base leading-8 text-[#5b6675] sm:text-lg">Choose the outcome. Grid routes you into the right lane, narrows what matters, and keeps the underlying healthcare rules out of your way until they are actually needed.</p>
            </div>
            <div className="border border-[#dfe3e8] bg-[#fbfcfd] p-6 sm:p-7">
              <div className="flex items-center gap-3"><Search className="size-5 text-[#174ea6]" /><p className="text-sm font-extrabold">Need something specific?</p></div>
              <p className="mt-3 text-[13px] leading-6 text-[#5b6675]">You can browse everything now, or choose a lane below so Grid pre-sorts the experience around your goal.</p>
              <Link className="mt-5 inline-flex min-h-[44px] items-center gap-2 bg-[#174ea6] px-5 text-xs font-extrabold text-white hover:bg-[#0f3f8f]" href="/grid/browse">Browse Grid <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:py-20">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">I need something</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">What do you want access to?</h2>
        </div>
        <div className="mt-8 grid gap-px overflow-hidden border border-[#e1e5ea] bg-[#e1e5ea] sm:grid-cols-2 xl:grid-cols-3">
          {buyLanes.map(({ icon: Icon, title, body, href }) => (
            <Link className="group bg-white p-6 transition hover:bg-[#f7faff] sm:p-7" href={href} key={title}>
              <div className="flex items-start justify-between gap-4"><Icon className="size-5 text-[#174ea6]" /><ArrowRight className="size-4 text-[#8c96a3] transition group-hover:translate-x-1 group-hover:text-[#174ea6]" /></div>
              <h3 className="mt-8 text-lg font-extrabold tracking-[-.03em]">{title}</h3>
              <p className="mt-3 text-[13px] leading-6 text-[#5b6675]">{body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e6e9ee] bg-[#0b1220] text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:py-20">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-300">I have something</p>
          <div className="mt-3 grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div><h2 className="text-4xl font-black tracking-[-.055em] sm:text-5xl">Put your availability, space, service, or capacity on Grid.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">Grid should do the sorting after you tell it what you have and when it is available.</p></div>
            <div className="border-t border-white/10">
              {sellLanes.map(([title, body, href]) => (
                <Link className="group grid gap-3 border-b border-white/10 py-6 sm:grid-cols-[1fr_1.5fr_auto] sm:items-center" href={href} key={title}>
                  <h3 className="text-base font-extrabold">{title}</h3><p className="text-[13px] leading-6 text-slate-400">{body}</p><ArrowRight className="size-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8">
        <p className="max-w-4xl text-[11px] leading-6 text-[#5b6675]">Grid routes access and opportunity requests. Regulated clinical work still requires the applicable identity, license, credential, malpractice, jurisdiction, consent, and human-review gates before a connection becomes eligible for fulfillment.</p>
      </section>
    </main>
  );
}
