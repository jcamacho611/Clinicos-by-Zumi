"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, Blocks, Boxes, BriefcaseMedical, Calculator, CalendarDays, ChartNoAxesCombined, CircleDollarSign, Gauge,
  AudioLines, BookOpenCheck, ClipboardCheck, ClipboardList, ClipboardPlus, Files, Fingerprint, FlaskConical, Headphones, HeartHandshake,
  LayoutDashboard, ListChecks, LockKeyhole, LogOut, Menu, MessagesSquare, MonitorSmartphone,
  Network, Orbit, Pill, ReceiptText, Route, ScanLine, ScanSearch, Search, Settings2, ShieldCheck, Siren, Sparkles,
  Stethoscope, Users, Video, X, Waypoints,
} from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { VoiceInputButton } from "@/components/clinic/voice-input";
import { ZumiPresence } from "@/components/clinic/zumi-presence";
import { Button } from "@/components/ui/button";
import { workspaceMeta } from "@/lib/navigation";
import {
  exploreNavigationForRole,
  klinikosPromptForWorkspace,
  primaryNavigationForRole,
} from "@/lib/navigation-experience";
import { roleLabel } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const icons = {
  Activity, LayoutDashboard, Headphones, Stethoscope, Users, CalendarDays, ClipboardPlus, Video,
  FlaskConical, ScanLine, Pill, Files, ClipboardList, ReceiptText, ShieldCheck, BriefcaseMedical,
  ChartNoAxesCombined, CircleDollarSign, Calculator, MessagesSquare, ListChecks, Siren, Sparkles, MonitorSmartphone,
  Blocks, Boxes, Settings2, Gauge, Network, Orbit, Route, HeartHandshake, Fingerprint, ClipboardCheck,
  AudioLines, BookOpenCheck, LockKeyhole, ScanSearch, Waypoints,
};

type IconName = keyof typeof icons;

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function SidebarLink({ active, href, icon: iconName, label, onNavigate }: {
  active: boolean;
  href: string;
  icon: IconName;
  label: string;
  onNavigate?: () => void;
}) {
  const Icon = icons[iconName];
  return (
    <Link
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] font-semibold transition duration-200",
        active
          ? "border border-[#e6817b]/18 bg-[#e6817b]/[.09] text-[#fff8f6] shadow-[0_0_28px_rgba(230,129,123,.05)]"
          : "border border-transparent text-[#b89f9b] hover:border-[#e6817b]/10 hover:bg-[#e6817b]/[.045] hover:text-[#f8efed]",
      )}
      href={href}
      onClick={onNavigate}
    >
      <Icon aria-hidden="true" className={cn("size-[17px]", active ? "text-[#e6817b]" : "text-[#866d69] group-hover:text-[#e6817b]")} strokeWidth={1.65} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}

