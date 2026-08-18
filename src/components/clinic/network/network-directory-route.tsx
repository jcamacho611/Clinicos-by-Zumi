import { notFound } from "next/navigation";
import { NetworkDirectoryPanel } from "@/components/clinic/network-directory-panel";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { listNetworkDirectory } from "@/lib/repositories/network-directory-repository";

export async function NetworkDirectoryRoute({ admin = false }: { admin?: boolean }) {
  const session = await requireClinicSession();
  if (!can(session.role, "network", "read")) return notFound();
  if (admin && !can(session.role, "network", "manage")) return notFound();
  return <div className="space-y-5"><div className="rounded-[1.6rem] border border-slate-200 bg-slate-950 p-5 text-white"><p className="text-[11px] font-black uppercase tracking-[.2em] text-cyan-200">Relationship administration</p><h2 className="mt-2 text-2xl font-black tracking-[-.045em]">Connection, agreement, and fallback controls</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-white/50">This administrative surface manages participating organizations. Patient-level access remains governed separately by consent, purpose, minimum-necessary categories, and audit history.</p></div><NetworkDirectoryPanel canCreate={can(session.role, "network", "create")} canManage={can(session.role, "network", "manage")} data={await listNetworkDirectory(session.organizationId)} /></div>;
}
