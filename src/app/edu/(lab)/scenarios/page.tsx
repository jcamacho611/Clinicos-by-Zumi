import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";
import { SYNTHETIC_DATA_NOTICE } from "@/lib/edu/edu-safety";

export const dynamic = "force-dynamic";

export default async function EduScenariosPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;

  // Students only ever see published scenarios; drafts and answer keys stay with staff.
  const studentScoped = identity.role === "edu_student" || identity.role === "edu_observer";
  const scenarios = process.env.DATABASE_URL
    ? await db.educationScenario.findMany({
        where: { ...eduInstitutionFilter(identity), ...(studentScoped ? { status: "published" } : {}) },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 200,
        select: { id: true, title: true, setting: true, difficulty: true, status: true, version: true, estimatedMinutes: true, simulationRoles: true, aiGenerated: true },
      })
    : [];

  return (
    <>
      <EduCommandHeader
        description="Synthetic scenarios available to this institution. Only a published scenario can be assigned to a cohort."
        eyebrow="Simulation"
        title="Scenario library"
      />
      <div className="px-5 py-6 sm:px-8">
        <p className="max-w-3xl border-l-2 border-amber-300 pl-4 text-[12px] leading-6 text-slate-600">{SYNTHETIC_DATA_NOTICE}</p>
        <div className="mt-6">
          {scenarios.length ? (
            <div className="overflow-x-auto border border-slate-200 bg-white">
              <table className="w-full min-w-[820px] text-left text-sm">
                <caption className="sr-only">Scenario library</caption>
                <thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-extrabold" scope="col">Scenario</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Setting</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Difficulty</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Seats</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Minutes</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Version</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((scenario) => (
                    <tr className="border-t border-slate-200" key={scenario.id}>
                      <th className="px-4 py-3 font-bold text-slate-950" scope="row">
                        {scenario.title}
                        {scenario.aiGenerated && <span className="ml-2 text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">AI draft</span>}
                      </th>
                      <td className="px-4 py-3 text-slate-600">{scenario.setting.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-slate-600">{scenario.difficulty}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-600">{scenario.simulationRoles.map((role) => role.replace(/_/g, " ")).join(", ") || "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{scenario.estimatedMinutes}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">v{scenario.version}</td>
                      <td className="px-4 py-3 text-slate-600">{scenario.status.replace(/_/g, " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EduEmptyState
              detail="No scenarios exist yet. Instructors author them from a structured form; AI drafting stays unavailable until the Klinikos AI Gateway is connected."
              title="No scenarios"
            />
          )}
        </div>
      </div>
    </>
  );
}
