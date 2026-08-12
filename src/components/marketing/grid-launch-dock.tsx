import Link from "next/link";
import { ArrowUpRight, Building2, MapPinned, Radar, Search, Sparkles } from "lucide-react";

const lanes = [
  { label: "I need something", href: "/grid", icon: Search },
  { label: "I have something", href: "/grid#supply", icon: Building2 },
] as const;

export function GridLaunchDock() {
  return <aside aria-label="Klinikos Grid public entry" className="pointer-events-none fixed inset-x-0 bottom-3 z-[70] px-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[390px] sm:px-0">
    <div className="pointer-events-auto overflow-hidden rounded-[1.4rem] border border-cyan-200/20 bg-[#050b13]/95 shadow-[0_24px_80px_rgba(1,8,18,.62)] backdrop-blur-xl">
      <div className="relative overflow-hidden border-b border-white/10 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="relative grid size-9 shrink-0 place-items-center rounded-full border border-cyan-200/25 bg-cyan-200/10 text-cyan-100">
            <Radar className="size-4" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[#050b13] bg-emerald-300" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200">Klinikos Grid</p><span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[.1em] text-emerald-200">Explore</span></div>
            <p className="mt-1 truncate text-xs font-extrabold tracking-[-.02em] text-white">Healthcare people + capacity + opportunity</p>
          </div>
          <Link aria-label="Open Klinikos Grid" className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.06] text-white/70 transition hover:border-cyan-200/30 hover:bg-cyan-200/10 hover:text-cyan-100" href="/grid"><ArrowUpRight className="size-4" /></Link>
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="grid grid-cols-[1.1fr_.9fr] gap-px bg-white/10">
          <Link className="group relative overflow-hidden bg-[#07111d] p-4 transition hover:bg-[#091827]" href="/grid/browse">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_15%_20%,rgba(103,232,249,.25),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(59,130,246,.2),transparent_20%),linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:auto,auto,22px_22px,22px_22px]" />
            <div className="relative flex h-[92px] flex-col justify-between"><div className="flex items-center justify-between"><MapPinned className="size-4 text-cyan-200" /><span className="text-[8px] font-black uppercase tracking-[.14em] text-white/35">Map first</span></div><div><p className="text-sm font-black text-white">Open Grid</p><p className="mt-1 text-[9px] leading-4 text-white/40">Browse visible people, services, and capacity.</p></div></div>
          </Link>
          <div className="grid bg-[#07111d]">
            {lanes.map(({ label, href, icon: Icon }) => <Link className="group flex items-center justify-between gap-3 border-b border-white/10 px-4 last:border-0 hover:bg-white/[.035]" href={href} key={label}><span className="flex items-center gap-2"><Icon className="size-3.5 text-amber-200" /><span className="text-[10px] font-extrabold text-white/65 group-hover:text-white">{label}</span></span><ArrowUpRight className="size-3 text-white/25 group-hover:text-cyan-200" /></Link>)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 bg-[#050b13] px-4 py-2.5 text-[8px] uppercase tracking-[.13em] text-white/30"><span className="inline-flex items-center gap-1.5"><Sparkles className="size-3 text-amber-200/70" />Eligibility + fit stay policy-gated</span><Link className="font-extrabold text-cyan-200/70 hover:text-cyan-100" href="/grid/pricing">Pricing</Link></div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-white/10 sm:hidden">
        <Link className="flex min-h-12 items-center justify-center gap-1.5 bg-[#07111d] text-[9px] font-extrabold text-white" href="/grid"><Search className="size-3.5 text-cyan-200" />I need</Link>
        <Link className="flex min-h-12 items-center justify-center gap-1.5 bg-[#07111d] text-[9px] font-extrabold text-white" href="/grid#supply"><Building2 className="size-3.5 text-amber-200" />I have</Link>
        <Link className="flex min-h-12 items-center justify-center gap-1.5 bg-[#07111d] text-[9px] font-extrabold text-white" href="/grid/browse"><MapPinned className="size-3.5 text-emerald-200" />Map</Link>
      </div>
    </div>
  </aside>;
}
