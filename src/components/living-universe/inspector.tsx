import { CircleCheck, CircleMinus, ShieldCheck } from "lucide-react";
import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";
import type { MemberInspectorProjection } from "@/components/living-universe/universe-shell";
import type { MemberPlaneLensProjection } from "@/components/living-universe/plane-lens";

type InspectorProps = {
  inspector: MemberInspectorProjection;
  activeLens: CanonicalPlaneId;
  lens: MemberPlaneLensProjection;
};

function InspectorContent({ inspector, lens }: Pick<InspectorProps, "inspector" | "lens">) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#aa7d76]">{inspector.eyebrow}</p>
      <h2 className="mt-3 text-lg font-light tracking-[-.025em] text-[#f0e6e2]">{inspector.title}</h2>
      <p className="mt-3 text-[12px] leading-6 text-[#aa9792]">{inspector.body}</p>

      <div className="mt-6 border-t border-white/[.065] pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#9f8985]">Current lens</p>
        <p className="mt-2 text-[12px] font-semibold text-[#d7b0a9]">{lens.title}</p>
        <p className="mt-1.5 text-[11px] leading-5 text-[#93807c]">{lens.description}</p>
      </div>

      <div className="mt-6 border-t border-white/[.065] pt-5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#9f8985]">
          <CircleCheck aria-hidden="true" className="size-3.5 text-[#73ad98]" /> Evidence
        </p>
        <ul className="mt-3 space-y-2.5">
          {inspector.evidence.map((item) => (
            <li className="flex gap-2.5 text-[11px] leading-5 text-[#b3a09b]" key={item}>
              <span aria-hidden="true" className="mt-[8px] size-1.5 shrink-0 rounded-full bg-[#7eaa99]" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-white/[.065] pt-5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#9f8985]">
          <ShieldCheck aria-hidden="true" className="size-3.5 text-[#d19a90]" /> Authority
        </p>
        <ul className="mt-3 space-y-2.5">
          {inspector.authority.map((item) => (
            <li className="flex gap-2.5 text-[11px] leading-5 text-[#b3a09b]" key={item}>
              <CircleMinus aria-hidden="true" className="mt-1 size-3 shrink-0 text-[#aa7770]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Inspector({ inspector, activeLens, lens }: InspectorProps) {
  return (
    <>
      <aside
        aria-label="Inspector"
        className="hidden rounded-[26px] border border-white/[.07] bg-[#0d0809]/90 p-5 xl:block"
        data-active-plane={activeLens}
      >
        <InspectorContent inspector={inspector} lens={lens} />
      </aside>

      <details
        className="group rounded-2xl border border-white/[.08] bg-[#0d0809]/95 xl:hidden"
        data-mobile-inspector="true"
      >
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[11px] font-semibold text-[#ddc9c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d99287] [&::-webkit-details-marker]:hidden">
          Open Inspector
          <span aria-hidden="true" className="text-[#9b7771] transition group-open:rotate-45 motion-reduce:transition-none">+</span>
        </summary>
        <div className="border-t border-white/[.065] p-5">
          <InspectorContent inspector={inspector} lens={lens} />
        </div>
      </details>
    </>
  );
}
