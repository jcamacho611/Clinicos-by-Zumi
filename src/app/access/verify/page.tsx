import Link from "next/link";
import { headers } from "next/headers";
import { CircleAlert, MailCheck, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Button } from "@/components/ui/button";
import { verifyAccessEmail } from "@/lib/legal/access-verification";

/**
 * Landing page for the access-verification link.
 *
 * The token is consumed server-side on render and never handed to the browser. A
 * verified address is the prerequisite for paid entry, so a success here routes the
 * visitor onward to the access-pass catalog.
 */

export const dynamic = "force-dynamic";

type VerifyOutcome =
  | { ok: true; email: string; alreadyVerified: boolean }
  | { ok: false; reason: "missing" | "invalid" | "expired" | "unavailable" };

const failureCopy: Record<Exclude<VerifyOutcome, { ok: true }>["reason"], { title: string; body: string }> = {
  missing: { title: "This link is incomplete.", body: "The verification link did not include a token. Request a new link from the access gate." },
  invalid: { title: "This link is not valid.", body: "The verification token was not recognised. It may have already been replaced by a newer request." },
  expired: { title: "This link has expired.", body: "Verification links are short-lived. Request a new one and open it within 30 minutes." },
  unavailable: { title: "Verification is unavailable.", body: "We could not reach the verification store. Try again shortly." },
};

export default async function AccessVerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const requestHeaders = await headers();

  let outcome: VerifyOutcome;
  if (!process.env.DATABASE_URL) {
    outcome = { ok: false, reason: "unavailable" };
  } else {
    try {
      const result = await verifyAccessEmail(token ?? "", {
        ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip"),
        userAgent: requestHeaders.get("user-agent"),
      });
      outcome = result.ok
        ? { ok: true, email: result.email, alreadyVerified: result.alreadyVerified }
        : { ok: false, reason: result.reason };
    } catch {
      outcome = { ok: false, reason: "unavailable" };
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-14 sm:px-8">
        <section className="w-full border-y border-slate-200 bg-white py-14 sm:px-10">
          <div className="mx-auto max-w-xl px-5 sm:px-0">
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <p className="text-sm font-extrabold">Klinikos</p>
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7a1f]">Access verification</p>
              </div>
            </div>

            {outcome.ok ? (
              <>
                <MailCheck className="mt-10 size-9 text-teal-700" />
                <h1 className="mt-5 text-4xl font-extrabold tracking-[-.055em]">
                  {outcome.alreadyVerified ? "This email is already verified." : "Work email verified."}
                </h1>
                <p className="mt-5 text-sm leading-7 text-slate-600">
                  <strong className="text-slate-950">{outcome.email}</strong> is confirmed against your recorded acceptance of the
                  Access, Confidentiality &amp; Intellectual Property Terms. Paid Klinikos entry is now available for this address.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="primary"><Link href="/entry">View access passes</Link></Button>
                  <Button asChild variant="secondary"><Link href="/login">Sign in</Link></Button>
                </div>
                <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6 text-[11px] leading-6 text-slate-500">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#9a7a1f]" />
                  Verification confirms an email address only. Clinic, GRID provider, and location-partner use each require their own
                  agreements, purchased access, and human operational approval.
                </div>
              </>
            ) : (
              <>
                <CircleAlert className="mt-10 size-9 text-rose-600" />
                <h1 className="mt-5 text-4xl font-extrabold tracking-[-.055em]">{failureCopy[outcome.reason].title}</h1>
                <p className="mt-5 text-sm leading-7 text-slate-600">{failureCopy[outcome.reason].body}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="primary"><Link href="/access">Request a new link</Link></Button>
                  <Button asChild variant="secondary"><Link href="/">Return to public site</Link></Button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
