"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCheck, Download, Eye, FileArchive, FileLock2, FileUp, LoaderCircle, Printer, RefreshCw, ShieldCheck, UploadCloud, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DocumentWorkspaceData } from "@/lib/types";

const fieldClass = "mt-1 h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

async function parseResponse<T>(response: Response) {
  const body = await response.json() as { error?: string; data?: T };
  if (!response.ok) throw new Error(body.error ?? "The document request could not be completed.");
  return body.data as T;
}

function Feedback({ error, message }: { error: string; message: string }) {
  return <>{message && <p className="text-[12px] font-bold text-emerald-700" role="status">{message}</p>}{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</>;
}

export function UploadDocumentControl({ workspace, disabled = false }: { workspace: DocumentWorkspaceData; disabled?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [patientId, setPatientId] = useState(workspace.patients[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(workspace.categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [sourceType, setSourceType] = useState("upload");
  const [linkType, setLinkType] = useState("none");
  const [linkId, setLinkId] = useState("");
  const [requestPatientRelease, setRequestPatientRelease] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const encounterOptions = workspace.encounters.filter((item) => item.patientId === patientId);
  const referralOptions = workspace.referrals.filter((item) => item.patientId === patientId);
  const caseOptions = workspace.cases.filter((item) => item.patientId === patientId);

  function selectFile(nextFile: File | null) {
    setFile(nextFile);
    if (nextFile && !name) setName(nextFile.name.replace(/\.[^.]+$/, ""));
  }

  async function upload() {
    if (!file) return;
    setPending(true); setError(""); setMessage("");
    const form = new FormData();
    form.set("file", file); form.set("name", name); form.set("patientId", patientId); form.set("categoryId", categoryId);
    form.set("description", description); form.set("tags", tags); form.set("sourceType", sourceType);
    form.set("requestPatientRelease", String(requestPatientRelease)); form.set("expiresAt", expiresAt);
    if (linkType === "encounter") form.set("encounterId", linkId);
    if (linkType === "referral") form.set("referralId", linkId);
    if (linkType === "nofault" || linkType === "workers_comp") { form.set("caseType", linkType); form.set("caseId", linkId); }
    try {
      await parseResponse(await fetch("/api/documents", { method: "POST", body: form }));
      setMessage("Encrypted document received, categorized, and placed into its governed review lane.");
      setFile(null); setName(""); setDescription(""); setTags(""); setLinkType("none"); setLinkId("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Document upload failed."); }
    finally { setPending(false); }
  }

  const linkedOptions = linkType === "encounter" ? encounterOptions.map((item) => ({ id: item.id, label: `${item.type} · ${new Date(item.serviceDate).toLocaleDateString()}` })) : linkType === "referral" ? referralOptions.map((item) => ({ id: item.id, label: `${item.specialty} · ${item.destination ?? "Open destination"}` })) : (linkType === "nofault" || linkType === "workers_comp") ? caseOptions.filter((item) => item.caseType === linkType).map((item) => ({ id: item.id, label: `${item.claimNumber} · ${item.caseType.replace("_", " ")}` })) : [];
  const unavailable = disabled || pending || !file || !name.trim() || !categoryId || !patientId || (linkType !== "none" && !linkId);

  return <div className="space-y-4 p-5">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Patient<select className={fieldClass} onChange={(event) => { setPatientId(event.target.value); setLinkType("none"); setLinkId(""); }} value={patientId}>{workspace.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Category<select className={fieldClass} onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>{workspace.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Capture pathway<select className={fieldClass} onChange={(event) => setSourceType(event.target.value)} value={sourceType}>{["upload", "camera", "scan", "import", "generated"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Source file<input accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" capture={sourceType === "camera" ? "environment" : undefined} className={`${fieldClass} py-2`} onChange={(event) => selectFile(event.target.files?.[0] ?? null)} ref={inputRef} type="file" /></label>
      <label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Document name<Input className="mt-1" onChange={(event) => setName(event.target.value)} value={name} /></label>
      <label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Link to<select className={fieldClass} onChange={(event) => { setLinkType(event.target.value); setLinkId(""); }} value={linkType}><option value="none">Patient chart only</option><option value="encounter">Encounter</option><option value="referral">Referral</option><option value="nofault">No-fault case</option><option value="workers_comp">Workers comp case</option></select></label>
      <label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Linked record<select className={fieldClass} disabled={linkType === "none"} onChange={(event) => setLinkId(event.target.value)} value={linkId}><option value="">{linkType === "none" ? "No secondary link" : "Select a matching record"}</option>{linkedOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Expiration date<Input className="mt-1" onChange={(event) => setExpiresAt(event.target.value)} type="date" value={expiresAt} /></label>
    </div>
    <div className="grid gap-3 md:grid-cols-2"><label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Description<textarea className={`${fieldClass} min-h-20 py-3`} onChange={(event) => setDescription(event.target.value)} value={description} /></label><label className="text-[11px] font-black uppercase tracking-[.13em] text-stone-500">Tags, comma separated<textarea className={`${fieldClass} min-h-20 py-3`} onChange={(event) => setTags(event.target.value)} value={tags} /></label></div>
    <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-950"><input checked={requestPatientRelease} onChange={(event) => setRequestPatientRelease(event.target.checked)} type="checkbox" /> Request portal release after review</label><Button disabled={unavailable} onClick={upload} variant="primary">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} Encrypt and receive</Button><p className="text-[11px] text-stone-400">PDF, JPG, PNG, WEBP, or TXT · 10 MB max · never public by default</p></div>
    <Feedback error={error} message={message} />
  </div>;
}

type TransitionAction = "approve_review" | "reject_review" | "approve_release" | "revoke_release" | "lock" | "archive" | "restore";
const labels: Record<TransitionAction, string> = { approve_review: "Approve review", reject_review: "Reject review", approve_release: "Approve portal", revoke_release: "Revoke portal", lock: "Lock record", archive: "Archive", restore: "Restore" };

export function DocumentTransitionControl({ document, canSign, canUpdate }: { document: DocumentWorkspaceData["documents"][number]; canSign: boolean; canUpdate: boolean }) {
  const router = useRouter();
  const activeActions: TransitionAction[] = [];
  if (document.reviewStatus === "needs_review" && canSign) activeActions.push("approve_review", "reject_review");
  if (!document.patientVisible && document.patientId && ["approved", "not_required"].includes(document.reviewStatus) && canSign) activeActions.push("approve_release");
  if (document.patientVisible && canSign) activeActions.push("revoke_release");
  if (!document.lockedAt) activeActions.push("lock");
  activeActions.push("archive");
  const actions: TransitionAction[] = document.status === "archived" ? ["restore"] : document.status === "active" ? activeActions : [];
  const [action, setAction] = useState<TransitionAction | "">(actions[0] ?? "");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!actions.length || !canUpdate) return null;
  const selected = actions.includes(action as TransitionAction) ? action as TransitionAction : actions[0];
  const needsNote = ["approve_review", "reject_review", "revoke_release", "archive"].includes(selected);
  async function transition() {
    setPending(true); setError("");
    try { await parseResponse(await fetch(`/api/documents/${document.id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: selected, note: note || undefined }) })); router.refresh(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Document update failed."); }
    finally { setPending(false); }
  }
  const Icon = selected === "approve_release" ? ShieldCheck : selected === "reject_review" || selected === "revoke_release" ? XCircle : selected === "archive" ? Archive : selected === "restore" ? RefreshCw : selected === "lock" ? FileLock2 : CheckCheck;
  return <div className="mt-3 space-y-2 border-t border-stone-200 pt-3"><div className="grid gap-2 lg:grid-cols-[.8fr_1.2fr_auto]"><select className={fieldClass.replace("mt-1 ", "")} onChange={(event) => setAction(event.target.value as TransitionAction)} value={selected}>{actions.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select><Input onChange={(event) => setNote(event.target.value)} placeholder={needsNote ? "Required human decision note" : "Optional custody note"} value={note} /><Button disabled={pending || (needsNote && note.trim().length < 8)} onClick={transition} size="sm" variant={selected === "reject_review" || selected === "archive" ? "danger" : "secondary"}>{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />}{labels[selected]}</Button></div>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function DocumentContentActions({ document, canDownload, canPrint }: { document: DocumentWorkspaceData["documents"][number]; canDownload: boolean; canPrint: boolean }) {
  if (!document.hasStoredContent) return <span className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-500">External source fallback</span>;
  return <div className="flex gap-1"><Button aria-label={`Preview ${document.name}`} onClick={() => window.open(`/api/documents/${document.id}/content?intent=preview`, "_blank", "noopener,noreferrer")} size="icon" variant="ghost"><Eye className="size-4" /></Button>{canPrint && <Button aria-label={`Print ${document.name}`} onClick={() => window.open(`/api/documents/${document.id}/content?intent=print`, "_blank", "noopener,noreferrer")} size="icon" variant="ghost"><Printer className="size-4" /></Button>}{canDownload && <Button aria-label={`Download ${document.name}`} onClick={() => window.open(`/api/documents/${document.id}/content?intent=download`, "_blank", "noopener,noreferrer")} size="icon" variant="ghost"><Download className="size-4" /></Button>}</div>;
}

export function CreateDocumentVersionControl({ document, disabled = false }: { document: DocumentWorkspaceData["documents"][number]; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState(document.name);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (document.status === "superseded") return null;
  async function replace() {
    if (!file) return;
    setPending(true); setError("");
    const form = new FormData(); form.set("file", file); form.set("name", name); form.set("reason", reason); form.set("sourceType", "upload");
    try { await parseResponse(await fetch(`/api/documents/${document.id}/versions`, { method: "POST", body: form })); router.refresh(); setOpen(false); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Replacement version failed."); }
    finally { setPending(false); }
  }
  return <div className="mt-2"><Button onClick={() => setOpen(!open)} size="sm" variant="ghost"><FileUp className="size-3.5" /> New version</Button>{open && <div className="mt-2 grid gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:grid-cols-2"><Input onChange={(event) => setName(event.target.value)} value={name} /><input accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" className={fieldClass.replace("mt-1 ", "py-2 ")} onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" /><Input className="sm:col-span-2" onChange={(event) => setReason(event.target.value)} placeholder="Required replacement reason" value={reason} /><Button className="sm:col-span-2" disabled={disabled || pending || !file || reason.trim().length < 12} onClick={replace} size="sm" variant="secondary">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Preserve old and create v{document.version + 1}</Button>{error && <p className="text-[12px] font-bold text-rose-600 sm:col-span-2" role="alert">{error}</p>}</div>}</div>;
}

export function DocumentPacketExportControl({ selectedIds, disabled = false }: { selectedIds: string[]; disabled?: boolean }) {
  const [purpose, setPurpose] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function exportPacket() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/documents/packet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentIds: selectedIds, purpose }) });
      if (!response.ok) { const body = await response.json() as { error?: string }; throw new Error(body.error ?? "Packet export failed."); }
      const url = URL.createObjectURL(await response.blob()); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `ClinicOS-document-packet-${new Date().toISOString().slice(0, 10)}.zip`; anchor.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Packet export failed."); }
    finally { setPending(false); }
  }
  return <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-amber-300 text-stone-950"><FileArchive className="size-4" /></span><div><p className="text-xs font-black">Secure packet export</p><p className="mt-1 text-[12px] text-stone-400">{selectedIds.length} selected · checksums verified · manifest included</p></div></div><Input className="mt-3 border-stone-700 bg-stone-800 text-white" onChange={(event) => setPurpose(event.target.value)} placeholder="Required purpose of export" value={purpose} /><Button className="mt-3 w-full" disabled={disabled || pending || !selectedIds.length || purpose.trim().length < 8} onClick={exportPacket} size="sm" variant="primary">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Export encrypted-source ZIP</Button>{error && <p className="mt-2 text-[12px] font-bold text-rose-300" role="alert">{error}</p>}</div>;
}
