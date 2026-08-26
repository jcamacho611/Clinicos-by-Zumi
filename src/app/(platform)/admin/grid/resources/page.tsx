import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { GridResourceReviewConsole } from "@/components/grid/grid-resource-review-console";
import { requireClinicSession } from "@/lib/auth/session";
import { getGridResourceReviewQueue } from "@/lib/grid/resource-admin-repository";

export const metadata: Metadata = {
  title: "Grid Resource Authority",
  description: "Restricted Klinikos review authority for universal Grid resources and capacity.",
};

export default async function GridResourceAuthorityPage() {
  const session = await requireClinicSession();
  const queue = await getGridResourceReviewQueue(session);

  return <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8"><div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-300/10 via-cyan-300/[.04] to-transparent" /><div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-4xl"><p className="text-[12px] font-black uppercase tracking-[.2em] text-amber-200">Klinikos resource authority</p><h1 className="mt-3 text-4xl font-black tracking-[-.06em] text-white sm:text-5xl">Review the resource class, not just the listing.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-white/50">Universal Grid supply stays non-transactional until the required platform review passes. The policy engine remains authoritative even after human review.</p></div><Link className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/admin/grid"><ArrowLeft className="size-4" />Grid Authority</Link></div></section>
    <div className="mt-5 flex items-start gap-3 rounded-[1.35rem] border border-amber-300/10 bg-amber-300/[.04] p-4 text-[12px] leading-5 text-amber-100/60"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p><strong className="text-amber-100">Restricted review surface.</strong> Access requires owner-level settings permission inside the configured Klinikos platform organization.</p></div>
    <div className="mt-6"><GridResourceReviewConsole queue={queue} /></div>
  </main>;
}
