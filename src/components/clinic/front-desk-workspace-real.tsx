import Link from "next/link";
import { ArrowRight, CalendarPlus, Check, CreditCard, FileText, ListChecks, MessageSquareText, PhoneCall, Plus, ShieldCheck } from "lucide-react";
import { AppointmentStatusControl } from "@/components/clinic/appointment-status-control";
import { PageIntro, Person, SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";
import type { Appointment } from "@/lib/types";

const frontDeskCategoryHints = ["front", "follow_up", "follow-up", "callback", "appointment", "schedule", "intake", "form", "insurance", "lead"];

export function FrontDeskWorkspaceReal({ appointments, coordination, currentUserId }: { appointments: Appointment[]; coordination: CareCoordinationWorkspace; currentUserId: string }) {
  const activeAppointments = appointments.filter((appointment) => !["Completed", "Cancelled", "No Show", "Rescheduled"].includes(appointment.status));
  const checkedIn = appointments.filter((appointment) => appointment.status === "Checked In").length;
  const formsIncomplete = appointments.filter((appointment) => !appointment.formsComplete).length;
  const paymentsDue = appointments.filter((appointment) => appointment.paymentDue > 0);
  const paymentTotal = paymentsDue.reduce((total, appointment) => total + appointment.paymentDue, 0);
  const queue = coordination.tasks.filter((task) => {
    if (task.status === "completed") return false;
    if (task.ownerId === currentUserId) return true;
    const category = task.category.toLocaleLowerCase();
    return frontDeskCategoryHints.some((hint) => category.includes(hint));
  });
  const assignedToYou = queue.filter((task) => task.ownerId === currentUserId).length;
  const unreadNotifications = coordination.notifications.filter((notification) => !notification.readAt);

  const operativeMetrics = [
    { label: "Active appointments", value: String(activeAppointments.length), detail: `${checkedIn} checked in`, icon: CalendarPlus },
    { label: "Forms incomplete", value: String(formsIncomplete), detail: "Stored appointment readiness", icon: FileText },
    { label: "Follow-through", value: String(queue.length), detail: `${assignedToYou} assigned to you`, icon: ListChecks },
    { label: "Balances due", value: String(paymentsDue.length), detail: `$${paymentTotal.toFixed(0)} in stored appointment balances`, icon: CreditCard },
  ] as const;

  return <div className="space-y-6">
    <PageIntro
      title="Run the front desk without the scramble."
      description="Schedule readiness, stored balances, and owned follow-through come from the tenant schedule and task engine. Use Schedule when you need a date-specific view; external calling stays separate until an approved communications rail is connected."
      action={<Button asChild variant="primary"><Link href="/patients/new"><Plus className="size-4" /> Create patient</Link></Button>}
      aside={<Button asChild variant="secondary"><Link href="/schedule"><CalendarPlus className="size-4" /> Book visit</Link></Button>}
    />

    <section data-front-desk-operative-strip className="overflow-hidden border-y border-[var(--k-line)] bg-[var(--k-public-surface)]" aria-label="Front desk operational summary">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        {operativeMetrics.map(({ label, value, detail, icon: Icon }, index) => <div className={`min-w-0 px-5 py-4 ${index > 0 ? "border-t border-[var(--k-line)] sm:border-l sm:border-t-0" : ""} ${index === 2 ? "sm:border-l-0 xl:border-l" : ""}`} key={label}>
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">{label}</p><Icon className="size-4 text-[var(--k-accent)]" aria-hidden="true" /></div>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-.04em] text-[var(--k-text)]">{value}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--k-muted)]">{detail}</p>
        </div>)}
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
      <SectionCard title="Schedule readiness" description="Appointment readiness and status come from the tenant schedule. Open Schedule to narrow the work by date." action={<Link className="text-xs font-extrabold text-[var(--k-accent)]" href="/schedule">Open schedule</Link>}>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-slate-100 text-xs font-extrabold uppercase tracking-[.13em] text-slate-400"><th className="px-5 py-3">Time / patient</th><th className="px-3 py-3">Visit</th><th className="px-3 py-3">Forms</th><th className="px-3 py-3">Insurance</th><th className="px-3 py-3">Balance</th><th className="px-3 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody>{appointments.map((item) => <tr className="border-b border-slate-100 text-xs last:border-0" key={item.id}><td className="px-5 py-4"><div className="flex items-center gap-4"><span className="w-16 font-extrabold tabular-nums text-slate-950">{item.time}</span><Link href={`/patients/${item.patientId}`}><Person detail={item.provider} initials={item.initials} name={item.patient} /></Link></div></td><td className="px-3 py-4 text-slate-600">{item.type}</td><td className="px-3 py-4">{item.formsComplete ? <span className="flex items-center gap-1.5 text-xs font-bold text-teal-700"><Check className="size-3.5" /> Complete</span> : <StatusBadge status="Missing" />}</td><td className="px-3 py-4">{item.insuranceVerified ? <span className="flex items-center gap-1.5 text-xs font-bold text-teal-700"><ShieldCheck className="size-3.5" /> Verified</span> : <StatusBadge status="Needs review" />}</td><td className="px-3 py-4 font-bold tabular-nums text-slate-900">${item.paymentDue}</td><td className="px-3 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4"><AppointmentStatusControl appointmentId={item.id} initialStatus={item.status} /></td></tr>)}{appointments.length === 0 && <tr><td className="px-5 py-8 text-sm text-slate-500" colSpan={7}>No appointment records are currently loaded for this organization.</td></tr>}</tbody></table></div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard title="Front desk follow-through" description="Real open tasks assigned to you or categorized for front-desk operations.">
          <div className="divide-y divide-slate-100">{queue.slice(0, 8).map((task) => <Link className="block p-4 transition hover:bg-slate-50" href="/tasks" key={task.id}><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><ListChecks className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{task.title}</p><StatusBadge status={task.priority} /></div><p className="mt-1 text-xs text-slate-500">{task.patientName} · {task.category.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-400">{task.dueAt ? `Due ${new Date(task.dueAt).toLocaleString()}` : "No due time"}</p></div></div></Link>)}{queue.length === 0 && <p className="p-5 text-sm text-slate-500">No open front-desk follow-through is recorded.</p>}</div>
          {queue.length > 8 ? <div className="border-t border-slate-100 p-3"><Button asChild className="w-full" size="sm" variant="ghost"><Link href="/tasks">View all tasks <ArrowRight className="size-3.5" /></Link></Button></div> : null}
        </SectionCard>

        <Card className="p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><MessageSquareText className="size-4" /></span><div><p className="text-sm font-extrabold text-slate-950">Internal coordination is available.</p><p className="mt-2 text-xs leading-5 text-slate-500">Use Klinikos Messages for internal patient-linked coordination. {unreadNotifications.length} unread tenant notifications are currently assigned to you.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm" variant="secondary"><Link href="/messages">Open messages <ArrowRight className="size-3.5" /></Link></Button><Button asChild size="sm" variant="ghost"><Link href="/integrations"><PhoneCall className="size-3.5" /> Calling connection</Link></Button></div></div></div></Card>

        <Card className="border-amber-200 bg-amber-50 p-5"><p className="text-xs font-extrabold text-amber-950">No fake missed-call queue.</p><p className="mt-2 text-xs leading-5 text-amber-900">Klinikos does not display invented callers or callback counts. Real inbound/call events will appear only after an approved communications connection supplies them.</p></Card>
      </div>
    </div>
  </div>;
}
