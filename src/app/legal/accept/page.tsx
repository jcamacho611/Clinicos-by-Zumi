import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, LockKeyhole } from "lucide-react";
import { requireAuthenticationSession } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/return-to";
import {
  agreementSha256,
  buildGlobalAgreement,
  requiredAcknowledgmentsForRole,
} from "@/lib/legal/global-agreement";
import { getLegalConfigurationStatus } from "@/lib/legal/legal-config";
import { ensureAgreementVersionRegistered, hasCurrentAgreementAcceptance, recordLegalEvent } from "@/lib/legal/legal-access";
import { createAgreementPresentedToken } from "@/lib/legal/review-token";
import { LegalAcceptanceClient } from "./LegalAcceptanceClient";

function defaultProtectedPath(role: string) {
  return role === "contractor" ? "/grid/opportunities" : "/dashboard";
}

function LegalGateBlocked({ missing, persistentAccount }: { missing: string[]; persistentAccount: boolean }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050303] px-5 py-10 text-[#f8efed]" data-klinikos-ds>
      <section className="w-full max-w-2xl rounded-[30px] border border-[#e6817b]/15 bg-[#0b0507] p-7 sm:p-10">
        <div className="grid size-12 place-items-center rounded-full border border-amber-300/20 bg-amber-300/[.06] text-amber-200"><AlertTriangle className="size-5" /></div>
        <p className="mt-7 text-[11px] font-extrabold uppercase tracking-[.22em] text-[#e6817b]">Protected access paused</p>
        <h1 className="mt-3 text-3xl font-light tracking-[-.045em] text-[#fff8f6]">The agreement cannot be executed safely yet.</h1>
        <p className="mt-4 text-sm leading-7 text-[#aa918d]">Klinikos will not fabricate a contracting entity, governing law, forum, persistent signature record, or other legal evidence just to let this screen appear complete.</p>
        {!persistentAccount ? <p className="mt-4 rounded-xl border border-[#e6817b]/10 bg-[#100708] p-4 text-xs leading-6 text-[#bca5a1]">Electronic execution requires a persistent authenticated account and database-backed evidence. Development demo sessions cannot create production agreement evidence.</p> : null}
        {missing.length ? <div className="mt-5 rounded-xl border border-[#d6b787]/12 bg-[#d6b787]/[.035] p-4"><p className="text-xs font-semibold text-[#efd8ad]">Deployment configuration still required</p><ul className="mt-2 space-y-1 text-xs text-[#a99077]">{missing.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e6817b]/15 bg-[#100708] px-5 text-xs font-semibold text-[#e7d4d1]" href="/">Return to public Klinikos</Link><form action="/api/auth/logout" method="post"><button className="min-h-12 w-full px-5 text-xs font-semibold text-[#8f7773]" type="submit">Sign out</button></form></div>
      </section>
    </main>
  );
}

export default async function LegalAcceptancePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; blocked?: string }>;
}) {
  const session = await requireAuthenticationSession();
  const { returnTo: rawReturnTo } = await searchParams;
  const returnTo = safeReturnTo(rawReturnTo);
  const legalStatus = getLegalConfigurationStatus();

  if (!legalStatus.ready || session.demo || !process.env.DATABASE_URL) {
    return <LegalGateBlocked missing={legalStatus.missing} persistentAccount={!session.demo && Boolean(process.env.DATABASE_URL)} />;
  }

  const agreement = buildGlobalAgreement(legalStatus.config);
  const required = requiredAcknowledgmentsForRole(session.role);
  const fallback = defaultProtectedPath(session.role);

  if (await hasCurrentAgreementAcceptance(session, agreement)) {
    redirect(returnTo && !returnTo.startsWith("/legal/") ? returnTo : fallback);
  }

  try {
    await ensureAgreementVersionRegistered(agreement, required);
    const presentedAt = new Date();
    const documentSha256 = agreementSha256(agreement);
    const presentedToken = await createAgreementPresentedToken(
      session,
      { documentKey: agreement.documentKey, documentVersion: agreement.documentVersion, documentSha256 },
      presentedAt,
    );
    await recordLegalEvent({
      session,
      eventType: "legal.agreement.presented",
      agreement,
      metadata: { presentedAt: presentedAt.toISOString() },
    });

    return (
      <LegalAcceptanceClient
        account={{ email: session.email, organizationName: session.organizationName, role: session.role }}
        acknowledgments={required}
        agreement={agreement}
        presentedToken={presentedToken}
        returnTo={returnTo ?? undefined}
      />
    );
  } catch {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050303] px-5 py-10 text-[#f8efed]" data-klinikos-ds>
        <section className="w-full max-w-2xl rounded-[30px] border border-[#e6817b]/15 bg-[#0b0507] p-7 sm:p-10">
          <div className="grid size-12 place-items-center rounded-full border border-[#e6817b]/20 bg-[#e6817b]/[.06] text-[#eaa29b]"><LockKeyhole className="size-5" /></div>
          <p className="mt-7 text-[11px] font-extrabold uppercase tracking-[.22em] text-[#e6817b]">Agreement evidence unavailable</p>
          <h1 className="mt-3 text-3xl font-light tracking-[-.045em] text-[#fff8f6]">Klinikos is failing closed.</h1>
          <p className="mt-4 text-sm leading-7 text-[#aa918d]">The agreement registry or evidence store could not be verified. Protected access will remain locked instead of creating incomplete or unverifiable acceptance evidence.</p>
          <div className="mt-7 flex gap-3"><Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e6817b]/15 bg-[#100708] px-5 text-xs font-semibold text-[#e7d4d1]" href="/legal/accept">Try again</Link><form action="/api/auth/logout" method="post"><button className="min-h-12 px-5 text-xs font-semibold text-[#8f7773]" type="submit">Sign out</button></form></div>
        </section>
      </main>
    );
  }
}
