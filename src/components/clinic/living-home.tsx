"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  GraduationCap,
  Network,
  Stethoscope,
} from "lucide-react";
import { Badge, Button, DsSurface, Input, ZumiOrb, type BadgeTone, type ZumiState } from "@/components/ds";
import type { PathGuidanceView } from "@/components/clinic/path-next-action";
import type { ClinicRole } from "@/lib/auth/rbac";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import type { LivingPathSignal } from "@/lib/orchestration/path-signal-repository";
import { getKlinikosPath } from "@/lib/paths/catalog";
import type { Appointment } from "@/lib/types";

type DoorwayAction = {
  label: string;
  description: string;
  href: string;
  icon: typeof Stethoscope;
};

type AttentionItem = {
  appointment: Appointment;
  reasons: string[];
};

const terminalStatuses = new Set<Appointment["status"]>(["Completed", "Cancelled", "No Show"]);

function doorwayActionsForRole(role: ClinicRole): DoorwayAction[] {
  if (role === "clinic_owner" || role === "administrator") {
    return [
      { label: "Clinic operations", description: "Patients, schedule, staff work, follow-up, and revenue", href: "/front-desk", icon: Stethoscope },
      { label: "Grid", description: "Find or offer healthcare work, space, services, and capacity", href: "/grid", icon: BriefcaseBusiness },
      { label: "Klinikos EDU", description: "Courses, scenarios, training, and readiness", href: "/edu", icon: GraduationCap },
    ];
  }
  if (role === "provider") {
    return [
      { label: "Today's care", description: "Open the work that needs clinical attention", href: "/provider", icon: Stethoscope },
      { label: "Grid", description: "See eligible work, services, and healthcare opportunities", href: "/grid", icon: BriefcaseBusiness },
      { label: "Klinikos EDU", description: "Continue learning, scenarios, and readiness", href: "/edu", icon: GraduationCap },
    ];
  }
  if (role === "clinical_staff" || role === "case_manager") {
    return [
      { label: "Today's care", description: "Open the work that needs care-team attention", href: "/tasks", icon: Stethoscope },
      { label: "Care network", description: "Follow referrals, handoffs, and connected work", href: "/network/directory", icon: Network },
      { label: "Klinikos EDU", description: "Continue learning, scenarios, and readiness", href: "/edu", icon: GraduationCap },
    ];
  }
  return [
    { label: "My work", description: "Go directly to the work your role can act on", href: role === "front_desk" ? "/front-desk" : "/tasks", icon: ClipboardList },
    { label: "Klinikos EDU", description: "Courses, scenarios, and professional learning", href: "/edu", icon: GraduationCap },
  ];
}

function roleLabel(role: ClinicRole) {
  if (role === "clinic_owner") return "Clinic owner";
  if (role === "front_desk") return "Front desk";
  if (role === "case_manager") return "Case manager";
  if (role === "clinical_staff") return "Clinical staff";
  return role.replaceAll("_", " ");
}

function localGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function normalizedProviderName(value: string) {
  return value.split(",")[0]?.trim().toLowerCase() ?? "";
}

function appointmentsForRole(appointments: Appointment[], role: ClinicRole, userName: string) {
  if (role !== "provider" && role !== "clinical_staff") return appointments;
  const target = userName.trim().toLowerCase();
  const matching = appointments.filter((appointment) => normalizedProviderName(appointment.provider) === target);
  return matching.length ? matching : appointments;
}

function selectDay(appointments: Appointment[]) {
  if (!appointments.length) return [];
  const today = appointments.filter((appointment) => appointment.date === "Today");
  if (today.length) return today;

  const firstActive = appointments.find((appointment) => !terminalStatuses.has(appointment.status));
  const day = firstActive?.date ?? appointments[appointments.length - 1]?.date;
  return appointments.filter((appointment) => appointment.date === day);
}

