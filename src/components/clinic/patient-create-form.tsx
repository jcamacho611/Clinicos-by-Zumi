"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PatientCreateForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
      sexAtBirth: String(formData.get("sexAtBirth") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      preferredLanguage: String(formData.get("preferredLanguage") ?? "English"),
    };
    try {
      const response = await fetch("/api/patients", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string; patientId?: string };
      if (!response.ok || !result.patientId) {
        setError(result.error ?? "Unable to create the patient record.");
        return;
      }
      router.push(`/patients/${result.patientId}`);
      router.refresh();
    } catch {
      setError("Unable to reach Klinikos. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="mx-auto max-w-3xl space-y-6" onSubmit={submit}>
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-cyan-700">New patient</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-[-.04em] text-slate-950">Create a patient record</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Start with the minimum identity information. Klinikos checks for a same-name/date-of-birth duplicate before creating a chart.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-700">First name<Input autoComplete="given-name" className="mt-2" name="firstName" required /></label>
        <label className="text-xs font-bold text-slate-700">Last name<Input autoComplete="family-name" className="mt-2" name="lastName" required /></label>
        <label className="text-xs font-bold text-slate-700">Date of birth<Input className="mt-2" name="dateOfBirth" required type="date" /></label>
        <label className="text-xs font-bold text-slate-700">Sex at birth<Input className="mt-2" name="sexAtBirth" /></label>
        <label className="text-xs font-bold text-slate-700">Phone<Input autoComplete="tel" className="mt-2" name="phone" type="tel" /></label>
        <label className="text-xs font-bold text-slate-700">Email<Input autoComplete="email" className="mt-2" name="email" type="email" /></label>
        <label className="text-xs font-bold text-slate-700 sm:col-span-2">Preferred language<Input className="mt-2" defaultValue="English" name="preferredLanguage" required /></label>
      </div>
      {error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}
      <div className="mt-6 flex justify-end">
        <Button disabled={submitting} type="submit" variant="primary">{submitting ? <><LoaderCircle className="size-4 animate-spin" /> Creating patient...</> : <><UserPlus className="size-4" /> Create patient</>}</Button>
      </div>
    </div>
  </form>;
}
