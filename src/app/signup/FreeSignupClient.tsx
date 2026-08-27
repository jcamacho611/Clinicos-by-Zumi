"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";

export function FreeSignupClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, acceptedTerms, acceptedPrivacy }),
        cache: "no-store",
      });
      const result = await response.json() as { error?: string; redirectTo?: string };
      if (!response.ok) {
        setError(result.error ?? "Klinikos could not create your account.");
        return;
      }
      window.location.assign(result.redirectTo ?? "/member");
    } catch {
      setError("Klinikos could not create your account. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length >= 2
    && Boolean(email.trim())
    && password.length >= 12
    && password === confirmPassword
    && acceptedTerms
    && acceptedPrivacy;

  const inputClass = "mt-2 min-h-12 w-full rounded-[14px] border border-[#4f292d] bg-[#12090b] px-4 text-sm text-[#fff8f6] outline-none transition placeholder:text-[#785f5d] focus:border-[#e28b85] focus-visible:ring-2 focus-visible:ring-[#e28b85]/30";

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <label className="block text-[11px] font-semibold text-[#d8c1bd]">
        Name
        <input autoComplete="name" className={inputClass} maxLength={140} minLength={2} onChange={(event) => setName(event.target.value)} placeholder="How should Klinikos address you?" required value={name} />
      </label>

      <label className="block text-[11px] font-semibold text-[#d8c1bd]">
        Email
        <input autoComplete="email" className={inputClass} maxLength={254} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
        <span className="mt-2 block text-[10px] font-normal leading-5 text-[#927b77]">This begins as an account/contact claim. Organization, school, employer, and professional affiliations are verified separately when needed.</span>
      </label>

      <label className="block text-[11px] font-semibold text-[#d8c1bd]">
        Password
        <input autoComplete="new-password" className={inputClass} minLength={12} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        <span className="mt-2 block text-[10px] font-normal leading-5 text-[#927b77]">Use 12+ characters with uppercase, lowercase, a number, and a symbol.</span>
      </label>

      <label className="block text-[11px] font-semibold text-[#d8c1bd]">
        Confirm password
        <input autoComplete="new-password" className={inputClass} minLength={12} onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} />
      </label>

      <fieldset className="space-y-3 border-t border-[#4f292d] pt-5">
        <legend className="sr-only">Account agreements</legend>
        <label className="flex items-start gap-3 text-[11px] leading-5 text-[#bda5a1]">
          <input checked={acceptedTerms} className="mt-1 accent-[#e6817b]" onChange={(event) => setAcceptedTerms(event.target.checked)} required type="checkbox" />
          <span>I agree to the <Link className="font-semibold text-[#edaaa3] underline underline-offset-4" href="/legal/terms" target="_blank">Website Terms of Use</Link>.</span>
        </label>
        <label className="flex items-start gap-3 text-[11px] leading-5 text-[#bda5a1]">
          <input checked={acceptedPrivacy} className="mt-1 accent-[#e6817b]" onChange={(event) => setAcceptedPrivacy(event.target.checked)} required type="checkbox" />
          <span>I acknowledge the <Link className="font-semibold text-[#edaaa3] underline underline-offset-4" href="/legal/privacy" target="_blank">Privacy Policy</Link>.</span>
        </label>
      </fieldset>

      <div className="flex gap-3 rounded-[16px] border border-[#4f292d] bg-[#100709] p-4 text-[10px] leading-5 text-[#a88f8b]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e99089]" aria-hidden="true" />
        <span>Joining creates one personal Klinikos identity. It does not create a clinic, verify a credential, establish clinical authority, grant patient-data access, confirm payment, or make any organization claim true.</span>
      </div>

      <p className="text-[10px] leading-5 text-[#8f7773]">Do not enter patient names, diagnoses, medical records, PHI, payment credentials, or other secrets during public signup.</p>

      {error ? <p className="rounded-[14px] border border-rose-300/20 bg-[#2a1014] px-4 py-3 text-[11px] font-semibold leading-5 text-rose-200" role="alert">{error}</p> : null}

      <button className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#e6817b] px-6 text-[13px] font-bold text-[#1a090a] transition hover:bg-[#efaaa1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c2bc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0507] disabled:cursor-not-allowed disabled:opacity-40" disabled={submitting || !canSubmit} type="submit">
        {submitting ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Creating your account...</> : <>Create account <ArrowRight className="size-4" aria-hidden="true" /></>}
      </button>

      <p className="text-center text-[10px] font-semibold text-[#846d69]">
        Already have an account? <Link className="text-[#dca39d] hover:text-[#f0b9b3]" href="/login">Sign in</Link>
      </p>
    </form>
  );
}
