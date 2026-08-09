import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, CalendarClock, CircleAlert, CircleDollarSign, FileCheck2, Sparkles } from "lucide-react";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { listFoundingProgramForOwner } from "@/lib/repositories/sales-demo-repository";

function words(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function FoundingProgramPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "sales", "read")) redirect("/dashboard");
  const reservations = await listFoundingProgramForOwner(session);
  const current = reservations[0];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] bg-[#071018] p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.18)] sm:p-10">
        <div className="absolute right-0 top-0 size-80 translate-x-1/4 -translate-y-1/3 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="flex flex-wrap gap-2"><span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] text-amber-200">Early-stage program</span><span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] text-rose-200">Human review required</span></div><h2 className="mt-6 text-4xl font-black tracking-[-.055em] sm:text-5xl">A controlled path from interest to implementation.</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">Every price, credit, scope decision, production gate, and integration boundary remains visible before a clinic proceeds.</p></div><Link className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-slate-950 hover:bg-amber-200" href="/founding-clinic">Program disclosure <ArrowRight className="size-4" /></Link></div>
      </section>

      {current ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">Current clinic pathway</p><h3 className="mt-2 text-3xl font-black tracking-[-.05em] text-slate-950">{current.clinicName}</h3><p className="mt-2 text-xs text-slate-500">{current.clinicType} · {current.providerCount} providers · {current.locationCount} locations</p></div><span className="rounded-full bg-slate-950 px-4 py-2 text-[10px] font-black text-white">{words(current.status)}</span></div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><CalendarClock className="size-4 text-cyan-700" /><p className="mt-5 text-[9px] font-black uppercase text-slate-400">Selected offer</p><p className="mt-2 text-xs font-black text-slate-800">{words(current.selectedOffer)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><CircleDollarSign className="size-4 text-amber-700" /><p className="mt-5 text-[9px] font-black uppercase text-slate-400">Offer value</p><p className="mt-2 text-xs font-black text-slate-800">{money(current.priceCents)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><BadgeCheck className="size-4 text-emerald-700" /><p className="mt-5 text-[9px] font-black uppercase text-slate-400">Payment status</p><p className="mt-2 text-xs font-black text-slate-800">{words(current.paymentStatus)}</p></div></div>
            {current.demoScenario && <div className="mt-6 rounded-[24px] border border-cyan-200 bg-cyan-50/50 p-5"><div className="flex items-center gap-2"><Sparkles className="size-4 text-cyan-700" /><p className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-800">Synthetic demo scenario</p></div><h4 className="mt-3 text-lg font-black text-slate-950">{current.demoScenario.title}</h4><p className="mt-2 text-xs leading-6 text-slate-600">{current.demoScenario.summary}</p></div>}
            {current.recap && <div className="mt-5 rounded-[24px] border border-violet-200 bg-violet-50/50 p-5"><div className="flex items-center justify-between gap-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-violet-800">Demo recap</p><span className="text-[9px] font-black text-violet-700">{words(current.recap.reviewStatus)}</span></div><p className="mt-3 text-xs leading-6 text-slate-600">{current.recap.recommendedNextStep}</p></div>}
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-[#f8faf9] p-6 sm:p-8"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Program truth</p><div className="mt-6 space-y-5">{[["$500", "Private Workflow Demo & Cost Review", "Credits toward evaluation"], ["$1,500", "Founding Clinic Evaluation", "Credits toward founding contribution"], ["$8,000", "Founding Clinic Program", "Early-stage contribution after fit review"]].map(([price, name, note]) => <div className="flex gap-4 border-b border-slate-200 pb-5 last:border-0" key={price}><p className="w-16 shrink-0 text-lg font-black text-slate-950">{price}</p><div><p className="text-xs font-black text-slate-800">{name}</p><p className="mt-1 text-[10px] leading-5 text-slate-500">{note}</p></div></div>)}</div><div className="mt-6 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"><CircleAlert className="mt-0.5 size-4 shrink-0 text-rose-700" /><p className="text-[10px] leading-5 text-rose-800">No production PHI use, compliance certification, live vendor connection, or clinical deployment is included without separate review.</p></div></aside>
        </div>
      ) : (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-14 text-center"><FileCheck2 className="mx-auto size-10 text-slate-300" /><h3 className="mt-5 text-xl font-black text-slate-900">No linked founding evaluation</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Start with the public clinic qualification form. A clinic is linked here only after the contact or organization identity matches.</p><Link className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-xs font-black text-white" href="/sales">Qualify clinic <ArrowRight className="size-4" /></Link></section>
      )}
    </div>
  );
}
