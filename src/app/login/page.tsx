import Link from "next/link";
import { redirect } from "next/navigation";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { LoginForm } from "@/components/clinic/login-form";
import { Button } from "@/components/ui/button";
import { DEVELOPMENT_DEMO_EMAIL, DEVELOPMENT_DEMO_PASSWORD, isDemoAuthEnabled } from "@/lib/auth/config";
import { getClinicSession } from "@/lib/auth/session";

export default async function LoginPage() {
  if (await getClinicSession()) redirect("/dashboard");

  const demoCredentials = isDemoAuthEnabled()
    ? { email: DEVELOPMENT_DEMO_EMAIL, password: DEVELOPMENT_DEMO_PASSWORD }
    : undefined;

  return (
    <main className="grid min-h-screen bg-[#eef4f3] lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link className="mb-12 flex items-center gap-3" href="/"><BrandMark /><div><p className="text-sm font-extrabold">Klinikos</p></div></Link>
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-teal-700">Secure workspace</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-.055em] text-slate-950">Welcome back.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Sign in to your clinic workspace. Every session is bound to one organization and role.</p>
          <LoginForm demoCredentials={demoCredentials} />
          <p className="mt-5 text-center text-xs font-semibold text-slate-500">New to Klinikos? <Link className="font-extrabold text-teal-700 hover:text-teal-600" href="/start">Create a free organization workspace</Link></p>
          <p className="mt-3 text-center text-xs font-semibold text-slate-500">Looking for your records? <Link className="font-extrabold text-teal-700 hover:text-teal-600" href="/portal/login">Open the patient portal</Link></p>
          <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div>
          <Button className="w-full" disabled size="lg" variant="secondary"><Fingerprint className="size-5" /> Use a passkey <span className="ml-1 text-[10px] font-medium text-slate-400">Credential model ready</span></Button>
          <p className="mt-8 flex items-center gap-2 text-[10px] leading-5 text-slate-500"><ShieldCheck className="size-4 shrink-0 text-teal-600" />Never enter real patient information in this demonstration environment.</p>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute left-[15%] top-[12%] size-[420px] rounded-full border border-teal-300/20" /><div className="absolute left-[25%] top-[20%] size-[270px] rounded-full border border-l[...]
        <div className="relative max-w-xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-300">Clinic operations, reimagined</p><h2 className="mt-5 text-5xl font-extrabol[...]
      </section>
    </main>
  );
}
