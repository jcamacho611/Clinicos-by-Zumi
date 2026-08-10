import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { curriculumPackages } from "@/lib/edu/edu-curriculum";
import { eduAiGatewayStatus } from "@/lib/edu/edu-safety";

export const dynamic = "force-dynamic";

export default async function AdminEduPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "settings", "manage")) redirect("/dashboard");

  const institutions = process.env.DATABASE_URL
    ? await db.educationInstitution.findMany({
        where: { organizationId: session.organizationId },
        select: { id: true, name: true, slug: true, status: true, _count: { select: { courses: true, enrollments: true } } },
        orderBy: { name: "asc" },
      })
    : [];

  const gateway = eduAiGatewayStatus();

  return (
    <section className="p-5 sm:p-8">
      <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#9a7a1f]">Klinikos EDU</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-.045em]">Education administration</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Institutions hosted by this tenant. EDU data is structurally isolated from clinical records; students cannot reach clinic data.
      </p>

      <h2 className="mt-8 text-lg font-extrabold tracking-[-.03em]">Institutions</h2>
      <div className="mt-4 overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[620px] text-left text-sm">
          <caption className="sr-only">Education institutions</caption>
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-600">
            <tr>
              <th className="px-4 py-3 font-extrabold" scope="col">Institution</th>
              <th className="px-4 py-3 font-extrabold" scope="col">Slug</th>
              <th className="px-4 py-3 font-extrabold" scope="col">Courses</th>
              <th className="px-4 py-3 font-extrabold" scope="col">Enrollments</th>
              <th className="px-4 py-3 font-extrabold" scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {institutions.map((institution) => (
              <tr className="border-t border-slate-200" key={institution.id}>
                <th className="px-4 py-3 font-bold text-slate-950" scope="row">{institution.name}</th>
                <td className="px-4 py-3 text-slate-600">{institution.slug}</td>
                <td className="px-4 py-3 tabular-nums text-slate-700">{institution._count.courses}</td>
                <td className="px-4 py-3 tabular-nums text-slate-700">{institution._count.enrollments}</td>
                <td className="px-4 py-3 text-slate-600">{institution.status}</td>
              </tr>
            ))}
            {!institutions.length && (
              <tr><td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={5}>No education institutions are linked to this tenant.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-extrabold tracking-[-.03em]">Curriculum packages</h2>
      <p className="mt-2 text-[12px] leading-6 text-slate-600">
        {curriculumPackages.length} packages are defined in code. A course instantiates one of them.
      </p>

      <p className="mt-8 max-w-3xl border-t border-slate-200 pt-5 text-[11px] leading-5 text-slate-500">
        AI scenario drafting and feedback: <strong className="font-bold text-amber-800">Pending Connection</strong>. {gateway.detail}
      </p>
    </section>
  );
}
