"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Disclosure = { key: string; label: string };
type Section = { heading: string; paragraphs: string[] };

export function AgreementAirlockClient({
  title,
  documentVersion,
  effectiveDate,
  sections,
  disclosures,
  authorityBoundary,
  returnTo,
  signInLabel,
  createIdentityLabel,
}: {
  title: string;
  documentVersion: string;
  effectiveDate: string;
  sections: Section[];
  disclosures: Disclosure[];
  authorityBoundary: string;
  returnTo: string;
  signInLabel: string;
  createIdentityLabel: string;
}) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const allAccepted = useMemo(() => disclosures.every(({ key }) => accepted[key] === true), [accepted, disclosures]);
  const query = `?returnTo=${encodeURIComponent(returnTo)}`;

  async function acceptAgreement() {
    if (!allAccepted || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/access/airlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledgments: accepted, returnTo }),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Agreement acceptance could not be recorded.");
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Agreement acceptance could not be recorded.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050303] px-5 py-10 text-[#f8efed] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.3em] text-[#e88f88]">Protected entry</p>
        <h1 className="mt-4 text-4xl font-light tracking-[-.04em] sm:text-5xl">Agreement Airlock</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#cdb7b3]">
          Review the exact terms that govern protected Klinikos access. This gate records legal acceptance only. Identity, authority, eligibility, credentials and financial truth are resolved separately after entry.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
          <section className="overflow-hidden rounded-3xl border border-[#d9837f]/20 bg-[#0d0708]" aria-labelledby="agreement-document-title">
            <div className="border-b border-[#d9837f]/14 px-6 py-5">
              <h2 className="text-lg font-medium" id="agreement-document-title">{title}</h2>
              <p className="mt-1 text-xs text-[#a98f8b]">Version {documentVersion} · Effective {effectiveDate}</p>
            </div>
            <div className="max-h-[58vh] space-y-7 overflow-y-auto px-6 py-6" tabIndex={0}>
              {sections.map((section) => (
                <article key={section.heading}>
                  <h3 className="text-sm font-semibold text-[#efaaa1]">{section.heading}</h3>
                  <div className="mt-3 space-y-3">
                    {section.paragraphs.map((paragraph) => <p className="text-[13px] leading-6 text-[#d5c0bc]" key={paragraph}>{paragraph}</p>)}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="self-start rounded-3xl border border-[#d9837f]/20 bg-[#100809] p-6 lg:sticky lg:top-6" aria-labelledby="airlock-confirmations">
            <h2 className="text-lg font-medium" id="airlock-confirmations">Required confirmations</h2>
            <div className="mt-5 space-y-3">
              {disclosures.map((disclosure) => (
                <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border border-[#d9837f]/12 bg-[#080405] p-3 text-[13px] leading-5 text-[#e2cfcb]" key={disclosure.key}>
                  <input
                    checked={accepted[disclosure.key] === true}
                    className="mt-1 size-4 accent-[#e6817b]"
                    onChange={(event) => setAccepted((current) => ({ ...current, [disclosure.key]: event.target.checked }))}
                    type="checkbox"
                  />
                  <span>{disclosure.label}</span>
                </label>
              ))}
            </div>

            <p className="mt-5 rounded-2xl border border-[#d9837f]/14 bg-[#080405] p-4 text-xs leading-5 text-[#bda5a1]">{authorityBoundary}</p>

            {!complete ? (
              <button
                className="mt-5 min-h-12 w-full rounded-full bg-[#e6817b] px-5 text-sm font-semibold text-[#1a090a] transition hover:bg-[#efaaa1] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!allAccepted || submitting}
                onClick={() => void acceptAgreement()}
                type="button"
              >
                {submitting ? "Recording acceptance…" : "Agree & continue"}
              </button>
            ) : (
              <div className="mt-5 space-y-3" aria-live="polite">
                <p className="text-sm font-medium text-[#f2d8d4]">Acceptance recorded for this browser. Continue by proving or creating identity.</p>
                <Link className="flex min-h-12 items-center justify-center rounded-full bg-[#e6817b] px-5 text-sm font-semibold text-[#1a090a]" href={`/login${query}`}>{signInLabel}</Link>
                <Link className="flex min-h-12 items-center justify-center rounded-full border border-[#d9837f]/28 px-5 text-sm font-semibold text-[#f5edeb]" href={`/identity/create${query}`}>{createIdentityLabel}</Link>
              </div>
            )}

            {error ? <p className="mt-4 text-sm text-[#ffb4ad]" role="alert">{error}</p> : null}
          </section>
        </div>
      </div>
    </main>
  );
}
