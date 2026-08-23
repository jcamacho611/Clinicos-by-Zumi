import "server-only";

import type { FrozenGeneratedLegalArtifact } from "@/lib/legal/generated/legal-artifacts";
import type {
  GeneratedLegalDocument,
  GeneratedLegalDocumentEvent,
  GeneratedLegalDocumentStatus,
  VerifiedGeneratedLegalExecutionEvidence,
} from "@/lib/legal/generated/legal-document-lifecycle";

export type GeneratedLegalVaultDocumentSummary = Pick<
  GeneratedLegalDocument,
  "id" | "organizationId" | "documentKey" | "version" | "status" | "createdAt" | "updatedAt"
> & {
  recipientName: string;
  recipientState: string;
  relationshipType: string;
};

export interface GeneratedLegalVaultStore {
  create(input: { organizationId: string; record: GeneratedLegalDocument }): Promise<void>;
  get(input: { organizationId: string; documentId: string }): Promise<GeneratedLegalDocument | null>;
  list(input: { organizationId: string; limit?: number }): Promise<GeneratedLegalVaultDocumentSummary[]>;
  appendEvent(input: {
    organizationId: string;
    documentId: string;
    expectedStatus?: GeneratedLegalDocumentStatus;
    event: GeneratedLegalDocumentEvent;
  }): Promise<void>;
  attachFrozenArtifact(input: {
    organizationId: string;
    documentId: string;
    expectedVersion: number;
    artifact: FrozenGeneratedLegalArtifact;
  }): Promise<void>;
  appendExecutionEvidence(input: {
    organizationId: string;
    documentId: string;
    expectedArtifactSha256: string;
    evidence: VerifiedGeneratedLegalExecutionEvidence;
  }): Promise<void>;
  compareAndSetStatus(input: {
    organizationId: string;
    documentId: string;
    expectedStatus: GeneratedLegalDocumentStatus;
    nextStatus: GeneratedLegalDocumentStatus;
    event: GeneratedLegalDocumentEvent;
  }): Promise<boolean>;
}

/**
 * Persistence contract for generated legal documents.
 *
 * Implementations must preserve these invariants:
 * - every operation is organization-scoped before any document lookup or mutation;
 * - events and execution evidence are append-only;
 * - a frozen artifact is immutable and identified by its exact SHA-256 + version;
 * - lifecycle changes use optimistic/transactional compare-and-set semantics;
 * - execution evidence must match the exact frozen artifact before EXECUTED;
 * - destructive deletion is intentionally outside this contract; use VOID/SUPERSEDED;
 * - auth/RBAC and audit enforcement happen in a future server adapter before invocation.
 */
export const GENERATED_LEGAL_VAULT_INVARIANTS = Object.freeze({
  tenantScopeRequired: true,
  appendOnlyEvents: true,
  appendOnlyExecutionEvidence: true,
  immutableArtifacts: true,
  destructiveDeleteSupported: false,
  executionRequiresExactArtifactEvidence: true,
  compareAndSetTransitions: true,
});
