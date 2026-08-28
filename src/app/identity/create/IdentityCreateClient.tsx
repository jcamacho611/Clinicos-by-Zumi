"use client";

import { FormEvent, useState } from "react";

export function IdentityCreateClient({
  returnTo,
  nameLabel,
  emailLabel,
  submitLabel,
}: {
  returnTo: string;
  nameLabel: string;
  emailLabel: string;
  submitLabel: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/identity/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, returnTo }),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Identity verification could not be started.");
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Identity verification could not be started.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050303] px-5 py-16 text-[#f8efed] sm:px-8">
      <section className="mx-auto max-w-xl rounded-3xl border border-[#d9837f]/20 bg-[#0d0708] p-7 sm:p-9">
        <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#e88f88]">Identity</p>
        <h1 className="mt-4 text-4xl font-light tracking-[-.04em]">Continue as yourself.</h1>
        <p className="mt-4 text-sm leading-7 text-[#cdb7b3]">Klinikos only needs enough information to establish and secure your universal identity here. Any organization relationship or professional status is handled later through separate claims, verification and authorization.</p>

        {!complete ? (
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <label className="block text-sm font-medium text-[#ead8d4]">
              {nameLabel}
              <input autoComplete="name" className="mt-2 min-h-12 w-full rounded-2xl border border-[#d9837f]/18 bg-[#080405] px-4 text-[#fff7f5] outline-none focus:border-[#efaaa1]/60" maxLength={160} onChange={(event) => setName(event.target.value)} required value={name} />
            </label>
            <label className="block text-sm font-medium text-[#ead8d4]">
              {emailLabel}
              <input autoComplete="email" className="mt-2 min-h-12 w-full rounded-2xl border border-[#d9837f]/18 bg-[#080405] px-4 text-[#fff7f5] outline-none focus:border-[#efaaa1]/60" maxLength={254} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </label>
            <button className="min-h-12 w-full rounded-full bg-[#e6817b] px-5 text-sm font-semibold text-[#1a090a] transition hover:bg-[#efaaa1] disabled:opacity-45" disabled={submitting || !name.trim() || !email.trim()} type="submit">
              {submitting ? "Sending secure verification…" : submitLabel}
            </button>
            {error ? <p className="text-sm text-[#ffb4ad]" role="alert">{error}</p> : null}
          </form>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#d9837f]/16 bg-[#080405] p-5" aria-live="polite">
            <h2 className="text-lg font-medium">Check your email.</h2>
            <p className="mt-2 text-sm leading-6 text-[#cdb7b3]">Use the secure verification link we sent to continue into your Klinikos experience. The link proves control of this email. It does not grant professional, organization, clinical, Grid, patient-access, payment, or financial authority.</p>
          </div>
        )}
      </section>
    </main>
  );
}
