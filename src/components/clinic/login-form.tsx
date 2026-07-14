"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  demoCredentials?: { email: string; password: string };
}

export function LoginForm({ demoCredentials }: LoginFormProps) {
  const [email, setEmail] = useState(demoCredentials?.email ?? "");
  const [password, setPassword] = useState(demoCredentials?.password ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setError(result.error ?? "Unable to sign in.");
        return;
      }

      window.location.assign(result.redirectTo ?? "/dashboard");
    } catch {
      setError("Unable to reach ClinicOS. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={submit}>
      <label className="block text-xs font-bold text-slate-700">
        Email address
        <Input autoComplete="username" className="mt-2" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
      </label>
      <label className="block text-xs font-bold text-slate-700">
        Password
        <Input autoComplete="current-password" className="mt-2" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
      </label>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">{error}</p>}
      <Button className="w-full" disabled={submitting} size="lg" type="submit" variant="primary">
        {submitting ? <><LoaderCircle className="size-4 animate-spin" /> Signing in securely...</> : <>Continue to ClinicOS <ArrowRight className="size-4" /></>}
      </Button>
      {demoCredentials && <p className="text-center text-[10px] leading-5 text-slate-400">Development demo credentials are prefilled. Demo access is disabled automatically in production.</p>}
    </form>
  );
}
