import Link from "next/link";
import { ArrowRight, Fingerprint, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#eef4f3] lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link className="mb-12 flex items-center gap-3" href="/"><BrandMark /><div><p className="text-sm font-extrabold">ClinicOS</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">by Zumi</p></div></Link>
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-teal-700">Secure workspace</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-.055em] text-slate-950">Welcome back.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Sign in to your clinic workspace. This build uses demo navigation while production identity is connected.</p>
          <form className="mt-8 space-y-4">
            <label className="block text-xs font-bold text-slate-700">Email address<Input className="mt-2" placeholder="name@clinic.com" type="email" /></label>
            <label className="block text-xs font-bold text-slate-700">Password<Input className="mt-2" placeholder="••••••••••••" type="password" /></label>
            <Button asChild className="w-full" size="lg" variant="primary"><Link href="/dashboard">Continue to demo <ArrowRight className="size-4" /></Link></Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div>
          <Button className="w-full" size="lg" variant="secondary"><Fingerprint className="size-5" /> Use a passkey <span className="ml-1 text-[10px] font-medium text-slate-400">Roadmap</span></Button>
          <p className="mt-8 flex items-center gap-2 text-[10px] leading-5 text-slate-500"><ShieldCheck className="size-4 shrink-0 text-teal-600" />Never enter real patient information in this demonstration environment.</p>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute left-[15%] top-[12%] size-[420px] rounded-full border border-teal-300/20" /><div className="absolute left-[25%] top-[20%] size-[270px] rounded-full border border-lime-300/25 animate-pulse-ring" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(15,163,177,.25),transparent_34%)]" />
        <div className="relative max-w-xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-300">Clinic operations, reimagined</p><h2 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-[-.055em]">Less hunting. More care. Every team on the same page.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-slate-300">The demo brings both Luxe Medi and Brooklyn Family Medicine into one multi-tenant clinical foundation while preserving organization boundaries.</p></div>
      </section>
    </main>
  );
}
