"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { ZumiOrb } from "@/components/ds";
import { protectedPublicContinuationHref } from "@/lib/distribution/public-continuation";

type PublicDestination = {
  key: string;
  href: string;
  action: string;
  label?: string;
};

type PublicResolution = {
  kind: "conversation" | "route";
  title: string;
  body: string;
  assumption: string | null;
  destination: PublicDestination | null;
  confidence: number;
};

type PublicZumiResponse = {
  data?: {
    resolution?: unknown;
  };
  error?: string;
};

const PUBLIC_DESTINATIONS = [
  "/sales",
  "/grid",
  "/edu",
  "/pricing",
  "/trust",
  "/ecosystem",
  "/how-it-works",
  "/founding-clinic",
  "/operational-audit",
  "/access",
  "/portal/login",
  "/login",
] as const;

const intentExamples = [
  { label: "Run or improve a clinic", prompt: "I run a clinic and want to improve how the operation works." },
  { label: "Find or offer healthcare work", prompt: "I need healthcare work or want to offer my skills." },
  { label: "Learn or train a workforce", prompt: "I want healthcare or AI workforce training." },
  { label: "Find healthcare services", prompt: "I need to find healthcare services." },
] as const;

const initialPromptByIntent: Record<string, string> = {
  clinic: intentExamples[0].prompt,
  staffing: "I run a healthcare organization and need staff.",
  referrals: "I need help with healthcare referrals or referral capacity.",
  revenue: "I run a clinic and want to improve follow-up and revenue operations.",
  billing: "I run a clinic and need help with billing readiness and operational follow-through.",
  grid: intentExamples[1].prompt,
  edu: intentExamples[2].prompt,
  care: intentExamples[3].prompt,
};

function isResolution(value: unknown): value is PublicResolution {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublicResolution>;
  if (candidate.kind !== "conversation" && candidate.kind !== "route") return false;
  if (typeof candidate.title !== "string" || typeof candidate.body !== "string") return false;
  if (candidate.assumption !== null && typeof candidate.assumption !== "string") return false;
  if (typeof candidate.confidence !== "number" || !Number.isFinite(candidate.confidence)) return false;
  if (candidate.destination === null) return true;
  if (!candidate.destination || typeof candidate.destination !== "object") return false;
  const destination = candidate.destination as Partial<PublicDestination>;
  return typeof destination.key === "string"
    && typeof destination.href === "string"
    && destination.href.startsWith("/")
    && !destination.href.startsWith("//")
    && !/[\r\n\\]/.test(destination.href)
    && typeof destination.action === "string";
}

function isPublicDestination(href: string) {
  return PUBLIC_DESTINATIONS.some((allowed) => href === allowed || href.startsWith(`${allowed}/`) || href.startsWith(`${allowed}?`) || href.startsWith(`${allowed}#`));
}

function safeActionHref(destination: PublicDestination) {
  if (isPublicDestination(destination.href)) return destination.href;
  return protectedPublicContinuationHref(destination.href, destination.key);
}

