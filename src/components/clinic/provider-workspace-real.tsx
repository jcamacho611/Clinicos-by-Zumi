import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarPlus, FileText, Stethoscope, UserCheck } from "lucide-react";
import { PageIntro, Person, SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Appointment, Encounter } from "@/lib/types";
import styles from "@/components/clinic/workspaces/provider-black-label.module.css";

type ProviderNextWork = {
  label: string;
  title: string;
  detail: string;
  href: string;
  action: string;
  encounterId: string | null;
};

export function ProviderWorkspaceReal({ appointments, encounters }: { appointments: Appointment[]; encounters: Encounter[] }) {
  const draftEncounters = encounters.filter((encounter) => encounter.status === "Draft");
  const reviewEncounters = encounters.filter((encounter) => encounter.status === "Ready for Review" || encounter.status === "Addendum Needed");
  const todayAppointments = appointments.filter((appointment) => appointment.date === "Today" && !["Completed", "Cancelled", "No Show", "Rescheduled"].includes(appointment.status));
  const readyForReview = encounters.filter((encounter) => encounter.status === "Ready for Review");
  const addendumNeeded = encounters.filter((encounter) => encounter.status === "Addendum Needed");

  const addendum = addendumNeeded[0];
  const review = readyForReview[0];
  const draft = draftEncounters[0];
  const todayAppointment = todayAppointments[0];
  const todayEncounter = todayAppointment ? encounters.find((encounter) => encounter.patientId === todayAppointment.patientId) : undefined;

  const nextWork: ProviderNextWork = addendum
    ? { label: "Addendum needed", title: addendum.patientName, detail: `${addendum.date} · ${addendum.type}`, href: `/encounters/${addendum.id}`, action: "Open addendum", encounterId: addendum.id }
    : review
      ? { label: "Ready for review", title: review.patientName, detail: `${review.date} · ${review.type}`, href: `/encounters/${review.id}`, action: "Review encounter", encounterId: review.id }
      : draft
        ? { label: "Resume draft", title: draft.patientName, detail: `${draft.date} · ${draft.type}`, href: `/encounters/${draft.id}`, action: "Resume Current Visit", encounterId: draft.id }
        : todayAppointment
          ? { label: "Today's visit", title: todayAppointment.patient, detail: `${todayAppointment.time} · ${todayAppointment.type}`, href: todayEncounter ? `/encounters/${todayEncounter.id}` : `/patients/${todayAppointment.patientId}`, action: todayEncounter ? "Open Current Visit" : "Open patient", encounterId: todayEncounter?.id ?? null }
          : { label: "Queue clear", title: "No encounter is waiting in this provider queue.", detail: "Open the encounter worklist or Tasks when you need deeper clinical follow-through.", href: "/encounters", action: "Open encounters", encounterId: null };

  return <div className={`${styles.stage} space-y-6`}>
    <PageIntro
      title="Clinical work, prioritized from stored records."
      description="Appointments and encounter state drive this provider workspace. External results and messages appear only when their real governed repositories are connected here."
      action={<Button asChild variant="secondary"><Link href="/encounters">Open all encounters <ArrowRight className="size-4" /></Link></Button>}
    />

    <section className={styles.workstage} data-provider-workstage aria-labelledby="provider-next-work-title">
      <div className={styles.workstageMain}>
        <p className={styles.workstageLabel}>Next clinical work</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">{nextWork.label}</p>
            <h2 id="provider-next-work-title" className={styles.workstageTitle}>{nextWork.title}</h2>
            <p className={styles.workstageDetail}>{nextWork.detail}</p>
          </div>
          <Button asChild variant="primary"><Link href={nextWork.href}>{nextWork.action} <ArrowRight className="size-4" /></Link></Button>
        </div>
      </div>
      <div className={styles.contextStrip} aria-label="Provider work context">
        <div className={styles.contextItem}><p className={styles.contextLabel}>Today’s visits</p><p className={styles.contextValue}>{todayAppointments.length}</p></div>
        <div className={styles.contextItem}><p className={styles.contextLabel}>Draft notes</p><p className={styles.contextValue}>{draftEncounters.length}</p></div>
        <div className={styles.contextItem}><p className={styles.contextLabel}>Ready for review</p><p className={styles.contextValue}>{readyForReview.length}</p></div>
        <div className={styles.contextItem}><p className={styles.contextLabel}>Addendum needed</p><p className={styles.contextValue}>{addendumNeeded.length}</p></div>
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
      <SectionCard title="Encounter review queue" description="Only stored encounters requiring review or addendum work appear here." action={<Link className="text-xs font-extrabold text-[var(--k-accent)]" href="/encounters">Open all encounters</Link>}>
        <div className="divide-y divide-slate-100">{reviewEncounters.map((encounter) => <Link className="flex min-h-16 items-center gap-4 p-5 transition hover:bg-slate-50" href={`/encounters/${encounter.id}`} key={encounter.id}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${encounter.status === "Addendum Needed" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{encounter.status === "Addendum Needed" ? <AlertTriangle className="size-4" /> : <FileText className="size-4" />}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-950">{encounter.patientName}</p><p className="mt-1 text-xs text-slate-400">{encounter.date} · {encounter.type} · {encounter.provider}</p></div><StatusBadge status={encounter.status} /><ArrowRight className="size-4 text-slate-300" /></Link>)}{reviewEncounters.length === 0 && <p className="p-5 text-sm text-slate-500">No encounters currently require review or addendum work.</p>}</div>
      </SectionCard>

      <SectionCard title="Today’s clinical panel" description="Appointments labeled Today from each appointment location timezone, linked to the patient or existing encounter.">
        <div className="space-y-1 p-3">{todayAppointments.map((appointment, index) => { const encounter = encounters.find((item) => item.patientId === appointment.patientId); return <Link className="block rounded-2xl border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50" href={encounter ? `/encounters/${encounter.id}` : `/patients/${appointment.patientId}`} key={appointment.id}><div className="flex items-center gap-3"><Person color={index === 0 ? "rose" : "teal"} detail={`${appointment.time} · ${appointment.type}`} initials={appointment.initials} name={appointment.patient} /><StatusBadge status={appointment.status} /></div><div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--k-line)] bg-[var(--k-line)] text-center"><div className="bg-[var(--k-public-raised)] p-2.5"><p className="text-xs font-bold text-[var(--k-muted)]">READINESS</p><p className="mt-1 text-xs font-extrabold text-[var(--k-text)]">{appointment.formsComplete && appointment.insuranceVerified ? "Ready" : "Review"}</p></div><div className="bg-[var(--k-public-raised)] p-2.5"><p className="text-xs font-bold text-[var(--k-muted)]">NOTE</p><p className="mt-1 text-xs font-extrabold text-[var(--k-text)]">{encounter?.status ?? "Not started"}</p></div></div></Link>; })}{todayAppointments.length === 0 && <p className="p-3 text-sm text-slate-500">No active appointments are labeled Today.</p>}</div>
      </SectionCard>
    </div>

    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-950">Clinical follow-through belongs in the tenant task queue.</p><p className="mt-1 text-xs leading-5 text-slate-500">Klinikos does not invent provider tasks on this surface. Use the real Tasks workspace for owned follow-through.</p></div><Button asChild variant="secondary"><Link href="/tasks">Open tasks <ArrowRight className="size-4" /></Link></Button></Card>
  </div>;
}
