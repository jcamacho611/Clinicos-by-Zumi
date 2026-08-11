import Link from "next/link";
import { commandSurfaces } from "@/lib/design/command-system";
import { MarketingShell } from "@/components/growth/marketing-shell";
import { LeadCaptureForm } from "@/components/growth/lead-capture-form";
import { PARTNER_DISCLOSURE, normalizeReferralCode } from "@/lib/growth/referrals";
import { recordReferralVisit } from "@/lib/growth/growth-service";
import { readVisitorId } from "@/lib/growth/visitor";
import { headers } from "next/headers";

/**
 * A referral partner's landing page.
 *
 * The visit is recorded against the browser before anyone identifies themselves,
 * which is what makes first-touch attribution possible — the click almost always
 * precedes the form.
 *
 * The partner relationship is disclosed on the page. A recommendation someone is paid
 * for should say so, and a clinic that discovers it later trusts neither party.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return { title: `Klinikos by Zumi — referred by ${normalizeReferralCode(code) ?? "a partner"}` };
}

export default async function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = normalizeReferralCode(code);

  let partnerName: string | null = null;
  if (normalized && process.env.DATABASE_URL) {
    const requestHeaders = await headers();
    const visitorId = readVisitorId(new Request("https://klinikos.io", { headers: requestHeaders }));
    const result = await recordReferralVisit(normalized, visitorId).catch(() => null);
    if (result?.ok) partnerName = result.partner.organizationName ?? result.partner.name;
  }

  return (
    <MarketingShell>
      <section aria-labelledby="referral-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-24">
          <div>
            <p className={commandSurfaces.eyebrow}>
              {partnerName ? `Referred by ${partnerName}` : "Partner referral"}
            </p>
            <h1 className={`${commandSurfaces.headline} mt-4 text-balance text-5xl leading-[.96] sm:text-6xl`} id="referral-heading">
              Run your clinic from one system instead of seven.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-slate-300">
              Klinikos replaces the scattered operational software around your clinic and connects the
              healthcare networks you cannot replace. Zumi turns the result into a short list of what
              needs someone today.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-white/15 bg-white/[.04] px-5 text-sm font-extrabold text-slate-200`} href="/demo">
                See how it works
              </Link>
              <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-white/15 bg-white/[.04] px-5 text-sm font-extrabold text-slate-200`} href="/pricing">
                See pricing
              </Link>
            </div>

            <p className={`${commandSurfaces.panelBoundary} mt-10 max-w-xl p-4 text-[12px] leading-6 text-slate-200`}>
              {PARTNER_DISCLOSURE}
            </p>
          </div>

          <div>
            <LeadCaptureForm interest="overview" referralCode={normalized ?? undefined} />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
