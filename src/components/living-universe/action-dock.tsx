import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { MemberHomeAction } from "@/components/living-universe/universe-shell";

const ALLOWED_MEMBER_ACTIONS = new Set<MemberHomeAction["href"]>(["/grid", "/edu", "/member"]);

export function ActionDock({ actions }: { actions: MemberHomeAction[] }) {
  const safeActions = actions.filter((action) => ALLOWED_MEMBER_ACTIONS.has(action.href));

  if (safeActions.length === 0) return null;

  return (
    <nav
      aria-label="Next actions"
      className="sticky bottom-4 z-20 mt-5 rounded-[22px] border border-[#bd7b72]/25 bg-[#120a0c]/95 p-2.5 shadow-[0_22px_70px_rgba(0,0,0,.46)] backdrop-blur-xl"
      data-action-dock="true"
    >
      <div className="flex items-center gap-2 overflow-x-auto">
        <p className="hidden shrink-0 px-3 text-[11px] font-semibold uppercase tracking-[.18em] text-[#816d69] sm:block">
          Next actions
        </p>
        {safeActions.map((action, index) => (
          <Link
            className={`group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d99287] motion-reduce:transition-none ${
              index === 0
                ? "border-[#d18b81]/40 bg-[#c47c72] text-[#190a0c] hover:bg-[#dda096]"
                : "border-white/10 bg-white/[.025] text-[#d8c5c0] hover:border-[#c7867d]/40 hover:bg-[#251416]"
            }`}
            href={action.href}
            key={action.id}
            title={action.description}
          >
            {action.label}
            <ArrowUpRight aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
