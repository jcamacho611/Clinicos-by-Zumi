import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Building2, MapPinned, Network, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { ContractorEnrollmentForm } from "@/components/clinic/grid/contractor-enrollment-form";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Join Klinikos Grid",
  description: "Join the Klinikos Grid as an independent professional, provider, location partner, or service participant.",
};

const paths = [
  [BriefcaseBusiness, "Independent work", "Professionals can publish availability and prepare for eligible opportunities."],
  [Network, "Provider network", "Clinical participants can submit credentials and malpractice evidence for human review."],
  [Building2, "Space & capacity", "Locations can participate through rooms, chairs, clinics, and partner capacity."],
] as const;

export default function GridContractorJoinPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f5]">
      <header className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
        <Link className="flex items-center gap-3" href="/">
          <BrandMark />
          <div><p className="text-sm font-extrabold text-slate-950">Klinikos Grid</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-amber-600">Healthcare opportunity network</p></div>
        </Link>
        <div className="ml-auto flex items-center gap-4"><Link className="hidden text-xs font-bold text-slate-600 hover:text-slate-950 sm:block" href="/grid/browse">Browse Grid</Link><Link className="flex items-center gap-2 text-xs font-bold text-slate-600" href="/"><ArrowLeft className="size-4" /> Klinikos</Link></div>
      </header>

      <section className="border-y border-slate-200 bg-[#081923] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <div>
            <Badge className="bg-white/10 text-teal-200 ring-white/15"><MapPinned className="mr-1.5 size-3" /> I have something</Badge>
            <h1 className="mt-6 text-5xl font-black leading-[.96] tracking-[-.065em] sm:text-6xl">Tell Grid what you can offer.</h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300">Start with your professional profile and availability. Klinikos uses the information you provide to prepare the participant record the current Grid engine understands. Regulated work remains gated by the required human review.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
            {paths.map(([Icon,title,body])=><div className="bg-white/[.06] p-5" key={title}><Icon className="size-5 text-teal-300"/><p className="mt-4 text-sm font-extrabold">{title}</p><p className="mt-2 text-xs leading-5 text-slate-300">{body}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[.62fr_1.38fr]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-teal-700">Current enrollment path</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-.05em] text-slate-950">One profile for the details Grid needs first.</h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-600">{["Identity and service profile", "License, certification, and malpractice evidence where applicable", "Mobile, clinic-chair, and partner-location preferences", "Recurring availability and travel radius", "Human verification before regulated activation", "Booking choices and payout estimates where available"].map((item) => <li className="flex gap-3" key={item}><span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500" />{item}</li>)}</ul>
          <div className="mt-6 grid gap-3"><p className="rounded-2xl bg-amber-50 p-4 text-[11px] leading-6 text-amber-900"><ShieldCheck className="mb-2 size-4"/>Demo safety: do not enter real patient information. Credential evidence remains subject to the current review and production-security boundaries.</p><p className="rounded-2xl bg-white p-4 text-[11px] leading-6 text-slate-600 ring-1 ring-slate-200"><Sparkles className="mb-2 size-4 text-teal-700"/>Grid is expanding beyond the current contractor/provider enrollment form. Space, service, and other participant paths should converge on the same universal profile and opportunity engine.</p></div>
        </aside>
        <ContractorEnrollmentForm />
      </section>
    </main>
  );
}
