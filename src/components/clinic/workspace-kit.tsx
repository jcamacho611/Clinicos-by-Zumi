import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageIntro({ title, description, action, aside }: { title: string; description: string; action?: ReactNode; aside?: ReactNode }) {
  return <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><h2 className="text-2xl font-extrabold tracking-[-.045em] text-slate-950 sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p></div><div className="flex flex-wrap items-center gap-2">{aside}{action}</div></div>;
}

export function StatCard({ label, value, detail, icon, accent = "slate" }: { label: string; value: string; detail: string; icon: ReactNode; accent?: "slate" | "teal" | "sky" | "amber" | "rose" }) {
  const accents = { slate: "bg-slate-100 text-slate-600", teal: "bg-teal-50 text-teal-700", sky: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700" };
  return <Card className="p-4 sm:p-5"><div className={cn("grid size-9 place-items-center rounded-xl", accents[accent])}>{icon}</div><p className="mt-4 text-2xl font-extrabold tracking-[-.045em] text-slate-950">{value}</p><p className="mt-1 text-xs font-bold text-slate-700">{label}</p><p className="mt-2 text-[10px] text-slate-400">{detail}</p></Card>;
}

export function SectionCard({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <Card className={cn("overflow-hidden", className)}><div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-extrabold text-slate-950">{title}</h3>{description && <p className="mt-1 text-[10px] leading-5 text-slate-500">{description}</p>}</div>{action}</div><div>{children}</div></Card>;
}

export function Person({ initials, name, detail, color = "teal" }: { initials: string; name: string; detail?: string; color?: "teal" | "sky" | "amber" | "rose" | "slate" }) {
  const colors = { teal: "bg-teal-50 text-teal-700", sky: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", slate: "bg-slate-100 text-slate-600" };
  return <div className="flex min-w-0 items-center gap-3"><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-[10px] font-extrabold", colors[color])}>{initials}</span><span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-900">{name}</span>{detail && <span className="mt-0.5 block truncate text-[10px] text-slate-400">{detail}</span>}</span></div>;
}

export function StatusBadge({ status }: { status: string }) {
  let tone: BadgeTone = "slate";
  if (/urgent|denied|abnormal|missing|overdue|blocked/i.test(status)) tone = "rose";
  else if (/needs|pending|draft|review|due|in progress|requested/i.test(status)) tone = "amber";
  else if (/active|confirmed|checked|released|paid|complete|approved|verified|signed|closed/i.test(status)) tone = "teal";
  else if (/room|provider|submitted|scheduled|portal/i.test(status)) tone = "sky";
  return <Badge tone={tone}>{status}</Badge>;
}

export function TextAction({ label = "View all" }: { label?: string }) {
  return <Button size="sm" variant="ghost">{label}<ArrowUpRight className="size-3.5" /></Button>;
}

export function Progress({ value, tone = "teal" }: { value: number; tone?: "teal" | "sky" | "amber" | "rose" }) {
  const colors = { teal: "bg-teal-500", sky: "bg-sky-500", amber: "bg-amber-400", rose: "bg-rose-500" };
  return <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", colors[tone])} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} /></div>;
}
