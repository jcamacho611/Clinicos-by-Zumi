import Link from "next/link";
import { ArrowLeft, BookOpen, Boxes, HeartHandshake, PackageSearch, Sparkles, Wrench } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";

export const metadata = { title: "Seller & capacity portal — Klinikos Grid" };

const lanes = {
  product: { icon: PackageSearch, eyebrow: "Products & supplies", title: "Sell permitted healthcare products and supplies.", body: "Publish what you have, quantity, price, availability, buyer restrictions, and fulfillment method. Restricted medications and other controlled items are not treated as open marketplace inventory." },
  equipment: { icon: Wrench, eyebrow: "Equipment", title: "Make equipment and operational capacity discoverable.", body: "List rentable or bookable equipment, permitted uses, location, availability, rates, and operator requirements." },
  service: { icon: Sparkles, eyebrow: "Professional services", title: "Offer healthcare business and operational services.", body: "Billing, coding, credentialing, recruiting, staffing, cybersecurity, IT, consulting, accounting, translation, and other professional services can use a non-clinical policy lane." },
  education: { icon: BookOpen, eyebrow: "Education capacity", title: "Offer preceptorships, placements, training seats, and learning capacity.", body: "Education supply should match students and institutions without being forced into provider or room-rental workflows." },
  referral: { icon: HeartHandshake, eyebrow: "Referral & partner capacity", title: "Publish permitted referral, consultation, diagnostic, and partner capacity.", body: "This lane connects to governed Network handoffs where consent, agreements, purpose, and minimum-necessary rules apply." },
} as const;

export default async function GridSellerJoinPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const key = type && type in lanes ? type as keyof typeof lanes : "service";
  const lane = lanes[key];
  const Icon = lane.icon;
  return <main className="min-h-screen bg-[#f7f8fa] text-[#0b1220]">
    <header className="border-b border-[#e2e6ea] bg-white"><div className="mx-auto flex h-20 max-w-[1400px] items-center px-5 sm:px-8"><Link className="flex items-center gap-3" href="/grid"><BrandMark /><span><span className="block text-sm font-extrabold">Klinikos Grid</span><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-[#174ea6]">Seller & capacity portal</span></span></Link><Link className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-[#5b6675]" href="/grid"><ArrowLeft className="size-4"/>Back to Grid</Link></div></header>
    <section className="border-b border-[#dfe3e8] bg-white"><div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#174ea6]">{lane.eyebrow}</p><div className="mt-4 grid gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end"><div><h1 className="max-w-4xl text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">{lane.title}</h1><p className="mt-6 max-w-3xl text-sm leading-7 text-[#5b6675]">{lane.body}</p></div><div className="border border-[#dfe3e8] bg-[#fbfcfd] p-6"><Icon className="size-6 text-[#174ea6]"/><p className="mt-4 text-sm font-extrabold">One universal seller model</p><p className="mt-2 text-[12px] leading-6 text-[#5b6675]">Grid asks only the lane-specific rules after it knows what you are offering. The same seller identity can support multiple inventory types later.</p></div></div></div></section>
    <section className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8"><div className="grid gap-8 lg:grid-cols-5">{[["1","What are you offering?"],["2","Who can buy or access it?"],["3","Where and when is it available?"],["4","What does it cost?"],["5","How is it fulfilled?"]].map(([n,t])=><div className="border border-[#dfe3e8] bg-white p-5" key={n}><span className="text-[10px] font-black text-[#174ea6]">0{n}</span><h2 className="mt-5 text-sm font-extrabold">{t}</h2><p className="mt-2 text-[11px] leading-5 text-[#5b6675]">Grid progressively collects only what this inventory class needs.</p></div>)}</div><div className="mt-10 border border-dashed border-[#aeb8c2] bg-white p-8 text-center"><Boxes className="mx-auto size-6 text-[#174ea6]"/><h3 className="mt-4 text-lg font-extrabold">Seller inventory manager connects here</h3><p className="mx-auto mt-2 max-w-2xl text-[12px] leading-6 text-[#5b6675]">The current app already has organization inventory models and Grid service listings. This portal establishes the role-specific public experience while the universal inventory transaction model is completed behind it.</p><Link className="mt-6 inline-flex min-h-[44px] items-center bg-[#0b1220] px-5 text-xs font-extrabold text-white" href="/login">Sign in to manage listings</Link></div></section>
  </main>;
}
