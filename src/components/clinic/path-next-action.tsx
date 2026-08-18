import Link from "next/link";
import { ArrowRight, CircleAlert, Clock3, ShieldCheck } from "lucide-react";

export type PathGuidanceView = {
  instanceId: string;
  pathId: string;
  state: "available" | "recommended" | "blocked" | "waiting" | "completed" | "review_required";
  title: string;
  reason: string;
  href: string | null;
  capabilityKey: string | null;
  blockers: Array<{
    code: string;
    title: string;
    explanation: string;
    owner: "user" | "clinic" | "reviewer" | "connector" | "system";
    canResolveNow: boolean;
    alternatives: Array<{ title: string; description: string; capabilityKey?: string | null; href?: string | null }>;
  }>;
};

function stateCopy(state: PathGuidanceView["state"]) {
  if (state === "blocked") return { label: "Blocked", icon: CircleAlert };
  if (state === "review_required") return { label: "Requires review", icon: ShieldCheck };
  if (state === "waiting") return { label: "Waiting", icon: Clock3 };
  return { label: "Recommended", icon: ArrowRight };
}

export function PathNextAction({ guidance }: { guidance: PathGuidanceView }) {
  const state = stateCopy(guidance.state);
  const StateIcon = state.icon;

  return (
    <section className="mt-6 border-t border-[#0b1e3a]/8 pt-6" aria-labelledby={`next-action-${guidance.instanceId}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[.16em] text-[#1677a8]">
            <StateIcon className="size-3.5" /> {state.label}
          </div>
          <h3 className="mt-2 text-lg font-extrabold tracking-[-.035em] text-[#0b1e3a]" id={`next-action-${guidance.instanceId}`}>{guidance.title}</h3>
          <p className="mt-2 text-xs leading-6 text-[#0b1e3a]/58">{guidance.reason}</p>
        </div>
        {guidance.href ? (
          <Link className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0b1e3a] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#12315a]" href={guidance.href}>
            Continue <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>

      {guidance.blockers.length ? (
        <div className="mt-5 space-y-3">
          {guidance.blockers.map((blocker) => (
            <div className="rounded-2xl border border-[#0b1e3a]/9 bg-[#f8fbfc] p-4" key={blocker.code}>
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#b08d24]" />
                <div>
                  <p className="text-xs font-extrabold text-[#0b1e3a]">{blocker.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#0b1e3a]/56">{blocker.explanation}</p>
                  {blocker.alternatives.map((alternative) => (
                    <div className="mt-3 text-[11px] leading-5 text-[#0b1e3a]/65" key={`${blocker.code}:${alternative.title}`}>
                      <span className="font-extrabold text-[#1677a8]">Alternative: {alternative.title}.</span> {alternative.description}
                      {alternative.href ? <Link className="ml-1 font-extrabold text-[#1677a8]" href={alternative.href}>Open</Link> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
