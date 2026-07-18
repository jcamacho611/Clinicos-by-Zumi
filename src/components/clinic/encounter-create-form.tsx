"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, LoaderCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface EncounterCreationOptions {
  patients: Array<{ id: string; name: string; mrn: string }>;
  providers: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string; timezone: string }>;
}

export function EncounterCreateForm({ canCreate, options }: { canCreate: boolean; options: EncounterCreationOptions }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState(options.patients[0]?.id ?? "");
  const [providerId, setProviderId] = useState(options.providers[0]?.id ?? "");
  const [locationId, setLocationId] = useState(options.locations[0]?.id ?? "");
  const [type, setType] = useState("Established patient follow-up");
  const [serviceDate, setServiceDate] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const response = await fetch("/api/encounters", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ patientId, providerId: providerId || undefined, locationId: locationId || undefined, type, serviceDate: new Date(serviceDate).toISOString(), chiefComplaint }) });
      const payload = await response.json() as { error?: string; encounter?: { id: string } };
      if (!response.ok || !payload.encounter) throw new Error(payload.error ?? "The encounter could not be created.");
      router.push(`/encounters/${payload.encounter.id}`); router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The encounter could not be created.");
    } finally { setSubmitting(false); }
  }

  if (!canCreate) return null;
  if (!open) return <Button disabled={options.patients.length === 0} onClick={() => setOpen(true)} title={options.patients.length === 0 ? "Add a patient before creating an encounter" : undefined} variant="primary"><Plus className="size-4" /> New encounter</Button>;

  return <form className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5" onSubmit={submit}>
    <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-cyan-700 text-white"><CalendarPlus className="size-5" /></span><div><h3 className="text-sm font-extrabold text-slate-950">Create encounter</h3><p className="mt-1 text-[10px] text-slate-500">The note starts as an organization-scoped draft.</p></div><Button aria-label="Close encounter form" className="ml-auto" onClick={() => setOpen(false)} size="icon" type="button" variant="ghost"><X className="size-4" /></Button></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="text-xs font-bold text-slate-700">Patient<select className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs" onChange={(event) => setPatientId(event.target.value)} required value={patientId}>{options.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-700">Provider<select className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs" onChange={(event) => setProviderId(event.target.value)} value={providerId}><option value="">Unassigned</option>{options.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-700">Visit type<Input className="mt-2" onChange={(event) => setType(event.target.value)} required value={type} /></label>
      <label className="text-xs font-bold text-slate-700">Service date and time<Input className="mt-2" onChange={(event) => setServiceDate(event.target.value)} required type="datetime-local" value={serviceDate} /></label>
      <label className="text-xs font-bold text-slate-700">Location<select className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs" onChange={(event) => setLocationId(event.target.value)} value={locationId}><option value="">No location</option>{options.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-700">Chief complaint<Input className="mt-2" onChange={(event) => setChiefComplaint(event.target.value)} placeholder="Reason for visit" value={chiefComplaint} /></label>
    </div>
    {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}
    <div className="mt-5 flex justify-end"><Button disabled={submitting || !serviceDate || !patientId} type="submit">{submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Create draft</Button></div>
  </form>;
}
