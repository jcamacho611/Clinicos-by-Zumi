"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { ZumiOrb } from "@/components/ds";
import type { PublicLivingResolution } from "@/lib/orchestration/public-living-intent";

const PUBLIC_SESSION_KEY = "klinikos.public.zumi.session";
const PUBLIC_PATHS = new Set([
  "/about",
  "/capabilities",
  "/ecosystem",
  "/founding-clinic",
  "/how-it-works",
  "/operational-audit",
  "/pricing",
  "/sales",
  "/start",
  "/trust",
  "/grid",
  "/grid/browse",
  "/grid/pricing",
  "/edu",
]);

type PublicZumiSuggestion = { id: string; label: string; prompt: string };
type Turn = { id: number; prompt: string; resolution: PublicLivingResolution; suggestions: PublicZumiSuggestion[] };
type ApiResponse = { data?: { resolution?: unknown; suggestions?: unknown } };

const publicActionPaths = new Set(["/grid", "/edu", "/pricing", "/trust", "/ecosystem", "/how-it-works", "/founding-clinic", "/sales", "/operational-audit", "/access"]);

function destinationHref(href: string) {
  if (href === "/login") return "/login";
  if (href === "/portal") return "/portal/login";
  if (publicActionPaths.has(href)) return href;
  return `/login?next=${encodeURIComponent(href)}`;
}

const UNREACHABLE_RESOLUTION: PublicLivingResolution = {
  kind: "conversation",
  title: "I can't reach Klinikos right now",
  body: "Your message didn't get through, so I'd rather say so than guess. Try again in a moment.",
  assumption: null,
  destination: null,
  confidence: 0,
};

function isResolution(value: unknown): value is PublicLivingResolution {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublicLivingResolution>;
  if (candidate.kind !== "conversation" && candidate.kind !== "route") return false;
  if (typeof candidate.title !== "string" || typeof candidate.body !== "string") return false;
  if (candidate.assumption !== null && typeof candidate.assumption !== "string") return false;
  if (typeof candidate.confidence !== "number" || !Number.isFinite(candidate.confidence)) return false;
  if (candidate.destination === null) return true;
  const destination = candidate.destination;
  if (!destination || typeof destination !== "object") return false;
  return typeof destination.href === "string"
    && destination.href.startsWith("/")
    && !destination.href.startsWith("//")
    && typeof destination.action === "string"
    && typeof destination.key === "string";
}

function isSuggestions(value: unknown): value is PublicZumiSuggestion[] {
  return Array.isArray(value)
    && value.length <= 4
    && value.every((item) => item && typeof item === "object"
      && typeof (item as PublicZumiSuggestion).id === "string"
      && typeof (item as PublicZumiSuggestion).label === "string"
      && typeof (item as PublicZumiSuggestion).prompt === "string");
}

function sessionId() {
  try {
    const existing = window.sessionStorage.getItem(PUBLIC_SESSION_KEY);
    if (existing) return existing;
    const created = window.crypto.randomUUID();
    window.sessionStorage.setItem(PUBLIC_SESSION_KEY, created);
    return created;
  } catch {
    return undefined;
  }
}

function pagePrompt(pathname: string) {
  if (pathname.startsWith("/grid")) return "What is Grid and what can I do here?";
  if (pathname === "/pricing") return "Help me understand Klinikos pricing and what it replaces.";
  if (pathname === "/edu") return "What can Klinikos EDU help with?";
  if (pathname === "/trust") return "What should I know about Klinikos trust, privacy and authority boundaries?";
  if (pathname === "/founding-clinic") return "What does the founding clinic path mean for a clinic?";
  if (pathname === "/operational-audit") return "How does the operating analysis help a clinic?";
  return "What can Klinikos help me do from this page?";
}

