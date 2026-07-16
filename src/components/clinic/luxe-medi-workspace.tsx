"use client";

import { useState } from "react";
import { BadgeCheck, CalendarClock, ChevronRight, FileCheck2, FlaskConical, Gift, Images, LoaderCircle, Package, PencilLine, Plus, Sparkles, Stethoscope, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LuxeMediWorkspace as LuxeMediWorkspaceData } from "@/lib/repositories/luxe-medi-repository";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";

const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50";
const areaClass = "min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50";

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Luxe Medi action failed.");
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function ActionButton({ label, variant = "secondary", disabled, onClick }: { label: string; variant?: "secondary" | "primary" | "ghost" | "danger"; disabled?: boolean; onClick: () => void }) {
  return <Button disabled={disabled} onClick={onClick} size="sm" variant={variant}>{label}</Button>;
}

function ConsultationForm({ workspace, enabled }: { workspace: LuxeMediWorkspaceData; enabled: boolean }) {
  const [name, setName] = useState("New consultation request");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(workspace.services[0]?.id ?? "");
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("Captured from the Luxe Medi service catalog. Staff review is required before booking.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post("/api/luxe-medi", { kind: "consultation", name, email: email || undefined, phone: phone || undefined, serviceId, patientId: patientId || undefined, notes }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Consultation request failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Your role can review the service catalog but cannot create consultation requests.</p>;
  return <div className="space-y-3 p-5"><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Consultation name" onChange={(event) => setName(event.target.value)} placeholder="Client name" value={name} /><Input aria-label="Consultation phone" onChange={(event) => setPhone(event.target.value)} placeholder="Phone" value={phone} /></div><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Consultation email" onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" value={email} /><select aria-label="Consultation service" className={selectClass} onChange={(event) => setServiceId(event.target.value)} value={serviceId}>{workspace.services.map((service) => <option key={service.id} value={service.id}>{service.name} · {money(service.price)}</option>)}</select></div><select aria-label="Link existing client" className={selectClass} onChange={(event) => setPatientId(event.target.value)} value={patientId}><option value="">New client or unlinked request</option>{workspace.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.mrn}</option>)}</select><textarea aria-label="Consultation notes" className={areaClass} onChange={(event) => setNotes(event.target.value)} value={notes} /><Button disabled={busy || name.trim().length < 2 || !serviceId} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Create request</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

function TreatmentPlanForm({ workspace, enabled }: { workspace: LuxeMediWorkspaceData; enabled: boolean }) {
  const [patientId, setPatientId] = useState(workspace.patients[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(workspace.services[0]?.id ?? "");
  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("Provider-reviewed treatment plan");
  const [goals, setGoals] = useState("Document the client goal and the provider-reviewed next step.");
  const [sessions, setSessions] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post("/api/luxe-medi", { kind: "treatment_plan", patientId, serviceId, providerId: providerId || undefined, name, goals: goals.split("\n").map((goal) => goal.trim()).filter(Boolean), recommendedSessions: Number(sessions) || 1 }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Treatment plan creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Your role can review treatment plans but cannot create them.</p>;
  return <div className="space-y-3 p-5"><div className="grid gap-3 sm:grid-cols-2"><select aria-label="Treatment plan client" className={selectClass} onChange={(event) => setPatientId(event.target.value)} value={patientId}>{workspace.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>)}</select><select aria-label="Treatment plan service" className={selectClass} onChange={(event) => setServiceId(event.target.value)} value={serviceId}>{workspace.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div><div className="grid gap-3 sm:grid-cols-[1fr_160px]"><Input aria-label="Treatment plan name" onChange={(event) => setName(event.target.value)} value={name} /><Input aria-label="Recommended sessions" min="1" onChange={(event) => setSessions(event.target.value)} type="number" value={sessions} /></div><select aria-label="Treatment plan provider" className={selectClass} onChange={(event) => setProviderId(event.target.value)} value={providerId}><option value="">Assign provider later</option>{workspace.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} · {provider.credential}</option>)}</select><textarea aria-label="Treatment plan goals" className={areaClass} onChange={(event) => setGoals(event.target.value)} value={goals} /><Button disabled={busy || !patientId || !serviceId || name.trim().length < 3} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <PencilLine className="size-3.5" />} Queue provider review</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

function SessionForm({ workspace, enabled }: { workspace: LuxeMediWorkspaceData; enabled: boolean }) {
  const [patientId, setPatientId] = useState(workspace.patients[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(workspace.services[0]?.id ?? "");
  const [treatmentPlanId, setTreatmentPlanId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sessionNumber, setSessionNumber] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post("/api/luxe-medi", { kind: "treatment_session", patientId, serviceId, treatmentPlanId: treatmentPlanId || undefined, providerId: providerId || undefined, sessionNumber: Number(sessionNumber) || 1, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Treatment session creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Your role can review treatment sessions but cannot schedule them.</p>;
  return <div className="space-y-3 p-5"><div className="grid gap-3 sm:grid-cols-2"><select aria-label="Session client" className={selectClass} onChange={(event) => setPatientId(event.target.value)} value={patientId}>{workspace.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>)}</select><select aria-label="Session service" className={selectClass} onChange={(event) => setServiceId(event.target.value)} value={serviceId}>{workspace.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div><div className="grid gap-3 sm:grid-cols-2"><select aria-label="Session treatment plan" className={selectClass} onChange={(event) => setTreatmentPlanId(event.target.value)} value={treatmentPlanId}><option value="">No linked treatment plan</option>{workspace.treatmentPlans.filter((plan) => plan.patientId === patientId && plan.serviceId === serviceId).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {plan.reviewStatus}</option>)}</select><select aria-label="Session provider" className={selectClass} onChange={(event) => setProviderId(event.target.value)} value={providerId}><option value="">Assign provider later</option>{workspace.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></div><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Session date and time" onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" value={scheduledAt} /><Input aria-label="Session number" min="1" onChange={(event) => setSessionNumber(event.target.value)} type="number" value={sessionNumber} /></div><Button disabled={busy || !patientId || !serviceId} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <CalendarClock className="size-3.5" />} Save manual booking</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

function PlanActions({ plan, enabled }: { plan: LuxeMediWorkspaceData["treatmentPlans"][number]; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function transition(action: "approve_review" | "reject_review" | "activate" | "complete" | "cancel") {
    setBusy(true); setError(null);
    try { await post(`/api/luxe-medi/treatment-plans/${plan.id}/transition`, { action, note: action === "approve_review" ? "Provider reviewed eligibility, consent, goals, and source documentation." : `Human Luxe Medi workflow recorded: ${action}.` }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Treatment plan transition failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="mt-4 flex flex-wrap gap-2">{plan.reviewStatus !== "approved" && <ActionButton disabled={busy} label="Approve review" onClick={() => transition("approve_review")} variant="primary" />}{plan.reviewStatus !== "approved" && <ActionButton disabled={busy} label="Reject" onClick={() => transition("reject_review")} variant="ghost" />}{plan.reviewStatus === "approved" && plan.status === "draft" && <ActionButton disabled={busy} label="Activate" onClick={() => transition("activate")} variant="secondary" />}{plan.status === "active" && <ActionButton disabled={busy} label="Complete" onClick={() => transition("complete")} variant="secondary" />}{["draft", "active"].includes(plan.status) && <ActionButton disabled={busy} label="Cancel" onClick={() => transition("cancel")} variant="danger" />}{error && <p className="basis-full text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

function SessionActions({ item, enabled }: { item: LuxeMediWorkspaceData["sessions"][number]; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function transition(action: "complete" | "cancel") {
    setBusy(true); setError(null);
    try { await post(`/api/luxe-medi/sessions/${item.id}/transition`, { action, note: action === "complete" ? "Completed after provider review and signed source documentation." : "Human scheduling workflow cancelled this session." }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Treatment session transition failed."); }
    finally { setBusy(false); }
  }
  if (!enabled || !["scheduled", "rescheduled"].includes(item.status)) return null;
  return <div className="mt-3 flex flex-wrap gap-2"><ActionButton disabled={busy} label="Complete with review" onClick={() => transition("complete")} variant="secondary" /><ActionButton disabled={busy} label="Cancel" onClick={() => transition("cancel")} variant="ghost" />{error && <p className="basis-full text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

function PromotionForm({ workspace, enabled }: { workspace: LuxeMediWorkspaceData; enabled: boolean }) {
  const [name, setName] = useState("New client offer");
  const [serviceId, setServiceId] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post("/api/luxe-medi", { kind: "promotion", name, serviceId: serviceId || undefined, discountPercent: Number(discountPercent) || 0 }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Promotion creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="space-y-3 border-t border-slate-100 p-5"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]"><Input aria-label="Promotion name" onChange={(event) => setName(event.target.value)} value={name} /><select aria-label="Promotion service" className={selectClass} onChange={(event) => setServiceId(event.target.value)} value={serviceId}><option value="">All services</option>{workspace.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select><Input aria-label="Promotion discount percent" min="0" max="100" onChange={(event) => setDiscountPercent(event.target.value)} type="number" value={discountPercent} /></div><Button disabled={busy || name.trim().length < 3} onClick={submit} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Gift className="size-3.5" />} Save draft promotion</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function LuxeMediWorkspace({ workspace, canCreate, canManage, canUpdate }: { workspace: LuxeMediWorkspaceData; canCreate: boolean; canManage: boolean; canUpdate: boolean }) {
  const reviewCount = workspace.treatmentPlans.filter((plan) => plan.reviewStatus === "needs_provider_review").length;
  const activeSessions = workspace.sessions.filter((item) => ["scheduled", "rescheduled"].includes(item.status)).length;
  return <div className="space-y-6"><PageIntro title="Luxe Medi, fully operational from consultation to follow-up." description="A dedicated med-spa workspace for services, requests, provider-reviewed treatment plans, sessions, packages, memberships, consent forms, before-and-after records, and inventory context. External delivery stays manual until an approved adapter is connected." aside={<><Badge tone="violet">Med-spa studio</Badge><Badge tone="amber">Provider review required</Badge><Badge tone="teal">Manual fallbacks visible</Badge></>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard accent="violet" detail="Configured services" icon={<Sparkles className="size-4" />} label="Service catalog" value={String(workspace.services.length)} /><StatCard accent="sky" detail="Website, social, phone, referral" icon={<UserRound className="size-4" />} label="Consultations" value={String(workspace.consultations.length)} /><StatCard accent="amber" detail="Must be reviewed by provider" icon={<Stethoscope className="size-4" />} label="Plans to review" value={String(reviewCount)} /><StatCard accent="teal" detail="Manual schedule and follow-up" icon={<CalendarClock className="size-4" />} label="Active sessions" value={String(activeSessions)} /><StatCard accent="rose" detail="Tracked in internal inventory" icon={<Package className="size-4" />} label="Inventory items" value={String(workspace.inventory.length)} /></div><div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><SectionCard title="Public service catalog" description="Pricing and availability are informational. Consultation and provider review remain separate workflow gates."><div className="grid gap-3 p-4 sm:grid-cols-2">{workspace.services.map((service) => <article className="rounded-2xl border border-slate-200 bg-white p-4" key={service.id}><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><Sparkles className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-extrabold text-slate-900">{service.name}</h4><span className="text-sm font-extrabold text-violet-700">{money(service.price)}</span></div><p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">{service.category} · {service.durationMinutes} min</p>{service.description && <p className="mt-2 text-xs leading-5 text-slate-600">{service.description}</p>}<div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={service.status} />{service.mobileAvailable && <Badge tone="sky">Mobile</Badge>}{service.requiresConsultation && <Badge tone="amber">Consult first</Badge>}</div></div></div></article>)}</div></SectionCard><Card className="overflow-hidden"><div className="border-b border-slate-100 bg-slate-950 p-5 text-white"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-violet-300">Front desk intake</p><h3 className="mt-3 text-xl font-extrabold tracking-[-.04em]">Turn interest into a reviewable request.</h3><p className="mt-2 text-xs leading-5 text-slate-400">This creates an audited lead and staff task. It never confirms an appointment, diagnosis, eligibility, or treatment outcome.</p></div><ConsultationForm enabled={canCreate} workspace={workspace} /></Card></div><div className="grid gap-6 xl:grid-cols-2"><SectionCard title="Provider-reviewed treatment plans" description="Plans are drafts until an authorized provider reviews the goals, consent context, and source documentation."><div className="border-b border-slate-100 bg-slate-50/70"><TreatmentPlanForm enabled={canCreate} workspace={workspace} /></div><div className="divide-y divide-slate-100">{workspace.treatmentPlans.map((plan) => <article className="p-5" key={plan.id}><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><Stethoscope className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-xs font-extrabold text-slate-900">{plan.name}</h4><StatusBadge status={plan.status} /><StatusBadge status={plan.reviewStatus} /></div><p className="mt-1 text-[10px] text-slate-500">{plan.patientName} · {plan.serviceName} · {plan.providerName} · {plan.recommendedSessions} session{plan.recommendedSessions === 1 ? "" : "s"}</p>{Array.isArray(plan.goals) && plan.goals.length > 0 && <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-600">{plan.goals.slice(0, 4).map((goal, index) => <li key={`${plan.id}-${index}`}>• {String(goal)}</li>)}</ul>}<PlanActions enabled={canUpdate} plan={plan} /></div></div></article>)}{!workspace.treatmentPlans.length && <p className="p-5 text-xs text-slate-500">No treatment plans have been queued.</p>}</div></SectionCard><SectionCard title="Treatment sessions" description="Scheduling remains a manual fallback until an approved calendar or mobile-care adapter is connected."><div className="border-b border-slate-100 bg-slate-50/70"><SessionForm enabled={canCreate} workspace={workspace} /></div><div className="divide-y divide-slate-100">{workspace.sessions.map((item) => <article className="p-5" key={item.id}><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700"><CalendarClock className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-xs font-extrabold text-slate-900">Session {item.sessionNumber} · {item.patientName}</h4><StatusBadge status={item.status} /></div><p className="mt-1 text-[10px] text-slate-500">{item.serviceName} · {item.providerName}{item.scheduledAt ? ` · ${new Date(item.scheduledAt).toLocaleString()}` : " · time not assigned"}</p><SessionActions enabled={canUpdate} item={item} /></div></div></article>)}{!workspace.sessions.length && <p className="p-5 text-xs text-slate-500">No treatment sessions have been scheduled.</p>}</div></SectionCard></div><div className="grid gap-6 lg:grid-cols-3"><SectionCard title="Packages and memberships" description="Existing payment objects remain the source of truth for balances, package sessions, and recurring plans."><div className="space-y-3 p-5">{workspace.membershipPlans.map((plan) => <div className="flex items-center gap-3" key={plan.id}><BadgeCheck className="size-4 text-teal-600" /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{plan.name}</p><p className="text-[10px] text-slate-500">{money(plan.price)} · {plan.includedSessions} sessions</p></div><StatusBadge status={plan.status} /></div>)}{workspace.packagePlans.map((plan) => <div className="flex items-center gap-3" key={plan.id}><Package className="size-4 text-violet-600" /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{plan.name}</p><p className="text-[10px] text-slate-500">{money(plan.price)} · {plan.includedSessions} sessions</p></div><StatusBadge status={plan.status} /></div>)}{!workspace.membershipPlans.length && !workspace.packagePlans.length && <p className="text-xs text-slate-500">No packages or memberships configured.</p>}</div></SectionCard><SectionCard title="Forms and before/after custody" description="Consent templates and media are linked to the existing governed forms and document lifecycle."><div className="space-y-3 p-5">{workspace.forms.map((form) => <div className="flex items-center gap-3" key={form.id}><FileCheck2 className="size-4 text-teal-600" /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{form.name}</p><p className="text-[10px] text-slate-500">{form.templateKey} · {form.requiresProviderSignature ? "Provider signature" : "Staff workflow"}</p></div><StatusBadge status={form.status} /></div>)}<div className="border-t border-slate-100 pt-3"><div className="flex items-center gap-3"><Images className="size-4 text-pink-600" /><p className="text-xs font-extrabold text-slate-900">{workspace.media.length} governed media record{workspace.media.length === 1 ? "" : "s"}</p></div>{workspace.media.slice(0, 3).map((item) => <p className="mt-2 text-[10px] text-slate-500" key={item.id}>{item.patientName} · {item.name} · {item.reviewStatus}</p>)}</div></div></SectionCard><SectionCard title="Promotions and inventory context" description="Promotions remain drafts until an administrator activates them; inventory is operational context, not automated treatment guidance."><div className="space-y-3 p-5">{workspace.promotions.map((promotion) => <div className="flex items-center gap-3" key={promotion.id}><Gift className="size-4 text-amber-600" /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{promotion.name}</p><p className="text-[10px] text-slate-500">{promotion.serviceName} · {promotion.discountPercent ? `${promotion.discountPercent}% off` : promotion.discountCents ? money(promotion.discountCents / 100) : "No discount set"}</p></div><StatusBadge status={promotion.status} /></div>)}{!workspace.promotions.length && <p className="text-xs text-slate-500">No promotions are tracked.</p>}{workspace.inventory.slice(0, 5).map((item) => <div className="flex items-center gap-3" key={item.id}><FlaskConical className="size-4 text-sky-600" /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{item.name}</p><p className="text-[10px] text-slate-500">{item.quantityOnHand} on hand · reorder at {item.reorderPoint ?? "not set"}</p></div><StatusBadge status={item.status} /></div>)}{canManage && <PromotionForm enabled={canManage} workspace={workspace} />}</div></SectionCard></div><SectionCard title="Consultation queue" description="Leads are linked to the existing CRM pipeline and can be completed there without duplicating contacts."><div className="divide-y divide-slate-100">{workspace.consultations.slice(0, 12).map((lead) => <div className="flex flex-wrap items-center gap-3 p-4" key={lead.id}><span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700">{initials(lead.name)}</span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{lead.name}</p><p className="mt-1 text-[10px] text-slate-500">{lead.serviceInterest ?? "Interest pending"} · {lead.patientName ?? "Unlinked"} · {money(lead.estimatedValue)}</p></div><StatusBadge status={lead.status} />{lead.followUpDueAt && <span className="text-[10px] text-slate-400">Due {new Date(lead.followUpDueAt).toLocaleDateString()}</span>}<ChevronRight className="size-4 text-slate-300" /></div>)}{!workspace.consultations.length && <p className="p-5 text-xs text-slate-500">No consultation requests are waiting.</p>}</div></SectionCard></div>;
}
