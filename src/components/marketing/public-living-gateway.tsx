"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CornerDownLeft } from "lucide-react";
import { ZumiOrb, type ZumiState } from "@/components/ds";
import { resolvePublicLivingIntent, type PublicLivingResolution } from "@/lib/orchestration/public-living-intent";

const progressSteps = ["Understanding", "Preparing the next move", "Ready"] as const;
type ProgressStage = "understanding" | "preparing" | "ready" | "complete";

type ConversationTurn = {
  id: number;
  prompt: string;
  stage: ProgressStage;
  resolution: PublicLivingResolution | null;
};

function stageIndex(stage: ProgressStage) {
  if (stage === "understanding") return 0;
  if (stage === "preparing") return 1;
  return 2;
}

function orbState(stage: ProgressStage): ZumiState {
  if (stage === "understanding") return "observing";
  if (stage === "preparing") return "mapping";
  if (stage === "ready") return "analyzing";
  return "resolved";
}

function statusLabel(stage: ProgressStage) {
  if (stage === "complete") return "Ready";
  return progressSteps[stageIndex(stage)];
}

export function PublicLivingGateway() {
  const [intent, setIntent] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const nextTurnId = useRef(1);
  const timers = useRef<number[]>([]);
  const threadEnd = useRef<HTMLDivElement>(null);
  const activeTurn = turns.find((turn) => turn.stage !== "complete") ?? null;
  const activeTurnId = activeTurn?.id ?? null;
  const activeStage = activeTurn?.stage ?? null;
  const conversationStarted = turns.length > 0;

  const liveStatus = activeStage
    ? `Klinikos is ${statusLabel(activeStage).toLowerCase()}.`
    : turns.length
      ? "Klinikos is ready for the next request."
      : "Klinikos is ready.";

  useEffect(() => {
    const scheduledTimers = timers.current;
    return () => scheduledTimers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    threadEnd.current?.scrollIntoView({ behavior: activeTurnId && !reduceMotion ? "smooth" : "auto", block: "end" });
  }, [activeStage, activeTurnId, turns.length]);

  function updateTurn(id: number, update: Partial<ConversationTurn>) {
    setTurns((current) => current.map((turn) => turn.id === id ? { ...turn, ...update } : turn));
  }

  function schedule(delay: number, action: () => void) {
    const timer = window.setTimeout(action, delay);
    timers.current.push(timer);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = intent.trim();
    if (!prompt || activeTurn) return;

    const id = nextTurnId.current;
    nextTurnId.current += 1;
    setTurns((current) => [...current, { id, prompt, stage: "understanding", resolution: null }]);
    setIntent("");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timing = reduceMotion
      ? { preparing: 0, ready: 0, response: 0 }
      : { preparing: 420, ready: 900, response: 1_180 };

    schedule(timing.preparing, () => updateTurn(id, { stage: "preparing" }));
    schedule(timing.ready, () => updateTurn(id, { stage: "ready" }));
    schedule(timing.response, () => updateTurn(id, {
      stage: "complete",
      resolution: resolvePublicLivingIntent(prompt),
    }));
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <section
      aria-busy={Boolean(activeTurn)}
      aria-labelledby="public-living-title"
      className="h-[100svh] min-h-[34rem] overflow-hidden bg-[var(--surface-primary)] text-[var(--text-primary)]"
      data-klinikos-ds=""
    >
      <div className="mx-auto flex h-full max-w-[var(--container-max)] flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex min-h-20 shrink-0 items-center border-b border-[var(--line-dark)]">
          <Link className="text-xs font-extrabold tracking-[var(--tracking-wider)]" href="/">KLINIKOS</Link>
          <p className="ml-4 hidden text-[var(--text-micro)] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)] sm:block">
            Living Home
          </p>
          <Link
            className="ml-auto inline-flex min-h-11 items-center border border-[var(--line-dark)] px-4 text-xs font-bold transition-opacity hover:opacity-70"
            href="/login"
          >
            Sign in
          </Link>
        </header>

        <div className="sr-only" aria-live="polite" role="status">{liveStatus}</div>

        <main className="min-h-0 flex-1" id="living-conversation">
          {!conversationStarted ? (
            <div className="grid h-full items-center gap-8 py-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-16">
              <div className="-ml-8 hidden justify-center lg:flex">
                <ZumiOrb size={184} state="dormant" />
              </div>
              <div className="max-w-4xl">
                <div className="mb-8 flex items-center gap-4 lg:hidden">
                  <ZumiOrb size={76} state="dormant" />
                  <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wider)] text-[var(--accent-intelligence)]">
                    Klinikos Intelligence
                  </p>
                </div>
                <p className="hidden text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wider)] text-[var(--accent-intelligence)] lg:block">
                  The workspace forms around the outcome
                </p>
                <h1
                  className="mt-5 max-w-4xl text-balance text-[clamp(3.2rem,8vw,7.4rem)] font-semibold leading-[.88] tracking-[var(--tracking-tighter)]"
                  id="public-living-title"
                >
                  What needs to happen?
                </h1>
                <p className="mt-7 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                  Start with the outcome. Klinikos will bring forward only what belongs to the work.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto overscroll-contain py-10 sm:py-14">
              <div className="mx-auto max-w-4xl">
                <div className="mb-14 flex items-center justify-between gap-6 border-b border-[var(--line-dark)] pb-5">
                  <div>
                    <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wider)] text-[var(--accent-intelligence)]">Living thread</p>
                    <h1 className="mt-2 text-xl font-semibold tracking-[var(--tracking-tight)]" id="public-living-title">The work stays in one place.</h1>
                  </div>
                  <p className="hidden max-w-xs text-right text-[var(--text-micro)] leading-5 text-[var(--text-secondary)] sm:block">Only relevant actions appear. Private work still waits for identity and permission.</p>
                </div>

                <ol className="space-y-20">
                  {turns.map((turn, index) => {
                    const currentStageIndex = stageIndex(turn.stage);
                    return (
                      <li className="relative grid gap-7 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-10" key={turn.id}>
                        <div className="hidden border-r border-[var(--line-dark)] pr-5 text-right sm:block">
                          <p className="text-[var(--text-micro)] font-extrabold tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">{String(index + 1).padStart(2, "0")}</p>
                          <p className="mt-2 text-[var(--text-micro)] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">You</p>
                        </div>

                        <div className="min-w-0">
                          <p className="mb-3 text-[var(--text-micro)] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)] sm:hidden">You · {String(index + 1).padStart(2, "0")}</p>
                          <blockquote className="text-balance text-2xl font-semibold leading-tight tracking-[var(--tracking-tight)] sm:text-4xl">
                            {turn.prompt}
                          </blockquote>

                          <div className="mt-9 grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-5 border-y border-[var(--line-dark)] py-5">
                            <ZumiOrb size={70} state={orbState(turn.stage)} />
                            <ol className="grid gap-3 sm:grid-cols-3 sm:gap-5" aria-label={`Klinikos progress: ${statusLabel(turn.stage)}`}>
                              {progressSteps.map((step, stepIndex) => {
                                const reached = stepIndex <= currentStageIndex;
                                const current = turn.stage !== "complete" && stepIndex === currentStageIndex;
                                return (
                                  <li className="flex items-center gap-3" key={step} {...(current ? { "aria-current": "step" as const } : {})}>
                                    <span
                                      aria-hidden="true"
                                      className={`h-px w-5 transition-colors duration-500 ${reached ? "bg-[var(--accent-intelligence)]" : "bg-[var(--line-dark)]"}`}
                                    />
                                    <span className={`text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] ${reached ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                                      {step}
                                    </span>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>

                          {turn.resolution ? (
                            <article className="mt-9 border-l border-[var(--accent-intelligence)] pl-5 sm:pl-8">
                              <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wider)] text-[var(--accent-intelligence)]">Klinikos Intelligence</p>
                              <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[var(--tracking-tight)] sm:text-3xl">{turn.resolution.title}</h2>
                              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{turn.resolution.body}</p>
                              {turn.resolution.assumption ? (
                                <p className="mt-5 max-w-2xl text-xs leading-6 text-[var(--text-secondary)]">
                                  <strong className="font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-primary)]">Working assumption:</strong>{" "}
                                  {turn.resolution.assumption}
                                </p>
                              ) : null}
                              {turn.resolution.destination ? (
                                <Link
                                  className="mt-7 inline-flex min-h-11 items-center gap-3 border-b border-[var(--accent-intelligence)] text-sm font-bold text-[var(--accent-intelligence)] transition-opacity hover:opacity-70"
                                  href={turn.resolution.destination.href}
                                >
                                  {turn.resolution.destination.action} <ArrowRight className="size-4" />
                                </Link>
                              ) : null}
                            </article>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <div ref={threadEnd} />
              </div>
            </div>
          )}
        </main>

        <form className="shrink-0 border-t border-[var(--line-dark)] bg-[var(--surface-primary)] py-5 sm:py-6" onSubmit={submit}>
          <div className="mx-auto max-w-4xl">
            <label className="sr-only" htmlFor="public-klinikos-intent">Tell Klinikos what needs to happen</label>
            <div className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-end gap-4 border-b border-[var(--line-dark)] pb-3 focus-within:border-[var(--accent-intelligence)]">
              <textarea
                className="max-h-36 min-h-14 resize-none bg-transparent py-4 text-base font-semibold leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] sm:text-lg"
                disabled={Boolean(activeTurn)}
                id="public-klinikos-intent"
                onChange={(event) => setIntent(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder={conversationStarted ? "Continue the thread..." : "Describe the outcome..."}
                rows={1}
                value={intent}
              />
              <button
                aria-label="Send to Klinikos"
                className="grid size-14 place-items-center bg-[var(--accent-intelligence)] text-[var(--obsidian)] transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-30"
                disabled={!intent.trim() || Boolean(activeTurn)}
                type="submit"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-[var(--text-micro)] text-[var(--text-secondary)]">
              <p>{activeTurn ? statusLabel(activeTurn.stage) : "Klinikos keeps permissions and consequential actions governed underneath."}</p>
              <p className="hidden items-center gap-2 sm:flex"><CornerDownLeft className="size-3" /> Enter to send · Shift + Enter for a new line</p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
