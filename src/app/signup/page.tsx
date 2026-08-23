import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { getAccountSession } from "@/lib/auth/account-session";
import { readAcceptedEntryProof } from "@/lib/legal/entry-access";
import { FreeSignupClient } from "./FreeSignupClient";

function SignupUnavailable() {
  return (
    <main className="rose-home relative grid min-h-screen place-items-center overflow-hidden bg-[#050303] px-5 py-10 text-[#f8f0ee]" data-klinikos-ds>
      <div className="rose-vignette pointer-events-none fixed inset-0" />
      <div className="rose-atmosphere pointer-events-none fixed inset-0 opacity-30" />
      <section className="relative z-10 w-full max-w-xl rounded-[30px] border border-[#e6817b]/15 bg-[#0b0507]/95 p-7 sm:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">Free membership rollout</p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-.055em] text-[#fff7f5]">Account creation is not enabled here yet.</h1>
        <p className="mt-5 text-sm leading-7 text-[#bca5a1]">Klinikos is keeping this path closed until the account migration, protected-entry binding, and release gates are proven in this deployment.</p>
        <Link className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full border border-[#e6817b]/20 bg-[#14090b] px-6 text-xs font-semibold text-[#ead8d4]" href="/">Return to public Klinikos</Link>
      </section>
    </main>
  );
}

export default async function SignupPage() {
  if (process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED !== "true") {
    return <SignupUnavailable />;
  }

  const existingSession = await getAccountSession();
  if (existingSession) redirect("/member");

  const entryProof = await readAcceptedEntryProof();
  if (!entryProof) redirect("/access?returnTo=%2Fsignup");

  return (
    <main className="rose-home relative min-h-screen overflow-hidden bg-[#050303] text-[#f8f0ee]" data-klinikos-ds>
      <div className="rose-vignette pointer-events-none fixed inset-0 z-0" />
      <div className="rose-atmosphere pointer-events-none fixed inset-0 z-0 opacity-45" />

      <header className="relative z-20 flex min-h-[96px] items-center justify-between px-5 sm:px-9 lg:px-[38px]">
        <KlinikosWordmark
          className="gap-[18px]"
          frameClassName="size-[58px]"
          href="/"
          framed
          inverse
          markClassName="h-full w-full"
          textClassName="h-[32px] w-[230px]"
        />
        <Link className="rounded-full border border-[#d9837f]/20 bg-[#140a0c]/70 px-5 py-3 text-[11px] font-semibold text-[#e5d3d0] backdrop-blur-xl" href="/">Public Klinikos</Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-[1180px] gap-10 px-5 pb-14 pt-5 sm:px-9 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e6817b]/18 bg-[#13090b]/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#e99a93] backdrop-blur-xl"><Sparkles className="size-3.5" /> Free to join</div>
          <h1 className="mt-7 text-balance text-[clamp(2.8rem,5vw,5rem)] font-extralight leading-[.98] tracking-[-.06em] text-[#fff7f5]">One Klinikos identity. Start with what you need.</h1>
          <p className="mt-6 max-w-lg text-[15px] leading-7 text-[#d6bfbb]">Create your personal Klinikos account first. You can discover the network, learn what Klinikos can do for you, and let Zumi shape the next step without pretending you already represent a clinic or profession.</p>
          <div className="mt-8 space-y-3 text-[12px] leading-6 text-[#a9918d]">
            <p><strong className="text-[#dec5c1]">No fake organization.</strong> Your account exists before any real workplace, clinic, school, or business relationship is attached.</p>
            <p><strong className="text-[#dec5c1]">No permanent persona choice.</strong> Student, professional, owner, educator, contractor, and other contexts can accumulate around the same identity over time.</p>
            <p><strong className="text-[#dec5c1]">No authority by signup.</strong> Credentials, clinical privileges, seller status, Grid eligibility, and organization access remain separately governed.</p>
          </div>
        </div>

        <section className="rounded-[32px] border border-[#e28b85]/18 bg-[#0b0507]/[.94] p-6 shadow-[0_30px_120px_rgba(0,0,0,.5)] backdrop-blur-2xl sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">Create your account</p>
          <h2 className="mt-3 text-3xl font-extralight tracking-[-.05em] text-[#fff8f6]">Join Klinikos.</h2>
          <p className="mt-3 text-[12px] leading-6 text-[#9f8884]">You already completed protected entry. We only need the identity and security basics required to create your personal account.</p>
          <FreeSignupClient />
        </section>
      </section>
    </main>
  );
}
