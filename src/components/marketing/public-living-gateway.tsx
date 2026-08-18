"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  Building2,
  GraduationCap,
  HeartPulse,
  Menu,
  Network,
  Paperclip,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ZumiOrb } from "@/components/ds";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import {
  resolvePublicLivingIntent,
  type PublicLivingDestination,
  type PublicLivingResolution,
} from "@/lib/orchestration/public-living-intent";

type ConversationTurn = {
  id: number;
  prompt: string;
  resolution: PublicLivingResolution;
};

type WorkspaceAction = { label: string; href: string };

const protectedHref = (href: string) => `/login?next=${encodeURIComponent(href)}`;
const publicActionPaths = new Set(["/grid", "/edu", "/pricing", "/trust", "/ecosystem", "/how-it-works", "/founding-clinic", "/sales"]);

function destinationActionHref(href: string) {
  if (href === "/portal") return "/portal/login";
  if (publicActionPaths.has(href)) return href;
  return protectedHref(href);
}

const navItems = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Grid", href: "/grid" },
  { label: "EDU", href: "/edu" },
  { label: "Pricing", href: "/pricing" },
  { label: "Trust", href: "/trust" },
] as const;

const actionItems = [
  { label: "Clinic", href: "/founding-clinic", icon: Building2 },
  { label: "Grid", href: "/grid", icon: Network },
  { label: "Patient", href: "/portal/login", icon: UserRound },
  { label: "EDU", href: "/edu", icon: GraduationCap },
] as const;

