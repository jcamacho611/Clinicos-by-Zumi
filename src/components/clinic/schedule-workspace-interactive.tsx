"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { Appointment } from "@/lib/types";

type CreationOptions = {
  patients: Array<{ id: string; name: string; mrn: string }>;
  providers: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string; timezone: string }>;
  appointmentTypes: Array<{ id: string; name: string; durationMinutes: number; telemedicine: boolean }>;
};

const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50";

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getUTCDay();
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function ScheduleWorkspaceInteractive({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [providerFilter, setProviderFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createAllowed, setCreateAllowed] = useState<boolean | null>(null);
  const [options, setOptions] = useState<CreationOptions | null>(null);
  const [optionsBusy, setOptionsBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [patientId, setPatientId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [telemedicine, setTelemedicine] = useState(false);
  const [notes, setNotes] = useState("");

  const monday = useMemo(() => startOfWeek(weekAnchor), [weekAnchor]);
  const days = useMemo(() => Array.from({ length: 5 }, (_, index) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + index);
    return day;
  }), [monday]);

  const providerNames = useMemo(() => unique(appointments.map((appointment) => appointment.provider).filter((value) => value !== "Unassigned")), [appointments]);
  const locationNames = useMemo(() => unique(appointments.map((appointment) => appointment.location).filter((value) => value !== "Unassigned")), [appointments]);
  const filteredAppointments = useMemo(() => appointments.filter((appointment) =>
    (providerFilter === "all" || appointment.provider === providerFilter)
    && (locationFilter === "all" || appointment.location === locationFilter)
  ), [appointments, providerFilter, locationFilter]);
  const readinessRisk = filteredAppointments.filter((appointment) => !appointment.formsComplete || !appointment.insuranceVerified).length;
  const weekAppointments = useMemo(() => filteredAppointments.filter((appointment) => {
    const key = dateKey(new Date(appointment.startsAt));
    return key >= dateKey(days[0]) && key <= dateKey(days[4]);
  }), [filteredAppointments, days]);

  function moveWeek(amount: number) {
    setWeekAnchor((current) => {
      const next = new Date(current);
      next.setUTCDate(next.getUTCDate() + amount * 7);
      return next;
    });
  }

  async function openCreate() {
    setCreateOpen(true);
    setError("");
    if (options || optionsBusy || createAllowed === false) return;
    setOptionsBusy(true);
    try {
      const response = await fetch("/api/appointments/options", { headers: { Accept: "application/json" }, cache: "no-store" });
      const payload = await response.json().catch(() => null) as { error?: string; data?: CreationOptions } | null;
      if (response.status === 403) {
        setCreateAllowed(false);
        throw new Error("Your role can view the schedule but cannot create appointments.");
      }
      if (!response.ok || !payload?.data) throw new Error(payload?.error ?? "Appointment options could not be loaded.");
      setCreateAllowed(true);
      setOptions(payload.data);
      setPatientId(payload.data.patients[0]?.id ?? "");
      setProviderId(payload.data.providers[0]?.id ?? "");
      setLocationId(payload.data.locations[0]?.id ?? "");
      setAppointmentTypeId(payload.data.appointmentTypes[0]?.id ?? "");
      setTelemedicine(payload.data.appointmentTypes[0]?.telemedicine ?? false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Appointment options could not be loaded.");
    } finally {
      setOptionsBusy(false);
    }
  }

  function closeCreate() {
    if (submitting) return;
    setCreateOpen(false);
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientId || !startsAt) return;
    const parsedStart = new Date(startsAt);
    if (!Number.isFinite(parsedStart.getTime())) {
      setError("Choose a valid appointment date and time.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          patientId,
          providerId: providerId || null,
          locationId: locationId || null,
          appointmentTypeId: appointmentTypeId || null,
          startsAt: parsedStart.toISOString(),
          telemedicine,
          notes: notes || null,
        }),
      });
      const payload = await response.json().catch(() => null) as { error?: string; appointment?: Appointment } | null;
      if (!response.ok || !payload?.appointment) throw new Error(payload?.error ?? "The appointment could not be created.");
      setWeekAnchor(new Date(payload.appointment.startsAt));
      setStartsAt("");
      setNotes("");
      setCreateOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The appointment could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedType = options?.appointmentTypes.find((type) => type.id === appointmentTypeId);

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-teal-700">Schedule</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-slate-950">A schedule built around clinical flow.</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">Create visits, review readiness, and filter the calendar without leaving the operating workspace. Klinikos blocks patient and provider overlaps before a booking is committed.</p>
      </div>
      <Button onClick={() => void openCreate()} variant="primary"><CalendarPlus className="size-4" /> New appointment</Button>
    </div>

    {createOpen && <Card className="overflow-hidden">
      <form className="p-5" onSubmit={submit}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-700 text-white"><CalendarPlus className="size-5" /></span>
          <div><h3 className="text-sm font-extrabold text-slate-950">Create appointment</h3><p className="mt-1 text-[12px] leading-5 text-slate-500">Duration is server-owned by the selected appointment type. Conflicting patient or provider times are rejected.</p></div>
          <Button aria-label="Close appointment form" className="ml-auto" disabled={submitting} onClick={closeCreate} size="icon" type="button" variant="ghost"><X className="size-4" /></Button>
        </div>
        {optionsBusy && <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500"><LoaderCircle className="size-4 animate-spin" /> Loading authorized schedule options…</div>}
        {options && createAllowed !== false && <>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs font-bold text-slate-700">Patient<select className={`mt-2 ${selectClass}`} onChange={(event) => setPatientId(event.target.value)} required value={patientId}>{options.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-700">Provider<select className={`mt-2 ${selectClass}`} onChange={(event) => setProviderId(event.target.value)} value={providerId}><option value="">Unassigned</option>{options.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-700">Location<select className={`mt-2 ${selectClass}`} onChange={(event) => setLocationId(event.target.value)} value={locationId}><option value="">Unassigned</option>{options.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-700">Appointment type<select className={`mt-2 ${selectClass}`} onChange={(event) => { const nextId = event.target.value; setAppointmentTypeId(nextId); const next = options.appointmentTypes.find((type) => type.id === nextId); if (next) setTelemedicine(next.telemedicine); }} value={appointmentTypeId}><option value="">General visit · 30 min</option>{options.appointmentTypes.map((type) => <option key={type.id} value={type.id}>{type.name} · {type.durationMinutes} min</option>)}</select></label>
            <label className="text-xs font-bold text-slate-700">Date and time<Input className="mt-2" onChange={(event) => setStartsAt(event.target.value)} required type="datetime-local" value={startsAt} /></label>
            <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700"><input checked={telemedicine} disabled={Boolean(selectedType)} onChange={(event) => setTelemedicine(event.target.checked)} type="checkbox" /> Telemedicine {selectedType ? "(set by type)" : ""}</label>
          </div>
          <label className="mt-4 block text-xs font-bold text-slate-700">Internal scheduling note<Input className="mt-2" maxLength={2000} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" value={notes} /></label>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[12px] leading-5 text-slate-500">No external scheduling vendor is required. The booking is written directly to the tenant-scoped Klinikos schedule with an audit receipt.</p><Button disabled={submitting || !patientId || !startsAt} type="submit">{submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Create appointment</Button></div>
        </>}
        {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}
      </form>
    </Card>}

    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard accent="teal" detail={`${weekAppointments.length} in the displayed week`} icon={<CalendarClock className="size-4" />} label="Visible bookings" value={String(filteredAppointments.length)} />
      <StatCard accent="amber" detail="Forms or insurance review" icon={<Clock3 className="size-4" />} label="Readiness risk" value={String(readinessRisk)} />
      <StatCard accent="sky" detail="Native schedule, no vendor fee" icon={<Users className="size-4" />} label="Calendar source" value="Klinikos" />
    </div>

    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 xl:flex-row xl:items-center">
        <div>
          <p className="text-sm font-extrabold text-slate-950">Week of {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(monday)}</p>
          <p className="mt-1 text-[12px] text-slate-400">Monday through Friday · filtered locally from authorized schedule data</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
          <Button aria-label="Previous week" onClick={() => moveWeek(-1)} size="icon" variant="secondary"><ChevronLeft className="size-4" /></Button>
          <Button onClick={() => setWeekAnchor(new Date())} size="sm" variant="secondary">Today</Button>
          <Button aria-label="Next week" onClick={() => moveWeek(1)} size="icon" variant="secondary"><ChevronRight className="size-4" /></Button>
          <select aria-label="Filter schedule by provider" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700" onChange={(event) => setProviderFilter(event.target.value)} value={providerFilter}><option value="all">All providers</option>{providerNames.map((provider) => <option key={provider} value={provider}>{provider}</option>)}</select>
          <select aria-label="Filter schedule by location" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700" onChange={(event) => setLocationFilter(event.target.value)} value={locationFilter}><option value="all">All locations</option>{locationNames.map((location) => <option key={location} value={location}>{location}</option>)}</select>
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="grid min-w-[850px] grid-cols-5 gap-3">
          {days.map((day) => {
            const dayAppointments = filteredAppointments.filter((appointment) => dateKey(new Date(appointment.startsAt)) === dateKey(day));
            return <div key={dateKey(day)}>
              <div className={`rounded-xl px-3 py-2 text-center text-[12px] font-extrabold ${dayAppointments.length > 0 ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>{new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(day)}</div>
              <div className="mt-3 min-h-[500px] space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-2">
                {dayAppointments.map((appointment) => {
                  const durationMinutes = Math.max(30, (new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime()) / 60_000);
                  const tone = appointment.telemedicine ? "bg-amber-100 border-amber-200 text-amber-950" : appointment.status === "In Room" ? "bg-sky-100 border-sky-200 text-sky-950" : "bg-teal-100 border-teal-200 text-teal-950";
                  return <Link className={`block rounded-xl border p-3 ${tone}`} href={`/patients/${appointment.patientId}`} key={appointment.id} style={{ minHeight: Math.round(durationMinutes * 1.7) }}><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-extrabold">{appointment.time}</p><StatusBadge status={appointment.status} /></div><p className="mt-2 text-xs font-extrabold">{appointment.patient}</p><p className="mt-1 text-[11px] opacity-65">{appointment.type} · {appointment.provider}</p><p className="mt-1 text-[11px] opacity-55">{appointment.location}</p></Link>;
                })}
                {dayAppointments.length === 0 && <p className="px-2 pt-4 text-center text-[11px] font-bold uppercase tracking-[.12em] text-slate-300">No bookings</p>}
              </div>
            </div>;
          })}
        </div>
      </div>
    </Card>
  </div>;
}
