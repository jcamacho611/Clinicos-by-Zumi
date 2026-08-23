import Link from "next/link";
import { Download, FileSignature, ShieldCheck } from "lucide-react";
import { requireAuthenticationSession } from "@/lib/auth/session";
import { listUserLegalAcceptances } from "@/lib/legal/legal-access";

export default async function AgreementsPage() {
  const session = await requireAuthenticationSession();
  const agreements = await listUserLegalAcceptances(session).catch(() => []);

  return (
    <main className="min-h-screen bg-[#050303] px-5 py-10 text-[#f8efed] sm:px-8 sm:py-14" data-klinikos-ds>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 border-b border-[#e6817b]/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-[#e6817b]">Agreements</p>
            <h1 className="mt-3 text-4xl font-light tracking-[-.055em] text-[#fff8f6]">Your signed Klinikos agreements.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9f8985]">Historical versions remain available as execution evidence even after Klinikos publishes a newer agreement.</p>
          </div>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e6817b]/14 bg-[#100708] px-5 text-xs font-semibold text-[#e7d4d1]" href="/dashboard">Back to Klinikos</Link>
        </div>

        {!agreements.length ? (
          <section className="mt-8 rounded-[26px] border border-[#e6817b]/12 bg-[#0b0507] p-7">
            <FileSignature className="size-5 text-[#e6817b]" />
            <h2 className="mt-4 text-xl font-light text-[#fff8f6]">No executed agreements are available for this account yet.</h2>
            <p className="mt-2 text-xs leading-6 text-[#8f7773]">Klinikos does not fabricate historical acceptance for accounts that never completed the signing ceremony.</p>
          </section>
        ) : (
          <div className="mt-8 space-y-4">
            {agreements.map((agreement) => (
              <article className="rounded-[24px] border border-[#e6817b]/12 bg-[#0b0507] p-5 sm:p-6" key={agreement.id}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-semibold text-[#f4e4e1]"><ShieldCheck className="size-4 text-[#e6817b]" />{agreement.documentKey}</p>
                    <p className="mt-2 text-[11px] text-[#8f7773]">Version {agreement.documentVersion} · Signed {new Date(agreement.signedAt ?? agreement.acceptedAt).toLocaleString()}</p>
                    <p className="mt-3 break-all font-mono text-[11px] leading-5 text-[#725d59]">SHA-256 {agreement.documentSha256 || "Legacy acceptance did not preserve a document hash."}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[.14em] text-[#806965]">Status: {agreement.status}</p>
                  </div>
                  {agreement.documentSnapshot && agreement.documentSha256 ? <a className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e6817b]/14 bg-[#100708] px-4 text-xs font-semibold text-[#e7d4d1]" href={`/api/legal/agreements/${agreement.id}/pdf`}><Download className="size-4" />Download signed PDF</a> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
