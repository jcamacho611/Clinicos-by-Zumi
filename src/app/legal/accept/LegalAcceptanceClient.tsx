"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, FileSignature, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

interface AgreementSection {
  heading: string;
  paragraphs: string[];
}

interface Acknowledgment {
  key: string;
  label: string;
}

interface AgreementProps {
  documentKey: string;
  documentVersion: string;
  title: string;
  effectiveDate: string;
  contractingEntity: string;
  legalContactEmail: string;
  sections: AgreementSection[];
}

interface AcceptanceReceipt {
  id: string;
  documentVersion: string;
  documentSha256: string | null;
  signedAt: string;
  signatureMethod: string | null;
}

export function LegalAcceptanceClient({
  agreement,
  acknowledgments,
  presentedToken,
  account,
  returnTo,
}: {
  agreement: AgreementProps;
  acknowledgments: Acknowledgment[];
  presentedToken: string;
  account: { email: string; organizationName: string; role: string };
  returnTo?: string;
}) {
  const scrollBox = useRef<HTMLDivElement>(null);
  const reviewRequested = useRef(false);
  const [reviewToken, setReviewToken] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [legalName, setLegalName] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [capacity, setCapacity] = useState<"individual" | "organization_representative">("individual");
  const [title, setTitle] = useState("");
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<AcceptanceReceipt | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string>(returnTo || "/dashboard");
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const allChecked = acknowledgments.every(({ key }) => checks[key] === true);
  const signatureMatches = legalName.trim().length >= 2 && signatureText.trim().toLocaleLowerCase() === legalName.trim().toLocaleLowerCase();
  const organizationReady = capacity === "individual" || (title.trim().length >= 2 && authorityConfirmed);
  const canSign = Boolean(reviewToken) && reachedEnd && allChecked && signatureMatches && country.trim().length >= 2 && organizationReady && !submitting;

  async function markReviewed() {
    if (reviewRequested.current || reviewToken) return;
    reviewRequested.current = true;
    setReviewError(null);
    try {
      const response = await fetch("/api/legal/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentedToken }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.reviewToken !== "string") {
        throw new Error(payload.error || "Review confirmation failed.");
      }
      setReachedEnd(true);
      setReviewToken(payload.reviewToken);
    } catch (reviewFailure) {
      reviewRequested.current = false;
      setReviewError(reviewFailure instanceof Error ? reviewFailure.message : "Review confirmation failed.");
    }
  }

  function evaluateScroll() {
    const node = scrollBox.current;
    if (!node) return;
    const atEnd = node.scrollTop + node.clientHeight >= node.scrollHeight - 12;
    if (atEnd) void markReviewed();
  }

  useEffect(() => {
    const node = scrollBox.current;
    if (!node) return;
    if (node.scrollHeight <= node.clientHeight + 12) void markReviewed();
  }, []);

  async function submit() {
    if (!canSign || !reviewToken) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/legal/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewToken,
          acknowledgments: checks,
          legalName,
          signerTitle: capacity === "organization_representative" ? title : undefined,
          signerCapacity: capacity,
          signerCountry: country,
          signerRegion: region || undefined,
          signatureText,
          authorityConfirmed: capacity === "organization_representative" ? authorityConfirmed : false,
          idempotencyKey,
          sourceRoute: "/legal/accept",
          returnTo,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.acceptance?.id) throw new Error(payload.error || "The agreement could not be signed.");
      setReceipt(payload.acceptance as AcceptanceReceipt);
      setPdfUrl(typeof payload.pdfUrl === "string" ? payload.pdfUrl : null);
      setRedirectTo(typeof payload.redirectTo === "string" ? payload.redirectTo : redirectTo);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "The agreement could not be signed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (receipt) {
    return (
      <main className="min-h-screen bg-[#050303] px-5 py-10 text-[#f8efed] sm:px-8 sm:py-14" data-klinikos-ds>
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[#e6817b]/15 bg-[#0b0507] p-7 shadow-2xl shadow-black/40 sm:p-10">
          <div className="grid size-14 place-items-center rounded-full border border-emerald-300/20 bg-emerald-300/[.07] text-emerald-200"><Check className="size-6" /></div>
          <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[.22em] text-[#e6817b]">Klinikos agreement accepted</p>
          <h1 className="mt-3 text-4xl font-light tracking-[-.055em] text-[#fff8f6]">Your agreement is recorded.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#aa918d]">Your signature is tied to this exact agreement version and document hash. You can keep a copy for your records.</p>

          <dl className="mt-8 grid gap-4 rounded-[22px] border border-[#e6817b]/10 bg-[#100708] p-5 text-xs sm:grid-cols-2">
            <div><dt className="uppercase tracking-[.14em] text-[#725d59]">Acceptance ID</dt><dd className="mt-1 break-all text-[#e7d4d1]">{receipt.id}</dd></div>
            <div><dt className="uppercase tracking-[.14em] text-[#725d59]">Version</dt><dd className="mt-1 text-[#e7d4d1]">{receipt.documentVersion}</dd></div>
            <div className="sm:col-span-2"><dt className="uppercase tracking-[.14em] text-[#725d59]">Document SHA-256</dt><dd className="mt-1 break-all font-mono text-[11px] text-[#bca5a1]">{receipt.documentSha256}</dd></div>
            <div><dt className="uppercase tracking-[.14em] text-[#725d59]">Signed</dt><dd className="mt-1 text-[#e7d4d1]">{new Date(receipt.signedAt).toLocaleString()}</dd></div>
            <div><dt className="uppercase tracking-[.14em] text-[#725d59]">Method</dt><dd className="mt-1 capitalize text-[#e7d4d1]">{receipt.signatureMethod || "typed"}</dd></div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {pdfUrl ? <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#e6817b]/18 bg-[#12090b] px-5 text-xs font-semibold text-[#f0d8d4] hover:border-[#e6817b]/30" href={pdfUrl}><Download className="size-4" />Download signed agreement</a> : null}
            <a className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#e6817b] px-6 text-xs font-extrabold text-[#160709] hover:bg-[#ef9993]" href={redirectTo}>Enter Klinikos</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050303] px-4 py-7 text-[#f8efed] sm:px-7 sm:py-10" data-klinikos-ds>
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-[#e6817b]/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.28em] text-[#e6817b]">KLINIKOS</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[.2em] text-[#806965]">Before you enter Klinikos</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-light tracking-[-.045em] text-[#fff8f6] sm:text-4xl">Review and sign the agreement governing your protected access.</h1>
          </div>
          <div className="text-xs leading-5 text-[#8f7773] sm:text-right"><p>{account.email}</p><p>{account.organizationName} · {account.role}</p></div>
        </header>

        <section className="rounded-[30px] border border-[#e6817b]/14 bg-[#0b0507] p-4 sm:p-7">
          <div className="flex flex-col gap-4 border-b border-[#e6817b]/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-sm font-semibold text-[#fff8f6]">{agreement.title}</p><p className="mt-2 text-xs text-[#8f7773]">Version {agreement.documentVersion} · Effective {agreement.effectiveDate}</p></div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e6817b]/15 bg-[#e6817b]/[.05] px-3 py-2 text-[11px] font-bold uppercase tracking-[.13em] text-[#eaa29b]"><LockKeyhole className="size-3.5" />Protected access agreement</span>
          </div>

          <div className="mt-5 rounded-[18px] border border-[#d6b787]/12 bg-[#d6b787]/[.035] p-4 text-xs leading-6 text-[#bca5a1]"><strong className="text-[#efd8ad]">Review requirement.</strong> The signature controls remain locked until you reach the end of the complete agreement below. Reaching the end records presentation/review interaction; it does not claim to prove that every word was read.</div>

          <div
            aria-label="Complete Klinikos agreement. Scroll to the end before signing."
            className="mt-5 h-[55vh] min-h-[420px] overflow-y-auto rounded-[20px] border border-[#e6817b]/10 bg-[#070405] p-5 outline-none focus:ring-2 focus:ring-[#e6817b]/35 sm:p-7"
            onScroll={evaluateScroll}
            ref={scrollBox}
            tabIndex={0}
          >
            <div className="mx-auto max-w-3xl text-sm leading-7 text-[#c6afab]">
              <h2 className="text-2xl font-light leading-tight tracking-[-.035em] text-[#fff8f6]">{agreement.title}</h2>
              <p className="mt-3 text-xs text-[#8f7773]">Contracting party: {agreement.contractingEntity}<br />Version: {agreement.documentVersion}<br />Effective date: {agreement.effectiveDate}</p>
              {agreement.sections.map((section) => (
                <section className="mt-8" key={section.heading}>
                  <h3 className="text-base font-semibold text-[#f6e8e5]">{section.heading}</h3>
                  <div className="mt-3 space-y-4">{section.paragraphs.map((paragraph, index) => <p key={`${section.heading}-${index}`}>{paragraph}</p>)}</div>
                </section>
              ))}
              <div className="mt-10 border-t border-[#e6817b]/15 pt-8 pb-4 text-center">
                <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-[#e6817b]">End of agreement</p>
                <p className="mt-2 text-xs text-[#8f7773]">Legal contact: {agreement.legalContactEmail}</p>
              </div>
            </div>
          </div>

          <div aria-live="polite" className="mt-4 min-h-6 text-xs">
            {reviewToken ? <p className="flex items-center gap-2 text-emerald-200"><Check className="size-4" />You reached the end. Signing controls are unlocked.</p> : reviewError ? <p className="text-[#efaaa1]">{reviewError} Scroll to the bottom again to retry.</p> : <p className="text-[#806965]">Scroll through the agreement to continue.</p>}
          </div>
        </section>

        <section aria-disabled={!reviewToken} className={`mt-6 rounded-[30px] border p-5 sm:p-7 ${reviewToken ? "border-[#e6817b]/14 bg-[#0b0507]" : "pointer-events-none border-[#e6817b]/7 bg-[#080405] opacity-45"}`}>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full border border-[#e6817b]/14 bg-[#e6817b]/[.05] text-[#e6817b]"><ShieldCheck className="size-4" /></span><div><p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6817b]">Acknowledgments</p><h2 className="mt-1 text-xl font-light tracking-[-.035em] text-[#fff8f6]">Affirm each required statement.</h2></div></div>
          <div className="mt-6 space-y-3">
            {acknowledgments.map(({ key, label }) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[#e6817b]/10 bg-[#100708] p-4 text-xs leading-6 text-[#baa19d]" key={key}>
                <input checked={checks[key] === true} className="mt-1 size-4 accent-[#e6817b]" onChange={(event) => setChecks((current) => ({ ...current, [key]: event.target.checked }))} type="checkbox" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section aria-disabled={!reviewToken} className={`mt-6 rounded-[30px] border p-5 sm:p-7 ${reviewToken ? "border-[#e6817b]/14 bg-[#0b0507]" : "pointer-events-none border-[#e6817b]/7 bg-[#080405] opacity-45"}`}>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full border border-[#e6817b]/14 bg-[#e6817b]/[.05] text-[#e6817b]"><FileSignature className="size-4" /></span><div><p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6817b]">Electronic signature</p><h2 className="mt-1 text-xl font-light tracking-[-.035em] text-[#fff8f6]">Sign intentionally.</h2></div></div>
          <p className="mt-4 max-w-3xl text-xs leading-6 text-[#8f7773]">By selecting Agree & Sign, you intend the typed signature you provide to authenticate your acceptance of this Agreement and to have the legal effect available to electronic signatures under applicable law. This ceremony is not represented as notarization or a qualified electronic signature.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-[#9f8985]">Legal name<input autoComplete="name" className="mt-2 min-h-12 w-full rounded-xl border border-[#e6817b]/12 bg-[#100708] px-4 text-sm text-[#fff8f6] outline-none focus:border-[#e6817b]/35" onChange={(event) => setLegalName(event.target.value)} value={legalName} /></label>
            <label className="text-xs text-[#9f8985]">Signing capacity<select className="mt-2 min-h-12 w-full rounded-xl border border-[#e6817b]/12 bg-[#100708] px-4 text-sm text-[#fff8f6] outline-none focus:border-[#e6817b]/35" onChange={(event) => setCapacity(event.target.value as typeof capacity)} value={capacity}><option value="individual">Individual</option><option value="organization_representative">Authorized organization representative</option></select></label>
            {capacity === "organization_representative" ? <label className="text-xs text-[#9f8985]">Title / capacity<input className="mt-2 min-h-12 w-full rounded-xl border border-[#e6817b]/12 bg-[#100708] px-4 text-sm text-[#fff8f6] outline-none focus:border-[#e6817b]/35" onChange={(event) => setTitle(event.target.value)} value={title} /></label> : null}
            <label className="text-xs text-[#9f8985]">Country<input autoComplete="country-name" className="mt-2 min-h-12 w-full rounded-xl border border-[#e6817b]/12 bg-[#100708] px-4 text-sm text-[#fff8f6] outline-none focus:border-[#e6817b]/35" onChange={(event) => setCountry(event.target.value)} value={country} /></label>
            <label className="text-xs text-[#9f8985]">State / province / region <span className="text-[#655653]">optional</span><input autoComplete="address-level1" className="mt-2 min-h-12 w-full rounded-xl border border-[#e6817b]/12 bg-[#100708] px-4 text-sm text-[#fff8f6] outline-none focus:border-[#e6817b]/35" onChange={(event) => setRegion(event.target.value)} value={region} /></label>
            <label className="text-xs text-[#9f8985] sm:col-span-2">Type your full legal name as your signature<input aria-describedby="signature-match" className="mt-2 min-h-14 w-full rounded-xl border border-[#e6817b]/16 bg-[#100708] px-4 text-lg font-semibold italic tracking-[-.02em] text-[#fff8f6] outline-none focus:border-[#e6817b]/40" onChange={(event) => setSignatureText(event.target.value)} value={signatureText} /></label>
            <p className={`text-[11px] sm:col-span-2 ${signatureMatches || !signatureText ? "text-[#806965]" : "text-[#efaaa1]"}`} id="signature-match">Your typed signature must match the legal name above.</p>
          </div>

          {capacity === "organization_representative" ? <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[16px] border border-[#d6b787]/12 bg-[#d6b787]/[.035] p-4 text-xs leading-6 text-[#c5ad95]"><input checked={authorityConfirmed} className="mt-1 size-4 accent-[#d6b787]" onChange={(event) => setAuthorityConfirmed(event.target.checked)} type="checkbox" /><span>I represent that I have authority to bind <strong className="text-[#efd8ad]">{account.organizationName}</strong> to this Agreement in the capacity stated above.</span></label> : null}

          {error ? <p aria-live="assertive" className="mt-5 rounded-xl border border-red-300/15 bg-red-300/[.05] p-4 text-xs leading-5 text-red-200">{error}</p> : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form action="/api/auth/logout" method="post"><button className="min-h-12 px-2 text-xs font-semibold text-[#806965] hover:text-[#c9b4b0]" type="submit">Decline and sign out</button></form>
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e6817b] px-7 text-xs font-extrabold text-[#160709] disabled:cursor-not-allowed disabled:opacity-35" disabled={!canSign} onClick={() => void submit()} type="button">{submitting ? <Loader2 className="size-4 animate-spin" /> : <FileSignature className="size-4" />}{submitting ? "Recording signature…" : "Agree & Sign"}</button>
          </div>
        </section>
      </div>
    </main>
  );
}
