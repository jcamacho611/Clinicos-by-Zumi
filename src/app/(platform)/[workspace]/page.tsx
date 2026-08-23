import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EscalationsWorkspaceReal } from "@/components/clinic/escalations-workspace-real";
import { InsuranceWorkspaceReal } from "@/components/clinic/insurance-workspace-real";
import { MessagesWorkspaceReal } from "@/components/clinic/messages-workspace-real";
import { QualityCommandCenter } from "@/components/clinic/quality-command-center";
import { TasksWorkspaceReal } from "@/components/clinic/tasks-workspace-real";
import { WorkspaceRenderer, workspaceSlugs } from "@/components/clinic/workspace-renderer";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { requireClinicSession } from "@/lib/auth/session";
import { workspaceMeta } from "@/lib/navigation";
import { listUniversalObligations } from "@/lib/obligations/universal-obligation-repository";
import { listCareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";
import { listInsuranceWorkspace } from "@/lib/repositories/insurance-repository";
import { listQualityCommandCenter } from "@/lib/repositories/quality-command-center-repository";

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
    const [taskWorkspace, obligations] = await Promise.all([
      listCareCoordinationWorkspace(session.organizationId, session.userId),
      listUniversalObligations(session.organizationId),
    ]);
    return <TasksWorkspaceReal workspace={taskWorkspace} obligations={obligations} />;
  }
  if (workspace === "messages") {
    return <MessagesWorkspaceReal />;
  }
  if (workspace === "escalations") {
    return <EscalationsWorkspaceReal workspace={await listCareCoordinationWorkspace(session.organizationId, session.userId)} />;
  }
  if (workspace === "insurance") {
    return <InsuranceWorkspaceReal workspace={await listInsuranceWorkspace(session)} />;
  }
  if (workspace === "quality") {
    return <QualityCommandCenter workspace={await listQualityCommandCenter(session)} />;
  }
  return <WorkspaceRenderer organizationId={session.organizationId} role={session.role} userId={session.userId} workspace={workspace} />;
}
