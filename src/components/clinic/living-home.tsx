"use client";

import { FormEvent, KeyboardEvent, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  BarChart3,
  BriefcaseBusiness,
  GraduationCap,
  HeartPulse,
  ReceiptText,
  Users,
} from "lucide-react";
import { Badge, DsSurface, ZumiOrb, type ZumiState } from "@/components/ds";
import { LivingHomeOperations } from "@/components/clinic/living-home-operations";
import type { PathGuidanceView } from "@/components/clinic/path-next-action";
import { VoiceInputButton } from "@/components/clinic/voice-input";
import { roleLabel } from "@/lib/auth/rbac";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicGridSignal } from "@/lib/ecosystem/clinic-grid-bridge";
import type { EduGridReadiness } from "@/lib/ecosystem/edu-grid-bridge";
import type { HomeOpportunity, RailDestination } from "@/lib/home/operating-rail";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { resolveSurfaceLookup } from "@/features/zumi/deterministic-answer";
import { resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import type { LivingPathSignal } from "@/lib/orchestration/path-signal-repository";
import { getKlinikosPath } from "@/lib/paths/catalog";
import type { Appointment } from "@/lib/types";

/** What the server observed about the model provider. Copied, never inferred. */
export type IntelligenceRailStatus = {
  available: boolean;
  detail: string;
};

/**
 * The five stages the interface actually moves through, in order.
 *
 * These name deterministic interface processing — reading the request, calling
 * Klinikos, resolving the next governed step — and nothing about external
 * completion. Each one is set at a real milestone in `submitIntent` rather than
 * played back on a timer, so the rail cannot show progress that is not happening.
 */
const PHASES = ["listening", "understanding", "connecting", "preparing", "ready"] as const;
type Phase = (typeof PHASES)[number];

const PHASE_LABELS: Record<Phase, string> = {
  listening: "Listening",
  understanding: "Understanding",
  connecting: "Connecting",
  preparing: "Preparing",
  ready: "Ready",
};

const destinationIcons: Record<string, typeof Users> = {
  operations: Users,
  care: HeartPulse,
  grid: BriefcaseBusiness,
  network: HeartPulse,
  billing: ReceiptText,
  work: BarChart3,
  edu: GraduationCap,
};

type WorkspaceRow = {
  key: string;
  label: string;
  value: string;
  state: string;
  tone: "open" | "blocked" | "settled" | "neutral";
};

type TranscriptEntry = {
  id: string;
  speaker: "You" | "Klinikos";
  text: string;
};

function guidanceStateLabel(state: PathGuidanceView["state"]) {
  if (state === "blocked") return "Blocked";
  if (state === "review_required") return "Needs review";
  if (state === "waiting") return "Waiting";
  if (state === "completed") return "Completed";
  if (state === "available") return "Ready";
  return "Recommended";
}

function rowToneColor(tone: WorkspaceRow["tone"]) {
  if (tone === "blocked") return "var(--status-signal)";
  if (tone === "open") return "var(--status-analyzing)";
  if (tone === "settled") return "var(--status-resolved)";
  return "var(--text-secondary)";
}

/**
 * The orb reports what is actually happening, in this order of truth:
 *
 * 1. a failed request is a signal, regardless of anything else;
 * 2. work in flight is analyzing;
 * 3. a resolved next step is resolved;
 * 4. otherwise the orb reflects whether a model provider is genuinely reachable.
 *
 * The orb previously idled at "observing" whether or not any provider was connected,
 * which read as a live intelligence layer sitting attentively on a deployment where
 * nothing was configured. A quiet, honest state beats an attentive lie.
 */
function orbStateFor(phase: Phase, failed: boolean, intelligenceAvailable: boolean): ZumiState {
  if (failed) return "signal";
  if (phase === "connecting" || phase === "preparing" || phase === "understanding") return "analyzing";
  if (phase === "ready") return "resolved";
  return intelligenceAvailable ? "observing" : "mapping";
}

/**
 * Which Klinikos engine the resolved work belongs to, read from the governed link the
 * Path engine produced. Derived from where the work actually points — never guessed
 * from the words the person typed.
 *
 * Matching is on the leading path segment (the engine) rather than the destination's
 * full href, because a destination and the step it leads to are routinely different
 * surfaces inside the same engine — the rail points at `/grid/workspace` while a
 * resolved step may land on `/grid/providers`.
 */
function destinationForHref(href: string | null, destinations: RailDestination[]) {
  if (!href) return null;
  const engine = href.split("/").filter(Boolean)[0];
  if (!engine) return null;
  const match = destinations.find((destination) => destination.href.split("/").filter(Boolean)[0] === engine);
  return match?.key ?? null;
}

export function LivingHome({
  firstName,
  organizationName,
  role,
  appointments,
  recentSignals,
  initialPaths,
  initialGuidance,
  intelligence,
  rail,
  opportunity,
  gridSignals,
  eduReadiness,
  canActOnGridSignals,
  canOpenPatientRecord,
  onboardingComplete = false,
}: {
  firstName: string;
  organizationName: string;
  role: ClinicRole;
  appointments: Appointment[];
  recentSignals: LivingPathSignal[];
  initialPaths: PersistedPathSnapshot[];
  initialGuidance: PathGuidanceView[];
  intelligence: IntelligenceRailStatus;
  rail: RailDestination[];
  opportunity: HomeOpportunity | null;
  gridSignals: ClinicGridSignal[];
  eduReadiness: EduGridReadiness | null;
  canActOnGridSignals: boolean;
  canOpenPatientRecord: boolean;
  onboardingComplete?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [paths, setPaths] = useState(initialPaths);
  const [guidance, setGuidance] = useState(initialGuidance);
  const [phase, setPhase] = useState<Phase>("listening");
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [clarification, setClarification] = useState<string | null>(null);
  const [surfaceAnswer, setSurfaceAnswer] = useState<{ answer: string; label: string; href: string } | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [attentionCount, setAttentionCount] = useState(0);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const activeSnapshot = useMemo(
    () => paths.find((path) => path.instanceId === activeInstanceId) ?? null,
    [paths, activeInstanceId],
  );
  const activeGuidance = useMemo(
    () => guidance.find((item) => item.instanceId === activeInstanceId) ?? null,
    [guidance, activeInstanceId],
  );
  const activeDefinition = activeSnapshot ? getKlinikosPath(activeSnapshot.pathId) : null;
  const activeRuntime = activeSnapshot
    ? resolvePathRuntime({ pathId: activeSnapshot.pathId, snapshot: activeSnapshot })
    : null;

  const activeDestination = destinationForHref(activeGuidance?.href ?? null, rail);
  const phaseIndex = PHASES.indexOf(phase);
  const orbState = orbStateFor(phase, failed, intelligence.available);

  // Every row is read off the Path the server actually created. Nothing is padded to
  // fill the panel: a Path with no blockers shows no blocker rows.
  const workspaceRows = useMemo<WorkspaceRow[]>(() => {
    if (!activeSnapshot || !activeDefinition) return [];
    const rows: WorkspaceRow[] = [
      { key: "outcome", label: "Outcome", value: activeDefinition.title, state: "Organized", tone: "neutral" },
      { key: "goal", label: "What you asked", value: activeSnapshot.goal, state: "Recorded", tone: "neutral" },
    ];
    if (activeRuntime) {
      rows.push({
        key: "progress",
        label: "Progress",
        value: `${Math.round(activeRuntime.progress * 100)}% complete`,
        state: activeGuidance ? guidanceStateLabel(activeGuidance.state) : "In progress",
        tone: activeGuidance?.state === "blocked" ? "blocked" : activeGuidance?.state === "completed" ? "settled" : "open",
      });
    }
    for (const blocker of activeGuidance?.blockers ?? []) {
      rows.push({
        key: `blocker-${blocker.code}`,
        label: blocker.title,
        value: blocker.explanation,
        state: blocker.canResolveNow ? `You can resolve` : `Waiting on ${blocker.owner}`,
        tone: blocker.canResolveNow ? "open" : "blocked",
      });
    }
    return rows;
  }, [activeSnapshot, activeDefinition, activeRuntime, activeGuidance]);

  const reset = useCallback(() => {
    setWorking(false);
    setFailed(false);
    setPhase("listening");
    setClarification(null);
    setSurfaceAnswer(null);
    setTranscript([]);
    setActiveInstanceId(null);
  }, []);

  const say = useCallback((speaker: TranscriptEntry["speaker"], text: string) => {
    setTranscript((current) => [...current, { id: `${speaker}-${current.length}-${text.slice(0, 12)}`, speaker, text }]);
  }, []);

  async function submitIntent(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = draft.trim();
    if (text.length < 2) return;

    setWorking(true);
    setFailed(false);
    setClarification(null);
    setSurfaceAnswer(null);
    setTranscript([{ id: "you-0", speaker: "You", text }]);
    setActiveInstanceId(null);
    setDraft("");
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Understanding: deterministic intent resolution. No model is involved here, which
    // is exactly why the composer keeps working on a deployment with no provider.
    setPhase("understanding");
    const resolved = resolveIntentDeterministically(text);
    const pathId = resolved.candidatePathIds[0] ?? null;
    if (!pathId) {
      setPhase("ready");
      // Not every sentence is a journey. "Who hasn't completed intake tomorrow?" is a
      // question about a list, and the honest answer is the surface that holds it — the
      // same answer the Zumi conversation gives, from the same shared lookup. Demanding
      // "the outcome rather than the topic" turned a clear question into an
      // interrogation, which is the conversational bureaucracy this composer exists to
      // avoid.
      const surface = resolveSurfaceLookup(text, role);
      if (surface) {
        setClarification(null);
        setSurfaceAnswer(surface);
        say("Klinikos", surface.answer);
        return;
      }
      setClarification(resolved.clarificationQuestions[0] ?? "Klinikos needs one more detail before it can help with that.");
      say("Klinikos", "Tell me what you are trying to get done and I will take you to the right place.");
      return;
    }

    setPhase("connecting");
    try {
      const response = await fetch("/api/paths", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pathId, goal: text }),
      });
      setPhase("preparing");
      const payload = await response.json() as { data?: PersistedPathSnapshot; guidance?: PathGuidanceView | null; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Klinikos could not start that yet.");

      const snapshot = payload.data;
      setPaths((current) => [snapshot, ...current.filter((path) => path.instanceId !== snapshot.instanceId)]);
      if (payload.guidance) {
        setGuidance((current) => [payload.guidance!, ...current.filter((item) => item.instanceId !== payload.guidance!.instanceId)]);
      }
      setActiveInstanceId(snapshot.instanceId);
      setPhase("ready");
      say("Klinikos", payload.guidance?.reason ?? "This is organized. The next safe step is below.");
      if (resolved.requiresClarification && resolved.clarificationQuestions[0]) {
        setClarification(resolved.clarificationQuestions[0]);
      }
    } catch (error) {
      setFailed(true);
      setPhase("ready");
      say("Klinikos", error instanceof Error ? error.message : "Klinikos could not start that yet.");
    }
  }

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitIntent();
    }
  }

  // A destination prefills the composer and hands the caret back rather than putting
  // words in the person's mouth. The request that reaches Klinikos is one they sent.
  function proposeDestination(destination: RailDestination) {
    setDraft(`Open ${destination.label.toLowerCase()}`);
    composerRef.current?.focus();
  }

  return (
    <DsSurface className="-mx-4 overflow-hidden border-y border-[var(--line-dark)] bg-[var(--surface-primary)] text-[var(--text-primary)] sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[var(--container-max)] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8">
          {/* Phase rail — what the interface is doing right now, and nothing more. */}
          <ol
            aria-label="Progress on your request"
            className="flex flex-row flex-wrap items-center gap-x-6 gap-y-3 lg:flex-col lg:items-start lg:gap-9 lg:pt-28"
          >
            {PHASES.map((step, index) => {
              const active = working && index === phaseIndex;
              const done = working && index < phaseIndex;
              return (
                <li className="flex items-center gap-3" key={step}>
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full transition-all duration-500"
                    style={{
                      background: active ? "var(--accent-intelligence)" : done ? "var(--status-resolved)" : "var(--line-dark)",
                      boxShadow: active ? "var(--glow-cyan)" : "none",
                    }}
                  />
                  <span
                    className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] transition-colors duration-500"
                    style={{ color: active ? "var(--text-primary)" : done ? "var(--text-secondary)" : "var(--text-tertiary, var(--text-secondary))" }}
                  >
                    {PHASE_LABELS[step]}
                  </span>
                  {active ? <span className="sr-only">Current stage</span> : null}
                </li>
              );
            })}
          </ol>

          <div className="min-w-0 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* No product-layer eyebrow here. A person should experience Klinikos as
                  intelligent rather than be told that it is. */}
              {onboardingComplete ? <Badge tone="resolved">Setup complete</Badge> : null}
            </div>

            <h1
              className="mx-auto mt-6 max-w-4xl text-balance font-extralight tracking-[var(--tracking-tighter)]"
              id="living-home-title"
              style={{ fontSize: "var(--text-h1)", lineHeight: "var(--leading-tight)" }}
            >
              <span className="block">What needs</span>
              <span className="block text-[var(--accent-intelligence)]">to happen?</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
              {firstName}, Klinikos keeps permissions, payment, credentials, and human review in control underneath. Describe the outcome and it organizes the next safe step.
            </p>

            <form className="mx-auto mt-10 max-w-3xl" onSubmit={submitIntent}>
              <div className="rounded-[26px] border border-[var(--line-dark)] bg-[var(--surface-raised)] px-5 py-4 text-left shadow-[var(--shadow-raised,none)]">
                <label className="sr-only" htmlFor="living-home-composer">What needs to happen?</label>
                <textarea
                  className="max-h-36 min-h-[3rem] w-full resize-none bg-transparent text-sm leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                  id="living-home-composer"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={onComposerKey}
                  placeholder="Find coverage Friday, follow up a referral, continue a course…"
                  ref={composerRef}
                  rows={2}
                  value={draft}
                />
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-[var(--text-micro)] text-[var(--text-secondary)]">
                    Enter to send · Shift+Enter for a new line
                  </span>
                  <div className="flex items-center gap-2">
                    <VoiceInputButton onTranscript={(spoken) => setDraft((current) => (current ? `${current} ${spoken}` : spoken))} />
                    <button
                      aria-label="Show me the next step"
                      className="grid size-11 place-items-center rounded-full bg-[var(--accent-intelligence)] text-[var(--surface-primary)] transition-opacity hover:opacity-90 disabled:opacity-40"
                      disabled={draft.trim().length < 2}
                      type="submit"
                    >
                      <ArrowUp className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="mt-8 grid justify-items-center">
              <ZumiOrb size={104} state={orbState} />
              <p aria-live="polite" className="mt-2 text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">
                {working ? PHASE_LABELS[phase] : PHASE_LABELS.listening}
              </p>
              {intelligence.available ? null : (
                <p className="mx-auto mt-4 max-w-sm text-xs leading-6 text-[var(--status-analyzing)]">
                  Conversational intelligence is not connected on this deployment. The command above still works — it is resolved by deterministic Klinikos logic, not by a model.
                </p>
              )}
            </div>
          </div>

          {/* Destination rail — only what this role can actually open. */}
          <nav aria-label="Klinikos destinations" className="flex flex-row flex-wrap items-start justify-center gap-6 lg:flex-col lg:gap-7 lg:pt-28">
            {rail.map((destination) => {
              const Icon = destinationIcons[destination.key] ?? BarChart3;
              const highlighted = activeDestination === destination.key;
              return (
                <div className="grid w-24 justify-items-center gap-2" key={destination.key}>
                  <button
                    aria-label={`Ask Klinikos about ${destination.label}`}
                    title={destination.label}
                    className="grid size-12 place-items-center rounded-full border transition-colors duration-500"
                    onClick={() => proposeDestination(destination)}
                    style={{
                      borderColor: highlighted ? "var(--accent-intelligence)" : "var(--line-dark)",
                      color: highlighted ? "var(--accent-intelligence)" : "var(--text-secondary)",
                    }}
                    type="button"
                  >
                    <Icon className="size-5" strokeWidth={1.5} />
                  </button>
                  {/* Not uppercase with wide tracking like the other rail labels: a
                      two-word destination ("Front desk", "Operations") renders wider
                      than the chip and spills out of the column. */}
                  <span
                    className="text-balance text-center text-[11px] font-semibold leading-4"
                    style={{ color: highlighted ? "var(--accent-intelligence)" : "var(--text-secondary)" }}
                  >
                    {destination.short}
                  </span>
                  {/* A "0" badge is noise that teaches people to stop reading badges, and
                      a naked number says nothing. Show it only when there is something,
                      and say what it is. */}
                  {destination.live && destination.live.count > 0 ? (
                    <span
                      className="text-balance text-center text-[var(--text-micro)]"
                      style={{ color: "var(--accent-intelligence)" }}
                    >
                      {destination.live.count} {destination.live.count === 1 ? destination.live.singular : destination.live.noun}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>

        <div ref={workspaceRef}>
          {working ? (
            <section aria-labelledby="workspace-title" className="mt-14 overflow-hidden rounded-[20px] border border-[var(--line-dark)]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line-dark)] px-6 py-4">
                <div className="flex flex-wrap items-baseline gap-4">
                  <span className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">
                    {organizationName} · {roleLabel(role)}
                  </span>
                  <h2 className="text-lg font-semibold tracking-[var(--tracking-tight)]" id="workspace-title">
                    {phase === "ready" ? activeDefinition?.title ?? "One more detail" : "Working…"}
                  </h2>
                </div>
                <button
                  className="min-h-11 rounded-full border border-[var(--line-dark)] px-5 text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)] transition-opacity hover:opacity-80"
                  onClick={reset}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="grid divide-y divide-[var(--line-dark)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <div className="px-6 py-6">
                  <div className="space-y-5">
                    {transcript.map((entry) => (
                      <div key={entry.id}>
                        <p
                          className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]"
                          style={{ color: entry.speaker === "Klinikos" ? "var(--accent-intelligence)" : "var(--text-secondary)" }}
                        >
                          {entry.speaker}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[var(--text-primary)]">{entry.text}</p>
                      </div>
                    ))}
                  </div>

                  {surfaceAnswer ? (
                    <div className="mt-6 rounded-[14px] border border-[var(--line-dark)] px-5 py-4">
                      <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">Where that lives</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{surfaceAnswer.answer}</p>
                      <Link
                        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line-dark)] px-5 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-raised)]"
                        href={surfaceAnswer.href}
                      >
                        Open {surfaceAnswer.label}
                      </Link>
                    </div>
                  ) : null}

                  {clarification ? (
                    <div className="mt-6 rounded-[14px] border border-[var(--line-dark)] px-5 py-4">
                      <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">One thing missing</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{clarification}</p>
                    </div>
                  ) : null}
                </div>

                <div className="px-6 py-6">
                  {workspaceRows.length ? (
                    <dl className="divide-y divide-[var(--line-dark)]">
                      {workspaceRows.map((row) => (
                        <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-baseline gap-4 py-3 first:pt-0" key={row.key}>
                          <dt className="min-w-0 truncate text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">{row.label}</dt>
                          <dd className="min-w-0 text-xs leading-6 text-[var(--text-primary)]">{row.value}</dd>
                          <dd
                            className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]"
                            style={{ color: rowToneColor(row.tone) }}
                          >
                            {row.state}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-xs leading-6 text-[var(--text-secondary)]">
                      {phase === "ready"
                        ? "Klinikos has not organized anything yet, because it still needs the detail on the left."
                        : "Reading your request and resolving the next governed step."}
                    </p>
                  )}

                  {activeGuidance?.href ? (
                    <Link
                      className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--accent-intelligence)] px-5 py-3 text-xs font-semibold text-[var(--accent-intelligence)] transition-opacity hover:opacity-85"
                      href={activeGuidance.href}
                    >
                      Open the next step
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line-dark)] px-6 py-4">
                <span className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">
                  Nothing is executed from this surface
                </span>
                <span className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">
                  {activeGuidance?.state === "review_required" ? "Requires human review" : "Governed by your role"}
                </span>
              </div>
            </section>
          ) : (
            <>
              <p className="mt-14 text-center text-sm text-[var(--text-secondary)]">
                {attentionCount
                  ? `${attentionCount} ${attentionCount === 1 ? "item needs" : "items need"} a person right now.`
                  : "Nothing on the schedule needs a person right now."}
              </p>
              <LivingHomeOperations
                appointments={appointments}
                canActOnGridSignals={canActOnGridSignals}
                canOpenPatientRecord={canOpenPatientRecord}
                eduReadiness={eduReadiness}
                gridSignals={gridSignals}
                guidance={guidance}
                onCount={setAttentionCount}
                opportunity={opportunity}
                paths={paths}
                recentSignals={recentSignals}
                role={role}
              />
            </>
          )}
        </div>
      </div>
    </DsSurface>
  );
}
