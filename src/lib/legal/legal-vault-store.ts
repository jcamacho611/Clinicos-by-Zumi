import "server-only";
import type {
  LegalDocumentEvent,
  LegalDocumentRecord,
  LegalDocumentStatus,
  VerifiedExecutionEvidence,
} from "@/lib/legal/legal-document-lifecycle";
import type { FrozenLegalPdfArtifact } from "@/lib/legal/legal-artifacts";

export type LegalVaultDocumentSummary = Pick<
  LegalDocumentRecord,
  "id" | "documentKey" | "version" | "status" | "createdAt" | "updatedAt"
> & {
  recipientName: string;
  recipientState: string;
  relationshipType: string;
};

export type LegalVaultAppendEventInput = {
  documentId: string;
  expectedStatus?: LegalDocumentStatus;
  event: LegalDocumentEvent;
};

export interface LegalVaultStore {
  create(record: LegalDocumentRecord): Promise<void>;
  get(documentId: string): Promise<LegalDocumentRecord | null>;
  list(limit?: number): Promise<LegalVaultDocumentSummary[]>;
  appendEvent(input: LegalVaultAppendEventInput): Promise<void>;
  attachFrozenArtifact(documentId: string, artifact: FrozenLegalPdfArtifact): Promise<void>;
  appendExecutionEvidence(documentId: string, evidence: VerifiedExecutionEvidence): Promise<void>;
  compareAndSetStatus(input: {
    documentId: string;
    expectedStatus: LegalDocumentStatus;
    nextStatus: LegalDocumentStatus;
    event: LegalDocumentEvent;
  }): Promise<boolean>;
}

/**
 * Persistence contract for the Legal Vault.
 *
 * Implementations must preserve these invariants:
 * - events and execution evidence are append-only;
 * - an artifact hash identifies a frozen byte-exact version and is never overwritten;
 * - lifecycle transitions use optimistic/transactional compare-and-set semantics;
 * - EXECUTED is impossible without verified execution evidence;
 * - destructive delete is not part of this interface; use VOID/SUPERSEDED states instead;
 * - authorization and audit enforcement occur server-side before this store is invoked.
 *
 * No database implementation is included here intentionally. The active Prisma schema is large and
 * production-sensitive; a migration should be generated/reviewed against current main rather than
 * editing the schema through a partial-file replacement.
 */
export const LEGAL_VAULT_PERSISTENCE_INVARIANTS = Object.freeze({
  appendOnlyEvents: true,
  appendOnlyExecutionEvidence: true,
  immutableArtifacts: true,
  destructiveDeleteSupported: false,
  executionRequiresVerifiedEvidence: true,
  compareAndSetTransitions: true,
});
