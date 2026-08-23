export type NetworkGrowthInvitationContinuityInput = {
  id: string;
  status: string;
  invitingOrganizationId: string;
  targetOrganizationId: string | null;
  invitingOrganizationName: string;
  targetOrganizationName: string | null;
  inviteeName: string;
  inviteeType: string;
  specialty: string | null;
};

export type NetworkGrowthConnectionContinuityInput = {
  sourceOrganizationId: string;
  targetOrganizationId: string;
  status: string;
};

export type AcceptedRelationshipGap = {
  invitationId: string;
  counterpartOrganizationId: string;
  counterpartName: string;
  inviteeType: string;
  specialty: string | null;
  nextStep: "request_relationship";
};

function joinsOrganizations(
  connection: NetworkGrowthConnectionContinuityInput,
  firstOrganizationId: string,
  secondOrganizationId: string,
) {
  return (
    connection.sourceOrganizationId === firstOrganizationId && connection.targetOrganizationId === secondOrganizationId
  ) || (
    connection.sourceOrganizationId === secondOrganizationId && connection.targetOrganizationId === firstOrganizationId
  );
}

export function deriveAcceptedRelationshipGaps(input: {
  currentOrganizationId: string;
  invitations: readonly NetworkGrowthInvitationContinuityInput[];
  connections: readonly NetworkGrowthConnectionContinuityInput[];
}): AcceptedRelationshipGap[] {
  return input.invitations.flatMap((invitation) => {
    if (invitation.status !== "accepted" || !invitation.targetOrganizationId) return [];

    const currentIsInviter = invitation.invitingOrganizationId === input.currentOrganizationId;
    const currentIsTarget = invitation.targetOrganizationId === input.currentOrganizationId;
    if (!currentIsInviter && !currentIsTarget) return [];

    const counterpartOrganizationId = currentIsInviter
      ? invitation.targetOrganizationId
      : invitation.invitingOrganizationId;
    if (counterpartOrganizationId === input.currentOrganizationId) return [];

    const relationshipAlreadyRepresented = input.connections.some((connection) =>
      joinsOrganizations(connection, input.currentOrganizationId, counterpartOrganizationId),
    );
    if (relationshipAlreadyRepresented) return [];

    const counterpartName = currentIsInviter
      ? invitation.targetOrganizationName ?? invitation.inviteeName
      : invitation.invitingOrganizationName;

    return [{
      invitationId: invitation.id,
      counterpartOrganizationId,
      counterpartName,
      inviteeType: invitation.inviteeType,
      specialty: invitation.specialty,
      nextStep: "request_relationship" as const,
    }];
  });
}