"use client";

import { useState } from "react";

export function WorkforceFeedbackForm({
  sessionId,
  participantMode,
}: {
  sessionId: string;
  participantMode: boolean;
}) {
  const [overallRating, setOverallRating] = useState(5);
  const [instructorRating, setInstructorRating] = useState(5);
  const [confidenceBefore, setConfidenceBefore] = useState(3);
  const [confidenceAfter, setConfidenceAfter] = useState(4);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [comments, setComments] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch("/api/edu/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          overallRating,
          instructorRating: participantMode ? instructorRating : null,
          confidenceBefore: participantMode ? confidenceBefore : null,
          confidenceAfter: participantMode ? confidenceAfter : null,
          wouldRecommend: participantMode ? wouldRecommend : null,
          comments: comments.trim() || null,
        }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? "Feedback could not be saved.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Feedback could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7" aria-labelledby="workforce-feedback-title">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#efaaa1]">Program improvement evidence</p>
      <h2 className="mt-2 text-lg font-semibold text-[#f8efed]" id="workforce-feedback-title">
        {participantMode ? "Participant session feedback" : "Instructor session reflection"}
      </h2>
      <p className="mt-2 max-w-3xl text-xs leading-6 text-[#8f7773]">
        Feedback is stored separately from attendance, grading, and completion. It may inform program improvement but does not automatically change a learner&apos;s result.
      </p>

      <form className="mt-5 grid gap-5" onSubmit={submit}>
        <RatingField label="Overall session rating" onChange={setOverallRating} value={overallRating} />
        {participantMode && (
          <>
            <RatingField label="Instructor effectiveness" onChange={setInstructorRating} value={instructorRating} />
            <div className="grid gap-4 sm:grid-cols-2">
              <RatingField label="Confidence before session" onChange={setConfidenceBefore} value={confidenceBefore} />
              <RatingField label="Confidence after session" onChange={setConfidenceAfter} value={confidenceAfter} />
            </div>
            <fieldset>
              <legend className="text-xs font-semibold text-[#f8efed]">Would you recommend this training?</legend>
              <div className="mt-3 flex gap-3">
                {[true, false].map((choice) => (
                  <label className="flex items-center gap-2 text-xs text-[#bca5a1]" key={String(choice)}>
                    <input checked={wouldRecommend === choice} name="recommend" onChange={() => setWouldRecommend(choice)} type="radio" />
                    {choice ? "Yes" : "No"}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        <div>
          <label className="text-xs font-semibold text-[#f8efed]" htmlFor="workforce-feedback-comments">Comments</label>
          <textarea
            className="mt-2 min-h-28 w-full resize-y border border-[#e28b85]/16 bg-[#12090b]/55 p-3 text-sm leading-6 text-[#f8efed] outline-none placeholder:text-[#705d5a] focus:border-[#e6817b]/55 focus:ring-2 focus:ring-[#e6817b]/10"
            id="workforce-feedback-comments"
            maxLength={2000}
            onChange={(event) => setComments(event.target.value)}
            placeholder={participantMode ? "What helped? What should be clearer or more useful?" : "What should be changed before this session is delivered again?"}
            value={comments}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div aria-live="polite" className="text-xs">
            {saved && <span className="text-[#efaaa1]">Feedback recorded.</span>}
            {error && <span className="text-[#efaaa1]">{error}</span>}
          </div>
          <button
            className="border border-[#e6817b]/35 bg-[#e6817b]/10 px-4 py-2 text-xs font-semibold text-[#ffd0ca] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? "Saving…" : "Submit feedback"}
          </button>
        </div>
      </form>
    </section>
  );
}

function RatingField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-[#f8efed]">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label className="flex size-10 cursor-pointer items-center justify-center border text-xs font-semibold" key={rating} style={{ borderColor: value === rating ? "rgba(230,129,123,.55)" : "rgba(226,139,133,.14)", background: value === rating ? "rgba(230,129,123,.1)" : "rgba(18,9,11,.45)", color: value === rating ? "#ffd0ca" : "#a98f8b" }}>
            <input className="sr-only" checked={value === rating} name={label} onChange={() => onChange(rating)} type="radio" value={rating} />
            {rating}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
