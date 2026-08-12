"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, Bell, Blocks, Boxes, BriefcaseMedical, Calculator, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleDollarSign, Gauge,
  AudioLines, BookOpenCheck, ClipboardCheck, ClipboardList, ClipboardPlus, Command, Files, Fingerprint, FlaskConical, Headphones, HeartHandshake,
  LayoutDashboard, ListChecks, LockKeyhole, LogOut, Menu, MessagesSquare, MonitorSmartphone,
  Network, Orbit, Pill, ReceiptText, Route, ScanLine, ScanSearch, Search, Settings2, ShieldCheck, Siren, Sparkles,
  Stethoscope, Users, Video, X, Waypoints,
} from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { VoiceInputButton } from "@/components/clinic/voice-input";
import { ZumiPresence } from "@/components/clinic/zumi-presence";
import { Button } from "@/components/ui/button";
import { navigation, workspaceMeta } from "@/lib/navigation";
import { roleLabel } from "@/lib/auth/rbac";
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
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition",
        active ? "bg-white/[.10] text-[var(--k-shell-text)]" : "text-white/58 hover:bg-white/[.05] hover:text-white",
      )}
      href={href}
      onClick={onNavigate}
    >
      <Icon className={cn("size-[17px]", active ? "text-[var(--k-accent)]" : "text-white/34 group-hover:text-[var(--k-accent)]")} strokeWidth={1.8} />
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
    <aside className="flex h-full w-[264px] flex-col border-r border-white/10 bg-[var(--k-shell)] text-[var(--k-shell-text)] transition-colors duration-500">
      <div className="flex h-[82px] items-center gap-3 px-5">
        <BrandMark />
        <div>
          <p className="text-[15px] font-extrabold tracking-[-.03em]">Klinikos</p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--k-premium)]">Operating ecosystem</p>
        </div>
      </div>

      <div className="px-4 pb-3 pt-2">
        <p className="truncate text-xs font-semibold">{session.organizationName}</p>
        <p className="mt-1 text-[10px] text-white/42">{roleLabel(session.role)}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-8" aria-label="Klinikos workspace navigation">
        <div className="border-y border-white/10 py-3">
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
              <details className="group/nav" defaultOpen={groupActive} key={group.label}>
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-semibold text-white/50 transition hover:bg-white/[.04] hover:text-white marker:hidden">
                  <span>{group.label}</span>
                  <span className="ml-auto text-[9px] text-white/25">{group.items.length}</span>
                  <ChevronDown className="size-3.5 text-white/30 transition group-open/nav:rotate-180" />
                </summary>
                <div className="mt-1 space-y-0.5 border-l border-white/10 pl-2">
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

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-white/16 bg-white/[.05] text-xs font-extrabold">{initials(session.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{session.name}</p>
            <Link className="mt-1 block text-[10px] text-white/40 hover:text-white" href="/settings" onClick={onNavigate}>Settings & appearance</Link>
          </div>
          <form action="/api/auth/logout" method="post">
            <Button className="text-white/55 hover:bg-white/10 hover:text-white" aria-label="Sign out" size="icon" title="Sign out" type="submit" variant="ghost"><LogOut className="size-4" /></Button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function AppShell({ children, session }: { children: React.ReactNode; session: ClinicSession }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const slug = pathname.split("/").filter(Boolean)[0] || "dashboard";
  const meta = workspaceMeta[slug] ?? workspaceMeta.dashboard;
  const networkMode = ["grid", "network", "referrals", "access-controls", "identity-resolution", "care-teams", "capacity-exchange", "injury-episodes", "health-passport", "intake-passport"].includes(slug);
  const designMode = networkMode ? "network" : session.organizationSlug === "luxe-medi" ? "luxe" : "medical";

  return (
    <div className="min-h-screen bg-[var(--mode-background)] text-[#0b1e3a] transition-colors duration-500" data-clinic-mode={designMode}>
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block"><Sidebar session={session} /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#07121d]/70 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[290px] shadow-2xl"><Sidebar onNavigate={() => setMobileOpen(false)} session={session} /></div>
          <button className="absolute left-[302px] top-4 grid size-10 place-items-center rounded-full border border-white/15 bg-[var(--k-shell)] text-white shadow-xl" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[82px] items-center gap-4 border-b border-[#0b1e3a]/10 bg-[color:var(--mode-header)] px-4 backdrop-blur-xl transition-colors duration-500 sm:px-7 lg:px-10">
          <Button className="border-[#0b1e3a]/12 bg-transparent text-[#0b1e3a] lg:hidden" size="icon" variant="secondary" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[var(--k-accent)]">{meta.eyebrow}</p>
            <h1 className="truncate text-xl font-extrabold tracking-[-.035em] text-[#0b1e3a]">{meta.title}</h1>
          </div>

          <div className="ml-auto hidden w-full max-w-[430px] items-center gap-2 border-b border-[#0b1e3a]/18 px-1 py-2 md:flex">
            <Search className="size-4 text-[#0b1e3a]/38" />
            <input className="min-w-0 flex-1 bg-transparent text-xs text-[#0b1e3a] outline-none placeholder:text-[#0b1e3a]/34" placeholder="Search Klinikos..." aria-label="Global search" onChange={(event) => setGlobalSearch(event.target.value)} value={globalSearch} />
            <VoiceInputButton className="[&_button]:h-7 [&_button]:px-2 [&_button]:text-[10px]" onTranscript={setGlobalSearch} />
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Button aria-label="Open Klinikos Intelligence" className="border-[#0b1e3a]/12 bg-transparent text-[#0b1e3a]" onClick={() => window.dispatchEvent(new Event("zumi:toggle"))} size="icon" title="Open Klinikos Intelligence" type="button" variant="secondary"><Command className="size-4" /></Button>
            <Button className="relative border-[#0b1e3a]/12 bg-transparent text-[#0b1e3a]" size="icon" variant="secondary" aria-label="Notifications"><Bell className="size-4" /></Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-4 py-8 text-[#0b1e3a] sm:px-7 sm:py-10 lg:px-10 lg:py-12 xl:px-14">{children}</main>
      </div>

      <ZumiPresence userName={session.name} />
    </div>
  );
}
