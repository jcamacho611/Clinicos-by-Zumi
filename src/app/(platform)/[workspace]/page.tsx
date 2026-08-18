import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConnectionsWorkspaceReal } from "@/components/clinic/connections-workspace-real";
import { EscalationsWorkspaceReal } from "@/components/clinic/escalations-workspace-real";
import { InsuranceWorkspaceReal } from "@/components/clinic/insurance-workspace-real";
import { MessagesWorkspaceReal } from "@/components/clinic/messages-workspace-real";
import { TasksWorkspaceReal } from "@/components/clinic/tasks-workspace-real";
import { TwilioRoutingPanel } from "@/components/clinic/twilio-routing-panel";
import { WorkspaceRenderer, workspaceSlugs } from "@/components/clinic/workspace-renderer";
import { can } from "@/lib/auth/rbac";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { requireClinicSession } from "@/lib/auth/session";
import { workspaceMeta } from "@/lib/navigation";
import { listCareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";
import { listInsuranceWorkspace } from "@/lib/repositories/insurance-repository";

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
  if (workspace === "tasks") return <TasksWorkspaceReal workspace={await listCareCoordinationWorkspace(session.organizationId, session.userId)} />;
  if (workspace === "messages") return <MessagesWorkspaceReal />;
  if (workspace === "escalations") return <EscalationsWorkspaceReal workspace={await listCareCoordinationWorkspace(session.organizationId, session.userId)} />;
  if (workspace === "insurance") return <InsuranceWorkspaceReal workspace={await listInsuranceWorkspace(session)} />;
  if (workspace === "integrations") {
    return (
      <div className="space-y-6">
        <TwilioRoutingPanel canManage={can(session.role, "integrations", "manage")} />
        <ConnectionsWorkspaceReal />
      </div>
    );
  }
  return <WorkspaceRenderer organizationId={session.organizationId} role={session.role} userId={session.userId} workspace={workspace} />;
}
