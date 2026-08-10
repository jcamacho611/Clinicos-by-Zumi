import Link from "next/link";
import { Radio, ShieldAlert, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { HUMAN_REVIEW_NOTICE, missionPhases, NO_PHI_NOTICE, type MissionPhaseKey } from "@/lib/sales/zumi-command";

export function ZumiCommandShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090d12] text-[#f3f5f6]">
      <a className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[#43d9ff] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#090d12]" href="#zumi-main">Skip to main content</a>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(22,119,168,.18),transparent_58%)]" />
      <header className="relative border-b border-white/10" role="banner">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8 lg:px-12">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <span>
              <span className="block text-sm font-extrabold tracking-[-.03em] text-white">Klinikos by Zumi</span>
              <span className="block text-[9px] font-bold uppercase tracking-[.2em] text-[#b89a5b]">Clinic operating intelligence</span>
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-[10px] font-bold uppercase tracking-[.14em] text-white/45 md:flex">
            <Link className="hover:text-white" href="/">Overview</Link>
            <Link className="hover:text-white" href="/founding-clinic">Founding clinic</Link>
            <Link className="hover:text-white" href="/access">Private access</Link>
          </nav>
          <p className="ml-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#43d9ff]">
            <Radio aria-hidden="true" className="size-3.5" /> Zumi standing by
          </p>
        </div>
      </header>
      <main className="relative" id="zumi-main">{children}</main>
      <KlinikosSafetyFooter />
    </div>
  );
}

export function ZumiAssistantOrb({ active = false, label = "Zumi" }: { active?: boolean; label?: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex size-9 items-center justify-center">
        <span aria-hidden="true" className={`absolute inset-0 rounded-full border border-[#43d9ff]/50 bg-[#43d9ff]/10 ${active ? "motion-safe:animate-pulse" : ""}`} />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-[#43d9ff] shadow-[0_0_12px_rgba(67,217,255,.9)]" />
      </span>
      <span className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#9ae9f8]">{label}</span>
    </span>
  );
}

export function ZumiBriefingPanel({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return <div className="border border-white/10 bg-white/[.04] p-5 backdrop-blur-sm sm:p-6"><ZumiAssistantOrb active={active} /><div className="mt-4 text-sm leading-7 text-slate-300">{children}</div></div>;
}

export function MissionPhaseProgress({ current }: { current: MissionPhaseKey }) {
  const currentIndex = missionPhases.findIndex((phase) => phase.key === current);
  return (
    <nav aria-label="Mission phase"><ol className="flex flex-wrap gap-x-5 gap-y-2">
      {missionPhases.map((phase, index) => {
        const state = index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
        return <li className="flex items-center gap-2" key={phase.key}>
          <span aria-hidden="true" className={`size-1.5 rounded-full ${state === "current" ? "bg-[#43d9ff]" : state === "complete" ? "bg-[#43d9ff]/40" : "bg-white/20"}`} />
          <span className={`text-[10px] font-bold uppercase tracking-[.14em] ${state === "current" ? "text-[#9ae9f8]" : "text-slate-500"}`} {...(state === "current" ? { "aria-current": "step" as const } : {})}>{phase.label}</span>
        </li>;
      })}
    </ol></nav>
  );
}

export function HumanReviewBanner() {
  return <p className="flex gap-3 border border-[#b89a5b]/35 bg-[#b89a5b]/[.08] px-4 py-3 text-[11px] leading-5 text-[#e6d5ad]"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span><strong className="font-extrabold">Human Review Required.</strong> {HUMAN_REVIEW_NOTICE}</span></p>;
}

export function NoPHINotice() {
  return <p className="flex gap-3 border border-rose-400/30 bg-rose-500/[.07] px-4 py-3 text-[11px] leading-5 text-rose-200"><ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span><strong className="font-extrabold">No PHI.</strong> {NO_PHI_NOTICE}</span></p>;
}

export function KlinikosSafetyFooter() {
  return (
    <footer className="relative border-t border-white/10">
      <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-12">
        <p className="max-w-4xl text-[11px] leading-6 text-slate-400">Klinikos by Zumi is built toward HIPAA-regulated deployment. It is not currently presented as a certified replacement EHR, diagnostic tool, clearinghouse, or substitute for licensed clinical judgment. Production activation requires separate review, configuration, contracts, vendor readiness and safeguards. Zumi assists operating work; authorized humans retain clinical and financially sensitive decisions.</p>
        <div className="mt-6 flex flex-wrap gap-5 text-[11px] font-bold"><Link className="text-slate-400 hover:text-white" href="/legal/privacy">Privacy notice</Link><Link className="text-slate-400 hover:text-white" href="/legal/terms">Terms</Link><Link className="text-slate-400 hover:text-white" href="/legal/ai">AI terms</Link></div>
      </div>
    </footer>
  );
}
