"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Send, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function parseResponse<T>(response: Response) {
  const body = await response.json() as { error?: string; data?: T };
  if (!response.ok) throw new Error(body.error ?? "The request could not be completed.");
  return body.data as T;
}

const fieldClass = "mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

export function CreateReferralControl({
  patients,
  destinations,
  facilities,
  disabled = false,
}: {
  patients: { id: string; name: string; mrn: string }[];
  destinations: { id: string; name: string; clinicType: string }[];
  facilities: { id: string; organizationId: string; name: string; specialty: string | null }[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState("connected_network");
  const [destinationOrganizationId, setDestinationOrganizationId] = useState(destinations[0]?.id ?? "");
  const [destinationFacilityId, setDestinationFacilityId] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [specialty, setSpecialty] = useState("Cardiology");
  const [reason, setReason] = useState("");
  const [clinicalQuestion, setClinicalQuestion] = useState("");
  const [priority, setPriority] = useState("routine");
  const [authorizationStatus, setAuthorizationStatus] = useState("not_required");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const connected = deliveryMethod === "connected_network";
  const availableFacilities = facilities.filter((facility) => facility.organizationId === destinationOrganizationId);

  async function create() {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await parseResponse(await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          specialty,
          destinationOrganizationId: connected ? destinationOrganizationId : undefined,
          destinationFacilityId: connected && destinationFacilityId ? destinationFacilityId : undefined,
          destinationName: connected ? undefined : destinationName,
          reason,
          clinicalQuestion,
          priority,
          authorizationStatus,
          deliveryMethod,
          followUpInDays: priority === "routine" ? 7 : 2,
        }),
      }));
      setReason("");
      setClinicalQuestion("");
      setMessage("Referral draft created with an ordered clinical record and audit receipt.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Referral creation failed.");
    } finally {
      setPending(false);
    }
  }

  const unavailable = disabled || pending || !patientId || !specialty.trim() || reason.trim().length < 8 || clinicalQuestion.trim().length < 8 || (connected ? !destinationOrganizationId : destinationName.trim().length < 2);

  return <div className="space-y-4 p-5">
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-[12px] font-bold text-slate-600">Patient
        <select className={fieldClass} onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select>
      </label>
      <label className="text-[12px] font-bold text-slate-600">Delivery pathway
        <select className={fieldClass} onChange={(event) => setDeliveryMethod(event.target.value)} value={deliveryMethod}>
          <option value="connected_network">ClinicOS connected network</option><option value="fax">Fax fallback</option><option value="direct_secure_message">Direct secure-message fallback</option><option value="manual">Manual packet delivery</option>
        </select>
      </label>
      {connected ? <>
        <label className="text-[12px] font-bold text-slate-600">Connected clinic
          <select className={fieldClass} onChange={(event) => { setDestinationOrganizationId(event.target.value); setDestinationFacilityId(""); }} value={destinationOrganizationId}>{destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.name} · {destination.clinicType}</option>)}</select>
        </label>
        <label className="text-[12px] font-bold text-slate-600">Verified facility
          <select className={fieldClass} onChange={(event) => setDestinationFacilityId(event.target.value)} value={destinationFacilityId}><option value="">Organization default</option>{availableFacilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}{facility.specialty ? ` · ${facility.specialty}` : ""}</option>)}</select>
        </label>
      </> : <label className="text-[12px] font-bold text-slate-600 md:col-span-2">External destination
        <Input className="mt-1" onChange={(event) => setDestinationName(event.target.value)} placeholder="Specialist or facility name" value={destinationName} />
      </label>}
      <label className="text-[12px] font-bold text-slate-600">Specialty
        <Input className="mt-1" onChange={(event) => setSpecialty(event.target.value)} value={specialty} />
      </label>
      <label className="text-[12px] font-bold text-slate-600">Priority
        <select className={fieldClass} onChange={(event) => setPriority(event.target.value)} value={priority}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option></select>
      </label>
      <label className="text-[12px] font-bold text-slate-600">Authorization
        <select className={fieldClass} onChange={(event) => setAuthorizationStatus(event.target.value)} value={authorizationStatus}><option value="not_required">Not required</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="denied">Denied</option></select>
      </label>
    </div>
    <label className="block text-[12px] font-bold text-slate-600">Reason for referral
      <textarea className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-800 outline-none focus:border-sky-400" onChange={(event) => setReason(event.target.value)} placeholder="Clinical reason and relevant context" value={reason} />
    </label>
    <label className="block text-[12px] font-bold text-slate-600">Clinical question
      <textarea className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-800 outline-none focus:border-sky-400" onChange={(event) => setClinicalQuestion(event.target.value)} placeholder="What should the receiving specialist evaluate?" value={clinicalQuestion} />
    </label>
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled={unavailable} onClick={create} size="sm" variant="primary">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Create referral order</Button>
      <p className="text-[11px] leading-5 text-slate-400">Connected delivery requires an active relationship, sharing agreement, and patient consent for demographics and referrals.</p>
    </div>
    {message && <p className="text-[12px] font-bold text-teal-700" role="status">{message}</p>}
    {error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}

