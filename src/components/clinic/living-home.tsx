"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, GraduationCap, HeartPulse, Search, Sparkles, Stethoscope } from "lucide-react";
import { PathNextAction, type PathGuidanceView } from "@/components/clinic/path-next-action";
import { PathRail } from "@/components/clinic/path-rail";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import { getKlinikosPath } from "@/lib/paths/catalog";

const doorwayActions = [
  { label: "RUN CARE", description: "Operate or grow a clinic", href: "/front-desk", icon: Stethoscope },
  { label: "FIND WORK", description: "Join or use the healthcare network", href: "/grid", icon: BriefcaseBusiness },
  { label: "LEARN", description: "Build skills and professional capability", href: "/edu", icon: GraduationCap },
  { label: "GET CARE", description: "Find and manage healthcare", href: "/portal", icon: HeartPulse },
] as const;

export function LivingHome({
  firstName,
  initialPaths,
  initialGuidance,
}: {
  firstName: string;
  initialPaths: PersistedPathSnapshot[];
  initialGuidance: PathGuidanceView[];
}) {
  const [intent, setIntent] = useState("");
  const [paths, setPaths] = useState(initialPaths);
  const [guidance, setGuidance] = useState(initialGuidance);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(initialPaths[0]?.instanceId ?? null);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const activeSnapshot = useMemo(
    () => paths.find((path) => path.instanceId === selectedInstanceId) ?? paths[0] ?? null,
    [paths, selectedInstanceId],
  );
  const activeGuidance = useMemo(
    () => guidance.find((item) => item.instanceId === activeSnapshot?.instanceId) ?? null,
    [guidance, activeSnapshot?.instanceId],
  );
  const activeDefinition = activeSnapshot ? getKlinikosPath(activeSnapshot.pathId) : null;
  const activeRuntime = activeSnapshot
    ? resolvePathRuntime({ pathId: activeSnapshot.pathId, snapshot: activeSnapshot })
    : null;
  const railNodes = activeDefinition?.nodes.map((node) => ({
    ...node,
    state: activeRuntime?.nodes.find((runtimeNode) => runtimeNode.id === node.id)?.state ?? node.state,
  })) ?? [];

  async function submitIntent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const resolved = resolveIntentDeterministically(intent);
    const pathId = resolved.candidatePathIds[0] ?? null;
    if (!pathId) {
      setMessage(resolved.clarificationQuestions[0] ?? "Klinikos needs one more detail before it can create a Path.");
      return;
    }

    setState("saving");
    try {
      const response = await fetch("/api/paths", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pathId, goal: intent }),
      });
      const payload = await response.json() as { data?: PersistedPathSnapshot; guidance?: PathGuidanceView | null; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Klinikos could not start this Path.");

      setPaths((current) => [payload.data!, ...current.filter((path) => path.instanceId !== payload.data!.instanceId)]);
      if (payload.guidance) {
        setGuidance((current) => [payload.guidance!, ...current.filter((item) => item.instanceId !== payload.guidance!.instanceId)]);
      }
      setSelectedInstanceId(payload.data.instanceId);
      setIntent("");
      setState("idle");
      setMessage("Path started. Klinikos resolved the next governed action from your current context.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Klinikos could not start this Path.");
    }
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-[#0b1e3a]/8 bg-[radial-gradient(circle_at_top_right,rgba(22,119,168,.08),transparent_32%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-5 py-8 shadow-[0_24px_80px_rgba(11,30,58,.07)] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#1677a8]"><Sparkles className="size-3.5" /> Klinikos</div>
          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-[-.055em] text-[#0b1e3a] sm:text-5xl lg:text-6xl">{activeSnapshot ? `Good morning, ${firstName}.` : "What needs to happen?"}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#0b1e3a]/58">
            {activeSnapshot ? "Continue exactly where you left off. Klinikos now resolves the next safe action, review requirement, or blocker from the live Path state." : "Tell Klinikos the outcome you want. The interface will assemble the relevant workflow across care, Grid, learning, and operations."}
          </p>
        </div>

        <form className="mx-auto mt-8 max-w-3xl" onSubmit={submitIntent}>
          <label className="sr-only" htmlFor="klinikos-intent">What are you trying to accomplish?</label>
          <div className="flex items-center gap-3 rounded-2xl border border-[#0b1e3a]/12 bg-white p-2.5 shadow-[0_16px_45px_rgba(11,30,58,.08)] focus-within:border-[#1677a8]/45 focus-within:ring-4 focus-within:ring-[#1677a8]/8">
            <Search className="ml-2 size-5 shrink-0 text-[#0b1e3a]/32" />
            <input
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-semibold text-[#0b1e3a] outline-none placeholder:text-[#0b1e3a]/32"
              id="klinikos-intent"
              onChange={(event) => { setIntent(event.target.value); if (state === "error") setState("idle"); }}
              placeholder="I need an injector Saturday..."
              value={intent}
            />
            <button disabled={state === "saving" || intent.trim().length < 2} className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1e3a] text-white transition hover:bg-[#12315a] disabled:cursor-not-allowed disabled:opacity-40" type="submit" aria-label="Create a Klinikos Path">
              <ArrowRight className="size-4" />
            </button>
          </div>
          {message ? <p className={`mt-3 text-center text-[11px] ${state === "error" ? "text-rose-700" : "text-[#0b1e3a]/52"}`} aria-live="polite">{message}</p> : null}
        </form>

        {activeDefinition && activeRuntime && activeSnapshot ? (
          <div className="mx-auto mt-10 max-w-3xl rounded-[24px] border border-[#0b1e3a]/10 bg-white/90 p-5 shadow-[0_18px_50px_rgba(11,30,58,.06)] sm:p-7">
            <div className="flex flex-col gap-4 border-b border-[#0b1e3a]/8 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#1677a8]">Continue</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-[#0b1e3a]">{activeDefinition.title}</h2>
                <p className="mt-2 max-w-xl text-xs leading-6 text-[#0b1e3a]/56">{activeSnapshot.goal}</p>
                <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#0b1e3a]/38">{Math.round(activeRuntime.progress * 100)}% complete</p>
              </div>
              <Link className="inline-flex items-center gap-2 text-xs font-extrabold text-[#1677a8]" href={`/paths/${activeDefinition.id}`}>Open Path <ArrowUpRight className="size-3.5" /></Link>
            </div>
            <div className="pt-7"><PathRail nodes={railNodes} /></div>
            {activeGuidance ? <PathNextAction guidance={activeGuidance} /> : null}
            {paths.length > 1 ? (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-[#0b1e3a]/8 pt-5">
                {paths.map((path) => {
                  const definition = getKlinikosPath(path.pathId);
                  if (!definition) return null;
                  return (
                    <button key={path.instanceId} type="button" onClick={() => setSelectedInstanceId(path.instanceId)} className={`rounded-full border px-3 py-2 text-[10px] font-extrabold ${path.instanceId === activeSnapshot.instanceId ? "border-[#1677a8] bg-[#edf6fb] text-[#1677a8]" : "border-[#0b1e3a]/10 text-[#0b1e3a]/55"}`}>
                      {definition.title}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto mt-12 grid max-w-4xl gap-x-8 gap-y-7 sm:grid-cols-2">
            {doorwayActions.map(({ label, description, href, icon: Icon }) => (
              <Link className="group flex items-start gap-4 border-t border-[#0b1e3a]/10 pt-5" href={href} key={label}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf6fb] text-[#1677a8]"><Icon className="size-4.5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-extrabold tracking-[.16em] text-[#0b1e3a]">{label}</span>
                  <span className="mt-1.5 block text-xs leading-5 text-[#0b1e3a]/50">{description}</span>
                </span>
                <ArrowUpRight className="mt-1 size-4 shrink-0 text-[#0b1e3a]/24 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1677a8]" />
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <a className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b1e3a]/58 transition hover:text-[#1677a8]" href="#explore-klinikos">Explore Klinikos <ArrowRight className="size-3.5" /></a>
        </div>
      </div>
    </section>
  );
}
