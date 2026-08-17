import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CalendarPlus, Check, CheckCircle2,
  CreditCard, FileText, PhoneCall, Plus, ShieldCheck, Stethoscope, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppointmentStatusControl } from "@/components/clinic/appointment-status-control";
import { EncounterCreateForm, type EncounterCreationOptions } from "@/components/clinic/encounter-create-form";
import { PatientListSearch } from "@/components/clinic/patient-list-search";
import { ScheduleWorkspaceInteractive } from "@/components/clinic/schedule-workspace-interactive";
import { TelemedicineWorkspaceInteractive } from "@/components/clinic/telemedicine-workspace-interactive";
import type { Appointment, Encounter, Patient } from "@/lib/types";
import { PageIntro, Person, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";

export function FrontDeskWorkspace({ appointments }: { appointments: Appointment[] }) {
  const activeArrivals = appointments.filter((appointment) => !["Completed", "Cancelled", "No Show", "Rescheduled"].includes(appointment.status));
  const formsIncomplete = appointments.filter((appointment) => !appointment.formsComplete).length;
  const paymentsDue = appointments.filter((appointment) => appointment.paymentDue > 0);
  const paymentTotal = paymentsDue.reduce((total, appointment) => total + appointment.paymentDue, 0);
  return <div className="space-y-6">
    <PageIntro title="Run today without the scramble." description="One readiness board for arrivals, forms, insurance, balances, missed calls, and provider handoffs." action={<Button asChild variant="primary"><Link href="/patients/new"><Plus className="size-4" /> Create patient</Link></Button>} aside={<Button asChild variant="secondary"><Link href="/schedule"><CalendarPlus className="size-4" /> Book visit</Link></Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="teal" detail={`${appointments.filter((appointment) => appointment.status === "Checked In").length} already checked in`} icon={<UserCheck className="size-4" />} label="Active arrivals" value={String(activeArrivals.length)} />
      <StatCard accent="amber" detail="ID, consent, or history" icon={<FileText className="size-4" />} label="Forms incomplete" value={String(formsIncomplete)} />
      <StatCard accent="rose" detail="Synthetic demo queue" icon={<PhoneCall className="size-4" />} label="Missed calls" value="3 demo" />
      <StatCard accent="sky" detail={`$${paymentTotal.toFixed(0)} expected today`} icon={<CreditCard className="size-4" />} label="Payments due" value={String(paymentsDue.length)} />
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
      <SectionCard title="Arrival board" description="Readiness updates are visible to front desk and the assigned care team." action={<Link className="text-xs font-extrabold text-sky-700 hover:text-sky-900" href="/schedule">Open schedule</Link>}>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400"><th className="px-5 py-3">Time / patient</th><th className="px-3 py-3">Visit</th><th className="px-3 py-3">Forms</th><th className="px-3 py-3">Insurance</th><th className="px-3 py-3">Balance</th><th className="px-3 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody>{appointments.map((item) => <tr className="border-b border-slate-100 text-xs last:border-0" key={item.id}><td className="px-5 py-4"><div className="flex items-center gap-4"><span className="w-16 font-extrabold text-slate-950">{item.time}</span><Person detail={item.provider} initials={item.initials} name={item.patient} /></div></td><td className="px-3 py-4 text-slate-600">{item.type}</td><td className="px-3 py-4">{item.formsComplete ? <span className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700"><Check className="size-3.5" /> Complete</span> : <StatusBadge status="Missing" />}</td><td className="px-3 py-4">{item.insuranceVerified ? <span className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700"><ShieldCheck className="size-3.5" /> Verified</span> : <StatusBadge status="Needs review" />}</td><td className="px-3 py-4 font-bold text-slate-900">${item.paymentDue}</td><td className="px-3 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4"><AppointmentStatusControl appointmentId={item.id} initialStatus={item.status} /></td></tr>)}</tbody></table></div>
      </SectionCard>
      <div className="space-y-6">
        <SectionCard title="Callback queue" description="Synthetic demo requests only until an approved communications connection is live.">
          <div className="space-y-1 p-3">{[["KB", "Kendra B.", "New patient request", "6 min"], ["RM", "Rafael M.", "Billing question", "18 min"], ["SP", "Simone P.", "Appointment request", "34 min"]].map(([initials, name, reason, time], index) => <div className="flex items-center gap-3 rounded-xl p-3" key={name}><span className={`grid size-9 place-items-center rounded-xl text-[10px] font-extrabold ${index === 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{initials}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-900">{name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{reason} · {time} ago · demo</p></div><Button disabled size="icon" variant="ghost" aria-label={`Call ${name} unavailable until communications connection is configured`} title="Communications connection required"><PhoneCall className="size-4" /></Button></div>)}</div>
        </SectionCard>
        <Card className="bg-slate-950 p-5 text-white"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-lime-300">Front desk focus</p><p className="mt-3 text-lg font-extrabold tracking-[-.03em]">Review readiness from today’s schedule.</p><p className="mt-2 text-xs leading-5 text-slate-400">Use appointment readiness and patient charts for forms, insurance, balance, and provider handoff status. Synthetic spotlight content has been removed.</p><Button asChild className="mt-5 bg-white text-slate-950 hover:bg-slate-100" size="sm" variant="secondary"><Link href="/schedule">Open schedule <ArrowRight className="size-3.5" /></Link></Button></Card>
      </div>
    </div>
  </div>;
}

export function ProviderWorkspace({ appointments, encounters }: { appointments: Appointment[]; encounters: Encounter[] }) {
  const draftEncounters = encounters.filter((encounter) => encounter.status === "Draft");
  const reviewEncounters = encounters.filter((encounter) => encounter.status === "Ready for Review" || encounter.status === "Addendum Needed");
  const todayAppointments = appointments.filter((appointment) => appointment.date === "Today" && !["Completed", "Cancelled", "No Show", "Rescheduled"].includes(appointment.status));
  const readyForReview = encounters.filter((encounter) => encounter.status === "Ready for Review").length;
  const addendumNeeded = encounters.filter((encounter) => encounter.status === "Addendum Needed").length;
  const draftEncounter = draftEncounters[0];

  return <div className="space-y-6">
    <PageIntro title="Clinical work, prioritized from stored records." description="Appointments and encounter state drive this provider workspace. External results and messages appear only when their real governed repositories are connected here." action={draftEncounter ? <Button asChild variant="primary"><Link href={`/encounters/${draftEncounter.id}`}><Stethoscope className="size-4" /> Resume encounter</Link></Button> : <Button asChild variant="secondary"><Link href="/encounters">Open encounters <ArrowRight className="size-4" /></Link></Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="teal" detail="Active appointments labeled Today" icon={<CalendarPlus className="size-4" />} label="Today’s visits" value={String(todayAppointments.length)} />
      <StatCard accent="sky" detail="Database-backed encounter drafts" icon={<FileText className="size-4" />} label="Draft notes" value={String(draftEncounters.length)} />
      <StatCard accent="amber" detail="Prepared for human clinical review" icon={<UserCheck className="size-4" />} label="Ready for review" value={String(readyForReview)} />
      <StatCard accent="rose" detail="Existing signed note requires follow-through" icon={<AlertTriangle className="size-4" />} label="Addendum needed" value={String(addendumNeeded)} />
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <SectionCard title="Encounter review queue" description="Only stored encounters requiring review or addendum work appear here." action={<Link className="text-xs font-extrabold text-sky-700 hover:text-sky-900" href="/encounters">Open all encounters</Link>}>
        <div className="divide-y divide-slate-100">{reviewEncounters.map((encounter) => <Link className="flex items-center gap-4 p-5 transition hover:bg-slate-50" href={`/encounters/${encounter.id}`} key={encounter.id}><span className={`grid size-10 place-items-center rounded-xl ${encounter.status === "Addendum Needed" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}><FileText className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-950">{encounter.patientName}</p><p className="mt-1 text-[10px] text-slate-400">{encounter.date} · {encounter.type} · {encounter.provider}</p></div><StatusBadge status={encounter.status} /><ArrowRight className="size-4 text-slate-300" /></Link>)}{reviewEncounters.length === 0 && <p className="p-5 text-xs text-slate-500">No encounters currently require review or addendum work.</p>}</div>
      </SectionCard>
      <SectionCard title="Today’s clinical panel" description="Real appointments from the tenant schedule linked to the patient or existing encounter.">
        <div className="space-y-2 p-3">{todayAppointments.map((appointment, index) => { const encounter = encounters.find((item) => item.patientId === appointment.patientId); return <Link className="block rounded-2xl border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50" href={encounter ? `/encounters/${encounter.id}` : `/patients/${appointment.patientId}`} key={appointment.id}><div className="flex items-center gap-3"><Person color={index === 0 ? "rose" : "teal"} detail={`${appointment.time} · ${appointment.type}`} initials={appointment.initials} name={appointment.patient} /><StatusBadge status={appointment.status} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-center"><div className="rounded-lg bg-slate-50 p-2"><p className="text-[8px] font-bold text-slate-400">READINESS</p><p className="mt-1 text-[10px] font-extrabold text-slate-800">{appointment.formsComplete && appointment.insuranceVerified ? "Ready" : "Review"}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-[8px] font-bold text-slate-400">NOTE</p><p className="mt-1 text-[10px] font-extrabold text-slate-800">{encounter?.status ?? "Not started"}</p></div></div></Link>; })}{todayAppointments.length === 0 && <p className="p-3 text-xs text-slate-500">No active appointments are labeled Today.</p>}</div>
      </SectionCard>
    </div>
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-slate-950">Clinical follow-through belongs in the tenant task queue.</p><p className="mt-1 text-xs text-slate-500">Klinikos does not invent provider tasks on this surface. Use the real Tasks workspace for owned follow-through.</p></div><Button asChild variant="secondary"><Link href="/tasks">Open tasks <ArrowRight className="size-4" /></Link></Button></Card>
  </div>;
}

export function PatientsWorkspace({ patients }: { patients: Patient[] }) {
  return <div className="space-y-6">
    <PageIntro title="Every patient, one continuous record." description="Search demographics, care team, risk, portal status, balance, and the next clinical step without leaving the patient index." action={<Button asChild variant="primary"><Link href="/patients/new"><Plus className="size-4" /> Add patient</Link></Button>} />
    <PatientListSearch patients={patients} />
  </div>;
}

export function ScheduleWorkspace({ appointments }: { appointments: Appointment[] }) {
  return <ScheduleWorkspaceInteractive appointments={appointments} />;
}

export function EncountersWorkspace({ canCreate, encounters, options }: { canCreate: boolean; encounters: Encounter[]; options: EncounterCreationOptions }) {
  const draftEncounter = encounters.find((encounter) => encounter.status === "Draft");
  return <div className="space-y-6"><PageIntro title="Documentation without the dead ends." description="Create, continue, review, sign, lock, and amend clinical notes with structured billing fields and a visible audit trail." action={draftEncounter ? <Button asChild variant="primary"><Link href={`/encounters/${draftEncounter.id}`}><Stethoscope className="size-4" /> Open draft</Link></Button> : undefined} />
    <EncounterCreateForm canCreate={canCreate} options={options} />
    <div className="grid gap-4 sm:grid-cols-4"><StatCard accent="sky" detail="Autosaved to PostgreSQL" icon={<FileText className="size-4" />} label="Draft notes" value={String(encounters.filter((encounter) => encounter.status === "Draft").length)} /><StatCard accent="amber" detail="Prepared for signature" icon={<UserCheck className="size-4" />} label="Ready for review" value={String(encounters.filter((encounter) => encounter.status === "Ready for Review").length)} /><StatCard accent="teal" detail="Signed and immutable" icon={<CheckCircle2 className="size-4" />} label="Locked" value={String(encounters.filter((encounter) => encounter.status === "Locked").length)} /><StatCard accent="rose" detail="Requires follow-through" icon={<AlertTriangle className="size-4" />} label="Needs attention" value={String(encounters.filter((encounter) => encounter.status === "Addendum Needed").length)} /></div>
    <SectionCard title="Encounter worklist" description="All notes stay attached to a patient, provider, organization, and immutable audit history."><div className="divide-y divide-slate-100">{encounters.map((encounter) => <Link className="grid gap-4 p-5 transition hover:bg-slate-50 md:grid-cols-[1.1fr_.7fr_.7fr_auto] md:items-center" href={`/encounters/${encounter.id}`} key={encounter.id}><Person detail={`${encounter.date} · ${encounter.patientMrn}`} initials={encounter.patientInitials} name={encounter.patientName} /><div><p className="text-[9px] font-bold text-slate-400">VISIT TYPE</p><p className="mt-1 text-xs font-bold text-slate-700">{encounter.type}</p></div><div><p className="text-[9px] font-bold text-slate-400">PROVIDER</p><p className="mt-1 text-xs font-bold text-slate-700">{encounter.provider}</p></div><div className="flex items-center gap-3"><StatusBadge status={encounter.status} /><ArrowRight className="size-4 text-slate-300" /></div></Link>)}</div></SectionCard>
  </div>;
}

export function TelemedicineWorkspace() {
  return <TelemedicineWorkspaceInteractive />;
}