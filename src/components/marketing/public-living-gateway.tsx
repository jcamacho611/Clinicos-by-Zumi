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

  const heroStage = useMemo(() => {
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

        <header className="relative z-30 flex min-h-[92px] items-center px-6 sm:px-9 lg:px-10">
          <KlinikosWordmark
            href="/"
            framed
            inverse
            markClassName="h-8 w-8"
            textClassName="text-[clamp(1rem,2vw,1.55rem)]"
          />
          <nav
            className="mx-auto hidden items-center gap-11 text-[10px] font-medium uppercase tracking-[0.3em] text-[#d8c7c4] lg:flex"
            aria-label="Primary"
          >
            {navItems.map((item) => (
              <Link className="transition-colors hover:text-[#f29a93]" href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            className="ml-auto grid size-12 place-items-center rounded-full border border-[#d9837f]/25 bg-[#140a0c]/75 text-[9px] font-bold uppercase tracking-[0.14em] text-[#f6dfdc] shadow-[0_0_24px_rgba(211,112,108,.08)]"
            href="/login"
            aria-label="Sign in"
          >
            Sign in
          </Link>
        </header>

        {!conversationStarted ? (
          <main className="reference-home relative z-10 mx-auto grid min-h-[calc(100vh-92px)] max-w-[1402px] grid-cols-1 px-6 pb-8 sm:px-9 lg:grid-cols-[190px_minmax(0,1fr)_190px] lg:px-10">
            <aside className="hidden items-center lg:flex">
              <ol className="w-full space-y-[58px] border-l border-[#c7807b]/22 pl-7" aria-label="Klinikos intelligence states">
                {progressSteps.map((step, index) => {
                  const active = index === 0;
                  return (
                    <li className="relative text-[10px] font-medium uppercase tracking-[0.15em]" key={step}>
                      <span
                        className={`absolute -left-[31px] top-1.5 size-[7px] rounded-full ${active ? "bg-[#f08c85] shadow-[0_0_17px_#f08c85]" : "bg-[#514544]"}`}
                      />
                      <span className={active ? "text-[#ef9a94]" : "text-[#796d6b]"}>{step}</span>
                    </li>
                  );
                })}
              </ol>
            </aside>

            <section className="flex min-h-[980px] flex-col items-center justify-center pb-4 text-center lg:min-h-[1000px]">
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
                  <div className="grid min-h-[112px] grid-cols-[3rem_minmax(0,1fr)_3.1rem_3.8rem] items-center gap-3 rounded-[31px] border border-[#d9918a]/35 bg-[#1b0d10]/68 px-5 py-3 shadow-[0_22px_70px_rgba(59,8,12,.38)] backdrop-blur-xl focus-within:border-[#ec9b94]/65">
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
                      aria-label="Send to Klinikos"
                      className="grid size-12 place-items-center rounded-full bg-[#df817a] text-[#270b0c] shadow-[0_0_25px_rgba(224,119,112,.2)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
                      disabled={!intent.trim() || Boolean(activeTurn)}
                      type="submit"
                    >
                      <ArrowRight className="size-5 -rotate-45" />
                    </button>
                  </div>
                </form>

                <div className="-mt-[31px] flex flex-col items-center">
                  <div className="relative grid size-[92px] place-items-center rounded-full border border-[#e9847f]/45 bg-[#17090c]/95 shadow-[0_0_48px_rgba(229,116,110,.36)]">
                    <ZumiOrb size={82} state="dormant" />
                  </div>
                  <p className="mt-3 text-[10px] text-[#c5a8a4]">Your AI Operating Partner</p>
                </div>
              </div>

              <div className="mt-8 grid w-full max-w-[1190px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ title, body, href, icon: Icon }) => (
                  <Link
                    className="group min-h-[132px] rounded-[17px] border border-[#d9837f]/15 bg-black/28 p-5 text-left backdrop-blur-md transition-all hover:border-[#e58b85]/35 hover:bg-[#160a0c]/66"
                    href={href}
                    key={title}
                  >
                    <div className="flex gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-[9px] bg-[#2e1316] text-[#ed8b84]">
                        <Icon className="size-[17px]" />
                      </span>
                      <div>
                        <h2 className="text-[14px] font-semibold text-[#fff6f3]">{title}</h2>
                        <p className="mt-2 text-[12px] leading-5 text-[#b9a09c]">{body}</p>
                        <ArrowRight className="mt-3 size-4 text-[#e68c85] transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                href={protectedHref("/dashboard")}
                className="mt-5 grid min-h-[155px] w-full max-w-[1190px] gap-0 overflow-hidden rounded-[17px] border border-[#d9837f]/15 bg-black/38 text-left md:grid-cols-[42%_58%] md:items-stretch"
              >
                <div className="speedster-panel min-h-[150px]" />
                <div className="flex items-center justify-between gap-8 px-8 py-6">
                  <div>
                    <h2 className="text-[clamp(1.7rem,2.4vw,2.25rem)] font-light tracking-[-0.045em] text-[#f8efed]">
                      Built for speed. Designed for care.
                    </h2>
                    <p className="mt-3 max-w-[560px] text-[13px] leading-6 text-[#c2aaa6]">
                      Klinikos helps modern clinics move faster, stay organized, and deliver exceptional care.
                    </p>
                  </div>
                  <span className="hidden min-w-[205px] items-center justify-between rounded-full border border-[#d9837f]/18 px-6 py-4 text-[12px] text-[#f3dfdc] lg:flex">
                    Explore Klinikos <ArrowRight className="size-4 text-[#e58b85]" />
                  </span>
                </div>
              </Link>
            </section>

            <aside className="hidden items-center justify-end lg:flex">
              <nav className="space-y-[30px]" aria-label="Klinikos actions">
                {actionItems.map(({ label, href, icon: Icon }) => (
                  <Link
                    className="flex w-24 flex-col items-center gap-2 text-[9px] font-medium uppercase tracking-[0.15em] text-[#b7918d] transition-colors hover:text-[#f29a93]"
                    href={href}
                    key={label}
                  >
                    <span className="grid size-12 place-items-center rounded-full border border-[#d9837f]/16 bg-black/22">
                      <Icon className="size-[18px]" />
                    </span>
                    {label}
                  </Link>
                ))}
              </nav>
            </aside>
          </main>
        ) : (
          <main className="relative z-10 min-h-[calc(100vh-92px)] px-5 py-10 sm:px-8 sm:py-14">
            <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[150px_minmax(0,1fr)_210px]">
              <aside className="hidden lg:block">
                <ol className="sticky top-28 space-y-8 border-l border-[#d9837f]/18 pl-6" aria-label="Current intelligence progress">
                  {progressSteps.map((step, index) => {
                    const reached = activeTurn ? index <= heroStage : index <= 4;
                    const current = activeTurn ? index === heroStage : index === 4;
                    return (
                      <li className="relative" key={step}>
                        <span className={`absolute -left-[27px] top-1.5 size-[7px] rounded-full ${current ? "bg-[#ef8c85] shadow-[0_0_18px_#ef8c85]" : reached ? "bg-[#8e5654]" : "bg-[#4a4140]"}`} />
                        <span className={`text-[9px] font-semibold uppercase tracking-[0.15em] ${reached ? "text-[#d9aaa5]" : "text-[#746664]"}`}>{step}</span>
                      </li>
                    );
                  })}
                </ol>
              </aside>

              <div>
                <div className="mb-12 flex items-end justify-between gap-5 border-b border-[#d9837f]/15 pb-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#e47e78]">Living thread</p>
                    <h1 id="public-living-title" className="mt-2 text-2xl font-light tracking-[-0.03em]">The workspace forms around the work.</h1>
                  </div>
                  <Link className="text-[10px] uppercase tracking-[0.2em] text-[#c3a29e] hover:text-[#ee918b]" href="/login">Sign in</Link>
                </div>

                <ol className="space-y-16">
                  {turns.map((turn, index) => {
                    const currentStageIndex = stageIndex(turn.stage);
                    const showResponse = turn.stage === "complete";
                    const destination = turn.resolution.destination;
                    const actions = destination ? workspaceActions[destination.key] : [];

                    return (
                      <li className="grid gap-6 sm:grid-cols-[5rem_minmax(0,1fr)]" key={turn.id}>
                        <div className="hidden border-r border-[#d9837f]/15 pr-5 text-right sm:block">
                          <p className="text-[10px] font-semibold text-[#927b78]">{String(index + 1).padStart(2, "0")}</p>
                          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#927b78]">You</p>
                        </div>
                        <div>
                          <blockquote className="text-balance text-3xl font-light leading-tight tracking-[-0.03em] sm:text-4xl">{turn.prompt}</blockquote>
                          <div className="mt-8 grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-5 border-y border-[#d9837f]/15 py-5">
                            <ZumiOrb size={68} state={orbState(turn.stage)} />
                            <ol className="grid gap-3 sm:grid-cols-5" aria-label={`Klinikos progress: ${statusLabel(turn.stage)}`}>
                              {progressSteps.map((step, stepIndex) => {
                                const connectingSuppressed = step === "Connecting" && !turn.resolution.destination;
                                const reached = !connectingSuppressed && stepIndex <= currentStageIndex;
                                const current = turn.stage !== "complete" && stepIndex === currentStageIndex;
                                return (
                                  <li className={`flex items-center gap-2 ${connectingSuppressed ? "opacity-30" : ""}`} key={step} {...(current ? { "aria-current": "step" as const } : {})}>
                                    <span className={`h-px w-4 ${reached ? "bg-[#e6817b]" : "bg-[#5e4b49]"}`} />
                                    <span className={`text-[9px] font-semibold uppercase tracking-[0.13em] ${reached ? "text-[#f0d9d5]" : "text-[#7e6a67]"}`}>{step}</span>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>

                          {showResponse ? (
                            <article className="mt-8 border-l border-[#e6817b] pl-6">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e6817b]">Klinikos Intelligence</p>
                              <h2 className="mt-3 text-2xl font-light tracking-[-0.03em]">{turn.resolution.title}</h2>
                              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c8adaa]">{turn.resolution.body}</p>
                              {turn.resolution.assumption ? (
                                <p className="mt-4 max-w-2xl text-xs leading-6 text-[#9f8581]">
                                  <strong className="font-semibold text-[#d6b6b1]">Working assumption:</strong> {turn.resolution.assumption}
                                </p>
                              ) : null}

                              {destination ? (
                                <div className="mt-7 rounded-2xl border border-[#d9837f]/16 bg-[#100709]/75 p-5">
                                  <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#ab8581]">Relevant workspace</p>
                                      <p className="mt-2 text-sm text-[#f0dcda]">Only the product surfaces that belong to this request are being brought forward.</p>
                                    </div>
                                    <Link
                                      className="inline-flex items-center gap-2 rounded-full border border-[#e6817b]/35 bg-[#251012] px-5 py-3 text-xs font-semibold text-[#f0a09a]"
                                      href={destination.key === "edu" || destination.key === "patient" ? destination.href : protectedHref(destination.href)}
                                    >
                                      {destination.action} <ArrowRight className="size-4" />
                                    </Link>
                                  </div>
                                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                                    {actions.map((action) => (
                                      <Link
                                        key={action.href}
                                        href={action.href === "/edu" || action.href === "/portal" ? action.href : protectedHref(action.href)}
                                        className="flex min-h-12 items-center justify-between rounded-xl border border-[#d9837f]/12 bg-black/25 px-4 text-xs text-[#d7b8b4] transition-colors hover:border-[#df817a]/35 hover:text-[#f2a19a]"
                                      >
                                        {action.label} <ArrowRight className="size-3.5" />
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </article>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <div ref={threadEnd} />
              </div>

              <aside className="hidden lg:block">
                <div className="sticky top-28 rounded-2xl border border-[#d9837f]/14 bg-black/25 p-4 backdrop-blur-lg">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#a88480]">Available modules</p>
                  <div className="mt-4 space-y-2">
                    {actionItems.map(({ label, href, icon: Icon }) => (
                      <Link key={label} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-xs text-[#c3a5a1] transition-colors hover:bg-[#1b0b0e] hover:text-[#f09a93]">
                        <Icon className="size-4" /> {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </main>
        )}

        {conversationStarted ? (
          <form className="sticky bottom-0 z-30 border-t border-[#d9837f]/15 bg-[#090405]/94 px-5 py-4 backdrop-blur-xl sm:px-8" onSubmit={submit}>
            <div className="mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)_3.5rem] items-end gap-4">
              <textarea
                className="max-h-36 min-h-14 resize-none rounded-2xl border border-[#d9837f]/20 bg-[#14090b]/88 px-4 py-4 text-base text-[#fff5f2] outline-none placeholder:text-[#8f7470] focus:border-[#e6817b]/60"
                onChange={(event) => setIntent(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Continue the thread..."
                readOnly={Boolean(activeTurn)}
                rows={1}
                value={intent}
              />
              <button
                className="grid size-14 place-items-center rounded-full bg-[#e6817b] text-[#2a0b0c] disabled:opacity-30"
                disabled={!intent.trim() || Boolean(activeTurn)}
                type="submit"
                aria-label="Send to Klinikos"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
            <div className="mx-auto mt-2 flex max-w-4xl justify-between text-[10px] text-[#8f7470]">
              <p>{activeTurn ? statusLabel(activeTurn.stage) : "Klinikos keeps permissions and consequential actions governed underneath."}</p>
              <p className="hidden items-center gap-2 sm:flex"><CornerDownLeft className="size-3" /> Enter to send · Shift + Enter for a new line</p>
            </div>
          </form>
        ) : null}
      </section>
    </>
  );
}
