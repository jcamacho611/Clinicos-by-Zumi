import Link from "next/link";
import { ArrowLeft, Building2, Check, MapPin } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { CapacityIntakeForm } from "@/components/grid/capacity-intake-form";

export const metadata = { title: "List space or organization capacity — Klinikos Grid" };

const steps = [
  ["1", "What are you listing?", "Clinic, room, chair, office, lab capacity, imaging capacity, training space, or organization access."],
  ["2", "Where is it?", "Address, service area, travel context, and whether buyers come to you."],
  ["3", "When is it available?", "Recurring hours, blackout dates, lead time, capacity, and instant-request preference."],
  ["4", "What can it be used for?", "Permitted services, equipment, room rules, credential requirements, insurance requirements, and restrictions."],
  ["5", "What do you want for it?", "Hourly, daily, session, flat, or request-based pricing."],
] as const;

export default function GridLocationJoinPage() {
  return <main className="min-h-screen bg-[#f6f8fa] text-[#0b1220]">
    <header className="border-b border-[#e2e6ea] bg-white"><div className="mx-auto flex h-20 max-w-[1400px] items-center px-5 sm:px-8"><Link className="flex items-center gap-3" href="/grid"><BrandMark /><span><span className="block text-sm font-extrabold">Klinikos Grid</span><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-[#174ea6]">Space & organization portal</span></span></Link><Link className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-[#5b6675]" href="/grid"><ArrowLeft className="size-4"/>Back to Grid</Link></div></header>
    <section className="border-b border-[#dce2e7] bg-[#0b1220] text-white"><div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-cyan-300">I have space or organization capacity</p><h1 className="mt-4 text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">Turn unused capacity into something Grid can fill.</h1><p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300">List only the facts Grid needs first. You can finish operational rules and verification after the basic capacity is created.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="border border-white/10 bg-white/[.05] p-5"><MapPin className="size-5 text-cyan-300"/><p className="mt-4 text-sm font-extrabold">Map-first discovery</p><p className="mt-2 text-xs leading-5 text-slate-400">Marketplace-visible capacity appears on the Grid map once approved.</p></div><div className="border border-white/10 bg-white/[.05] p-5"><Building2 className="size-5 text-amber-300"/><p className="mt-4 text-sm font-extrabold">One owner portal</p><p className="mt-2 text-xs leading-5 text-slate-400">Rooms, chairs, facilities, lab slots, imaging capacity, and other spaces share one capacity model.</p></div></div></div></section>
    <section className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8"><div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]"><aside><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Simple setup</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em]">Create the listing first. Refine it second.</h2><p className="mt-4 text-sm leading-7 text-[#5b6675]">Instead of one giant form, Grid asks only what is necessary to create a capacity draft. Publication, account connection, and any required verification happen after the basics are captured.</p><div className="mt-7 border-t border-[#dfe3e8]">{steps.map(([n,title,body])=><div className="grid gap-3 border-b border-[#dfe3e8] py-4 sm:grid-cols-[40px_1fr_auto] sm:items-center" key={n}><span className="grid size-8 place-items-center rounded-full bg-[#174ea6] text-xs font-black text-white">{n}</span><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-[11px] leading-5 text-[#5b6675]">{body}</p></div><Check className="size-4 text-[#0f766e]"/></div>)}</div></aside><CapacityIntakeForm /></div></section>
  </main>;
}
