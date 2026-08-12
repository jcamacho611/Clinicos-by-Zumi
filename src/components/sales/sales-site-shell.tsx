import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";

const publicLinks = [
  ["/demo", "Demo"],
  ["/grid/browse", "Grid"],
  ["/private-demo", "Private workflow review"],
  ["/founding-clinic", "Founding clinics"],
  ["/sales", "Operating analysis"],
] as const;

export function SalesSiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="sales-canvas min-h-screen overflow-hidden bg-[#05080c] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,.12),transparent_26%),radial-gradient(circle_at_88%_2%,rgba(34,211,238,.1),transparent_23%),radial-gradient(circle_at_72%_78%,rgba(245,158,11,.07),transparent_27%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:48px_48px]" />
      <header className="relative z-30 border-b border-white/[.08] bg-[#05080c]/80 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center gap-6 px-5 sm:px-8 lg:px-12">
          <Link className="flex items-center gap-3" href="/">
            <span className="rounded-xl bg-white p-1"><BrandMark /></span>
            <span><span className="block text-sm font-black tracking-[-.03em]">Klinikos</span><span className="block text-[9px] font-bold uppercase tracking-[.22em] text-amber-300">The Clinic Operating System</span></span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {publicLinks.map(([href, label]) => <Link className="rounded-full px-4 py-2 text-[11px] font-bold text-slate-400 transition hover:bg-white/[.06] hover:text-white" href={href} key={href}>{label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            <Link className="hidden items-center gap-2 rounded-full border border-cyan-300/25 px-4 py-2.5 text-[11px] font-black text-cyan-200 transition hover:border-cyan-300/50 hover:text-white sm:inline-flex" href="/grid/browse">Explore Grid</Link>
            <Link className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2.5 text-[11px] font-black text-slate-950 transition hover:bg-amber-200" href="/login">Sign in <ArrowUpRight className="size-3.5" /></Link>
          </div>
        </div>
      </header>
      <div className="relative z-10">{children}</div>
      <footer className="relative z-10 border-t border-white/[.08] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-emerald-300" /><p>Demonstrations use synthetic data. Do not enter real patient information unless production activation is explicitly approved.</p></div>
          <div className="flex flex-wrap gap-5 font-bold"><Link className="hover:text-white" href="/grid/browse">Grid</Link><Link className="hover:text-white" href="/legal/privacy">Privacy</Link><Link className="hover:text-white" href="/legal/terms">Terms</Link></div>
        </div>
      </footer>
    </main>
  );
}
