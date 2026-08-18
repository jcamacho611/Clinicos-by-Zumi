"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Brain,
  Command,
  Maximize2,
  MessageCircle,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { VoiceInputButton } from "@/components/clinic/voice-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InteractionMode = "conversation" | "research" | "command" | "briefing";
type ResponseLength = "concise" | "balanced" | "detailed";
type LanguageStyle = "plain" | "professional" | "technical";
type Autonomy = "answer_only" | "suggest_actions" | "prepare_actions";

type ConversationMessage = { id: string; role: "user" | "assistant"; text: string };
type Source = { title?: string; url?: string; domain?: string };
type Orchestration = {
  candidateTools?: Array<{ key: string; label: string; readiness: string; risk: string }>;
  steps?: Array<{ phase: string; label: string; requiresApproval: boolean }>;
};
type TrustedOrchestration = {
  available?: boolean;
  path?: { pathId: string; title: string; status: string; progress: number; blockers: string[] } | null;
  nextActions?: Array<{ id: string; title: string; reason: string; capabilityKey: string | null; href: string | null; state: string; priority: number; blockers: string[] }>;
  blockers?: Array<{ code: string; title: string; explanation: string; owner: string; canResolveNow: boolean }>;
  warnings?: string[];
};

type ZumiApiResponse = {
  data?: {
    answer?: string;
    conversationToken?: string | null;
    sources?: Source[];
    toolsUsed?: string[];
    research?: { depth?: string; webUsed?: boolean };
    orchestration?: Orchestration;
    trustedOrchestration?: TrustedOrchestration;
  };
  error?: string;
};

type ZumiPromptEvent = CustomEvent<string | { question?: string; voice?: boolean }>;

