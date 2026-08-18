"use client";

import { useDeferredValue, useState } from "react";
import { Archive, CheckCircle2, Clock3, FileCheck2, FileLock2, Files, Fingerprint, History, Search, ShieldAlert, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DocumentContentActions, DocumentPacketExportControl, DocumentTransitionControl, CreateDocumentVersionControl, UploadDocumentControl } from "@/components/clinic/document-actions";
import { SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";
import type { DocumentWorkspaceData } from "@/lib/types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Not recorded";
}

function Stat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <Card className="border-stone-200 bg-[#fffdf7] p-4"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-stone-950 text-amber-300">{icon}</span><p className="text-2xl font-black tracking-[-.06em] text-stone-950">{value}</p></div><p className="mt-5 text-[11px] font-black uppercase tracking-[.16em] text-stone-500">{label}</p><p className="mt-1 text-[12px] text-stone-400">{detail}</p></Card>;
}

export function DocumentsWorkspace({ workspace, canCreate, canUpdate, canSign, canManage }: { workspace: DocumentWorkspaceData; canCreate: boolean; canUpdate: boolean; canSign: boolean; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("current");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filtered = workspace.documents.filter((document) => {
    const matchesQuery = !deferredQuery || [document.name, document.patientName, document.patientMrn ?? "", document.categoryName, ...document.tags].some((value) => value.toLowerCase().includes(deferredQuery));
    const matchesCategory = category === "all" || document.categoryId === category;
    const matchesStatus = status === "all"
      ? true
      : status === "current"
        ? document.status !== "superseded"
        : status === "review"
          ? document.reviewStatus === "needs_review"
          : status === "portal"
            ? document.patientVisible
            : status === "archived"
              ? document.status === "archived"
              : true;
    return matchesQuery && matchesCategory && matchesStatus;
  });
  const current = workspace.documents.filter((document) => document.status !== "superseded");
  const reviewCount = current.filter((document) => document.reviewStatus === "needs_review").length;
  const visibleCount = current.filter((document) => document.patientVisible).length;
  const encryptedCount = current.filter((document) => document.hasStoredContent).length;
  const selectedStoredIds = selectedIds.filter((id) => workspace.documents.find((document) => document.id === id)?.hasStoredContent);

  function toggleSelection(documentId: string) {
    setSelectedIds((currentIds) => currentIds.includes(documentId) ? currentIds.filter((id) => id !== documentId) : [...currentIds, documentId]);
  }

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[2rem] bg-stone-950 px-6 py-8 text-white shadow-2xl shadow-stone-300/40 sm:px-8">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(252,211,77,.28),transparent_45%),repeating-linear-gradient(120deg,transparent_0_18px,rgba(255,255,255,.035)_18px_19px)]" />
      <div className="relative grid gap-8 xl:grid-cols-[1fr_.7fr]"><div><div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[.25em] text-amber-300"><FileLock2 className="size-4" /> Document airlock</div><h2 className="mt-5 max-w-2xl text-4xl font-black tracking-[-.065em] sm:text-6xl">Every file enters controlled. Nothing leaves unexplained.</h2><p className="mt-5 max-w-xl text-xs leading-6 text-stone-300">Encrypted intake, chart binding, human review, portal release, version lineage, custody events, and export purpose are one governed lifecycle.</p></div><div className="grid grid-cols-2 gap-3 self-end">{[["10 MB", "encrypted fallback limit"], ["25 MB", "verified packet limit"], ["AES-GCM", "database payload protection"], ["SHA-256", "integrity on every access"]].map(([value, label]) => <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur" key={label}><p className="text-xl font-black text-amber-300">{value}</p><p className="mt-2 text-[11px] uppercase tracking-[.12em] text-stone-400">{label}</p></div>)}</div></div>
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat detail="Current chart and organization records" icon={<Files className="size-4" />} label="Current documents" value={String(current.length)} /><Stat detail="Human classification or content action" icon={<Clock3 className="size-4" />} label="Needs review" value={String(reviewCount)} /><Stat detail="Explicitly approved for portal" icon={<CheckCircle2 className="size-4" />} label="Patient visible" value={String(visibleCount)} /><Stat detail="Payload present in encrypted fallback" icon={<Fingerprint className="size-4" />} label="Stored + verified" value={String(encryptedCount)} /></div>
    {canCreate && <SectionCard title="Receive a document" description="Capture from upload, camera, scanner, import, or generated source. Category policy and linked-record validation run before persistence."><UploadDocumentControl workspace={workspace} /></SectionCard>}
    <section className="grid gap-6 2xl:grid-cols-[1fr_320px]">
      <SectionCard title="Governed document library" description={`${filtered.length} records match the current view. Superseded versions stay immutable and searchable.`}>
        <div className="grid gap-3 border-b border-stone-100 p-4 md:grid-cols-[1fr_220px_180px]"><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><Input className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Search patient, MRN, title, category, or tag" value={query} /></label><select className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs" onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">All categories</option>{workspace.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs" onChange={(event) => setStatus(event.target.value)} value={status}><option value="current">Current versions</option><option value="review">Needs review</option><option value="portal">Patient visible</option><option value="archived">Archived</option><option value="all">All versions</option></select></div>
        <div className="divide-y divide-stone-100">{filtered.map((document) => <article className="p-5" key={document.id}><div className="grid gap-4 xl:grid-cols-[auto_1.1fr_.65fr_.55fr_auto] xl:items-start"><label className="pt-2"><input aria-label={`Select ${document.name} for packet export`} checked={selectedIds.includes(document.id)} disabled={!document.hasStoredContent || document.status !== "active"} onChange={() => toggleSelection(document.id)} type="checkbox" /></label><div className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-950"><FileCheck2 className="size-5" /></span><div className="min-w-0"><p className="truncate text-xs font-black text-stone-950">{document.name}</p><p className="mt-1 text-[12px] text-stone-400">{document.patientName}{document.patientMrn ? ` · ${document.patientMrn}` : ""}</p><div className="mt-3 flex flex-wrap gap-1.5"><Badge tone="amber">{document.categoryName}</Badge><Badge>v{document.version}</Badge><Badge tone={document.status === "active" ? "teal" : "slate"}>{document.status}</Badge>{document.lockedAt && <Badge tone="slate">locked</Badge>}{document.tags.slice(0, 3).map((tag) => <Badge key={tag}><Tags className="mr-1 size-2.5" />{tag}</Badge>)}</div></div></div><div><p className="text-[11px] font-black uppercase tracking-[.13em] text-stone-400">Custody</p><p className="mt-2 text-[12px] font-bold text-stone-700">{document.sourceType} · {formatBytes(document.sizeBytes)}</p><p className="mt-1 text-[11px] text-stone-400">{formatDate(document.createdAt)}</p><p className="mt-2 truncate font-mono text-[11px] text-stone-400">{document.checksumSha256 ?? "external source reference"}</p></div><div className="space-y-2"><StatusBadge status={document.reviewStatus} /><StatusBadge status={document.patientVisible ? "Patient visible" : document.releaseStatus} />{document.expiresAt && <p className="text-[11px] text-stone-400">Expires {formatDate(document.expiresAt)}</p>}</div><DocumentContentActions canDownload={canManage} canPrint={canUpdate} document={document} /></div><DocumentTransitionControl canSign={canSign} canUpdate={canUpdate} document={document} />{canCreate && <CreateDocumentVersionControl document={document} />}</article>)}{!filtered.length && <div className="p-10 text-center"><ShieldAlert className="mx-auto size-7 text-stone-300" /><p className="mt-3 text-xs font-bold text-stone-700">No documents match this governed view.</p></div>}</div>
      </SectionCard>
      <div className="space-y-6"><DocumentPacketExportControl disabled={!canManage} selectedIds={selectedStoredIds} /><SectionCard title="Category policy"><div className="space-y-2 p-3">{workspace.categories.map((item) => <div className="rounded-xl border border-stone-100 p-3" key={item.id}><div className="flex items-center justify-between"><p className="text-[12px] font-black text-stone-900">{item.name}</p><Badge tone={item.reviewRequired ? "amber" : "slate"}>{item.reviewRequired ? "Review gate" : "No review"}</Badge></div><p className="mt-2 text-[11px] leading-4 text-stone-400">{item.defaultAccess.replaceAll("_", " ")} · {item.retentionDays ? `${item.retentionDays} day retention` : "policy retention"}</p></div>)}</div></SectionCard><SectionCard title="Custody ledger"><div className="space-y-2 p-3">{workspace.events.slice(0, 7).map((event) => <div className="flex gap-3 rounded-xl bg-stone-50 p-3" key={event.id}><History className="mt-0.5 size-3.5 shrink-0 text-amber-700" /><div><p className="text-[12px] font-bold text-stone-800">{event.eventType.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-stone-400">{formatDate(event.createdAt)} · {event.actorId ?? "system"}</p></div></div>)}{!workspace.events.length && <p className="p-3 text-[12px] text-stone-400">Custody events will appear after the first governed action.</p>}</div></SectionCard><Card className="bg-amber-50 p-5"><Archive className="size-5 text-amber-800" /><p className="mt-4 text-sm font-black text-stone-950">Deletion is not a routine action.</p><p className="mt-2 text-[12px] leading-5 text-stone-600">ClinicOS archives, versions, and audits clinical records. Retention and authorized destruction require a separate policy workflow.</p></Card></div>
    </section>
  </div>;
}
