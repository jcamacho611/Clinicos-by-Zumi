import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { PortalPhoneVerification } from "@/components/portal/portal-phone-verification";
import { requirePortalSession } from "@/lib/auth/portal-session";

export const metadata: Metadata = { title: "Verify phone" };

export default async function PortalVerifyPhonePage() {
  await requirePortalSession();

  return (
    <main className="min-h-screen bg-[#f3f0e8] text-[#173c34]">
      <header className="border-b border-[#d8ddd4] bg-[#f8f6f0]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4 sm:px-8">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d8ddd4] bg-white px-4 text-xs font-extrabold text-[#173c34] transition hover:bg-[#f3f0e8]" href="/portal"><ArrowLeft className="size-4" aria-hidden="true" />Back to portal</Link>
          <div className="ml-auto inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#748b83]"><LockKeyhole className="size-4" aria-hidden="true" />Patient-only session</div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <PortalPhoneVerification />
      </div>
    </main>
  );
}
