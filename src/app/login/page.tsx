import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { LoginForm } from "@/components/clinic/login-form";
import { DEVELOPMENT_DEMO_EMAIL, DEVELOPMENT_DEMO_PASSWORD, isDemoAuthEnabled } from "@/lib/auth/config";
import { getAccountSession } from "@/lib/auth/account-session";
import { getAuthenticationSession } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; next?: string }> }) {
  const { returnTo: rawReturnTo, next: legacyNext } = await searchParams;
  // `returnTo` is canonical. `next` remains supported because older public surfaces
  // emitted it; both values still pass through the same same-origin safety gate.
  const returnTo = safeReturnTo(rawReturnTo ?? legacyNext);
  const [clinicSession, accountSession] = await Promise.all([
    getAuthenticationSession(),
    getAccountSession(),
  ]);
  if (clinicSession) redirect(returnTo ?? (clinicSession.role === "contractor" ? "/grid/opportunities" : "/dashboard"));
  if (accountSession) {
    if (accountSession.kind === "member") redirect("/member");
    redirect(returnTo ?? "/dashboard");
  }

  const demoCredentials = isDemoAuthEnabled()
    ? { email: DEVELOPMENT_DEMO_EMAIL, password: DEVELOPMENT_DEMO_PASSWORD }
    : undefined;
  const signupEnabled = process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED === "true";

  return (
    <main className="grid min-h-screen overflow-hidden bg-[#050303] text-[#f8efed] lg:grid-cols-[.88fr_1.12fr]" data-klinikos-ds>
      <section className="relative flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(139,35,42,.16),transparent_32%)]" />
        <div className="relative w-full max-w-md">
          <KlinikosWordmark href="/" framed inverse markClassName="h-12 w-12" textClassName="h-[22px] w-[196px]" className="mb-12 gap-3" />
          <p className="text-[12px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">Secure entry</p>
          <h1 className="mt-3 text-4xl font-light tracking-[-.055em] text-[#f8efed]">Welcome back.</h1>
          <p className="mt-3 text-sm leading-6 text-[#a98f8b]">Sign in to your personal Klinikos account or an authorized clinic workspace. A personal Klinikos account establishes authentication only; organization and professional authority remain separately verified.</p>
          <div className="rose-auth-form mt-8">
            <LoginForm demoCredentials={demoCredentials} returnTo={returnTo} />
          </div>
          {signupEnabled ? <p className="mt-5 text-center text-xs font-medium text-[#8f7773]">New to Klinikos? <Link className="font-semibold text-[#eaa29b] hover:text-[#f4bbb4]" href="/signup">Create your account</Link></p> : null}
          <p className="mt-3 text-center text-xs font-medium text-[#8f7773]">Not sure where to start? <Link className="font-semibold text-[#eaa29b] hover:text-[#f4bbb4]" href="/auth">Tell Klinikos what you need</Link></p>
          <p className="mt-3 text-center text-xs font-medium text-[#8f7773]">Looking for your records? <Link className="font-semibold text-[#eaa29b] hover:text-[#f4bbb4]" href="/portal/login">Open the patient portal</Link></p>
          <div className="mt-7 rounded-[18px] border border-[#e28b85]/12 bg-[#12090b] p-4 text-[11px] leading-5 text-[#8f7773]">
            <strong className="text-[#d8c1bd]">Sign-in methods are deployment-specific.</strong> Only methods that are actually configured are presented as usable controls.
          </div>
          <p className="mt-8 flex items-center gap-2 text-[12px] leading-5 text-[#8f7773]"><ShieldCheck className="size-4 shrink-0 text-[#d9948d]" />Never enter real patient information until the active organization context has been approved for production patient-data use.</p>
        </div>
      </section>
      <section className="relative hidden overflow-hidden border-l border-[#e28b85]/10 bg-[#080405] p-12 text-[#f8efed] lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_31%,rgba(149,42,49,.38),transparent_30%),radial-gradient(circle_at_74%_58%,rgba(230,129,123,.07),transparent_34%)]" />
        <div className="absolute left-[17%] top-[12%] size-[430px] rounded-full border border-[#efaaa1]/12" />
        <div className="absolute left-[27%] top-[21%] size-[270px] rounded-full border border-[#e6817b]/18" />
        <div className="relative max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#e6817b]">Klinikos Intelligence</p>
          <h2 className="mt-5 text-5xl font-light leading-[1.02] tracking-[-.055em]">One identity. The right experience for the context you are actually in.</h2>
          <p className="mt-6 max-w-lg text-sm leading-7 text-[#bca5a1]">Klinikos keeps identity persistent while organization, clinical, professional, education, Grid, and patient experiences remain governed by the relationships and authority that are true right now.</p>
        </div>
      </section>
    </main>
  );
}
