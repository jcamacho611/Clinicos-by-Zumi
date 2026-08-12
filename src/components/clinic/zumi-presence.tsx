"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Brain, Command, MessageCircle, Search, Send, Settings2, ShieldCheck, Sparkles, Volume2, VolumeX, X } from "lucide-react";
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

type ZumiApiResponse = {
  data?: {
    answer?: string;
    conversationToken?: string | null;
    sources?: Source[];
    toolsUsed?: string[];
    research?: { depth?: string; webUsed?: boolean };
    orchestration?: Orchestration;
  };
  error?: string;
};

const MODE_META: Array<{ key: InteractionMode; label: string; icon: typeof MessageCircle }> = [
  { key: "conversation", label: "Talk", icon: MessageCircle },
  { key: "research", label: "Research", icon: Search },
  { key: "command", label: "Command", icon: Command },
  { key: "briefing", label: "Brief", icon: Sparkles },
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceTurn, setVoiceTurn] = useState(false);
  const [memoryNote, setMemoryNote] = useState("");
  const [memoryStatus, setMemoryStatus] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  async function askZumi(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setLoading(true);
    setError(null);
    setInput("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: question }]);

    try {
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const highContrast = window.matchMedia?.("(prefers-contrast: more)").matches ?? false;
      const response = await fetch("/api/zumi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          capability: "conversation",
          question,
          conversationToken,
          webResearch: mode === "research" ? true : undefined,
          knowledgeSearch: true,
          codeInterpreter: mode === "research" || mode === "command" ? true : undefined,
          presence: {
            surface: "platform",
            mode,
            autonomy,
            pathname,
            pageTitle: document.title,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator.language,
            inputModalities: voiceTurn ? ["voice", "text"] : ["text"],
            outputModalities: speechOutput ? ["text", "speech"] : ["text"],
          },
          accessibility: {
            responseLength,
            languageStyle,
            speechOutput,
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
      if (speechOutput) speak(answer);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Zumi could not answer this turn.");
    } finally {
      setVoiceTurn(false);
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
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

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? "Close Zumi" : "Open Zumi. Keyboard shortcut Control or Command J"}
        className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full border border-[#43d9ff]/45 bg-[#0b1e3a] text-[#43d9ff] shadow-[0_16px_50px_rgba(11,30,58,.35)] transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43d9ff] motion-reduce:transform-none"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true" className={cn("absolute inset-1 rounded-full border border-[#43d9ff]/20", loading && "motion-safe:animate-pulse")} />
        <Sparkles className="relative size-5" />
      </button>

      {open && (
        <section
          aria-label="Zumi assistant"
          aria-modal="false"
          className="fixed inset-x-3 bottom-20 z-40 flex max-h-[min(760px,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-[#0b1e3a]/15 bg-[#faf9f5] shadow-[0_30px_90px_rgba(11,30,58,.32)] sm:left-auto sm:right-5 sm:w-[460px]"
          role="dialog"
        >
          <header className="flex items-center gap-3 border-b border-[#0b1e3a]/10 bg-[#0b1e3a] px-4 py-3 text-white">
            <span className="relative grid size-9 place-items-center rounded-full border border-[#43d9ff]/40 bg-[#43d9ff]/10 text-[#43d9ff]">
              <span aria-hidden="true" className={cn("absolute inset-1 rounded-full border border-[#43d9ff]/20", loading && "motion-safe:animate-pulse")} />
              <Brain className="relative size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold tracking-[-.02em]">Zumi</p>
              <p className="truncate text-[10px] text-white/55">Klinikos Intelligence · {userName}</p>
            </div>
            <span className="hidden items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-emerald-300 sm:inline-flex"><ShieldCheck className="size-3.5" /> Governed</span>
            <button aria-label="Close Zumi" className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)} type="button"><X className="size-4" /></button>
          </header>

          <div className="flex gap-1 overflow-x-auto border-b border-[#0b1e3a]/10 px-3 py-2" role="tablist" aria-label="Zumi interaction mode">
            {MODE_META.map(({ key, label, icon: Icon }) => (
              <button
                aria-selected={mode === key}
                className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold", mode === key ? "bg-[#0b1e3a] text-white" : "text-[#0b1e3a]/60 hover:bg-[#0b1e3a]/6")}
                key={key}
                onClick={() => setMode(key)}
                role="tab"
                type="button"
              ><Icon className="size-3.5" />{label}</button>
            ))}
            <button aria-label="Zumi accessibility and autonomy settings" className={cn("ml-auto grid size-8 shrink-0 place-items-center rounded-lg", settingsOpen ? "bg-[#1677a8] text-white" : "text-[#0b1e3a]/55 hover:bg-[#0b1e3a]/6")} onClick={() => setSettingsOpen((value) => !value)} type="button"><Settings2 className="size-4" /></button>
          </div>

          {settingsOpen && (
            <div className="grid gap-3 border-b border-[#0b1e3a]/10 bg-[#f1f0eb] p-3 text-xs sm:grid-cols-2">
              <label className="space-y-1"><span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#0b1e3a]/50">Response</span><select className="w-full rounded-lg border border-[#0b1e3a]/15 bg-white px-2 py-1.5" onChange={(event) => setResponseLength(event.target.value as ResponseLength)} value={responseLength}><option value="concise">Concise</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label>
              <label className="space-y-1"><span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#0b1e3a]/50">Language</span><select className="w-full rounded-lg border border-[#0b1e3a]/15 bg-white px-2 py-1.5" onChange={(event) => setLanguageStyle(event.target.value as LanguageStyle)} value={languageStyle}><option value="plain">Plain</option><option value="professional">Professional</option><option value="technical">Technical</option></select></label>
              <label className="space-y-1"><span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#0b1e3a]/50">Autonomy</span><select className="w-full rounded-lg border border-[#0b1e3a]/15 bg-white px-2 py-1.5" onChange={(event) => setAutonomy(event.target.value as Autonomy)} value={autonomy}><option value="answer_only">Answer only</option><option value="suggest_actions">Suggest actions</option><option value="prepare_actions">Prepare actions</option></select></label>
              <button className="flex items-center justify-center gap-2 rounded-lg border border-[#0b1e3a]/15 bg-white px-2 py-1.5 text-[10px] font-bold" onClick={() => setSpeechOutput((value) => !value)} type="button">{speechOutput ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}{speechOutput ? "Speech on" : "Speech off"}</button>
              <div className="space-y-2 sm:col-span-2">
                <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#0b1e3a]/50">Memory</span>
                <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-[#0b1e3a]/15 bg-white px-2 py-1.5 text-[11px]" maxLength={1500} onChange={(event) => setMemoryNote(event.target.value)} placeholder="Remember a safe preference for future conversations…" value={memoryNote} /><Button className="h-8 px-3 text-[10px]" disabled={!memoryNote.trim()} onClick={saveMemory} type="button">Remember</Button></div>
                {memoryStatus && <p aria-live="polite" className="text-[10px] text-[#0b1e3a]/55">{memoryStatus}</p>}
              </div>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="rounded-xl border border-[#1677a8]/15 bg-[#1677a8]/5 p-4">
                <p className="text-sm font-bold text-[#0b1e3a]">What do you need?</p>
                <p className="mt-1 text-[11px] leading-5 text-[#0b1e3a]/60">Talk naturally. I can use the current Klinikos page as context, research when permitted, plan across tools, and tell you what is actually connected before suggesting an action.</p>
                <p className="mt-3 text-[9px] font-bold uppercase tracking-[.12em] text-[#1677a8]">Ctrl/Cmd + J summons me anywhere</p>
              </div>
            )}
            {messages.map((message) => (
              <div className={cn("max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-5", message.role === "user" ? "ml-auto bg-[#0b1e3a] text-white" : "border border-[#0b1e3a]/10 bg-white text-[#0b1e3a]")} key={message.id}>
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            ))}
            {loading && <div className="max-w-[92%] rounded-2xl border border-[#43d9ff]/20 bg-white px-3.5 py-2.5 text-[11px] text-[#0b1e3a]/55"><span className="mr-2 inline-block size-1.5 rounded-full bg-[#1677a8] motion-safe:animate-pulse" />Thinking, retrieving, and checking what tools are actually available…</div>}
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800">{error}</div>}

            {(toolsUsed.length > 0 || sources.length > 0 || orchestration?.candidateTools?.length) && (
              <details className="rounded-xl border border-[#0b1e3a]/10 bg-[#f1f0eb] p-3 text-[10px] text-[#0b1e3a]/65">
                <summary className="cursor-pointer font-extrabold text-[#0b1e3a]">Evidence & capability trace</summary>
                {toolsUsed.length > 0 && <p className="mt-2"><strong>Actually used:</strong> {toolsUsed.join(", ")}</p>}
                {orchestration?.candidateTools?.length ? <p className="mt-1"><strong>Considered:</strong> {orchestration.candidateTools.map((tool) => `${tool.label} (${tool.readiness})`).join(", ")}</p> : null}
                {sources.length > 0 && <ul className="mt-2 space-y-1">{sources.slice(0, 8).map((source, index) => <li key={`${source.url ?? source.title ?? "source"}-${index}`}>{source.url ? <a className="text-[#0f658f] underline" href={source.url} rel="noreferrer" target="_blank">{source.title || source.domain || source.url}</a> : source.title || source.domain || "Source"}</li>)}</ul>}
              </details>
            )}
          </div>

          <form className="border-t border-[#0b1e3a]/10 bg-white p-3" onSubmit={askZumi}>
            <label className="sr-only" htmlFor="zumi-presence-input">Message Zumi</label>
            <textarea
              className="min-h-20 w-full resize-none rounded-xl border border-[#0b1e3a]/15 bg-[#faf9f5] px-3 py-2 text-sm text-[#0b1e3a] outline-none placeholder:text-[#0b1e3a]/35 focus:border-[#1677a8] focus:ring-2 focus:ring-[#1677a8]/15"
              id="zumi-presence-input"
              maxLength={8000}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={mode === "research" ? "Research and verify something…" : mode === "command" ? "Tell Zumi what outcome you want…" : mode === "briefing" ? "Brief me on what matters…" : "Ask Zumi anything allowed…"}
              ref={inputRef}
              value={input}
            />
            <div className="mt-2 flex items-center gap-2">
              <VoiceInputButton className="[&_button]:h-8 [&_button]:rounded-lg [&_button]:px-2.5 [&_button]:text-[10px]" onTranscript={(transcript) => { setVoiceTurn(true); setInput(transcript); }} />
              <span className="hidden text-[9px] text-[#0b1e3a]/40 sm:inline">Enter sends · Shift+Enter adds a line</span>
              <Button className="ml-auto h-8 gap-1.5 px-3 text-[10px]" disabled={loading || !input.trim()} type="submit"><Send className="size-3.5" />Send</Button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
