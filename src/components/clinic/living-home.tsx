"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, ClipboardList, GraduationCap, Search, Sparkles, Stethoscope } from "lucide-react";
import { PathNextAction, type PathGuidanceView } from "@/components/clinic/path-next-action";
import { PathRail } from "@/components/clinic/path-rail";
import type { ClinicRole } from "@/lib/auth/rbac";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import { getKlinikosPath } from "@/lib/paths/catalog";

type DoorwayAction = {
  label: string;
  description: string;
  href: string;
  icon: typeof Stethoscope;
};

function doorwayActionsForRole(role: ClinicRole): DoorwayAction[] {
  if (role === "clinic_owner" || role === "administrator") {
    return [
      { label: "RUN THE CLINIC", description: "Patients, schedule, staff work, follow-up, and revenue", href: "/front-desk", icon: Stethoscope },
      { label: "EXPLORE GRID", description: "Find or offer healthcare work, space, services, and capacity", href: "/grid", icon: BriefcaseBusiness },
      { label: "OPEN EDU", description: "Courses, simulations, training, and readiness", href: "/edu", icon: GraduationCap },
    ];
  }
  if (role === "provider" || role === "clinical_staff" || role === "case_manager") {
    return [
      { label: "TODAY'S CARE", description: "Open the work that needs clinical or care-team attention", href: role === "provider" ? "/provider" : "/tasks", icon: Stethoscope },
      { label: "EXPLORE GRID", description: "See eligible work, services, and healthcare opportunities", href: "/grid", icon: BriefcaseBusiness },
      { label: "OPEN EDU", description: "Continue learning, scenarios, and readiness", href: "/edu", icon: GraduationCap },
    ];
  }
  return [
    { label: "OPEN MY WORK", description: "Go directly to the work your role can act on", href: role === "front_desk" ? "/front-desk" : "/tasks", icon: ClipboardList },
    { label: "OPEN EDU", description: "Courses, scenarios, and professional learning", href: "/edu", icon: GraduationCap },
  ];
}

function roleLabel(role: ClinicRole) {
  return role.replaceAll("_", " ");
}

