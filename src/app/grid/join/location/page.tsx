import Link from "next/link";
import { ArrowLeft, Building2, Check, MapPin } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { CapacityIntakeForm } from "@/components/grid/capacity-intake-form";

export const metadata = { title: "List space or organization capacity — Klinikos Grid" };

const steps = [
  ["1", "What are you listing?", "Clinic, room, chair, office, lab capacity, imaging capacity, training space, or organization access."],
  ["2", "Where is it?", "City, state, service area, and where the capacity can be used."],
  ["3", "When is it available?", "An actual availability window and the amount of capacity Grid can reserve."],
  ["4", "What can it be used for?", "Permitted use and the boundaries Grid must preserve before a match can proceed."],
  ["5", "What do you want for it?", "Hourly, daily, flat, or request-based pricing."],
] as const;

export default async function GridLocationJoinPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const organizationMode = type === "organization";
  const mode = organizationMode ? "organization" : "space";

  return <main className="min-h-screen bg-[#f6f8fa] text-[#0b1220]">
    <header className="border-b border-[#e2e6ea] bg-white"><div className="mx-auto flex h-20 max-w-[1400px] items-center px-5 sm:px-8"><Link className="flex items-center gap-3" href="/grid"><BrandMark /><span><span className="block text-sm font-extrabold">Klinikos Grid</span><span className="block text-[11px] font-bold uppercase tracking-[.18em] text-[#174ea6]">{organizationMode ? "Organization capacity" : "Space & capacity"}</span></span></Link><Link className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-[#5b6675]" href="/grid"><ArrowLeft className="size-4"/>Back to Grid</Link></div></header>
    <section className="border-b border-[#dce2e7] bg-[#0b1220] text-white"><div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-cyan-300">{organizationMode ? "I represent an organization" : "I have space"}</p><h1 className="mt-4 text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">{organizationMode ? "Put real organization capacity into Grid." : "Turn unused space into capacity Grid can fill."}</h1><p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300">Create the account and the first real capacity record together. The resource stays unavailable to public transactions until the applicable Grid review succeeds.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="border border-white/10 bg-white/[.05] p-5"><MapPin className="size-5 text-cyan-300"/><p className="mt-4 text-sm font-extrabold">Map-first discovery</p><p className="mt-2 text-xs leading-5 text-slate-400">Marketplace-visible capacity can appear in geographic discovery only after review and publication.</p></div><div className="border border-white/10 bg-white/[.05] p-5"><Building2 className="size-5 text-amber-300"/><p className="mt-4 text-sm font-extrabold">One Grid account</p><p className="mt-2 text-xs leading-5 text-slate-400">The owner can sign in after enrollment, add more resources, review offers, track bookings, and see economic state.</p></div></div></div></section>
    <section className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8"><div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]"><aside><p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Real setup</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em]">Create the account and resource once.</h2><p className="mt-4 text-sm leading-7 text-[#5b6675]">This path now writes to the Grid resource registry. A successful screen means the account and resource actually exist; it does not mean the resource has been approved.</p><div className="mt-7 border-t border-[#dfe3e8]">{steps.map(([n,title,body])=><div className="grid gap-3 border-b border-[#dfe3e8] py-4 sm:grid-cols-[40px_1fr_auto] sm:items-center" key={n}><span className="grid size-8 place-items-center rounded-full bg-[#174ea6] text-xs font-black text-white">{n}</span><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-[11px] leading-5 text-[#5b6675]">{body}</p></div><Check className="size-4 text-[#0f766e]"/></div>)}</div></aside><CapacityIntakeForm mode={mode} /></div></section>
  </main>;
}