const cards = [
  {
    title: "Run the daily operation",
    body: "Keep tasks, follow-up, schedules, and ownership visible instead of scattered across tools.",
    href: protectedHref("/tasks"),
    icon: HeartPulse,
  },
  {
    title: "Recover revenue",
    body: "Turn recorded missed follow-up and open commercial work into accountable next actions.",
    href: protectedHref("/crm"),
    icon: BarChart3,
  },
  {
    title: "Find real capacity",
    body: "Use Grid to discover reviewed people, space, services, equipment, education, and other healthcare capacity.",
    href: "/grid",
    icon: Network,
  },
  {
    title: "Understand the clinic path",
    body: "See pricing, implementation gates, and what must be true before a clinic moves into production use.",
    href: "/founding-clinic",
    icon: ReceiptText,
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

export function PublicLivingGateway() {
  const [intent, setIntent] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const nextTurnId = useRef(1);
  const threadEnd = useRef<HTMLDivElement>(null);
  const conversationStarted = turns.length > 0;
  const latestTurn = turns[turns.length - 1] ?? null;

  const liveStatus = latestTurn
    ? `Route ready. ${latestTurn.resolution.title}${latestTurn.resolution.destination ? ` Next action: ${latestTurn.resolution.destination.action}.` : ""}`
    : "Public routing preview ready.";

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    threadEnd.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
  }, [turns.length]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = intent.trim();
    if (!prompt) return;

    const priorResolution = turns[turns.length - 1]?.resolution ?? null;
    const resolution = resolvePublicLivingIntent(prompt, priorResolution);
    const id = nextTurnId.current;
    nextTurnId.current += 1;

    setTurns((current) => [...current, { id, prompt, resolution }]);
    setIntent("");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <>
      <div className="sr-only" aria-live="polite" role="status">{liveStatus}</div>
      <section className="rose-home min-h-screen overflow-hidden bg-[#050303] text-[#f8f0ee]" aria-labelledby="public-living-title">
        <div className="rose-vignette pointer-events-none fixed inset-0 -z-10" />
        <div className={`rose-atmosphere pointer-events-none fixed inset-0 -z-10 transition-all duration-700 ${conversationStarted ? "scale-[1.03] opacity-25" : "scale-100 opacity-100"}`} />

        <header className="reference-header relative z-30 flex min-h-[102px] items-center px-5 sm:px-9 lg:px-[38px]">
          <KlinikosWordmark
            className="living-home-brand gap-[18px]"
            frameClassName="size-[74px]"
            href="/"
            framed
            inverse
            markClassName="h-full w-full"
            textClassName="h-[44px] w-[314px]"
          />

          <nav className="mx-auto hidden items-center gap-9 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d8c7c4] lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <Link className="transition-colors hover:text-[#f29a93]" href={item.href} key={item.label}>{item.label}</Link>
            ))}
          </nav>

          <details className="relative ml-auto lg:hidden">
            <summary className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-full border border-[#d9837f]/25 bg-[#140a0c]/75 text-[#f6dfdc] [&::-webkit-details-marker]:hidden" aria-label="Open navigation menu">
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <nav className="absolute right-0 top-14 z-50 grid w-56 gap-1 rounded-2xl border border-[#d9837f]/22 bg-[#12090b]/[.98] p-2 shadow-2xl" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link className="rounded-xl px-4 py-3 text-xs font-semibold text-[#ead8d4] hover:bg-white/5 hover:text-white" href={item.href} key={item.label}>{item.label}</Link>
              ))}
              <Link className="rounded-xl px-4 py-3 text-xs font-semibold text-[#efaaa1] hover:bg-white/5" href="/login">Sign in</Link>
            </nav>
          </details>

          <Link className="reference-auth ml-3 hidden size-14 place-items-center rounded-full border border-[#d9837f]/25 bg-[#140a0c]/75 text-[9px] font-bold uppercase tracking-[0.14em] text-[#f6dfdc] shadow-[0_0_24px_rgba(211,112,108,.08)] sm:grid" href="/login" aria-label="Sign in">
            Sign in
          </Link>
        </header>

        {!conversationStarted ? (
          <main className="reference-home relative z-10 mx-auto grid min-h-[calc(100vh-102px)] max-w-[1402px] grid-cols-1 px-5 pb-8 sm:px-9 lg:grid-cols-[150px_minmax(0,1fr)_150px] lg:grid-rows-[627px_auto] lg:px-[54px] lg:pb-[43px]">
            <aside className="reference-state-rail hidden items-start lg:flex">
              <ol className="w-full border-l border-[#c7807b]/22 pl-7" aria-label="Public preview steps">
                {["Describe", "Route", "Continue"].map((step, index) => (
                  <li className="relative text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a817c]" key={step}>
                    <span className={`absolute -left-[31px] top-1.5 size-[7px] rounded-full ${index === 0 ? "bg-[#f08c85] shadow-[0_0_17px_#f08c85]" : "bg-[#8f7773]"}`} aria-hidden="true" />
                    {step}
                  </li>
                ))}
              </ol>
            </aside>

            <section className="reference-center flex flex-col items-center text-center">
              <div className="reference-hero flex w-full flex-col items-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#e88f88]">Healthcare operating ecosystem</p>
                <h1 id="public-living-title" className="mt-8 max-w-[760px] text-balance text-[clamp(3.6rem,7.7vw,7.7rem)] font-extralight leading-[0.87] tracking-[-0.065em] text-[#f5edeb]">
                  What needs<br />to happen?
                </h1>
                <p className="mt-7 max-w-[650px] text-sm leading-7 text-[#d9c4c0] sm:text-[15px]">
                  One operating layer for clinic workflow, follow-up, revenue, healthcare capacity, learning, and care navigation — organized around the next accountable action.
                </p>

                <form id="living-composer" className="mt-9 w-full max-w-[770px]" onSubmit={submit}>
                  <label className="sr-only" htmlFor="public-klinikos-intent">Describe what you need Klinikos to route</label>
                  <div className="reference-composer-shell relative grid min-h-[112px] grid-cols-[3rem_minmax(0,1fr)_3.8rem] items-center gap-3 rounded-[31px] border border-[#d9918a]/35 bg-[#1b0d10]/68 px-5 py-3 shadow-[0_22px_70px_rgba(59,8,12,.38)] backdrop-blur-xl focus-within:border-[#ec9b94]/65">
                    <Link href={protectedHref("/documents")} className="grid size-10 place-items-center rounded-full text-[#cda39e] transition-colors hover:text-[#f2a19a]" aria-label="Open documents after sign in">
                      <Paperclip className="size-5" aria-hidden="true" />
                    </Link>
                    <textarea
                      aria-describedby="public-routing-disclosure"
                      className="max-h-36 min-h-16 resize-none bg-transparent py-5 text-left text-[15px] font-medium text-[#fff6f4] outline-none placeholder:text-[#b99a95]"
                      id="public-klinikos-intent"
                      onChange={(event) => setIntent(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Describe the outcome you need..."
                      rows={1}
                      value={intent}
                    />
                    <button aria-label="Route this request" className="grid size-12 place-items-center rounded-full bg-[#e6817b] text-[#1a090a] shadow-[0_0_28px_rgba(230,129,123,.22)] transition hover:bg-[#efaaa1] disabled:cursor-not-allowed disabled:opacity-45" disabled={!intent.trim()} type="submit">
                      <ArrowUp className="size-5" aria-hidden="true" />
                    </button>
                    <div className="reference-zumi absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5" aria-hidden="true">
                      <span className="reference-zumi-orb" data-zumi-state="observing">
                        <span className="reference-zumi-state-layer"><ZumiOrb state="observing" size={96} /></span>
                        <span className="reference-zumi-core">zumi</span>
                        <span className="reference-zumi-signal" />
                      </span>
                      <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-[#a98d88]">Public routing preview</span>
                    </div>
                  </div>
                  <p className="mx-auto mt-4 max-w-[700px] text-[11px] leading-5 text-[#ad928d]" id="public-routing-disclosure">
                    This public preview uses deterministic routing rules in your browser. It is not a model conversation, does not open records or perform work, and should not contain patient names, records, diagnoses, or other PHI.
                  </p>
                </form>
              </div>
            </section>

            <aside className="reference-action-rail hidden items-start justify-end lg:flex">
              <nav aria-label="Public entry points">
                {actionItems.map(({ label, href, icon: Icon }) => (
                  <Link className="group flex flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a817c]" href={href} key={label}>
                    <span className="grid size-12 place-items-center rounded-full border border-[#d0837d]/16 bg-[#100708]/52 text-[#b79a95] transition group-hover:border-[#e6817b]/30 group-hover:text-[#e6817b]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="transition-colors group-hover:text-[#e6817b]">{label}</span>
                  </Link>
                ))}
              </nav>
            </aside>

            <section className="reference-bottom-grid lg:col-span-3" aria-labelledby="buyer-proof-heading">
              <h2 className="sr-only" id="buyer-proof-heading">Ways Klinikos can help</h2>
              <div className="reference-card-row grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(({ title, body, href, icon: Icon }) => (
                  <Link className="reference-card group grid min-h-[132px] grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-[18px] border border-[#d0837d]/16 bg-[#100708]/64 p-4 text-left backdrop-blur-sm transition hover:border-[#e6817b]/30 hover:bg-[#170b0d]/76" href={href} key={title}>
                    <span className="grid size-10 place-items-center rounded-[10px] bg-[#2a1114]/70 text-[#e29790] shadow-[0_0_24px_rgba(222,116,109,.08)]"><Icon className="size-[18px]" aria-hidden="true" /></span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold tracking-[-.03em] text-[#f6ece9]">{title}</span>
                      <span className="mt-2 text-[11px] leading-[1.7] text-[#ad928d]">{body}</span>
                      <ArrowRight className="mt-auto size-3.5 text-[#d7928b] transition group-hover:translate-x-1 group-hover:text-[#efaaa1]" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center rounded-[22px] border border-[#d0837d]/16 bg-[#0d0607]/82 px-6 py-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#efaaa1]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#f7ece9]">Proof before promises.</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#ad928d]">See what is built, what still needs external verification, and what Klinikos will not claim yet.</p>
                  </div>
                </div>
                <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d0837d]/24 px-5 text-xs font-semibold text-[#f4e8e5] hover:border-[#efaaa1]/45" href="/trust">Trust & readiness <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
              </div>
            </section>
          </main>
        ) : (
          <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-8 sm:px-9 lg:px-10">
            <section className="space-y-10" aria-label="Public routing conversation">
              {turns.map((turn) => {
                const resolution = turn.resolution;
                const actions = resolution.destination ? workspaceActions[resolution.destination.key] : [];
                return (
                  <article className="space-y-5" key={turn.id}>
                    <p className="ml-auto max-w-2xl rounded-[24px] border border-[#d0837d]/16 bg-[#13090b]/76 px-5 py-4 text-sm leading-6 text-[#f7ece9]">{turn.prompt}</p>
                    <div className="rounded-[26px] border border-[#d0837d]/16 bg-[#0f0708]/76 p-6 backdrop-blur-xl">
                      <div className="flex items-center gap-4">
                        <ZumiOrb state="resolved" size={52} />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#efaaa1]">Deterministic public route</p>
                          <p className="mt-1 text-[10px] text-[#9a817c]">No records opened · no action executed</p>
                        </div>
                      </div>
                      <div className="mt-6">
                        <h2 className="text-2xl font-light tracking-[-.04em] text-[#f8efed]">{resolution.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-[#bea39e]">{resolution.body}</p>
                        {resolution.assumption && <p className="mt-4 border-l border-[#e6817b]/40 pl-4 text-xs leading-6 text-[#ad928d]">Assumption: {resolution.assumption}</p>}
                        {actions.length > 0 && (
                          <div className="mt-6 flex flex-wrap gap-3">
                            {actions.map((action) => (
                              <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d0837d]/20 bg-[#15090b] px-4 text-xs font-semibold text-[#f4e8e5] hover:border-[#e6817b]/40" href={destinationActionHref(action.href)} key={action.href}>
                                {action.label}<ArrowRight className="size-3.5" aria-hidden="true" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              <div ref={threadEnd} />
            </section>

            <form className="sticky bottom-4 mt-10 rounded-[24px] border border-[#d0837d]/22 bg-[#12090b]/95 p-3 shadow-2xl backdrop-blur-xl" onSubmit={submit}>
              <label className="sr-only" htmlFor="public-klinikos-follow-up">Refine your routing request</label>
              <div className="flex items-end gap-3">
                <textarea aria-describedby="public-follow-up-note" className="min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-[#fff6f4] outline-none placeholder:text-[#b99a95]" id="public-klinikos-follow-up" onChange={(event) => setIntent(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Refine the goal or add a constraint..." rows={1} value={intent} />
                <button aria-label="Route follow-up" className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e6817b] text-[#1a090a] disabled:opacity-45" disabled={!intent.trim()} type="submit"><ArrowUp className="size-4" aria-hidden="true" /></button>
              </div>
              <p className="sr-only" id="public-follow-up-note">This remains a deterministic public routing preview and does not execute work.</p>
            </form>
          </main>
        )}
      </section>
    </>
  );
}