type ReferralAction = "mark_ready" | "send" | "queue_manual_delivery" | "confirm_manual_delivery" | "acknowledge" | "accept" | "decline" | "schedule" | "complete" | "consultation_received" | "record_patient_outreach" | "close" | "fail_delivery" | "retry_delivery";

const labels: Record<ReferralAction, string> = {
  mark_ready: "Mark ready", send: "Send securely", queue_manual_delivery: "Queue manual delivery", confirm_manual_delivery: "Confirm delivery", acknowledge: "Acknowledge", accept: "Accept", decline: "Decline", schedule: "Schedule", complete: "Mark completed", consultation_received: "Return consultation", record_patient_outreach: "Record patient outreach", close: "Close loop", fail_delivery: "Record failure", retry_delivery: "Retry delivery",
};

function availableActions(referral: { status: string; deliveryStatus: string; destinationType: string; direction: string; patientOutreachStatus: string }): ReferralAction[] {
  if (referral.direction === "inbound") {
    if (referral.status === "sent") return ["acknowledge", "decline"];
    if (referral.status === "received") return ["accept", "decline"];
    if (referral.status === "accepted") return ["schedule", "complete"];
    if (referral.status === "scheduled") return ["complete"];
    if (referral.status === "completed") return ["consultation_received"];
    return [];
  }
  if (referral.status === "draft") return ["mark_ready"];
  if (referral.deliveryStatus === "failed") return ["retry_delivery"];
  if (referral.status === "ready_to_send") {
    if (referral.destinationType === "connected") return ["send"];
    if (referral.deliveryStatus === "pending_manual") return ["confirm_manual_delivery", "fail_delivery"];
    return ["queue_manual_delivery"];
  }
  const outreach = referral.patientOutreachStatus === "notified" ? [] : ["record_patient_outreach" as const];
  if (["sent", "received", "accepted", "scheduled", "completed"].includes(referral.status)) return referral.status === "sent" && referral.deliveryStatus === "delivered" ? ["fail_delivery", ...outreach] : outreach;
  if (referral.status === "consultation_received") return ["close", ...outreach];
  return [];
}

export function ReferralTransitionControl({ referral, disabled = false }: { referral: { id: string; status: string; deliveryStatus: string; destinationType: string; direction: string; patientOutreachStatus: string }; disabled?: boolean }) {
  const router = useRouter();
  const actions = availableActions(referral);
  const [action, setAction] = useState<ReferralAction | "">(actions[0] ?? "");
  const [note, setNote] = useState("");
  const [appointmentAt, setAppointmentAt] = useState("");
  const [specialistResponse, setSpecialistResponse] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!actions.length) return null;
  const selectedAction = actions.includes(action as ReferralAction) ? action as ReferralAction : actions[0];
  const requiresNote = selectedAction === "decline" || selectedAction === "confirm_manual_delivery" || selectedAction === "fail_delivery" || selectedAction === "record_patient_outreach";

  async function transition() {
    if (!selectedAction) return;
    setPending(true);
    setError("");
    try {
      await parseResponse(await fetch(`/api/referrals/${referral.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: selectedAction, note: note || undefined, appointmentAt: appointmentAt || undefined, specialistResponse: specialistResponse || undefined }),
      }));
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Referral update failed.");
    } finally {
      setPending(false);
    }
  }

  const unavailable = disabled || pending || !selectedAction || (requiresNote && note.trim().length < 8) || (selectedAction === "schedule" && !appointmentAt) || (selectedAction === "consultation_received" && specialistResponse.trim().length < 12);
  return <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
    <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
      <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none focus:border-sky-400" onChange={(event) => setAction(event.target.value as ReferralAction)} value={selectedAction}>{actions.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
      {selectedAction === "schedule" ? <Input aria-label="Referral appointment date" onChange={(event) => setAppointmentAt(event.target.value)} type="datetime-local" value={appointmentAt} /> : selectedAction === "consultation_received" ? <Input aria-label="Specialist response" onChange={(event) => setSpecialistResponse(event.target.value)} placeholder="Specialist response returned to source clinic" value={specialistResponse} /> : <Input aria-label="Referral action note" onChange={(event) => setNote(event.target.value)} placeholder={requiresNote ? "Required confirmation or reason" : "Optional workflow note"} value={note} />}
      <Button disabled={unavailable} onClick={transition} size="sm" variant={selectedAction === "fail_delivery" || selectedAction === "decline" ? "danger" : "primary"}>{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : selectedAction === "send" ? <Send className="size-3.5" /> : <Workflow className="size-3.5" />}{labels[selectedAction]}</Button>
    </div>
    {error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}
