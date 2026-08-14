"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ds";

function Field({
  autoCapitalize,
  autoComplete,
  label,
  minLength,
  name,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  autoCapitalize?: string;
  autoComplete?: string;
  label: string;
  minLength?: number;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-extrabold">
      {label}
      <input
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        className="mt-2 min-h-12 w-full px-4 py-3 text-base outline-none transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-signal)]"
        minLength={minLength}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          background: "var(--surface-paper)",
          border: "var(--border-hair-light)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-on-paper)",
        }}
        type={type}
        value={value}
      />
    </label>
  );
}

export function PortalLoginForm({ clinic = "", demoCredentials }: { clinic?: string; demoCredentials?: { email: string; password: string } }) {
  const [organization, setOrganization] = useState(clinic);
  const [email, setEmail] = useState(demoCredentials?.email ?? "");
  const [password, setPassword] = useState(demoCredentials?.password ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organization, email, password }),
      });
      const result = await response.json() as { error?: string; redirectTo?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to sign in.");
        return;
      }
      window.location.assign(result.redirectTo ?? "/portal");
    } catch {
      setError("Unable to reach the patient portal. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <Field
        autoCapitalize="none"
        autoComplete="organization"
        label="Clinic code"
        name="organization"
        onChange={(value) => setOrganization(value.toLowerCase())}
        placeholder="your-clinic"
        required
        value={organization}
      />
      <Field
        autoComplete="username"
        label="Email address"
        name="email"
        onChange={setEmail}
        required
        type="email"
        value={email}
      />
      <Field
        autoComplete="current-password"
        label="Password"
        minLength={8}
        name="password"
        onChange={setPassword}
        required
        type="password"
        value={password}
      />
      {error && (
        <p
          className="px-4 py-3 text-sm font-semibold"
          role="alert"
          style={{
            background: "color-mix(in oklch, var(--status-signal) 10%, var(--surface-paper))",
            border: "1px solid color-mix(in oklch, var(--status-signal) 34%, var(--line-light))",
            borderRadius: "var(--radius-md)",
            color: "var(--status-signal)",
          }}
        >
          {error}
        </p>
      )}
      <Button disabled={submitting} size="lg" style={{ justifyContent: "center", width: "100%" }} type="submit" variant="primary">
        {submitting ? (
          <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Opening your portal...</>
        ) : (
          <>Open my portal <ArrowRight className="size-4" aria-hidden="true" /></>
        )}
      </Button>
      {demoCredentials && (
        <p className="text-center text-xs leading-5" style={{ color: "var(--text-on-paper-dim)" }}>
          Synthetic demo credentials are prefilled only outside production.
        </p>
      )}
    </form>
  );
}
