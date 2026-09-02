"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  HeartPulse,
  Menu,
} from "lucide-react";
import { ZumiOrb } from "@/components/ds";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import type { PublicLivingDestination, PublicLivingResolution } from "@/lib/orchestration/public-living-intent";
import type { PublicLivingUniverseProjection } from "@/lib/orchestration/public-living-universe";
import { PUBLIC_LIVING_ACTIONS } from "@/lib/marketing/public-living-actions";
import {
  KLINIKOS_PUBLIC_ENTRY_LINE,
  PUBLIC_LIVING_PLANE_LENSES,
} from "@/lib/marketing/public-living-interface";
import { PublicLivingUniverseObjectStage } from "@/components/marketing/public-living-universe-stage";
import { protectedPublicContinuationHref } from "@/lib/distribution/public-continuation";
import styles from "@/components/marketing/public-living-universe-shell.module.css";
import {
  KLINIKOS_HUMAN_AUTHORITY,
  KLINIKOS_SUPPORTING,
} from "@/lib/brand/canonical-messaging";
import {
  isPublicDirectDestination,
  PUBLIC_PRIMARY_NAVIGATION,
} from "@/lib/screen-experience-route-presentation";

type PublicZumiSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

type ConversationTurn = {
  id: number;
  prompt: string;
  resolution: PublicLivingResolution;
  suggestions: PublicZumiSuggestion[];
};

type MobileDrawerId = "start" | "planes" | "context";

type PublicZumiApiResponse = {
  data?: {
    resolution?: unknown;
    suggestions?: unknown;
    universe?: unknown;
    replaceUniverse?: unknown;
    suppressUniverse?: unknown;
  };
  emergency?: unknown;
};

const PUBLIC_ZUMI_HISTORY_CONTENT_MAX_LENGTH = 600;

export function boundedPublicZumiHistoryContent(value: string) {
  return value.slice(0, PUBLIC_ZUMI_HISTORY_CONTENT_MAX_LENGTH);
}

/**
 * A refusal or quota response is still allowed to carry the platform's approved
 * emergency instruction. The instruction must survive a non-2xx status: otherwise a
 * rate-limited visitor sees only a generic connectivity message at the precise moment
 * the server tried to preserve the safety boundary.
 */
export function publicZumiEmergencyResolution(value: unknown): PublicLivingResolution | null {
  if (!value || typeof value !== "object") return null;
  const emergency = (value as PublicZumiApiResponse).emergency;
  if (typeof emergency !== "string") return null;
  const body = emergency.trim();
  if (!body || body.length > 4_000) return null;
  return {
    kind: "conversation",
    title: "This may be an emergency",
    body,
    assumption: null,
    destination: null,
    confidence: 1,
  };
}

/**
 * The projection is presentation only, but it still arrives over the wire, so it is
 * shape-checked before it is rendered rather than trusted.
 */
const PUBLIC_PATH_AVAILABILITY = new Set([
  "available_now",
  "requires_setup",
  "requires_verification",
  "requires_organization_connection",
  "defined",
]);
const PUBLIC_PATH_STEP_STATE = new Set(["complete", "current", "upcoming", "blocked"]);

export function isUniverseProjection(value: unknown): value is PublicLivingUniverseProjection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublicLivingUniverseProjection>;
  if (!(typeof candidate.id === "string"
    && typeof candidate.label === "string"
    && (candidate.side === "need" || candidate.side === "have")
    && typeof candidate.pathId === "string"
    && typeof candidate.title === "string"
    && typeof candidate.summary === "string"
    && typeof candidate.from === "string"
    && typeof candidate.to === "string"
    && typeof candidate.availability === "string"
    && PUBLIC_PATH_AVAILABILITY.has(candidate.availability)
    && typeof candidate.availabilityCopy === "string"
    && typeof candidate.governance === "string"
    && (candidate.commercialBoundary === null || typeof candidate.commercialBoundary === "string")
    && typeof candidate.continuationHref === "string"
    && Array.isArray(candidate.steps)
    && candidate.steps.length > 0
    && candidate.steps.length <= 20)) return false;

  const continuation = candidate.continuationHref.match(/^\/member\?path=([a-z0-9-]+)$/);
  if (!continuation || continuation[1] !== candidate.pathId) return false;

  return candidate.steps.every((step) => Boolean(step)
    && typeof step === "object"
    && typeof step.label === "string"
    && typeof step.description === "string"
    && PUBLIC_PATH_STEP_STATE.has(step.state));
}

