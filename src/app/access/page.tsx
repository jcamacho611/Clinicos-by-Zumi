import Link from "next/link";
import { safeReturnTo } from "@/lib/auth/return-to";
import {
  AGREEMENT_AIRLOCK_ACKNOWLEDGMENTS,
  AGREEMENT_AIRLOCK_AUTHORITY_BOUNDARY,
} from "@/lib/legal/agreement-airlock";
import { buildGlobalAgreement } from "@/lib/legal/global-agreement";
import { getLegalConfigurationStatus } from "@/lib/legal/legal-config";
import { AgreementAirlockClient } from "./AgreementAirlockClient";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; blocked?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo) ?? "/home";
  const legal = getLegalConfigurationStatus();

  if (!legal.ready) {
    return (
      <main className="min-h-screen bg-[#050303] px-5 py-16 text-[#f8efed]">
        <section className="mx-auto max-w-2xl rounded-3xl border border-[#d9837f]/20 bg-[#0d0708] p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#e88f88]">Agreement Airlock</p>
          <h1 className="mt-4 text-3xl font-light tracking-[-.04em]">Protected entry is temporarily blocked.</h1>
          <p className="mt-4 text-sm leading-7 text-[#cdb7b3]">Klinikos will not collect or imply legal acceptance while the contracting configuration is incomplete. No access authority has been granted.</p>
          <Link className="mt-7 inline-flex min-h-11 items-center rounded-full border border-[#d9837f]/28 px-5 text-sm font-semibold" href="/">Return to public Klinikos</Link>
        </section>
      </main>
    );
  }

  const agreement = buildGlobalAgreement(legal.config);
  return (
    <AgreementAirlockClient
      authorityBoundary={AGREEMENT_AIRLOCK_AUTHORITY_BOUNDARY}
      createIdentityLabel="Create identity"
      disclosures={[...AGREEMENT_AIRLOCK_ACKNOWLEDGMENTS]}
      documentVersion={agreement.documentVersion}
      effectiveDate={agreement.effectiveDate}
      returnTo={returnTo}
      sections={agreement.sections}
      signInLabel="Sign in"
      title={agreement.title}
    />
  );
}
