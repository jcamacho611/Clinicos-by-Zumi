"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { ZumiOrb } from "@/components/ds";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import type { PublicLivingResolution } from "@/lib/orchestration/public-living-intent";
import { publicLivingDestinationHref } from "@/lib/distribution/public-continuation";
import { ZUMI_COMPOSER_PROMPT } from "@/lib/brand/canonical-messaging";

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

type PublicZumiApiResponse = {
  data?: {
    resolution?: unknown;
    suggestions?: unknown;
  };
};

const PUBLIC_SESSION_KEY = "klinikos.public.zumi.session";

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

const navItems = [
  { label: "Clinics", href: "/founding-clinic" },
  { label: "Grid", href: "/grid" },
  { label: "EDU", href: "/edu" },
  { label: "Pricing", href: "/pricing" },
  { label: "Trust", href: "/trust" },
] as const;

const quickActions = [
  { label: "Run a clinic", href: "/founding-clinic" },
  { label: "Open Grid", href: "/grid" },
  { label: "Learn", href: "/edu" },
  { label: "Get care", href: "/portal/login" },
] as const;

const UNREACHABLE_RESOLUTION: PublicLivingResolution = {
  kind: "conversation",
  title: "I can't reach Klinikos right now",
  body: "Your message didn't get through, so I'd rather say so than guess. Try again in a moment.",
  assumption: null,
  destination: null,
  confidence: 0,
};

