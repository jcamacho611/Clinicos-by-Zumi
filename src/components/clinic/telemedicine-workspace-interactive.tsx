"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock3, LoaderCircle, RefreshCcw, ShieldAlert, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { Appointment } from "@/lib/types";

type LoadState = "loading" | "ready" | "error";

function isActiveVisit(appointment: Appointment) {
  return !["Completed", "Cancelled", "No Show", "Rescheduled"].includes(appointment.status);
}

export function TelemedicineWorkspaceInteractive() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState("");

  async function load() {
    setLoadState("loading");
    setError("");
    try {
      const response = await fetch("/api/appointments", { headers: { Accept: "application/json" }, cache: "no-store" });
      const payload = await response.json().catch(() => null) as { error?: string; data?: Appointment[] } | null;
      if (!response.ok || !Array.isArray(payload?.data)) throw new Error(payload?.error ?? "Virtual-visit scheduling data could not be loaded.");
      setAppointments(payload.data.filter((appointment) => appointment.telemedicine));
      setLoadState("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Virtual-visit scheduling data could not be loaded.");
      setLoadState("error");
    }
  }

  useEffect(() => { void load(); }, []);

  const ordered = useMemo(() => [...appointments].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()), [appointments]);
  const active = useMemo(() => ordered.filter(isActiveVisit), [ordered]);
  const nextVisit = active.find((appointment) => new Date(appointment.endsAt).getTime() >= Date.now()) ?? active[0] ?? null;
  const readinessRisk = active.filter((appointment) => !appointment.formsComplete || !appointment.insuranceVerified || appointment.paymentDue > 0).length;

  if (loadState === "loading") {
    return <Card className="flex min-h-72 items-center justify-center"><div className="flex items-center gap-3 text-sm font-bold text-slate-500"><LoaderCircle className="size-5 animate-spin" /> Loading virtual visits…</div></Card>;
  }

  if (loadState === "error") {
    return <Card className="p-7"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-5 text-rose-700" /><div><h2 className="text-sm font-extrabold text-slate-950">Virtual-visit scheduling data is unavailable.</h2><p className="mt-2 text-xs text-slate-500">{error}</p><Button className="mt-4" onClick={() => void load()} size="sm" variant="secondary"><RefreshCcw className="size-3.5" /> Retry</Button></div></div></Card>;
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-teal-700">Telemedicine</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-slate-950">Virtual care without pretending the video rail is connected.</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">Klinikos uses the real tenant schedule for virtual-visit readiness. Video launch remains unavailable until an approved BAA-supported connection is configured.</p>
      </div>
      <Button asChild variant="secondary"><Link href="/integrations">Review video connection <ArrowRight className="size-4" /></Link></Button>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard accent="teal" detail="Stored telemedicine appointments" icon={<Video className="size-4" />} label="Virtual visits" value={String(appointments.length)} />
      <StatCard accent="amber" detail="Forms, insurance, or balance needs review" icon={<Clock3 className="size-4" />} label="Readiness risk" value={String(readinessRisk)} />
      <StatCard accent="sky" detail="External video vendor remains a separate connection" icon={<ShieldAlert className="size-4" />} label="Video rail" value="Pending" />
    </div>

    {nextVisit ? <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <Card className="relative overflow-hidden bg-slate-950 p-7 text-white">
        <div className="absolute right-[-80px] top-[-80px] size-64 rounded-full border-[46px] border-teal-300/10" />
        <Badge className="bg-lime-300 text-slate-950 ring-lime-300">Next virtual visit</Badge>
        <div className="relative mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-3xl font-extrabold tracking-[-.05em]">{nextVisit.patient}</p>
            <p className="mt-2 text-sm text-slate-300">{nextVisit.date} · {nextVisit.time} · {nextVisit.provider}</p>
            <div className="mt-5 flex flex-wrap gap-2"><StatusBadge status={nextVisit.status} /><Badge className="bg-white/10 text-white ring-white/15">{nextVisit.location}</Badge></div>
          </div>
          <div className="flex flex-wrap gap-2"><Button asChild className="bg-white text-slate-950 hover:bg-slate-100" variant="secondary"><Link href={`/patients/${nextVisit.patientId}`}>Open patient chart <ArrowRight className="size-4" /></Link></Button><Button disabled title="Configure an approved telemedicine video connection before launching rooms">Video room unavailable <Video className="size-4" /></Button></div>
        </div>
      </Card>
      <SectionCard title="Visit readiness" description="Only fields actually represented in the stored appointment are shown.">
        <div className="space-y-4 p-5">
          <ReadinessItem label="Forms" complete={nextVisit.formsComplete} incompleteLabel="Incomplete" />
          <ReadinessItem label="Insurance" complete={nextVisit.insuranceVerified} incompleteLabel="Needs review" />
          <ReadinessItem label="Balance" complete={nextVisit.paymentDue <= 0} incompleteLabel={`$${nextVisit.paymentDue.toFixed(2)} due`} />
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-900">Consent and identity readiness are not inferred from appointment fields. They must come from their actual governed records before Klinikos labels them complete.</div>
        </div>
      </SectionCard>
    </section> : <Card className="p-8 text-center"><Video className="mx-auto size-6 text-slate-300" /><p className="mt-4 text-sm font-extrabold text-slate-800">No active virtual visits are on the tenant schedule.</p><p className="mt-2 text-xs text-slate-500">Create a telemedicine appointment from Schedule when the clinic needs one.</p><Button asChild className="mt-4" size="sm" variant="secondary"><Link href="/schedule">Open schedule <ArrowRight className="size-3.5" /></Link></Button></Card>}

    <SectionCard title="Virtual visit queue" description="Real telemedicine appointments from the tenant schedule. Video launch stays disabled until the external connection is approved.">
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {ordered.map((appointment) => <article className="rounded-2xl border border-slate-200 p-4" key={appointment.id}><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-extrabold text-slate-400">{appointment.date} · {appointment.time}</p><StatusBadge status={appointment.status} /></div><p className="mt-5 text-sm font-extrabold text-slate-950">{appointment.patient}</p><p className="mt-1 text-[12px] text-slate-500">{appointment.provider} · {appointment.location}</p><div className="mt-4 flex gap-2"><Button asChild className="flex-1" size="sm" variant="secondary"><Link href={`/patients/${appointment.patientId}`}>Open chart</Link></Button><Button disabled size="sm" title="Video connection required" variant="ghost"><Video className="size-3.5" /></Button></div></article>)}
        {ordered.length === 0 && <p className="p-2 text-xs text-slate-500">No telemedicine appointments are recorded for this organization.</p>}
      </div>
    </SectionCard>
  </div>;
}

function ReadinessItem({ label, complete, incompleteLabel }: { label: string; complete: boolean; incompleteLabel: string }) {
  return <div className="flex items-center gap-3"><span className={`grid size-7 place-items-center rounded-lg ${complete ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"}`}>{complete ? <Check className="size-3.5" /> : <Clock3 className="size-3.5" />}</span><p className="flex-1 text-xs font-bold text-slate-700">{label}</p><span className="text-[12px] text-slate-400">{complete ? "Ready" : incompleteLabel}</span></div>;
}
