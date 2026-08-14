import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { LoginForm } from "@/components/clinic/login-form";
import { DEVELOPMENT_DEMO_EMAIL, DEVELOPMENT_DEMO_PASSWORD, isDemoAuthEnabled } from "@/lib/auth/config";
import { getClinicSession } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo: rawReturnTo } = await searchParams;
  const returnTo = safeReturnTo(rawReturnTo);
  const session = await getClinicSession();
  if (session) redirect(returnTo ?? (session.role === "contractor" ? "/grid/opportunities" : "/dashboard"));

  const demoCredentials = isDemoAuthEnabled()
    ? { email: DEVELOPMENT_DEMO_EMAIL, password: DEVELOPMENT_DEMO_PASSWORD }
    : undefined;

  return (
    <main className="grid min-h-screen bg-[#eef4f3] lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link className="mb-12 flex items-center gap-3" href="/"><BrandMark /><div><p className="text-sm font-extrabold">Klinikos</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#b08d24]">The Clinic Operating System</p></div></Link>
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-teal-700">Secure workspace</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-.055em] text-slate-950">Welcome back.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Sign in to your Klinikos workspace. Every session is bound to one organization and role.</p>
          <LoginForm demoCredentials={demoCredentials} returnTo={returnTo} />
          <p className="mt-5 text-center text-xs font-semibold text-slate-500">Considering Klinikos? <Link className="font-extrabold text-teal-700 hover:text-teal-600" href="/start">Start the Clinic Operating Analysis</Link></p>
          <p className="mt-3 text-center text-xs font-semibold text-slate-500">Looking for your records? <Link className="font-extrabold text-teal-700 hover:text-teal-600" href="/portal/login">Open the patient portal</Link></p>
          <div className="mt-7 rounded-xl border border-slate-200 bg-white/70 p-4 text-[11px] leading-5 text-slate-500">
            <strong className="text-slate-800">Sign-in methods are deployment-specific.</strong> Only methods that are actually configured are presented as usable controls.
          </div>
          <p className="mt-8 flex items-center gap-2 text-[10px] leading-5 text-slate-500"><ShieldCheck className="size-4 shrink-0 text-teal-600" />Never enter real patient information until your organization has been approved for production patient-data use.</p>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute left-[15%] top-[12%] size-[420px] rounded-full border border-[#d4af37]/20" /><div className="absolute left-[25%] top-[20%] size-[270px] rounded-full border border-teal-300/25 animate-pulse-ring" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(15,163,177,.25),transparent_34%)]" />
        <div className="relative max-w-xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#e6c55b]">Clinic operations, reimagined</p><h2 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-[-.055em]">Less hunting. More care. Every team on the same page.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-slate-300">Klinikos keeps each practice inside its own authenticated workspace while bringing operations, clinical work, and revenue follow-through together.</p></div>
      </section>
    </main>
  );
}
