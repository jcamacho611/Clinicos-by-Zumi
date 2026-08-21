import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, PackageSearch, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { gridPublicPricingPolicy } from "@/lib/commercial/grid-public-pricing";

export const metadata = {
  title: "Grid pricing — Klinikos",
  description: "Low-friction Grid entry with optional Pro tools and resource-class-specific transaction economics.",
};

const cards = [
  { icon: BriefcaseBusiness, title: gridPublicPricingPolicy.professional.label, who: "Independent professionals and providers", free: gridPublicPricingPolicy.professional.freeLabel, pro: gridPublicPricingPolicy.professional.proLabel, transaction: gridPublicPricingPolicy.professional.transactionLabel, body: gridPublicPricingPolicy.professional.pricing, cta: "Join as a professional", href: "/grid/join" },
  { icon: Building2, title: gridPublicPricingPolicy.facility.label, who: "Clinics, rooms, chairs, facilities, and capacity hosts", free: gridPublicPricingPolicy.facility.freeLabel, pro: gridPublicPricingPolicy.facility.proLabel, transaction: gridPublicPricingPolicy.facility.transactionLabel, body: gridPublicPricingPolicy.facility.pricing, cta: "List space or capacity", href: "/grid/join/location" },
  { icon: PackageSearch, title: gridPublicPricingPolicy.seller.label, who: "Eligible product, equipment, service, education, and partner-capacity sellers", free: gridPublicPricingPolicy.seller.freeLabel, pro: gridPublicPricingPolicy.seller.proLabel, transaction: gridPublicPricingPolicy.seller.transactionLabel, body: gridPublicPricingPolicy.seller.pricing, cta: "Start a seller listing", href: "/grid/join/seller" },
] as const;

export default function GridPricingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#0b1220]">
      <header className="border-b border-[#e2e6ea] bg-white"><div className="mx-auto flex h-20 max-w-[1400px] items-center px-5 sm:px-8"><Link className="flex items-center gap-3" href="/grid"><BrandMark /><span><span className="block text-sm font-extrabold">Klinikos Grid</span><span className="block text-[11px] font-bold uppercase tracking-[.18em] text-[#174ea6]">Pricing & access</span></span></Link><Link className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-[#5b6675]" href="/grid"><ArrowLeft className="size-4"/>Back to Grid</Link></div></header>

      <section className="border-b border-[#dfe3e8] bg-white"><div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-20"><p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-[#174ea6]">Grid pricing</p><h1 className="mt-4 max-w-5xl text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">Join easily. Pay for tools and governed completed value.</h1><p className="mt-6 max-w-3xl text-sm leading-7 text-[#5b6675]">Grid keeps basic participation low-friction so the network can grow. Pro tools are optional. If an approved resource-class transaction fee applies, it is server-owned and disclosed before acceptance rather than assumed from one universal percentage.</p></div></section>

      <section className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">{cards.map(({ icon: Icon, title, who, free, pro, transaction, body, cta, href }) => (<article className="flex flex-col border border-[#dfe3e8] bg-white p-6" key={title}><Icon className="size-5 text-[#174ea6]" /><p className="mt-6 text-[12px] font-extrabold uppercase tracking-[.14em] text-[#6c7684]">{who}</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">{title}</h2><div className="mt-5 border-y border-[#edf0f2] py-4"><p className="text-lg font-black">{free}</p><p className="mt-1 text-sm font-extrabold text-[#174ea6]">{pro}</p><p className="mt-2 text-[11px] leading-5 text-[#6c7684]">{transaction}</p></div><p className="mt-4 text-[12px] leading-6 text-[#5b6675]">{body}</p><Link className="mt-auto pt-6 text-xs font-extrabold text-[#174ea6]" href={href}>{cta} <ArrowRight className="ml-1 inline size-3.5" /></Link></article>))}</div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2"><div className="border border-[#dfe3e8] bg-[#0b1220] p-6 text-white"><Sparkles className="size-5 text-cyan-300" /><h2 className="mt-4 text-xl font-extrabold">Klinikos earns only under an approved fee policy.</h2><p className="mt-3 text-[12px] leading-6 text-slate-400">{gridPublicPricingPolicy.platform.pricing}</p></div><div className="border border-[#dfe3e8] bg-white p-6"><ShieldCheck className="size-5 text-[#9a7a1f]" /><h2 className="mt-4 text-xl font-extrabold">Payment never buys around verification.</h2><p className="mt-3 text-[12px] leading-6 text-[#5b6675]">Paid access, Pro status, or transaction funding never overrides credential, eligibility, safety, privacy, capacity, or regulated-work requirements. Automated multi-party payouts remain separate until an approved payout processor is connected.</p><Link className="mt-5 inline-flex min-h-[44px] items-center gap-2 bg-[#174ea6] px-5 text-xs font-extrabold text-white" href="/grid">Choose your Grid path <ArrowRight className="size-4" /></Link><p className="mt-3 text-[12px] leading-5 text-[#6c7684]">Grid captures participant, resource, and transaction context before any paid action. A payment link opened in a browser is never treated as proof that you paid, or that you are eligible for regulated work.</p></div></div>
      </section>
    </main>
  );
}
