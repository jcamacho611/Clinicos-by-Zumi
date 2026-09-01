import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/app/signup/signup-form";
import { safeReturnTo } from "@/lib/auth/return-to";

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
  // Reuses the existing same-origin return guard rather than trusting the query string.
  const params = await searchParams;
  const returnTo = params.returnTo ? safeReturnTo(params.returnTo) : null;

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
