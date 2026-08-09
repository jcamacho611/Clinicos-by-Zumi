import { SalesIntakeForm } from "@/components/sales/sales-intake-form";
import { SalesSiteShell } from "@/components/sales/sales-site-shell";
import { StatusPill } from "@/components/sales/status-pill";

export default function SalesIntakePage() {
  return (
    <SalesSiteShell>
      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end"><div><div className="flex flex-wrap gap-2"><StatusPill status="Live" /><StatusPill status="Demo" /></div><p className="mt-7 text-[10px] font-black uppercase tracking-[.24em] text-emerald-300">Clinic qualification</p><h1 className="mt-4 text-balance text-5xl font-black leading-[.95] tracking-[-.065em] sm:text-7xl">Tell us where the clinic loses control.</h1></div><p className="text-sm leading-7 text-slate-400">This intake captures clinic operations and software context only. Keep patient names, records, diagnoses, and all real PHI out of this form.</p></div>
        <SalesIntakeForm />
      </section>
    </SalesSiteShell>
  );
}
