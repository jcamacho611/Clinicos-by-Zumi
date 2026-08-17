import Link from "next/link";
import { ArrowRight, CalendarPlus, Check, CreditCard, FileText, ListChecks, MessageSquareText, PhoneCall, Plus, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppointmentStatusControl } from "@/components/clinic/appointment-status-control";
import { PageIntro, Person, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { CareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";
import type { Appointment } from "@/lib/types";

const frontDeskCategoryHints = ["front", "follow_up", "follow-up", "callback", "appointment", "schedule", "intake", "form", "insurance", "lead"];

export function FrontDeskWorkspaceReal({ appointments, coordination, currentUserId }: { appointments: Appointment[]; coordination: CareCoordinationWorkspace; currentUserId: string }) {
  const activeArrivals = appointments.filter((appointment) => !["Completed", "Cancelled", "No Show", "Rescheduled"].includes(appointment.status));
  const formsIncomplete = appointments.filter((appointment) => !appointment.formsComplete).length;
  const paymentsDue = appointments.filter((appointment) => appointment.paymentDue > 0);
  const paymentTotal = paymentsDue.reduce((total, appointment) => total + appointment.paymentDue, 0);
  const queue = coordination.tasks.filter((task) => {
    if (task.status === "completed") return false;
    if (task.ownerId === currentUserId) return true;
    const category = task.category.toLocaleLowerCase();
    return frontDeskCategoryHints.some((hint) => category.includes(hint));
  });
  const unreadNotifications = coordination.notifications.filter((notification) => !notification.readAt);

  return <div className="space-y-6">
    <PageIntro
      title="Run today without the scramble."
      description="Arrivals, readiness, balances, and owned follow-through come from the tenant schedule and task engine. External calling stays separate until an approved communications rail is connected."
      action={<Button asChild variant="primary"><Link href="/patients/new"><Plus className="size-4" /> Create patient</Link></Button>}
      aside={<Button asChild variant="secondary"><Link href="/schedule"><CalendarPlus className="size-4" /> Book visit</Link></Button>}
    />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="teal" detail={`${appointments.filter((appointment) => appointment.status === "Checked In").length} already checked in`} icon={<UserCheck className="size-4" />} label="Active arrivals" value={String(activeArrivals.length)} />
      <StatCard accent="amber" detail="ID, consent, or history readiness" icon={<FileText className="size-4" />} label="Forms incomplete" value={String(formsIncomplete)} />
      <StatCard accent="sky" detail={`${queue.filter((task) => task.ownerId === currentUserId).length} assigned to you`} icon={<ListChecks className="size-4" />} label="Follow-through" value={String(queue.length)} />
      <StatCard accent="rose" detail={`$${paymentTotal.toFixed(0)} expected from stored appointments`} icon={<CreditCard className="size-4" />} label="Balances due" value={String(paymentsDue.length)} />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
      <SectionCard title="Arrival board" description="Readiness and appointment status come from the tenant schedule." action={<Link className="text-xs font-extrabold text-sky-700 hover:text-sky-900" href="/schedule">Open schedule</Link>}>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400"><th className="px-5 py-3">Time / patient</th><th className="px-3 py-3">Visit</th><th className="px-3 py-3">Forms</th><th className="px-3 py-3">Insurance</th><th className="px-3 py-3">Balance</th><th className="px-3 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody>{appointments.map((item) => <tr className="border-b border-slate-100 text-xs last:border-0" key={item.id}><td className="px-5 py-4"><div className="flex items-center gap-4"><span className="w-16 font-extrabold text-slate-950">{item.time}</span><Link href={`/patients/${item.patientId}`}><Person detail={item.provider} initials={item.initials} name={item.patient} /></Link></div></td><td className="px-3 py-4 text-slate-600">{item.type}</td><td className="px-3 py-4">{item.formsComplete ? <span className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700"><Check className="size-3.5" /> Complete</span> : <StatusBadge status="Missing" />}</td><td className="px-3 py-4">{item.insuranceVerified ? <span className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700"><ShieldCheck className="size-3.5" /> Verified</span> : <StatusBadge status="Needs review" />}</td><td className="px-3 py-4 font-bold text-slate-900">${item.paymentDue}</td><td className="px-3 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4"><AppointmentStatusControl appointmentId={item.id} initialStatus={item.status} /></td></tr>)}</tbody></table></div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard title="Front desk follow-through" description="Real open tasks assigned to you or categorized for front-desk operations.">
          <div className="divide-y divide-slate-100">{queue.slice(0, 8).map((task) => <Link className="block p-4 transition hover:bg-slate-50" href="/tasks" key={task.id}><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><ListChecks className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{task.title}</p><StatusBadge status={task.priority} /></div><p className="mt-1 text-[10px] text-slate-500">{task.patientName} · {task.category.replaceAll("_", " ")}</p><p className="mt-1 text-[9px] text-slate-400">{task.dueAt ? `Due ${new Date(task.dueAt).toLocaleString()}` : "No due time"}</p></div></div></Link>)}{queue.length === 0 && <p className="p-5 text-xs text-slate-500">No open front-desk follow-through is recorded.</p>}</div>
          {queue.length > 8 ? <div className="border-t border-slate-100 p-3"><Button asChild className="w-full" size="sm" variant="ghost"><Link href="/tasks">View all tasks <ArrowRight className="size-3.5" /></Link></Button></div> : null}
        </SectionCard>

        <Card className="p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><MessageSquareText className="size-4" /></span><div><p className="text-sm font-extrabold text-slate-950">Internal coordination is available.</p><p className="mt-2 text-xs leading-5 text-slate-500">Use Klinikos Messages for internal patient-linked coordination. {unreadNotifications.length} unread tenant notifications are currently assigned to you.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm" variant="secondary"><Link href="/messages">Open messages <ArrowRight className="size-3.5" /></Link></Button><Button asChild size="sm" variant="ghost"><Link href="/integrations"><PhoneCall className="size-3.5" /> Calling connection</Link></Button></div></div></div></Card>

        <Card className="border-amber-200 bg-amber-50 p-5"><p className="text-xs font-extrabold text-amber-950">No fake missed-call queue.</p><p className="mt-2 text-[10px] leading-5 text-amber-900">Klinikos does not display invented callers or callback counts. Real inbound/call events will appear only after an approved communications connection supplies them.</p></Card>
      </div>
    </div>
  </div>;
}