const MODE_META: Array<{ key: InteractionMode; label: string; icon: typeof MessageCircle; description: string }> = [
  { key: "conversation", label: "Talk", icon: MessageCircle, description: "Ask, clarify, and continue naturally." },
  { key: "research", label: "Research", icon: Search, description: "Use approved live research when available." },
  { key: "command", label: "Command", icon: Command, description: "Describe an outcome and let Zumi plan it." },
  { key: "briefing", label: "Brief", icon: Sparkles, description: "Surface what matters and what is blocked." },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function ZumiPresence({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<InteractionMode>("conversation");
  const [autonomy, setAutonomy] = useState<Autonomy>("suggest_actions");
  const [responseLength, setResponseLength] = useState<ResponseLength>("balanced");
  const [languageStyle, setLanguageStyle] = useState<LanguageStyle>("professional");
  const [speechOutput, setSpeechOutput] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversationToken, setConversationToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [orchestration, setOrchestration] = useState<Orchestration | null>(null);
  const [trustedOrchestration, setTrustedOrchestration] = useState<TrustedOrchestration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memoryNote, setMemoryNote] = useState("");
  const [memoryStatus, setMemoryStatus] = useState<string | null>(null);

  const dedicatedPage = pathname === "/zumi";
  const visible = dedicatedPage || open;

  const sendQuestion = useCallback(async (rawQuestion: string, options?: { voice?: boolean }) => {
    const question = rawQuestion.trim();
    if (!question || loading) return;

    setOpen(true);
    setLoading(true);
    setError(null);
    setInput("");
    const userMessage: ConversationMessage = { id: crypto.randomUUID(), role: "user", text: question };
    setMessages((current) => [...current, userMessage]);

    try {
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const highContrast = window.matchMedia?.("(prefers-contrast: more)").matches ?? false;
      const recentConversation = mode === "research"
        ? undefined
        : messages.slice(-8).map((message) => ({ role: message.role, text: message.text.slice(0, 3000) }));

      const response = await fetch("/api/zumi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          capability: "conversation",
          question,
          conversationToken,
          context: recentConversation?.length ? { recentConversation } : undefined,
          webResearch: mode === "research" ? true : undefined,
          knowledgeSearch: true,
          codeInterpreter: mode === "research" || mode === "command" ? true : undefined,
          presence: {
            surface: pathname.startsWith("/grid") ? "grid" : pathname === "/zumi" ? "intelligence" : "platform",
            mode,
            autonomy,
            pathname,
            pageTitle: document.title,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator.language,
            inputModalities: options?.voice ? ["voice", "text"] : ["text"],
            outputModalities: speechOutput || options?.voice ? ["text", "speech"] : ["text"],
          },
          accessibility: {
            responseLength,
            languageStyle,
            speechOutput: speechOutput || Boolean(options?.voice),
            captions: true,
            keyboardFirst: true,
            reducedMotion,
            highContrast,
            preferredLanguage: navigator.language,
          },
        }),
      });
      const payload = (await response.json()) as ZumiApiResponse;
      if (!response.ok || !payload.data?.answer) throw new Error(payload.error || "Zumi could not answer this turn.");

      const answer = payload.data.answer;
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: answer }]);
      setConversationToken(payload.data.conversationToken ?? null);
      setSources(payload.data.sources ?? []);
      setToolsUsed(payload.data.toolsUsed ?? []);
      setOrchestration(payload.data.orchestration ?? null);
      setTrustedOrchestration(payload.data.trustedOrchestration ?? null);
      if (speechOutput || options?.voice) speak(answer);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Zumi could not answer this turn.");
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [autonomy, conversationToken, languageStyle, loading, messages, mode, pathname, responseLength, speechOutput]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setOpen((value) => dedicatedPage ? true : !value);
      }
      if (event.key === "Escape" && !dedicatedPage) setOpen(false);
    }
    function onToggle() {
      setOpen((value) => dedicatedPage ? true : !value);
    }
    function onOpen() {
      setOpen(true);
    }
    function onPrompt(event: Event) {
      const detail = (event as ZumiPromptEvent).detail;
      const question = typeof detail === "string" ? detail : detail?.question ?? "";
      const voice = typeof detail === "object" && Boolean(detail?.voice);
      if (!question.trim()) {
        setOpen(true);
        return;
      }
      if (voice) setSpeechOutput(true);
      void sendQuestion(question, { voice });
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("zumi:toggle", onToggle);
    window.addEventListener("zumi:open", onOpen);
    window.addEventListener("zumi:prompt", onPrompt);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("zumi:toggle", onToggle);
      window.removeEventListener("zumi:open", onOpen);
      window.removeEventListener("zumi:prompt", onPrompt);
    };
  }, [dedicatedPage, sendQuestion]);

  useEffect(() => {
    if (visible) window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, visible]);

  async function askZumi(event: FormEvent) {
    event.preventDefault();
    await sendQuestion(input);
  }

  async function saveMemory() {
    const content = memoryNote.trim();
    if (!content) return;
    setMemoryStatus("Saving…");
    try {
      const response = await fetch("/api/zumi/memory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "preference", title: "User preference", content }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save memory.");
      setMemoryNote("");
      setMemoryStatus("Remembered for future conversations.");
    } catch (caught) {
      setMemoryStatus(caught instanceof Error ? caught.message : "Could not save memory.");
    }
  }

  function startNewConversation() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setConversationToken(null);
    setMessages([]);
    setSources([]);
    setToolsUsed([]);
    setOrchestration(null);
    setTrustedOrchestration(null);
    setError(null);
    setInput("");
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }

  function closeSurface() {
    if (dedicatedPage) {
      setOpen(false);
      router.push("/dashboard");
    } else {
      setOpen(false);
    }
  }

  const trustedActions = trustedOrchestration?.nextActions ?? [];
  const trustedBlockers = trustedOrchestration?.blockers ?? [];

  return (
    <>
      {!dedicatedPage && (
        <button
          aria-controls="zumi-presence-panel"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={open ? "Hide Zumi chat" : "Focus Zumi chat. Keyboard shortcut Control or Command J"}
          className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full border border-[#e6817b]/35 bg-[#16090c] text-[#f0a39c] shadow-[0_16px_50px_rgba(0,0,0,.42)] transition hover:scale-[1.03] hover:border-[#efaaa1]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b] motion-reduce:transform-none"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <span aria-hidden="true" className={cn("absolute inset-1 rounded-full border border-[#e6817b]/18", loading && "motion-safe:animate-pulse")} />
          <Sparkles className="relative size-5" />
        </button>
      )}

      {visible && (
        <section
          aria-label="Zumi assistant"
          aria-modal={dedicatedPage ? undefined : false}
          className={cn(
            "flex flex-col overflow-hidden border border-[#e6817b]/15 bg-[#0b0507] text-[#f8efed] shadow-[0_30px_90px_rgba(0,0,0,.42)]",
            dedicatedPage
              ? "fixed inset-x-0 bottom-0 top-[82px] z-20 border-x-0 border-b-0 lg:left-[264px]"
              : "fixed inset-x-3 bottom-20 z-40 max-h-[min(780px,calc(100vh-7rem))] rounded-[22px] sm:left-auto sm:right-5 sm:w-[500px]",
          )}
          id="zumi-presence-panel"
          role={dedicatedPage ? "region" : "dialog"}
        >
          <header className="flex items-center gap-3 border-b border-[#e6817b]/12 bg-[#080304]/96 px-4 py-3 sm:px-5">
            <span className="relative grid size-9 place-items-center rounded-full border border-[#e6817b]/30 bg-[#e6817b]/[.07] text-[#efaaa1]">
              <span aria-hidden="true" className={cn("absolute inset-1 rounded-full border border-[#e6817b]/15", loading && "motion-safe:animate-pulse")} />
              <Brain className="relative size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold tracking-[-.02em]">Zumi</p>
              <p className="truncate text-[12px] text-[#b89f9b]">With you across Klinikos · {userName}</p>
            </div>
            <span className="hidden items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#d6b787] md:inline-flex"><ShieldCheck className="size-3.5" /> Governed</span>
            <button aria-label="Start a new Zumi conversation" className="grid size-8 place-items-center rounded-lg text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed]" onClick={startNewConversation} title="New conversation" type="button"><Plus className="size-4" /></button>
            {!dedicatedPage && <button aria-label="Expand Zumi conversation" className="grid size-8 place-items-center rounded-lg text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed]" onClick={() => router.push("/zumi")} title="Expand conversation" type="button"><Maximize2 className="size-4" /></button>}
            <button aria-label={dedicatedPage ? "Return to dashboard" : "Hide Zumi chat"} className="grid size-8 place-items-center rounded-lg text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed]" onClick={closeSurface} type="button"><X className="size-4" /></button>
          </header>

          <div className="flex gap-1 overflow-x-auto border-b border-[#e6817b]/10 bg-[#0d0608] px-3 py-2 sm:px-5" role="tablist" aria-label="Zumi interaction mode">
            {MODE_META.map(({ key, label, icon: Icon }) => (
              <button
                aria-selected={mode === key}
                className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition", mode === key ? "bg-[#e6817b]/14 text-[#fff8f6] ring-1 ring-[#e6817b]/18" : "text-[#9f8985] hover:bg-[#e6817b]/[.06] hover:text-[#e9d8d5]")}
                key={key}
                onClick={() => setMode(key)}
                role="tab"
                title={MODE_META.find((item) => item.key === key)?.description}
                type="button"
              ><Icon className="size-3.5" />{label}</button>
            ))}
            <button aria-label="Zumi accessibility and autonomy settings" className={cn("ml-auto grid size-8 shrink-0 place-items-center rounded-lg", settingsOpen ? "bg-[#e6817b]/16 text-[#fff8f6]" : "text-[#9f8985] hover:bg-[#e6817b]/[.06] hover:text-[#f8efed]")} onClick={() => setSettingsOpen((value) => !value)} type="button"><Settings2 className="size-4" /></button>
          </div>

          {settingsOpen && (
            <div className="grid gap-3 border-b border-[#e6817b]/10 bg-[#12090b] p-3 text-xs sm:grid-cols-2 sm:px-5">
              <label className="space-y-1"><span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#8f7773]">Response</span><select className="w-full rounded-lg border border-[#e6817b]/14 bg-[#090405] px-2 py-1.5 text-[#f8efed]" onChange={(event) => setResponseLength(event.target.value as ResponseLength)} value={responseLength}><option value="concise">Concise</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label>
              <label className="space-y-1"><span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#8f7773]">Language</span><select className="w-full rounded-lg border border-[#e6817b]/14 bg-[#090405] px-2 py-1.5 text-[#f8efed]" onChange={(event) => setLanguageStyle(event.target.value as LanguageStyle)} value={languageStyle}><option value="plain">Plain</option><option value="professional">Professional</option><option value="technical">Technical</option></select></label>
              <label className="space-y-1"><span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#8f7773]">Autonomy</span><select className="w-full rounded-lg border border-[#e6817b]/14 bg-[#090405] px-2 py-1.5 text-[#f8efed]" onChange={(event) => setAutonomy(event.target.value as Autonomy)} value={autonomy}><option value="answer_only">Answer only</option><option value="suggest_actions">Suggest actions</option><option value="prepare_actions">Prepare actions</option></select></label>
              <button className="flex items-center justify-center gap-2 rounded-lg border border-[#e6817b]/14 bg-[#090405] px-2 py-1.5 text-[12px] font-bold text-[#d8c1bd]" onClick={() => setSpeechOutput((value) => !value)} type="button">{speechOutput ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}{speechOutput ? "Speech on" : "Speech off"}</button>
              <div className="space-y-2 sm:col-span-2">
                <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#8f7773]">Memory</span>
                <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-[#e6817b]/14 bg-[#090405] px-2 py-1.5 text-[11px] text-[#f8efed] placeholder:text-[#725d59]" maxLength={1500} onChange={(event) => setMemoryNote(event.target.value)} placeholder="Remember a safe preference for future conversations…" value={memoryNote} /><Button className="h-8 px-3 text-[12px]" disabled={!memoryNote.trim()} onClick={saveMemory} type="button">Remember</Button></div>
                {memoryStatus && <p aria-live="polite" className="text-[12px] text-[#9f8985]">{memoryStatus}</p>}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(92,22,29,.13),transparent_34%)]" aria-live="polite">
            <div className={cn("mx-auto space-y-5 px-4 py-6", dedicatedPage ? "max-w-[900px] sm:px-8 sm:py-10" : "max-w-full")}>
              {messages.length === 0 && (
                <div className={cn("mx-auto border-y border-[#e6817b]/12 py-8", dedicatedPage && "max-w-2xl py-14 text-center")}>
                  <p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-[#e6817b]">Zumi</p>
                  <h2 className={cn("mt-4 font-light tracking-[-.04em] text-[#fff8f6]", dedicatedPage ? "text-3xl sm:text-4xl" : "text-xl")}>What needs to happen?</h2>
                  <p className="mx-auto mt-4 max-w-xl text-[12px] leading-6 text-[#b89f9b]">Talk naturally. Zumi stays aware of the current Klinikos surface, explains state, researches when permitted, and prepares governed work without making you leave the workflow you are in.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["What needs my attention today?", "Find the next best action", "Explain what is blocked"].map((prompt) => <button className="rounded-full border border-[#e6817b]/14 bg-[#12090b]/75 px-3 py-2 text-[12px] font-semibold text-[#d8c1bd] hover:border-[#e6817b]/30 hover:text-[#fff8f6]" key={prompt} onClick={() => void sendQuestion(prompt)} type="button">{prompt}</button>)}
                  </div>
                  <p className="mt-6 text-[11px] font-bold uppercase tracking-[.12em] text-[#806965]">Ctrl/Cmd + J focuses the conversation anywhere in Klinikos</p>
                </div>
              )}

              {messages.map((message) => (
                <div className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")} key={message.id}>
                  <div className={cn(
                    "max-w-[92%] whitespace-pre-wrap text-[13px] leading-6 sm:max-w-[82%]",
                    message.role === "user"
                      ? "rounded-[20px] border border-[#e6817b]/14 bg-[#2b1116] px-4 py-3 text-[#fff8f6]"
                      : "border-l border-[#e6817b]/28 px-4 py-1 text-[#e9d8d5]",
                  )}>{message.text}</div>
                </div>
              ))}

              {loading && <div className="max-w-[86%] border-l border-[#e6817b]/25 px-4 py-2 text-[11px] text-[#9f8985]"><span className="mr-2 inline-block size-1.5 rounded-full bg-[#e6817b] motion-safe:animate-pulse" />Understanding, connecting only where needed, and checking trusted Klinikos state…</div>}
              {error && <div className="rounded-xl border border-[#a53e49]/35 bg-[#2b1015] p-3 text-[11px] text-[#f5c3c0]">{error}</div>}

              {(trustedActions.length > 0 || trustedBlockers.length > 0) && (
                <div className="rounded-xl border border-[#d6b787]/20 bg-[#d6b787]/[.06] p-4 text-[12px] text-[#e9d8d5]">
                  <p className="flex items-center gap-1.5 font-extrabold text-[#efd8ad]"><ShieldCheck className="size-3.5" /> Trusted Klinikos path</p>
                  {trustedOrchestration?.path && <p className="mt-1 text-[#b89f9b]">{trustedOrchestration.path.title} · {trustedOrchestration.path.status} · {Math.round(trustedOrchestration.path.progress * 100)}%</p>}
                  {trustedActions.length > 0 && <ul className="mt-3 space-y-2">{trustedActions.slice(0, 5).map((action) => <li className="rounded-lg border border-[#d6b787]/16 bg-[#090405]/75 p-3" key={action.id}><div className="flex items-start justify-between gap-2"><span className="font-bold text-[#fff8f6]">{action.title}</span><span className="shrink-0 rounded bg-[#e6817b]/10 px-1.5 py-0.5 text-[11px] font-extrabold uppercase text-[#efaaa1]">{action.state.replaceAll("_", " ")}</span></div><p className="mt-1 text-[#9f8985]">{action.reason}</p>{action.href && action.state !== "blocked" && <Link className="mt-2 inline-block font-bold text-[#efaaa1] underline decoration-[#e6817b]/40 underline-offset-4" href={action.href} onClick={() => setOpen(true)}>Open path without losing this conversation</Link>}</li>)}</ul>}
                  {trustedBlockers.length > 0 && <ul className="mt-3 space-y-1.5 text-[#efd8ad]">{trustedBlockers.slice(0, 5).map((blocker) => <li key={blocker.code}><strong>{blocker.title}:</strong> {blocker.explanation}</li>)}</ul>}
                </div>
              )}

              {(toolsUsed.length > 0 || sources.length > 0 || orchestration?.candidateTools?.length) && (
                <details className="rounded-xl border border-[#e6817b]/10 bg-[#12090b]/70 p-3 text-[12px] text-[#9f8985]">
                  <summary className="cursor-pointer font-extrabold text-[#d8c1bd]">Evidence & capability trace</summary>
                  {toolsUsed.length > 0 && <p className="mt-2"><strong>Actually used:</strong> {toolsUsed.join(", ")}</p>}
                  {orchestration?.candidateTools?.length ? <p className="mt-1"><strong>Considered:</strong> {orchestration.candidateTools.map((tool) => `${tool.label} (${tool.readiness})`).join(", ")}</p> : null}
                  {sources.length > 0 && <ul className="mt-2 space-y-1">{sources.slice(0, 8).map((source, index) => <li key={`${source.url ?? source.title ?? "source"}-${index}`}>{source.url ? <a className="text-[#efaaa1] underline underline-offset-4" href={source.url} rel="noreferrer" target="_blank">{source.title || source.domain || source.url}</a> : source.title || source.domain || "Source"}</li>)}</ul>}
                </details>
              )}
              <div ref={messageEndRef} />
            </div>
          </div>

          <form className="border-t border-[#e6817b]/12 bg-[#080304]/98 p-3 sm:px-5 sm:py-4" onSubmit={askZumi}>
            <div className={cn("mx-auto", dedicatedPage && "max-w-[900px]")}>
              <label className="sr-only" htmlFor="zumi-presence-input">Message Zumi</label>
              <textarea
                className={cn("w-full resize-none rounded-[18px] border border-[#e6817b]/16 bg-[#12090b] px-4 py-3 text-sm text-[#fff8f6] outline-none placeholder:text-[#725d59] focus:border-[#e6817b]/40 focus:ring-2 focus:ring-[#e6817b]/10", dedicatedPage ? "min-h-24" : "min-h-20")}
                id="zumi-presence-input"
                maxLength={8000}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={mode === "research" ? "Research and verify something…" : mode === "command" ? "Tell Zumi the outcome you want…" : mode === "briefing" ? "Brief me on what matters…" : "Message Zumi…"}
                ref={inputRef}
                value={input}
              />
              <div className="mt-2 flex items-center gap-2">
                <VoiceInputButton className="[&_button]:h-8 [&_button]:rounded-lg [&_button]:border-[#e6817b]/14 [&_button]:bg-[#12090b] [&_button]:px-2.5 [&_button]:text-[12px] [&_button]:text-[#d8c1bd]" onTranscript={(transcript) => { setSpeechOutput(true); void sendQuestion(transcript, { voice: true }); }} />
                <span className="hidden text-[11px] text-[#725d59] sm:inline">Enter sends · Shift+Enter adds a line · voice sends when recognition completes</span>
                <Button className="ml-auto h-8 gap-1.5 px-3 text-[12px]" disabled={loading || !input.trim()} type="submit"><Send className="size-3.5" />Send</Button>
              </div>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
