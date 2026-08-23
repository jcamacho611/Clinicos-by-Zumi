"use client";

import { useMemo, useState } from "react";

import { HumanReviewBanner, NoPHINotice, ZumiAssistantOrb } from "@/components/command/zumi-command-shell";
import {
  eduZumiPracticeModes,
  type EduZumiPracticeModeKey,
} from "@/lib/edu/zumi-workforce-practice";

type PracticeReply = {
  answer: string;
  authorityBoundary: string;
  modelGenerated: boolean;
  requiresInstructorReview: boolean;
};

export function ZumiWorkforcePractice({
  allowedModes,
  pathway,
}: {
  allowedModes: EduZumiPracticeModeKey[];
  pathway?: string | null;
}) {
  const availableModes = useMemo(
    () => eduZumiPracticeModes.filter((mode) => allowedModes.includes(mode.key)),
    [allowedModes],
  );
  const [modeKey, setModeKey] = useState<EduZumiPracticeModeKey>(availableModes[0]?.key ?? "guided_practice");
  const mode = availableModes.find((entry) => entry.key === modeKey) ?? availableModes[0];
  const [question, setQuestion] = useState(mode?.examplePrompt ?? "");
  const [reply, setReply] = useState<PracticeReply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!mode) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || pending) return;
    setPending(true);
    setError(null);
    setReply(null);

    try {
      const response = await fetch("/api/edu/zumi-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: mode.key, question: question.trim(), pathway: pathway ?? null }),
      });
      const payload = await response.json().catch(() => null) as {
        error?: string;
        data?: PracticeReply;
      } | null;
      if (!response.ok || !payload?.data) {
        setError(payload?.error ?? "Zumi practice is unavailable right now.");
        return;
      }
      setReply(payload.data);
    } catch {
      setError("Zumi practice is unavailable right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5" aria-labelledby="zumi-practice-modes">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#f8efed]" id="zumi-practice-modes">Practice mode</h2>
          <ZumiAssistantOrb label="Zumi EDU" />
        </div>
        <div className="mt-5 grid gap-2" role="radiogroup" aria-label="Zumi workforce practice mode">
          {availableModes.map((entry) => {
            const selected = entry.key === mode.key;
            return (
              <button
                aria-pressed={selected}
                className="border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]"
                key={entry.key}
                onClick={() => {
                  setModeKey(entry.key);
                  setQuestion(entry.examplePrompt);
                  setReply(null);
                  setError(null);
                }}
                style={{
                  borderColor: selected ? "rgba(230,129,123,.5)" : "rgba(226,139,133,.12)",
                  background: selected ? "rgba(230,129,123,.08)" : "rgba(13,7,8,.55)",
                }}
                type="button"
              >
                <span className="block text-xs font-semibold text-[#f8efed]">{entry.label}</span>
                <span className="mt-2 block text-[11px] leading-5 text-[#8f7773]">{entry.description}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7" aria-labelledby="zumi-practice-title">
        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#efaaa1]">Governed workforce intelligence</p>
        <h2 className="mt-2 text-xl font-semibold text-[#f8efed]" id="zumi-practice-title">{mode.label}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#a98f8b]">{mode.authorityBoundary}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <NoPHINotice />
          {mode.key === "instructor_assist" ? <HumanReviewBanner /> : (
            <p className="flex items-center border border-[#e28b85]/16 bg-[#12090b]/40 px-4 py-3 text-[11px] leading-5 text-[#bca5a1]">
              Zumi may explain and coach. The learner still owns the submitted work and must verify consequential claims.
            </p>
          )}
        </div>

        <form className="mt-6" onSubmit={submit}>
          <label className="text-xs font-semibold text-[#f8efed]" htmlFor="zumi-workforce-question">What do you want to practice?</label>
          <textarea
            className="mt-3 min-h-36 w-full resize-y border border-[#e28b85]/16 bg-[#12090b]/55 p-4 text-sm leading-6 text-[#f8efed] outline-none placeholder:text-[#705d5a] focus:border-[#e6817b]/55 focus:ring-2 focus:ring-[#e6817b]/10"
            id="zumi-workforce-question"
            maxLength={6000}
            onChange={(event) => setQuestion(event.target.value)}
            value={question}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-[#8f7773]">{pathway ? `Pathway context: ${pathway}` : "General workforce AI practice"}</p>
            <button
              className="border border-[#e6817b]/35 bg-[#e6817b]/10 px-4 py-2 text-xs font-semibold text-[#ffd0ca] transition hover:bg-[#e6817b]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending || !question.trim()}
              type="submit"
            >
              {pending ? "Zumi is working…" : "Ask Zumi"}
            </button>
          </div>
        </form>

        <div aria-live="polite" className="mt-6">
          {error && (
            <div className="border border-[#e6817b]/30 bg-[#e6817b]/8 p-4 text-xs leading-6 text-[#efaaa1]">
              <strong className="font-semibold">Practice unavailable:</strong> {error}
            </div>
          )}
          {reply && (
            <article className="border border-[#e28b85]/14 bg-[#12090b]/55 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <ZumiAssistantOrb active label="Zumi response" />
                <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#8f7773]">{reply.modelGenerated ? "Model-generated practice guidance" : "Deterministic guidance"}</span>
              </div>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#d4c1bd]">{reply.answer}</p>
              <p className="mt-5 border-t border-[#e28b85]/10 pt-4 text-[11px] leading-5 text-[#8f7773]">{reply.authorityBoundary}</p>
              {reply.requiresInstructorReview && <p className="mt-3 text-[11px] font-semibold text-[#efaaa1]">This output is a draft for instructor review, not released feedback or a grading decision.</p>}
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
