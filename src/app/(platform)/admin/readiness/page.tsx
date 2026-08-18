import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { buildProductionReadiness, type ProductionReadinessState } from "@/lib/readiness/production-readiness";

const stateStyle: Record<ProductionReadinessState, string> = {
  READY: "border-emerald-200 bg-emerald-50 text-emerald-900",
  DEGRADED: "border-amber-200 bg-amber-50 text-amber-900",
  MANUAL_FALLBACK: "border-sky-200 bg-sky-50 text-sky-900",
  PENDING_CONNECTION: "border-violet-200 bg-violet-50 text-violet-900",
  BLOCKED: "border-rose-200 bg-rose-50 text-rose-900",
  NOT_CONFIGURED: "border-slate-200 bg-slate-50 text-slate-700",
};

export default async function ProductionReadinessPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "settings", "manage")) redirect("/dashboard");
  const readiness = await buildProductionReadiness();

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-[#071018] p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.16)] sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-[12px] font-black uppercase tracking-[.18em] text-cyan-200">Production readiness</p><h1 className="mt-4 text-4xl font-black tracking-[-.055em]">No false green lights.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">This screen reads server configuration, database state, migration evidence, the canonical connector registry, and explicit operator evidence. Missing credentials stay missing. Manual fallbacks stay manual.</p></div>
          <div className={`border px-5 py-4 ${readiness.overall === "READY" ? "border-emerald-300/30 bg-emerald-300/10" : readiness.overall === "BLOCKED" ? "border-rose-300/30 bg-rose-300/10" : "border-amber-300/30 bg-amber-300/10"}`}><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-400">Overall evidence state</p><p className="mt-2 text-2xl font-black">{readiness.overall}</p><p className="mt-1 text-[12px] text-slate-400">Production patient data approved: NO</p></div>
        </div>
      </section>

      <div className="flex gap-3 border border-amber-200 bg-amber-50 p-5 text-xs leading-6 text-amber-900"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p>{readiness.notice}</p></div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {readiness.items.map((entry) => {
          const Icon = entry.state === "READY" ? CheckCircle2 : entry.state === "BLOCKED" ? AlertTriangle : CircleDashed;
          return <article className={`border p-5 ${stateStyle[entry.state]}`} key={entry.key}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.14em] opacity-60">{entry.state.replaceAll("_", " ")}</p><h2 className="mt-2 text-lg font-black">{entry.label}</h2></div><Icon className="size-5 shrink-0" /></div><p className="mt-4 text-xs leading-6 opacity-80">{entry.detail}</p>{entry.action && <p className="mt-4 border-t border-current/10 pt-3 text-[12px] font-bold leading-5 opacity-75">Next: {entry.action}</p>}</article>;
        })}
      </section>

      <section className="border border-slate-200 bg-white p-5"><p className="text-[12px] font-black uppercase tracking-[.14em] text-slate-500">Connector evidence</p><div className="mt-4 grid gap-3 sm:grid-cols-4"><div><p className="text-2xl font-black">{readiness.connectorSummary.total}</p><p className="text-[12px] text-slate-500">registered</p></div><div><p className="text-2xl font-black">{readiness.connectorSummary.configured}</p><p className="text-[12px] text-slate-500">configured</p></div><div><p className="text-2xl font-black">{readiness.connectorSummary.productionUsable}</p><p className="text-[12px] text-slate-500">production-usable</p></div><div><p className="text-2xl font-black">{readiness.connectorSummary.phiUsable}</p><p className="text-[12px] text-slate-500">PHI-usable</p></div></div><p className="mt-4 text-[12px] text-slate-400">Generated {readiness.generatedAt}</p></section>
    </div>
  );
}
