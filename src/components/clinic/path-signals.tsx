import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDot, MoveRight } from "lucide-react";
import type { LivingPathSignal } from "@/lib/orchestration/path-signal-repository";

function relativeTime(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(delta / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function PathSignals({ signals }: { signals: LivingPathSignal[] }) {
  if (!signals.length) return null;

  return (
    <section aria-labelledby="moving-heading" className="mx-auto -mt-7 max-w-5xl px-5 sm:px-8 lg:px-12">
      <div className="border-t border-[#0b1e3a]/8 pt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MoveRight className="size-3.5 text-[#1677a8]" />
            <h2 className="text-[12px] font-extrabold uppercase tracking-[.18em] text-[#0b1e3a]/55" id="moving-heading">Moving</h2>
          </div>
          <span className="text-[12px] font-semibold text-[#0b1e3a]/35">Recent Path changes</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {signals.slice(0, 6).map((signal) => {
            const Icon = signal.kind === "completed" ? CheckCircle2 : CircleDot;
            return (
              <Link
                className="group flex items-start gap-3 rounded-2xl border border-[#0b1e3a]/8 bg-white/75 p-4 transition hover:border-[#1677a8]/25 hover:bg-white"
                href={`/paths/${signal.pathId}`}
                key={signal.id}
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#edf6fb] text-[#1677a8]"><Icon className="size-3.5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold text-[#0b1e3a]">{signal.label}</span>
                  <span className="mt-1 block text-[12px] leading-5 text-[#0b1e3a]/42">{signal.pathTitle} · {relativeTime(signal.occurredAt)}</span>
                </span>
                <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-[#0b1e3a]/20 transition group-hover:text-[#1677a8]" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
