import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PathRail } from "@/components/clinic/path-rail";
import { requireClinicSession } from "@/lib/auth/session";
import { getKlinikosPath } from "@/lib/paths/catalog";

export default async function KlinikosPathPage({ params }: { params: Promise<{ pathId: string }> }) {
  await requireClinicSession();
  const { pathId } = await params;
  const path = getKlinikosPath(pathId);
  if (!path) notFound();

  const current = path.nodes.find((node) => node.state === "current");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b1e3a]/54 hover:text-[#1677a8]" href="/dashboard">
        <ArrowLeft className="size-3.5" /> Back to Home
      </Link>

      <section className="rounded-[30px] border border-[#0b1e3a]/8 bg-white px-6 py-8 shadow-[0_24px_70px_rgba(11,30,58,.06)] sm:px-9 sm:py-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#1677a8]">Klinikos Path</p>
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-[-.055em] text-[#0b1e3a] sm:text-5xl">{path.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#0b1e3a]/58">{path.summary}</p>

        {current ? (
          <div className="mt-8 rounded-2xl bg-[#f1f8fc] p-5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#1677a8]">Next action</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-extrabold text-[#0b1e3a]">{current.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#0b1e3a]/55">{current.description}</p>
              </div>
              {current.href ? <Link className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#0b1e3a] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#12315a]" href={current.href}>Continue</Link> : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-[#0b1e3a]/8 bg-white p-6 sm:p-8">
        <div className="mb-7">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0b1e3a]/42">Journey</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-[#0b1e3a]">Where you are and what comes next.</h2>
        </div>
        <PathRail nodes={path.nodes} />
      </section>
    </div>
  );
}
