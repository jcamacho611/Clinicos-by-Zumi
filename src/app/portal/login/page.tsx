import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartPulse, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { PortalLoginForm } from "@/components/portal/portal-login-form";
import { getPortalSession } from "@/lib/auth/portal-session";

export const metadata: Metadata = { title: "Patient portal sign in" };

export default async function PortalLoginPage({ searchParams }: { searchParams: Promise<{ clinic?: string }> }) {
  if (await getPortalSession()) redirect("/portal");
  const { clinic } = await searchParams;
  const demoCredentials = process.env.NODE_ENV !== "production"
    ? { email: "maya.thompson@example.test", password: process.env.CLINICOS_SEED_PATIENT_PASSWORD ?? process.env.CLINICOS_SEED_ADMIN_PASSWORD ?? "" }
    : undefined;

  return <main className="relative grid min-h-screen overflow-hidden bg-[#f3f0e8] lg:grid-cols-[1.05fr_.95fr]">
    <div className="pointer-events-none absolute -left-40 top-1/3 size-[520px] rounded-full bg-[#a9d9c7]/30 blur-3xl" />
    <section className="relative flex items-center justify-center p-6 sm:p-10"><div className="w-full max-w-md"><Link className="mb-12 flex items-center gap-3" href="/"><BrandMark /><div><p className="text-sm font-extrabold text-[#173c34]">ClinicOS</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#6c847c]">Patient portal</p></div></Link><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#2b7868]">Private care space</p><h1 className="mt-3 font-serif text-5xl font-semibold leading-none tracking-[-.045em] text-[#15352f]">Your care,<br />without the maze.</h1><p className="mt-5 max-w-sm text-sm leading-7 text-[#5f756e]">See only the appointments, forms, balances, messages, and records your clinic has explicitly made available to you.</p><PortalLoginForm clinic={clinic ?? (demoCredentials ? "brooklyn-family-medicine" : "")} demoCredentials={demoCredentials} /><p className="mt-6 text-center text-xs text-[#6c847c]">Clinic staff? <Link className="font-extrabold text-[#286f61]" href="/login">Use the clinic workspace</Link></p></div></section>
    <section className="relative hidden bg-[#153f37] p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.3)_1px,transparent_0)] [background-size:32px_32px]" /><div className="relative flex items-center gap-2 text-xs font-bold text-[#bfe7d7]"><LockKeyhole className="size-4" /> A separate patient identity boundary</div><div className="relative max-w-lg"><span className="grid size-14 place-items-center rounded-3xl bg-[#e4c978] text-[#153f37]"><HeartPulse className="size-7" /></span><h2 className="mt-8 font-serif text-5xl leading-[1.02] tracking-[-.045em]">Released with care. Accessed with proof.</h2><p className="mt-6 text-sm leading-7 text-[#c4d9d2]">Clinical drafts stay private. Approved records carry a source, release decision, and access history. Your portal session can never become a clinic staff session.</p><div className="mt-10 flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-5"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#e4c978]" /><p className="text-xs leading-6 text-[#d6e7e1]">This environment contains synthetic demonstration records only. Do not enter real health information.</p></div></div></section>
  </main>;
}
