import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  HeartPulse,
  History,
  LockKeyhole,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Video,
} from "lucide-react";
import { Badge, Button, Card, DsSurface, type BadgeTone } from "@/components/ds";
import type { PortalDashboard as PortalDashboardData } from "@/lib/repositories/portal-repository";

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

function appointmentTone(status: string): BadgeTone {
  if (status === "COMPLETED") return "resolved";
  if (["CANCELLED", "NO_SHOW"].includes(status)) return "neutral";
  return "observing";
}

function formTone(status: string): BadgeTone {
  return status === "completed" ? "resolved" : "analyzing";
}

type NextStep = {
  eyebrow: string;
  title: string;
  detail: string;
  tone: BadgeTone;
};

export function PortalDashboard({ data, organizationName }: { data: PortalDashboardData; organizationName: string }) {
  const now = new Date();
  const pendingForms = data.forms.filter((form) => !["completed", "cancelled"].includes(form.status));
  const futureAppointments = [...data.appointments]
    .filter((appointment) => new Date(appointment.startsAt) >= now && !["CANCELLED", "NO_SHOW"].includes(appointment.status))
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const nextAppointment = futureAppointments[0];
  const recentRecords = data.records.slice(0, 6);
  const recentMessages = data.messages.slice(0, 5);
  const accessHistory = data.accessHistory.slice(0, 5);

  let nextStep: NextStep;
  if (pendingForms.length > 0) {
    nextStep = {
      eyebrow: "Needs you",
      title: `${pendingForms.length} ${pendingForms.length === 1 ? "form is" : "forms are"} waiting for you`,
      detail: "Your clinic has assigned paperwork that still needs to be completed. If you are unsure how to finish it, contact the office before your visit.",
      tone: "analyzing",
    };
  } else if (nextAppointment) {
    nextStep = {
      eyebrow: "Coming up",
      title: `${nextAppointment.type} on ${formatDate(nextAppointment.startsAt)}`,
      detail: `${nextAppointment.provider}${nextAppointment.telemedicine ? " · Telemedicine" : ""}. Your clinic will release any forms or instructions here when they are ready for you.",
      tone: "observing",
    };
  } else if (data.financial.balanceCents > 0) {
    nextStep = {
      eyebrow: "Account",
      title: `${formatMoney(data.financial.balanceCents)} balance showing`,
      detail: "This portal shows the amount your clinic has made available to you. Contact the office if you have a question about a statement or payment option.",
      tone: "mapping",
    };
  } else {
    nextStep = {
      eyebrow: "All clear",
      title: "Everything important is handled",
      detail: "There is nothing in your portal that needs action right now. New appointments, forms, messages, records, and balances will appear here when your clinic makes them available.",
      tone: "resolved",
    };
  }

  return (
    <DsSurface>
      <main
        className="min-h-screen"
        style={{ background: "var(--surface-paper-2)", color: "var(--text-on-paper)" }}
      >
        <header style={{ borderBottom: "var(--border-hair-light)", background: "var(--surface-paper)" }}>
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-8">
            <span
              className="grid size-11 shrink-0 place-items-center"
              style={{ background: "var(--aegean-900)", color: "var(--gold-300)", borderRadius: "var(--radius-md)" }}
            >
              <HeartPulse className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{organizationName}</p>
              <p
                className="mt-1 text-[10px] font-extrabold uppercase"
                style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}
              >
                Patient portal
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden items-center gap-2 text-xs sm:flex" style={{ color: "var(--text-on-paper-dim)" }}>
                <LockKeyhole className="size-4" aria-hidden="true" />
                Private patient session
              </span>
              <form action="/api/portal/auth/logout" method="post">
                <Button size="sm" type="submit" variant="outline">Sign out</Button>
              </form>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
          <section
            className="relative overflow-hidden p-7 text-white sm:p-10"
            style={{ background: "var(--obsidian)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)" }}
            aria-labelledby="portal-heading"
          >
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-70"
              style={{
                background: "radial-gradient(circle at 70% 28%, color-mix(in oklch, var(--cyan-500) 20%, transparent), transparent 36%), radial-gradient(circle at 72% 72%, color-mix(in oklch, var(--gold-500) 16%, transparent), transparent 30%)",
              }}
            />
            <div className="relative max-w-3xl">
              <p
                className="text-[10px] font-extrabold uppercase"
                style={{ color: "var(--cyan-400)", letterSpacing: "var(--tracking-wider)" }}
              >
                Welcome back
              </p>
              <h1
                id="portal-heading"
                className="mt-4 text-balance font-extrabold"
                style={{ fontSize: "var(--text-h1)", letterSpacing: "var(--tracking-tight)", lineHeight: "var(--leading-tight)" }}
              >
                {data.patient.displayName}, your next step is clear.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                Only information your care team has explicitly released to you appears here. Internal clinical drafts and staff-only records stay inside the clinic workspace.
              </p>
            </div>
          </section>

          <section className="mt-6" aria-labelledby="next-step-heading">
            <Card>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <span
                  className="grid size-12 shrink-0 place-items-center"
                  style={{ background: "var(--aegean-900)", color: "var(--cyan-400)", borderRadius: "var(--radius-md)" }}
                >
                  {pendingForms.length > 0 ? <ClipboardCheck className="size-5" aria-hidden="true" /> : nextAppointment ? <CalendarDays className="size-5" aria-hidden="true" /> : data.financial.balanceCents > 0 ? <ReceiptText className="size-5" aria-hidden="true" /> : <CheckCircle2 className="size-5" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={nextStep.tone}>{nextStep.eyebrow}</Badge>
                    <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>
                      Next for you
                    </p>
                  </div>
                  <h2 id="next-step-heading" className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {nextStep.title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: "var(--text-on-paper-dim)" }}>
                    {nextStep.detail}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <section className="mt-10" aria-labelledby="coming-up-heading">
            <SectionHeading eyebrow="Coming up" title="Your care timeline" id="coming-up-heading" />
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <Card>
                <div className="flex items-center gap-3">
                  <CalendarDays className="size-5" style={{ color: "var(--accent-signal)" }} aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-extrabold">Appointments</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>What your clinic currently has on the schedule.</p>
                  </div>
                </div>
                <div className="mt-5">
                  {data.appointments.length ? data.appointments.map((appointment) => (
                    <div
                      className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0"
                      style={{ borderTop: "var(--border-hair-light)" }}
                      key={appointment.id}
                    >
                      <span
                        className="grid size-10 shrink-0 place-items-center"
                        style={{ background: "var(--surface-paper-2)", color: "var(--accent-signal)", borderRadius: "var(--radius-md)" }}
                      >
                        {appointment.telemedicine ? <Video className="size-4" aria-hidden="true" /> : <CalendarDays className="size-4" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold">{appointment.type}</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>{formatDate(appointment.startsAt)} · {appointment.provider}</p>
                      </div>
                      <Badge tone={appointmentTone(appointment.status)}>{statusLabel(appointment.status)}</Badge>
                    </div>
                  )) : <PortalEmpty text="No appointments are available right now." />}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="size-5" style={{ color: "var(--accent-signal)" }} aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-extrabold">Forms</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>Paperwork your clinic has assigned to you.</p>
                  </div>
                </div>
                <div className="mt-5">
                  {data.forms.length ? data.forms.map((form) => (
                    <div
                      className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                      style={{ borderTop: "var(--border-hair-light)" }}
                      key={form.id}
                    >
                      <span
                        className="grid size-9 shrink-0 place-items-center"
                        style={{ background: "var(--surface-paper-2)", color: "var(--accent-signal)", borderRadius: "var(--radius-md)" }}
                      >
                        {form.status === "completed" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <ClipboardCheck className="size-4" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold">Patient form</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>{form.dueAt ? `Due ${formatDate(form.dueAt)}` : "No due date"}</p>
                      </div>
                      <Badge tone={formTone(form.status)}>{statusLabel(form.status)}</Badge>
                    </div>
                  )) : <PortalEmpty text="No forms are assigned to you." />}
                </div>
              </Card>
            </div>
          </section>

          <section className="mt-10" aria-labelledby="records-heading">
            <SectionHeading eyebrow="Released to you" title="Records and messages" id="records-heading" />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="flex items-center gap-3">
                  <FileCheck2 className="size-5" style={{ color: "var(--accent-signal)" }} aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-extrabold">Records</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>Only items explicitly released by your care team.</p>
                  </div>
                </div>
                <div className="mt-5">
                  {recentRecords.length ? recentRecords.map((record) => (
                    <article className="py-4 first:pt-0 last:pb-0" style={{ borderTop: "var(--border-hair-light)" }} key={`${record.kind}-${record.id}`}>
                      <div className="flex items-start gap-4">
                        <span
                          className="grid size-10 shrink-0 place-items-center"
                          style={{ background: "var(--surface-paper-2)", color: "var(--accent-premium)", borderRadius: "var(--radius-md)" }}
                        >
                          <FileText className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-extrabold">{record.title}</p>
                            <Badge tone="neutral">{record.kind}</Badge>
                          </div>
                          <p className="mt-2 line-clamp-3 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>{record.detail}</p>
                          <p className="mt-2 text-[10px] font-bold" style={{ color: "var(--text-on-paper-dim)" }}>Released {formatDate(record.releasedAt)}</p>
                        </div>
                      </div>
                    </article>
                  )) : <PortalEmpty text="Your clinic has not released any records yet." />}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <MessageCircle className="size-5" style={{ color: "var(--accent-signal)" }} aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-extrabold">Messages</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>Portal messages already recorded between you and the clinic.</p>
                  </div>
                </div>
                <div className="mt-5">
                  {recentMessages.length ? recentMessages.map((message) => (
                    <article className="py-4 first:pt-0 last:pb-0" style={{ borderTop: "var(--border-hair-light)" }} key={message.id}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={message.direction === "OUTBOUND" ? "observing" : "neutral"}>{message.direction === "OUTBOUND" ? "From your clinic" : "You"}</Badge>
                        <span className="text-[10px] font-bold" style={{ color: "var(--text-on-paper-dim)" }}>{formatDate(message.sentAt)}</span>
                      </div>
                      <p className="mt-3 line-clamp-4 text-sm leading-6">{message.body}</p>
                    </article>
                  )) : <PortalEmpty text="No portal messages are available yet." />}
                </div>
              </Card>
            </div>
          </section>

          <section className="mt-10 grid gap-4 lg:grid-cols-[.9fr_1.1fr]" aria-label="Account and privacy">
            <Card>
              <div className="flex items-center gap-3">
                <ReceiptText className="size-5" style={{ color: "var(--accent-signal)" }} aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-extrabold">Billing</h3>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>Amounts your clinic has made visible in your portal.</p>
                </div>
              </div>
              <p className="mt-6 text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>Current balance</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">{formatMoney(data.financial.balanceCents)}</p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>As of {formatDate(data.financial.asOf)}</p>
              <div className="mt-5">
                {data.financial.invoices.length ? data.financial.invoices.map((invoice) => (
                  <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0" style={{ borderTop: "var(--border-hair-light)" }} key={invoice.id}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold">Statement {invoice.number}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>{formatMoney(invoice.balanceCents)} remaining · due {formatDate(invoice.dueAt)}</p>
                    </div>
                    <Badge tone="neutral">{statusLabel(invoice.status)}</Badge>
                  </div>
                )) : <PortalEmpty text="No statements are available." />}
              </div>
            </Card>

            <Card dark>
              <div className="flex items-start gap-4">
                <span
                  className="grid size-11 shrink-0 place-items-center"
                  style={{ background: "var(--graphite)", color: "var(--gold-300)", borderRadius: "var(--radius-md)" }}
                >
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--cyan-400)", letterSpacing: "var(--tracking-wide)" }}>Privacy</p>
                  <h3 className="mt-2 text-xl font-extrabold">Your portal stays separate from clinic staff access.</h3>
                  <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                    Your patient session is limited to your own portal identity and information the clinic has released to you. Access to this portal is recorded.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <History className="size-4" style={{ color: "var(--cyan-400)" }} aria-hidden="true" />
                  <p className="text-sm font-extrabold">Recent access</p>
                </div>
                <div className="mt-3">
                  {accessHistory.length ? accessHistory.map((event) => (
                    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" style={{ borderTop: "var(--border-hair-dark)" }} key={event.id}>
                      <ShieldCheck className="size-4 shrink-0" style={{ color: "var(--status-resolved)" }} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold">{statusLabel(event.action.replace("portal.", ""))}</p>
                        <p className="mt-1 text-[10px]" style={{ color: "var(--text-secondary)" }}>{formatDate(event.createdAt)}</p>
                      </div>
                    </div>
                  )) : <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>No earlier portal access is recorded in this view.</p>}
                </div>
              </div>
            </Card>
          </section>

          <p className="mt-8 text-center text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>
            If you have an urgent medical concern, call 911 or go to the nearest emergency room. For routine questions, contact your clinic directly.
          </p>
        </div>
      </main>
    </DsSurface>
  );
}

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wider)" }}>{eyebrow}</p>
      <h2 id={id} className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
    </div>
  );
}

function PortalEmpty({ text }: { text: string }) {
  return <p className="py-5 text-sm" style={{ color: "var(--text-on-paper-dim)" }}>{text}</p>;
}
