import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, PackageSearch, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { KLINIKOS_GODADDY_PAYLINK, gridCommercialModel } from "@/lib/commercial/klinikos-commercial";

export const metadata = {
  title: "Grid pricing — Klinikos",
  description: "Low-friction Grid entry with optional Pro tools and value-aligned transaction economics.",
};

const cards = [
  { icon: BriefcaseBusiness, title: gridCommercialModel.professional.label, who: "Independent professionals and providers", free: gridCommercialModel.professional.freeLabel, pro: gridCommercialModel.professional.proLabel, transaction: gridCommercialModel.professional.transactionLabel, body: gridCommercialModel.professional.pricing, cta: "Join as a professional", href: "/grid/join" },
  { icon: Building2, title: gridCommercialModel.facility.label, who: "Clinics, rooms, chairs, facilities, and capacity hosts", free: gridCommercialModel.facility.freeLabel, pro: gridCommercialModel.facility.proLabel, transaction: gridCommercialModel.facility.transactionLabel, body: gridCommercialModel.facility.pricing, cta: "List space or capacity", href: "/grid/join/location" },
  { icon: PackageSearch, title: gridCommercialModel.seller.label, who: "Eligible product, equipment, service, education, and partner-capacity sellers", free: gridCommercialModel.seller.freeLabel, pro: gridCommercialModel.seller.proLabel, transaction: gridCommercialModel.seller.transactionLabel, body: gridCommercialModel.seller.pricing, cta: "Start a seller listing", href: "/grid/join/seller" },
] as const;

export default function GridPricingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#0b1220]">
      <header className="border-b border-[#e2e6ea] bg-white"><div className="mx-auto flex h-20 max-w-[1400px] items-center px-5 sm:px-8"><Link className="flex items-center gap-3" href="/grid"><BrandMark /><span><span className="block text-sm font-extrabold">Klinikos Grid</span><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-[#174ea6]">Pricing & access</span></span></Link><Link className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-[#5b6675]" href="/grid"><ArrowLeft className="size-4"/>Back to Grid</Link></div></header>

      <section className="border-b border-[#dfe3e8] bg-white"><div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-20"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#174ea6]">Grid pricing</p><h1 className="mt-4 max-w-5xl text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">Join easily. Pay for power and completed value.</h1><p className="mt-6 max-w-3xl text-sm leading-7 text-[#5b6675]">Grid keeps basic participation low-friction so the network can grow. Pro tools are optional. When a permitted transaction creates real value, Klinikos can earn through server-owned resource-class economics.</p></div></section>

      <section className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">{cards.map(({ icon: Icon, title, who, free, pro, transaction, body, cta, href }) => (<article className="flex flex-col border border-[#dfe3e8] bg-white p-6" key={title}><Icon className="size-5 text-[#174ea6]" /><p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#6c7684]">{who}</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">{title}</h2><div className="mt-5 border-y border-[#edf0f2] py-4"><p className="text-lg font-black">{free}</p><p className="mt-1 text-sm font-extrabold text-[#174ea6]">{pro}</p><p className="mt-2 text-[11px] leading-5 text-[#6c7684]">{transaction}</p></div><p className="mt-4 text-[12px] leading-6 text-[#5b6675]">{body}</p><Link className="mt-auto pt-6 text-xs font-extrabold text-[#174ea6]" href={href}>{cta} <ArrowRight className="ml-1 inline size-3.5" /></Link></article>))}</div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2"><div className="border border-[#dfe3e8] bg-[#0b1220] p-6 text-white"><Sparkles className="size-5 text-cyan-300" /><h2 className="mt-4 text-xl font-extrabold">Klinikos earns when the network creates value.</h2><p className="mt-3 text-[12px] leading-6 text-slate-400">{gridCommercialModel.platform.pricing}</p></div><div className="border border-[#dfe3e8] bg-white p-6"><ShieldCheck className="size-5 text-[#9a7a1f]" /><h2 className="mt-4 text-xl font-extrabold">Payment never buys around verification.</h2><p className="mt-3 text-[12px] leading-6 text-[#5b6675]">Paid access, Pro status, or transaction funding never overrides credential, eligibility, safety, privacy, capacity, or regulated-work requirements. Automated multi-party payouts remain separate until an approved payout processor is connected.</p><a className="mt-5 inline-flex min-h-[44px] items-center gap-2 bg-[#174ea6] px-5 text-xs font-extrabold text-white" href={KLINIKOS_GODADDY_PAYLINK} rel="noreferrer" target="_blank">Open approved checkout <ArrowRight className="size-4" /></a></div></div>
      </section>
    </main>
  );
}
