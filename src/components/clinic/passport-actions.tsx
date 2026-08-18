"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PassportWorkspace } from "@/lib/repositories/passport-repository";

export function PassportActions({ workspace }: { workspace: PassportWorkspace }) {
  const [patientId, setPatientId] = useState(workspace.passports[0]?.patientId ?? workspace.patients[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const patient = workspace.patients.find((item) => item.id === patientId);
  const intake = workspace.intakes.find((item) => item.patientId === patientId);

  async function post(key: string, url: string, body: Record<string, unknown>) {
    setBusy(key);
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Passport action failed.");
      window.location.reload();
    } catch (error) { window.alert(error instanceof Error ? error.message : "Passport action failed."); }
    finally { setBusy(null); }
  }

  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center gap-3"><div className="min-w-56 flex-1"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-slate-400">Patient control surface</p><select aria-label="Passport patient" className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800" value={patientId} onChange={(event) => setPatientId(event.target.value)}>{workspace.patients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.mrn}</option>)}</select></div><Button disabled={!patientId || !!busy} onClick={() => post("refresh", "/api/health-passport", { patientId })} size="sm" variant="secondary">{busy === "refresh" ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Refresh from chart</Button><Button disabled={!patientId || !!busy} onClick={() => post("wallet", "/api/consent-wallet", { patientId, sharingDefaults: { treatment: "ask_each_time", payment: "organization_only", operations: "organization_only", sensitiveRecords: "blocked" }, emergencyPreference: "allow_break_glass_with_alert" })} size="sm" variant="secondary">{busy === "wallet" ? <LoaderCircle className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save wallet defaults</Button><Button disabled={!patientId || !!busy} onClick={() => post("intake", "/api/intake-passport", { patientId, reusableFields: intake?.reusableFields ?? { demographics: "confirmed", insurance: "review_due", pharmacy: "review_due", medications: "provider_review", allergies: "confirmed" } })} size="sm">{busy === "intake" ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Confirm reusable intake</Button></div>{patient && <p className="mt-3 text-[12px] leading-5 text-slate-500">Actions are recorded for {patient.name}. Refreshing creates a chart-derived snapshot that stays pending until a human confirms it.</p>}</div>;
}
