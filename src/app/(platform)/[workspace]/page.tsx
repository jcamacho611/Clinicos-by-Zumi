import type { Metadata } from "next";
import { WorkspaceRenderer, workspaceSlugs } from "@/components/clinic/workspace-renderer";
import { requireClinicSession } from "@/lib/auth/session";
import { workspaceMeta } from "@/lib/navigation";

export function generateStaticParams() {
  return workspaceSlugs.map((workspace) => ({ workspace }));
}

export async function generateMetadata({ params }: { params: Promise<{ workspace: string }> }): Promise<Metadata> {
  const { workspace } = await params;
  return { title: workspaceMeta[workspace]?.title ?? "Clinic workspace" };
}

export default async function WorkspacePage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const session = await requireClinicSession();
  return <WorkspaceRenderer organizationId={session.organizationId} role={session.role} userId={session.userId} workspace={workspace} />;
}