export function UniversalEntryRouter({ initialIntentKey }: { initialIntentKey: string | null }) {
  const [prompt, setPrompt] = useState(() => initialIntentKey ? initialPromptByIntent[initialIntentKey] ?? "" : "");
  const [resolution, setResolution] = useState<PublicResolution | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const actionHref = useMemo(() => resolution?.destination ? safeActionHref(resolution.destination) : null, [resolution]);

  async function sendPrompt(rawPrompt: string) {
    const question = rawPrompt.trim();
    if (!question || pending) return;

    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/zumi/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          question,
          history: [],
          priorResolution: null,
          unresolvedTurns: 0,
          surface: "/auth",
        }),
      });
      const payload = await response.json() as PublicZumiResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Klinikos could not route this request right now.");
      }
      if (!isResolution(payload.data?.resolution)) {
        throw new Error("Klinikos returned an invalid public routing response.");
      }
      setResolution(payload.data.resolution);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Klinikos could not route this request right now.");
    } finally {
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendPrompt(prompt);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <section
      aria-labelledby="universal-entry-heading"
      className="rounded-[30px] border border-[#d9918a]/18 bg-[#12090b] p-5 shadow-[0_30px_90px_rgba(0,0,0,.34)] sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#d9918a]/25 bg-[#1b0d10]">
          <ZumiOrb size={34} state={pending ? "analyzing" : "observing"} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-[#e88f88]">Zumi</p>
          <h2 id="universal-entry-heading" className="mt-2 text-3xl font-light tracking-[-.04em] text-[#fff8f6] sm:text-4xl">What needs to happen?</h2>
          <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#cbb1ad]">
            Describe the outcome in normal language. Do not enter PHI, patient names, medical records, passwords, payment credentials, or other secrets here.
          </p>
        </div>
      </div>

      <form className="mt-7" onSubmit={submit}>
        <label className="sr-only" htmlFor="universal-entry-intent">Tell Zumi what you are trying to do</label>
        <div className="grid min-h-[96px] grid-cols-[minmax(0,1fr)_3.25rem] items-center gap-3 rounded-[26px] border border-[#d9918a]/30 bg-[#1b0d10]/75 px-4 py-3 shadow-[0_18px_55px_rgba(0,0,0,.26)] backdrop-blur-xl focus-within:border-[#efaaa1]/60">
          <textarea
            id="universal-entry-intent"
            className="min-h-16 max-h-40 w-full resize-y bg-transparent px-2 py-3 text-sm leading-6 text-[#fff8f6] outline-none placeholder:text-[#a98985]"
            maxLength={1200}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Example: I run a PT clinic and need better follow-up, staffing, and referral coordination."
            value={prompt}
          />
          <button
            aria-label="Ask Zumi"
            className="grid size-11 place-items-center rounded-full bg-[#e6817b] text-[#1a090a] transition hover:bg-[#efaaa1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c2bc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12090b] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pending || !prompt.trim()}
            type="submit"
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </form>

      {!resolution ? (
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Example outcomes">
          {intentExamples.map((example) => (
            <button
              className="min-h-10 rounded-full border border-[#d9918a]/18 bg-[#0c0607] px-4 text-left text-[12px] font-semibold text-[#d8c2be] transition hover:border-[#efaaa1]/40 hover:text-[#fff8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c2bc]"
              key={example.label}
              onClick={() => {
                setPrompt(example.prompt);
                void sendPrompt(example.prompt);
              }}
              type="button"
            >
              {example.label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-[#e6817b]/28 bg-[#2a1014] p-4 text-[13px] leading-6 text-[#f2c5c0]" role="alert">
          {error} You can return to <Link className="font-bold underline underline-offset-4" href="/">Living Home</Link> or sign in if you already have access.
        </div>
      ) : null}

      {resolution ? (
        <div className="mt-7 rounded-[24px] border border-[#d9918a]/16 bg-[#090506] p-5 sm:p-6" aria-live="polite">
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#d88781]">Next useful step</p>
          <h3 className="mt-3 text-xl font-semibold tracking-[-.025em] text-[#fff8f6]">{resolution.title}</h3>
          <p className="mt-3 text-[13px] leading-6 text-[#cbb1ad]">{resolution.body}</p>
          {resolution.assumption ? <p className="mt-3 text-[12px] leading-5 text-[#a88d89]">Assumption: {resolution.assumption}</p> : null}

          <div className="mt-5 flex flex-wrap gap-3">
            {actionHref && resolution.destination ? (
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6817b] px-5 text-xs font-extrabold text-[#1a090a] transition hover:bg-[#efaaa1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c2bc]"
                href={actionHref}
              >
                {resolution.destination.label || resolution.destination.action || "Continue"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
            <button
              className="min-h-11 rounded-full border border-[#d9918a]/22 px-5 text-xs font-semibold text-[#ead9d5] transition hover:border-[#efaaa1]/50 hover:bg-[#8f3e45]/10"
              onClick={() => setResolution(null)}
              type="button"
            >
              Tell Zumi more
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-7 flex items-start gap-3 border-t border-[#d9918a]/14 pt-5 text-[11px] leading-5 text-[#9f8581]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#d88781]" aria-hidden="true" />
        <p>Public routing can suggest and prepare a next step. It cannot verify a professional credential, bind an organization, mark a payment complete, grant clinical authority, or activate production patient-data access.</p>
      </div>
    </section>
  );
}
