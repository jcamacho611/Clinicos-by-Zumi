"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  canTransitionCurriculumVersion,
  curriculumVersionStatuses,
  type CurriculumVersionStatus,
} from "@/lib/edu/workforce-curriculum-versioning";

type CourseOption = { id: string; title: string; code: string };
type VersionView = {
  id: string;
  courseId: string;
  version: string;
  status: CurriculumVersionStatus;
  changeSummary: string | null;
  approvedAt: string | null;
  effectiveAt: string | null;
  retiredAt: string | null;
};

export function WorkforceCurriculumVersionManager({
  courses,
  versions,
  canApprove,
}: {
  courses: CourseOption[];
  versions: VersionView[];
  canApprove: boolean;
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [version, setVersion] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  async function createVersion(event: React.FormEvent) {
    event.preventDefault();
    setBusy("create");
    setMessage(null);
    try {
      const response = await fetch("/api/edu/curriculum-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, version, changeSummary: changeSummary || null }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Curriculum version could not be created.");
      setVersion("");
      setChangeSummary("");
      setMessage("Draft curriculum version created.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Curriculum version could not be created.");
    } finally {
      setBusy(null);
    }
  }

  async function transition(versionId: string, toStatus: CurriculumVersionStatus) {
    setBusy(`${versionId}:${toStatus}`);
    setMessage(null);
    try {
      const response = await fetch(`/api/edu/curriculum-versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Curriculum version could not be updated.");
      setMessage(`Curriculum version moved to ${toStatus}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Curriculum version could not be updated.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-8 border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7" aria-labelledby="curriculum-version-title">
      <div className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Delivery provenance</p>
        <h2 className="mt-2 text-lg font-semibold text-[#f8efed]" id="curriculum-version-title">Curriculum versions</h2>
        <p className="mt-2 text-xs leading-6 text-[#a98f8b]">Create a version before delivery, send it through review, and activate it only after approval. Sessions can record the curriculum/material version that was actually taught.</p>
      </div>

      <form className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_1.5fr_auto]" onSubmit={createVersion}>
        <label className="text-xs text-[#bca5a1]">
          Course
          <select className="mt-1 w-full border border-[#e28b85]/16 bg-[#12090b] px-3 py-2 text-[#f8efed]" onChange={(event) => setCourseId(event.target.value)} required value={courseId}>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}
          </select>
        </label>
        <label className="text-xs text-[#bca5a1]">
          Version
          <input className="mt-1 w-full border border-[#e28b85]/16 bg-[#12090b] px-3 py-2 text-[#f8efed]" maxLength={80} onChange={(event) => setVersion(event.target.value)} placeholder="2026.09-v1" required value={version} />
        </label>
        <label className="text-xs text-[#bca5a1]">
          Change summary
          <input className="mt-1 w-full border border-[#e28b85]/16 bg-[#12090b] px-3 py-2 text-[#f8efed]" maxLength={1200} onChange={(event) => setChangeSummary(event.target.value)} placeholder="What changed and why" value={changeSummary} />
        </label>
        <button className="self-end border border-[#e6817b]/35 bg-[#e6817b]/10 px-4 py-2 text-xs font-semibold text-[#ffd0ca] disabled:opacity-50" disabled={busy !== null || !courseId} type="submit">Create draft</button>
      </form>

      {message && <p className="mt-3 text-xs leading-5 text-[#efaaa1]" role="status">{message}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <caption className="sr-only">Curriculum version lifecycle</caption>
          <thead className="text-[#8f7773]"><tr><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Course</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Version</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">State</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Summary</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Controls</th></tr></thead>
          <tbody>
            {versions.length === 0 ? (
              <tr><td className="px-3 py-5 text-[#8f7773]" colSpan={5}>No curriculum versions have been recorded yet.</td></tr>
            ) : versions.map((item) => {
              const course = courseById.get(item.courseId);
              const choices = curriculumVersionStatuses.filter((target) => canTransitionCurriculumVersion(item.status, target) && (canApprove || !["approved", "active", "retired"].includes(target)));
              return (
                <tr className="border-b border-[#e28b85]/10 align-top" key={item.id}>
                  <th className="px-3 py-3 font-semibold text-[#f8efed]" scope="row">{course ? `${course.code} · ${course.title}` : item.courseId}</th>
                  <td className="px-3 py-3 text-[#bca5a1]">{item.version}</td>
                  <td className="px-3 py-3 font-semibold text-[#efaaa1]">{item.status}</td>
                  <td className="max-w-md px-3 py-3 leading-5 text-[#a98f8b]">{item.changeSummary || "No summary recorded"}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {choices.map((target) => <button className="border border-[#e6817b]/25 px-2.5 py-1.5 text-[11px] font-semibold text-[#efaaa1] disabled:opacity-50" disabled={busy !== null} key={target} onClick={() => transition(item.id, target)} type="button">→ {target}</button>)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
