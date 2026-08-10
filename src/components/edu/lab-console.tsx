"use client";

import { useState, useTransition } from "react";
import { commandSurfaces } from "@/lib/design/command-system";
import { GRADE_AUTHORITY_NOTICE, evidenceTypes } from "@/lib/edu/edu-submission-rules";

/**
 * The student's console inside a scenario run.
 *
 * Three things happen here and nothing else: the run starts, work is recorded as it
 * happens, and the run is handed in. There is no path from this component to a grade.
 *
 * Motion budget is state-change-only — this is a workspace, not the marketing
 * narrative. Every control reports what actually happened on the server, including
 * when the server refused, because a lab that silently swallows a refusal teaches a
 * student the wrong thing about the system they are learning to operate.
 */

type LabTask = { key: string; title: string; queue: string };

type RunState = { submissionId: string; status: string } | null;

const initialFeedback = { tone: "idle" as "idle" | "ok" | "error", message: "" };

export function LabConsole({
  assignmentId,
  tasks,
  initialRun,
}: {
  assignmentId: string;
  tasks: readonly LabTask[];
  initialRun: RunState;
}) {
  const [run, setRun] = useState<RunState>(initialRun);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [pending, startTransition] = useTransition();

  const [evidenceType, setEvidenceType] = useState<(typeof evidenceTypes)[number]>("note");
  const [evidenceLabel, setEvidenceLabel] = useState("");
  const [evidenceBody, setEvidenceBody] = useState("");
  const [reflection, setReflection] = useState("");

  const handedIn = run !== null && run.status !== "in_progress" && run.status !== "not_started";

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/edu/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, ...body }),
    });
    const payload = (await response.json().catch(() => null)) as { data?: Record<string, unknown>; error?: string } | null;
    if (!response.ok) {
      // The server's message is shown as written. Replacing it with "Something went
      // wrong" would hide the rule the student just met.
      throw new Error(payload?.error ?? "That action could not be completed.");
    }
    return payload?.data ?? {};
  }

  function act(body: Record<string, unknown>, onDone: (data: Record<string, unknown>) => void, success: string) {
    setFeedback(initialFeedback);
    startTransition(async () => {
      try {
        const data = await post(body);
        onDone(data);
        setFeedback({ tone: "ok", message: success });
      } catch (error) {
        setFeedback({ tone: "error", message: error instanceof Error ? error.message : "That action could not be completed." });
      }
    });
  }

  return (
    <section aria-labelledby="console-heading" className={`${commandSurfaces.panel} mt-6 p-5`}>
      <h2 className="text-sm font-extrabold uppercase tracking-[.14em] text-slate-400" id="console-heading">
        Run console
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-slate-400">
        {run
          ? `This run is ${run.status.replace(/_/g, " ")}.`
          : "Starting a run opens the evidence timeline your instructor reviews."}
      </p>

      {!run && (
        <button
          className={`${commandSurfaces.interactive} mt-4 border border-cyan-300/40 bg-cyan-400/[.08] px-4 text-sm font-extrabold text-cyan-200 disabled:opacity-50`}
          disabled={pending}
          onClick={() =>
            act({ action: "start" }, (data) => setRun({ submissionId: String(data.submissionId), status: String(data.status) }), "Run started.")
          }
          type="button"
        >
          Start this run
        </button>
      )}

      {run && !handedIn && (
        <>
          <h3 className="mt-6 text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">Record an action</h3>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            The timeline is append-only. What you record stays recorded, in the order you did it.
          </p>
          <ul className="mt-3 grid gap-2">
            {tasks.map((task) => (
              <li key={task.key}>
                <button
                  className={`${commandSurfaces.interactive} w-full border border-white/10 bg-white/[.03] px-3 text-left text-sm text-slate-200 hover:border-white/25 disabled:opacity-50`}
                  disabled={pending}
                  onClick={() =>
                    act(
                      {
                        action: "event",
                        event: { eventType: "task.handled", queue: task.queue, taskKey: task.key, summary: `Handled: ${task.title}` },
                      },
                      () => undefined,
                      `Recorded: ${task.title}`,
                    )
                  }
                  type="button"
                >
                  Record handling <span className="font-bold text-white">{task.title}</span>
                </button>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">Attach evidence</h3>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-500">Type</span>
              <select
                className="min-h-[44px] border border-white/10 bg-[#070d15] px-3 text-sm text-slate-100"
                onChange={(event) => setEvidenceType(event.target.value as (typeof evidenceTypes)[number])}
                value={evidenceType}
              >
                {evidenceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-500">Label</span>
              <input
                className="min-h-[44px] border border-white/10 bg-[#070d15] px-3 text-sm text-slate-100"
                maxLength={160}
                onChange={(event) => setEvidenceLabel(event.target.value)}
                value={evidenceLabel}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-500">Detail</span>
              <textarea
                className="min-h-[96px] border border-white/10 bg-[#070d15] px-3 py-2 text-sm text-slate-100"
                maxLength={4_000}
                onChange={(event) => setEvidenceBody(event.target.value)}
                rows={4}
                value={evidenceBody}
              />
            </label>
            <button
              className={`${commandSurfaces.interactive} border border-white/15 bg-white/[.04] px-4 text-sm font-extrabold text-slate-100 disabled:opacity-50`}
              disabled={pending || evidenceLabel.trim().length < 2}
              onClick={() =>
                act(
                  { action: "evidence", evidence: { evidenceType, label: evidenceLabel.trim(), body: evidenceBody.trim() || null, documentId: null } },
                  () => {
                    setEvidenceLabel("");
                    setEvidenceBody("");
                  },
                  "Evidence attached.",
                )
              }
              type="button"
            >
              Attach evidence
            </button>
          </div>

          <h3 className="mt-6 text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">Hand in</h3>
          <label className="mt-3 grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-500">Reflection</span>
            <textarea
              className="min-h-[96px] border border-white/10 bg-[#070d15] px-3 py-2 text-sm text-slate-100"
              maxLength={4_000}
              onChange={(event) => setReflection(event.target.value)}
              rows={4}
              value={reflection}
            />
          </label>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Handing in freezes this run. A late submission is accepted and recorded as late; it is never refused.
          </p>
          <button
            className={`${commandSurfaces.interactive} mt-3 border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-4 text-sm font-extrabold text-[#f0dda0] disabled:opacity-50`}
            disabled={pending}
            onClick={() =>
              act(
                { action: "submit", reflection: reflection.trim() || undefined },
                (data) => setRun((current) => (current ? { ...current, status: String(data.status) } : current)),
                "Handed in.",
              )
            }
            type="button"
          >
            Hand in this run
          </button>
        </>
      )}

      {handedIn && (
        <p className={`${commandSurfaces.panelReview} mt-4 p-3 text-[12px] leading-5 text-[#f0dda0]`}>
          This run has been handed in and can no longer be changed. {GRADE_AUTHORITY_NOTICE}
        </p>
      )}

      <p
        aria-live="polite"
        className={`mt-4 text-[12px] leading-5 ${feedback.tone === "error" ? "text-rose-300" : "text-slate-400"}`}
        role="status"
      >
        {feedback.message}
      </p>
    </section>
  );
}
