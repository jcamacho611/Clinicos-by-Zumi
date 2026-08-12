import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PathRail } from "@/components/clinic/path-rail";
import { PathRuntimeActions } from "@/components/clinic/path-runtime-actions";
import { requireClinicSession } from "@/lib/auth/session";
import { resolvePathRuntime } from "@/lib/orchestration/path-engine";
import { getLatestPathSnapshotForDefinition } from "@/lib/orchestration/path-persistence-repository";
import { getKlinikosPath } from "@/lib/paths/catalog";

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
    <div className="mx-auto max-w-5xl space-y-8">
      <Link className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b1e3a]/54 hover:text-[#1677a8]" href="/dashboard">
        <ArrowLeft className="size-3.5" /> Back to Home
      </Link>

      <section className="rounded-[30px] border border-[#0b1e3a]/8 bg-white px-6 py-8 shadow-[0_24px_70px_rgba(11,30,58,.06)] sm:px-9 sm:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#1677a8]">Klinikos Path</p>
            <h1 className="mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-[-.055em] text-[#0b1e3a] sm:text-5xl">{definition.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#0b1e3a]/58">{runtime.goal}</p>
          </div>
          <div className="rounded-2xl bg-[#f1f8fc] px-4 py-3 text-right">
            <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#1677a8]">Progress</p>
            <p className="mt-1 text-2xl font-extrabold text-[#0b1e3a]">{Math.round(runtime.progress * 100)}%</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#0b1e3a]/38">{runtime.status}</p>
          </div>
        </div>

        {current ? (
          <div className="mt-8 rounded-2xl bg-[#f1f8fc] p-5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#1677a8]">Next action</p>
            <div className="mt-2">
              <p className="text-base font-extrabold text-[#0b1e3a]">{current.label}</p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#0b1e3a]/55">{current.description}</p>
            </div>
            <div className="mt-5">
              <PathRuntimeActions
                pathId={pathId}
                instanceId={snapshot?.instanceId ?? null}
                currentNodeId={current.id}
                currentHref={current.href ?? null}
                goal={runtime.goal}
              />
            </div>
          </div>
        ) : runtime.status === "completed" ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-50 p-5 text-sm font-semibold text-emerald-900">This Path is complete. Klinikos has preserved the completed journey and event history.</div>
        ) : (
          <div className="mt-8">
            <PathRuntimeActions pathId={pathId} goal={runtime.goal} />
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-[#0b1e3a]/8 bg-white p-6 sm:p-8">
        <div className="mb-7">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0b1e3a]/42">Journey</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-[#0b1e3a]">Where you are and what comes next.</h2>
        </div>
        <PathRail nodes={nodes} />
      </section>
    </div>
  );
}
