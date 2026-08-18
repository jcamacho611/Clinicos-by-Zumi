"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  Activity, Bell, Blocks, Boxes, BriefcaseMedical, Calculator, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleDollarSign, Gauge,
  AudioLines, BookOpenCheck, ClipboardCheck, ClipboardList, ClipboardPlus, Files, Fingerprint, FlaskConical, Headphones, HeartHandshake,
  LayoutDashboard, ListChecks, LockKeyhole, LogOut, Menu, MessagesSquare, MonitorSmartphone,
  Network, Orbit, Pill, ReceiptText, Route, ScanLine, ScanSearch, Settings2, ShieldCheck, Siren, Sparkles,
  Stethoscope, Users, Video, X, Waypoints,
} from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { VoiceInputButton } from "@/components/clinic/voice-input";
import { ZumiPresence } from "@/components/clinic/zumi-presence";
import { Button } from "@/components/ui/button";
import { navigation, workspaceMeta } from "@/lib/navigation";
import { can, roleLabel } from "@/lib/auth/rbac";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import type { ClinicSession } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const icons = {
  Activity, LayoutDashboard, Headphones, Stethoscope, Users, CalendarDays, ClipboardPlus, Video,
  FlaskConical, ScanLine, Pill, Files, ClipboardList, ReceiptText, ShieldCheck, BriefcaseMedical,
  ChartNoAxesCombined, CircleDollarSign, Calculator, MessagesSquare, ListChecks, Siren, Sparkles, MonitorSmartphone,
  Blocks, Boxes, Settings2, Gauge, Network, Orbit, Route, HeartHandshake, Fingerprint, ClipboardCheck,
  AudioLines, BookOpenCheck, LockKeyhole, ScanSearch, Waypoints,
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function isVisibleDestination(role: ClinicSession["role"], href: string) {
  if (href === "/edu") return true;
  if (href === "/zumi") return can(role, "ai", "read");
  return canAccessWorkspace(role, href.slice(1));
}

function SidebarLink({ active, href, icon: iconName, label, onNavigate }: {
  active: boolean;
  href: string;
  icon: keyof typeof icons;
  label: string;
  onNavigate?: () => void;
}) {
  const Icon = icons[iconName];
  return (
    <Link
      className={cn(
        "group flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[12px] font-semibold transition duration-200",
        active
          ? "border border-[#e6817b]/18 bg-[#e6817b]/[.09] text-[#fff8f6] shadow-[0_0_28px_rgba(230,129,123,.05)]"
          : "border border-transparent text-[#b89f9b] hover:border-[#e6817b]/10 hover:bg-[#e6817b]/[.045] hover:text-[#f8efed]",
      )}
      href={href}
      onClick={onNavigate}
    >
      <Icon className={cn("size-[17px]", active ? "text-[#e6817b]" : "text-[#866d69] group-hover:text-[#e6817b]")} strokeWidth={1.65} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}

function Sidebar({ onNavigate, session }: { onNavigate?: () => void; session: ClinicSession }) {
  const pathname = usePathname();
  const visibleNavigation = navigation
    .map((group) => ({ ...group, items: group.items.filter((item) => isVisibleDestination(session.role, item.href)) }))
    .filter((group) => group.items.length > 0);
  const homeGroup = visibleNavigation.find((group) => group.label === "Home");
  const deeperGroups = visibleNavigation.filter((group) => group.label !== "Home");

  return (
    <aside className="flex h-full w-[264px] flex-col border-r border-[#e28b85]/12 bg-[#070304]/98 text-[#f8efed] shadow-[20px_0_70px_rgba(0,0,0,.28)]">
      <div className="flex h-[88px] items-center px-5">
        <KlinikosWordmark href="/dashboard" framed inverse markClassName="h-7 w-7" textClassName="h-[20px] w-auto" className="gap-3" />
      </div>

      <div className="mx-4 rounded-[16px] border border-[#e28b85]/10 bg-[#12090b]/65 px-4 py-3">
        <p className="truncate text-xs font-semibold text-[#f8efed]">{session.organizationName}</p>
        <p className="mt-1 text-[10px] text-[#9f8985]">{roleLabel(session.role)}</p>
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-8" aria-label="Klinikos workspace navigation">
        <div className="border-y border-[#e28b85]/10 py-3">
          <SidebarLink active={pathname === "/dashboard"} href="/dashboard" icon="LayoutDashboard" label="Home" onNavigate={onNavigate} />
          {homeGroup?.items.filter((item) => item.href !== "/dashboard").map((item) => (
            <SidebarLink
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              href={item.href}
              icon={item.icon}
              key={item.href}
              label={item.label}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className="mt-4 space-y-1">
          {deeperGroups.map((group) => {
            const groupActive = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
            return (
              <details className="group/nav" open={groupActive ? true : undefined} key={group.label}>
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#8f7773] transition hover:bg-[#e6817b]/[.04] hover:text-[#d8c1bd] marker:hidden">
                  <span>{group.label}</span>
                  <span className="ml-auto text-[9px] text-[#6f5b58]">{group.items.length}</span>
                  <ChevronDown className="size-3.5 text-[#725d59] transition group-open/nav:rotate-180" />
                </summary>
                <div className="mt-1 space-y-0.5 border-l border-[#e28b85]/10 pl-2">
                  {group.items.map((item) => (
                    <SidebarLink
                      active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      href={item.href}
                      icon={item.icon}
                      key={item.href}
                      label={item.label}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[#e28b85]/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-[#efaaa1]/18 bg-[#e6817b]/[.06] text-xs font-semibold text-[#f8efed]">{initials(session.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#f8efed]">{session.name}</p>
            <Link className="mt-1 block text-[10px] text-[#8f7773] hover:text-[#efaaa1]" href="/settings" onClick={onNavigate}>Profile, security & appearance</Link>
          </div>
        </div>
        <form action="/api/auth/logout" className="mt-3" method="post">
          <button className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#e6817b]/10 bg-[#0d0608] px-3 text-[11px] font-semibold text-[#9f8985] transition hover:border-[#e6817b]/22 hover:bg-[#e6817b]/[.07] hover:text-[#fff8f6]" type="submit"><LogOut className="size-4" />Sign out</button>
        </form>
      </div>
    </aside>
  );
}

export function AppShell({ children, session }: { children: React.ReactNode; session: ClinicSession }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [zumiPrompt, setZumiPrompt] = useState("");
  const slug = pathname.split("/").filter(Boolean)[0] || "dashboard";
  const meta = workspaceMeta[slug] ?? workspaceMeta.dashboard;
  const networkMode = ["grid", "network", "referrals", "access-controls", "identity-resolution", "care-teams", "capacity-exchange", "injury-episodes", "health-passport", "intake-passport"].includes(slug);
  const designMode = networkMode ? "network" : session.organizationSlug === "luxe-medi" ? "luxe" : "medical";
  const dedicatedZumiBrowser = pathname === "/zumi";

  function summonZumi(question?: string, voice = false) {
    if (typeof window === "undefined") return;
    if (dedicatedZumiBrowser) return;
    if (question?.trim()) {
      window.dispatchEvent(new CustomEvent("zumi:prompt", { detail: { question: question.trim(), voice } }));
    } else {
      window.dispatchEvent(new Event("zumi:open"));
    }
  }

  function submitZumi(event: FormEvent) {
    event.preventDefault();
    const question = zumiPrompt.trim();
    if (dedicatedZumiBrowser) return;
    if (!question) {
      summonZumi();
      return;
    }
    setZumiPrompt("");
    summonZumi(question);
  }

  return (
    <div className="klinikos-platform min-h-screen bg-[var(--mode-background)] text-[var(--k-text)] transition-colors duration-500" data-clinic-mode={designMode} data-klinikos-ds>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_72%_0%,rgba(150,41,48,.14),transparent_28%),radial-gradient(circle_at_20%_85%,rgba(230,129,123,.035),transparent_28%)]" />
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block"><Sidebar session={session} /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#050303]/82 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[290px] shadow-2xl"><Sidebar onNavigate={() => setMobileOpen(false)} session={session} /></div>
          <button className="absolute left-[302px] top-4 grid size-10 place-items-center rounded-full border border-[#efaaa1]/15 bg-[#0c0607] text-[#f8efed] shadow-xl" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
        </div>
      )}

      <div className="relative lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[82px] items-center gap-4 border-b border-[#e28b85]/10 bg-[color:var(--mode-header)] px-4 backdrop-blur-2xl transition-colors duration-500 sm:px-7 lg:px-10">
          <Button className="border-[#e28b85]/15 bg-transparent text-[#f8efed] lg:hidden" size="icon" variant="secondary" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">{meta.eyebrow}</p>
            <h1 className="truncate text-xl font-light tracking-[-.035em] text-[#f8efed]">{meta.title}</h1>
          </div>

          {!dedicatedZumiBrowser ? (
            <form className="ml-auto hidden w-full max-w-[520px] items-center gap-2 rounded-full border border-[#e28b85]/14 bg-[#12090b]/58 px-4 py-2 md:flex" onSubmit={submitZumi}>
              <Sparkles className="size-4 text-[#e6817b]" />
              <input className="min-w-0 flex-1 bg-transparent text-xs text-[#f8efed] outline-none placeholder:text-[#806965]" placeholder="Ask Zumi or describe an outcome…" aria-label="Ask Zumi" onChange={(event) => setZumiPrompt(event.target.value)} value={zumiPrompt} />
              <VoiceInputButton className="[&_button]:h-7 [&_button]:border-[#e28b85]/12 [&_button]:bg-transparent [&_button]:px-2 [&_button]:text-[10px] [&_button]:text-[#d8c1bd]" onTranscript={(transcript) => { setZumiPrompt(""); summonZumi(transcript, true); }} />
              <button aria-label="Send to Zumi" className="relative grid size-8 place-items-center rounded-full border border-[#e6817b]/18 bg-[#16090c] transition hover:border-[#efaaa1]/40 hover:bg-[#241014] disabled:opacity-35" disabled={!zumiPrompt.trim()} type="submit"><span className="absolute inset-1 rounded-full border border-[#e6817b]/10" /><img alt="" className="relative h-5 w-5 object-contain" src="/klinikos-orbital-k-transparent.png" /></button>
            </form>
          ) : <div className="ml-auto hidden text-[9px] font-semibold uppercase tracking-[.15em] text-[#806965] md:block">Conversation + routes + working contexts</div>}

          <div className="flex items-center gap-2">
            {dedicatedZumiBrowser ? <Link className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#e6817b]/16 bg-[#e6817b]/[.07] px-3 text-xs font-semibold text-[#efaaa1]" href="/paths"><Route className="size-4" />Routes</Link> : <Button aria-label="Open Zumi" className="gap-2 border-[#e28b85]/18 bg-[#e6817b]/[.08] px-3 text-[#efaaa1] hover:bg-[#e6817b]/14 hover:text-[#fff8f6]" onClick={() => summonZumi()} title="Open Zumi" type="button" variant="secondary"><Sparkles className="size-4" /><span className="hidden text-xs font-semibold sm:inline">Zumi</span></Button>}
            <Button className="relative hidden border-[#e28b85]/14 bg-[#12090b]/40 text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed] sm:inline-flex" size="icon" variant="secondary" aria-label="Notifications"><Bell className="size-4" /></Button>
          </div>
        </header>

        <main className={cn("klinikos-workspace mx-auto w-full max-w-[1680px] text-[var(--k-text)]", dedicatedZumiBrowser ? "px-4 py-4 sm:px-7 sm:py-7 lg:px-10 lg:py-10 xl:px-14 xl:py-14" : "px-4 py-8 sm:px-7 sm:py-10 lg:px-10 lg:py-12 xl:px-14")}>{children}</main>
      </div>

      {!dedicatedZumiBrowser ? <ZumiPresence userName={session.name} /> : null}
    </div>
  );
}
