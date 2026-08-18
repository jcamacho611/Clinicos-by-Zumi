"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  Files,
  HeartPulse,
  Home,
  Network,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { VoiceInputButton } from "@/components/clinic/voice-input";
import { cn } from "@/lib/utils";

type ConversationMessage = { id: string; role: "user" | "assistant"; text: string };
type TrustedAction = { id: string; title: string; reason: string; href: string | null; state: string; blockers: string[] };
type TrustedBlocker = { code: string; title: string; explanation: string; owner: string; canResolveNow: boolean };
type TrustedOrchestration = {
  path?: { pathId: string; title: string; status: string; progress: number; blockers: string[] } | null;
  nextActions?: TrustedAction[];
  blockers?: TrustedBlocker[];
};
type BrowserStatus = "idle" | "working" | "ready" | "needs_you";
type BrowserSession = {
  id: string;
  title: string;
  createdAt: number;
  status: BrowserStatus;
  conversationToken: string | null;
  messages: ConversationMessage[];
  trusted: TrustedOrchestration | null;
  error: string | null;
};
type ZumiApiResponse = {
  data?: {
    answer?: string;
    conversationToken?: string | null;
    trustedOrchestration?: TrustedOrchestration;
  };
  error?: string;
};

const surfaces = [
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Grid", href: "/grid", icon: Network },
  { label: "Care", href: "/provider", icon: HeartPulse },
  { label: "Billing", href: "/billing", icon: CircleDollarSign },
  { label: "Insights", href: "/quality", icon: ChartNoAxesCombined },
  { label: "Team", href: "/tasks", icon: Users },
  { label: "EDU", href: "/edu", icon: BookOpenCheck },
  { label: "Network", href: "/network", icon: Building2 },
  { label: "Routes", href: "/paths", icon: Route },
] as const;

function freshSession(): BrowserSession {
  return {
    id: crypto.randomUUID(),
    title: "New session",
    createdAt: Date.now(),
    status: "idle",
    conversationToken: null,
    messages: [],
    trusted: null,
    error: null,
  };
}

function shortTitle(question: string) {
  const trimmed = question.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 38) return trimmed;
  return `${trimmed.slice(0, 35).trimEnd()}…`;
}

function statusLabel(status: BrowserStatus) {
  if (status === "working") return "Working";
  if (status === "ready") return "Ready";
  if (status === "needs_you") return "Needs you";
  return "Open";
}

function statusDot(status: BrowserStatus) {
  if (status === "working") return "bg-[#e6817b] motion-safe:animate-pulse";
  if (status === "ready") return "bg-emerald-300";
  if (status === "needs_you") return "bg-[#d6b787]";
  return "bg-[#725d59]";
}

