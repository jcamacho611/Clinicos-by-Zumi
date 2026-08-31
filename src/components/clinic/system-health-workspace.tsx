import { Activity, AlertTriangle, CheckCircle2, Database, Gauge, RotateCw, ServerCog, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReliabilityEventCreateAction, ReliabilityEventTransitionAction, IntegrationRetryAction } from "@/components/clinic/system-health-actions";
import type { SystemHealthWorkspace as SystemHealthData } from "@/lib/repositories/system-health-repository";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";

function lifecycleLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function SystemHealthWorkspace({ workspace, canCreate, canUpdate }: { workspace: SystemHealthData; canCreate: boolean; canUpdate: boolean }) {
  return (
    <div className="space-y-6">
      <PageIntro
        title="Know what is healthy, what is waiting, and what can recover."
        description="System health is tenant-scoped and operationally honest: checks come from live database queries, integration events retain failure detail, and manual fallback events stay visible until a human resolves them."
        aside={<><Badge tone="teal">Live checks</Badge><Badge tone="amber">Manual fallback ready</Badge></>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard accent="teal" detail="Open reliability events" icon={<AlertTriangle className="size-4" />} label="Incidents" value={String(workspace.metrics.openIncidents)} />
        <StatCard accent="rose" detail="Needs immediate review" icon={<AlertTriangle className="size-4" />} label="Urgent" value={String(workspace.metrics.urgentEvents)} />
        <StatCard accent="amber" detail="Failed adapter events" icon={<RotateCw className="size-4" />} label="Failed events" value={String(workspace.metrics.failedIntegrationEvents)} />
        <StatCard accent="sky" detail="Queued or retryable" icon={<Gauge className="size-4" />} label="Retryable" value={String(workspace.metrics.retryableEvents)} />
        <StatCard accent="slate" detail="Tenant operational work" icon={<Activity className="size-4" />} label="Open tasks" value={String(workspace.metrics.openTasks)} />
        <StatCard accent="teal" detail="Recent access receipts" icon={<ShieldCheck className="size-4" />} label="Audit events" value={String(workspace.metrics.auditEvents)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <SectionCard title="Health checks" description={`Last checked ${new Date(workspace.checkedAt).toLocaleString()}`}>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {workspace.checks.map((check) => (
              <div className="rounded-2xl border border-slate-200 bg-white p-4" key={check.key}>
                <div className="flex items-center gap-3">
                  <span className={`grid size-9 place-items-center rounded-xl ${check.status === "healthy" ? "bg-teal-50 text-teal-700" : check.status === "available" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"}`}>
                    {check.key === "database" ? <Database className="size-4" /> : check.key === "api" ? <ServerCog className="size-4" /> : <CheckCircle2 className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900">{check.label}</p>
                    <p className="mt-1 text-[12px] leading-4 text-slate-500">{check.detail}</p>
                  </div>
                  <StatusBadge status={check.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-950 p-5 text-white">
            <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-teal-300">Manual operations</p>
            <h3 className="mt-3 text-xl font-extrabold tracking-[-.04em]">Keep recovery visible.</h3>
            <p className="mt-2 text-xs leading-5 text-slate-400">Log an incident, maintenance window, deployment, backup, or service event while outside vendors or queues are unavailable.</p>
          </div>
          <ReliabilityEventCreateAction enabled={canCreate} />
          <div className="border-t border-slate-100 bg-amber-50 p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-amber-800">No false green lights</p>
            <p className="mt-2 text-xs leading-5 text-amber-900">A manual event records the operational state; it does not claim that a vendor delivered, a backup restored, or an interface succeeded.</p>
          </div>
        </Card>
      </div>

      <SectionCard
        title="Connection lifecycle"
        description="Raw vendor configuration is shown with the stricter Klinikos lifecycle. Connected does not mean production verified."
      >
        <div className="divide-y divide-slate-100">
          {workspace.integrations.map((integration) => (
            <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)_minmax(0,2fr)] lg:items-start" key={integration.id}>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900">{integration.vendor}</p>
                <p className="mt-1 text-[11px] text-slate-500">{integration.type} · raw status {integration.status}{integration.phase ? ` · phase ${integration.phase}` : ""}</p>
                {integration.lastSyncAt ? <p className="mt-1 text-xs text-slate-400">Last recorded sync {new Date(integration.lastSyncAt).toLocaleString()}</p> : null}
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.13em] text-slate-400">Klinikos lifecycle</p>
                <p className="mt-2 text-xs font-extrabold text-slate-800">{lifecycleLabel(integration.lifecycle)}</p>
                <p className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-extrabold ${integration.productionVerified ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                  {integration.productionVerified ? "Production verified" : "Not production verified"}
                </p>
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.13em] text-slate-400">Why</p>
                <p className="mt-2 text-[11px] leading-5 text-slate-600">{integration.lifecycleReason}</p>
                {!integration.productionClaimAllowed ? <p className="mt-2 text-xs font-bold text-amber-700">Do not represent this connection as verified live production.</p> : null}
              </div>
            </div>
          ))}
          {!workspace.integrations.length && <p className="p-5 text-xs text-slate-500">No integration records are configured for this organization.</p>}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard title="Integration recovery queue" description="Retrying an event queues it for an adapter or manual delivery confirmation; it does not claim successful transmission.">
          <div className="divide-y divide-slate-100">
            {workspace.failedIntegrationEvents.map((event) => (
              <div className="flex flex-wrap items-center gap-3 p-4" key={event.id}>
                <span className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-700"><RotateCw className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-slate-900">{event.vendor} · {event.eventType}</p>
                  <p className="mt-1 text-[12px] text-slate-500">{event.errorCode ?? event.status} · {event.errorMessage ?? "Queued for review"} · {event.retryCount} retries</p>
                </div>
                <IntegrationRetryAction enabled={canUpdate} eventId={event.id} />
              </div>
            ))}
            {!workspace.failedIntegrationEvents.length && <p className="p-5 text-xs text-slate-500">No failed or retryable integration events are waiting.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Recent reliability events" description="Incident, maintenance, deployment, backup, and service status are persisted with human transitions.">
          <div className="divide-y divide-slate-100">
            {workspace.events.map((event) => (
              <div className="p-4" key={event.id}>
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900">{event.title}</p>
                    <p className="mt-1 text-[12px] text-slate-500">{event.category} · {event.source} · {new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={event.severity} />
                  <StatusBadge status={event.status} />
                </div>
                {event.summary && <p className="mt-3 text-xs leading-5 text-slate-600">{event.summary}</p>}
                <div className="mt-3"><ReliabilityEventTransitionAction enabled={canUpdate} event={event} /></div>
              </div>
            ))}
            {!workspace.events.length && <p className="p-5 text-xs text-slate-500">No reliability events have been logged.</p>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}