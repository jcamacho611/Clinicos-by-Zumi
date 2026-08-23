import { randomUUID } from "node:crypto";
import Link from "next/link";
import { agreementSha256 } from "@/lib/legal/global-agreement";
import { buildEntryAgreement, ENTRY_ACKNOWLEDGMENTS } from "@/lib/legal/entry-agreement";
import { getLegalConfigurationStatus } from "@/lib/legal/legal-config";
import { ensureAgreementVersionRegistered } from "@/lib/legal/legal-access";
import { createEntryPresentedToken } from "@/lib/legal/entry-token";
import { safeReturnTo } from "@/lib/auth/return-to";
import { EntryAcceptanceClient } from "./EntryAcceptanceClient";

function EntryGateBlocked({ missing }: { missing: string[] }) {
  return (
    <main className="rose-home relative grid min-h-screen place-items-center overflow-hidden bg-[#050303] px-5 py-10 text-[#f8f0ee]" data-klinikos-ds>
      <div className="rose-vignette pointer-events-none fixed inset-0 z-0" />
      <div className="rose-atmosphere pointer-events-none fixed inset-0 z-0 opacity-35" />
      <section className="relative z-10 w-full max-w-2xl rounded-[32px] border border-[#e6817b]/16 bg-[#0b0507]/[.94] p-7 shadow-[0_30px_120px_rgba(0,0,0,.5)] backdrop-blur-2xl sm:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">Protected entry paused</p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-.055em] text-[#fff7f5]">Klinikos is failing closed.</h1>
        <p className="mt-5 text-sm leading-7 text-[#bca5a1]">The protected-entry agreement cannot be issued safely until its factual legal configuration and persistent evidence store are available. Public Klinikos remains accessible.</p>
        {missing.length ? <div className="mt-6 rounded-[18px] border border-[#e6817b]/12 bg-[#12080a]/65 p-4"><p className="text-[11px] font-semibold text-[#dec1bd]">Deployment configuration required</p><ul className="mt-2 space-y-1 text-[11px] text-[#8f7773]">{missing.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}
        <Link className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full border border-[#e6817b]/20 bg-[#14090b] px-6 text-xs font-semibold text-[#ead8d4] transition hover:border-[#efaaa1]/50" href="/">Return to public Klinikos</Link>
      </section>
    </main>
  );
}

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo: rawReturnTo } = await searchParams;
  const returnTo = safeReturnTo(rawReturnTo) ?? "/login";
  const legal = getLegalConfigurationStatus();

  if (!legal.ready || !process.env.DATABASE_URL) {
    return <EntryGateBlocked missing={legal.ready ? ["DATABASE_URL / legal evidence store"] : legal.missing} />;
  }

  try {
    const agreement = buildEntryAgreement(legal.config);
    await ensureAgreementVersionRegistered(agreement, ENTRY_ACKNOWLEDGMENTS);
    const presentedAt = new Date();
    const entrySessionId = randomUUID();
    const documentSha256 = agreementSha256(agreement);
    const presentedToken = await createEntryPresentedToken(entrySessionId, {
      documentKey: agreement.documentKey,
      documentVersion: agreement.documentVersion,
      documentSha256,
    }, presentedAt);

    return (
      <EntryAcceptanceClient
        acknowledgments={ENTRY_ACKNOWLEDGMENTS}
        agreement={agreement}
        presentedToken={presentedToken}
        returnTo={returnTo}
      />
    );
  } catch {
    return <EntryGateBlocked missing={["Agreement registry / persistent evidence verification"]} />;
  }
}
