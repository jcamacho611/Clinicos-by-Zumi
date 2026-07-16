"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, Bell, Blocks, Boxes, BriefcaseMedical, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleDollarSign, Gauge,
  AudioLines, BookOpenCheck, ClipboardCheck, ClipboardList, ClipboardPlus, Command, Files, Fingerprint, FlaskConical, Headphones, HeartHandshake,
  LayoutDashboard, ListChecks, LockKeyhole, LogOut, Menu, MessagesSquare, MonitorSmartphone,
  Network, Orbit, Pill, ReceiptText, Route, ScanLine, ScanSearch, Search, Settings2, ShieldCheck, Siren, Sparkles,
  Stethoscope, Users, Video, X,
  Waypoints,
} from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { VoiceInputButton } from "@/components/clinic/voice-input";
import { Button } from "@/components/ui/button";
import { navigation, workspaceMeta } from "@/lib/navigation";
import { roleLabel } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const icons = {
  Activity, LayoutDashboard, Headphones, Stethoscope, Users, CalendarDays, ClipboardPlus, Video,
  FlaskConical, ScanLine, Pill, Files, ClipboardList, ReceiptText, ShieldCheck, BriefcaseMedical,
  ChartNoAxesCombined, CircleDollarSign, MessagesSquare, ListChecks, Siren, Sparkles, MonitorSmartphone,
  Blocks, Boxes, Settings2, Gauge,
  Network, Orbit, Route, HeartHandshake, Fingerprint, ClipboardCheck, AudioLines, BookOpenCheck, LockKeyhole, ScanSearch, Waypoints,
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function Sidebar({ onNavigate, session }: { onNavigate?: () => void; session: ClinicSession }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-[272px] flex-col border-r border-slate-200 bg-[#f8faf9]">
      <div className="flex h-[78px] items-center gap-3 border-b border-slate-200/80 px-5">
        <BrandMark />
        <div>
          <p className="text-[15px] font-extrabold tracking-[-.03em] text-slate-950">ClinicOS</p>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">by Zumi</p>
        </div>
      </div>
      <div className="px-3 pt-4">
        <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-slate-300">
          <span className="grid size-8 place-items-center rounded-lg bg-teal-50 text-xs font-black text-teal-700">{initials(session.organizationName)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-slate-900">{session.organizationName}</span>
            <span className="block text-[10px] text-slate-500">Authenticated workspace</span>
          </span>
          <ChevronDown className="size-4 text-slate-400" />
        </button>
      </div>
      <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-6">
        {navigation.map((group) => (
          <div className="mt-5 first:mt-2" key={group.label}>
            <p className="px-3 pb-1.5 text-[9px] font-extrabold uppercase tracking-[.18em] text-slate-400">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = icons[item.icon];
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold transition",
                      active ? "bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,.14)]" : "text-slate-600 hover:bg-white hover:text-slate-950",
                    )}
                    href={item.href}
                    key={item.href}
                    onClick={onNavigate}
                  >
                    <Icon className={cn("size-[17px]", active ? "text-teal-300" : "text-slate-400 group-hover:text-teal-600")} strokeWidth={1.8} />
                    {item.label}
                    {item.href === "/escalations" && <span className="ml-auto grid size-5 place-items-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white">3</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 text-xs font-extrabold text-white">{initials(session.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">{session.name}</p>
            <p className="text-[10px] text-slate-500">{roleLabel(session.role)}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <Button aria-label="Sign out" size="icon" title="Sign out" type="submit" variant="ghost"><LogOut className="size-4" /></Button>
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
  const networkMode = ["network", "referrals", "access-controls", "identity-resolution", "care-teams", "capacity-exchange", "injury-episodes", "health-passport", "intake-passport"].includes(slug);
  const designMode = networkMode ? "network" : session.organizationSlug === "luxe-medi" ? "luxe" : "medical";

  return (
    <div className="min-h-screen bg-[var(--mode-background)]" data-clinic-mode={designMode}>
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block"><Sidebar session={session} /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[290px] shadow-2xl"><Sidebar onNavigate={() => setMobileOpen(false)} session={session} /></div>
          <button className="absolute left-[302px] top-4 grid size-10 place-items-center rounded-full bg-white text-slate-900 shadow-xl" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
        </div>
      )}
      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-[78px] items-center gap-4 border-b border-slate-200/80 bg-[color:var(--mode-header)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button className="lg:hidden" size="icon" variant="secondary" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-teal-700">{meta.eyebrow}</p>
            <h1 className="truncate text-xl font-extrabold tracking-[-.035em] text-slate-950">{meta.title}</h1>
          </div>
          <div className="ml-auto hidden w-full max-w-[430px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm md:flex">
            <Search className="size-4 text-slate-400" />
            <input className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" placeholder="Search or ask ClinicOS..." aria-label="Global search" onChange={(event) => setGlobalSearch(event.target.value)} value={globalSearch} />
            <VoiceInputButton className="[&_button]:h-7 [&_button]:px-2 [&_button]:text-[10px]" onTranscript={setGlobalSearch} />
            <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">⌘ K</kbd>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-bold text-teal-700 ring-1 ring-inset ring-teal-200"><span className="size-1.5 rounded-full bg-teal-500" /> Demo data</span>
            <Button size="icon" variant="secondary" aria-label="Open command menu"><Command className="size-4" /></Button>
            <Button className="relative" size="icon" variant="secondary" aria-label="Notifications"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500 ring-2 ring-white" /></Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1680px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
