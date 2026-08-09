import { cn } from "@/lib/utils";
import type { productStatusLabels } from "@/lib/sales-demo-rules";

type Status = (typeof productStatusLabels)[number];

const styles: Record<Status, string> = {
  Live: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  Demo: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  "Manual fallback": "border-amber-300/25 bg-amber-300/10 text-amber-200",
  "Pending connection": "border-violet-300/25 bg-violet-300/10 text-violet-200",
  Roadmap: "border-slate-400/25 bg-slate-400/10 text-slate-300",
  "Requires production review": "border-orange-300/25 bg-orange-300/10 text-orange-200",
  "Human review required": "border-rose-300/25 bg-rose-300/10 text-rose-200",
};

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em]", styles[status], className)}>{status}</span>;
}
