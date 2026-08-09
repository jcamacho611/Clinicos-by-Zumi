import { notFound } from "next/navigation";
import { NetworkCommandWorkspace, type NetworkCommandView } from "@/components/clinic/network/network-command-workspace";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { listNetworkCommandWorkspace } from "@/lib/repositories/network-handoff-repository";

export async function NetworkCommandRoute({ view }: { view: NetworkCommandView }) {
  const session = await requireClinicSession();
  if (!can(session.role, "network", "read")) return notFound();
  return <NetworkCommandWorkspace view={view} workspace={await listNetworkCommandWorkspace(session)} />;
}