function Sidebar({
  onNavigate,
  onExplore,
  session,
}: {
  onNavigate?: () => void;
  onExplore: () => void;
  session: ClinicSession;
}) {
  const pathname = usePathname();
  const primaryNavigation = primaryNavigationForRole(session.role);

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-[#e28b85]/12 bg-[#070304]/98 text-[#f8efed] shadow-[20px_0_70px_rgba(0,0,0,.28)]">
      <div className="flex h-[88px] items-center px-5">
        <KlinikosWordmark href="/dashboard" framed inverse markClassName="h-7 w-7" textClassName="h-[20px] w-auto" className="gap-3" />
      </div>

      <div className="mx-4 px-1 py-3">
        <p className="truncate text-xs font-semibold text-[#f8efed]">{session.organizationName}</p>
        <p className="mt-1 text-[11px] text-[#8f7773]">{roleLabel(session.role)}</p>
      </div>

      <nav className="mt-2 flex-1 px-3" aria-label="Primary Klinikos navigation">
        <div className="space-y-1 border-y border-[#e28b85]/10 py-4">
          {primaryNavigation.map((item) => (
            <SidebarLink
              active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))}
              href={item.href}
              icon={item.icon as IconName}
              key={item.href}
              label={item.label}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <button
          className="mt-4 flex min-h-11 w-full items-center gap-3 rounded-[14px] border border-transparent px-3 text-left text-[13px] font-semibold text-[#9f8985] transition hover:border-[#e6817b]/10 hover:bg-[#e6817b]/[.045] hover:text-[#f8efed]"
          onClick={() => {
            onNavigate?.();
            onExplore();
          }}
          type="button"
        >
          <Search aria-hidden="true" className="size-[17px] text-[#806965]" />
          <span className="flex-1">Explore Klinikos</span>
          <span className="text-[11px] font-medium text-[#8d7572]">⌘K</span>
        </button>
      </nav>

      <div className="border-t border-[#e28b85]/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-[#efaaa1]/18 bg-[#e6817b]/[.06] text-xs font-semibold text-[#f8efed]">{initials(session.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#f8efed]">{session.name}</p>
            <Link className="mt-1 block text-[11px] text-[#8f7773] hover:text-[#efaaa1]" href="/settings" onClick={onNavigate}>Profile & settings</Link>
          </div>
        </div>
        <form action="/api/auth/logout" className="mt-3" method="post">
          <button className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#e6817b]/10 bg-[#0d0608] px-3 text-[11px] font-semibold text-[#9f8985] transition hover:border-[#e6817b]/22 hover:bg-[#e6817b]/[.07] hover:text-[#fff8f6]" type="submit"><LogOut className="size-4" />Sign out</button>
        </form>
      </div>
    </aside>
  );
}

function ExploreKlinikos({
  onClose,
  session,
}: {
  onClose: () => void;
  session: ClinicSession;
}) {
  const [query, setQuery] = useState("");
  const primaryHrefs = useMemo(
    () => new Set(primaryNavigationForRole(session.role).map((item) => item.href)),
    [session.role],
  );
  const groups = useMemo(() => exploreNavigationForRole(session.role, primaryHrefs), [session.role, primaryHrefs]);
  const normalized = query.trim().toLowerCase();
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !normalized || `${group.label} ${item.label} ${item.description}`.toLowerCase().includes(normalized)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-start bg-[#030203]/80 px-4 py-[8vh] backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Explore Klinikos">
      <button aria-label="Close Explore Klinikos" className="absolute inset-0 cursor-default" onClick={onClose} type="button" />
      <section className="relative mx-auto flex max-h-[84vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-[#e6817b]/16 bg-[#0a0506] shadow-[0_32px_120px_rgba(0,0,0,.62)]">
        <div className="flex items-center gap-3 border-b border-[#e6817b]/12 px-5 py-4 sm:px-6">
          <Search aria-hidden="true" className="size-5 text-[#e6817b]" />
          <input
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-base text-[#fff8f6] outline-none placeholder:text-[#78625f]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find what you need…"
            value={query}
          />
          <button aria-label="Close" className="grid size-9 place-items-center rounded-full text-[#8f7773] hover:bg-[#e6817b]/[.08] hover:text-[#f8efed]" onClick={onClose} type="button"><X className="size-4" /></button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {filteredGroups.length ? (
            <div className="space-y-7">
              {filteredGroups.map((group) => (
                <section key={group.label}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#806965]">{group.label}</p>
                  <div className="divide-y divide-[#e6817b]/10">
                    {group.items.map((item) => {
                      const Icon = icons[item.icon as IconName];
                      return (
                        <Link className="group flex min-h-16 items-center gap-4 py-3" href={item.href} key={item.href} onClick={onClose}>
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e6817b]/[.06] text-[#c58d88] group-hover:text-[#efaaa1]">{Icon ? <Icon className="size-4" /> : null}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-[#f8efed]">{item.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-[#8f7773]">{item.description}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center">
              <p className="text-sm font-semibold text-[#f8efed]">Nothing matches that phrase.</p>
              <p className="mt-2 text-xs leading-5 text-[#8f7773]">Close this and ask Zumi what you want to accomplish.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function AppShell({ children, session }: { children: React.ReactNode; session: ClinicSession }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [zumiPrompt, setZumiPrompt] = useState("");
  const slug = pathname.split("/").filter(Boolean)[0] || "dashboard";
  const meta = workspaceMeta[slug] ?? workspaceMeta.dashboard;
  const networkMode = ["grid", "network", "referrals", "access-controls", "identity-resolution", "care-teams", "capacity-exchange", "injury-episodes", "health-passport", "intake-passport"].includes(slug);
  const designMode = networkMode ? "network" : session.organizationSlug === "luxe-medi" ? "luxe" : "medical";
  const expandedZumiConversation = pathname === "/zumi";
  const promptPlaceholder = klinikosPromptForWorkspace(slug);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setExploreOpen((current) => !current);
      }
      if (event.key === "Escape") setExploreOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function sendToZumi(question?: string, voice = false) {
    if (typeof window === "undefined" || expandedZumiConversation) return;
    if (question?.trim()) {
      window.dispatchEvent(new CustomEvent("zumi:prompt", { detail: { question: question.trim(), voice } }));
    } else {
      window.dispatchEvent(new Event("zumi:open"));
    }
  }

  function submitZumi(event: FormEvent) {
    event.preventDefault();
    const question = zumiPrompt.trim();
    if (expandedZumiConversation) return;
    if (!question) {
      sendToZumi();
      return;
    }
    setZumiPrompt("");
    sendToZumi(question);
  }

  function sendOrFocusZumi() {
    const question = zumiPrompt.trim();
    if (expandedZumiConversation) return;
    if (!question) {
      sendToZumi();
      return;
    }
    setZumiPrompt("");
    sendToZumi(question);
  }

  const shellControlLabel = zumiPrompt.trim() ? "Send message to Zumi" : "Open Zumi assistant";

  return (
    <div className="klinikos-platform min-h-screen bg-[var(--mode-background)] text-[var(--k-text)] transition-colors duration-500" data-clinic-mode={designMode} data-klinikos-ds>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_72%_0%,rgba(150,41,48,.14),transparent_28%),radial-gradient(circle_at_20%_85%,rgba(230,129,123,.035),transparent_28%)]" />
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block"><Sidebar onExplore={() => setExploreOpen(true)} session={session} /></div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#050303]/82 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[270px] shadow-2xl"><Sidebar onExplore={() => setExploreOpen(true)} onNavigate={() => setMobileOpen(false)} session={session} /></div>
          <button className="absolute left-[282px] top-4 grid size-10 place-items-center rounded-full border border-[#efaaa1]/15 bg-[#0c0607] text-[#f8efed] shadow-xl" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
        </div>
      ) : null}

      <div className="relative lg:pl-[240px]">
        <header className="sticky top-0 z-30 flex h-[78px] items-center gap-4 border-b border-[#e28b85]/10 bg-[color:var(--mode-header)] px-4 backdrop-blur-2xl transition-colors duration-500 sm:px-7 lg:px-10">
          <Button className="border-[#e28b85]/15 bg-transparent text-[#f8efed] lg:hidden" size="icon" variant="secondary" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#b9837e]">{meta.eyebrow}</p>
            <h1 className="truncate text-xl font-light tracking-[-.035em] text-[#f8efed]">{meta.title}</h1>
          </div>

          {!expandedZumiConversation ? (
            <form className="ml-auto hidden w-full max-w-[520px] items-center gap-2 rounded-full border border-[#e28b85]/14 bg-[#12090b]/58 px-4 py-2 md:flex" onSubmit={submitZumi}>
              <span className="shrink-0 text-[11px] font-semibold text-[#c58d88]">Zumi</span>
              <input
                aria-label="Message Zumi"
                className="min-w-0 flex-1 bg-transparent text-xs text-[#f8efed] outline-none placeholder:text-[#806965]"
                onChange={(event) => setZumiPrompt(event.target.value)}
                placeholder={promptPlaceholder}
                value={zumiPrompt}
              />
              <VoiceInputButton className="[&_button]:h-7 [&_button]:border-[#e28b85]/12 [&_button]:bg-transparent [&_button]:px-2 [&_button]:text-[12px] [&_button]:text-[#d8c1bd]" onTranscript={(transcript) => { setZumiPrompt(""); sendToZumi(transcript, true); }} />
              <button
                aria-controls="zumi-presence-panel"
                aria-haspopup="dialog"
                aria-label={shellControlLabel}
                className="relative grid size-8 place-items-center rounded-full border border-[#e6817b]/18 bg-[#16090c] transition hover:border-[#efaaa1]/40 hover:bg-[#241014] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6817b]"
                title={`${shellControlLabel} · Ctrl/Cmd+J`}
                type="submit"
              >
                <span className="absolute inset-1 rounded-full border border-[#e6817b]/10" />
                <img alt="" className="relative h-5 w-5 object-contain" src="/klinikos-orbital-k-production.png" />
              </button>
            </form>
          ) : <div className="ml-auto hidden text-[11px] font-semibold uppercase tracking-[.15em] text-[#806965] md:block">Zumi conversation</div>}

          <div className="flex items-center gap-2">
            {!expandedZumiConversation ? (
              <Button
                aria-controls="zumi-presence-panel"
                aria-haspopup="dialog"
                aria-label={shellControlLabel}
                className="gap-2 border-[#e28b85]/18 bg-[#e6817b]/[.08] px-3 text-[#efaaa1] hover:bg-[#e6817b]/14 hover:text-[#fff8f6] md:hidden"
                onClick={sendOrFocusZumi}
                title={`${shellControlLabel} · Ctrl/Cmd+J`}
                type="button"
                variant="secondary"
              >
                <span className="relative grid size-6 place-items-center rounded-full border border-[#e6817b]/18 bg-[#16090c]">
                  <img alt="" className="h-4 w-4 object-contain" src="/klinikos-orbital-k-production.png" />
                </span>
                <span className="hidden text-xs font-semibold sm:inline">Zumi</span>
              </Button>
            ) : null}
            <Button asChild className="relative hidden border-[#e28b85]/14 bg-[#12090b]/40 text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed] sm:inline-flex" size="icon" variant="secondary"><Link aria-label="Open action center" href="/action-center" title="Open action center"><Bell className="size-4" /></Link></Button>
          </div>
        </header>

        <main className={cn("klinikos-workspace mx-auto w-full max-w-[1680px] text-[var(--k-text)]", expandedZumiConversation ? "px-4 py-4 sm:px-7 sm:py-7 lg:px-10 lg:py-10 xl:px-14 xl:py-14" : "px-4 py-8 sm:px-7 sm:py-10 lg:px-10 lg:py-12 xl:px-14")}>{children}</main>
      </div>

      {exploreOpen ? <ExploreKlinikos onClose={() => setExploreOpen(false)} session={session} /> : null}
      <ZumiPresence userName={session.name} />
    </div>
  );
}