export function PublicLivingGateway() {
  const [intent, setIntent] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function sendPrompt(rawPrompt: string) {
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
        { role: "user" as const, content: turn.prompt },
        { role: "assistant" as const, content: `${turn.resolution.title}\n${turn.resolution.body}` },
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

    let resolution: PublicLivingResolution = UNREACHABLE_RESOLUTION;
    let suggestions: PublicZumiSuggestion[] = [];

    try {
      const response = await fetch("/api/zumi/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          history,
          priorResolution,
          unresolvedTurns,
          sessionId: publicConversationId(),
          surface: window.location.pathname,
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.ok) {
        const payload = await response.json() as PublicZumiApiResponse;
        if (isPublicLivingResolution(payload.data?.resolution)) resolution = payload.data.resolution;
        if (isPublicZumiSuggestions(payload.data?.suggestions)) suggestions = payload.data.suggestions;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }

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

  return (
    <>
      <div className="sr-only" aria-live="polite" role="status">{liveStatus}</div>
      <section className="rose-home relative isolate min-h-[100svh] overflow-hidden bg-[#050303] text-[#f8f0ee]" aria-labelledby="public-living-title">
        <div className="rose-vignette pointer-events-none absolute inset-0 z-0" />
        <div className={`rose-atmosphere pointer-events-none absolute inset-0 z-0 transition-all duration-700 ${conversationStarted ? "scale-[1.02] opacity-15" : "scale-100 opacity-80"}`} />

        <header className="reference-header relative z-30 flex min-h-[88px] items-center px-5 sm:px-9 lg:px-[38px]">
          <KlinikosWordmark
            className="living-home-brand gap-[14px]"
            frameClassName="size-[52px]"
            href="/"
            framed
            inverse
            markClassName="h-full w-full"
            textClassName="h-[28px] w-[200px]"
          />

          <nav className="mx-auto hidden items-center gap-8 text-[11px] font-semibold text-[#d8c7c4] lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <Link className="min-h-11 content-center transition-colors hover:text-[#f29a93]" href={item.href} key={item.label}>{item.label}</Link>
            ))}
          </nav>

          <details className="relative ml-auto lg:hidden">
            <summary className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-full border border-[#d9837f]/25 bg-[#140a0c]/75 text-[#f6dfdc] [&::-webkit-details-marker]:hidden" aria-label="Open navigation menu">
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <nav className="absolute right-0 top-14 z-50 grid w-56 gap-1 rounded-2xl border border-[#d9837f]/22 bg-[#12090b]/[.98] p-2 shadow-2xl" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link className="min-h-11 rounded-xl px-4 py-3 text-xs font-semibold text-[#ead8d4] hover:bg-white/5 hover:text-white" href={item.href} key={item.label}>{item.label}</Link>
              ))}
              <Link className="min-h-11 rounded-xl px-4 py-3 text-xs font-semibold text-[#efaaa1] hover:bg-white/5" href="/portal/login">Patient access</Link>
              <Link className="min-h-11 rounded-xl px-4 py-3 text-xs font-semibold text-[#efaaa1] hover:bg-white/5" href="/login">Sign in</Link>
            </nav>
          </details>

          <Link className="reference-auth ml-3 hidden min-h-11 items-center justify-center rounded-full border border-[#d9837f]/25 bg-[#140a0c]/75 px-5 text-[11px] font-semibold text-[#f6dfdc] shadow-[0_0_24px_rgba(211,112,108,.08)] sm:inline-flex" href="/login">
            Sign in
          </Link>
        </header>

        {!conversationStarted ? (
          <main className="relative z-10 mx-auto flex min-h-[calc(100svh-88px)] max-w-4xl items-center justify-center px-5 pb-20 sm:px-9">
            <section className="flex w-full flex-col items-center text-center">
              <div className="mb-5 grid size-14 place-items-center rounded-full border border-[#e6817b]/32 bg-[#12090b]/80 shadow-[0_0_45px_rgba(230,129,123,.18)]" aria-hidden="true">
                <ZumiOrb state="observing" size={44} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-[#e88f88]">Zumi</p>
              <h1 className="mt-4 text-balance text-[clamp(2.5rem,6vw,5.4rem)] font-extralight leading-[.96] tracking-[-.055em] text-[#fff8f6]" id="public-living-title">
                What needs to happen?
              </h1>
              <p className="mt-5 max-w-[560px] text-sm leading-7 text-[#d6c0bc]">
                Tell Zumi the outcome you need. Klinikos will route the work, preserve the useful context, and ask for identity or authority only when the next step actually requires it.
              </p>

              <form id="living-composer" className="mt-8 w-full max-w-[780px]" onSubmit={submit} aria-label={ZUMI_COMPOSER_PROMPT}>
                <label className="sr-only" htmlFor="public-klinikos-intent">Message Zumi</label>
                <div className="reference-composer-shell grid min-h-[92px] grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3 rounded-[28px] border border-[#d9918a]/35 bg-[#1b0d10]/72 px-5 py-3 shadow-[0_22px_70px_rgba(59,8,12,.38)] backdrop-blur-xl focus-within:border-[#ec9b94]/65">
                  <textarea
                    aria-describedby="public-conversation-disclosure"
                    className="max-h-36 min-h-14 min-w-0 w-full resize-none bg-transparent py-4 text-left text-[15px] font-medium text-[#fff6f4] outline-none placeholder:text-[#b99a95]"
                    id="public-klinikos-intent"
                    onChange={(event) => setIntent(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Message Zumi..."
                    rows={1}
                    value={intent}
                  />
                  <button aria-label={isSubmitting ? "Zumi is responding" : "Send message to Zumi"} className="grid size-12 place-items-center rounded-full border border-[#e6817b]/35 bg-[#16090c] shadow-[0_0_28px_rgba(230,129,123,.16)] transition hover:border-[#efaaa1]/60 hover:bg-[#211013] disabled:cursor-not-allowed disabled:opacity-45" disabled={isSubmitting || !intent.trim()} type="submit">
                    <ZumiSendGlyph active={isSubmitting} />
                  </button>
                </div>
                <p className="mx-auto mt-4 max-w-[680px] text-[11px] leading-5 text-[#ad928d]" id="public-conversation-disclosure">
                  Public Zumi can answer general Klinikos questions and guide you to a next step. This page cannot open private clinic records or make changes. Do not enter patient information here.
                </p>
              </form>

              <nav className="mt-7 flex flex-wrap items-center justify-center gap-2" aria-label="Start with a Klinikos path">
                {quickActions.map((action) => (
                  <Link className="inline-flex min-h-11 items-center rounded-full border border-[#d9918a]/22 bg-[#12090b]/55 px-4 text-[12px] font-semibold text-[#d9c4c0] backdrop-blur-md transition hover:border-[#efaaa1]/55 hover:text-[#fff8f6]" href={action.href} key={action.label}>
                    {action.label}
                  </Link>
                ))}
              </nav>
            </section>
          </main>
        ) : (
          <main className="relative z-10 mx-auto flex min-h-[calc(100svh-88px)] max-w-4xl flex-col px-5 pb-8 pt-6 sm:px-9">
            <section className="flex-1 space-y-8 py-4" aria-label="Public Zumi guidance">
              {turns.map((turn) => {
                const resolution = turn.resolution;
                const showSuggestions = turn.id === latestTurn?.id && turn.suggestions.length > 0;
                return (
                  <article className="space-y-5" key={turn.id}>
                    <div className="flex justify-end">
                      <p className="max-w-[86%] rounded-[22px] border border-[#d0837d]/16 bg-[#211013]/80 px-5 py-3 text-sm leading-6 text-[#fff7f5] sm:max-w-[74%]">{turn.prompt}</p>
                    </div>

                    <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
                      <div className="pt-1" aria-hidden="true"><ZumiOrb state="resolved" size={42} /></div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#e9aaa4]">Zumi</p>
                        <h2 className="mt-2 text-xl font-medium tracking-[-.03em] text-[#fff8f6]">{resolution.title}</h2>
                        <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-7 text-[#d8c1bd]">{resolution.body}</p>

                        {resolution.destination && (
                          <Link
                            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6817b] px-5 text-xs font-semibold text-[#1a090a] transition hover:bg-[#efaaa1]"
                            href={publicLivingDestinationHref(resolution.destination)}
                          >
                            {resolution.destination.action}
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        )}

                        {showSuggestions && (
                          <div className="mt-5 flex flex-wrap gap-2" aria-label="Suggested replies">
                            {turn.suggestions.map((suggestion) => (
                              <button
                                aria-label={`Reply: ${suggestion.label}`}
                                className="min-h-11 rounded-full border border-[#d0837d]/22 bg-[#1a0c0f] px-4 text-left text-[12px] font-semibold text-[#e8cbc7] transition hover:border-[#efaaa1]/45 hover:bg-[#241014] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b] disabled:opacity-45"
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
                <article className="space-y-5" aria-label="Zumi is responding">
                  <div className="flex justify-end">
                    <p className="max-w-[86%] rounded-[22px] border border-[#d0837d]/16 bg-[#211013]/80 px-5 py-3 text-sm leading-6 text-[#fff7f5] sm:max-w-[74%]">{pendingPrompt}</p>
                  </div>
                  <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
                    <div className="pt-1" aria-hidden="true"><ZumiOrb state="observing" size={42} /></div>
                    <div className="min-w-0 py-2">
                      <p className="text-[11px] font-semibold text-[#e9aaa4]">Zumi</p>
                      <p className="mt-2 text-sm text-[#b99f9b]">Working on your question…</p>
                    </div>
                  </div>
                </article>
              )}

              <div ref={threadEnd} />
            </section>

            <form className="sticky bottom-4 mt-8 rounded-[24px] border border-[#d0837d]/22 bg-[#12090b]/95 p-3 shadow-2xl backdrop-blur-xl" onSubmit={submit}>
              <label className="sr-only" htmlFor="public-klinikos-follow-up">Continue with public Zumi</label>
              <div className="flex items-end gap-3">
                <textarea
                  aria-describedby="public-follow-up-note"
                  className="min-h-12 min-w-0 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-[#fff6f4] outline-none placeholder:text-[#b99a95]"
                  id="public-klinikos-follow-up"
                  onChange={(event) => setIntent(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Message Zumi..."
                  rows={1}
                  value={intent}
                />
                <button aria-label={isSubmitting ? "Zumi is responding" : "Send follow-up to Zumi"} className="grid size-11 shrink-0 place-items-center rounded-full border border-[#e6817b]/35 bg-[#16090c] shadow-[0_0_24px_rgba(230,129,123,.14)] transition hover:border-[#efaaa1]/60 hover:bg-[#211013] disabled:cursor-not-allowed disabled:opacity-45" disabled={isSubmitting || !intent.trim()} type="submit">
                  <ZumiSendGlyph active={isSubmitting} />
                </button>
              </div>
              <p className="mt-2 px-3 text-[11px] leading-4 text-[#9a817c]" id="public-follow-up-note">
                Public Zumi can guide and answer general Klinikos questions, but it cannot access private clinic records or execute changes.
              </p>
            </form>
          </main>
        )}
      </section>
    </>
  );
}
