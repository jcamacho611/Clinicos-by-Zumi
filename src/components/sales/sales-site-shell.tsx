import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";

const publicLinks = [
  ["/demo", "Demo"],
  ["/grid/browse", "Grid"],
  ["/private-demo", "Private workflow review"],
  ["/founding-clinic", "Founding clinics"],
  ["/sales", "Operating analysis"],
] as const;

export function SalesSiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="sales-canvas min-h-screen overflow-hidden bg-[#050303] text-[#f8efed]" data-klinikos-ds>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(132,31,39,.26),transparent_31%),radial-gradient(circle_at_88%_8%,rgba(230,129,123,.08),transparent_25%),radial-gradient(circle_at_14%_82%,rgba(112,32,39,.1),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-20 [background-image:linear-gradient(rgba(239,170,161,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(239,170,161,.025)_1px,transparent_1px)] [background-size:56px_56px]" />
      <header className="relative z-30 border-b border-[#e28b85]/10 bg-[#050303]/82 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center gap-6 px-5 sm:px-8 lg:px-12">
          <KlinikosWordmark href="/" framed inverse markClassName="h-7 w-7" textClassName="h-[21px] w-auto" className="gap-3" />
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {publicLinks.map(([href, label]) => (
              <Link className="rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[.13em] text-[#9f8985] transition hover:bg-[#e6817b]/[.06] hover:text-[#f8efed]" href={href} key={href}>{label}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            <Link className="hidden items-center gap-2 rounded-full border border-[#e6817b]/24 px-4 py-2.5 text-[11px] font-semibold text-[#eaa29b] transition hover:border-[#efaaa1]/45 hover:bg-[#e6817b]/[.05] hover:text-[#fff8f6] sm:inline-flex" href="/grid/browse">Explore Grid</Link>
            <Link className="inline-flex items-center gap-2 rounded-full border border-[#efaaa1]/18 bg-[#e6817b] px-4 py-2.5 text-[11px] font-semibold text-[#190a0c] transition hover:bg-[#efaaa1]" href="/login">Sign in <ArrowUpRight className="size-3.5" /></Link>
          </div>
        </div>
      </header>
      <div className="relative z-10">{children}</div>
      <footer className="relative z-10 border-t border-[#e28b85]/10 px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 text-xs text-[#8f7773] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-[#d9948d]" /><p>Demonstrations use synthetic data. Do not enter real patient information unless production activation is explicitly approved.</p></div>
          <div className="flex flex-wrap gap-5 font-semibold"><Link className="hover:text-[#f8efed]" href="/grid/browse">Grid</Link><Link className="hover:text-[#f8efed]" href="/legal/privacy">Privacy</Link><Link className="hover:text-[#f8efed]" href="/legal/terms">Terms</Link></div>
        </div>
      </footer>
    </main>
  );
}
