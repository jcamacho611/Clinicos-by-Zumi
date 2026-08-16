"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, Search } from "lucide-react";
import type { BriefingTone, LivingHomeBriefing } from "@/lib/living-home/briefing";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

/**
 * Living Home.
 *
 * The authenticated front door. It answers, in order: what needs me, what has already
 * been handled, what should I continue, and what is coming.
 *
 * Two things carry most of the weight. The verdict line states the day in one sentence
 * and is allowed to say nothing is wrong — a calm clinic should look calm rather than be
 * given manufactured urgency. And every row opens to show why it reached this person and
 * what it was derived from, because an operator who cannot see the reasoning has to
 * either trust the software blindly or ignore it.
 *
 * All copy here is clinic language. Risk kinds, action states and role keys are
 * translated in the briefing composer and never reach this component.
 */

const TONE_COLOR: Record<BriefingTone, string> = {
  decide: "var(--k-accent-2)",
  attention: "var(--k-premium)",
  steady: "var(--k-accent)",
  calm: "var(--k-muted)",
};

function toneStyle(tone: BriefingTone) {
  return { color: TONE_COLOR[tone] };
}

function SectionHeading({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h2 className="text-[13px] font-extrabold uppercase tracking-[.18em] text-[var(--k-text)]">{children}</h2>
      {note ? <span className="text-[11px] font-semibold text-[var(--k-muted)]">{note}</span> : null}
    </div>
  );
}

