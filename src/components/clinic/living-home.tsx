"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, ClipboardList, GraduationCap, Search, Stethoscope } from "lucide-react";
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
      { label: "Clinic operations", description: "Patients, schedule, staff work, follow-up, and revenue", href: "/front-desk", icon: Stethoscope },
      { label: "Grid", description: "Find or offer healthcare work, space, services, and capacity", href: "/grid", icon: BriefcaseBusiness },
      { label: "Klinikos EDU", description: "Courses, scenarios, training, and readiness", href: "/edu", icon: GraduationCap },
    ];
  }
  if (role === "provider" || role === "clinical_staff" || role === "case_manager") {
    return [
      { label: "Today's care", description: "Open the work that needs clinical or care-team attention", href: role === "provider" ? "/provider" : "/tasks", icon: Stethoscope },
      { label: "Grid", description: "See eligible work, services, and healthcare opportunities", href: "/grid", icon: BriefcaseBusiness },
      { label: "Klinikos EDU", description: "Continue learning, scenarios, and readiness", href: "/edu", icon: GraduationCap },
    ];
  }
  return [
    { label: "My work", description: "Go directly to the work your role can act on", href: role === "front_desk" ? "/front-desk" : "/tasks", icon: ClipboardList },
    { label: "Klinikos EDU", description: "Courses, scenarios, and professional learning", href: "/edu", icon: GraduationCap },
  ];
}

function roleLabel(role: ClinicRole) {
  return role.replaceAll("_", " ");
}

function localGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
  const [greeting, setGreeting] = useState("Welcome");
  const doorwayActions = doorwayActionsForRole(role);

  useEffect(() => {
    const update = () => setGreeting(localGreeting());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
      setMessage("Ready. Here's the next useful step.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Klinikos could not start that yet.");
    }
  }

  return (
    <section className="k-surface -mx-4 border-b px-4 pb-16 pt-12 k-rule sm:-mx-6 sm:px-6 sm:pb-20 lg:-mx-8 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:gap-20">
          <div>
            <p className="k-kicker">{roleLabel(role)}</p>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[.95] tracking-[-.065em] sm:text-6xl lg:text-7xl">{greeting}, {firstName}.</h1>
            <p className="k-muted mt-6 max-w-2xl text-sm leading-7 sm:text-base">Tell Klinikos the outcome you need, or continue the work already in motion. The machinery underneath stays out of your way.</p>
          </div>

          <form onSubmit={submitIntent}>
            <label className="k-kicker" htmlFor="klinikos-intent">What needs to happen?</label>
            <div className="k-input-shell mt-4 flex items-center gap-3 rounded-2xl p-2.5">
              <Search className="ml-2 size-5 shrink-0 text-[var(--k-muted)]" />
              <input
                className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-semibold outline-none"
                id="klinikos-intent"
                onChange={(event) => { setIntent(event.target.value); if (state === "error") setState("idle"); }}
                placeholder="Find coverage Friday, follow up a referral, continue a course..."
                value={intent}
              />
              <button disabled={state === "saving" || intent.trim().length < 2} className="k-primary-action size-11 shrink-0 rounded-xl disabled:cursor-not-allowed disabled:opacity-40" type="submit" aria-label="Show me the next step">
                <ArrowRight className="size-4" />
              </button>
            </div>
            {message ? <p className={`mt-3 text-[11px] ${state === "error" ? "text-rose-700" : "k-muted"}`} aria-live="polite">{message}</p> : null}
          </form>
        </div>

        {activeDefinition && activeRuntime && activeSnapshot ? (
          <div className="mt-20 grid gap-10 border-y py-10 k-rule lg:grid-cols-[.9fr_1.1fr] lg:gap-16 lg:py-12">
            <div>
              <p className="k-kicker">Continue</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-.045em]">{activeDefinition.title}</h2>
              <p className="k-muted mt-4 max-w-xl text-sm leading-7">{activeSnapshot.goal}</p>
              <div className="mt-7 h-1 max-w-md overflow-hidden rounded-full bg-[var(--k-public-raised)]"><div className="h-full rounded-full bg-[var(--k-accent)]" style={{ width: `${Math.max(4, Math.round(activeRuntime.progress * 100))}%` }} /></div>
              <div className="mt-4 flex items-center gap-5">
                <p className="k-muted text-[10px] font-semibold uppercase tracking-[.14em]">{Math.round(activeRuntime.progress * 100)}% complete</p>
                <Link className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--k-accent)]" href={`/paths/${activeDefinition.id}`}>Continue <ArrowUpRight className="size-3.5" /></Link>
              </div>
              {paths.length > 1 ? (
                <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t pt-6 k-rule">
                  {paths.map((path) => {
                    const definition = getKlinikosPath(path.pathId);
                    if (!definition) return null;
                    return (
                      <button key={path.instanceId} type="button" onClick={() => setSelectedInstanceId(path.instanceId)} className={`text-xs font-semibold ${path.instanceId === activeSnapshot.instanceId ? "text-[var(--k-accent)]" : "k-muted"}`}>
                        {definition.title}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div>
              {activeGuidance ? <PathNextAction guidance={activeGuidance} /> : <p className="k-muted text-sm">No additional action is required right now.</p>}
              <details className="mt-8 border-t pt-6 k-rule">
                <summary className="k-muted cursor-pointer list-none text-xs font-semibold">Show full progress</summary>
                <div className="mt-6"><PathRail nodes={railNodes} /></div>
              </details>
            </div>
          </div>
        ) : null}

        <div className="mt-20">
          <div className="flex items-end justify-between gap-6">
            <div><p className="k-kicker">Open what matters</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.04em]">Your role, not the whole product.</h2></div>
            <a className="k-muted hidden items-center gap-2 text-xs font-semibold sm:inline-flex" href="#explore-klinikos">More when you need it <ArrowRight className="size-3.5" /></a>
          </div>

          <div className={`mt-8 divide-y divide-[var(--k-line)] border-y border-[var(--k-line)] ${doorwayActions.length >= 3 ? "lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0" : "sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0"}`}>
            {doorwayActions.map(({ label, description, href, icon: Icon }) => (
              <Link className="group flex items-start gap-4 py-7 lg:px-7 lg:first:pl-0 lg:last:pr-0" href={href} key={label}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--k-public-raised)] text-[var(--k-accent)]"><Icon className="size-[18px]" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="k-muted mt-2 block text-xs leading-5">{description}</span></span>
                <ArrowUpRight className="mt-1 size-4 shrink-0 text-[var(--k-muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--k-accent)]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
