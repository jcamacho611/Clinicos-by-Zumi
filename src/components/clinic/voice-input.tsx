"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Radio, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence: number } }>;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function VoiceInputButton({ onTranscript, className, language = "en-US" }: { onTranscript: (transcript: string) => void; className?: string; language?: string }) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  function startListening() {
    setError(null);
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      setError("Voice input is not supported in this browser. Typing remains available.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalTranscript += result[0].transcript;
        else interimTranscript += result[0].transcript;
      }
      setInterim(interimTranscript);
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
        setInterim("");
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      setInterim("");
      setError(event.error === "not-allowed" ? "Microphone access was denied. Enable it in browser settings or type instead." : `Voice input stopped: ${event.error}. You can retry or type instead.`);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Voice input could not start. Retry or type instead.");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return <div className={cn("relative inline-flex items-center gap-2", className)}>
    <Button aria-label={listening ? "Stop voice input" : "Start voice input"} className={cn(listening && "bg-rose-600 text-white hover:bg-rose-500")} onClick={listening ? stopListening : startListening} size="sm" title={listening ? "Stop listening" : "Speak instead of typing"} type="button" variant={listening ? "danger" : "secondary"}>
      {listening ? <MicOff className="size-3.5" /> : supported ? <Mic className="size-3.5" /> : <RotateCcw className="size-3.5" />}
      {listening ? "Stop" : "Speak"}
    </Button>
    {listening && <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-rose-600"><Radio className="size-3 animate-pulse" /> Listening</span>}
    {interim && <span aria-live="polite" className="max-w-48 truncate text-[12px] italic text-slate-500">{interim}</span>}
    {error && <span aria-live="polite" className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-900 shadow-xl">{error}</span>}
  </div>;
}
