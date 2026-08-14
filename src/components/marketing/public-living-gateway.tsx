"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, CornerDownLeft, HeartPulse, Network, Users } from "lucide-react";
import { ZumiOrb, type ZumiState } from "@/components/ds";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { resolvePublicLivingIntent, type PublicLivingResolution } from "@/lib/orchestration/public-living-intent";

const progressSteps = ["Listening", "Understanding", "Preparing", "Ready"] as const;
type ProgressStage = "understanding" | "preparing" | "ready" | "complete";

type ConversationTurn = { id: number; prompt: string; stage: ProgressStage; resolution: PublicLivingResolution | null; };

const navItems = [
  { label: "Dashboards", href: "/login?next=/dashboard" },
  { label: "Grid", href: "/login?next=/grid" },
  { label: "Care", href: "/login?next=/patients" },
  { label: "EDU", href: "/edu" },
  { label: "Intelligence", href: "#living-composer" },
] as const;

const actionItems = [
  { label: "Patients", href: "/login?next=/patients", icon: Users },
  { label: "Grid", href: "/login?next=/grid", icon: Network },
  { label: "Care", href: "/login?next=/patients", icon: HeartPulse },
  { label: "Billing", href: "/login?next=/dashboard", icon: CalendarDays },
  { label: "Insights", href: "/login?next=/owner", icon: BarChart3 },
] as const;

const cards = [
  { title: "Today's Priorities", body: "Follow-ups, tasks, and appointments that need you.", href: "/login?next=/dashboard", icon: CalendarDays },
  { title: "Revenue Opportunities", body: "Recover lost revenue and activate what's waiting.", href: "/founding-clinic", icon: BarChart3 },
  { title: "Team Workflow", body: "See workloads, handoffs, and what is falling through.", href: "/login?next=/dashboard", icon: Users },
  { title: "Grid Network", body: "Find providers, space, and real-time capacity.", href: "/login?next=/grid", icon: Network },
] as const;

function stageIndex(stage: ProgressStage) {
  if (stage === "understanding") return 1;
  if (stage === "preparing") return 2;
  return 3;
}

