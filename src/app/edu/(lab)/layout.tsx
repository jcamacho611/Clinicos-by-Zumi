import { redirect } from "next/navigation";
import { EduShell } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { resolveEduIdentity } from "@/lib/edu/edu-session";

/**
 * Authenticated Klinikos EDU layout.
 *
 * Scoped to the (lab) route group so the public landing page at /edu stays public
 * while every route beneath it requires a resolved EDU identity. An account with no
 * enrollment and no institution administration right has no EDU access.
 */
export const dynamic = "force-dynamic";

export default async function EduLabLayout({ children }: { children: React.ReactNode }) {
  const identity = await resolveEduIdentity();
  if (!identity) redirect("/dashboard");

  const institution = identity.institutionId && process.env.DATABASE_URL
    ? await db.educationInstitution.findUnique({ where: { id: identity.institutionId }, select: { name: true } })
    : null;

  return (
    <EduShell institutionName={institution?.name ?? null} role={identity.role} userName={identity.session.name}>
      {children}
    </EduShell>
  );
}
