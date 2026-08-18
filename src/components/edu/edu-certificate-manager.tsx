"use client";

import { useMemo, useState } from "react";

export type EduCertificateView = {
  id: string;
  enrollmentId: string;
  certificateType: string;
  title: string;
  disclaimer: string;
  serialNumber: string;
  issuedAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
  enrollment: { studentDisplayName: string; studentEmail: string; cohortId: string };
};

export type EduCertificateEnrollmentOption = {
  id: string;
  studentDisplayName: string;
  studentEmail: string;
  status: string;
  demonstratedCompetencyAreas: string[];
};

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

  async function issueCertificate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollmentId || !title.trim()) return;
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
        const problems = Array.isArray(payload.problems) ? payload.problems.join(" ") : "";
        throw new Error([payload.error, problems].filter(Boolean).join(" ") || "Certificate issuance failed.");
      }
      setMessage(payload.idempotent ? "Matching active certificate evidence already exists." : "Certificate evidence issued.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Certificate issuance failed.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeCertificate(certificateId: string) {
    const reason = window.prompt("Why is this certificate evidence being revoked?");
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
      setMessage("Certificate evidence revoked. Historical evidence remains retained.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Certificate revocation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {canIssue && (
        <form className="border border-[#e28b85]/14 bg-[#12090b]/55 p-5" onSubmit={issueCertificate}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-xs font-semibold text-[#d7c1bd]">
              Student enrollment
              <select className="mt-2 min-h-11 w-full border border-[#e28b85]/18 bg-[#090506] px-3 text-sm text-[#f8efed]" onChange={(event) => { setEnrollmentId(event.target.value); setSelectedCompetencies([]); }} value={enrollmentId}>
                {enrollments.map((entry) => <option key={entry.id} value={entry.id}>{entry.studentDisplayName} · {entry.status}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#d7c1bd]">
              Evidence type
              <select className="mt-2 min-h-11 w-full border border-[#e28b85]/18 bg-[#090506] px-3 text-sm text-[#f8efed]" onChange={(event) => { setCertificateType(event.target.value as "completion" | "competency_evidence"); setSelectedCompetencies([]); }} value={certificateType}>
                <option value="completion">Completion evidence</option>
                <option value="competency_evidence">Competency evidence</option>
              </select>
            </label>
          </div>
          <label className="mt-4 block text-xs font-semibold text-[#d7c1bd]">
            Certificate title
            <input className="mt-2 min-h-11 w-full border border-[#e28b85]/18 bg-[#090506] px-3 text-sm text-[#f8efed]" maxLength={160} onChange={(event) => setTitle(event.target.value)} value={title} />
          </label>
          {certificateType === "competency_evidence" && (
            <fieldset className="mt-4">
              <legend className="text-xs font-semibold text-[#d7c1bd]">Human-demonstrated competency areas</legend>
              {selectedEnrollment?.demonstratedCompetencyAreas.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedEnrollment.demonstratedCompetencyAreas.map((area) => (
                    <label className="flex items-center gap-2 border border-[#e28b85]/15 px-3 py-2 text-xs text-[#cbb6b2]" key={area}>
                      <input checked={selectedCompetencies.includes(area)} onChange={(event) => setSelectedCompetencies((current) => event.target.checked ? [...new Set([...current, area])] : current.filter((entry) => entry !== area))} type="checkbox" />
                      {area.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
              ) : <p className="mt-2 text-xs text-[#8f7773]">No human-determined demonstrated competency is available for this enrollment.</p>}
            </fieldset>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="min-h-11 bg-[#e6817b] px-5 text-xs font-bold text-[#19090b] disabled:opacity-50" disabled={busy || !enrollmentId || !title.trim() || (certificateType === "competency_evidence" && !selectedCompetencies.length)} type="submit">Issue educational evidence</button>
            <p aria-live="polite" className="text-xs text-[#bca5a1]">{message}</p>
          </div>
        </form>
      )}

      {certificates.length ? (
        <ul className="grid gap-4 xl:grid-cols-2">
          {certificates.map((certificate) => (
            <li className="border border-[#e28b85]/12 bg-white/[.025] p-5" key={certificate.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#e6817b]">{certificate.certificateType.replace(/_/g, " ")}</p>
                  <h2 className="mt-2 text-lg font-semibold text-[#f8efed]">{certificate.title}</h2>
                  <p className="mt-1 text-sm text-[#bca5a1]">{certificate.enrollment.studentDisplayName}</p>
                </div>
                <span className={`border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${certificate.revokedAt ? "border-[#d97c7c]/25 text-[#dba0a0]" : "border-[#8db49a]/25 text-[#9fc3aa]"}`}>{certificate.revokedAt ? "Revoked" : "Active evidence"}</span>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-[#9f8985] sm:grid-cols-2">
                <div><dt className="font-semibold text-[#cbb6b2]">Serial</dt><dd className="mt-1 break-all">{certificate.serialNumber}</dd></div>
                <div><dt className="font-semibold text-[#cbb6b2]">Issued</dt><dd className="mt-1">{new Date(certificate.issuedAt).toLocaleString()}</dd></div>
              </dl>
              {certificate.revokedReason && <p className="mt-4 border-l-2 border-[#d97c7c]/40 pl-3 text-xs text-[#dba0a0]">Revoked: {certificate.revokedReason}</p>}
              <p className="mt-4 border-t border-[#e28b85]/10 pt-4 text-[10px] leading-5 text-[#806c69]">{certificate.disclaimer}</p>
              {canRevoke && !certificate.revokedAt && <button className="mt-4 border border-[#d97c7c]/25 px-3 py-2 text-[11px] font-bold text-[#dba0a0] disabled:opacity-50" disabled={busy} onClick={() => revokeCertificate(certificate.id)} type="button">Revoke evidence</button>}
            </li>
          ))}
        </ul>
      ) : <p className="border border-dashed border-[#e28b85]/16 px-6 py-10 text-center text-sm text-[#9f8985]">No certificate evidence has been issued in your current EDU scope.</p>}
    </div>
  );
}
