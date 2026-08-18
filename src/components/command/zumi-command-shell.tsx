import Link from "next/link";
import { Radio, ShieldAlert, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { DsSurface } from "@/components/ds";
import { HUMAN_REVIEW_NOTICE, missionPhases, NO_PHI_NOTICE, type MissionPhaseKey } from "@/lib/sales/zumi-command";

/** Klinikos command surface with Zumi as the embedded intelligence layer. */
export function ZumiCommandShell({ children }: { children: React.ReactNode }) {
  return (
    <DsSurface>
      <div className="min-h-screen" style={{ background: "var(--obsidian)", color: "var(--text-primary)" }}>
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2 focus:text-sm focus:font-bold"
          href="#zumi-main"
          style={{ background: "var(--cyan-300)", color: "var(--obsidian)", borderRadius: "var(--radius-sm)" }}
        >
          Skip to main content
        </a>

        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
          style={{ background: "radial-gradient(ellipse at top, color-mix(in oklch, var(--aegean-700) 34%, transparent), transparent 62%)" }}
        />

        <header className="relative" role="banner" style={{ borderBottom: "var(--border-hair-dark)" }}>
          <div className="mx-auto flex min-h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
            <KlinikosWordmark href="/" markClassName="h-8 w-8" textClassName="text-xs" />
            <p className="ml-auto flex items-center gap-2 text-[12px] font-bold uppercase" style={{ color: "var(--cyan-400)", letterSpacing: "var(--tracking-wide)" }}>
              <Radio aria-hidden="true" className="size-3.5" />
              Klinikos Intelligence ready
            </p>
          </div>
        </header>

        <main className="relative" id="zumi-main">{children}</main>
        <KlinikosSafetyFooter />
      </div>
    </DsSurface>
  );
}

export function ZumiAssistantOrb({ active = false, label = "Klinikos Intelligence" }: { active?: boolean; label?: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex size-9 items-center justify-center">
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full ${active ? "motion-safe:animate-pulse" : ""}`}
          style={{ border: "1px solid color-mix(in oklch, var(--cyan-400) 48%, transparent)", background: "color-mix(in oklch, var(--cyan-500) 10%, transparent)" }}
        />
        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: "var(--cyan-300)", boxShadow: "0 0 12px color-mix(in oklch, var(--cyan-300) 88%, transparent)" }} />
      </span>
      <span className="text-[11px] font-extrabold uppercase" style={{ color: "var(--cyan-300)", letterSpacing: "var(--tracking-wide)" }}>{label}</span>
    </span>
  );
}

export function ZumiBriefingPanel({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div className="p-5 backdrop-blur-sm sm:p-6" style={{ background: "var(--surface-raised)", border: "var(--border-hair-dark)", borderRadius: "var(--radius-md)" }}>
      <ZumiAssistantOrb active={active} />
      <div className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{children}</div>
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
                className="size-1.5 rounded-full"
                style={{ background: state === "current" ? "var(--cyan-300)" : state === "complete" ? "color-mix(in oklch, var(--cyan-300) 42%, transparent)" : "color-mix(in oklch, var(--text-primary) 20%, transparent)" }}
              />
              <span
                className="text-[12px] font-bold uppercase"
                style={{ color: state === "current" ? "var(--cyan-300)" : "var(--text-secondary)", letterSpacing: "var(--tracking-wide)" }}
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
    <p
      className="flex gap-3 px-4 py-3 text-[11px] leading-5"
      style={{ color: "var(--gold-200)", background: "color-mix(in oklch, var(--gold-500) 8%, transparent)", border: "1px solid color-mix(in oklch, var(--gold-500) 30%, transparent)", borderRadius: "var(--radius-sm)" }}
    >
      <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span><strong className="font-extrabold">Human Review Required.</strong> {HUMAN_REVIEW_NOTICE}</span>
    </p>
  );
}

export function NoPHINotice() {
  return (
    <p
      className="flex gap-3 px-4 py-3 text-[11px] leading-5"
      style={{ color: "var(--status-signal)", background: "color-mix(in oklch, var(--status-signal) 8%, transparent)", border: "1px solid color-mix(in oklch, var(--status-signal) 30%, transparent)", borderRadius: "var(--radius-sm)" }}
    >
      <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span><strong className="font-extrabold">No PHI.</strong> {NO_PHI_NOTICE}</span>
    </p>
  );
}

export function KlinikosSafetyFooter() {
  return (
    <footer className="relative" style={{ borderTop: "var(--border-hair-dark)" }}>
      <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
        <p className="max-w-4xl text-[11px] leading-6" style={{ color: "var(--text-secondary)" }}>
          Klinikos is an engineering foundation built toward regulated healthcare deployment. Zumi is Klinikos Intelligence, the assistance layer inside Klinikos. Klinikos is not a certified electronic health record, a production clinical system, a clearinghouse, a diagnostic tool, or a substitute for licensed clinical judgment. Production activation requires review. Klinikos Intelligence organises operational information and drafts administrative work for a human to approve; it does not diagnose, prescribe, decide treatment, guarantee coverage, submit claims, or release records.
        </p>
        <div className="mt-6 flex flex-wrap gap-5 text-[11px] font-bold">
          <Link className="hover:underline" style={{ color: "var(--text-secondary)" }} href="/legal/privacy">Privacy notice</Link>
          <Link className="hover:underline" style={{ color: "var(--text-secondary)" }} href="/legal/terms">Terms</Link>
          <Link className="hover:underline" style={{ color: "var(--text-secondary)" }} href="/legal/ai">AI terms</Link>
        </div>
      </div>
    </footer>
  );
}
