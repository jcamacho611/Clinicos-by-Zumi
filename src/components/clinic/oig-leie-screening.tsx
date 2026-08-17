"use client";

import { useState } from "react";
import { AlertTriangle, LoaderCircle, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type LeieResult = {
  source: "HHS OIG LEIE";
  queryNpi: string;
  possibleMatches: Array<{
    lastName: string | null;
    firstName: string | null;
    businessName: string | null;
    general: string | null;
    specialty: string | null;
    npi: string | null;
    state: string | null;
    exclusionType: string | null;
    exclusionDate: string | null;
  }>;
  screenedAt: string;
  verificationNotice: string;
};

export function OigLeieScreening({ npi }: { npi: string | null }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LeieResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function screen() {
    if (!npi || busy) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/provider-network/oig-leie/${encodeURIComponent(npi)}`, { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "HHS OIG LEIE screening failed.");
      setResult(payload?.data ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "HHS OIG LEIE screening failed.");
    } finally { setBusy(false); }
  }

  if (!npi) return null;

  const hasPossibleMatch = Boolean(result?.possibleMatches.length);
  return <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-500">Free federal exclusion screening</p><p className="mt-1 text-[10px] text-slate-400">HHS OIG LEIE · public downloadable database</p></div>
      <Button disabled={busy} onClick={screen} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Search className="size-3.5" />} Screen LEIE</Button>
    </div>
    {result && <div className="mt-3 space-y-2 text-[10px] leading-5">
      <p className={`flex items-center gap-1.5 font-extrabold ${hasPossibleMatch ? "text-rose-700" : "text-teal-700"}`}>{hasPossibleMatch ? <AlertTriangle className="size-3.5" /> : <ShieldCheck className="size-3.5" />}{hasPossibleMatch ? `${result.possibleMatches.length} possible exclusion match${result.possibleMatches.length === 1 ? "" : "es"}` : "No NPI match found in the downloaded LEIE screening data"}</p>
      {hasPossibleMatch && result.possibleMatches.slice(0, 3).map((match, index) => <div className="rounded-xl bg-rose-50 p-2 text-rose-900" key={`${match.npi}-${index}`}><strong>{match.businessName ?? [match.firstName, match.lastName].filter(Boolean).join(" ") ?? "Possible match"}</strong>{match.state ? ` · ${match.state}` : ""}{match.exclusionType ? ` · ${match.exclusionType}` : ""}{match.exclusionDate ? ` · ${match.exclusionDate}` : ""}</div>)}
      <p className="text-amber-800">{result.verificationNotice}</p>
    </div>}
    {error && <p className="mt-3 text-[10px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}