const PUBLIC_SESSION_KEY = "klinikos.public.zumi.session";
function destinationActionHref(destination: PublicLivingDestination) {
  if (destination.href === "/portal") return "/portal/login";
  if (isPublicDirectDestination(destination.href)) return destination.href;
  return protectedPublicContinuationHref(destination.href, destination.key);
}

function isPublicLivingResolution(value: unknown): value is PublicLivingResolution {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublicLivingResolution>;
  if (candidate.kind !== "conversation" && candidate.kind !== "route") return false;
  if (typeof candidate.title !== "string" || typeof candidate.body !== "string") return false;
  if (candidate.assumption !== null && typeof candidate.assumption !== "string") return false;
  if (typeof candidate.confidence !== "number" || !Number.isFinite(candidate.confidence)) return false;
  if (candidate.destination === null) return true;
  if (!candidate.destination || typeof candidate.destination !== "object") return false;
  return typeof candidate.destination.href === "string"
    && candidate.destination.href.startsWith("/")
    && !candidate.destination.href.startsWith("//")
    && typeof candidate.destination.action === "string"
    && typeof candidate.destination.key === "string";
}

function isPublicZumiSuggestions(value: unknown): value is PublicZumiSuggestion[] {
  if (!Array.isArray(value) || value.length > 4) return false;
  return value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const suggestion = item as Partial<PublicZumiSuggestion>;
    return typeof suggestion.id === "string"
      && suggestion.id.length > 0
      && suggestion.id.length <= 64
      && typeof suggestion.label === "string"
      && suggestion.label.length > 0
      && suggestion.label.length <= 80
      && typeof suggestion.prompt === "string"
      && suggestion.prompt.length > 0
      && suggestion.prompt.length <= 300;
  });
}

function publicConversationId() {
  try {
    const existing = window.sessionStorage.getItem(PUBLIC_SESSION_KEY);
    if (existing && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(existing)) return existing;
    const created = window.crypto.randomUUID();
    window.sessionStorage.setItem(PUBLIC_SESSION_KEY, created);
    return created;
  } catch {
    return undefined;
  }
}

function ZumiSendGlyph({ active }: { active: boolean }) {
  return (
    <span className="grid size-9 place-items-center overflow-visible" data-zumi-send-glyph>
      <ZumiOrb state={active ? "analyzing" : "observing"} size={34} />
    </span>
  );
}

const PUBLIC_INTERFACE_STEPS = ["Listening", "Understanding", "Connecting", "Preparing", "Ready"] as const;

const PUBLIC_ACTION_GROUPS = [
  { id: "need", title: "What I need" },
  { id: "offer", title: "What I can offer" },
  { id: "grow", title: "What I want to build" },
] as const;

const FEATURED_ACTION_IDS = ["care", "work", "rooms", "placement"] as const;

const FEATURED_ACTION_CONTENT = {
  care: {
    title: "Find care",
    body: "Begin private provider discovery. A patient need is never published as public Grid demand.",
    icon: HeartPulse,
  },
  work: {
    title: "Find healthcare work",
    body: "Start with the work you want, then keep credentials, eligibility, and authority explicit.",
    icon: BriefcaseBusiness,
  },
  rooms: {
    title: "Share clinical capacity",
    body: "Describe rooms or space you have. Publication still requires owner and rule verification.",
    icon: Building2,
  },
  placement: {
    title: "Find a placement",
    body: "Coordinate learner, school, site, and preceptor approval without treating placement as licensure.",
    icon: GraduationCap,
  },
} as const;

