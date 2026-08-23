"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";

export function FreeSignupClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        body: JSON.stringify({ name, email, password }),
        cache: "no-store",
      });
      const result = await response.json() as { error?: string; redirectTo?: string };
      if (!response.ok) {
        if (result.redirectTo) {
          window.location.assign(result.redirectTo);
          return;
        }
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

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <label className="block text-[11px] font-semibold text-[#d8c1bd]">
        Name
        <input
          autoComplete="name"
          className="mt-2 min-h-12 w-full rounded-[16px] border border-[#e6817b]/15 bg-[#100709]/80 px-4 text-sm text-[#fff7f5] outline-none transition placeholder:text-[#735f5c] focus:border-[#efaaa1]/55"
          maxLength={140}
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          placeholder="How should Klinikos address you?"
          required
          value={name}
        />
      </label>

      <label className="block text-[11px] font-semibold text-[#d8c1bd]">
        Email
        <input
          autoComplete="email"
          className="mt-2 min-h-12 w-full rounded-[16px] border border-[#e6817b]/15 bg-[#100709]/80 px-4 text-sm text-[#fff7f5] outline-none transition placeholder:text-[#735f5c] focus:border-[#efaaa1]/55"
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="block text-[11px] font-semibold text-[#d8c1bd]">
        Password
        <input
          autoComplete="new-password"
          className="mt-2 min-h-12 w-full rounded-[16px] border border-[#e6817b]/15 bg-[#100709]/80 px-4 text-sm text-[#fff7f5] outline-none transition placeholder:text-[#735f5c] focus:border-[#efaaa1]/55"
          minLength={12}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <span className="mt-2 block text-[10px] font-normal leading-5 text-[#8f7773]">Use 12+ characters with uppercase, lowercase, a number, and a symbol.</span>
      </label>

      <label className="block text-[11px] font-semibold text-[#d8c1bd]">
        Confirm password
        <input
          autoComplete="new-password"
          className="mt-2 min-h-12 w-full rounded-[16px] border border-[#e6817b]/15 bg-[#100709]/80 px-4 text-sm text-[#fff7f5] outline-none transition placeholder:text-[#735f5c] focus:border-[#efaaa1]/55"
          minLength={12}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </label>

      <div className="flex gap-3 rounded-[18px] border border-[#e6817b]/12 bg-[#12080a]/55 p-4 text-[10px] leading-5 text-[#9f8884]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e99089]" />
        <span>Joining creates your personal Klinikos identity. It does not create a clinic, professional credential, clinical privilege, seller approval, or patient relationship.</span>
      </div>

      {error ? <p className="rounded-[16px] border border-rose-300/20 bg-rose-300/[.05] px-4 py-3 text-[11px] font-semibold leading-5 text-rose-200" role="alert">{error}</p> : null}

      <button
        className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#e6817b] px-6 text-[13px] font-semibold text-[#1a090a] transition hover:bg-[#efaaa1] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={submitting || name.trim().length < 2 || !email.trim() || password.length < 12 || password !== confirmPassword}
        type="submit"
      >
        {submitting ? <><LoaderCircle className="size-4 animate-spin" /> Creating your Klinikos identity...</> : <>Create free account <ArrowRight className="size-4" /></>}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-semibold text-[#846d69]">
        <span className="inline-flex items-center gap-1.5"><LockKeyhole className="size-3" /> Protected entry accepted</span>
        <Link className="hover:text-[#dca39d]" href="/login">Already have an account? Sign in</Link>
      </div>
    </form>
  );
}
