"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import type { AgreementAcknowledgment, AgreementPresentation } from "@/lib/legal/global-agreement";

export function EntryAcceptanceClient({
  agreement,
  acknowledgments,
  presentedToken,
  returnTo,
}: {
  agreement: AgreementPresentation;
  acknowledgments: AgreementAcknowledgment[];
  presentedToken: string;
  returnTo?: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const [reviewToken, setReviewToken] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const allAcknowledged = useMemo(
    () => acknowledgments.every(({ key }) => checked[key] === true),
    [acknowledgments, checked],
  );

  useEffect(() => {
    idempotencyKey.current = window.crypto.randomUUID();
    const node = scrollRef.current;
    if (!node) return;
    const update = () => {
      const available = Math.max(1, node.scrollHeight - node.clientHeight);
      setProgress(Math.min(100, Math.round((node.scrollTop / available) * 100)));
    };
    update();
  }, []);

  async function markReviewed() {
    if (reviewToken || reviewing) return;
    setReviewing(true);
    setError("");
    try {
      const response = await fetch("/api/access/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ presentedToken }),
        cache: "no-store",
      });
      const result = await response.json() as { reviewToken?: string; error?: string };
      if (!response.ok || !result.reviewToken) {
        setError(result.error ?? "Klinikos could not verify the agreement review.");
        return;
      }
      setReviewToken(result.reviewToken);
      setProgress(100);
    } catch {
      setError("Klinikos could not verify the agreement review. Check your connection and try again.");
    } finally {
      setReviewing(false);
    }
  }

  function onAgreementScroll() {
    const node = scrollRef.current;
    if (!node) return;
    const available = Math.max(1, node.scrollHeight - node.clientHeight);
    const nextProgress = Math.min(100, Math.round((node.scrollTop / available) * 100));
    setProgress(nextProgress);
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 10) {
      void markReviewed();
    }
  }

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    if (node.scrollHeight <= node.clientHeight + 2) void markReviewed();
  // The review request must run only against the initial presented token unless the page reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function accept() {
    if (!reviewToken || !allAcknowledged || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/access/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reviewToken,
          acknowledgments: checked,
          idempotencyKey: idempotencyKey.current ?? window.crypto.randomUUID(),
          returnTo,
        }),
        cache: "no-store",
      });
      const result = await response.json() as { loginHref?: string; error?: string };
      if (!response.ok || !result.loginHref) {
        setError(result.error ?? "Klinikos could not record your protected-entry acceptance.");
        return;
      }
      window.location.assign(result.loginHref);
    } catch {
      setError("Klinikos could not complete protected entry. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="rose-home relative min-h-screen overflow-hidden bg-[#050303] text-[#f8f0ee]" data-klinikos-ds>
      <div className="rose-vignette pointer-events-none fixed inset-0 z-0" />
      <div className="rose-atmosphere pointer-events-none fixed inset-0 z-0 opacity-50" />

      <header className="relative z-20 flex min-h-[96px] items-center justify-between px-5 sm:px-9 lg:px-[38px]">
        <KlinikosWordmark
          className="gap-[18px]"
          frameClassName="size-[58px]"
          href="/"
          framed
          inverse
          markClassName="h-full w-full"
          textClassName="h-[32px] w-[230px]"
        />
        <Link className="rounded-full border border-[#d9837f]/20 bg-[#140a0c]/70 px-5 py-3 text-[11px] font-semibold text-[#e5d3d0] backdrop-blur-xl transition hover:border-[#efaaa1]/50 hover:text-white" href="/">
          Return to public Klinikos
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-[1280px] gap-8 px-5 pb-12 pt-6 sm:px-9 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:gap-12 lg:pb-16">
        <div className="max-w-xl lg:pb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e6817b]/18 bg-[#13090b]/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#e99a93] backdrop-blur-xl">
            <LockKeyhole className="size-3.5" /> Protected entry
          </div>
          <h1 className="mt-7 text-balance text-[clamp(2.75rem,5vw,5.25rem)] font-extralight leading-[.98] tracking-[-.06em] text-[#fff7f5]">
            Enter Klinikos.
          </h1>
          <p className="mt-6 max-w-lg text-[15px] leading-7 text-[#d6bfbb]">
            Public Klinikos is open to discover. The interactive ecosystem is governed. Review the protected-entry terms once, then continue to authentication and let Zumi guide what happens next.
          </p>

          <div className="mt-9 grid gap-3 text-[12px] leading-5 text-[#bda5a1] sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="flex gap-3 rounded-[20px] border border-[#e6817b]/12 bg-[#100709]/55 p-4 backdrop-blur-xl"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e99089]" /><span>Protected product access is limited and confidential; public marketing remains public.</span></div>
            <div className="flex gap-3 rounded-[20px] border border-[#e6817b]/12 bg-[#100709]/55 p-4 backdrop-blur-xl"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e99089]" /><span>Zumi assists and orchestrates; governed systems remain authoritative.</span></div>
            <div className="flex gap-3 rounded-[20px] border border-[#e6817b]/12 bg-[#100709]/55 p-4 backdrop-blur-xl"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e99089]" /><span>Acceptance is recorded server-side against the exact agreement version and hash.</span></div>
            <div className="flex gap-3 rounded-[20px] border border-[#e6817b]/12 bg-[#100709]/55 p-4 backdrop-blur-xl"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e99089]" /><span>No patient information or professional credentials are required to review these terms.</span></div>
          </div>

          <p className="mt-8 text-[11px] leading-5 text-[#8f7773]">
            This protected-entry agreement is not a BAA, patient consent, professional credential verification, payment evidence, or authority to act for an organization.
          </p>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-[#e28b85]/18 bg-[#0b0507]/[.92] shadow-[0_30px_120px_rgba(0,0,0,.5)] backdrop-blur-2xl">
          <div className="border-b border-[#e28b85]/12 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">Klinikos protected-entry agreement</p>
                <h2 className="mt-2 text-xl font-light tracking-[-.035em] text-[#fff8f6]">{agreement.title}</h2>
                <p className="mt-2 text-[11px] text-[#917975]">Version {agreement.documentVersion} · Effective {agreement.effectiveDate}</p>
              </div>
              <div className="min-w-[112px] rounded-full border border-[#e6817b]/14 bg-[#12080a] px-3 py-2 text-center text-[10px] font-semibold text-[#bca4a0]">
                {reviewToken ? "Review verified" : reviewing ? "Verifying..." : `${progress}% reviewed`}
              </div>
            </div>
          </div>

          <div
            aria-label="Protected entry agreement"
            className="max-h-[42vh] space-y-7 overflow-y-auto px-5 py-6 text-[12px] leading-6 text-[#c8b1ad] sm:max-h-[48vh] sm:px-7"
            onScroll={onAgreementScroll}
            ref={scrollRef}
            tabIndex={0}
          >
            {agreement.sections.map((section) => (
              <section key={section.heading}>
                <h3 className="text-[12px] font-semibold text-[#f0deda]">{section.heading}</h3>
                <div className="mt-2 space-y-3">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}
            <div className="border-t border-[#e6817b]/12 pt-5 text-[11px] text-[#8f7773]">
              Contracting entity: {agreement.contractingEntity}. Legal contact: {agreement.legalContactEmail}.
            </div>
          </div>

          <div className="border-t border-[#e28b85]/12 bg-[#080405]/90 px-5 py-5 sm:px-7">
            {!reviewToken ? (
              <div className="mb-4 flex items-center gap-3 rounded-[18px] border border-[#e6817b]/12 bg-[#13080a]/65 px-4 py-3 text-[11px] leading-5 text-[#aa918d]">
                {reviewing ? <LoaderCircle className="size-4 shrink-0 animate-spin text-[#e99089]" /> : <ArrowRight className="size-4 shrink-0 text-[#e99089]" />}
                Scroll through the agreement to unlock the required acknowledgments. Scrolling records presentation/review interaction; it does not claim you read or understood every word.
              </div>
            ) : null}

            <div className="space-y-3">
              {acknowledgments.map((acknowledgment) => {
                const active = checked[acknowledgment.key] === true;
                return (
                  <label className={`flex cursor-pointer gap-3 rounded-[18px] border p-4 transition ${active ? "border-[#e6817b]/35 bg-[#e6817b]/[.07]" : "border-[#e6817b]/12 bg-[#100709]/50"}`} key={acknowledgment.key}>
                    <input
                      checked={active}
                      className="sr-only"
                      disabled={!reviewToken}
                      onChange={(event) => setChecked((current) => ({ ...current, [acknowledgment.key]: event.target.checked }))}
                      type="checkbox"
                    />
                    <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${active ? "border-[#e6817b] bg-[#e6817b] text-[#1c090b]" : "border-[#b16a66]/35 text-transparent"}`}><Check className="size-3.5" /></span>
                    <span className={`text-[11px] leading-5 ${reviewToken ? "text-[#cbb5b1]" : "text-[#745f5c]"}`}>{acknowledgment.label}</span>
                  </label>
                );
              })}
            </div>

            {error ? <p className="mt-4 rounded-[16px] border border-rose-300/20 bg-rose-300/[.05] px-4 py-3 text-[11px] font-semibold leading-5 text-rose-200" role="alert">{error}</p> : null}

            <button
              className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#e6817b] px-6 text-[13px] font-semibold text-[#1a090a] transition hover:bg-[#efaaa1] disabled:cursor-not-allowed disabled:opacity-35"
              disabled={!reviewToken || !allAcknowledged || submitting}
              onClick={() => void accept()}
              type="button"
            >
              {submitting ? <><LoaderCircle className="size-4 animate-spin" /> Recording protected entry...</> : <>Agree & Enter Klinikos <ArrowRight className="size-4" /></>}
            </button>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-semibold text-[#846d69]">
              <Link className="hover:text-[#dca39d]" href="/legal/privacy">Privacy</Link>
              <Link className="hover:text-[#dca39d]" href="/trust">Trust & security</Link>
              <Link className="hover:text-[#dca39d]" href="/">Public Klinikos</Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
