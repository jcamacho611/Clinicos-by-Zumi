"use client";

import { useMemo, useState } from "react";

export type EduCertificateView = {
  id: string;
  certificateType: string;
  title: string;
  disclaimer: string;
  serialNumber: string;
  evidenceAreas: string[];
  issuedAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
  enrollment: { studentDisplayName: string; studentEmail: string };
};

export type EduCertificateEnrollmentOption = {
  id: string;
  studentDisplayName: string;
  status: string;
  demonstratedCompetencyAreas: string[];
};

function evidenceLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function EduCertificateManager({
  certificates,
  enrollments,
  canIssue,
  canRevoke,
}: {
  certificates: EduCertificateView[];
  enrollments: EduCertificateEnrollmentOption[];
  canIssue: boolean;
  canRevoke: boolean;
}) {
  const [enrollmentId, setEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const [certificateType, setCertificateType] = useState<"completion" | "competency_evidence">("completion");
  const [title, setTitle] = useState("Klinikos EDU completion evidence");
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selectedEnrollment = useMemo(
    () => enrollments.find((entry) => entry.id === enrollmentId) ?? null,
    [enrollmentId, enrollments],
  );

  async function issue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/edu/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue",
          enrollmentId,
          certificateType,
          title: title.trim(),
          competencyAreas: certificateType === "competency_evidence" ? selectedCompetencies : [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error([payload.error, ...(payload.problems ?? [])].filter(Boolean).join(" ") || "Certificate issuance failed.");
      }
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Certificate issuance failed.");
      setBusy(false);
    }
  }

  async function revoke(certificateId: string) {
    const reason = window.prompt("Why is this educational evidence being revoked?");
    if (!reason?.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/edu/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", certificateId, reason: reason.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Certificate revocation failed.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Certificate revocation failed.");
      setBusy(false);
    }
  }

  return <div className="space-y-6">
    {canIssue && <form className="rounded-[22px] border border-white/10 bg-white/[.025] p-5" onSubmit={issue}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-semibold text-[#d7c1bd]">
          Enrollment
          <select
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#090506] px-3 text-sm text-[#f8efed]"
            value={enrollmentId}
            onChange={(event) => {
              setEnrollmentId(event.target.value);
              setSelectedCompetencies([]);
            }}
          >
            {enrollments.map((entry) => <option key={entry.id} value={entry.id}>{entry.studentDisplayName} · {entry.status}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#d7c1bd]">
          Evidence type
          <select
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#090506] px-3 text-sm text-[#f8efed]"
            value={certificateType}
            onChange={(event) => {
              const nextType = event.target.value as "completion" | "competency_evidence";
              setCertificateType(nextType);
              setTitle(nextType === "completion" ? "Klinikos EDU completion evidence" : "Klinikos EDU competency evidence");
              setSelectedCompetencies([]);
            }}
          >
            <option value="completion">Completion evidence</option>
            <option value="competency_evidence">Competency evidence</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block text-xs font-semibold text-[#d7c1bd]">
        Title
        <input
          className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#090506] px-3 text-sm text-[#f8efed]"
          maxLength={160}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      {certificateType === "competency_evidence" && <fieldset className="mt-4">
        <legend className="text-xs font-semibold text-[#d7c1bd]">Human-demonstrated competency areas</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedEnrollment?.demonstratedCompetencyAreas.map((area) => <label className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-[#cbb6b2]" key={area}>
            <input
              type="checkbox"
              checked={selectedCompetencies.includes(area)}
              onChange={(event) => setSelectedCompetencies((current) => event.target.checked
                ? [...new Set([...current, area])]
                : current.filter((entry) => entry !== area))}
            />
            {evidenceLabel(area)}
          </label>)}
          {selectedEnrollment && selectedEnrollment.demonstratedCompetencyAreas.length === 0 && <p className="text-xs text-[#9f8985]">No human-demonstrated competency areas are available for this enrollment.</p>}
        </div>
      </fieldset>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="min-h-11 rounded-full bg-[#e6817b] px-5 text-xs font-bold text-[#19090b] disabled:opacity-50"
          disabled={busy || !enrollmentId || !title.trim() || (certificateType === "competency_evidence" && !selectedCompetencies.length)}
          type="submit"
        >
          Issue educational evidence
        </button>
        <p aria-live="polite" className="text-xs text-[#bca5a1]">{message}</p>
      </div>
    </form>}

    {certificates.length ? <ul className="grid gap-4 xl:grid-cols-2">
      {certificates.map((certificate) => <li className="rounded-[22px] border border-white/10 bg-white/[.025] p-5" key={certificate.id}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[.14em] text-[#e6817b]">{certificate.certificateType.replaceAll("_", " ")}</p>
            <h2 className="mt-2 text-lg font-semibold text-[#f8efed]">{certificate.title}</h2>
            <p className="mt-1 text-sm text-[#bca5a1]">{certificate.enrollment.studentDisplayName}</p>
          </div>
          <span className="text-[12px] font-bold uppercase tracking-[.12em] text-[#a9c5b0]">{certificate.revokedAt ? "Revoked" : "Active evidence"}</span>
        </div>
        <p className="mt-4 text-xs text-[#9f8985]">Serial: {certificate.serialNumber} · Issued {new Date(certificate.issuedAt).toLocaleDateString()}</p>
        {certificate.evidenceAreas.length > 0 && <div className="mt-4">
          <p className="text-[12px] font-bold uppercase tracking-[.12em] text-[#9f8985]">Evidence scope</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {certificate.evidenceAreas.map((area) => <li className="rounded-full border border-[#e6817b]/20 bg-[#e6817b]/[.05] px-2.5 py-1 text-[11px] text-[#d7c1bd]" key={area}>{evidenceLabel(area)}</li>)}
          </ul>
        </div>}
        {certificate.revokedReason && <p className="mt-3 text-xs text-[#dba0a0]">Revoked: {certificate.revokedReason}</p>}
        <p className="mt-4 border-t border-white/10 pt-4 text-[12px] leading-5 text-[#806c69]">{certificate.disclaimer}</p>
        {canRevoke && !certificate.revokedAt && <button
          className="mt-4 rounded-full border border-[#d97c7c]/30 px-3 py-2 text-[11px] font-bold text-[#dba0a0]"
          disabled={busy}
          onClick={() => revoke(certificate.id)}
          type="button"
        >
          Revoke evidence
        </button>}
      </li>)}
    </ul> : <p className="rounded-[22px] border border-dashed border-white/10 p-8 text-center text-sm text-[#9f8985]">No certificate evidence has been issued in this EDU scope.</p>}
  </div>;
}
