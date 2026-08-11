"use client";

import { useState, useTransition } from "react";
import { commandSurfaces } from "@/lib/design/command-system";
import { ZumiAssistantOrb } from "@/components/command/zumi-command-shell";
import {
  actionStateLabels,
  actionStreamLabels,
  actionStreams,
  COMMUNICATIONS_BLOCKED_NOTICE,
  type ActionStream,
} from "@/lib/operations/followup-rules";
import type { CommandCenterData, ActionItem } from "@/lib/operations/command-center";

/**
 * The owner command centre.
 *
 * A priority stream, not a wall of modules. The owner reads a brief, sees what
 * Klinikos already did, and decides only the things that need a person — without
 * navigating anywhere.
 *
 * Every control here does something. There are no decorative buttons: an action that
 * cannot be acted on is rendered as state, not as a disabled-looking control that
 * invites a click.
 */

const STREAM_ORDER: readonly ActionStream[] = ["awaiting_you", "blocked", "handled", "completed"];

export function CommandCenter({ data, userName }: { data: CommandCenterData; userName: string }) {
  const [items, setItems] = useState(data.streams);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");

  function decide(action: ActionItem, decision: "confirm" | "dismiss") {
    setNotice("");
    startTransition(async () => {
      const response = await fetch("/api/operations/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: action.id, decision }),
      }).catch(() => null);

      const payload = await response?.json().catch(() => null);
      if (!response?.ok) {
        setNotice(payload?.error ?? "That could not be recorded.");
        return;
      }

      const nextState = payload?.data?.state as ActionItem["state"];
      // Move the item to the stream its new state belongs to rather than reloading —
      // the owner keeps their place in the queue.
      setItems((current) => {
        const remaining = Object.fromEntries(
          Object.entries(current).map(([key, list]) => [key, list.filter((entry) => entry.id !== action.id)]),
        ) as typeof current;
        const moved: ActionItem = { ...action, state: nextState, decidable: false };
        const target: ActionStream = nextState === "executed" ? "handled" : nextState === "awaiting_connection" ? "blocked" : "completed";
        return { ...remaining, [target]: [moved, ...remaining[target]] };
      });

      setNotice(
        nextState === "awaiting_connection"
          ? "Confirmed. It will send as soon as a messaging channel is connected."
          : decision === "confirm" ? "Confirmed." : "Dismissed.",
      );
    });
  }

  return (
    // The app shell's main region is light while its sidebar is dark navy. The command
    // centre is a command surface, so it bleeds past the shell's padding and carries
    // its own ground — otherwise it reads as a dark card dropped onto a light page,
    // and the white headline lands on a white background.
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-[#05090f] px-5 py-8 text-slate-100 sm:-m-6 sm:px-8 lg:-m-8 lg:px-10">
      <header className="flex flex-wrap items-start gap-5">
        <ZumiAssistantOrb active={data.counts.awaitingYou > 0} />
        <div className="min-w-[16rem] flex-1">
          <p className={commandSurfaces.eyebrow}>{data.clinicName}</p>
          <h1 className={`${commandSurfaces.headline} mt-2 text-3xl sm:text-4xl`}>
            {greeting()}, {userName.split(" ")[0]}.
          </h1>
        </div>
        {data.demoMode && (
          <span className="border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#f0dda0]">
            Demonstration data
          </span>
        )}
      </header>

      <section aria-labelledby="brief-heading" className={`${commandSurfaces.panelRaised} mt-8 p-6`}>
        <h2 className="sr-only" id="brief-heading">Operational brief</h2>
        <div className="grid gap-2.5">
          {data.brief.map((line, index) => (
            <p className={line.emphasis ? "text-xl font-extrabold tracking-[-.03em] text-white" : "text-sm leading-7 text-slate-300"} key={index}>
              {line.text}
            </p>
          ))}
        </div>

        {!data.zumi.available && (
          <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-5 text-slate-500">
            This brief is counted directly from your records. Zumi&rsquo;s reasoning layer is not connected in this
            deployment: {data.zumi.detail}
          </p>
        )}
      </section>

      <section aria-labelledby="counts-heading" className="mt-6">
        <h2 className="sr-only" id="counts-heading">Clinic at a glance</h2>
        <dl className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Appointments today" value={data.counts.appointmentsToday} />
          <Metric label="Upcoming at risk" value={data.counts.appointmentsAtRisk} tone={data.counts.appointmentsAtRisk > 0 ? "warn" : "calm"} />
          <Metric label="Tasks past due" value={data.counts.overdueTasks} tone={data.counts.overdueTasks > 0 ? "warn" : "calm"} />
          <Metric label="Handled by Klinikos" value={data.counts.handled} tone="good" />
        </dl>
      </section>

      {notice && (
        <p aria-live="polite" className="mt-5 text-[13px] text-slate-300" role="status">{notice}</p>
      )}

      {STREAM_ORDER.map((stream) => {
        const list = items[stream];
        if (list.length === 0) return null;
        return (
          <section aria-labelledby={`${stream}-heading`} className="mt-10" key={stream}>
            <h2 className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-500" id={`${stream}-heading`}>
              {actionStreamLabels[stream]} · {list.length}
            </h2>

            {stream === "blocked" && (
              <p className={`${commandSurfaces.panelReview} mt-3 p-4 text-[12px] leading-6 text-slate-200`}>
                {COMMUNICATIONS_BLOCKED_NOTICE}
              </p>
            )}

            <ol className="mt-4 grid gap-px bg-white/10">
              {list.map((action) => (
                <li className="bg-[#05090f] p-5" key={action.id}>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="border border-white/15 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
                      {action.riskLabel}
                    </span>
                    <span className="text-[11px] uppercase tracking-[.1em] text-slate-500">{actionStateLabels[action.state]}</span>
                  </div>

                  <h3 className="mt-3 text-base font-extrabold tracking-[-.02em] text-white">{action.title}</h3>
                  <p className="mt-2 max-w-3xl text-[13px] leading-7 text-slate-400">{action.body}</p>
                  {action.riskExplanation && (
                    <p className="mt-2 max-w-3xl text-[12px] leading-6 text-slate-500">{action.riskExplanation}</p>
                  )}

                  {action.decidable && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className={`${commandSurfaces.interactive} border border-cyan-300/40 bg-cyan-400/[.08] px-4 text-[13px] font-extrabold text-cyan-200 disabled:opacity-50`}
                        disabled={pending}
                        onClick={() => decide(action, "confirm")}
                        type="button"
                      >
                        {action.actionKind === "patient_message" ? "Approve this message" : "Confirm"}
                      </button>
                      <button
                        className={`${commandSurfaces.interactive} border border-white/15 bg-white/[.04] px-4 text-[13px] font-extrabold text-slate-300 disabled:opacity-50`}
                        disabled={pending}
                        onClick={() => decide(action, "dismiss")}
                        type="button"
                      >
                        Not needed
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      {!data.hasAnyData && (
        <section className={`${commandSurfaces.panel} mt-10 p-6`}>
          <h2 className={`${commandSurfaces.headline} text-xl`}>Nothing to watch yet</h2>
          <p className="mt-3 max-w-2xl text-[13px] leading-7 text-slate-400">
            Klinikos notices unconfirmed appointments, incomplete paperwork, unverified coverage, and patients
            who did not attend. Add a patient and book an appointment and this page starts filling itself in.
          </p>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, tone = "calm" }: { label: string; value: number; tone?: "calm" | "warn" | "good" }) {
  const colour = tone === "warn" ? "text-[#f0dda0]" : tone === "good" ? "text-cyan-200" : "text-white";
  return (
    <div className="bg-[#05090f] p-4">
      <dt className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">{label}</dt>
      <dd className={`mt-2 text-3xl font-extrabold tabular-nums tracking-[-.05em] ${colour}`}>{value}</dd>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
