"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AccessPage() {
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function continueIntoKlinikos(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted || !email.trim() || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/access/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), accepted: true }),
      });
      const result = await response.json() as { error?: string; acceptedAt?: string; documentVersion?: string; acceptanceId?: string };
      if (!response.ok) {
        setError(result.error ?? "We could not record your agreement. Please try again.");
        return;
      }
      try {
        window.localStorage.setItem("klinikos-access-email", email.trim().toLowerCase());
        window.localStorage.setItem("klinikos-access-terms-version", result.documentVersion ?? "2026-08-10.1");
        window.localStorage.setItem("klinikos-access-accepted-at", result.acceptedAt ?? new Date().toISOString());
        if (result.acceptanceId) window.localStorage.setItem("klinikos-access-acceptance-id", result.acceptanceId);
      } catch {
        // Server-side acceptance is authoritative; browser storage is only a convenience marker.
      }
      setSubmitted(true);
    } catch {
      setError("We could not record your agreement. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-14 sm:px-8">
          <section className="w-full border-y border-slate-200 bg-white py-14 sm:px-10">
            <div className="mx-auto max-w-xl px-5 sm:px-0">
              <CheckCircle2 className="size-9 text-teal-700" />
              <p className="mt-6 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">Agreement recorded</p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-[-.055em]">Welcome to Klinikos.</h1>
              <p className="mt-5 text-sm leading-7 text-slate-600">Your evaluation access is subject to the current Klinikos Access, Confidentiality & Intellectual Property Terms. Your acceptance has been recorded for this evaluation request.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="primary"><Link href="/">View Klinikos <ArrowRight className="size-4" /></Link></Button>
                <Button asChild variant="secondary"><Link href="/sales">Request a Clinic Operating Analysis</Link></Button>
                <Button asChild variant="secondary"><Link href="/login">Sign in</Link></Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07151c] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:items-center lg:py-16">
        <section>
          <div className="flex items-center gap-3"><BrandMark /><div><p className="text-sm font-extrabold">Klinikos</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#e6c55b]">Private product access</p></div></div>
          <p className="mt-14 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6c55b]">The Clinic Operating System</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[.98] tracking-[-.065em] sm:text-6xl">See the operating system. Protect the work.</h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300">Klinikos contains proprietary software architecture, workflows, interface concepts, commercial methods, implementation materials, product documentation and confidential operating knowledge. Detailed product access is provided for evaluation only.</p>
          <div className="mt-9 grid max-w-2xl gap-4 sm:grid-cols-2">
            {["No copying, scraping or competitive reproduction", "No reverse engineering or unauthorized extraction", "No implied license to proprietary Klinikos materials", "Clinical and healthcare safety boundaries remain in force"].map((item) => <div className="flex gap-3 border-t border-white/15 pt-4 text-xs leading-6 text-slate-300" key={item}><ShieldCheck className="mt-1 size-4 shrink-0 text-[#e6c55b]" />{item}</div>)}
          </div>
        </section>

        <section className="bg-white p-6 text-slate-950 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-5"><LockKeyhole className="size-5 text-[#9a7a1f]" /><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#9a7a1f]">Evaluation access</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-.04em]">Enter with your work email.</h2></div></div>
          <form className="mt-6" onSubmit={continueIntoKlinikos}>
            <label className="text-xs font-bold text-slate-700">Work email<Input autoComplete="email" className="mt-2 h-12" onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required type="email" value={email} /></label>
            <label className="mt-5 flex cursor-pointer items-start gap-3 border border-slate-200 p-4 text-xs leading-6 text-slate-600"><input checked={accepted} className="mt-1 accent-slate-950" onChange={(event) => setAccepted(event.target.checked)} required type="checkbox" /><span><strong className="text-slate-950">I agree to the Klinikos Access, Confidentiality & Intellectual Property Terms</strong> and acknowledge the Privacy Notice. I understand access does not grant ownership, source-code rights, competitive-use rights or permission to reproduce proprietary Klinikos materials.</span></label>
            {error && <p className="mt-4 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">{error}</p>}
            <Button className="mt-5 w-full" disabled={!accepted || !email.trim() || submitting} size="lg" type="submit" variant="primary">{submitting ? <><LoaderCircle className="size-4 animate-spin" /> Recording agreement...</> : <>Enter Klinikos <ArrowRight className="size-4" /></>}</Button>
          </form>
          <div className="mt-6 border-t border-slate-200 pt-5 text-[10px] leading-5 text-slate-500">Your acceptance is recorded server-side with the current agreement version and request metadata. Evaluation acceptance is separate from clinic, provider, GRID and production agreements, which require their own role-specific terms and operational approvals.</div>
          <div className="mt-4 flex gap-4 text-[10px] font-bold"><Link className="text-slate-700 hover:text-slate-950" href="/legal/access-terms">Access terms</Link><Link className="text-slate-700 hover:text-slate-950" href="/legal/privacy">Privacy notice</Link></div>
        </section>
      </div>
    </main>
  );
}