function orbState(stage: ProgressStage): ZumiState {
  if (stage === "understanding") return "observing";
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
  const latestResolution = turns[turns.length - 1]?.resolution ?? null;

  const liveStatus = activeStage
    ? `Klinikos is ${statusLabel(activeStage).toLowerCase()}.`
    : latestResolution
      ? `Klinikos is ready. ${latestResolution.title}${latestResolution.destination ? ` Next action available: ${latestResolution.destination.action}.` : ""}`
      : "Klinikos is ready.";

  useEffect(() => {
    const scheduledTimers = timers.current;
    return () => scheduledTimers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    threadEnd.current?.scrollIntoView({ behavior: activeTurnId && !reduceMotion ? "smooth" : "auto", block: "end" });
  }, [activeStage, activeTurnId, turns.length]);

  function updateTurn(id: number, update: Partial<ConversationTurn>) {
    setTurns((current) => current.map((turn) => turn.id === id ? { ...turn, ...update } : turn));
  }

  function schedule(delay: number, action: () => void) {
    const timer = window.setTimeout(action, delay);
    timers.current.push(timer);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = intent.trim();
    if (!prompt || activeTurn) return;
    const priorResolution = [...turns].reverse().find((turn) => turn.resolution)?.resolution ?? null;
    const resolution = resolvePublicLivingIntent(prompt, priorResolution);
    const id = nextTurnId.current;
    nextTurnId.current += 1;
    setTurns((current) => [...current, { id, prompt, stage: "understanding", resolution: null }]);
    setIntent("");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timing = reduceMotion ? { preparing: 0, ready: 0, response: 0 } : { preparing: 170, ready: 340, response: 520 };
    schedule(timing.preparing, () => updateTurn(id, { stage: "preparing" }));
    schedule(timing.ready, () => updateTurn(id, { stage: "ready" }));
    schedule(timing.response, () => updateTurn(id, { stage: "complete", resolution }));
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <>
      <div className="sr-only" aria-live="polite" role="status">{liveStatus}</div>
      <section className="rose-home min-h-screen overflow-hidden bg-[#050303] text-[#f8f0ee]" aria-busy={Boolean(activeTurn)} aria-labelledby="public-living-title">
        <div className="rose-vignette pointer-events-none fixed inset-0 -z-10" />
        <div className={`rose-atmosphere pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700 ${conversationStarted ? "opacity-20" : "opacity-100"}`} />

        <header className="relative z-20 flex min-h-24 items-center border-b border-[#d9837f]/10 px-5 sm:px-8 lg:px-10">
          <KlinikosWordmark href="/" framed inverse markClassName="h-8 w-8" textClassName="text-[clamp(.95rem,2vw,1.45rem)]" />
          <nav className="mx-auto hidden items-center gap-10 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d7c4c0] lg:flex" aria-label="Primary">
            {navItems.map((item) => <Link className="transition-colors hover:text-[#f29a93]" href={item.href} key={item.label}>{item.label}</Link>)}
          </nav>
          <Link className="ml-auto grid size-12 place-items-center rounded-full border border-[#d9837f]/20 bg-black/35 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f6dfdc]" href="/login" aria-label="Sign in">Sign in</Link>
        </header>

        {!conversationStarted ? (
          <main className="relative z-10 mx-auto grid min-h-[calc(100vh-6rem)] max-w-[1500px] grid-cols-1 px-5 pb-12 pt-8 sm:px-8 lg:grid-cols-[180px_minmax(0,1fr)_180px] lg:px-10 lg:pt-10">
            <aside className="hidden lg:flex lg:items-center">
              <ol className="space-y-10 border-l border-[#d9837f]/20 pl-7">
                {progressSteps.map((step, index) => (
                  <li className="relative text-[10px] font-semibold uppercase tracking-[0.16em] text-[#796a68]" key={step}>
                    <span className={`absolute -left-[31px] top-1.5 size-2 rounded-full ${index === 0 ? "bg-[#f18c85] shadow-[0_0_18px_#f18c85]" : "bg-[#4c4342]"}`} />
                    <span className={index === 0 ? "text-[#ef9a94]" : ""}>{step}</span>
                  </li>
                ))}
              </ol>
            </aside>

            <section className="flex min-h-[790px] flex-col items-center justify-center text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.48em] text-[#e47e78]">Klinikos Intelligence</p>
              <h1 id="public-living-title" className="mt-8 max-w-5xl text-balance text-[clamp(4rem,8vw,8.8rem)] font-light leading-[.88] tracking-[-0.055em] text-[#f8efed]">What needs<br className="hidden sm:block" /> to happen?</h1>
              <p className="mt-7 max-w-2xl text-sm leading-6 text-[#d9c2be] sm:text-base">Klinikos understands your ecosystem, connects what matters, and gets the right things moving.</p>

              <form id="living-composer" className="mt-12 w-full max-w-4xl" onSubmit={submit}>
                <div className="grid grid-cols-[minmax(0,1fr)_4.2rem] items-center gap-3 rounded-[2rem] border border-[#df9089]/35 bg-[#180b0d]/72 p-3 pl-7 shadow-[0_20px_80px_rgba(68,13,18,.35)] backdrop-blur-xl focus-within:border-[#f09a93]/70">
                  <textarea className="max-h-36 min-h-16 resize-none bg-transparent py-5 text-left text-base font-medium text-[#fff6f4] outline-none placeholder:text-[#9e7773]" id="public-klinikos-intent" onChange={(event) => setIntent(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Ask Klinikos anything..." readOnly={Boolean(activeTurn)} rows={1} value={intent} />
                  <button aria-label="Send to Klinikos" className="grid size-14 place-items-center rounded-full bg-[#e6817b] text-[#2a0b0c] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30" disabled={!intent.trim() || Boolean(activeTurn)} type="submit"><ArrowRight className="size-5 -rotate-45" /></button>
                </div>
              </form>

              <div className="-mt-5 flex flex-col items-center">
                <div className="relative grid size-24 place-items-center rounded-full border border-[#e9847f]/40 bg-[#17090c]/90 shadow-[0_0_45px_rgba(229,116,110,.32)]"><ZumiOrb size={86} state="dormant" /></div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-[#c7aaa6]">Klinikos Intelligence</p>
              </div>

              <div className="mt-10 grid w-full max-w-6xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ title, body, href, icon: Icon }) => (
                  <Link className="group rounded-2xl border border-[#d9837f]/15 bg-black/30 p-5 text-left backdrop-blur-md transition-all hover:border-[#e58b85]/35 hover:bg-[#160a0c]/65" href={href} key={title}>
                    <div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#311416] text-[#ef8c85]"><Icon className="size-4" /></span><div><h2 className="text-sm font-semibold text-[#fff6f3]">{title}</h2><p className="mt-2 text-xs leading-5 text-[#bca29e]">{body}</p><ArrowRight className="mt-4 size-4 text-[#e68c85] transition-transform group-hover:translate-x-1" /></div></div>
                  </Link>
                ))}
              </div>

              <Link href="/about" className="mt-5 grid w-full max-w-6xl gap-6 overflow-hidden rounded-2xl border border-[#d9837f]/15 bg-black/35 p-6 text-left md:grid-cols-[minmax(0,.75fr)_minmax(0,1fr)] md:items-center">
                <div className="speedster-panel min-h-40 rounded-xl border border-[#d9837f]/10" />
                <div><h2 className="text-3xl font-light tracking-[-0.04em] text-[#f8efed]">Built for speed. Designed for care.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#c2aaa6]">Klinikos helps modern healthcare teams move faster, stay organized, and deliver exceptional care.</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ef9089]">Explore Klinikos <ArrowRight className="size-4" /></span></div>
              </Link>
            </section>

            <aside className="hidden lg:flex lg:items-center lg:justify-end">
              <nav className="space-y-7" aria-label="Klinikos actions">
                {actionItems.map(({ label, href, icon: Icon }) => <Link className="flex w-24 flex-col items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#b7918d] transition-colors hover:text-[#f29a93]" href={href} key={label}><span className="grid size-12 place-items-center rounded-full border border-[#d9837f]/15 bg-black/25"><Icon className="size-4" /></span>{label}</Link>)}
              </nav>
            </aside>
          </main>
        ) : (
          <main className="relative z-10 min-h-[calc(100vh-6rem)] px-5 py-10 sm:px-8 sm:py-14">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 flex items-end justify-between gap-5 border-b border-[#d9837f]/15 pb-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#e47e78]">Living thread</p><h1 className="mt-2 text-2xl font-light tracking-[-0.03em]">The work stays in one place.</h1></div><Link className="text-[10px] uppercase tracking-[0.2em] text-[#c3a29e] hover:text-[#ee918b]" href="/login">Sign in</Link></div>
              <ol className="space-y-16">{turns.map((turn, index) => { const currentStageIndex = stageIndex(turn.stage); return <li className="grid gap-6 sm:grid-cols-[5rem_minmax(0,1fr)]" key={turn.id}><div className="hidden border-r border-[#d9837f]/15 pr-5 text-right sm:block"><p className="text-[10px] font-semibold text-[#927b78]">{String(index + 1).padStart(2, "0")}</p><p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#927b78]">You</p></div><div><blockquote className="text-balance text-3xl font-light leading-tight tracking-[-0.03em] sm:text-4xl">{turn.prompt}</blockquote><div className="mt-8 grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-5 border-y border-[#d9837f]/15 py-5"><ZumiOrb size={68} state={orbState(turn.stage)} /><ol className="grid gap-3 sm:grid-cols-4">{progressSteps.map((step, stepIndex) => <li className="flex items-center gap-2" key={step}><span className={`h-px w-4 ${stepIndex <= currentStageIndex ? "bg-[#e6817b]" : "bg-[#5e4b49]"}`} /><span className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${stepIndex <= currentStageIndex ? "text-[#f0d9d5]" : "text-[#7e6a67]"}`}>{step}</span></li>)}</ol></div>{turn.resolution ? <article className="mt-8 border-l border-[#e6817b] pl-6"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e6817b]">Klinikos Intelligence</p><h2 className="mt-3 text-2xl font-light tracking-[-0.03em]">{turn.resolution.title}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#c8adaa]">{turn.resolution.body}</p>{turn.resolution.destination ? <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#ec8e88]" href={turn.resolution.destination.href}>{turn.resolution.destination.action}<ArrowRight className="size-4" /></Link> : null}</article> : null}</div></li>; })}</ol>
              <div ref={threadEnd} />
            </div>
          </main>
        )}

        {conversationStarted ? <form className="sticky bottom-0 z-30 border-t border-[#d9837f]/15 bg-[#090405]/92 px-5 py-5 backdrop-blur-xl sm:px-8" onSubmit={submit}><div className="mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)_3.5rem] items-end gap-4"><textarea className="max-h-36 min-h-14 resize-none rounded-xl border border-[#d9837f]/20 bg-[#14090b]/85 px-4 py-4 text-base text-[#fff5f2] outline-none placeholder:text-[#8f7470] focus:border-[#e6817b]/60" onChange={(event) => setIntent(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Continue the thread..." readOnly={Boolean(activeTurn)} rows={1} value={intent} /><button className="grid size-14 place-items-center rounded-full bg-[#e6817b] text-[#2a0b0c] disabled:opacity-30" disabled={!intent.trim() || Boolean(activeTurn)} type="submit" aria-label="Send to Klinikos"><ArrowRight className="size-5" /></button></div><div className="mx-auto mt-2 flex max-w-4xl justify-between text-[10px] text-[#8f7470]"><p>{activeTurn ? statusLabel(activeTurn.stage) : "Klinikos keeps permissions and consequential actions governed underneath."}</p><p className="hidden items-center gap-2 sm:flex"><CornerDownLeft className="size-3" /> Enter to send · Shift + Enter for a new line</p></div></form> : null}
      </section>
    </>
  );
}
