import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  History,
  LockKeyhole,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortalDashboard as PortalDashboardData } from "@/lib/repositories/portal-repository";
import styles from "./portal-black-label.module.css";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "Date pending";
}

function statusLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PortalDashboard({ data, organizationName }: { data: PortalDashboardData; organizationName: string }) {
  const pendingForms = data.forms.filter((form) => !["completed", "cancelled"].includes(form.status));
  const nextAppointment = [...data.appointments]
    .filter((appointment) => new Date(appointment.startsAt) >= new Date() && !["CANCELLED", "NO_SHOW"].includes(appointment.status))
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))[0];

  return <main className={styles.portal}>
    <header className={styles.header}>
      <div className={`${styles.headerInner} flex items-center gap-3`}>
        <span className={styles.brandMark}><ShieldCheck className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--k-text)]">{organizationName}</p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[.14em] text-[var(--k-muted)]">Private patient portal</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge tone="slate"><LockKeyhole className="mr-1 size-3" /> Patient-only session</Badge>
          <form action="/api/portal/auth/logout" method="post"><Button size="sm" type="submit" variant="secondary">Sign out</Button></form>
        </div>
      </div>
    </header>

    <div className={styles.main}>
      <section className={styles.nextStep} data-patient-next-step aria-labelledby="portal-next-step-title">
        <div className={styles.nextStepMain}>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[var(--k-accent)]">Welcome back, {data.patient.displayName}</p>
          <h1 id="portal-next-step-title" className="mt-3 text-3xl font-semibold tracking-[-.05em] text-[var(--k-text)] sm:text-4xl">Your next step</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--k-muted)]">Only records explicitly released by your care team appear here. Clinical drafts and internal clinic files stay inside the clinic workspace.</p>

          {nextAppointment ? <div className={styles.appointment}>
            <span className={styles.appointmentIcon}>{nextAppointment.telemedicine ? <Video className="size-5" aria-hidden="true" /> : <CalendarDays className="size-5" aria-hidden="true" />}</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[var(--k-muted)]">Next appointment</p>
              <p className="mt-1 text-xl font-semibold tracking-[-.03em] text-[var(--k-text)]">{nextAppointment.type}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--k-muted)]">{formatDate(nextAppointment.startsAt)} · {nextAppointment.provider}</p>
            </div>
            <Badge tone={nextAppointment.status === "COMPLETED" ? "teal" : "sky"}>{statusLabel(nextAppointment.status)}</Badge>
          </div> : <div className={styles.appointment}>
            <span className={styles.appointmentIcon}><CalendarDays className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[var(--k-muted)]">Next appointment</p>
              <p className="mt-1 text-lg font-semibold text-[var(--k-text)]">No visit is currently scheduled.</p>
              <p className="mt-1 text-sm leading-6 text-[var(--k-muted)]">Contact the clinic if you need to arrange care.</p>
            </div>
          </div>}
        </div>

        <div className={styles.summary} aria-label="Portal summary">
          <div className={styles.summaryItem}><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">Forms to finish</p><p className="mt-1 text-lg font-semibold tabular-nums text-[var(--k-text)]">{pendingForms.length}</p></div>
          <div className={styles.summaryItem}><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">Released information</p><p className="mt-1 text-lg font-semibold tabular-nums text-[var(--k-text)]">{data.records.length}</p></div>
          <div className={styles.summaryItem}><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">Current balance</p><p className="mt-1 text-lg font-semibold tabular-nums text-[var(--k-text)]">{formatMoney(data.financial.balanceCents)}</p></div>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <div className={styles.stack}>
          <PortalPanel icon={<CalendarDays className="size-4" />} title="Appointments" subtitle="Your clinic schedule, in one place.">
            {data.appointments.length ? data.appointments.map((appointment) => <div className={`${styles.row} flex flex-wrap items-center gap-4`} key={appointment.id}>
              <span className={styles.rowIcon}>{appointment.telemedicine ? <Video className="size-4" aria-hidden="true" /> : <CalendarDays className="size-4" aria-hidden="true" />}</span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{appointment.type}</p><p className="mt-1 text-xs leading-5 text-[var(--k-muted)]">{formatDate(appointment.startsAt)} · {appointment.provider}</p></div>
              <Badge tone={appointment.status === "COMPLETED" ? "teal" : "sky"}>{statusLabel(appointment.status)}</Badge>
            </div>) : <PortalEmpty text="No appointments are available." />}
          </PortalPanel>

          <PortalPanel icon={<FileText className="size-4" />} title="Released information" subtitle="Every item below has an explicit clinic release decision.">
            <div className="border-b border-[var(--k-line)] p-5">
              <a className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-public-raised)] px-4 text-xs font-semibold text-[var(--k-text)]" href="/api/portal/records/snapshot"><Download className="size-4" aria-hidden="true" />Export portal snapshot</a>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-[var(--k-muted)]">Downloads a portable JSON snapshot of information currently available in this portal. It is not represented as your complete medical record or complete designated record set. Contact the clinic for a complete records-access or transfer request.</p>
            </div>
            {data.records.length ? data.records.map((record) => <article className={styles.row} key={`${record.kind}-${record.id}`}>
              <div className="flex items-start gap-4"><span className={styles.rowIcon}><FileCheck2 className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-[var(--k-text)]">{record.title}</p><Badge tone="slate">{record.kind}</Badge></div><p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--k-muted)]">{record.detail}</p><p className="mt-2 text-xs font-semibold text-[var(--k-muted)]">Released {formatDate(record.releasedAt)}</p></div></div>
            </article>) : <PortalEmpty text="Your clinic has not released any information yet." />}
          </PortalPanel>
        </div>

        <div className={styles.stack}>
          <PortalPanel icon={<ClipboardCheck className="size-4" />} title="Forms" subtitle="Forms assigned to your patient identity.">
            {data.forms.length ? data.forms.map((form) => <div className={`${styles.row} flex items-center gap-3`} key={form.id}>
              <span className={styles.rowIcon}>{form.status === "completed" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <ClipboardCheck className="size-4" aria-hidden="true" />}</span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">Patient form</p><p className="mt-1 text-xs text-[var(--k-muted)]">{form.dueAt ? `Due ${formatDate(form.dueAt)}` : "No due date"}</p></div>
              <Badge tone={form.status === "completed" ? "teal" : "amber"}>{statusLabel(form.status)}</Badge>
            </div>) : <PortalEmpty text="No forms are assigned." />}
          </PortalPanel>

          <PortalPanel icon={<ReceiptText className="size-4" />} title="Billing" subtitle="Amounts are shown without placing health details in payment descriptions.">
            <div className={styles.balance}><p className="text-xs font-extrabold uppercase tracking-[.13em] text-[var(--k-muted)]">Balance due</p><p className={`${styles.balanceValue} mt-2 text-3xl font-semibold text-[var(--k-text)]`}>{formatMoney(data.financial.balanceCents)}</p><p className="mt-2 text-xs text-[var(--k-muted)]">As of {formatDate(data.financial.asOf)}</p></div>
            {data.financial.invoices.map((invoice) => <div className={`${styles.row} flex items-center gap-3`} key={invoice.id}><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">Statement {invoice.number}</p><p className="mt-1 text-xs tabular-nums text-[var(--k-muted)]">{formatMoney(invoice.balanceCents)} remaining · due {formatDate(invoice.dueAt)}</p></div><Badge tone="sky">{statusLabel(invoice.status)}</Badge></div>)}
          </PortalPanel>

          <PortalPanel icon={<History className="size-4" />} title="Access history" subtitle="See when this portal identity accessed your information.">
            {data.accessHistory.slice(0, 8).map((event) => <div className={`${styles.row} flex items-center gap-3`} key={event.id}><ShieldCheck className="size-4 shrink-0 text-[var(--k-accent)]" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{statusLabel(event.action.replace("portal.", ""))}</p><p className="mt-1 text-xs text-[var(--k-muted)]">{formatDate(event.createdAt)}</p></div></div>)}
          </PortalPanel>

          <div className={styles.help}>
            <div className="flex items-start gap-4"><MessageCircle className="mt-0.5 size-5 shrink-0 text-[var(--k-premium)]" aria-hidden="true" /><div><p className="text-sm font-semibold text-[var(--k-text)]">Need help from the office?</p><p className="mt-2 text-xs leading-6 text-[var(--k-muted)]">Use the contact information your clinic has already provided for scheduling, records, billing, or other non-urgent questions. If this is a medical emergency, call 911 or go to the nearest emergency department.</p></div></div>
          </div>
        </div>
      </div>
    </div>
  </main>;
}

function PortalPanel({ children, icon, subtitle, title }: { children: ReactNode; icon: ReactNode; subtitle: string; title: string }) {
  return <section className={styles.panel}><div className={styles.panelHeader}><span className={styles.panelIcon}>{icon}</span><div><h2 className="text-base font-semibold tracking-[-.02em] text-[var(--k-text)]">{title}</h2><p className="mt-1 text-xs leading-5 text-[var(--k-muted)]">{subtitle}</p></div></div>{children}</section>;
}

function PortalEmpty({ text }: { text: string }) {
  return <p className="p-5 text-sm text-[var(--k-muted)]">{text}</p>;
}
