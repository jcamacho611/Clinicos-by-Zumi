"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import {
  PUBLIC_ACCESS_EMAIL_STORAGE_KEY,
  PUBLIC_ACCESS_STORAGE_KEY,
} from "@/lib/legal/public-access-contract";

type AccessResponse = {
  error?: string;
  documentVersion?: string;
};

export function PublicAccessGate({ onAccepted }: { onAccepted: (version: string) => void }) {
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setEmail(window.localStorage.getItem(PUBLIC_ACCESS_EMAIL_STORAGE_KEY) ?? "");
    } catch {
      // Browser storage is a convenience only. The server acceptance record is authoritative evidence.
    }
    emailRef.current?.focus();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted || !email.trim() || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/access/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), accepted: true }),
      });
      const result = await response.json() as AccessResponse;
      if (!response.ok || !result.documentVersion) {
        setError(result.error ?? "We could not record your agreement. Please try again.");
        return;
      }

      try {
        window.localStorage.setItem(PUBLIC_ACCESS_STORAGE_KEY, result.documentVersion);
        window.localStorage.setItem(PUBLIC_ACCESS_EMAIL_STORAGE_KEY, email.trim().toLowerCase());
      } catch {
        // Acceptance can still continue because the server record is the evidence source.
      }
      onAccepted(result.documentVersion);
    } catch {
      setError("We could not record your agreement. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] grid min-h-[100svh] place-items-center overflow-y-auto bg-[#030202]/98 px-4 py-8 text-[#f8f0ee]" role="dialog" aria-modal="true" aria-labelledby="public-access-title" aria-describedby="public-access-description">
      <section className="relative w-full max-w-2xl overflow-hidden rounded-[30px] border border-[#d9918a]/25 bg-[#100709] shadow-[0_40px_140px_rgba(0,0,0,.72)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(182,65,68,.24),transparent_46%)]" />
        <div className="relative p-6 sm:p-9">
          <KlinikosWordmark framed inverse frameClassName="size-12" textClassName="h-6 w-[172px]" />

          <div className="mt-9 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-[#ee9b94]">
            <LockKeyhole className="size-4" aria-hidden="true" />
            Protected Klinikos access
          </div>
          <h1 className="mt-4 max-w-xl text-3xl font-light leading-[1.05] tracking-[-.045em] sm:text-[42px]" id="public-access-title">
            Protect the work before entering Klinikos.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#d2bebb]" id="public-access-description">
            Klinikos includes proprietary product concepts, workflows, interface systems, operating methods, commercial methods, and confidential know-how. Review and accept the Klinikos Access, Confidentiality & Intellectual Property Terms before using the interactive platform.
          </p>

          <div className="mt-6 grid gap-2 text-[12px] leading-5 text-[#bfa6a2] sm:grid-cols-2">
            <p className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e6817b]" aria-hidden="true" />No copying, scraping, reverse engineering, or competitive reproduction.</p>
            <p className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e6817b]" aria-hidden="true" />No unauthorized extraction or ingestion of protected Klinikos material into external AI systems.</p>
          </div>

          <form className="mt-8" onSubmit={submit}>
            <label className="block text-[12px] font-semibold text-[#e6d5d2]" htmlFor="public-access-email">
              Email
            </label>
            <input
              ref={emailRef}
              autoComplete="email"
              className="mt-2 min-h-12 w-full rounded-2xl border border-[#d9918a]/28 bg-[#080405] px-4 text-sm text-[#fff8f6] outline-none transition placeholder:text-[#8e7672] focus:border-[#efaaa1]/70 focus:ring-2 focus:ring-[#e6817b]/25"
              id="public-access-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              type="email"
              value={email}
            />

            <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-[#d9918a]/18 bg-[#160a0d] p-4 text-[12px] leading-6 text-[#cdb8b4]">
              <input className="mt-1 size-4 shrink-0 accent-[#e6817b]" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required type="checkbox" />
              <span>
                <strong className="font-semibold text-[#fff5f2]">I agree to the Klinikos Access, Confidentiality & Intellectual Property Terms</strong> and acknowledge the Privacy Notice. I understand that access does not grant ownership, source-code rights, competitive-use rights, or permission to reproduce protected Klinikos materials.
              </span>
            </label>

            {error ? <p className="mt-4 rounded-xl border border-red-400/25 bg-red-950/25 px-4 py-3 text-[12px] text-red-200" role="alert">{error}</p> : null}

            <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#e6817b] px-6 text-sm font-semibold text-[#180809] transition hover:bg-[#efaaa1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#efaaa1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#100709] disabled:cursor-not-allowed disabled:opacity-45" disabled={!accepted || !email.trim() || submitting} type="submit">
              {submitting ? "Recording agreement…" : "I Agree & Enter Klinikos"}
              {!submitting ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[#b89d99]">
            <Link className="min-h-11 content-center hover:text-[#efaaa1]" href="/legal/access-terms">Access terms</Link>
            <Link className="min-h-11 content-center hover:text-[#efaaa1]" href="/legal/privacy">Privacy notice</Link>
          </div>
          <p className="mt-2 text-[10px] leading-5 text-[#876f6b]">This entry agreement records consent and governs permitted use. It is not a substitute for authenticated role-specific agreements, authorization controls, or server-side confidentiality protections.</p>
        </div>
      </section>
    </div>
  );
}
