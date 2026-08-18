"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Plus,
  Send,
  Settings2,
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
type TrustedOrchestration = {
  path?: { title: string; status: string; progress: number } | null;
  nextActions?: Array<{
    id: string;
    title: string;
    reason: string;
    href: string | null;
    state: string;
  }>;
  blockers?: Array<{
    id: string;
    title: string;
    explanation: string;
  }>;
};

type WorkspaceIntelligence = {
  title: string;
  prompt: string;
  suggestedQuestions: string[];
  primaryDestinations: Array<{ label: string; href: string }>;
  relatedDestinations: Array<{ label: string; href: string; description: string }>;
};

type ZumiApiResponse = {
  data?: {
    answer?: string;
    conversationToken?: string | null;
    sources?: Source[];
    trustedOrchestration?: TrustedOrchestration;
    workspace?: WorkspaceIntelligence;
  };
  error?: string;
};

type ZumiStatusResponse = {
  data?: {
    available?: boolean;
    mode?: string;
    workspace?: WorkspaceIntelligence;
  };
};

type ZumiPromptEvent = CustomEvent<string | { question?: string; voice?: boolean }>;

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
  const [trustedOrchestration, setTrustedOrchestration] = useState<TrustedOrchestration | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memoryNote, setMemoryNote] = useState("");
  const [memoryStatus, setMemoryStatus] = useState<string | null>(null);

  const dedicatedPage = pathname === "/zumi";
  const visible = dedicatedPage || open;

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/zumi?pathname=${encodeURIComponent(pathname)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ZumiStatusResponse;
      })
      .then((payload) => {
        if (payload?.data?.workspace) setWorkspace(payload.data.workspace);
      })
      .catch((caught) => {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          console.warn("[conversation] workspace context unavailable");
        }
      });
    return () => controller.abort();
  }, [pathname]);

  const sendQuestion = useCallback(async (rawQuestion: string, options?: { voice?: boolean }) => {
    const question = rawQuestion.trim();
    if (!question || loading) return;

    setOpen(true);
    setLoading(true);
    setError(null);
    setInput("");

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
    };
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
            surface: pathname.startsWith("/grid") ? "grid" : pathname.startsWith("/portal") ? "patient_portal" : pathname === "/zumi" ? "intelligence" : "platform",
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
      if (!response.ok || !payload.data?.answer) {
        throw new Error(payload.error || "Klinikos could not answer that right now. Nothing was changed.");
      }

      const answer = payload.data.answer;
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: answer }]);
      setConversationToken(payload.data.conversationToken ?? null);
      setSources(payload.data.sources ?? []);
      setTrustedOrchestration(payload.data.trustedOrchestration ?? null);
      if (payload.data.workspace) setWorkspace(payload.data.workspace);

      if (speechOutput || options?.voice) speak(answer);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Klinikos could not answer that right now. Nothing was changed.");
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
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    messageEndRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
  }, [messages, loading, visible]);

  async function askKlinikos(event: FormEvent) {
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
      if (!response.ok) throw new Error(payload.error || "Could not save that preference.");
      setMemoryNote("");
      setMemoryStatus("Remembered.");
    } catch (caught) {
      setMemoryStatus(caught instanceof Error ? caught.message : "Could not save that preference.");
    }
  }

  function startNewConversation() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setConversationToken(null);
    setMessages([]);
    setSources([]);
    setTrustedOrchestration(null);
    setError(null);
    setInput("");
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }

  function closeSurface() {
    if (dedicatedPage) {
      setOpen(false);
      router.push("/dashboard");
      return;
    }
    setOpen(false);
  }

  const nextActions = (trustedOrchestration?.nextActions ?? [])
    .filter((action) => action.href && action.state !== "blocked")
    .slice(0, 3);
  const blockers = (trustedOrchestration?.blockers ?? []).slice(0, 2);
  const starterQuestions = workspace?.suggestedQuestions?.slice(0, 4) ?? [];
  const conversationPrompt = workspace?.prompt || "Ask Klinikos about this work…";

  return (
    <>
      {!dedicatedPage && (
        <button
          aria-controls="zumi-presence-panel"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={open ? "Hide conversation" : "Ask Klinikos. Keyboard shortcut Control or Command J"}
          className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full border border-[#e6817b]/35 bg-[#16090c] text-[#f0a39c] shadow-[0_16px_50px_rgba(0,0,0,.42)] transition hover:scale-[1.03] hover:border-[#efaaa1]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b] motion-reduce:transform-none"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <span aria-hidden="true" className={cn("absolute inset-1 rounded-full border border-[#e6817b]/18", loading && "motion-safe:animate-pulse")} />
          <Sparkles className="relative size-5" aria-hidden="true" />
        </button>
      )}

      {visible && (
        <section
          aria-label="Klinikos conversation"
          aria-modal={dedicatedPage ? undefined : false}
          className={cn(
            "flex flex-col overflow-hidden border border-[#e6817b]/15 bg-[#0b0507] text-[#f8efed] shadow-[0_30px_90px_rgba(0,0,0,.42)]",
            dedicatedPage
              ? "fixed inset-x-0 bottom-0 top-[82px] z-20 border-x-0 border-b-0 lg:left-[240px]"
              : "fixed inset-x-3 bottom-20 z-40 max-h-[min(780px,calc(100vh-7rem))] rounded-[22px] sm:left-auto sm:right-5 sm:w-[500px]",
          )}
          id="zumi-presence-panel"
          role={dedicatedPage ? "region" : "dialog"}
        >
          <header className="flex items-center gap-3 border-b border-[#e6817b]/12 bg-[#080304]/96 px-4 py-3 sm:px-5">
            <span className="relative grid size-9 place-items-center rounded-full border border-[#e6817b]/30 bg-[#e6817b]/[.07] text-[#efaaa1]">
              <span aria-hidden="true" className={cn("absolute inset-1 rounded-full border border-[#e6817b]/15", loading && "motion-safe:animate-pulse")} />
              <Sparkles className="relative size-4" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-[-.02em]">Conversation</p>
              <p className="truncate text-[11px] text-[#a88f8b]">{workspace?.title ? `${workspace.title} · ` : ""}With you across Klinikos · {userName}</p>
            </div>

            <button
              aria-label="Start a new conversation"
              className="grid size-9 place-items-center rounded-lg text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed]"
              onClick={startNewConversation}
              title="New conversation"
              type="button"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>

            {!dedicatedPage && (
              <button
                aria-label="Expand conversation"
                className="grid size-9 place-items-center rounded-lg text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed]"
                onClick={() => router.push("/zumi")}
                title="Expand conversation"
                type="button"
              >
                <Maximize2 className="size-4" aria-hidden="true" />
              </button>
            )}

            <button
              aria-label="Conversation preferences"
              aria-expanded={settingsOpen}
              className={cn("grid size-9 place-items-center rounded-lg", settingsOpen ? "bg-[#e6817b]/12 text-[#fff8f6]" : "text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed]")}
              onClick={() => setSettingsOpen((value) => !value)}
              type="button"
            >
              <Settings2 className="size-4" aria-hidden="true" />
            </button>

            <button
              aria-label={dedicatedPage ? "Return to dashboard" : "Hide conversation"}
              className="grid size-9 place-items-center rounded-lg text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed]"
              onClick={closeSurface}
              type="button"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          {settingsOpen && (
            <div className="grid gap-4 border-b border-[#e6817b]/10 bg-[#100708] p-4 text-xs sm:grid-cols-2 sm:px-5">
              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#b89f9b]">Mode</span>
                <select className="w-full rounded-lg border border-[#e6817b]/14 bg-[#090405] px-3 py-2 text-[#f8efed]" onChange={(event) => setMode(event.target.value as InteractionMode)} value={mode}>
                  <option value="conversation">Conversation</option>
                  <option value="research">Research</option>
                  <option value="command">Prepare an action</option>
                  <option value="briefing">Brief me</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#b89f9b]">Response</span>
                <select className="w-full rounded-lg border border-[#e6817b]/14 bg-[#090405] px-3 py-2 text-[#f8efed]" onChange={(event) => setResponseLength(event.target.value as ResponseLength)} value={responseLength}>
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#b89f9b]">Language</span>
                <select className="w-full rounded-lg border border-[#e6817b]/14 bg-[#090405] px-3 py-2 text-[#f8efed]" onChange={(event) => setLanguageStyle(event.target.value as LanguageStyle)} value={languageStyle}>
                  <option value="plain">Plain</option>
                  <option value="professional">Professional</option>
                  <option value="technical">Technical</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#b89f9b]">Actions</span>
                <select className="w-full rounded-lg border border-[#e6817b]/14 bg-[#090405] px-3 py-2 text-[#f8efed]" onChange={(event) => setAutonomy(event.target.value as Autonomy)} value={autonomy}>
                  <option value="answer_only">Answer only</option>
                  <option value="suggest_actions">Suggest next actions</option>
                  <option value="prepare_actions">Prepare actions</option>
                </select>
              </label>

              <button
                className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#e6817b]/14 bg-[#090405] px-3 text-[11px] font-semibold text-[#d8c1bd]"
                onClick={() => setSpeechOutput((value) => !value)}
                type="button"
              >
                {speechOutput ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
                {speechOutput ? "Speech on" : "Speech off"}
              </button>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-[11px] font-semibold text-[#b89f9b]" htmlFor="zumi-memory-preference">Remember a preference</label>
                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-[#e6817b]/14 bg-[#090405] px-3 py-2 text-[12px] text-[#f8efed] placeholder:text-[#725d59]"
                    id="zumi-memory-preference"
                    maxLength={1500}
                    onChange={(event) => setMemoryNote(event.target.value)}
                    placeholder="Example: Keep my summaries concise"
                    value={memoryNote}
                  />
                  <Button className="min-h-10 px-3 text-[11px]" disabled={!memoryNote.trim()} onClick={saveMemory} type="button">Remember</Button>
                </div>
                {memoryStatus && <p aria-live="polite" className="text-[11px] text-[#9f8985]">{memoryStatus}</p>}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(92,22,29,.13),transparent_34%)]" aria-live="polite">
            <div className={cn("mx-auto space-y-6 px-4 py-6", dedicatedPage ? "max-w-[900px] sm:px-8 sm:py-10" : "max-w-full")}>
              {messages.length === 0 && (
                <div className={cn("mx-auto py-8", dedicatedPage && "max-w-2xl py-14 text-center")}>
                  <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#a88f8b]">{workspace?.title ?? "Klinikos"}</p>
                  <h2 className={cn("mt-3 font-light tracking-[-.04em] text-[#fff8f6]", dedicatedPage ? "text-4xl sm:text-5xl" : "text-2xl")}>{conversationPrompt}</h2>
                  <p className="mx-auto mt-4 max-w-xl text-[13px] leading-6 text-[#b89f9b]">
                    Ask naturally. Klinikos will use this workspace and your authorized context to help identify what matters and the safest next move.
                  </p>
                  {starterQuestions.length > 0 && (
                    <div className={cn("mt-6 grid gap-2 text-left", dedicatedPage && "sm:grid-cols-2")} aria-label="Useful questions for this workspace">
                      {starterQuestions.map((question) => (
                        <button
                          className="min-h-11 rounded-xl border border-[#e6817b]/12 bg-[#12090b]/70 px-4 py-3 text-left text-[12px] leading-5 text-[#d8c1bd] transition hover:border-[#e6817b]/28 hover:bg-[#1b0b0e] hover:text-[#fff8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b]"
                          key={question}
                          onClick={() => void sendQuestion(question)}
                          type="button"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((message) => (
                <div className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")} key={message.id}>
                  <div
                    className={cn(
                      "max-w-[92%] whitespace-pre-wrap text-[14px] leading-7 sm:max-w-[82%]",
                      message.role === "user"
                        ? "rounded-[20px] border border-[#e6817b]/14 bg-[#2b1116] px-4 py-3 text-[#fff8f6]"
                        : "px-1 py-1 text-[#eadbd8]",
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 px-1 py-2 text-[12px] text-[#9f8985]">
                  <span className="inline-block size-1.5 rounded-full bg-[#e6817b] motion-safe:animate-pulse" aria-hidden="true" />
                  Working on that…
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-[#a53e49]/35 bg-[#2b1015] p-3 text-[12px] leading-5 text-[#f5c3c0]" role="alert">
                  {error}
                </div>
              )}

              {nextActions.length > 0 && (
                <div className="space-y-2 pt-1" aria-label="Available next actions">
                  {nextActions.map((action) => (
                    <Link
                      className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#e6817b]/16 bg-[#15090b] px-4 py-3 text-[12px] font-semibold text-[#f5e6e3] hover:border-[#e6817b]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b]"
                      href={action.href!}
                      key={action.id}
                      onClick={() => setOpen(true)}
                      title={action.reason || "Open without losing this conversation"}
                    >
                      <span>{action.title}</span>
                      <span className="text-[10px] font-medium uppercase tracking-[.12em] text-[#8f7773]">Open</span>
                    </Link>
                  ))}
                </div>
              )}

              {blockers.length > 0 && (
                <div className="space-y-2" aria-label="Current blockers">
                  {blockers.map((blocker) => (
                    <div className="rounded-xl border border-[#e6817b]/10 bg-[#100708]/70 px-4 py-3" key={blocker.id}>
                      <p className="text-[12px] font-semibold text-[#e8d5d2]">{blocker.title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#9f8985]">{blocker.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              {sources.length > 0 && (
                <details className="text-[11px] text-[#9f8985]">
                  <summary className="cursor-pointer font-semibold text-[#cbb4b0]">Sources</summary>
                  <ul className="mt-2 space-y-1.5">
                    {sources.slice(0, 8).map((source, index) => (
                      <li key={`${source.url ?? source.title ?? "source"}-${index}`}>
                        {source.url ? (
                          <a className="text-[#efaaa1] underline underline-offset-4" href={source.url} rel="noreferrer" target="_blank">
                            {source.title || source.domain || source.url}
                          </a>
                        ) : source.title || source.domain || "Source"}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div ref={messageEndRef} />
            </div>
          </div>

          <form className="border-t border-[#e6817b]/12 bg-[#080304]/98 p-3 sm:px-5 sm:py-4" onSubmit={askKlinikos}>
            <div className={cn("mx-auto", dedicatedPage && "max-w-[900px]")}>
              <label className="sr-only" htmlFor="zumi-presence-input">Ask Klinikos</label>
              <textarea
                className={cn(
                  "w-full resize-none rounded-[18px] border border-[#e6817b]/16 bg-[#12090b] px-4 py-3 text-sm text-[#fff8f6] outline-none placeholder:text-[#725d59] focus:border-[#e6817b]/40 focus:ring-2 focus:ring-[#e6817b]/10",
                  dedicatedPage ? "min-h-24" : "min-h-16",
                )}
                id="zumi-presence-input"
                maxLength={8000}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={conversationPrompt}
                ref={inputRef}
                value={input}
              />

              <div className="mt-2 flex items-center gap-2">
                <VoiceInputButton
                  className="[&_button]:h-9 [&_button]:rounded-lg [&_button]:border-[#e6817b]/14 [&_button]:bg-[#12090b] [&_button]:px-3 [&_button]:text-[11px] [&_button]:text-[#d8c1bd]"
                  onTranscript={(transcript) => {
                    setSpeechOutput(true);
                    void sendQuestion(transcript, { voice: true });
                  }}
                />
                <span className="hidden text-[12px] text-[#725d59] sm:inline">Enter sends · Shift+Enter adds a line</span>
                <Button aria-label="Send" className="ml-auto h-9 gap-1.5 px-3 text-[11px]" disabled={loading || !input.trim()} type="submit">
                  <Send className="size-3.5" aria-hidden="true" />
                  Send
                </Button>
              </div>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
