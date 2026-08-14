"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PortalLoginForm({ clinic = "", demoCredentials }: { clinic?: string; demoCredentials?: { email: string; password: string } }) {
  const [organization, setOrganization] = useState(clinic);
  const [email, setEmail] = useState(demoCredentials?.email ?? "");
  const [password, setPassword] = useState(demoCredentials?.password ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const response = await fetch("/api/portal/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organization, email, password }) });
      const result = await response.json() as { error?: string; redirectTo?: string };
      if (!response.ok) { setError(result.error ?? "Unable to sign in."); return; }
      window.location.assign(result.redirectTo ?? "/portal");
    } catch { setError("Unable to reach the patient portal. Check your connection and try again."); }
    finally { setSubmitting(false); }
  }

  return <form className="mt-8 space-y-4" onSubmit={submit}>
    <label className="block text-xs font-bold text-[#213d37]">Clinic code<Input autoCapitalize="none" autoComplete="organization" className="mt-2 border-[#cadbd3] bg-white" name="organization" onChange={(event) => setOrganization(event.target.value.toLowerCase())} placeholder="your-clinic" required value={organization} /></label>
    <label className="block text-xs font-bold text-[#213d37]">Email address<Input autoComplete="username" className="mt-2 border-[#cadbd3] bg-white" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
    <label className="block text-xs font-bold text-[#213d37]">Password<Input autoComplete="current-password" className="mt-2 border-[#cadbd3] bg-white" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
    {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}
    <Button className="w-full bg-[#153f37] text-white hover:bg-[#0e312b]" disabled={submitting} size="lg" type="submit">{submitting ? <><LoaderCircle className="size-4 animate-spin" /> Opening your portal...</> : <>Open my portal <ArrowRight className="size-4" /></>}</Button>
    {demoCredentials && <p className="text-center text-[10px] leading-5 text-[#748b83]">Synthetic demo credentials are prefilled only outside production.</p>}
  </form>;
}
