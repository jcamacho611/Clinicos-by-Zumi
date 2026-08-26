import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GridResourceRequestForm } from "@/components/grid/grid-resource-request-form";
import { requireClinicSession } from "@/lib/auth/session";
import { getApprovedPublicGridResource } from "@/lib/grid/public-resource-detail-repository";
import { getGridTransactionBoard } from "@/lib/grid/transaction-board-repository";

export const metadata: Metadata = {
  title: "Request Grid Resource",
  description: "Connect an approved Klinikos Grid resource to an existing saved need and prepare an auditable offer.",
};

export default async function GridResourceRequestPage({ params }: { params: Promise<{ resourceId: string }> }) {
  const session = await requireClinicSession();
  const { resourceId } = await params;
  const [resource, board] = await Promise.all([
    getApprovedPublicGridResource(resourceId),
    getGridTransactionBoard(session),
  ]);

  return <main className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8"><div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-300/12 via-blue-500/[.04] to-transparent" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[12px] font-black uppercase tracking-[.2em] text-cyan-200">Universal Grid request</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.06em] text-white sm:text-5xl">Negotiate the resource. Re-check it before commitment.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-white/50">Your saved demand stays the anchor. The resource owner receives explicit terms, and Grid re-validates policy, ownership, time, and capacity before acceptance and reservation.</p></div><Link className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/grid/resources/browse"><ArrowLeft className="size-4" />Resource discovery</Link></div></section>
    <div className="mt-6"><GridResourceRequestForm resource={resource} demands={board.demands} /></div>
  </main>;
}