function attentionReasons(appointment: Appointment, role: ClinicRole) {
  const reasons: string[] = [];
  if (appointment.status === "Requested" || appointment.status === "Pending Confirmation") {
    reasons.push("Confirmation still needs to be recorded.");
  }
  if (appointment.status === "No Show") {
    reasons.push("The visit is recorded as a no-show and may need follow-up.");
  }
  if (!appointment.formsComplete) {
    reasons.push("Required intake is incomplete.");
  }
  if (!appointment.insuranceVerified && (role === "clinic_owner" || role === "administrator" || role === "front_desk" || role === "biller")) {
    reasons.push("Coverage has not been verified.");
  }
  if (appointment.paymentDue > 0 && (role === "clinic_owner" || role === "administrator" || role === "front_desk" || role === "biller")) {
    reasons.push(`$${appointment.paymentDue.toFixed(2)} remains due.`);
  }
  return reasons;
}

function briefingCopy(role: ClinicRole, attentionCount: number, appointmentCount: number) {
  if (attentionCount === 0) {
    return {
      eyebrow: "Operating briefing",
      headline: "Everything important is handled.",
      support: appointmentCount
        ? `${appointmentCount} scheduled ${appointmentCount === 1 ? "visit is" : "visits are"} visible with no current readiness exception in this view.`
        : "No schedule exception needs your attention in this view.",
    };
  }

  if (role === "clinic_owner" || role === "administrator") {
    return {
      eyebrow: `${String(attentionCount).padStart(2, "0")} decisions today`,
      headline: `${attentionCount} ${attentionCount === 1 ? "item needs" : "items need"} your attention.`,
      support: `${appointmentCount} scheduled ${appointmentCount === 1 ? "visit is" : "visits are"} in view. Klinikos is keeping the exceptions above the rest.`,
    };
  }

  if (role === "front_desk") {
    return {
      eyebrow: `${String(attentionCount).padStart(2, "0")} before the next block`,
      headline: `${attentionCount} ${attentionCount === 1 ? "thing needs" : "things need"} clearing.`,
      support: "Incomplete intake, confirmation, coverage, and payment work stays visible before it becomes a front-desk fire.",
    };
  }

  if (role === "provider" || role === "clinical_staff") {
    return {
      eyebrow: `${String(attentionCount).padStart(2, "0")} require review`,
      headline: `${appointmentCount} ${appointmentCount === 1 ? "visit is" : "visits are"} on the day ribbon.`,
      support: `${attentionCount} ${attentionCount === 1 ? "visit has" : "visits have"} a readiness item worth seeing before care moves forward.`,
    };
  }

  if (role === "biller") {
    return {
      eyebrow: `${String(attentionCount).padStart(2, "0")} revenue checks`,
      headline: `${attentionCount} ${attentionCount === 1 ? "visit has" : "visits have"} coverage or payment work attached.`,
      support: "The queue keeps financial readiness tied to the visit that created it.",
    };
  }

  return {
    eyebrow: `${String(attentionCount).padStart(2, "0")} need attention`,
    headline: `${attentionCount} ${attentionCount === 1 ? "item is" : "items are"} waiting on a person.`,
    support: "Klinikos keeps the exception visible and the next action close.",
  };
}

function opportunityForRole(role: ClinicRole) {
  if (role === "clinic_owner" || role === "administrator") {
    return {
      title: "Put unused capacity to work.",
      body: "Publish a room, service, coverage need, or other healthcare resource through Grid when it is useful.",
      href: "/grid",
      action: "Explore Grid",
    };
  }
  if (role === "front_desk") {
    return {
      title: "Protect the next appointment block.",
      body: "Open the front-desk workspace and clear the readiness items that can still be resolved before arrival.",
      href: "/front-desk",
      action: "Open front desk",
    };
  }
  if (role === "provider") {
    return {
      title: "See the work that fits you.",
      body: "Grid can surface eligible healthcare work, services, learning, and capacity without changing your clinical permissions.",
      href: "/grid",
      action: "View opportunities",
    };
  }
  if (role === "clinical_staff" || role === "case_manager") {
    return {
      title: "Keep the next handoff moving.",
      body: "Open the care network to see referrals, relationships, and governed handoffs that are already within your role.",
      href: "/network/directory",
      action: "Open care network",
    };
  }
  if (role === "biller") {
    return {
      title: "Move readiness toward revenue.",
      body: "Open billing work that is waiting on documentation, coverage, or a human review.",
      href: "/billing",
      action: "Open billing",
    };
  }
  return {
    title: "Continue with the work your role can use.",
    body: "Open the next workspace without exposing the rest of the product unless you need it.",
    href: "/tasks",
    action: "Open my work",
  };
}

