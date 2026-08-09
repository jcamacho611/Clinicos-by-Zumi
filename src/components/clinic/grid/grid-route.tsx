import { notFound } from "next/navigation";
import { GridWorkspace, type GridView } from "@/components/clinic/grid/grid-workspace";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { listGridWorkspace } from "@/lib/repositories/grid-repository";

export async function GridRoute({ view }: { view: GridView }) {
  const session = await requireClinicSession();
  if (!can(session.role, "grid", "read") && !can(session.role, "network", "read") && !can(session.role, "credentialing", "read")) return notFound();
  if (view === "admin" && !can(session.role, "network", "manage") && !can(session.role, "credentialing", "manage")) return notFound();
  return <GridWorkspace view={view} workspace={await listGridWorkspace(session)} />;
}
