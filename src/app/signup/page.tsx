import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { getAccountSession } from "@/lib/auth/account-session";
import { FreeSignupClient } from "./FreeSignupClient";

function SignupUnavailable() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#050303] px-5 py-12 text-[#f8efed]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 18% 18%, rgba(124,42,49,.28), transparent 34%), linear-gradient(180deg,#050303 0%,#0b0506 100%)" }} />
      <section className="relative z-10 w-full max-w-2xl border border-[#4f292d] bg-[#0b0507] p-7 sm:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#e6817b]">Person-level membership</p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-.055em] text-[#fff8f6] sm:text-5xl">Signup is being held at the final release gate.</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-[#c9b2ae]">The account path is built behind a deployment flag. Klinikos will not open it until the baseline Website Terms and Privacy Policy are production-approved and the account migration/security gates are verified.</p>
        <div className="mt-7 flex gap-3 border-t border-[#4f292d] pt-5 text-[11px] leading-5 text-[#9f8884]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e99089]" aria-hidden="true" /><p>Public discovery and clinic qualification remain separate from account authority. Nothing on this page creates a clinic, credential, clinical role, payment state, or patient-data access.</p></div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6817b] px-5 text-xs font-bold text-[#1a090a]" href="/auth">Continue with Zumi <ArrowRight className="size-4" aria-hidden="true" /></Link>
          <Link className="inline-flex min-h-11 items-center rounded-full border border-[#6b3b40] px-5 text-xs font-semibold text-[#ead9d5]" href="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}

export default async function SignupPage() {
  if (process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED !== "true") return <SignupUnavailable />;

  const existingSession = await getAccountSession();
  if (existingSession) redirect("/member");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050303] text-[#f8efed]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(circle at 16% 10%, rgba(124,42,49,.30), transparent 34%), radial-gradient(circle at 86% 82%, rgba(111,48,51,.18), transparent 34%), linear-gradient(180deg,#050303 0%,#0b0506 100%)" }} />

      <header className="relative z-20 border-b border-[#4f292d]">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <KlinikosWordmark href="/" inverse markClassName="h-8 w-8" textClassName="h-[18px] w-[160px]" />
          <Link className="ml-auto rounded-full border border-[#6b3b40] px-4 py-2.5 text-[11px] font-semibold text-[#e5d3d0]" href="/login">Already a member? Sign in</Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-16">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6b3b40] bg-[#12090b]/75 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#e99a93] backdrop-blur-lg"><Sparkles className="size-3.5" aria-hidden="true" /> One identity</div>
          <h1 className="mt-7 text-balance text-[clamp(2.8rem,5vw,5rem)] font-extralight leading-[.98] tracking-[-.06em] text-[#fff8f6]">Create one Klinikos identity. Let context evolve around you.</h1>
          <p className="mt-6 max-w-lg text-[15px] leading-7 text-[#d6bfbb]">You do not have to decide whether you are a student, clinician, worker, owner, caregiver, or something else forever. Start with a personal account. Klinikos asks for relationships and verification only when the action actually needs them.</p>
          <div className="mt-8 space-y-3 text-[12px] leading-6 text-[#a9918d]">
            <p><strong className="text-[#dec5c1]">No fake organization.</strong> A personal account does not manufacture a clinic or employer relationship.</p>
            <p><strong className="text-[#dec5c1]">No authority by signup.</strong> Licensure, credentials, organization ownership, patient access and payment state remain separately verified.</p>
            <p><strong className="text-[#dec5c1]">No public PHI.</strong> Account setup is for identity and non-sensitive context only.</p>
          </div>
        </div>

        <section className="border border-[#4f292d] bg-[#0b0507] p-6 shadow-[0_30px_110px_rgba(0,0,0,.46)] sm:p-8" aria-labelledby="create-account-heading">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">Create your account</p>
          <h2 id="create-account-heading" className="mt-3 text-3xl font-extralight tracking-[-.05em] text-[#fff8f6]">Join Klinikos.</h2>
          <p className="mt-3 text-[12px] leading-6 text-[#9f8884]">Only the identity and security basics needed for a personal account. No role picker. No clinic authority. No patient information.</p>
          <FreeSignupClient />
        </section>
      </section>
    </main>
  );
}
