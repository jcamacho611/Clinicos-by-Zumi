"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { commandSurfaces } from "@/lib/design/command-system";

/**
 * Spend an activation token.
 *
 * The token stays in the URL and is posted to the server; nothing about the account is
 * decided here. The server re-verifies the signature, re-checks that the token still
 * matches a real user in the named organization, and refuses if a credential already
 * exists — so a replayed link cannot take an account over.
 */
export function ActivateAccountForm() {
  const router = useRouter();
  const token = useSearchParams().get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!token) {
    return (
      <p className="text-[13px] leading-7 text-slate-300">
        This link is missing its activation token. Open the link from your Klinikos email exactly as it was sent —
        some mail clients truncate long links when they are copied by hand.
      </p>
    );
  }

  const tooShort = password.length < 12;
  const mismatch = confirm.length > 0 && confirm !== password;

  function submit() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      }).catch(() => null);

      const payload = await response?.json().catch(() => null);
      if (!response?.ok) {
        setError(payload?.error ?? "This account could not be activated.");
        return;
      }
      router.push(payload?.redirectTo ?? "/login");
    });
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">Password</span>
        <input
          autoComplete="new-password"
          className="min-h-[44px] border border-white/10 bg-[#05090f] px-3 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">Confirm password</span>
        <input
          autoComplete="new-password"
          className="min-h-[44px] border border-white/10 bg-[#05090f] px-3 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          onChange={(event) => setConfirm(event.target.value)}
          type="password"
          value={confirm}
        />
      </label>

      <p aria-live="polite" className="text-[12px] leading-6 text-slate-500">
        {tooShort ? "At least 12 characters." : mismatch ? "The two passwords do not match." : "Ready."}
      </p>

      <button
        className={`${commandSurfaces.interactive} justify-self-start border border-cyan-300/40 bg-cyan-400/[.08] px-5 text-sm font-extrabold text-cyan-200 disabled:opacity-40`}
        disabled={pending || tooShort || password !== confirm}
        onClick={submit}
        type="button"
      >
        {pending ? "Activating…" : "Activate my account"}
      </button>

      {error && (
        <p className="text-[12px] leading-6 text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