export function ZumiBrowserWorkspace({ userName }: { userName: string }) {
  const router = useRouter();
  const initial = useMemo(() => freshSession(), []);
  const [sessions, setSessions] = useState<BrowserSession[]>([initial]);
  const [activeSessionId, setActiveSessionId] = useState(initial.id);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([initial.id]);
  const [historyCursor, setHistoryCursor] = useState(0);
  const [historySearch, setHistorySearch] = useState("");
  const [input, setInput] = useState("");
  const [railOpen, setRailOpen] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const active = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const visibleSessions = sessions.filter((session) => !historySearch.trim() || session.title.toLowerCase().includes(historySearch.trim().toLowerCase()));
  const today = visibleSessions.filter((session) => Date.now() - session.createdAt < 24 * 60 * 60 * 1000);
  const earlier = visibleSessions.filter((session) => Date.now() - session.createdAt >= 24 * 60 * 60 * 1000);
  const loading = active?.status === "working";

  function selectSession(id: string, record = true) {
    if (!sessions.some((session) => session.id === id)) return;
    setActiveSessionId(id);
    if (record) {
      const next = [...navigationHistory.slice(0, historyCursor + 1), id];
      setNavigationHistory(next);
      setHistoryCursor(next.length - 1);
    }
    window.setTimeout(() => inputRef.current?.focus(), 20);
  }

  function newSession() {
    const session = freshSession();
    setSessions((current) => [...current, session]);
    setInput("");
    const next = [...navigationHistory.slice(0, historyCursor + 1), session.id];
    setNavigationHistory(next);
    setHistoryCursor(next.length - 1);
    setActiveSessionId(session.id);
    window.setTimeout(() => inputRef.current?.focus(), 20);
  }

  function removeSession(id: string) {
    const remaining = sessions.filter((session) => session.id !== id);
    if (!remaining.length) {
      const replacement = freshSession();
      setSessions([replacement]);
      setActiveSessionId(replacement.id);
      setNavigationHistory([replacement.id]);
      setHistoryCursor(0);
      return;
    }
    setSessions(remaining);
    if (activeSessionId === id) setActiveSessionId(remaining[remaining.length - 1].id);
    setNavigationHistory((current) => current.filter((sessionId) => sessionId !== id));
    setHistoryCursor(0);
  }

  function goBack() {
    if (historyCursor <= 0) return;
    const nextCursor = historyCursor - 1;
    setHistoryCursor(nextCursor);
    selectSession(navigationHistory[nextCursor], false);
  }

  function goForward() {
    if (historyCursor >= navigationHistory.length - 1) return;
    const nextCursor = historyCursor + 1;
    setHistoryCursor(nextCursor);
    selectSession(navigationHistory[nextCursor], false);
  }

  function updateActive(updater: (session: BrowserSession) => BrowserSession) {
    setSessions((current) => current.map((session) => session.id === activeSessionId ? updater(session) : session));
  }

  async function sendQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question || !active || loading) return;
    const recentMessages = active.messages.slice(-8);
    const userMessage: ConversationMessage = { id: crypto.randomUUID(), role: "user", text: question };
    const firstQuestion = active.messages.length === 0;
    setInput("");
    updateActive((session) => ({
      ...session,
      title: firstQuestion ? shortTitle(question) : session.title,
      status: "working",
      error: null,
      messages: [...session.messages, userMessage],
    }));

    try {
      const response = await fetch("/api/zumi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          capability: "conversation",
          question,
          conversationToken: active.conversationToken,
          context: recentMessages.length ? { recentConversation: recentMessages.map((message) => ({ role: message.role, text: message.text.slice(0, 3000) })) } : undefined,
          knowledgeSearch: true,
          presence: {
            surface: "intelligence",
            mode: "command",
            autonomy: "suggest_actions",
            pathname: "/zumi",
            pageTitle: "Klinikos Browser",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator.language,
            inputModalities: ["text"],
            outputModalities: ["text"],
          },
          accessibility: {
            responseLength: "balanced",
            languageStyle: "professional",
            speechOutput: false,
            captions: true,
            keyboardFirst: true,
            reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
            highContrast: window.matchMedia?.("(prefers-contrast: more)").matches ?? false,
            preferredLanguage: navigator.language,
          },
        }),
      });
      const payload = (await response.json()) as ZumiApiResponse;
      if (!response.ok || !payload.data?.answer) throw new Error(payload.error || "Zumi could not resolve this turn.");
      const trusted = payload.data.trustedOrchestration ?? null;
      const needsYou = Boolean(trusted?.blockers?.length || trusted?.nextActions?.some((action) => action.state === "blocked"));
      const assistantMessage: ConversationMessage = { id: crypto.randomUUID(), role: "assistant", text: payload.data.answer };
      updateActive((session) => ({
        ...session,
        status: needsYou ? "needs_you" : "ready",
        conversationToken: payload.data?.conversationToken ?? null,
        trusted,
        messages: [...session.messages, assistantMessage],
      }));
    } catch (caught) {
      updateActive((session) => ({
        ...session,
        status: "needs_you",
        error: caught instanceof Error ? caught.message : "Zumi could not resolve this turn.",
      }));
    } finally {
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await sendQuestion(input);
  }

  if (!active) return null;
  const actions = active.trusted?.nextActions ?? [];
  const blockers = active.trusted?.blockers ?? [];

  return (
    <section className="-m-4 flex min-h-[calc(100vh-82px)] overflow-hidden bg-[#080304] text-[#f8efed] sm:-m-7 lg:-m-10 xl:-m-14" aria-label="Klinikos Browser">
      {railOpen ? (
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#e6817b]/11 bg-[#070304] lg:flex">
          <div className="border-b border-[#e6817b]/10 p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#e6817b]">Klinikos Browser</p><p className="mt-1 text-[11px] text-[#8f7773]">Current browser session</p></div><button aria-label="New session" className="grid size-8 place-items-center rounded-full border border-[#e6817b]/14 text-[#d8c1bd] hover:bg-[#e6817b]/10" onClick={newSession} type="button"><Plus className="size-4" /></button></div>
            <label className="mt-4 flex items-center gap-2 rounded-xl border border-[#e6817b]/10 bg-[#100708] px-3 py-2"><Search className="size-3.5 text-[#725d59]" /><span className="sr-only">Search sessions</span><input className="min-w-0 flex-1 bg-transparent text-[11px] text-[#f8efed] outline-none placeholder:text-[#655653]" onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search this session…" value={historySearch} /></label>
          </div>

          <nav className="grid grid-cols-3 gap-1 border-b border-[#e6817b]/10 p-3" aria-label="Klinikos surfaces">
            {surfaces.map(({ label, href, icon: Icon }) => <Link className="flex min-h-[58px] flex-col items-center justify-center gap-1.5 rounded-xl text-[9px] font-semibold text-[#8f7773] hover:bg-[#e6817b]/[.07] hover:text-[#efaaa1]" href={href} key={href}><Icon className="size-4" /><span>{label}</span></Link>)}
          </nav>

          <div className="flex-1 overflow-y-auto p-3">
            <SessionGroup label="Today" sessions={today} activeId={activeSessionId} onSelect={selectSession} onRemove={removeSession} />
            {earlier.length ? <SessionGroup label="Earlier" sessions={earlier} activeId={activeSessionId} onSelect={selectSession} onRemove={removeSession} /> : null}
            <p className="mt-5 border-t border-[#e6817b]/8 pt-4 text-[9px] leading-5 text-[#655653]">Raw conversation text is intentionally kept in memory only for this browser session until Klinikos has an approved governed transcript store.</p>
          </div>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[54px] items-center gap-2 border-b border-[#e6817b]/10 bg-[#090405]/96 px-3 sm:px-4">
          <button aria-label={railOpen ? "Hide session rail" : "Show session rail"} className="hidden size-8 place-items-center rounded-lg text-[#8f7773] hover:bg-[#e6817b]/8 hover:text-[#efaaa1] lg:grid" onClick={() => setRailOpen((value) => !value)} type="button"><Network className="size-4" /></button>
          <button aria-label="Previous session" className="grid size-8 place-items-center rounded-lg text-[#8f7773] enabled:hover:bg-[#e6817b]/8 enabled:hover:text-[#efaaa1] disabled:opacity-25" disabled={historyCursor <= 0} onClick={goBack} type="button"><ArrowLeft className="size-4" /></button>
          <button aria-label="Next session" className="grid size-8 place-items-center rounded-lg text-[#8f7773] enabled:hover:bg-[#e6817b]/8 enabled:hover:text-[#efaaa1] disabled:opacity-25" disabled={historyCursor >= navigationHistory.length - 1} onClick={goForward} type="button"><ArrowRight className="size-4" /></button>
          <Link aria-label="Klinikos Home" className="grid size-8 place-items-center rounded-lg text-[#8f7773] hover:bg-[#e6817b]/8 hover:text-[#efaaa1]" href="/dashboard"><Home className="size-4" /></Link>

          <div className="ml-1 flex min-w-0 flex-1 items-end gap-1 self-stretch overflow-x-auto pt-2">
            {sessions.map((session) => (
              <div className={cn("group flex h-[45px] min-w-[150px] max-w-[230px] items-center gap-2 rounded-t-xl border border-b-0 px-3", session.id === activeSessionId ? "border-[#e6817b]/18 bg-[#0d0608] text-[#fff8f6]" : "border-transparent bg-transparent text-[#806965] hover:bg-[#e6817b]/[.04]")} key={session.id}>
                <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => selectSession(session.id)} type="button"><span className={cn("size-1.5 shrink-0 rounded-full", statusDot(session.status))} /><span className="truncate text-[10px] font-semibold">{session.title}</span></button>
                {sessions.length > 1 ? <button aria-label={`Close ${session.title}`} className="grid size-5 shrink-0 place-items-center rounded text-[#655653] hover:bg-[#e6817b]/10 hover:text-[#efaaa1]" onClick={() => removeSession(session.id)} type="button"><X className="size-3" /></button> : null}
              </div>
            ))}
            <button aria-label="New session" className="mb-1 grid size-8 shrink-0 place-items-center rounded-lg text-[#806965] hover:bg-[#e6817b]/8 hover:text-[#efaaa1]" onClick={newSession} type="button"><Plus className="size-4" /></button>
          </div>
        </header>

        <div className="border-b border-[#e6817b]/9 bg-[#0b0507] px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[1060px] items-center gap-3">
            <span className={cn("size-2 rounded-full", statusDot(active.status))} />
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#f8efed]">{active.title}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.13em] text-[#725d59]">{statusLabel(active.status)} · Klinikos Intelligence · {userName}</p></div>
            <Link className="hidden items-center gap-1.5 text-[10px] font-semibold text-[#d6b787] sm:inline-flex" href="/paths"><Route className="size-3.5" />Route registry</Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(112,30,38,.13),transparent_36%)]">
          <div className="mx-auto max-w-[960px] space-y-6 px-4 py-8 sm:px-7 sm:py-12">
            {active.messages.length === 0 ? (
              <div className="mx-auto max-w-3xl py-8 text-center sm:py-14">
                <button aria-label="Focus the Zumi composer" className="group relative mx-auto grid size-28 place-items-center rounded-full border border-[#e6817b]/20 bg-[#14090c]/70 shadow-[0_0_70px_rgba(139,35,42,.25)]" onClick={() => inputRef.current?.focus()} type="button"><span className="absolute inset-3 rounded-full border border-[#e6817b]/14 transition group-hover:scale-105" /><img alt="" className="relative h-16 w-16 object-contain" src="/klinikos-orbital-k-transparent.png" /></button>
                <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#e6817b]">Klinikos Intelligence</p>
                <h2 className="mt-4 text-4xl font-light tracking-[-.055em] text-[#fff8f6] sm:text-5xl">What do you want to make happen?</h2>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#9f8985]">Zumi understands the current state, desired outcome, missing requirements, and the governed Klinikos route. It can open the right working context without turning navigation into the product.</p>
                <div className="mt-7 flex flex-wrap justify-center gap-2">{["I need an injector Saturday", "I just graduated nursing school and want to become an injector", "We have an empty room three days a week", "Why are we losing money?"].map((prompt) => <button className="rounded-full border border-[#e6817b]/12 bg-[#100708]/72 px-4 py-2.5 text-[10px] font-semibold text-[#b89f9b] hover:border-[#e6817b]/28 hover:text-[#fff8f6]" key={prompt} onClick={() => void sendQuestion(prompt)} type="button">{prompt}</button>)}</div>
              </div>
            ) : active.messages.map((message) => (
              <div className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")} key={message.id}>
                <div className={cn("max-w-[92%] whitespace-pre-wrap text-[13px] leading-7 sm:max-w-[78%]", message.role === "user" ? "rounded-[22px] border border-[#e6817b]/14 bg-[#2b1116] px-4 py-3 text-[#fff8f6]" : "border-l border-[#e6817b]/28 px-5 py-1 text-[#e9d8d5]")}>{message.text}</div>
              </div>
            ))}

            {loading ? <div className="border-l border-[#e6817b]/28 px-5 py-2 text-[11px] text-[#8f7773]"><span className="mr-2 inline-block size-1.5 rounded-full bg-[#e6817b] motion-safe:animate-pulse" />Understanding → checking what is actually available → preparing the next governed route…</div> : null}
            {active.error ? <div className="rounded-xl border border-[#a53e49]/30 bg-[#2b1015] p-4 text-xs text-[#f5c3c0]">{active.error}</div> : null}

            {(actions.length || blockers.length || active.trusted?.path) ? (
              <section className="rounded-[20px] border border-[#d6b787]/18 bg-[#d6b787]/[.045] p-5" aria-label="Trusted Klinikos route">
                <div className="flex items-center gap-2 text-[#efd8ad]"><ShieldCheck className="size-4" /><h3 className="text-xs font-extrabold">Trusted route</h3></div>
                {active.trusted?.path ? <div className="mt-3"><p className="text-sm font-semibold text-[#fff8f6]">{active.trusted.path.title}</p><p className="mt-1 text-[10px] text-[#9f8985]">{active.trusted.path.status} · {Math.round(active.trusted.path.progress * 100)}% complete</p></div> : null}
                {actions.length ? <div className="mt-4 divide-y divide-[#d6b787]/10 border-y border-[#d6b787]/10">{actions.slice(0, 5).map((action) => <div className="py-4" key={action.id}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-[#fff8f6]">{action.title}</p><p className="mt-1 text-[10px] leading-5 text-[#9f8985]">{action.reason}</p></div><span className="shrink-0 text-[8px] font-extrabold uppercase tracking-[.12em] text-[#d6b787]">{action.state.replaceAll("_", " ")}</span></div>{action.href && action.state !== "blocked" ? <Link className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#efaaa1]" href={action.href}>Open working context <ArrowRight className="size-3" /></Link> : null}</div>)}</div> : null}
                {blockers.length ? <div className="mt-4 space-y-2">{blockers.slice(0, 4).map((blocker) => <p className="text-[10px] leading-5 text-[#d9c2a1]" key={blocker.code}><strong>{blocker.title}:</strong> {blocker.explanation}</p>)}</div> : null}
              </section>
            ) : null}
          </div>
        </div>

        <form className="border-t border-[#e6817b]/11 bg-[#080304]/98 px-3 py-3 sm:px-5 sm:py-4" onSubmit={submit}>
          <div className="mx-auto max-w-[960px] rounded-[24px] border border-[#e6817b]/17 bg-[#12090b] p-2 shadow-[0_20px_65px_rgba(0,0,0,.32)] focus-within:border-[#e6817b]/36">
            <textarea className="min-h-[68px] w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-[#fff8f6] outline-none placeholder:text-[#725d59]" maxLength={8000} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Tell Zumi the outcome you want…" ref={inputRef} value={input} />
            <div className="flex items-center gap-2 px-1 pb-1">
              <Link aria-label="Open documents" className="grid size-9 place-items-center rounded-full text-[#8f7773] hover:bg-[#e6817b]/8 hover:text-[#efaaa1]" href="/documents"><Files className="size-4" /></Link>
              <VoiceInputButton className="[&_button]:h-9 [&_button]:rounded-full [&_button]:border-[#e6817b]/10 [&_button]:bg-transparent [&_button]:px-3 [&_button]:text-[10px] [&_button]:text-[#9f8985]" onTranscript={(transcript) => void sendQuestion(transcript)} />
              <span className="hidden text-[9px] text-[#655653] sm:inline">Enter sends · Shift+Enter adds a line</span>
              <button aria-label="Send to Zumi" className="group relative ml-auto grid size-12 place-items-center rounded-full border border-[#e6817b]/28 bg-[#1b0c0f] shadow-[0_0_28px_rgba(230,129,123,.12)] transition enabled:hover:border-[#efaaa1]/45 enabled:hover:bg-[#271014] disabled:cursor-not-allowed disabled:opacity-35" disabled={!input.trim() || loading} type="submit"><span className="absolute inset-1.5 rounded-full border border-[#e6817b]/13 transition group-enabled:group-hover:scale-105" /><img alt="" className="relative h-8 w-8 object-contain" src="/klinikos-orbital-k-transparent.png" /></button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

function SessionGroup({ label, sessions, activeId, onSelect, onRemove }: {
  label: string;
  sessions: BrowserSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (!sessions.length) return null;
  return (
    <section className="mb-5">
      <p className="px-2 text-[9px] font-extrabold uppercase tracking-[.16em] text-[#655653]">{label}</p>
      <div className="mt-2 space-y-1">{sessions.map((session) => <div className={cn("group flex items-center gap-1 rounded-xl", session.id === activeId ? "bg-[#e6817b]/[.08]" : "hover:bg-[#e6817b]/[.04]")} key={session.id}><button className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2.5 text-left" onClick={() => onSelect(session.id)} type="button"><span className={cn("size-1.5 shrink-0 rounded-full", statusDot(session.status))} /><span className={cn("truncate text-[10px] font-semibold", session.id === activeId ? "text-[#f8efed]" : "text-[#8f7773]")}>{session.title}</span></button><button aria-label={`Remove ${session.title}`} className="mr-1 grid size-7 shrink-0 place-items-center rounded-lg text-[#5f504d] opacity-0 hover:bg-[#e6817b]/10 hover:text-[#efaaa1] group-hover:opacity-100 focus:opacity-100" onClick={() => onRemove(session.id)} type="button"><X className="size-3" /></button></div>)}</div>
    </section>
  );
}
