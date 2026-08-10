import Link from "next/link";
import { Radio, ShieldAlert, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { HUMAN_REVIEW_NOTICE, missionPhases, NO_PHI_NOTICE, type MissionPhaseKey } from "@/lib/sales/zumi-command";

/**
 * Klinikos "Black Ops x Aegean Medical Intelligence" command surface.
 *
 * Graphite/navy base, Aegean blue and restrained cyan for the AI layer, gold used
 * sparingly. Glass panels are built from translucent borders over the dark ground
 * rather than decorative gradients.
 */

export function ZumiCommandShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05090f] text-slate-100">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-cyan-300 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#05090f]"
        href="#zumi-main"
      >
        Skip to main content
      </a>

      {/* Aegean field: a single restrained wash, not a stacked gradient stack. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(23,78,166,.28),transparent_60%)]" />

      <header className="relative border-b border-white/10" role="banner">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <span>
              <span className="block text-sm font-extrabold tracking-[-.03em] text-white">Klinikos by Zumi</span>
              <span className="block text-[9px] font-bold uppercase tracking-[.2em] text-[#e6c55b]">Clinic Command Center</span>
            </span>
          </Link>
          <p className="ml-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-cyan-300">
            <Radio aria-hidden="true" className="size-3.5" />
            Zumi standing by
          </p>
        </div>
      </header>

      <main className="relative" id="zumi-main">{children}</main>

      <KlinikosSafetyFooter />
    </div>
  );
}

/**
 * Zumi's presence marker.
 *
 * A calm, steady indicator rather than an animated character. The `active` state
 * uses a slow pulse that respects reduced-motion preferences.
 */
export function ZumiAssistantOrb({ active = false, label = "Zumi" }: { active?: boolean; label?: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex size-9 items-center justify-center">
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full border border-cyan-300/50 bg-cyan-400/10 ${active ? "motion-safe:animate-pulse" : ""}`}
        />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" />
      </span>
      <span className="text-[11px] font-extrabold uppercase tracking-[.16em] text-cyan-200">{label}</span>
    </span>
  );
}

/** Zumi speaking. Used for the mission brief and every interstitial explanation. */
export function ZumiBriefingPanel({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div className="border border-white/10 bg-white/[.04] p-5 backdrop-blur-sm sm:p-6">
      <ZumiAssistantOrb active={active} />
      <div className="mt-4 text-sm leading-7 text-slate-300">{children}</div>
    </div>
  );
}

export function MissionPhaseProgress({ current }: { current: MissionPhaseKey }) {
  const currentIndex = missionPhases.findIndex((phase) => phase.key === current);

  return (
    <nav aria-label="Mission phase">
      <ol className="flex flex-wrap gap-x-5 gap-y-2">
        {missionPhases.map((phase, index) => {
          const state = index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
          return (
            <li className="flex items-center gap-2" key={phase.key}>
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${state === "current" ? "bg-cyan-300" : state === "complete" ? "bg-cyan-300/40" : "bg-white/20"}`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-[.14em] ${state === "current" ? "text-cyan-200" : "text-slate-500"}`}
                {...(state === "current" ? { "aria-current": "step" as const } : {})}
              >
                {phase.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function HumanReviewBanner() {
  return (
    <p className="flex gap-3 border border-[#e6c55b]/30 bg-[#e6c55b]/[.07] px-4 py-3 text-[11px] leading-5 text-[#f0dda0]">
      <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span><strong className="font-extrabold">Human Review Required.</strong> {HUMAN_REVIEW_NOTICE}</span>
    </p>
  );
}

export function NoPHINotice() {
  return (
    <p className="flex gap-3 border border-rose-400/30 bg-rose-500/[.07] px-4 py-3 text-[11px] leading-5 text-rose-200">
      <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span><strong className="font-extrabold">No PHI.</strong> {NO_PHI_NOTICE}</span>
    </p>
  );
}

export function KlinikosSafetyFooter() {
  return (
    <footer className="relative border-t border-white/10">
      <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
        <p className="max-w-4xl text-[11px] leading-6 text-slate-400">
          Klinikos by Zumi is an engineering foundation built toward regulated healthcare deployment. It is not a certified electronic
          health record, a production clinical system, a clearinghouse, a diagnostic tool, or a substitute for licensed clinical
          judgment. Production activation requires review. Zumi organises operational information and drafts administrative work for a
          human to approve; it does not diagnose, prescribe, decide treatment, guarantee coverage, submit claims, or release records.
        </p>
        <div className="mt-6 flex flex-wrap gap-5 text-[11px] font-bold">
          <Link className="text-slate-400 hover:text-white" href="/legal/privacy">Privacy notice</Link>
          <Link className="text-slate-400 hover:text-white" href="/legal/terms">Terms</Link>
          <Link className="text-slate-400 hover:text-white" href="/legal/ai">AI terms</Link>
        </div>
      </div>
    </footer>
  );
}