export function LivingHome({
  firstName,
  role,
  initialPaths,
  initialGuidance,
}: {
  firstName: string;
  role: ClinicRole;
  initialPaths: PersistedPathSnapshot[];
  initialGuidance: PathGuidanceView[];
}) {
  const [intent, setIntent] = useState("");
  const [paths, setPaths] = useState(initialPaths);
  const [guidance, setGuidance] = useState(initialGuidance);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(initialPaths[0]?.instanceId ?? null);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const doorwayActions = doorwayActionsForRole(role);

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
      setMessage(resolved.clarificationQuestions[0] ?? "Klinikos needs one more detail before it can help with that.");
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
      if (!response.ok || !payload.data) throw new Error(payload.error || "Klinikos could not start that yet.");

      setPaths((current) => [payload.data!, ...current.filter((path) => path.instanceId !== payload.data!.instanceId)]);
      if (payload.guidance) {
        setGuidance((current) => [payload.guidance!, ...current.filter((item) => item.instanceId !== payload.guidance!.instanceId)]);
      }
      setSelectedInstanceId(payload.data.instanceId);
      setIntent("");
      setState("idle");
      setMessage("You're set. Here's the safest next step.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Klinikos could not start that yet.");
    }
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-[#0b1e3a]/8 bg-[radial-gradient(circle_at_top_right,rgba(22,119,168,.07),transparent_34%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-5 py-12 shadow-[0_24px_80px_rgba(11,30,58,.06)] sm:px-9 sm:py-14 lg:px-14 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#1677a8]"><Sparkles className="size-3.5" /> Klinikos</div>
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b1e3a]/35">{roleLabel(role)}</p>
          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-[-.055em] text-[#0b1e3a] sm:text-5xl lg:text-6xl">Good morning, {firstName}.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#0b1e3a]/58">
            {activeSnapshot ? "Pick up the work that matters without hunting through the system. Your progress, next step, and anything blocking it stay together here." : "Tell Klinikos what you need to accomplish, or choose a doorway below. Your role decides what you can actually open and do."}
          </p>
        </div>

        <form className="mx-auto mt-10 max-w-3xl" onSubmit={submitIntent}>
          <label className="sr-only" htmlFor="klinikos-intent">What are you trying to accomplish?</label>
          <div className="flex items-center gap-3 rounded-2xl border border-[#0b1e3a]/12 bg-white p-2.5 shadow-[0_16px_45px_rgba(11,30,58,.07)] focus-within:border-[#1677a8]/45 focus-within:ring-4 focus-within:ring-[#1677a8]/8">
            <Search className="ml-2 size-5 shrink-0 text-[#0b1e3a]/32" />
            <input
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-semibold text-[#0b1e3a] outline-none placeholder:text-[#0b1e3a]/32"
              id="klinikos-intent"
              onChange={(event) => { setIntent(event.target.value); if (state === "error") setState("idle"); }}
              placeholder="What needs to happen next?"
              value={intent}
            />
            <button disabled={state === "saving" || intent.trim().length < 2} className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1e3a] text-white transition hover:bg-[#12315a] disabled:cursor-not-allowed disabled:opacity-40" type="submit" aria-label="Show me the next step">
              <ArrowRight className="size-4" />
            </button>
          </div>
          {message ? <p className={`mt-3 text-center text-[11px] ${state === "error" ? "text-rose-700" : "text-[#0b1e3a]/52"}`} aria-live="polite">{message}</p> : null}
        </form>

        {activeDefinition && activeRuntime && activeSnapshot ? (
          <div className="mx-auto mt-14 max-w-3xl border-y border-[#0b1e3a]/10 py-8 sm:py-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#1677a8]">Continue where you left off</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-[-.045em] text-[#0b1e3a]">{activeDefinition.title}</h2>
                <p className="mt-3 max-w-xl text-xs leading-6 text-[#0b1e3a]/56">{activeSnapshot.goal}</p>
                <div className="mt-5 h-1.5 max-w-md overflow-hidden rounded-full bg-[#0b1e3a]/8"><div className="h-full rounded-full bg-[#1677a8]" style={{ width: `${Math.max(4, Math.round(activeRuntime.progress * 100))}%` }} /></div>
                <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#0b1e3a]/38">{Math.round(activeRuntime.progress * 100)}% complete</p>
              </div>
              <Link className="inline-flex items-center gap-2 rounded-full border border-[#0b1e3a]/12 px-4 py-3 text-xs font-extrabold text-[#1677a8]" href={`/paths/${activeDefinition.id}`}>Continue <ArrowUpRight className="size-3.5" /></Link>
            </div>
            <details className="mt-8 border-t border-[#0b1e3a]/8 pt-6">
              <summary className="cursor-pointer list-none text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b1e3a]/45">Show progress details</summary>
              <div className="mt-6"><PathRail nodes={railNodes} /></div>
            </details>
            {activeGuidance ? <PathNextAction guidance={activeGuidance} /> : null}
            {paths.length > 1 ? (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-[#0b1e3a]/8 pt-6">
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
          <div className={`mx-auto mt-16 grid max-w-4xl gap-x-10 gap-y-10 ${doorwayActions.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
            {doorwayActions.map(({ label, description, href, icon: Icon }) => (
              <Link className="group border-t border-[#0b1e3a]/10 pt-6" href={href} key={label}>
                <span className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf6fb] text-[#1677a8]"><Icon className="size-4.5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-extrabold tracking-[.16em] text-[#0b1e3a]">{label}</span>
                    <span className="mt-2 block text-xs leading-5 text-[#0b1e3a]/50">{description}</span>
                  </span>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-[#0b1e3a]/24 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1677a8]" />
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 flex justify-center border-t border-[#0b1e3a]/8 pt-8">
          <a className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b1e3a]/58 transition hover:text-[#1677a8]" href="#explore-klinikos">Explore more when you need it <ArrowRight className="size-3.5" /></a>
        </div>
      </div>
    </section>
  );
}
