import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPinned, ShieldCheck } from "lucide-react";
import { GridResourceOwnerConsole } from "@/components/grid/grid-resource-owner-console";
import { requireClinicSession } from "@/lib/auth/session";
import { listOwnGridResources } from "@/lib/grid/resource-repository";

export const metadata: Metadata = {
  title: "My Grid Resources — Klinikos",
  description: "Create, review, pause, and manage universal Klinikos Grid resources and capacity.",
};

export default async function GridResourcesPage() {
  const session = await requireClinicSession();
  const resources = await listOwnGridResources(session);

  return <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-[#e6817b]/16 bg-[#090405] px-5 py-8 text-[#fff8f6] sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_13%_0%,rgba(153,43,54,.23),transparent_38%),linear-gradient(135deg,rgba(230,129,123,.05),transparent_58%)]" />
      <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 text-[#efaaa1]"><ShieldCheck className="size-4" /><p className="text-[12px] font-extrabold uppercase tracking-[.22em]">Universal Grid supply</p></div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-5xl lg:text-6xl">What do you have available?</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#b59b97]">Create reusable healthcare resources once, then let Grid keep visibility, review, eligibility, availability, and capacity distinct. A listing never silently becomes permission to transact.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex items-center gap-2 rounded-xl border border-[#e6817b]/14 bg-[#160a0d] px-4 py-3 text-xs font-semibold text-[#d8c1bd] hover:border-[#e6817b]/28" href="/grid/opportunities"><ArrowLeft className="size-4" />Opportunities</Link>
          <Link className="inline-flex items-center gap-2 rounded-xl border border-[#efaaa1]/20 bg-[#e6817b] px-4 py-3 text-xs font-extrabold text-[#1a080b] hover:bg-[#efaaa1]" href="/grid/resources/browse"><MapPinned className="size-4" />Browse resources</Link>
        </div>
      </div>
    </section>
    <div className="mt-6"><GridResourceOwnerConsole resources={resources} /></div>
  </main>;
}
