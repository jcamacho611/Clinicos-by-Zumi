import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { PathRail } from "@/components/clinic/path-rail";
import { PathRuntimeActions } from "@/components/clinic/path-runtime-actions";
import { requireClinicSession } from "@/lib/auth/session";
import { resolvePathRuntime } from "@/lib/orchestration/path-engine";
import { getLatestPathSnapshotForDefinition } from "@/lib/orchestration/path-persistence-repository";
import { getKlinikosPath } from "@/lib/paths/catalog";

const availabilityLabel = {
  available_now: "Available now",
  requires_setup: "Requires setup",
  requires_verification: "Requires verification",
  requires_organization_connection: "Requires organization connection",
  defined: "Defined path",
} as const;

export default async function KlinikosPathPage({ params }: { params: Promise<{ pathId: string }> }) {
  const session = await requireClinicSession();
  const { pathId } = await params;
  const definition = getKlinikosPath(pathId);
  if (!definition) notFound();

  const snapshot = await getLatestPathSnapshotForDefinition(session, pathId);
  const runtime = resolvePathRuntime({ pathId, snapshot, goal: snapshot?.goal ?? definition.summary });
  if (!runtime) notFound();

  const nodes = definition.nodes.map((node) => ({
    ...node,
    state: runtime.nodes.find((runtimeNode) => runtimeNode.id === node.id)?.state ?? node.state,
  }));
  const current = nodes.find((node) => node.id === runtime.currentNodeId) ?? null;

  return (
    <div className="mx-auto max-w-[1180px] space-y-7 text-[#f8efed]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link className="inline-flex items-center gap-2 text-xs font-semibold text-[#9f8985] transition hover:text-[#efaaa1]" href="/paths"><ArrowLeft className="size-3.5" />Route registry</Link>
        <Link className="inline-flex items-center gap-2 text-xs font-semibold text-[#d6b787] transition hover:text-[#efd8ad]" href="/zumi"><Sparkles className="size-3.5" />Continue with Zumi</Link>
      </div>

      <section className="relative overflow-hidden rounded-[32px] border border-[#e6817b]/14 bg-[#0b0507] px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,.25)] sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_7%,rgba(157,43,53,.2),transparent_33%),radial-gradient(circle_at_18%_95%,rgba(230,129,123,.05),transparent_24%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[.21em] text-[#e6817b]">Klinikos Route</p>
              <span className="rounded-full border border-[#e6817b]/16 bg-[#e6817b]/[.07] px-2.5 py-1 text-[9px] font-bold text-[#efaaa1]">{availabilityLabel[definition.availability]}</span>
            </div>
            <h1 className="mt-4 max-w-4xl text-balance text-4xl font-light leading-[.98] tracking-[-.055em] text-[#fff8f6] sm:text-6xl">{definition.title}</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#b89f9b]">{runtime.goal}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-[18px] border border-[#e6817b]/10 bg-[#090405]/72 p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#725d59]">Where you are</p><p className="mt-2 text-sm font-semibold text-[#e9d8d5]">{definition.from}</p></div>
              <ArrowRight className="hidden size-4 text-[#e6817b] sm:block" />
              <div className="rounded-[18px] border border-[#e6817b]/10 bg-[#090405]/72 p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#725d59]">Where you want to be</p><p className="mt-2 text-sm font-semibold text-[#e9d8d5]">{definition.to}</p></div>
            </div>
          </div>

          <aside className="rounded-[22px] border border-[#d6b787]/16 bg-[#d6b787]/[.045] p-5">
            <div className="flex items-center gap-2 text-[#efd8ad]"><ShieldCheck className="size-4" /><p className="text-[10px] font-extrabold uppercase tracking-[.16em]">Governance</p></div>
            <p className="mt-4 text-xs leading-6 text-[#bca6a1]">{definition.governance}</p>
            <div className="mt-6 border-t border-[#d6b787]/12 pt-5"><p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#806965]">Progress</p><div className="mt-2 flex items-end gap-3"><p className="text-4xl font-light tracking-[-.05em] text-[#fff8f6]">{Math.round(runtime.progress * 100)}%</p><p className="pb-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#8f7773]">{runtime.status}</p></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-[#2c171a]"><div className="h-full rounded-full bg-[#e6817b]" style={{ width: `${Math.max(2, Math.round(runtime.progress * 100))}%` }} /></div></div>
          </aside>
        </div>

        {current ? (
          <div className="relative mt-8 rounded-[22px] border border-[#e6817b]/12 bg-[#12090b]/78 p-5 sm:p-6">
            <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#e6817b]">Next eligible step</p>
            <p className="mt-3 text-lg font-semibold tracking-[-.025em] text-[#fff8f6]">{current.label}</p>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-[#9f8985]">{current.description}</p>
            <div className="mt-5"><PathRuntimeActions pathId={pathId} instanceId={snapshot?.instanceId ?? null} currentNodeId={current.id} currentHref={current.href ?? null} goal={runtime.goal} /></div>
          </div>
        ) : runtime.status === "completed" ? (
          <div className="relative mt-8 rounded-[20px] border border-emerald-300/16 bg-emerald-300/[.06] p-5 text-sm font-semibold text-emerald-100">This Route is complete. Klinikos has preserved the completed journey and event history.</div>
        ) : (
          <div className="relative mt-8"><PathRuntimeActions pathId={pathId} goal={runtime.goal} /></div>
        )}
      </section>

      <section className="rounded-[28px] border border-[#e6817b]/12 bg-[#0d0608] p-6 sm:p-8">
        <div className="mb-7"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#806965]">Journey</p><h2 className="mt-2 text-2xl font-light tracking-[-.045em] text-[#fff8f6]">What is complete, what is current, and what comes next.</h2></div>
        <PathRail nodes={nodes} />
      </section>

      {definition.commercialBoundary ? <section className="rounded-[22px] border border-[#e6817b]/10 bg-[#100708]/70 p-5"><p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#e6817b]">When paid capability becomes relevant</p><p className="mt-3 max-w-4xl text-xs leading-6 text-[#9f8985]">{definition.commercialBoundary}</p></section> : null}
    </div>
  );
}
