import Link from "next/link";
import { ArrowUpRight, Check, Circle } from "lucide-react";
import type { KlinikosPathNode } from "@/lib/paths/catalog";

const stateLabel: Record<KlinikosPathNode["state"], string> = {
  complete: "Completed",
  current: "Next",
  upcoming: "Upcoming",
  blocked: "Blocked",
};

export function PathRail({ nodes }: { nodes: KlinikosPathNode[] }) {
  return (
    <ol className="space-y-0" aria-label="Path progress">
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1;
        const markerClass = node.state === "complete"
          ? "border-teal-500 bg-teal-500 text-white"
          : node.state === "current"
            ? "border-[#1677a8] bg-white text-[#1677a8] shadow-[0_0_0_5px_rgba(22,119,168,.08)]"
            : node.state === "blocked"
              ? "border-amber-400 bg-amber-50 text-amber-700"
              : "border-[#0b1e3a]/16 bg-white text-[#0b1e3a]/28";

        const body = (
          <div className="group flex min-w-0 items-start justify-between gap-4 py-1">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-extrabold text-[#0b1e3a]">{node.label}</p>
                <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#0b1e3a]/38">{stateLabel[node.state]}</span>
              </div>
              <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#0b1e3a]/55">{node.description}</p>
            </div>
            {node.href ? <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-[#0b1e3a]/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1677a8]" /> : null}
          </div>
        );

        return (
          <li className="grid grid-cols-[28px_1fr] gap-3" key={node.id}>
            <div className="flex flex-col items-center">
              <span className={`grid size-7 place-items-center rounded-full border ${markerClass}`}>
                {node.state === "complete" ? <Check className="size-3.5" /> : <Circle className="size-2.5 fill-current" />}
              </span>
              {!isLast ? <span className="my-1 min-h-8 w-px flex-1 bg-[#0b1e3a]/10" /> : null}
            </div>
            <div className={isLast ? "pb-0" : "pb-6"}>
              {node.href ? <Link href={node.href}>{body}</Link> : body}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
