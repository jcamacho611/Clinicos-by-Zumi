import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { LoginForm } from "@/components/clinic/login-form";
import { DEVELOPMENT_DEMO_EMAIL, DEVELOPMENT_DEMO_PASSWORD, isDemoAuthEnabled } from "@/lib/auth/config";
import { getAuthenticationSession } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; next?: string }> }) {
  const { returnTo: rawReturnTo, next: legacyNext } = await searchParams;
  // `returnTo` is canonical. `next` remains supported because older public surfaces
  // emitted it; both values still pass through the same same-origin safety gate.
  const returnTo = safeReturnTo(rawReturnTo ?? legacyNext);
  const session = await getAuthenticationSession();
  if (session) redirect(returnTo ?? (session.role === "contractor" ? "/grid/opportunities" : "/dashboard"));

  const demoCredentials = isDemoAuthEnabled()
    ? { email: DEVELOPMENT_DEMO_EMAIL, password: DEVELOPMENT_DEMO_PASSWORD }
    : undefined;

  return (
    <main className="grid min-h-screen overflow-hidden bg-[#050303] text-[#f8efed] lg:grid-cols-[.88fr_1.12fr]" data-klinikos-ds>
      <section className="relative flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(139,35,42,.16),transparent_32%)]" />
        <div className="relative w-full max-w-md">
          <KlinikosWordmark href="/" framed inverse markClassName="h-12 w-12" textClassName="h-[22px] w-[196px]" className="mb-12 gap-3" />
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">Secure workspace</p>
          <h1 className="mt-3 text-4xl font-light tracking-[-.055em] text-[#f8efed]">Welcome back.</h1>
          <p className="mt-3 text-sm leading-6 text-[#a98f8b]">Sign in to your Klinikos workspace. Every session remains bound to one authorized organization and role.</p>
          <div className="rose-auth-form mt-8">
            <LoginForm demoCredentials={demoCredentials} returnTo={returnTo} />
          </div>
          <p className="mt-5 text-center text-xs font-medium text-[#8f7773]">Considering Klinikos? <Link className="font-semibold text-[#eaa29b] hover:text-[#f4bbb4]" href="/start">Start the Clinic Operating Analysis</Link></p>
          <p className="mt-3 text-center text-xs font-medium text-[#8f7773]">Looking for your records? <Link className="font-semibold text-[#eaa29b] hover:text-[#f4bbb4]" href="/portal/login">Open the patient portal</Link></p>
          <div className="mt-7 rounded-[18px] border border-[#e28b85]/12 bg-[#12090b]/65 p-4 text-[11px] leading-5 text-[#8f7773]">
            <strong className="text-[#d8c1bd]">Sign-in methods are deployment-specific.</strong> Only methods that are actually configured are presented as usable controls.
          </div>
          <p className="mt-8 flex items-center gap-2 text-[10px] leading-5 text-[#8f7773]"><ShieldCheck className="size-4 shrink-0 text-[#d9948d]" />Never enter real patient information until your organization has been approved for production patient-data use.</p>
        </div>
      </section>
      <section className="relative hidden overflow-hidden border-l border-[#e28b85]/10 bg-[#080405] p-12 text-[#f8efed] lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_31%,rgba(149,42,49,.38),transparent_30%),radial-gradient(circle_at_74%_58%,rgba(230,129,123,.07),transparent_34%)]" />
        <div className="absolute left-[17%] top-[12%] size-[430px] rounded-full border border-[#efaaa1]/12" />
        <div className="absolute left-[27%] top-[21%] size-[270px] rounded-full border border-[#e6817b]/18" />
        <div className="relative max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#e6817b]">Klinikos Intelligence</p>
          <h2 className="mt-5 text-5xl font-light leading-[1.02] tracking-[-.055em]">One place to see what matters and move it forward.</h2>
          <p className="mt-6 max-w-lg text-sm leading-7 text-[#bca5a1]">Klinikos keeps each organization inside its authorized workspace while bringing operations, care, network activity, learning, and revenue follow-through into one coherent environment.</p>
        </div>
      </section>
    </main>
  );
}
