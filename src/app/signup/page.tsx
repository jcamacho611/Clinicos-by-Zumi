import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/app/signup/signup-form";
import { safeClinicReturnTo, safePersonReturnTo } from "@/lib/auth/return-to";
import { redirect } from "next/navigation";
import { getPersonAccountSession } from "@/lib/auth/account-session";
import { getAuthenticationSession } from "@/lib/auth/session";

function SignupReleaseGate() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#070405] px-5 py-14 text-[#f6ece9]">
      <section className="w-full max-w-2xl rounded-[30px] border border-[#d9918a]/25 bg-[#12090b] p-7 shadow-[0_32px_100px_rgba(0,0,0,.4)] sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">Person-level membership</p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-.05em]">Join free is at its final release gate.</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-[#c6aeaa]">
          The person-account path is built and tested. Klinikos will not open it in a deployment until the baseline terms, privacy evidence, and release controls for that environment are approved.
        </p>
        <p className="mt-5 text-xs leading-6 text-[#9f8985]">
          This hold does not create a clinic, credential, professional authority, patient access, payment state, or Grid eligibility.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-full bg-[#e6817b] px-5 text-xs font-semibold text-[#1a090a]" href="/grid">Explore Grid</Link>
          <Link className="inline-flex min-h-11 items-center rounded-full border border-[#d9918a]/30 px-5 text-xs font-semibold text-[#e8cbc7]" href="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}

export const metadata: Metadata = {
  title: "Join free",
  description:
    "Create one Klinikos account. Joining is free, takes no card, and is not a credential.",
  alternates: { canonical: "/signup" },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  if (process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED !== "true") {
    return <SignupReleaseGate />;
  }

  // Reuses the existing same-origin return guard rather than trusting the query string.
  const params = await searchParams;
  const returnTo = safePersonReturnTo(params.returnTo);
  const clinicSession = await getAuthenticationSession();
  if (clinicSession) {
    redirect(safeClinicReturnTo(params.returnTo) ?? (clinicSession.role === "contractor" ? "/grid/opportunities" : "/dashboard"));
  }
  const session = await getPersonAccountSession();
  if (session) redirect(returnTo ?? "/member");

  return (
    <main className="min-h-screen bg-[#070405] px-5 py-14 text-[#f6ece9] sm:px-9">
      <div className="mx-auto max-w-[520px]">
        <Link className="inline-flex items-center gap-2.5" href="/">
          <span className="size-2.5 rounded-full bg-[#e2685c] shadow-[0_0_14px_#e2685c]" />
          <span className="text-[12px] font-bold tracking-[.16em]">KLINIKOS</span>
        </Link>

        <h1 className="mt-9 text-[30px] font-extralight leading-[1.1] tracking-[-.03em]">
          Join Klinikos free.
        </h1>
        <p className="mt-4 text-[14px] leading-7 text-[#c6aeaa]">
          One account that stays yours as your work changes. Say what you need or what you
          have, and Klinikos works out which parts apply.
        </p>

        <SignupForm returnTo={returnTo} />
      </div>
    </main>
  );
}
