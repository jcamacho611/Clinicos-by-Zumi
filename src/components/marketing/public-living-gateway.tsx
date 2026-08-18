"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  CalendarDays,
  CornerDownLeft,
  HeartPulse,
  Network,
  Paperclip,
  ReceiptText,
  Users,
} from "lucide-react";
import { ZumiOrb, type ZumiState } from "@/components/ds";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import {
  resolvePublicLivingIntent,
  type PublicLivingDestination,
  type PublicLivingResolution,
} from "@/lib/orchestration/public-living-intent";

const progressSteps = ["Listening", "Understanding", "Connecting", "Preparing", "Ready"] as const;
type ProgressStage = "understanding" | "connecting" | "preparing" | "ready" | "complete";

type ConversationTurn = {
  id: number;
  prompt: string;
  stage: ProgressStage;
  resolution: PublicLivingResolution;
};

type WorkspaceAction = { label: string; href: string };

const protectedHref = (href: string) => `/login?next=${encodeURIComponent(href)}`;

const navItems = [
  { label: "Dashboards", href: protectedHref("/dashboard") },
  { label: "Grid", href: protectedHref("/grid") },
  { label: "Care", href: protectedHref("/provider") },
  { label: "EDU", href: "/edu" },
  { label: "Intelligence", href: "#living-composer" },
] as const;

const actionItems = [
  { label: "Patients", href: protectedHref("/patients"), icon: Users },
  { label: "Grid", href: protectedHref("/grid"), icon: Network },
  { label: "Care", href: protectedHref("/provider"), icon: HeartPulse },
  { label: "Billing", href: protectedHref("/billing"), icon: ReceiptText },
  { label: "Insights", href: protectedHref("/quality"), icon: BarChart3 },
] as const;

const cards = [
  {
    title: "Today's Priorities",
    body: "Open owned tasks, escalations, follow-ups, and work that needs attention now.",
    href: protectedHref("/tasks"),
    icon: CalendarDays,
  },
  {
    title: "Revenue Opportunities",
    body: "Open the real CRM and revenue-recovery work behind missed conversion and follow-up.",
    href: protectedHref("/crm"),
    icon: BarChart3,
  },
  {
    title: "Team Workflow",
    body: "See assigned work, handoffs, escalations, and where ownership needs attention.",
    href: protectedHref("/tasks"),
    icon: Users,
  },
  {
    title: "Grid Network",
    body: "Find providers, services, space, work, and governed healthcare capacity.",
    href: protectedHref("/grid"),
    icon: Network,
  },
] as const;

const workspaceActions: Record<PublicLivingDestination["key"], readonly WorkspaceAction[]> = {
  priorities: [
    { label: "Tasks", href: "/tasks" },
    { label: "Escalations", href: "/escalations" },
    { label: "Schedule", href: "/schedule" },
  ],
  revenue: [
    { label: "Revenue recovery", href: "/crm" },
    { label: "Billing", href: "/billing" },
    { label: "Claim readiness", href: "/claim-readiness" },
  ],
  billing: [
    { label: "Billing", href: "/billing" },
    { label: "Claim readiness", href: "/claim-readiness" },
    { label: "Insurance", href: "/insurance" },
  ],
  insights: [
    { label: "Quality & care gaps", href: "/quality" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Care network", href: "/network" },
  ],
  staffing: [
    { label: "The Grid", href: "/grid" },
    { label: "Capacity exchange", href: "/capacity-exchange" },
    { label: "Provider network", href: "/provider-network" },
  ],
  grid: [
    { label: "The Grid", href: "/grid" },
    { label: "Capacity exchange", href: "/capacity-exchange" },
    { label: "Provider network", href: "/provider-network" },
  ],
  referrals: [
    { label: "Referrals", href: "/referrals" },
    { label: "Patient navigation", href: "/patient-navigation" },
    { label: "Messages", href: "/messages" },
  ],
  care: [
    { label: "Provider workspace", href: "/provider" },
    { label: "Encounters", href: "/encounters" },
    { label: "Labs", href: "/labs" },
  ],
  patient: [{ label: "Patient portal", href: "/portal" }],
  edu: [{ label: "Klinikos EDU", href: "/edu" }],
  clinic: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Front desk", href: "/front-desk" },
    { label: "Tasks", href: "/tasks" },
  ],
};

function stageIndex(stage: ProgressStage) {
  if (stage === "understanding") return 1;
  if (stage === "connecting") return 2;
  if (stage === "preparing") return 3;
  return 4;
}

