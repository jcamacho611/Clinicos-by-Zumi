import Link from "next/link";
import { ArrowRight, Blocks, CheckCircle2, ShieldCheck, Stethoscope } from "lucide-react";
import { Badge, Card, DsSurface } from "@/components/ds";
import type { ClinicLaunchBriefing } from "@/lib/commercial/clinic-launch-briefing";

export function ClinicFirstLoginLaunch({ organizationName, briefing }: { organizationName: string; briefing: ClinicLaunchBriefing }) {
  return (
    <DsSurface>
      <section
        className="relative overflow-hidden p-7 sm:p-9 lg:p-10"
        style={{ background: "var(--obsidian)", color: "var(--text-primary)", borderRadius: "var(--radius-lg)" }}
        aria-labelledby="clinic-launch-heading"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 82% 22%, color-mix(in oklch, var(--gold-500) 15%, transparent), transparent 30%), radial-gradient(circle at 16% 82%, color-mix(in oklch, var(--cyan-500) 20%, transparent), transparent 32%)" }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="resolved"><CheckCircle2 className="size-3" aria-hidden="true" /> Workspace activated</Badge>
            {briefing.planLabel ? <Badge tone="mapping">{briefing.planLabel}</Badge> : null}
          </div>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--cyan-400)", letterSpacing: "var(--tracking-wider)" }}>First hour in Klinikos</p>
              <h2
                id="clinic-launch-heading"
                className="mt-4 max-w-4xl text-balance font-extrabold"
                style={{ fontSize: "var(--text-h1)", letterSpacing: "var(--tracking-tight)", lineHeight: "var(--leading-tight)" }}
              >
                {organizationName} is ready to start operating.
              </h2>
              <p className="mt-5 max-w-3xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                Paid access and the owner workspace are verified from server-owned records. Start with synthetic or non-PHI work until the production patient-data gate below says otherwise.
              </p>
            </div>

            <div className="border-l pl-5 sm:pl-7" style={{ borderColor: "var(--line-dark)" }}>
              <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)" }}>Your activation goal</p>
              <p className="mt-3 text-lg font-extrabold">{briefing.primaryGoal ?? "Bring the clinic into one operating workspace"}</p>
              <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>
                {briefing.location ? `${briefing.location.name} · ${briefing.location.timezone}` : "Primary location configured"}
                {briefing.teamSize ? ` · Team ${briefing.teamSize}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            <LaunchState
              eyebrow="Access"
              title="Paid workspace active"
              detail="Your subscription and completed paid activation agree. The URL did not create this state."
              tone="resolved"
            />
            <LaunchState
              eyebrow="Patient data"
              title={briefing.productionPatientDataEnabled ? "Production mode enabled" : "Production mode still off"}
              detail={briefing.productionPatientDataEnabled
                ? "Klinikos has production patient-data mode enabled for this organization."
                : briefing.productionPatientDataReason ?? "Production patient-data use requires separate infrastructure, contractual, security, and organizational approval."}
              tone={briefing.productionPatientDataEnabled ? "resolved" : "analyzing"}
            />
            <LaunchState
              eyebrow="Connections"
              title={briefing.pendingConnections > 0 ? `${briefing.pendingConnections} ${briefing.pendingConnections === 1 ? "connection needs" : "connections need"} setup` : "Review connection readiness"}
              detail="A pending connector stays pending until its real credentials, contract, enrollment, and verification are ready."
              tone={briefing.pendingConnections > 0 ? "observing" : "neutral"}
            />
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            <LaunchAction href="/front-desk" icon={Stethoscope} title="Open clinic operations" detail="See the schedule, readiness, follow-up, and daily work." />
            <LaunchAction href="/integrations" icon={Blocks} title="Review connections" detail="See what is connected, manual, or still pending." />
            <LaunchAction href="/settings" icon={ShieldCheck} title="Review organization settings" detail="Confirm the controls your clinic will operate under." />
          </div>
        </div>
      </section>
    </DsSurface>
  );
}

function LaunchState({ eyebrow, title, detail, tone }: { eyebrow: string; title: string; detail: string; tone: "neutral" | "observing" | "analyzing" | "resolved" }) {
  return (
    <Card dark className="h-full">
      <Badge tone={tone}>{eyebrow}</Badge>
      <p className="mt-4 text-base font-extrabold">{title}</p>
      <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{detail}</p>
    </Card>
  );
}

function LaunchAction({ href, icon: Icon, title, detail }: { href: string; icon: typeof Stethoscope; title: string; detail: string }) {
  return (
    <Link
      className="group flex min-h-28 items-start gap-4 p-5 transition-opacity hover:opacity-85"
      href={href}
      style={{ background: "var(--surface-raised)", border: "var(--border-hair-dark)", borderRadius: "var(--radius-md)" }}
    >
      <Icon className="mt-0.5 size-5 shrink-0" style={{ color: "var(--cyan-400)" }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{title}</span>
        <span className="mt-2 block text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{detail}</span>
      </span>
      <ArrowRight className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}
