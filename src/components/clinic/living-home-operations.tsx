"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarClock, CheckCircle2, CircleAlert, X } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ds";
import type { PathGuidanceView } from "@/components/clinic/path-next-action";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { HomeOpportunity } from "@/lib/home/operating-rail";
import { resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import type { LivingPathSignal } from "@/lib/orchestration/path-signal-repository";
import { getKlinikosPath } from "@/lib/paths/catalog";
import type { Appointment } from "@/lib/types";

type AttentionItem = {
  appointment: Appointment;
  reasons: string[];
};

type RibbonBlock = {
  appointment: Appointment;
  left: number;
  width: number;
  lane: number;
  tone: BadgeTone;
};

type RibbonModel = {
  min: number;
  max: number;
  laneCount: number;
  blocks: RibbonBlock[];
};

const terminalStatuses = new Set<Appointment["status"]>(["Completed", "Cancelled", "No Show"]);

function selectDay(appointments: Appointment[]) {
  if (!appointments.length) return [];
  const today = appointments.filter((appointment) => appointment.date === "Today");
  if (today.length) return today;
  const firstActive = appointments.find((appointment) => !terminalStatuses.has(appointment.status));
  const day = firstActive?.date ?? appointments[appointments.length - 1]?.date;
  return appointments.filter((appointment) => appointment.date === day);
}

export function attentionReasons(appointment: Appointment, role: ClinicRole) {
  if (appointment.status === "Cancelled") return [];
  const reasons: string[] = [];
  if (appointment.status === "Requested" || appointment.status === "Pending Confirmation") {
    reasons.push("Confirmation still needs to be recorded.");
  }
  if (appointment.status === "No Show") {
    reasons.push("The visit is recorded as a no-show and may need follow-up.");
  }
  if (!appointment.formsComplete && appointment.status !== "No Show") {
    reasons.push("Required intake is incomplete.");
  }
  if (
    !appointment.insuranceVerified
    && appointment.status !== "No Show"
    && (role === "clinic_owner" || role === "administrator" || role === "front_desk" || role === "biller")
  ) {
    reasons.push("Coverage has not been verified.");
  }
  if (
    appointment.paymentDue > 0
    && (role === "clinic_owner" || role === "administrator" || role === "front_desk" || role === "biller")
  ) {
    reasons.push(`$${appointment.paymentDue.toFixed(2)} remains due.`);
  }
  return reasons;
}

function attentionTone(appointment: Appointment, role: ClinicRole): BadgeTone {
  const reasons = attentionReasons(appointment, role);
  if (!reasons.length) return appointment.status === "Completed" ? "resolved" : "observing";
  return appointment.status === "No Show" ? "signal" : "analyzing";
}

function attentionColor(appointment: Appointment, role: ClinicRole) {
  return attentionTone(appointment, role) === "signal" ? "var(--status-signal)" : "var(--status-analyzing)";
}

function relativeTime(iso: string, nowMs: number | null) {
  if (nowMs === null) return "recently";
  const delta = nowMs - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(delta / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function guidanceTone(state: PathGuidanceView["state"]): BadgeTone {
  if (state === "blocked") return "signal";
  if (state === "review_required") return "analyzing";
  if (state === "waiting") return "observing";
  if (state === "completed") return "resolved";
  return "mapping";
}

function guidanceLabel(state: PathGuidanceView["state"]) {
  if (state === "blocked") return "Needs attention";
  if (state === "review_required") return "Ready for review";
  if (state === "waiting") return "Waiting";
  if (state === "completed") return "Completed";
  if (state === "available") return "Ready";
  return "Recommended";
}

function buildRibbon(appointments: Appointment[], role: ClinicRole): RibbonModel | null {
  if (!appointments.length) return null;
  const sorted = [...appointments].sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const starts = sorted.map((appointment) => new Date(appointment.startsAt).getTime()).filter(Number.isFinite);
  const ends = sorted.map((appointment) => new Date(appointment.endsAt).getTime()).filter(Number.isFinite);
  if (!starts.length || !ends.length) return null;

  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const span = Math.max(max - min, 60 * 60 * 1000);
  const laneRightEdges: number[] = [];
  const blocks: RibbonBlock[] = [];

  for (const appointment of sorted) {
    const start = new Date(appointment.startsAt).getTime();
    const end = new Date(appointment.endsAt).getTime();
    const left = ((start - min) / span) * 100;
    const width = Math.max(((end - start) / span) * 100, 4);
    const right = Math.min(100, left + width);
    let lane = laneRightEdges.findIndex((edge) => edge <= left - 0.5);
    if (lane < 0) {
      lane = laneRightEdges.length;
      laneRightEdges.push(right);
    } else {
      laneRightEdges[lane] = right;
    }
    blocks.push({ appointment, left, width, lane, tone: attentionTone(appointment, role) });
  }

  return { min, max, laneCount: Math.max(1, laneRightEdges.length), blocks };
}

/**
 * The inline workspace for a selected visit.
 *
 * Selecting a visit anywhere on Home opens it here rather than navigating to another
 * route. Home stays the operating surface: the schedule, the exception list and the
 * next block all stay on screen and in context while the selected visit expands in
 * place. Every field shown is a field the server already loaded for this view — the
 * panel reads state, it does not synthesize it — and the one control that leaves Home
 * is an explicit link to the real record.
 */
function FocusPanel({
  appointment,
  canOpenPatientRecord,
  onDismiss,
  role,
}: {
  appointment: Appointment;
  canOpenPatientRecord: boolean;
  onDismiss: () => void;
  role: ClinicRole;
}) {
  const reasons = attentionReasons(appointment, role);
  const showsMoney = role === "clinic_owner" || role === "administrator" || role === "front_desk" || role === "biller";
  const headingId = `focus-${appointment.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="mt-7 rounded-[18px] border border-[var(--line-dark)] bg-[var(--surface-raised)] px-5 py-7 sm:px-7"
    >
      <div className="flex flex-wrap items-start gap-4">
        <span className="mt-2 size-2 shrink-0 rounded-full" style={{ background: attentionColor(appointment, role) }} />
        <div className="min-w-0 flex-1">
          <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">
            {appointment.date} · {appointment.time}–{appointment.endTime}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-[var(--tracking-tight)]" id={headingId}>
            {appointment.patient}
          </h3>
          <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
            {appointment.type} · {appointment.provider} · {appointment.telemedicine ? "Telemedicine" : appointment.location}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={attentionTone(appointment, role)}>{reasons.length ? "Needs you" : appointment.status}</Badge>
          <button
            aria-label="Close this visit"
            className="grid size-9 place-items-center rounded-full border border-[var(--line-dark)] text-[var(--text-secondary)] transition-opacity hover:opacity-75"
            onClick={onDismiss}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_1fr] lg:gap-12">
        <div>
          <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Why</p>
          {reasons.length ? (
            <div className="mt-4 space-y-3">
              {reasons.map((reason) => (
                <p className="text-xs leading-6 text-[var(--text-secondary)]" key={reason}>{reason}</p>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs leading-6 text-[var(--text-secondary)]">
              Nothing on this visit is currently waiting on a person. It is here because you opened it.
            </p>
          )}

          <div className="mt-6 grid gap-2 text-[var(--text-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)] sm:grid-cols-3">
            <span>Source · schedule</span>
            <span>Observed · {appointment.time}</span>
            <span>Evidence · direct record</span>
          </div>
        </div>

        <div className="border-t border-[var(--line-dark)] pt-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
          <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Readiness</p>
          <dl className="mt-4 divide-y divide-[var(--line-dark)]">
            <div className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
              <dt className="text-xs text-[var(--text-secondary)]">Status</dt>
              <dd className="text-xs font-semibold">{appointment.status}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-xs text-[var(--text-secondary)]">Intake</dt>
              <dd className="text-xs font-semibold">{appointment.formsComplete ? "Complete" : "Incomplete"}</dd>
            </div>
            {showsMoney ? (
              <>
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-xs text-[var(--text-secondary)]">Coverage</dt>
                  <dd className="text-xs font-semibold">{appointment.insuranceVerified ? "Verified" : "Not verified"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-xs text-[var(--text-secondary)]">Balance</dt>
                  <dd className="text-xs font-semibold">${appointment.paymentDue.toFixed(2)}</dd>
                </div>
              </>
            ) : null}
          </dl>

          {canOpenPatientRecord ? (
            <Link
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--accent-intelligence)] px-5 py-3 text-xs font-semibold text-[var(--accent-intelligence)] transition-opacity hover:opacity-85"
              href={`/patients/${appointment.patientId}`}
            >
              Open the full record <ArrowUpRight className="size-3.5" />
            </Link>
          ) : (
            <p className="mt-6 text-xs leading-6 text-[var(--text-secondary)]">
              Your role can see this visit on the schedule but cannot open the patient record.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Everything Home shows when it is not working on a request: the real schedule, the
 * real exceptions, the work already in progress, and the single real opportunity.
 *
 * This is deliberately separate from the composer above it. The composer drives a
 * transient working state; this is the standing operating picture, and it is built
 * only from records the server already loaded.
 */
export function LivingHomeOperations({
  appointments,
  canOpenPatientRecord,
  guidance,
  onCount,
  opportunity,
  paths,
  recentSignals,
  role,
}: {
  appointments: Appointment[];
  canOpenPatientRecord: boolean;
  guidance: PathGuidanceView[];
  onCount?: (attentionCount: number) => void;
  opportunity: HomeOpportunity | null;
  paths: PersistedPathSnapshot[];
  recentSignals: LivingPathSignal[];
  role: ClinicRole;
}) {
  const [focusedAppointmentId, setFocusedAppointmentId] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(paths[0]?.instanceId ?? null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const focusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => setNowMs(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const dayAppointments = useMemo(() => selectDay(appointments), [appointments]);
  const attentionItems = useMemo<AttentionItem[]>(
    () => dayAppointments
      .map((appointment) => ({ appointment, reasons: attentionReasons(appointment, role) }))
      .filter((item) => item.reasons.length > 0),
    [dayAppointments, role],
  );
  const completedAppointments = useMemo(
    () => dayAppointments.filter((appointment) => appointment.status === "Completed"),
    [dayAppointments],
  );
  const upcomingAppointments = useMemo(
    () => dayAppointments.filter((appointment) => !terminalStatuses.has(appointment.status)).slice(0, 4),
    [dayAppointments],
  );
  const ribbon = useMemo(() => buildRibbon(dayAppointments, role), [dayAppointments, role]);
  const focusedAppointment = useMemo(
    () => dayAppointments.find((appointment) => appointment.id === focusedAppointmentId) ?? null,
    [dayAppointments, focusedAppointmentId],
  );

  useEffect(() => {
    onCount?.(attentionItems.length);
  }, [attentionItems.length, onCount]);

  // Selecting a visit from the exception list or the next block scrolls the ribbon's
  // inline workspace into view, so the surface visibly transforms instead of quietly
  // changing something the reader cannot see from where they clicked.
  useEffect(() => {
    if (!focusedAppointmentId) return;
    focusRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusedAppointmentId]);

  const activeSnapshot = useMemo(
    () => paths.find((path) => path.instanceId === selectedInstanceId) ?? paths[0] ?? null,
    [paths, selectedInstanceId],
  );
  const activeGuidance = useMemo(
    () => guidance.find((item) => item.instanceId === activeSnapshot?.instanceId) ?? null,
    [guidance, activeSnapshot?.instanceId],
  );
  const activeDefinition = activeSnapshot ? getKlinikosPath(activeSnapshot.pathId) : null;
  const activeRuntime = activeSnapshot
    ? resolvePathRuntime({ pathId: activeSnapshot.pathId, snapshot: activeSnapshot })
    : null;

  const nowPosition = ribbon && nowMs !== null && nowMs >= ribbon.min && nowMs <= ribbon.max
    ? ((nowMs - ribbon.min) / Math.max(ribbon.max - ribbon.min, 1)) * 100
    : null;
  const highRiskAttention = attentionItems.some(({ appointment }) => appointment.status === "No Show");

  function focusAppointment(appointmentId: string) {
    setFocusedAppointmentId((current) => (current === appointmentId ? null : appointmentId));
  }

  return (
    <>
      <section className="mt-16" aria-labelledby="day-ribbon-title">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Day ribbon</p>
            <h2 className="mt-2 text-2xl font-light tracking-[var(--tracking-tight)]" id="day-ribbon-title">
              {dayAppointments[0]?.date ?? "Current schedule"}
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{dayAppointments.length} {dayAppointments.length === 1 ? "visit" : "visits"} in view</p>
        </div>

        {ribbon ? (
          <>
            <div
              className="relative mt-7 hidden overflow-hidden rounded-[18px] border border-[var(--line-dark)] md:block"
              style={{ height: `${ribbon.laneCount * 72 + 32}px` }}
            >
              {ribbon.blocks.map(({ appointment, left, width, lane, tone }) => (
                <button
                  aria-expanded={focusedAppointmentId === appointment.id}
                  className={`absolute h-14 overflow-hidden rounded-xl border px-3 py-2 text-left transition-opacity hover:opacity-85 focus:z-30 ${
                    focusedAppointmentId === appointment.id ? "border-[var(--accent-intelligence)]" : "border-[var(--line-dark)]"
                  }`}
                  key={appointment.id}
                  onClick={() => focusAppointment(appointment.id)}
                  style={{
                    left: `${left}%`,
                    top: `${20 + lane * 72}px`,
                    width: `${width}%`,
                    minWidth: "var(--space-8)",
                    background: tone === "signal"
                      ? "color-mix(in oklch, var(--status-signal) 18%, var(--surface-raised))"
                      : tone === "analyzing"
                        ? "color-mix(in oklch, var(--status-analyzing) 16%, var(--surface-raised))"
                        : "var(--surface-raised)",
                  }}
                  type="button"
                >
                  <span className="block truncate text-xs font-semibold">{appointment.time}</span>
                  <span className="mt-1 block truncate text-[var(--text-micro)] text-[var(--text-secondary)]">{appointment.initials} · {appointment.status}</span>
                </button>
              ))}
              {nowPosition !== null ? (
                <div className="absolute inset-y-0 z-20 w-px bg-[var(--accent-intelligence)] shadow-[var(--glow-cyan)]" style={{ left: `${nowPosition}%` }}>
                  <span className="absolute left-2 top-1 text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">Now</span>
                </div>
              ) : null}
            </div>

            <div className="mt-6 divide-y divide-[var(--line-dark)] overflow-hidden rounded-[18px] border border-[var(--line-dark)] px-4 md:hidden">
              {dayAppointments.slice(0, 5).map((appointment) => {
                const reasons = attentionReasons(appointment, role);
                return (
                  <button
                    aria-expanded={focusedAppointmentId === appointment.id}
                    className="flex w-full items-center gap-4 py-4 text-left"
                    key={appointment.id}
                    onClick={() => focusAppointment(appointment.id)}
                    type="button"
                  >
                    <span className="w-20 shrink-0 text-sm font-semibold">{appointment.time}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{appointment.patient}</span>
                      <span className="mt-1 block truncate text-[var(--text-micro)] text-[var(--text-secondary)]">{appointment.type} · {appointment.status}</span>
                    </span>
                    <Badge tone={attentionTone(appointment, role)}>{reasons.length ? "Needs you" : appointment.status}</Badge>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mt-7 rounded-[18px] border border-[var(--line-dark)] px-6 py-8">
            <p className="text-sm font-semibold">No scheduled visits are in this view.</p>
            <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">Klinikos will keep this quiet until there is something useful to show.</p>
          </div>
        )}

        <div ref={focusRef}>
          {focusedAppointment ? (
            <FocusPanel
              appointment={focusedAppointment}
              canOpenPatientRecord={canOpenPatientRecord}
              onDismiss={() => setFocusedAppointmentId(null)}
              role={role}
            />
          ) : null}
        </div>
      </section>

      <div className="mt-16 grid gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
        <section aria-labelledby="needs-you-title">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Needs you</p>
              <h2 className="mt-2 text-2xl font-light tracking-[var(--tracking-tight)]" id="needs-you-title">Exceptions, not noise.</h2>
            </div>
            <CircleAlert className="size-5" style={{ color: highRiskAttention ? "var(--status-signal)" : "var(--status-analyzing)" }} />
          </div>

          {attentionItems.length ? (
            <div className="mt-7 divide-y divide-[var(--line-dark)] overflow-hidden rounded-[18px] border border-[var(--line-dark)] px-5">
              {attentionItems.slice(0, 5).map(({ appointment, reasons }) => (
                <button
                  aria-expanded={focusedAppointmentId === appointment.id}
                  className="flex w-full items-start gap-4 py-5 text-left"
                  key={appointment.id}
                  onClick={() => focusAppointment(appointment.id)}
                  type="button"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: attentionColor(appointment, role) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{appointment.patient} · {appointment.time}</span>
                    <span className="mt-2 block text-xs leading-6 text-[var(--text-secondary)]">{reasons[0]}</span>
                  </span>
                  <span className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">Why</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-[18px] border border-[var(--line-dark)] px-6 py-8">
              <CheckCircle2 className="size-5 text-[var(--status-resolved)]" />
              <p className="mt-4 text-sm font-semibold">Everything important is handled.</p>
              <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">No schedule readiness exception needs a person in this view.</p>
            </div>
          )}
        </section>

        <section aria-labelledby="continue-title">
          <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Continue</p>
          <h2 className="mt-2 text-2xl font-light tracking-[var(--tracking-tight)]" id="continue-title">Pick up where the work stopped.</h2>

          {activeDefinition && activeRuntime && activeSnapshot ? (
            <div className="mt-7 rounded-[18px] border border-[var(--line-dark)] px-6 py-7">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={activeGuidance ? guidanceTone(activeGuidance.state) : "observing"}>
                  {activeGuidance ? guidanceLabel(activeGuidance.state) : "In progress"}
                </Badge>
                <span className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">
                  {Math.round(activeRuntime.progress * 100)}% complete
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-[var(--tracking-tight)]">{activeDefinition.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{activeSnapshot.goal}</p>
              <div className="mt-6 h-1 overflow-hidden rounded-full bg-[var(--line-dark)]">
                <div className="h-full rounded-full bg-[var(--accent-intelligence)]" style={{ width: `${Math.max(4, Math.round(activeRuntime.progress * 100))}%` }} />
              </div>

              {activeGuidance ? (
                <div className="mt-6 border-l border-[var(--line-dark)] pl-5">
                  <p className="text-sm font-semibold">{activeGuidance.title}</p>
                  <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">{activeGuidance.reason}</p>
                  {activeGuidance.blockers.slice(0, 2).map((blocker) => (
                    <p className="mt-3 text-xs leading-6 text-[var(--status-analyzing)]" key={blocker.code}>{blocker.title}: {blocker.explanation}</p>
                  ))}
                </div>
              ) : null}

              <Link
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--accent-intelligence)] px-5 py-3 text-xs font-semibold text-[var(--accent-intelligence)] transition-opacity hover:opacity-85"
                href={activeGuidance?.href ?? `/paths/${activeDefinition.id}`}
              >
                Continue <ArrowRight className="size-3.5" />
              </Link>

              {paths.length > 1 ? (
                <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 border-t border-[var(--line-dark)] pt-5">
                  {paths.slice(0, 4).map((path) => {
                    const definition = getKlinikosPath(path.pathId);
                    if (!definition) return null;
                    return (
                      <button
                        className={`min-h-11 text-xs font-semibold transition-opacity hover:opacity-85 ${path.instanceId === activeSnapshot.instanceId ? "text-[var(--accent-intelligence)]" : "text-[var(--text-secondary)]"}`}
                        key={path.instanceId}
                        onClick={() => setSelectedInstanceId(path.instanceId)}
                        type="button"
                      >
                        {definition.title}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-7 rounded-[18px] border border-[var(--line-dark)] px-6 py-8">
              <p className="text-sm font-semibold">Nothing is waiting for you to resume.</p>
              <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">Use the command above when you want Klinikos to organize a new outcome.</p>
            </div>
          )}
        </section>
      </div>

      <div className="mt-16 grid gap-10 rounded-[18px] border border-[var(--line-dark)] px-6 py-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--line-dark)]">
        <section className="lg:pr-8" aria-labelledby="handled-title">
          <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Already handled</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[var(--tracking-tight)]" id="handled-title">Work that moved.</h2>
          <div className="mt-5 space-y-4">
            {recentSignals.slice(0, 3).map((signal) => (
              <Link className="block border-l border-[var(--status-resolved)] pl-4" href={`/paths/${signal.pathId}`} key={signal.id}>
                <span className="block text-xs font-semibold">{signal.label}</span>
                <span className="mt-1 block text-[var(--text-micro)] text-[var(--text-secondary)]">{relativeTime(signal.occurredAt, nowMs)}</span>
              </Link>
            ))}
            {!recentSignals.length && completedAppointments.length ? (
              <p className="text-xs leading-6 text-[var(--text-secondary)]">{completedAppointments.length} {completedAppointments.length === 1 ? "visit has" : "visits have"} completed in this schedule view.</p>
            ) : null}
            {!recentSignals.length && !completedAppointments.length ? (
              <p className="text-xs leading-6 text-[var(--text-secondary)]">No recent completed work is recorded here yet.</p>
            ) : null}
          </div>
        </section>

        <section className="lg:px-8" aria-labelledby="coming-up-title">
          <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Coming up</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[var(--tracking-tight)]" id="coming-up-title">The next block.</h2>
          <div className="mt-5 divide-y divide-[var(--line-dark)]">
            {upcomingAppointments.slice(0, 3).map((appointment) => (
              <button
                aria-expanded={focusedAppointmentId === appointment.id}
                className="flex w-full items-start gap-4 py-3 text-left first:pt-0"
                key={appointment.id}
                onClick={() => focusAppointment(appointment.id)}
                type="button"
              >
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-[var(--accent-signal)]" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">{appointment.time} · {appointment.patient}</span>
                  <span className="mt-1 block truncate text-[var(--text-micro)] text-[var(--text-secondary)]">{appointment.type}</span>
                </span>
              </button>
            ))}
            {!upcomingAppointments.length ? <p className="text-xs leading-6 text-[var(--text-secondary)]">Nothing else is scheduled in this view.</p> : null}
          </div>
        </section>

        <section className="lg:pl-8" aria-labelledby="opportunity-title">
          <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Opportunity</p>
          {opportunity ? (
            <>
              <h2 className="mt-2 text-lg font-semibold tracking-[var(--tracking-tight)]" id="opportunity-title">{opportunity.title}</h2>
              <p className="mt-4 text-xs leading-6 text-[var(--text-secondary)]">{opportunity.body}</p>
              <p className="mt-3 text-[var(--text-micro)] leading-5 text-[var(--text-secondary)]">{opportunity.evidence}</p>
              <Link className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-intelligence)]" href={opportunity.href}>
                {opportunity.action} <ArrowUpRight className="size-3.5" />
              </Link>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-lg font-semibold tracking-[var(--tracking-tight)]" id="opportunity-title">Nothing is open right now.</h2>
              <p className="mt-4 text-xs leading-6 text-[var(--text-secondary)]">
                Klinikos shows something here when a real record is waiting on a decision your role can make. It will stay empty rather than invent a reason to act.
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}
