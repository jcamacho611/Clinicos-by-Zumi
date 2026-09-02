"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PERSON_ACCOUNT_SIGNUP_LAWS } from "@/lib/auth/person-account-signup";

type SignupLegalDocument = {
  title: string;
  version: string;
  route: string;
};

/**
 * Free entry. Identity stays deliberately small; baseline legal evidence is a separate
 * pair of explicit controls rather than hidden inside the submit button.
 *
 * What this does not ask for is as deliberate as what it does: no licence number, no
 * employer, no Social Security number, no documents. Those belong to verification,
 * which is a separate decision made against separate evidence.
 */
export function SignupForm({
  returnTo,
  websiteTerms,
  privacyPolicy,
}: {
  returnTo: string | null;
  websiteTerms: SignupLegalDocument;
  privacyPolicy: SignupLegalDocument;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = new FormData(event.currentTarget);
    setStatus("submitting");
    setMessage(null);

    try {
      const response = await fetch("/api/account/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          displayName: String(form.get("displayName") ?? ""),
          password: String(form.get("password") ?? ""),
          legalAcceptances: {
            websiteTermsAccepted: form.get("websiteTermsAccepted") === "on",
            websiteTermsVersion: websiteTerms.version,
            privacyPolicyAcknowledged: form.get("privacyPolicyAcknowledged") === "on",
            privacyPolicyVersion: privacyPolicy.version,
          },
        }),
      });

      if (response.ok) {
        // A full navigation, so the new session cookie is presented on the next request.
        window.location.assign(returnTo ?? "/member");
        return;
      }

      const payload = await response.json().catch(() => null) as { error?: string } | null;
      setStatus("error");
      setMessage(payload?.error ?? "We could not create the account. Try again.");
    } catch {
      setStatus("error");
      // Honest failure. The browser does not know whether the account was created, so
      // it does not claim either way.
      setMessage("We could not confirm the response. Klinikos may have received it; try signing in before trying again.");
    }
  }

  return (
    <form className="mt-9 grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <label className="text-[12px] font-semibold text-[#e8cbc7]" htmlFor="signup-name">
          What should we call you?
        </label>
        <input
          autoComplete="name"
          className="min-h-12 rounded-xl border border-[#d9918a]/30 bg-[#1b0d10]/60 px-4 text-[15px] text-[#fff6f4] outline-none focus-visible:border-[#efaaa1]"
          id="signup-name"
          name="displayName"
          required
          type="text"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-semibold text-[#e8cbc7]" htmlFor="signup-email">
          Email
        </label>
        <input
          autoComplete="email"
          className="min-h-12 rounded-xl border border-[#d9918a]/30 bg-[#1b0d10]/60 px-4 text-[15px] text-[#fff6f4] outline-none focus-visible:border-[#efaaa1]"
          id="signup-email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-semibold text-[#e8cbc7]" htmlFor="signup-password">
          Password
        </label>
        <input
          aria-describedby="signup-password-help"
          autoComplete="new-password"
          className="min-h-12 rounded-xl border border-[#d9918a]/30 bg-[#1b0d10]/60 px-4 text-[15px] text-[#fff6f4] outline-none focus-visible:border-[#efaaa1]"
          id="signup-password"
          minLength={12}
          name="password"
          required
          type="password"
        />
        <p className="text-[11.5px] leading-5 text-[#ad928d]" id="signup-password-help">
          At least 12 characters. A phrase you will remember beats a short password with a
          symbol bolted on.
        </p>
      </div>

      <fieldset className="mt-2 grid gap-3 rounded-2xl border border-[#d9918a]/20 bg-black/10 p-4">
        <legend className="px-1 text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9aaa6]">
          Before you join
        </legend>
        <label className="flex items-start gap-3 text-[12px] leading-5 text-[#c6aeaa]">
          <input className="mt-1 size-4 accent-[#e6817b]" name="websiteTermsAccepted" required type="checkbox" />
          <span>
            I agree to the{" "}
            <Link className="font-semibold text-[#efaaa1] underline underline-offset-2" href={websiteTerms.route}>
              {websiteTerms.title}
            </Link>{" "}
            (version {websiteTerms.version}).
          </span>
        </label>
        <label className="flex items-start gap-3 text-[12px] leading-5 text-[#c6aeaa]">
          <input className="mt-1 size-4 accent-[#e6817b]" name="privacyPolicyAcknowledged" required type="checkbox" />
          <span>
            I acknowledge the{" "}
            <Link className="font-semibold text-[#efaaa1] underline underline-offset-2" href={privacyPolicy.route}>
              {privacyPolicy.title}
            </Link>{" "}
            (version {privacyPolicy.version}).
          </span>
        </label>
      </fieldset>

      <button
        className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e6817b] px-6 text-[14px] font-semibold text-[#1a090a] transition hover:bg-[#efaaa1] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={status === "submitting"}
        type="submit"
      >
        {status === "submitting" ? "Creating your account…" : "Join free"}
        {status === "submitting" ? null : <ArrowRight aria-hidden="true" className="size-4" />}
      </button>

      <p aria-live="polite" className="min-h-5 text-[12.5px] text-[#f0897e]" role="status">
        {message}
      </p>

      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9918a]/30 px-5 text-[13px] font-semibold text-[#e8cbc7] transition hover:border-[#efaaa1]/60 hover:text-[#f6dfdc]"
        href={loginHref}
      >
        I already have an account
      </Link>

      <ul className="mt-4 grid gap-2 border-t border-white/[.06] pt-5">
        {PERSON_ACCOUNT_SIGNUP_LAWS.map((law) => (
          <li className="text-[12px] leading-6 text-[#a68e8a]" key={law}>
            {law}
          </li>
        ))}
      </ul>
    </form>
  );
}
