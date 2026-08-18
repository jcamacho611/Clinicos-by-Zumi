import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartPulse, LockKeyhole, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { PortalLoginForm } from "@/components/portal/portal-login-form";
import { getPortalSession } from "@/lib/auth/portal-session";

export const metadata: Metadata = { title: "Patient portal sign in" };

export default async function PortalLoginPage({ searchParams }: { searchParams: Promise<{ clinic?: string }> }) {
  if (await getPortalSession()) redirect("/portal");
  const { clinic } = await searchParams;
  const demoCredentials = process.env.NODE_ENV !== "production"
    ? { email: "maya.thompson@example.test", password: process.env.CLINICOS_SEED_PATIENT_PASSWORD ?? process.env.CLINICOS_SEED_ADMIN_PASSWORD ?? "" }
    : undefined;

  return <main className="relative grid min-h-screen overflow-hidden bg-[#050303] text-[#f8efed] lg:grid-cols-[1.05fr_.95fr]" data-klinikos-ds>
    <div className="pointer-events-none absolute -left-40 top-1/3 size-[520px] rounded-full bg-[#7b1d24]/20 blur-3xl" />
    <section className="relative flex items-center justify-center p-6 sm:p-10"><div className="w-full max-w-md"><KlinikosWordmark href="/" framed inverse markClassName="h-12 w-12" textClassName="h-[21px] w-[188px]" className="mb-12 gap-3" /><p className="text-[12px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">Private care space</p><h1 className="mt-3 text-5xl font-light leading-none tracking-[-.055em] text-[#f8efed]">Your care,<br />without the maze.</h1><p className="mt-5 max-w-sm text-sm leading-7 text-[#a98f8b]">See only the appointments, forms, balances, messages, and records your clinic has explicitly made available to you.</p><div className="rose-auth-form mt-8"><PortalLoginForm clinic={clinic ?? (demoCredentials ? "brooklyn-family-medicine" : "")} demoCredentials={demoCredentials} /></div><p className="mt-6 text-center text-xs text-[#8f7773]">Clinic staff? <Link className="font-semibold text-[#eaa29b] hover:text-[#f4bbb4]" href="/login">Use the clinic workspace</Link></p></div></section>
    <section className="relative hidden border-l border-[#e28b85]/10 bg-[#080405] p-12 text-[#f8efed] lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_28%,rgba(139,35,42,.34),transparent_31%),radial-gradient(circle_at_74%_76%,rgba(230,129,123,.06),transparent_29%)]" /><div className="relative flex items-center gap-2 text-xs font-semibold text-[#d8a39c]"><LockKeyhole className="size-4" /> A separate patient identity boundary</div><div className="relative max-w-lg"><span className="grid size-14 place-items-center rounded-full border border-[#efaaa1]/18 bg-[#e6817b]/10 text-[#efaaa1]"><HeartPulse className="size-7" /></span><h2 className="mt-8 text-5xl font-light leading-[1.02] tracking-[-.055em]">Released with care. Accessed with proof.</h2><p className="mt-6 text-sm leading-7 text-[#bca5a1]">Clinical drafts stay private. Approved records carry a source, release decision, and access history. Your portal session can never become a clinic staff session.</p><div className="mt-10 flex items-start gap-3 rounded-[24px] border border-[#e28b85]/12 bg-[#12090b]/60 p-5"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#efaaa1]" /><p className="text-xs leading-6 text-[#c9b5b1]">This environment contains synthetic demonstration records only. Do not enter real health information.</p></div></div></section>
  </main>;
}
