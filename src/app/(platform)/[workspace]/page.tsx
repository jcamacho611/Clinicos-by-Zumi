import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceRenderer, workspaceSlugs } from "@/components/clinic/workspace-renderer";
import { TasksWorkspaceReal } from "@/components/clinic/tasks-workspace-real";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { requireClinicSession } from "@/lib/auth/session";
import { workspaceMeta } from "@/lib/navigation";
import { listCareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";

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
  if (!canAccessWorkspace(session.role, workspace)) return notFound();
  if (workspace === "tasks") {
    return <TasksWorkspaceReal workspace={await listCareCoordinationWorkspace(session.organizationId, session.userId)} />;
  }
  return <WorkspaceRenderer organizationId={session.organizationId} role={session.role} userId={session.userId} workspace={workspace} />;
}