function orbState(stage: ProgressStage): ZumiState {
  if (stage === "understanding") return "observing";
  if (stage === "connecting") return "mapping";
  if (stage === "preparing") return "mapping";
  if (stage === "ready") return "analyzing";
  return "resolved";
}

function statusLabel(stage: ProgressStage) {
  if (stage === "complete") return "Ready";
  return progressSteps[stageIndex(stage)];
}

export function PublicLivingGateway() {
  const [intent, setIntent] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const nextTurnId = useRef(1);
  const timers = useRef<number[]>([]);
  const threadEnd = useRef<HTMLDivElement>(null);

  const activeTurn = turns.find((turn) => turn.stage !== "complete") ?? null;
  const activeTurnId = activeTurn?.id ?? null;
  const activeStage = activeTurn?.stage ?? null;
  const conversationStarted = turns.length > 0;
  const latestTurn = turns[turns.length - 1] ?? null;
  const latestResolution = latestTurn?.stage === "complete" ? latestTurn.resolution : null;

  const liveStatus = activeStage
    ? `Klinikos is ${statusLabel(activeStage).toLowerCase()}.`
    : latestResolution
      ? `Klinikos is ready. ${latestResolution.title}${latestResolution.destination ? ` Next action available: ${latestResolution.destination.action}.` : ""}`
      : "Klinikos is ready.";

  useMemo(() => {
    if (!activeTurn) return 0;
    return stageIndex(activeTurn.stage);
  }, [activeTurn]);

  useEffect(() => {
    const scheduledTimers = timers.current;
    return () => scheduledTimers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    threadEnd.current?.scrollIntoView({
      behavior: activeTurnId && !reduceMotion ? "smooth" : "auto",
      block: "end",
    });
  }, [activeStage, activeTurnId, turns.length]);

  function updateTurn(id: number, update: Partial<ConversationTurn>) {
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, ...update } : turn)));
  }

  function schedule(delay: number, action: () => void) {
    const timer = window.setTimeout(action, delay);
    timers.current.push(timer);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = intent.trim();
    if (!prompt || activeTurn) return;

    const priorResolution = [...turns].reverse().find((turn) => turn.stage === "complete")?.resolution ?? null;
    const resolution = resolvePublicLivingIntent(prompt, priorResolution);
    const id = nextTurnId.current;
    nextTurnId.current += 1;

    setTurns((current) => [...current, { id, prompt, stage: "understanding", resolution }]);
    setIntent("");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      schedule(0, () => updateTurn(id, { stage: "complete" }));
      return;
    }

    if (resolution.destination) {
      schedule(170, () => updateTurn(id, { stage: "connecting" }));
      schedule(350, () => updateTurn(id, { stage: "preparing" }));
      schedule(530, () => updateTurn(id, { stage: "ready" }));
      schedule(720, () => updateTurn(id, { stage: "complete" }));
    } else {
      schedule(220, () => updateTurn(id, { stage: "preparing" }));
      schedule(440, () => updateTurn(id, { stage: "ready" }));
      schedule(650, () => updateTurn(id, { stage: "complete" }));
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <>
      <div className="sr-only" aria-live="polite" role="status">{liveStatus}</div>
      <section
        className="rose-home min-h-screen overflow-hidden bg-[#050303] text-[#f8f0ee]"
        aria-busy={Boolean(activeTurn)}
        aria-labelledby="public-living-title"
      >
        <div className="rose-vignette pointer-events-none fixed inset-0 -z-10" />
        <div
          className={`rose-atmosphere pointer-events-none fixed inset-0 -z-10 transition-all duration-700 ${conversationStarted ? "scale-[1.03] opacity-25" : "scale-100 opacity-100"}`}
        />

        <header className="reference-header relative z-30 flex min-h-[92px] items-center px-6 sm:px-9 lg:px-10">
          <KlinikosWordmark
            href="/"
            framed
            inverse
            markClassName="h-8 w-8"
            textClassName="h-[22px] w-[205px]"
          />
          <nav
            className="mx-auto hidden items-center gap-11 text-[12px] font-medium uppercase tracking-[0.3em] text-[#d8c7c4] lg:flex"
            aria-label="Primary"
          >
            {navItems.map((item) => (
              <Link className="transition-colors hover:text-[#f29a93]" href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            className="ml-auto grid size-12 place-items-center rounded-full border border-[#d9837f]/25 bg-[#140a0c]/75 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f6dfdc] shadow-[0_0_24px_rgba(211,112,108,.08)]"
            href="/login"
            aria-label="Sign in"
          >
            Sign in
          </Link>
        </header>

        {!conversationStarted ? (
          <main className="reference-home relative z-10 mx-auto grid min-h-[calc(100vh-92px)] max-w-[1402px] grid-cols-1 px-6 pb-8 sm:px-9 lg:grid-cols-[190px_minmax(0,1fr)_190px] lg:px-10">
            <aside className="reference-state-rail hidden items-center lg:flex">
              <ol className="w-full space-y-[52px] border-l border-[#c7807b]/22 pl-7" aria-label="Klinikos intelligence states">
                {progressSteps.map((step, index) => {
                  const active = index === 0;
                  return (
                    <li className="relative text-[12px] font-medium uppercase tracking-[0.15em]" key={step}>
                      <span
                        className={`absolute -left-[31px] top-1.5 size-[7px] rounded-full ${active ? "bg-[#f08c85] shadow-[0_0_17px_#f08c85]" : "bg-[#514544]"}`}
                      />
                      <span className={active ? "text-[#ef9a94]" : "text-[#796d6b]"}>{step}</span>
                    </li>
                  );
                })}
              </ol>
            </aside>

            <section className="reference-center flex min-h-[980px] flex-col items-center justify-center pb-4 text-center lg:min-h-[1000px]">
              <div className="reference-hero flex w-full flex-col items-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.5em] text-[#e27d77]">Klinikos Intelligence</p>
                <h1
                  id="public-living-title"
                  className="mt-8 max-w-[760px] text-balance text-[clamp(4.5rem,7.7vw,7.7rem)] font-light leading-[0.87] tracking-[-0.065em] text-[#f5edeb]"
                >
                  What needs
                  <br />
                  to happen?
                </h1>
                <p className="mt-7 max-w-[560px] text-sm leading-6 text-[#d9c4c0] sm:text-[15px]">
                  Klinikos understands your ecosystem, connects what matters,
                  <br className="hidden sm:block" /> and gets the right things moving.
                </p>

                <form id="living-composer" className="mt-11 w-full max-w-[770px]" onSubmit={submit}>
                  <div className="relative grid min-h-[112px] grid-cols-[3rem_minmax(0,1fr)_3.1rem_3.8rem] items-center gap-3 rounded-[31px] border border-[#d9918a]/35 bg-[#1b0d10]/68 px-5 py-3 shadow-[0_22px_70px_rgba(59,8,12,.38)] backdrop-blur-xl focus-within:border-[#ec9b94]/65">
                    <Link
                      href={protectedHref("/documents")}
                      className="grid size-10 place-items-center rounded-full text-[#cda39e] transition-colors hover:text-[#f2a19a]"
                      aria-label="Open documents"
                    >
                      <Paperclip className="size-5" />
                    </Link>
                    <textarea
                      className="max-h-36 min-h-16 resize-none bg-transparent py-5 text-left text-[15px] font-medium text-[#fff6f4] outline-none placeholder:text-[#a2817d]"
                      id="public-klinikos-intent"
                      onChange={(event) => setIntent(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Ask Klinikos anything..."
                      readOnly={Boolean(activeTurn)}
                      rows={1}
                      value={intent}
                    />
                    <Link
                      href={protectedHref("/voice-assistant")}
                      className="grid size-11 place-items-center rounded-full border border-[#d9837f]/18 bg-black/20 text-[#c89490] transition-colors hover:text-[#f09a93]"
                      aria-label="Talk to Zumi"
                    >
                      <AudioLines className="size-5" />
                    </Link>
                    <button
                      aria-label="Ask Klinikos"
                      className="grid size-12 place-items-center rounded-full bg-[#e6817b] text-[#1a090a] shadow-[0_0_28px_rgba(230,129,123,.22)] transition hover:bg-[#efaaa1] disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!intent.trim() || Boolean(activeTurn)}
                      type="submit"
                    >
                      <CornerDownLeft className="size-5" />
                    </button>
                    <div className="reference-zumi absolute -bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-3">
                      <ZumiOrb state="dormant" size={48} />
                      <span className="whitespace-nowrap text-[12px] uppercase tracking-[0.22em] text-[#9d7772]">Your AI Operating Partner</span>
                    </div>
                  </div>
                </form>

                <div className="reference-card-row mt-[74px] grid w-full max-w-[930px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {cards.map(({ title, body, href, icon: Icon }) => (
                    <Link
                      className="group rounded-[18px] border border-[#d0837d]/13 bg-[#100708]/64 p-5 text-left backdrop-blur-sm transition hover:border-[#e6817b]/26 hover:bg-[#170b0d]/76"
                      href={href}
                      key={title}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Icon className="size-4 text-[#d98e87]" />
                        <ArrowRight className="size-3.5 text-[#6e5552] transition group-hover:translate-x-1 group-hover:text-[#e6817b]" />
                      </div>
                      <h2 className="mt-5 text-sm font-semibold tracking-[-.03em] text-[#f6ece9]">{title}</h2>
                      <p className="mt-2 text-[11px] leading-5 text-[#8f7773]">{body}</p>
                    </Link>
                  ))}
                </div>

                <Link
                  className="reference-lower-strip speedster-panel mt-5 grid min-h-[138px] w-full max-w-[930px] grid-cols-[1.2fr_.8fr] overflow-hidden rounded-[22px] border border-[#d0837d]/12 text-left"
                  href="/how-it-works"
                >
                  <div className="relative min-h-[138px]" />
                  <div className="flex flex-col justify-center border-l border-[#d0837d]/10 bg-[#0d0607]/86 px-7 py-5">
                    <p className="text-2xl font-light leading-tight tracking-[-.04em] text-[#f7ece9]">Built for speed. Designed for care.</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-[#e6817b]">Explore Klinikos <ArrowRight className="size-3.5" /></span>
                  </div>
                </Link>
              </div>
            </section>

            <aside className="reference-action-rail hidden items-center justify-end lg:flex">
              <nav className="space-y-7" aria-label="Operational shortcuts">
                {actionItems.map(({ label, href, icon: Icon }) => (
                  <Link className="group flex items-center justify-end gap-3 text-[12px] font-medium uppercase tracking-[0.15em] text-[#806f6c]" href={href} key={label}>
                    <span className="transition-colors group-hover:text-[#e6817b]">{label}</span>
                    <span className="grid size-8 place-items-center rounded-full border border-[#d0837d]/12 bg-[#100708]/52 text-[#9e817d] transition group-hover:border-[#e6817b]/30 group-hover:text-[#e6817b]">
                      <Icon className="size-3.5" />
                    </span>
                  </Link>
                ))}
              </nav>
            </aside>
          </main>
        ) : (
          <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-8 sm:px-9 lg:px-10">
            <section className="space-y-10">
              {turns.map((turn) => {
                const complete = turn.stage === "complete";
                const resolution = turn.resolution;
                const turnStage = complete ? 4 : stageIndex(turn.stage);
                const actions = resolution.destination ? workspaceActions[resolution.destination.key] : [];
                return (
                  <article className="space-y-5" key={turn.id}>
                    <p className="ml-auto max-w-2xl rounded-[24px] border border-[#d0837d]/12 bg-[#13090b]/76 px-5 py-4 text-sm leading-6 text-[#f7ece9]">{turn.prompt}</p>
                    <div className="grid gap-5 lg:grid-cols-[96px_minmax(0,1fr)]">
                      <ol className="space-y-3" aria-label="Progress">
                        {progressSteps.map((step, index) => (
                          <li className={`text-[11px] uppercase tracking-[.16em] ${index <= turnStage ? "text-[#e6817b]" : "text-[#5d4b49]"}`} key={step}>{step}</li>
                        ))}
                      </ol>
                      <div className="rounded-[26px] border border-[#d0837d]/12 bg-[#0f0708]/72 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                          <ZumiOrb state={complete ? "resolved" : orbState(turn.stage)} size={52} />
                          <p className="text-[12px] uppercase tracking-[.22em] text-[#e6817b]">{statusLabel(turn.stage)}</p>
                        </div>
                        {complete && (
                          <div className="mt-6">
                            <h2 className="text-2xl font-light tracking-[-.04em] text-[#f8efed]">{resolution.title}</h2>
                            <p className="mt-3 text-sm leading-7 text-[#ad9691]">{resolution.body}</p>
                            {resolution.assumption && <p className="mt-4 border-l border-[#e6817b]/35 pl-4 text-xs leading-6 text-[#9d817d]">Assumption: {resolution.assumption}</p>}
                            {actions.length > 0 && (
                              <div className="mt-6 flex flex-wrap gap-3">
                                {actions.map((action) => (
                                  <Link className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-[#d0837d]/14 bg-[#15090b] px-4 text-xs font-semibold text-[#f4e8e5] hover:border-[#e6817b]/30" href={protectedHref(action.href)} key={action.href}>
                                    {action.label}<ArrowRight className="size-3.5" />
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              <div ref={threadEnd} />
            </section>
          </main>
        )}
      </section>
    </>
  );
}