const FEATURED_PUBLIC_ACTIONS = FEATURED_ACTION_IDS.map((id) => {
  const action = PUBLIC_LIVING_ACTIONS.find((candidate) => candidate.id === id);
  if (!action) throw new Error(`Missing public Living Universe action: ${id}`);
  return { ...action, ...FEATURED_ACTION_CONTENT[id] };
});

const UNREACHABLE_RESOLUTION: PublicLivingResolution = {
  kind: "conversation",
  title: "I can't reach Klinikos right now",
  body: "Your message didn't get through, so I'd rather say so than guess. Try again in a moment.",
  assumption: null,
  destination: null,
  confidence: 0,
};

export function PublicLivingGateway({ signupEnabled }: { signupEnabled: boolean }) {
  const [intent, setIntent] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [activeUniverse, setActiveUniverse] = useState<PublicLivingUniverseProjection | null>(null);
  const [activePlaneId, setActivePlaneId] = useState(PUBLIC_LIVING_PLANE_LENSES[2].id);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMobileDrawer, setOpenMobileDrawer] = useState<MobileDrawerId | null>(null);
  const nextTurnId = useRef(1);
  const activeRequest = useRef<AbortController | null>(null);
  const threadEnd = useRef<HTMLDivElement>(null);
  const conversationStarted = turns.length > 0 || pendingPrompt !== null;
  const latestTurn = turns[turns.length - 1] ?? null;

  const liveStatus = isSubmitting
    ? "Zumi is responding to your message."
    : latestTurn
      ? `Public Zumi guidance ready. ${latestTurn.resolution.title}`
      : "Public Zumi guidance is ready.";

  useEffect(() => {
    if (!conversationStarted) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    threadEnd.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
  }, [conversationStarted, turns.length, pendingPrompt]);

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function sendPrompt(rawPrompt: string, actionId?: string) {
    const prompt = rawPrompt.trim();
    if (!prompt || isSubmitting) return;

    const priorResolution = turns[turns.length - 1]?.resolution ?? null;
    let unresolvedTurns = 0;
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      if (turns[index].resolution.confidence > 0.25) break;
      unresolvedTurns += 1;
    }
    const history = turns
      .flatMap((turn) => ([
        { role: "user" as const, content: boundedPublicZumiHistoryContent(turn.prompt) },
        { role: "assistant" as const, content: boundedPublicZumiHistoryContent(`${turn.resolution.title}\n${turn.resolution.body}`) },
      ]))
      .slice(-12);
    const id = nextTurnId.current;
    nextTurnId.current += 1;

    setIntent("");
    setPendingPrompt(prompt);
    setIsSubmitting(true);

    const controller = new AbortController();
    activeRequest.current?.abort();
    activeRequest.current = controller;

    // No local resolution: the routing engine is server-side, so an unreachable server
    // means honest degraded guidance rather than an invented answer.
    let resolution: PublicLivingResolution = UNREACHABLE_RESOLUTION;
    let suggestions: PublicZumiSuggestion[] = [];
    let universe: PublicLivingUniverseProjection | null = null;
    let replaceUniverse = false;
    let suppressUniverse = false;

    try {
      const response = await fetch("/api/zumi/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          ...(actionId ? { actionId } : {}),
          history,
          priorResolution,
          unresolvedTurns,
          sessionId: publicConversationId(),
          surface: window.location.pathname,
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      const payload: unknown = await response.json().catch(() => null);
      const emergencyResolution = publicZumiEmergencyResolution(payload);
      if (emergencyResolution) {
        resolution = emergencyResolution;
        suppressUniverse = true;
      } else if (response.ok && payload && typeof payload === "object") {
        const successPayload = payload as PublicZumiApiResponse;
        if (isPublicLivingResolution(successPayload.data?.resolution)) {
          resolution = successPayload.data.resolution;
        }
        if (isPublicZumiSuggestions(successPayload.data?.suggestions)) {
          suggestions = successPayload.data.suggestions;
        }
        if (isUniverseProjection(successPayload.data?.universe)) {
          universe = successPayload.data.universe;
        }
        replaceUniverse = successPayload.data?.replaceUniverse === true;
        suppressUniverse = successPayload.data?.suppressUniverse === true;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Network/provider failure does not erase the person's turn. The local resolver is
      // an emergency path only and is required to remain solution-first as well.
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }

    if (suppressUniverse) setActiveUniverse(null);
    else if (replaceUniverse) setActiveUniverse(universe);
    else if (universe) setActiveUniverse(universe);
    setTurns((current) => [...current, { id, prompt, resolution, suggestions }]);
    setPendingPrompt(null);
    setIsSubmitting(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendPrompt(intent);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!isSubmitting) event.currentTarget.form?.requestSubmit();
  }

  const activePlane = PUBLIC_LIVING_PLANE_LENSES.find((plane) => plane.id === activePlaneId)
    ?? PUBLIC_LIVING_PLANE_LENSES[2];

  const interfaceProgressIndex = activeUniverse
    ? 4
    : isSubmitting
      ? 1
      : latestTurn?.resolution.destination
        ? 2
        : latestTurn
          ? 1
          : 0;
  const activePathLabel = activeUniverse
    ? activeUniverse.availabilityCopy
    : latestTurn
      ? "More context needed"
      : "Waiting for an objective";

  function renderPlaneControls(surface: "desktop" | "mobile") {
    const readoutId = `public-plane-readout-${surface}`;
    return (
      <div aria-label="Five-plane view" className={styles.planeNav} role="group">
        {PUBLIC_LIVING_PLANE_LENSES.map((plane) => (
          <button
            aria-controls={readoutId}
            aria-pressed={activePlane.id === plane.id}
            className={styles.planeButton}
            data-living-edge={surface === "desktop" && activePlane.id === plane.id ? "active-plane" : undefined}
            key={`${surface}-${plane.id}`}
            onClick={() => setActivePlaneId(plane.id)}
            type="button"
          >
            <span className={styles.planeNumber}>{plane.number}</span>
            <span>
              <strong>{plane.title}</strong>
              <small>{plane.shortTitle}</small>
            </span>
          </button>
        ))}
      </div>
    );
  }

  function renderPlaneInspector(surface: "desktop" | "mobile") {
    return (
      <section
        className={styles.inspector}
        aria-label="Inspector"
        id={`public-plane-readout-${surface}`}
      >
        <p className={styles.inspectorLabel}>Inspector · {activePlane.number}</p>
        <h2>{activePlane.title}</h2>
        <p>{activePlane.description}</p>
        <p>{KLINIKOS_HUMAN_AUTHORITY}</p>
        <div className={styles.truthRow} aria-label="Public safety boundaries">
          <span>AI ≠ authority</span>
          <span>Eligibility first</span>
          <span>Patient data private</span>
        </div>
      </section>
    );
  }

  function renderActionGroup(category: (typeof PUBLIC_ACTION_GROUPS)[number], surface: "desktop" | "mobile") {
    return (
      <section className={styles.actionGroup} key={`${surface}-${category.id}`}>
        <h3 className={styles.actionGroupTitle}>{category.title}</h3>
        <div className={styles.actionList}>
          {PUBLIC_LIVING_ACTIONS.filter((action) => action.category === category.id).map((action) => (
            <button
              className={styles.actionButton}
              data-public-action-category={action.category}
              data-public-action-id={action.id}
              data-public-action-side={action.side}
              disabled={isSubmitting}
              key={`${surface}-${action.id}`}
              onClick={() => void sendPrompt(action.prompt, action.id)}
              type="button"
            >
              <span className={styles.actionText}>{action.label}</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="sr-only" aria-live="polite" role="status">{liveStatus}</div>
      <section
        aria-labelledby="public-living-title"
        className={styles.shell}
        data-living-universe-stage="true"
        data-public-universe-shell="true"
      >
        <header className={styles.header}>
          <KlinikosWordmark
            className="living-home-brand gap-4"
            frameClassName="size-[62px]"
            href="/"
            framed
            inverse
            markClassName="h-full w-full"
            textClassName="h-[32px] w-[232px]"
          />

          <nav aria-label="Primary" className={styles.primaryNavigation}>
            {PUBLIC_PRIMARY_NAVIGATION.map((item) => (
              <Link className={styles.headerLink} href={item.href} key={item.label}>{item.label}</Link>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <Link className={styles.joinLink} href="/signup">
              {signupEnabled ? "Join free" : "Free membership status"}
            </Link>
            <Link className={styles.headerLink} href="/login">Sign in</Link>
          </div>

          <details className={styles.mobileMenu}>
            <summary aria-label="Open navigation menu">
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <nav aria-label="Mobile navigation">
              {PUBLIC_PRIMARY_NAVIGATION.map((item) => (
                <Link href={item.href} key={item.label}>{item.label}</Link>
              ))}
              <Link href="/portal/login">Patient access</Link>
              <Link href="/signup">{signupEnabled ? "Join free" : "Free membership status"}</Link>
              <Link href="/login">Sign in</Link>
            </nav>
          </details>
        </header>

        <main className={styles.workspace}>
          <aside aria-label="Public interface progress" className={styles.experienceRail}>
            <p className={styles.railEyebrow}>Klinikos intelligence</p>
            <ol>
              {PUBLIC_INTERFACE_STEPS.map((step, index) => {
                const state = index < interfaceProgressIndex
                  ? "complete"
                  : index === interfaceProgressIndex
                    ? "active"
                    : "upcoming";
                return (
                  <li data-interface-state={state} key={step}>
                    <span aria-hidden="true" />
                    <strong>{step}</strong>
                  </li>
                );
              })}
            </ol>
            <p className={styles.progressBoundary}>
              This rail reflects this page only. It never claims care, work, payment, eligibility, or authority is complete.
            </p>
          </aside>

          <section className={styles.stage} data-public-object-stage="true">
            <div className={styles.stageScroll}>
              {!conversationStarted ? (
                <section className={styles.stageIntro} aria-label="Public Living Universe Object Stage">
                  <p className={styles.stageEyebrow}>Klinikos intelligence</p>
                  <h1 id="public-living-title">What do you need today?</h1>
                  <p className={styles.stageThesis}>{KLINIKOS_PUBLIC_ENTRY_LINE}</p>
                  <p className={styles.stageSummary}>
                    Tell Klinikos what you need, what you have, or what you are trying to become. The system projects a governed path without inventing identity, eligibility, availability, or authority.
                  </p>
                </section>
              ) : (
                <section aria-label="Public Zumi guidance" className={styles.conversation}>
                  <div className={styles.conversationHeading}>
                    <div>
                      <p className={styles.stageEyebrow}>Zumi · public guidance</p>
                      <h1 id="public-living-title">The universe is recomposing.</h1>
                    </div>
                    <span>
                      {activeUniverse
                        ? "One active path · governed continuation"
                        : "More context needed · no path inferred"}
                    </span>
                  </div>

              {turns.map((turn) => {
                const resolution = turn.resolution;
                const showSuggestions = turn.id === latestTurn?.id && turn.suggestions.length > 0;
                return (
                  <article className={styles.turn} key={turn.id}>
                    <p className={styles.visitorMessage}>{turn.prompt}</p>

                    <div className={styles.zumiMessage}>
                      <div aria-hidden="true"><ZumiOrb state="resolved" size={42} /></div>
                      <div className={styles.zumiAnswer}>
                        <span>Zumi</span>
                        <h2>{resolution.title}</h2>
                        <p>{resolution.body}</p>

                        {resolution.destination && (
                          <Link
                            className={styles.destinationLink}
                            href={destinationActionHref(resolution.destination)}
                          >
                            {resolution.destination.action}
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        )}

                        {showSuggestions && (
                          <div aria-label="Suggested replies" className={styles.suggestions}>
                            {turn.suggestions.map((suggestion) => (
                              <button
                                aria-label={`Reply: ${suggestion.label}`}
                                disabled={isSubmitting}
                                key={suggestion.id}
                                onClick={() => void sendPrompt(suggestion.prompt)}
                                type="button"
                              >
                                {suggestion.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

                  {pendingPrompt && (
                    <article aria-label="Zumi is responding" className={styles.turn}>
                      <p className={styles.visitorMessage}>{pendingPrompt}</p>
                      <div className={styles.zumiMessage}>
                        <div aria-hidden="true"><ZumiOrb state="observing" size={42} /></div>
                        <div className={styles.zumiAnswer}>
                          <span>Zumi</span>
                          <p>Working on your question…</p>
                        </div>
                      </div>
                    </article>
                  )}

                  <div ref={threadEnd} />
                </section>
              )}

              {activeUniverse && (
                <div className={styles.pathStage} data-living-edge="active-path">
                  <PublicLivingUniverseObjectStage
                    item={activeUniverse}
                    signupEnabled={signupEnabled}
                  />
                </div>
              )}

              <div className={styles.composerDock} data-public-action-dock="true">
                <form aria-label="Ask Zumi" id="living-composer" onSubmit={submit}>
                  <label className="sr-only" htmlFor="public-klinikos-intent">Message Zumi</label>
                  <div className={`${styles.composer} reference-composer-shell grid-cols-[minmax(0,1fr)_3.5rem]`}>
                    <textarea
                      aria-describedby="public-conversation-disclosure"
                      className="min-w-0 w-full"
                      id="public-klinikos-intent"
                      onChange={(event) => setIntent(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Ask Klinikos anything..."
                      rows={1}
                      value={intent}
                    />
                    <button
                      aria-label={isSubmitting ? "Zumi is responding" : "Send message to Zumi"}
                      className={styles.sendButton}
                      disabled={isSubmitting || !intent.trim()}
                      type="submit"
                    >
                      <ArrowRight aria-hidden="true" className="size-5" />
                    </button>
                    <span aria-hidden="true" className={styles.zumiPresence}>
                      <span><ZumiSendGlyph active={isSubmitting} /></span>
                      <strong>zumi</strong>
                      <small>Your AI operating partner</small>
                    </span>
                  </div>
                  <p className={styles.disclosure} id="public-conversation-disclosure">
                    Public Zumi can answer general Klinikos questions and guide you to a next step. This page cannot open private clinic records or make changes. Do not enter patient information here.
                  </p>
                </form>
              </div>

              {!conversationStarted ? (
                <div className={styles.stageReadout} aria-live="polite">
                  <strong>{activePlane.title}</strong>
                  <span>{activePlane.question}</span>
                  <p>{activePlane.description}</p>
                </div>
              ) : null}
            </div>
          </section>

          <aside className={styles.contextRail} data-public-inspector="true" data-public-plane-lens="true">
            <p className={styles.railEyebrow}>Public context</p>
            <dl className={styles.contextFacts}>
              <div><dt>Mode</dt><dd>Public guidance</dd></div>
              <div><dt>Identity</dt><dd>Not assumed</dd></div>
              <div><dt>Active lens</dt><dd>{activePlane.shortTitle}</dd></div>
              <div><dt>Path</dt><dd>{activePathLabel}</dd></div>
            </dl>
            <p className={styles.contextBoundary}>
              This surface shows minimum-necessary public guidance. Policy, eligibility, ranking, and authority remain server-owned.
            </p>
            {renderPlaneInspector("desktop")}
            {renderPlaneControls("desktop")}
          </aside>
        </main>

        {!conversationStarted ? (
          <section className={styles.objectShelf} aria-label="Start with a real Klinikos objective">
            <div className={styles.featuredObjects} data-public-object-row="true">
              {FEATURED_PUBLIC_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    className={styles.featuredButton}
                    data-public-action-category={action.category}
                    data-public-action-id={action.id}
                    data-public-action-side={action.side}
                    disabled={isSubmitting}
                    key={action.id}
                    onClick={() => void sendPrompt(action.prompt, action.id)}
                    type="button"
                  >
                    <span className={styles.featuredIcon}><Icon aria-hidden="true" className="size-5" /></span>
                    <span>
                      <strong>{action.title}</strong>
                      <small>{action.body}</small>
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                );
              })}
            </div>

            <details className={styles.intentLibrary}>
              <summary>See every way to begin</summary>
              <div data-public-intent-constellation="true">
                {PUBLIC_ACTION_GROUPS.map((category) => renderActionGroup(category, "desktop"))}
              </div>
            </details>

            <section className={styles.lowerStrip} data-public-lower-strip="true">
              <span aria-hidden="true" className={styles.lowerStripArt} />
              <div className={styles.lowerStripContent}>
                <p className={styles.railEyebrow}>One governed healthcare network</p>
                <h2>Start with the objective. Klinikos assembles what must happen next.</h2>
                <p>{KLINIKOS_SUPPORTING}</p>
                <Link className={styles.lowerStripLink} href="/how-it-works">
                  See how Klinikos works <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </section>
          </section>
        ) : null}

        <nav aria-label="Living Universe mobile controls" className={styles.mobileDock}>
          <details
            className={styles.mobileDrawer}
            data-mobile-drawer="start"
            onToggle={(event) => {
              if (event.currentTarget.open) setOpenMobileDrawer("start");
              else setOpenMobileDrawer((current) => current === "start" ? null : current);
            }}
            open={openMobileDrawer === "start"}
          >
            <summary>Start</summary>
            <div className={styles.mobileDrawerPanel}>
              {PUBLIC_ACTION_GROUPS.map((category) => renderActionGroup(category, "mobile"))}
            </div>
          </details>
          <details
            className={styles.mobileDrawer}
            data-mobile-drawer="planes"
            onToggle={(event) => {
              if (event.currentTarget.open) setOpenMobileDrawer("planes");
              else setOpenMobileDrawer((current) => current === "planes" ? null : current);
            }}
            open={openMobileDrawer === "planes"}
          >
            <summary>Planes · {activePlane.shortTitle}</summary>
            <div className={styles.mobileDrawerPanel}>
              {renderPlaneControls("mobile")}
              {renderPlaneInspector("mobile")}
            </div>
          </details>
          <details
            className={styles.mobileDrawer}
            data-mobile-drawer="context"
            onToggle={(event) => {
              if (event.currentTarget.open) setOpenMobileDrawer("context");
              else setOpenMobileDrawer((current) => current === "context" ? null : current);
            }}
            open={openMobileDrawer === "context"}
          >
            <summary>Context</summary>
            <div className={styles.mobileDrawerPanel}>
              <dl className={styles.contextFacts}>
                <div><dt>Mode</dt><dd>Public guidance</dd></div>
                <div><dt>Identity</dt><dd>Not assumed</dd></div>
                <div><dt>Path</dt><dd>{activePathLabel}</dd></div>
              </dl>
            </div>
          </details>
          <Link href="/grid/browse">Grid</Link>
        </nav>
      </section>
    </>
  );
}
