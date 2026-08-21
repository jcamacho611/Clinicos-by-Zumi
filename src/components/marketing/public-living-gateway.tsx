"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { ZumiOrb } from "@/components/ds";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import {
  resolvePublicLivingIntent,
  type PublicLivingResolution,
} from "@/lib/orchestration/public-living-intent";
import {
  KLINIKOS_ECONOMIC_THESIS,
  KLINIKOS_HUMAN_AUTHORITY,
  KLINIKOS_ONE_LINE,
  KLINIKOS_SUPPORTING,
  ZUMI_COMPOSER_PROMPT,
} from "@/lib/brand/canonical-messaging";

type ConversationTurn = {
  id: number;
  prompt: string;
  resolution: PublicLivingResolution;
};

type PublicZumiApiResponse = {
  data?: {
    resolution?: unknown;
  };
};

const protectedHref = (href: string) => `/login?next=${encodeURIComponent(href)}`;
const publicActionPaths = new Set(["/grid", "/edu", "/pricing", "/trust", "/ecosystem", "/how-it-works", "/founding-clinic", "/sales"]);

function destinationActionHref(href: string) {
  if (href === "/portal") return "/portal/login";
  if (publicActionPaths.has(href)) return href;
  return protectedHref(href);
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = intent.trim();
    if (!prompt || isSubmitting) return;

    const priorResolution = turns[turns.length - 1]?.resolution ?? null;
    let unresolvedTurns = 0;
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      if (turns[index].resolution.confidence > 0.25) break;
      unresolvedTurns += 1;
    }
    const fallback = resolvePublicLivingIntent(prompt, priorResolution, unresolvedTurns);
    const history = turns
      .flatMap((turn) => ([
        { role: "user" as const, content: turn.prompt },
        { role: "assistant" as const, content: `${turn.resolution.title}\n${turn.resolution.body}` },
      ]))
      .slice(-6);
    const id = nextTurnId.current;
    nextTurnId.current += 1;

    setIntent("");
    setPendingPrompt(prompt);
    setIsSubmitting(true);

    const controller = new AbortController();
    activeRequest.current?.abort();
    activeRequest.current = controller;

    let resolution = fallback;

    try {
      const response = await fetch("/api/zumi/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, history }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.ok) {
        const payload = await response.json() as PublicZumiApiResponse;
        if (isPublicLivingResolution(payload.data?.resolution)) {
          resolution = payload.data.resolution;
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Network/provider failure does not erase the person's turn. The deterministic
      // navigator is the truthful degraded path and remains entirely local/public.
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }

    setTurns((current) => [...current, { id, prompt, resolution }]);
    setPendingPrompt(null);
    setIsSubmitting(false);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!isSubmitting) event.currentTarget.form?.requestSubmit();
  }

  return (
    <>
      <div className="sr-only" aria-live="polite" role="status">{liveStatus}</div>
      <section className="rose-home min-h-screen overflow-hidden bg-[#050303] text-[#f8f0ee]" aria-labelledby="public-living-title">
        <div className="rose-vignette pointer-events-none fixed inset-0 -z-10" />
        <div className={`rose-atmosphere pointer-events-none fixed inset-0 -z-10 transition-all duration-700 ${conversationStarted ? "scale-[1.02] opacity-20" : "scale-100 opacity-100"}`} />

        <header className="reference-header relative z-30 flex min-h-[96px] items-center px-5 sm:px-9 lg:px-[38px]">
          <KlinikosWordmark
            className="living-home-brand gap-[18px]"
            frameClassName="size-[66px]"
            href="/"
            framed
            inverse
            markClassName="h-full w-full"
            textClassName="h-[38px] w-[272px]"
          />

          <nav className="mx-auto hidden items-center gap-8 text-[11px] font-semibold text-[#d8c7c4] lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <Link className="transition-colors hover:text-[#f29a93]" href={item.href} key={item.label}>{item.label}</Link>
            ))}
          </nav>

          <details className="relative ml-auto lg:hidden">
            <summary className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-full border border-[#d9837f]/25 bg-[#140a0c]/75 text-[#f6dfdc] [&::-webkit-details-marker]:hidden" aria-label="Open navigation menu">
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <nav className="absolute right-0 top-14 z-50 grid w-56 gap-1 rounded-2xl border border-[#d9837f]/22 bg-[#12090b]/[.98] p-2 shadow-2xl" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link className="rounded-xl px-4 py-3 text-xs font-semibold text-[#ead8d4] hover:bg-white/5 hover:text-white" href={item.href} key={item.label}>{item.label}</Link>
              ))}
              <Link className="rounded-xl px-4 py-3 text-xs font-semibold text-[#efaaa1] hover:bg-white/5" href="/portal/login">Patient access</Link>
              <Link className="rounded-xl px-4 py-3 text-xs font-semibold text-[#efaaa1] hover:bg-white/5" href="/login">Sign in</Link>
            </nav>
          </details>

          <Link className="reference-auth ml-3 hidden min-h-11 items-center justify-center rounded-full border border-[#d9837f]/25 bg-[#140a0c]/75 px-5 text-[11px] font-semibold text-[#f6dfdc] shadow-[0_0_24px_rgba(211,112,108,.08)] sm:inline-flex" href="/login">
            Sign in
          </Link>
        </header>

        {!conversationStarted ? (
          <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-5xl items-center justify-center px-5 pb-16 sm:px-9">
            <section className="flex w-full flex-col items-center text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#e88f88]">Klinikos</p>
              <h1 id="public-living-title" className="mt-5 max-w-[900px] text-balance text-[clamp(2.4rem,5.4vw,4.6rem)] font-extralight leading-[1.02] tracking-[-0.045em] text-[#f5edeb]">
                {KLINIKOS_ONE_LINE}
              </h1>
              <p className="mt-6 max-w-[680px] text-sm leading-7 text-[#e2cecb] sm:text-base">
                {KLINIKOS_SUPPORTING}
              </p>
              <p className="mt-4 max-w-[640px] text-[13px] leading-6 text-[#d3bcb8]">
                {KLINIKOS_ECONOMIC_THESIS}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-[#e6817b] px-6 py-3 text-sm font-semibold text-[#1a090a] transition hover:bg-[#efaaa1]"
                  href="/operational-audit"
                >
                  See what Klinikos would replace <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-[#d9918a]/35 px-6 py-3 text-sm font-semibold text-[#f5edeb] transition hover:border-[#efaaa1]/60 hover:bg-[#e6817b]/10"
                  href="/how-it-works"
                >
                  See how it works
                </Link>
              </div>

              <p className="mt-5 max-w-[620px] text-[12px] leading-5 text-[#c6aeaa]">
                {KLINIKOS_HUMAN_AUTHORITY}
              </p>

              <p className="mt-14 text-sm font-semibold tracking-[-.02em] text-[#f2d8d4]">Zumi</p>
              <p className="mt-4 text-lg font-light tracking-[-.02em] text-[#f5edeb] sm:text-xl">
                {ZUMI_COMPOSER_PROMPT}
              </p>
              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#c3aaa6]">
                Describe something your clinic is dealing with and Zumi will help you find the next useful step.
              </p>

              <form id="living-composer" className="mt-9 w-full max-w-[780px]" onSubmit={submit}>
                <label className="sr-only" htmlFor="public-klinikos-intent">Message Zumi</label>
                <div className="reference-composer-shell grid min-h-[88px] grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3 rounded-[28px] border border-[#d9918a]/35 bg-[#1b0d10]/68 px-5 py-3 shadow-[0_22px_70px_rgba(59,8,12,.38)] backdrop-blur-xl focus-within:border-[#ec9b94]/65">
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

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-[#b99a95]">
                <Link className="hover:text-[#efaaa1]" href="/portal/login">Patient access</Link>
                <span aria-hidden="true">·</span>
                <Link className="hover:text-[#efaaa1]" href="/grid">Open Grid</Link>
                <span aria-hidden="true">·</span>
                <Link className="hover:text-[#efaaa1]" href="/edu">Explore EDU</Link>
              </div>
            </section>
          </main>
        ) : (
          <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-4xl flex-col px-5 pb-8 pt-6 sm:px-9">
            <section className="flex-1 space-y-8 py-4" aria-label="Public Zumi guidance">
              {turns.map((turn) => {
                const resolution = turn.resolution;
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
                            href={destinationActionHref(resolution.destination.href)}
                          >
                            {resolution.destination.action}
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </Link>
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