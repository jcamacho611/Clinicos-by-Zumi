"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, Bell, Blocks, Boxes, BriefcaseMedical, Calculator, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleDollarSign, Gauge,
  AudioLines, BookOpenCheck, ClipboardCheck, ClipboardList, ClipboardPlus, Command, Files, Fingerprint, FlaskConical, Headphones, HeartHandshake,
  LayoutDashboard, ListChecks, LockKeyhole, LogOut, Menu, MessagesSquare, MonitorSmartphone,
  Network, Orbit, Pill, ReceiptText, Route, ScanLine, ScanSearch, Search, Settings2, ShieldCheck, Siren, Sparkles,
  Stethoscope, Users, Video, X,
  Waypoints,
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
  Blocks, Boxes, Settings2, Gauge,
  Network, Orbit, Route, HeartHandshake, Fingerprint, ClipboardCheck, AudioLines, BookOpenCheck, LockKeyhole, ScanSearch, Waypoints,
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function isVisibleDestination(role: ClinicSession["role"], href: string) {
  if (href === "/edu") return true;
  return canAccessWorkspace(role, href.slice(1));
}

function Sidebar({ onNavigate, session }: { onNavigate?: () => void; session: ClinicSession }) {
  const pathname = usePathname();
  const visibleNavigation = navigation
    .map((group) => ({ ...group, items: group.items.filter((item) => isVisibleDestination(session.role, item.href)) }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="flex h-full w-[272px] flex-col border-r border-white/10 bg-[#0b1e3a] text-white">
      <div className="flex h-[78px] items-center gap-3 border-b border-white/10 px-5">
        <BrandMark />
        <div>
          <p className="text-[15px] font-extrabold tracking-[-.03em] text-white">Klinikos</p>
          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#b89a5b]">Operating intelligence</p>
        </div>
      </div>

      <div className="px-3 pt-4">
        <button className="flex w-full items-center gap-3 border border-white/12 bg-white/[.04] px-3 py-2.5 text-left transition hover:bg-white/[.07]">
          <span className="grid size-8 place-items-center bg-[#1677a8] text-xs font-black text-white">{initials(session.organizationName)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-white">{session.organizationName}</span>
            <span className="block text-[10px] text-white/45">Clinic workspace</span>
          </span>
          <ChevronDown className="size-4 text-white/35" />
        </button>
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-6" aria-label="Klinikos workspace navigation">
        {visibleNavigation.map((group) => (
          <div className="mt-5 first:mt-2" key={group.label}>
            <p className="px-3 pb-1.5 text-[9px] font-extrabold uppercase tracking-[.2em] text-white/32">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = icons[item.icon];
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    className={cn(
                      "group flex items-center gap-3 border-l-2 px-3 py-2 text-[12px] font-semibold transition",
                      active
                        ? "border-[#43d9ff] bg-white/[.08] text-white"
                        : "border-transparent text-white/58 hover:bg-white/[.04] hover:text-white",
                    )}
                    href={item.href}
                    key={item.href}
                    onClick={onNavigate}
                    title={item.description}
                  >
                    <Icon className={cn("size-[17px]", active ? "text-[#43d9ff]" : "text-white/36 group-hover:text-[#43d9ff]")} strokeWidth={1.8} />
                    {item.label}
                    {item.href === "/escalations" && <span className="ml-auto grid size-5 place-items-center bg-[#b89a5b] text-[9px] font-extrabold text-[#0b1e3a]">3</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 p-2">
          <span className="grid size-9 place-items-center border border-[#b89a5b]/60 bg-transparent text-xs font-extrabold text-[#f1f0eb]">{initials(session.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{session.name}</p>
            <p className="text-[10px] text-white/45">{roleLabel(session.role)}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <Button className="text-white/60 hover:bg-white/10 hover:text-white" aria-label="Sign out" size="icon" title="Sign out" type="submit" variant="ghost"><LogOut className="size-4" /></Button>
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
    <div className="min-h-screen bg-[var(--mode-background)] text-[#0b1e3a]" data-clinic-mode={designMode}>
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block"><Sidebar session={session} /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#090d12]/70 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[290px] shadow-2xl"><Sidebar onNavigate={() => setMobileOpen(false)} session={session} /></div>
          <button className="absolute left-[302px] top-4 grid size-10 place-items-center border border-white/15 bg-[#0b1e3a] text-white shadow-xl" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
        </div>
      )}

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-[78px] items-center gap-4 border-b border-[#0b1e3a]/12 bg-[color:var(--mode-header)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button className="border-[#0b1e3a]/15 bg-transparent text-[#0b1e3a] lg:hidden" size="icon" variant="secondary" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#1677a8]">{meta.eyebrow}</p>
            <h1 className="truncate text-xl font-extrabold tracking-[-.035em] text-[#0b1e3a]">{meta.title}</h1>
          </div>

          <div className="ml-auto hidden w-full max-w-[460px] items-center gap-2 border border-[#0b1e3a]/14 bg-[#faf9f5] px-3 py-1.5 md:flex">
            <Search className="size-4 text-[#0b1e3a]/40" />
            <input className="min-w-0 flex-1 bg-transparent text-xs text-[#0b1e3a] outline-none placeholder:text-[#0b1e3a]/35" placeholder="Search Klinikos..." aria-label="Global search" onChange={(event) => setGlobalSearch(event.target.value)} value={globalSearch} />
            <VoiceInputButton className="[&_button]:h-7 [&_button]:px-2 [&_button]:text-[10px]" onTranscript={setGlobalSearch} />
            <kbd className="border border-[#0b1e3a]/12 bg-[#f1f0eb] px-1.5 py-0.5 text-[9px] font-bold text-[#0b1e3a]/45">⌘ K</kbd>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-1.5 border border-[#1677a8]/25 bg-[#1677a8]/8 px-3 py-1.5 text-[10px] font-bold text-[#0f658f]"><span className="size-1.5 bg-[#1677a8]" /> Human-governed</span>
            <Button
              aria-label="Open Zumi"
              className="border-[#0b1e3a]/15 bg-transparent text-[#0b1e3a]"
              onClick={() => window.dispatchEvent(new Event("zumi:toggle"))}
              size="icon"
              title="Open Zumi with Ctrl or Command J"
              type="button"
              variant="secondary"
            ><Command className="size-4" /></Button>
            <Button className="relative border-[#0b1e3a]/15 bg-transparent text-[#0b1e3a]" size="icon" variant="secondary" aria-label="Notifications"><Bell className="size-4" /></Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] p-4 text-[#0b1e3a] sm:p-6 lg:p-8">{children}</main>
      </div>

      <ZumiPresence userName={session.name} />
    </div>
  );
}
