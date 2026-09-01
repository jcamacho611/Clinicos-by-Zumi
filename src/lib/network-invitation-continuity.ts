export type NetworkInvitationContinuityInput = {
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

export type NetworkConnectionContinuityInput = {
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
  state: "relationship_setup_needed";
  nextStep: "request_relationship";
};

function joinsOrganizations(
  connection: NetworkConnectionContinuityInput,
  firstOrganizationId: string,
  secondOrganizationId: string,
) {
  return (
    connection.sourceOrganizationId === firstOrganizationId &&
    connection.targetOrganizationId === secondOrganizationId
  ) || (
    connection.sourceOrganizationId === secondOrganizationId &&
    connection.targetOrganizationId === firstOrganizationId
  );
}

export function acceptedInvitationCounterpart(
  invitation: Pick<NetworkInvitationContinuityInput, "status" | "invitingOrganizationId" | "targetOrganizationId">,
  currentOrganizationId: string,
) {
  if (invitation.status !== "accepted" || !invitation.targetOrganizationId) return null;

  const currentIsInviter = invitation.invitingOrganizationId === currentOrganizationId;
  const currentIsTarget = invitation.targetOrganizationId === currentOrganizationId;
  if (!currentIsInviter && !currentIsTarget) return null;

  const counterpartOrganizationId = currentIsInviter
    ? invitation.targetOrganizationId
    : invitation.invitingOrganizationId;
  return counterpartOrganizationId === currentOrganizationId ? null : counterpartOrganizationId;
}

export function deriveAcceptedRelationshipGaps(input: {
  currentOrganizationId: string;
  invitations: readonly NetworkInvitationContinuityInput[];
  connections: readonly NetworkConnectionContinuityInput[];
}): AcceptedRelationshipGap[] {
  const projectedCounterparts = new Set<string>();

  return input.invitations.flatMap((invitation) => {
    const counterpartOrganizationId = acceptedInvitationCounterpart(invitation, input.currentOrganizationId);
    if (!counterpartOrganizationId || projectedCounterparts.has(counterpartOrganizationId)) return [];

    const relationshipAlreadyRepresented = input.connections.some((connection) =>
      joinsOrganizations(connection, input.currentOrganizationId, counterpartOrganizationId),
    );
    if (relationshipAlreadyRepresented) return [];

    projectedCounterparts.add(counterpartOrganizationId);
    const currentIsInviter = invitation.invitingOrganizationId === input.currentOrganizationId;

    return [{
      invitationId: invitation.id,
      counterpartOrganizationId,
      counterpartName: currentIsInviter
        ? invitation.targetOrganizationName ?? invitation.inviteeName
        : invitation.invitingOrganizationName,
      inviteeType: invitation.inviteeType,
      specialty: invitation.specialty,
      state: "relationship_setup_needed" as const,
      nextStep: "request_relationship" as const,
    }];
  });
}