function relativeTime(iso: string, nowMs: number | null) {
  if (nowMs === null) return "recently";
  const delta = nowMs - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(delta / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function guidanceTone(state: PathGuidanceView["state"]): BadgeTone {
  if (state === "blocked") return "signal";
  if (state === "review_required") return "analyzing";
  if (state === "waiting") return "observing";
  if (state === "completed") return "resolved";
  return "mapping";
}

function intelligenceState(state: "idle" | "saving" | "error", message: string | null): ZumiState {
  if (state === "saving") return "analyzing";
  if (state === "error") return "signal";
  if (message?.startsWith("Ready.")) return "resolved";
  return "observing";
}

export function LivingHome({
  firstName,
  userName,
  organizationName,
  role,
  appointments,
  recentSignals,
  initialPaths,
  initialGuidance,
  onboardingComplete = false,
}: {
  firstName: string;
  userName: string;
  organizationName: string;
  role: ClinicRole;
  appointments: Appointment[];
  recentSignals: LivingPathSignal[];
  initialPaths: PersistedPathSnapshot[];
  initialGuidance: PathGuidanceView[];
  onboardingComplete?: boolean;
}) {
  const [intent, setIntent] = useState("");
  const [paths, setPaths] = useState(initialPaths);
  const [guidance, setGuidance] = useState(initialGuidance);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(initialPaths[0]?.instanceId ?? null);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      setGreeting(localGreeting());
      setNowMs(Date.now());
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const doorwayActions = doorwayActionsForRole(role);
  const scopedAppointments = useMemo(() => appointmentsForRole(appointments, role, userName), [appointments, role, userName]);
  const dayAppointments = useMemo(() => selectDay(scopedAppointments), [scopedAppointments]);
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

  const ribbon = useMemo(() => {
    if (!dayAppointments.length) return null;
    const starts = dayAppointments.map((appointment) => new Date(appointment.startsAt).getTime()).filter(Number.isFinite);
    const ends = dayAppointments.map((appointment) => new Date(appointment.endsAt).getTime()).filter(Number.isFinite);
    if (!starts.length || !ends.length) return null;
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const span = Math.max(max - min, 60 * 60 * 1000);
    return {
      min,
      max,
      blocks: dayAppointments.map((appointment) => {
        const start = new Date(appointment.startsAt).getTime();
        const end = new Date(appointment.endsAt).getTime();
        return {
          appointment,
          left: ((start - min) / span) * 100,
          width: Math.max(((end - start) / span) * 100, 4),
          needsAttention: attentionReasons(appointment, role).length > 0,
        };
      }),
    };
  }, [dayAppointments, role]);

  const nowPosition = ribbon && nowMs !== null && nowMs >= ribbon.min && nowMs <= ribbon.max
    ? ((nowMs - ribbon.min) / Math.max(ribbon.max - ribbon.min, 1)) * 100
    : null;

  const briefing = briefingCopy(role, attentionItems.length, dayAppointments.length);
  const opportunity = opportunityForRole(role);
  const orbState = intelligenceState(state, message);

  async function submitIntent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const resolved = resolveIntentDeterministically(intent);
    const pathId = resolved.candidatePathIds[0] ?? null;
    if (!pathId) {
      setMessage(resolved.clarificationQuestions[0] ?? "Klinikos needs one more detail before it can help with that.");
      return;
    }

    setState("saving");
    try {
      const response = await fetch("/api/paths", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pathId, goal: intent }),
      });
      const payload = await response.json() as { data?: PersistedPathSnapshot; guidance?: PathGuidanceView | null; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Klinikos could not start that yet.");

      setPaths((current) => [payload.data!, ...current.filter((path) => path.instanceId !== payload.data!.instanceId)]);
      if (payload.guidance) {
        setGuidance((current) => [payload.guidance!, ...current.filter((item) => item.instanceId !== payload.guidance!.instanceId)]);
      }
      setSelectedInstanceId(payload.data.instanceId);
      setIntent("");
      setState("idle");
      setMessage("Ready. The next safe step is below.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Klinikos could not start that yet.");
    }
  }

  return (
    <DsSurface className="-mx-4 overflow-hidden border-y border-[var(--line-dark)] bg-[var(--surface-primary)] text-[var(--text-primary)] sm:-mx-6 lg:-mx-8">
      <section className="mx-auto max-w-[var(--container-max)] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20" aria-labelledby="living-home-title">
        <div className="grid gap-12 lg:grid-cols-[1.12fr_.88fr] lg:items-center lg:gap-20">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={attentionItems.length ? "signal" : "resolved"}>{briefing.eyebrow}</Badge>
              {onboardingComplete ? <Badge tone="resolved">Setup complete</Badge> : null}
            </div>
            <p className="mt-8 text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wider)]">
              {organizationName} · {roleLabel(role)}
            </p>
            <h1
              className="mt-4 max-w-4xl text-balance font-semibold tracking-[var(--tracking-tighter)]"
              id="living-home-title"
              style={{ fontSize: "var(--text-h1)", lineHeight: "var(--leading-tight)" }}
            >
              {greeting}, {firstName}.
            </h1>
            <div className="mt-8 grid max-w-3xl gap-5 sm:grid-cols-[auto_1fr] sm:items-end">
              <p className="text-7xl font-semibold leading-none tracking-[var(--tracking-tighter)] text-[var(--accent-intelligence)] sm:text-8xl">
                {String(attentionItems.length).padStart(2, "0")}
              </p>
              <div className="border-l border-[var(--line-dark)] pl-5">
                <h2 className="text-2xl font-semibold tracking-[var(--tracking-tight)] sm:text-3xl">{briefing.headline}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{briefing.support}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-l border-[var(--line-dark)] pl-5 sm:pl-8">
            <div>
              <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Klinikos Intelligence</p>
              <p className="mt-3 text-xl font-semibold tracking-[var(--tracking-tight)]">Ask. Find. Do. Open.</p>
              <p className="mt-2 max-w-sm text-xs leading-6 text-[var(--text-secondary)]">Describe the outcome. Klinikos keeps permissions, payment, credentials, and human review in control underneath.</p>
            </div>
            <ZumiOrb size={148} state={orbState} />
          </div>
        </div>

        <form className="mt-12 border-y border-[var(--line-dark)] py-7" onSubmit={submitIntent}>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <Input
              dark
              label="What needs to happen?"
              onChange={(event) => {
                setIntent(event.target.value);
                if (state === "error") setState("idle");
              }}
              placeholder="Find coverage Friday, follow up a referral, continue a course..."
              value={intent}
            />
            <Button disabled={state === "saving" || intent.trim().length < 2} size="lg" type="submit">
              {state === "saving" ? "Working" : "Show me the next step"} <ArrowRight className="size-4" />
            </Button>
          </div>
          {message ? (
            <p className={`mt-4 text-xs leading-6 ${state === "error" ? "text-[var(--status-signal)]" : "text-[var(--text-secondary)]"}`} aria-live="polite">
              {message}
            </p>
          ) : null}
        </form>

        <section className="mt-14" aria-labelledby="day-ribbon-title">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Day ribbon</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[var(--tracking-tight)]" id="day-ribbon-title">
                {dayAppointments[0]?.date ?? "Current schedule"}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{dayAppointments.length} {dayAppointments.length === 1 ? "visit" : "visits"} in view</p>
          </div>

          {ribbon ? (
            <>
              <div className="relative mt-7 hidden h-24 overflow-hidden border-y border-[var(--line-dark)] md:block">
                <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--line-dark)]" />
                {ribbon.blocks.map(({ appointment, left, width, needsAttention }) => (
                  <Link
                    className="absolute top-4 h-16 overflow-hidden border border-[var(--line-dark)] px-3 py-2 transition-opacity hover:opacity-85"
                    href={`/patients/${appointment.patientId}`}
                    key={appointment.id}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      minWidth: "var(--space-8)",
                      background: needsAttention
                        ? "color-mix(in oklch, var(--status-signal) 18%, var(--surface-raised))"
                        : "var(--surface-raised)",
                    }}
                  >
                    <span className="block truncate text-xs font-semibold">{appointment.time}</span>
                    <span className="mt-1 block truncate text-[var(--text-micro)] text-[var(--text-secondary)]">{appointment.initials} · {appointment.status}</span>
                  </Link>
                ))}
                {nowPosition !== null ? (
                  <div className="absolute inset-y-0 z-20 w-px bg-[var(--accent-intelligence)] shadow-[var(--glow-cyan)]" style={{ left: `${nowPosition}%` }}>
                    <span className="absolute left-2 top-1 text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">Now</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 divide-y divide-[var(--line-dark)] border-y border-[var(--line-dark)] md:hidden">
                {dayAppointments.slice(0, 5).map((appointment) => {
                  const reasons = attentionReasons(appointment, role);
                  return (
                    <Link className="flex items-center gap-4 py-4" href={`/patients/${appointment.patientId}`} key={appointment.id}>
                      <span className="w-20 shrink-0 text-sm font-semibold">{appointment.time}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{appointment.patient}</span>
                        <span className="mt-1 block truncate text-[var(--text-micro)] text-[var(--text-secondary)]">{appointment.type} · {appointment.status}</span>
                      </span>
                      <Badge tone={reasons.length ? "signal" : appointment.status === "Completed" ? "resolved" : "observing"}>
                        {reasons.length ? "Needs you" : appointment.status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="mt-7 border-y border-[var(--line-dark)] py-8">
              <p className="text-sm font-semibold">No scheduled visits are in this view.</p>
              <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">Klinikos will keep this quiet until there is something useful to show.</p>
            </div>
          )}
        </section>

        <div className="mt-16 grid gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
          <section aria-labelledby="needs-you-title">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Needs you</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[var(--tracking-tight)]" id="needs-you-title">
                  Exceptions, not noise.
                </h2>
              </div>
              <CircleAlert className="size-5 text-[var(--status-signal)]" />
            </div>

            {attentionItems.length ? (
              <div className="mt-7 divide-y divide-[var(--line-dark)] border-y border-[var(--line-dark)]">
                {attentionItems.slice(0, 5).map(({ appointment, reasons }) => (
                  <details className="group py-5" key={appointment.id}>
                    <summary className="flex cursor-pointer list-none items-start gap-4 marker:hidden">
                      <span className="mt-1 size-2 shrink-0 bg-[var(--status-signal)] shadow-[var(--glow-cyan)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{appointment.patient} · {appointment.time}</span>
                        <span className="mt-2 block text-xs leading-6 text-[var(--text-secondary)]">{reasons[0]}</span>
                      </span>
                      <span className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">Why</span>
                    </summary>
                    <div className="ml-6 mt-4 border-l border-[var(--line-dark)] pl-5">
                      {reasons.map((reason) => <p className="text-xs leading-6 text-[var(--text-secondary)]" key={reason}>{reason}</p>)}
                      <div className="mt-4 grid gap-2 text-[var(--text-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)] sm:grid-cols-3">
                        <span>Source · schedule</span>
                        <span>Observed · {appointment.time}</span>
                        <span>Evidence · direct record</span>
                      </div>
                      <Link className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-intelligence)]" href={`/patients/${appointment.patientId}`}>
                        Open patient <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="mt-7 border-y border-[var(--line-dark)] py-8">
                <CheckCircle2 className="size-5 text-[var(--status-resolved)]" />
                <p className="mt-4 text-sm font-semibold">Everything important is handled.</p>
                <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">No schedule readiness exception needs a person in this view.</p>
              </div>
            )}
          </section>

          <section aria-labelledby="continue-title">
            <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Continue</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[var(--tracking-tight)]" id="continue-title">Pick up where the work stopped.</h2>

            {activeDefinition && activeRuntime && activeSnapshot ? (
              <div className="mt-7 border-y border-[var(--line-dark)] py-7">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={activeGuidance ? guidanceTone(activeGuidance.state) : "observing"}>
                    {activeGuidance?.state === "review_required" ? "Ready for review" : activeGuidance?.state ?? "In progress"}
                  </Badge>
                  <span className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">
                    {Math.round(activeRuntime.progress * 100)}% complete
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-[var(--tracking-tight)]">{activeDefinition.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{activeSnapshot.goal}</p>

                <div className="mt-6 h-1 overflow-hidden bg-[var(--line-dark)]">
                  <div className="h-full bg-[var(--accent-intelligence)]" style={{ width: `${Math.max(4, Math.round(activeRuntime.progress * 100))}%` }} />
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
                  className="mt-6 inline-flex min-h-11 items-center gap-2 border border-[var(--accent-intelligence)] px-5 py-3 text-xs font-semibold text-[var(--accent-intelligence)] transition-opacity hover:opacity-85"
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
              <div className="mt-7 border-y border-[var(--line-dark)] py-8">
                <p className="text-sm font-semibold">Nothing is waiting for you to resume.</p>
                <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">Use the command above when you want Klinikos to organize a new outcome.</p>
              </div>
            )}
          </section>
        </div>

        <div className="mt-16 grid gap-10 border-y border-[var(--line-dark)] py-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--line-dark)]">
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
                <Link className="flex items-start gap-4 py-3 first:pt-0" href={`/patients/${appointment.patientId}`} key={appointment.id}>
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-[var(--accent-signal)]" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{appointment.time} · {appointment.patient}</span>
                    <span className="mt-1 block truncate text-[var(--text-micro)] text-[var(--text-secondary)]">{appointment.type}</span>
                  </span>
                </Link>
              ))}
              {!upcomingAppointments.length ? <p className="text-xs leading-6 text-[var(--text-secondary)]">Nothing else is scheduled in this view.</p> : null}
            </div>
          </section>

          <section className="lg:pl-8" aria-labelledby="opportunity-title">
            <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">Opportunity</p>
            <h2 className="mt-2 text-lg font-semibold tracking-[var(--tracking-tight)]" id="opportunity-title">{opportunity.title}</h2>
            <p className="mt-4 text-xs leading-6 text-[var(--text-secondary)]">{opportunity.body}</p>
            <Link className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-intelligence)]" href={opportunity.href}>
              {opportunity.action} <ArrowUpRight className="size-3.5" />
            </Link>
          </section>
        </div>

        <section className="mt-14" aria-labelledby="role-destinations-title">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[var(--text-secondary)] text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)]">More when you need it</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[var(--tracking-tight)]" id="role-destinations-title">Your role, not the whole product.</h2>
            </div>
            <p className="max-w-md text-xs leading-6 text-[var(--text-secondary)]">Only the major destinations that make sense for this role stay visible here. Deeper tools remain available when context calls for them.</p>
          </div>

          <div className={`mt-7 divide-y divide-[var(--line-dark)] border-y border-[var(--line-dark)] ${doorwayActions.length >= 3 ? "lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0" : "sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0"}`}>
            {doorwayActions.map(({ label, description, href, icon: Icon }) => (
              <Link className="group flex min-h-28 items-start gap-4 py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0" href={href} key={label}>
                <Icon className="mt-1 size-5 shrink-0 text-[var(--accent-signal)]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-2 block text-xs leading-5 text-[var(--text-secondary)]">{description}</span>
                </span>
                <ArrowUpRight className="mt-1 size-4 shrink-0 text-[var(--text-secondary)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      </section>
    </DsSurface>
  );
}