export function PublicZumiSiteControl() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const enabled = PUBLIC_PATHS.has(pathname);
  const latest = turns[turns.length - 1] ?? null;

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!open) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
  }, [open, turns.length, pending]);

  if (!enabled) return null;

  async function send(raw: string) {
    const prompt = raw.trim();
    if (!prompt || pending) return;

    const prior = turns[turns.length - 1]?.resolution ?? null;
    const history = turns.flatMap((turn) => [
      { role: "user" as const, content: turn.prompt },
      { role: "assistant" as const, content: `${turn.resolution.title}\n${turn.resolution.body}` },
    ]).slice(-12);
    const id = nextId.current++;

    setInput("");
    setPending(prompt);
    setOpen(true);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    // No local resolution: the routing engine is server-side, so an unreachable server
    // means honest degraded guidance rather than an invented answer.
    let resolution: PublicLivingResolution = UNREACHABLE_RESOLUTION;
    let suggestions: PublicZumiSuggestion[] = [];

    try {
      const response = await fetch("/api/zumi/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          question: prompt,
          history,
          priorResolution: prior,
          unresolvedTurns: turns.length,
          sessionId: sessionId(),
          surface: pathname,
        }),
      });
      if (response.ok) {
        const payload = await response.json() as ApiResponse;
        if (isResolution(payload.data?.resolution)) resolution = payload.data.resolution;
        if (isSuggestions(payload.data?.suggestions)) suggestions = payload.data.suggestions;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      if (request.current === controller) request.current = null;
    }

    setTurns((current) => [...current, { id, prompt, resolution, suggestions }]);
    setPending(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!pending) event.currentTarget.form?.requestSubmit();
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="Public Zumi assistant"
          className="flex max-h-[min(680px,calc(100vh-7rem))] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[24px] border border-[#d0837d]/25 bg-[#0b0507]/[.98] text-[#fff7f5] shadow-[0_28px_90px_rgba(0,0,0,.52)] backdrop-blur-xl"
          id="public-zumi-site-panel"
          role="dialog"
        >
          <header className="flex items-center gap-3 border-b border-[#d0837d]/14 px-4 py-3">
            <ZumiOrb state={pending ? "analyzing" : "observing"} size={34} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Zumi</p>
              <p className="truncate text-[11px] text-[#a98f8b]">Your public Klinikos assistant · {pathname}</p>
            </div>
            <button aria-label="Close public Zumi" className="grid size-10 place-items-center rounded-full text-[#bca5a1] hover:bg-white/5 hover:text-white" onClick={() => setOpen(false)} type="button"><X className="size-4" /></button>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            {turns.length === 0 && !pending && (
              <div className="rounded-[18px] border border-[#d0837d]/14 bg-[#150a0d] p-4">
                <p className="text-sm font-semibold text-[#f5d5d1]">Ask me about this page or what you are trying to accomplish.</p>
                <p className="mt-2 text-xs leading-5 text-[#bca5a1]">I can explain public Klinikos workflows and help find a next step. I cannot access private clinic records or execute clinic changes here.</p>
                <button className="mt-4 min-h-10 rounded-full border border-[#e6817b]/28 px-4 text-xs font-semibold text-[#efaaa1] hover:bg-[#e6817b]/10" onClick={() => void send(pagePrompt(pathname))} type="button">Explain this page</button>
              </div>
            )}

            {turns.map((turn) => (
              <article className="space-y-3" key={turn.id}>
                <p className="ml-auto max-w-[86%] rounded-[18px] bg-[#241014] px-4 py-3 text-sm leading-6">{turn.prompt}</p>
                <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
                  <ZumiOrb state="resolved" size={30} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#e9aaa4]">Zumi</p>
                    <p className="mt-1 text-sm font-semibold leading-5">{turn.resolution.title}</p>
                    <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[#d8c1bd]">{turn.resolution.body}</p>
                    {turn.resolution.destination && (
                      <Link className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#e6817b] px-4 text-xs font-semibold text-[#1a090a]" href={destinationHref(turn.resolution.destination.href)}>
                        {turn.resolution.destination.action}<ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    )}
                    {turn.id === latest?.id && turn.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested replies">
                        {turn.suggestions.map((suggestion) => (
                          <button className="min-h-9 rounded-full border border-[#d0837d]/22 px-3 text-left text-[11px] font-semibold text-[#e8cbc7] hover:bg-white/5" disabled={Boolean(pending)} key={suggestion.id} onClick={() => void send(suggestion.prompt)} type="button">{suggestion.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {pending && (
              <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3" aria-live="polite">
                <ZumiOrb state="analyzing" size={30} />
                <p className="py-2 text-xs text-[#bca5a1]">Working on your question…</p>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="border-t border-[#d0837d]/14 p-3" onSubmit={submit}>
            <label className="sr-only" htmlFor="public-zumi-site-input">Message Zumi</label>
            <div className="grid grid-cols-[minmax(0,1fr)_3rem] items-end gap-2 rounded-[18px] border border-[#d0837d]/22 bg-[#150a0d] p-2 focus-within:border-[#e6817b]/50">
              <textarea className="max-h-28 min-h-11 min-w-0 resize-none bg-transparent px-2 py-3 text-sm outline-none placeholder:text-[#866f6b]" disabled={Boolean(pending)} id="public-zumi-site-input" onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} placeholder="Message Zumi..." rows={1} value={input} />
              <button aria-label={pending ? "Zumi is responding" : "Send message to Zumi"} className="grid size-11 place-items-center rounded-full border border-[#e6817b]/30 bg-[#16090c] disabled:opacity-45" disabled={Boolean(pending) || !input.trim()} type="submit"><ZumiOrb state={pending ? "analyzing" : "observing"} size={30} /></button>
            </div>
            <p className="mt-2 px-2 text-[11px] leading-4 text-[#a8918c]">Public Zumi cannot open private records or execute clinic changes. Do not enter patient information here.</p>
          </form>
        </section>
      )}

      <button
        aria-controls="public-zumi-site-panel"
        aria-expanded={open}
        aria-label={open ? "Public Zumi assistant is open" : "Open Zumi assistant"}
        className="flex min-h-12 items-center gap-2 rounded-full border border-[#d0837d]/30 bg-[#12090b]/95 px-3 pr-4 text-sm font-semibold text-[#f4d8d4] shadow-[0_14px_44px_rgba(0,0,0,.4)] backdrop-blur-xl transition hover:border-[#efaaa1]/50 hover:bg-[#211013] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <ZumiOrb state={pending ? "analyzing" : "observing"} size={32} />
        <span>Zumi</span>
      </button>
    </div>
  );
}