function NeedsRow({ item }: { item: LivingHomeBriefing["needsYou"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[var(--k-public-surface)]" style={{ borderLeft: `3px solid ${TONE_COLOR[item.tone]}` }}>
      <button
        aria-expanded={open}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 text-left sm:grid-cols-[minmax(0,1fr)_140px_92px_110px] sm:gap-6 sm:px-7"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="min-w-0">
          <span className="block text-[15px] font-bold leading-snug text-[var(--k-text)]">{item.title}</span>
          <span className="mt-1.5 block text-xs text-[var(--k-muted)]">{item.context}</span>
        </span>
        <span className={`hidden text-xs sm:block ${item.ownerIsUnassigned ? "font-bold" : ""}`} style={item.ownerIsUnassigned ? toneStyle("decide") : { color: "var(--k-text)" }}>
          {item.ownerIsUnassigned ? "Unassigned" : item.owner}
        </span>
        <span className="hidden text-xs tabular-nums text-[var(--k-muted)] sm:block">{item.age}</span>
        <span className="flex items-center justify-end gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-[.14em]" style={toneStyle(item.tone)}>{item.state}</span>
          <ChevronDown className={`size-4 shrink-0 text-[var(--k-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open ? (
        <div className="grid gap-8 px-5 pb-7 sm:px-7 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-10">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em]" style={{ color: "var(--k-accent)" }}>Why you are seeing this</p>
            <p className="mt-3 max-w-[70ch] text-sm leading-7 text-[var(--k-muted)]">{item.why}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {item.actions.map((action) => (
                <Link
                  className={
                    action.emphasis === "primary"
                      ? "inline-flex min-h-11 items-center rounded-lg bg-[var(--k-accent)] px-4 text-sm font-bold text-white"
                      : "inline-flex min-h-11 items-center rounded-lg border border-[var(--k-line)] px-4 text-sm font-bold text-[var(--k-text)]"
                  }
                  href={action.href}
                  key={action.label}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-[var(--k-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--k-muted)]">What this is based on</p>
            <dl className="mt-4 grid gap-2.5">
              {item.evidence.map((entry) => (
                <div className="grid grid-cols-[86px_minmax(0,1fr)] gap-3" key={entry.label}>
                  <dt className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">{entry.label}</dt>
                  <dd className="text-xs text-[var(--k-text)]">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Ask or find anything.
 *
 * The one place a person can state an outcome instead of hunting for the screen that
 * produces it. Intent is resolved deterministically first — the model is not what
 * decides which work starts — and Klinikos says what it needs when the sentence is not
 * yet specific enough to act on.
 */
function AskBar() {
  const [intent, setIntent] = useState("");
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const resolved = resolveIntentDeterministically(intent);
    const pathId = resolved.candidatePathIds[0] ?? null;
    if (!pathId) {
      setMessage(resolved.clarificationQuestions[0] ?? "Klinikos needs one more detail before it can help with that.");
      return;
    }

    setState("working");
    try {
      const response = await fetch("/api/paths", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pathId, goal: intent }),
      });
      const payload = (await response.json()) as { data?: unknown; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Klinikos could not start that yet.");
      setIntent("");
      setState("idle");
      setMessage("Here's the safest next step.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Klinikos could not start that yet.");
    }
  }

  return (
    <form className="mt-8 max-w-2xl" onSubmit={submit}>
      <label className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[var(--k-muted)]" htmlFor="klinikos-ask">
        What needs to happen?
      </label>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--k-line)] bg-[var(--k-public-surface)] p-2.5">
        <Search aria-hidden className="ml-2 size-5 shrink-0 text-[var(--k-muted)]" />
        <input
          className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-semibold text-[var(--k-text)] outline-none"
          id="klinikos-ask"
          onChange={(event) => { setIntent(event.target.value); if (state === "error") setState("idle"); }}
          placeholder="Find cover for Friday, follow up a referral, continue a course…"
          value={intent}
        />
        <button
          aria-label="Show me the next step"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--k-accent)] text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={state === "working" || intent.trim().length < 2}
          type="submit"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
      {message ? (
        <p aria-live="polite" className={`mt-3 text-[11px] ${state === "error" ? "text-rose-700" : "text-[var(--k-muted)]"}`}>{message}</p>
      ) : null}
    </form>
  );
}

export function LivingHome({ briefing }: { briefing: LivingHomeBriefing }) {
  // The composer runs on the server, so the clock label is fixed at render. Nudging it
  // client-side keeps "now" honest on a page left open, without re-fetching the briefing.
  const [nowLabel, setNowLabel] = useState(briefing.nowLabel);
  useEffect(() => {
    const tick = () => setNowLabel(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const ribbonHasLoad = useMemo(() => briefing.ribbon.some((bar) => bar.percent > 0), [briefing.ribbon]);

  return (
    <section className="-mx-4 sm:-mx-6 lg:-mx-8">
      {/* Greeting and the one-sentence verdict. */}
      <div className="px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[var(--k-muted)]">{briefing.dateLine}</p>
          <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[.98] tracking-[-.05em] text-[var(--k-text)] sm:text-5xl lg:text-6xl">
            {briefing.greeting}
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg font-semibold leading-snug sm:text-xl" style={toneStyle(briefing.verdictTone)}>
            {briefing.verdict}
          </p>
          <AskBar />
        </div>
      </div>

      {/* The day at a glance, drawn from the booked schedule. */}
      {ribbonHasLoad ? (
        <div className="px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="relative flex h-20 items-stretch overflow-hidden rounded-xl border border-[var(--k-line)] bg-[var(--k-public-surface)]">
              {briefing.ribbon.map((bar, index) => (
                <div className="relative grid flex-1 content-end border-r border-[var(--k-line)] px-1.5 pb-2 pt-2 last:border-r-0" key={`${bar.label}-${index}`}>
                  <div
                    className="rounded-[1px] transition-[height] duration-700"
                    style={{
                      height: `${Math.max(2, bar.percent)}%`,
                      background: bar.tone === "watch" ? "var(--k-premium)" : bar.tone === "open" ? "var(--k-line)" : "var(--k-accent)",
                    }}
                  />
                  <div className="mt-1.5 text-center text-[10px] font-extrabold tracking-[.06em] text-[var(--k-muted)]">{bar.label}</div>
                </div>
              ))}
              <div
                aria-hidden
                className="absolute bottom-0 top-0 w-0.5"
                style={{ left: `${briefing.nowPercent}%`, background: "var(--k-accent-2)" }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--k-muted)]">{briefing.ribbonCaption}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-[.14em]" style={{ color: "var(--k-accent-2)" }}>Now · {nowLabel}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Needs you — the reason this page exists. */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-baseline gap-5">
            <span
              className="text-6xl font-extrabold leading-[.85] tracking-[-.05em] tabular-nums sm:text-7xl"
              style={toneStyle(briefing.needsCount === 0 ? "calm" : briefing.verdictTone)}
            >
              {String(briefing.needsCount).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <SectionHeading>{briefing.needsTitle}</SectionHeading>
              <p className="mt-2 text-sm text-[var(--k-muted)]">{briefing.needsNote}</p>
            </div>
          </div>

          {briefing.needsYou.length > 0 ? (
            <div className="mt-9 grid gap-px overflow-hidden rounded-xl border border-[var(--k-line)] bg-[var(--k-line)]">
              {briefing.needsYou.map((item) => <NeedsRow item={item} key={item.id} />)}
            </div>
          ) : (
            <div className="mt-9 rounded-xl border border-[var(--k-line)] bg-[var(--k-public-surface)] px-6 py-10 text-center">
              <p className="text-base font-bold text-[var(--k-text)]">Everything important is handled.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--k-muted)]">
                Nothing is waiting on you right now. What is coming up is below.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Handled and coming up, side by side. */}
      <div className="px-4 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeading note={briefing.handledNote}>Already handled</SectionHeading>
            {briefing.handled.length > 0 ? (
              <ul className="mt-6 divide-y divide-[var(--k-line)] border-y border-[var(--k-line)]">
                {briefing.handled.map((entry) => (
                  <li className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-4 py-4" key={entry.id}>
                    <span aria-hidden className="size-2.5 rounded-full" style={{ background: "var(--k-accent)" }} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-[var(--k-text)]">{entry.label}</span>
                      <span className="mt-0.5 block text-[10px] text-[var(--k-muted)]">{entry.by}</span>
                    </span>
                    <span className="text-[10px] tabular-nums text-[var(--k-muted)]">{entry.when}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 border-y border-[var(--k-line)] py-5 text-sm text-[var(--k-muted)]">{briefing.handledNote}</p>
            )}
          </div>

          <div>
            <SectionHeading>Coming up</SectionHeading>
            {briefing.upcoming.length > 0 ? (
              <ul className="mt-6 divide-y divide-[var(--k-line)] border-y border-[var(--k-line)]">
                {briefing.upcoming.map((entry) => (
                  <li className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 py-4" key={entry.id}>
                    <span className="text-sm font-extrabold tabular-nums text-[var(--k-text)]">{entry.time}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-[var(--k-text)]">{entry.label}</span>
                      <span className="mt-0.5 block text-[10px] text-[var(--k-muted)]">{entry.detail}</span>
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-[.12em]" style={toneStyle(entry.tone)}>{entry.state}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 border-y border-[var(--k-line)] py-5 text-sm text-[var(--k-muted)]">Nothing else is scheduled today.</p>
            )}
          </div>
        </div>
      </div>

      {/* Work already in motion. */}
      {briefing.continueItems.length > 0 ? (
        <div className="px-4 pt-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionHeading>Continue</SectionHeading>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {briefing.continueItems.map((item) => (
                <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-public-surface)] p-6" key={item.id}>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--k-muted)]">{item.kind}</p>
                  <p className="mt-3 text-[15px] font-bold leading-snug text-[var(--k-text)]">{item.title}</p>
                  <p className="mt-2 text-xs text-[var(--k-muted)]">{item.note}</p>
                  <div className="mt-5 h-[3px] bg-[var(--k-line)]">
                    <div className="h-[3px]" style={{ width: `${Math.min(100, Math.max(0, item.percent))}%`, background: "var(--k-accent)" }} />
                  </div>
                  <p className="mt-2.5 text-[10px] font-extrabold uppercase tracking-[.14em]" style={{ color: "var(--k-accent)" }}>{item.progress}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* An opportunity appears only when it is real and evidenced. */}
      {briefing.opportunity ? (
        <div className="mt-16 bg-[var(--k-public-raised)] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em]" style={{ color: "var(--k-premium)" }}>Opportunity</p>
              <h2 className="mt-4 max-w-[22ch] text-2xl font-extrabold leading-tight tracking-[-.035em] text-[var(--k-text)] sm:text-3xl">
                {briefing.opportunity.title}
              </h2>
              <p className="mt-4 max-w-[52ch] text-base leading-7 text-[var(--k-muted)]">{briefing.opportunity.note}</p>
              <Link className="mt-7 inline-flex min-h-12 items-center rounded-lg bg-[var(--k-premium)] px-6 text-sm font-bold text-white" href={briefing.opportunity.ctaHref}>
                {briefing.opportunity.ctaLabel}
              </Link>
            </div>
            <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--k-line)] bg-[var(--k-line)]">
              {briefing.opportunity.lines.map((line) => (
                <div className="flex items-baseline justify-between gap-5 bg-[var(--k-public-surface)] px-5 py-4" key={line.label}>
                  <span className="text-xs text-[var(--k-muted)]">{line.label}</span>
                  <span className="text-lg font-extrabold tabular-nums text-[var(--k-text)]">{line.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-16 border-t border-[var(--k-line)] px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[var(--k-muted)]">
            Klinikos raises this from your own clinic data
          </span>
          <Link className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--k-accent)]" href="/tasks">
            Open all work <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
