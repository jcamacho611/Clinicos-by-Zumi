import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type {
  MemberSignupAcceptanceEvidence,
  MemberSignupLegalEvidenceDocument,
} from "@/lib/legal/member-signup-acceptance";
import { recordMemberSignupLegalEvidence } from "@/lib/legal/member-signup-legal-evidence";

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function document(
  documentKey: "website_terms" | "privacy_policy",
): MemberSignupLegalEvidenceDocument {
  const documentSnapshot = documentKey === "website_terms"
    ? "TEST ONLY Website Terms acceptance source"
    : "TEST ONLY Privacy Policy acknowledgment source";

  return {
    documentKey,
    documentVersion: "2026-08-10.1",
    title: documentKey === "website_terms" ? "Website Terms of Use" : "Privacy Policy",
    effectiveDate: "2026-08-10",
    kind: documentKey === "website_terms" ? "agreement" : "notice",
    documentSnapshot,
    documentSha256: sha256(documentSnapshot),
    acknowledgments: [documentKey === "website_terms" ? "TEST ONLY acceptance" : "TEST ONLY acknowledgment"],
  };
}

function evidence(): MemberSignupAcceptanceEvidence {
  return { documents: [document("website_terms"), document("privacy_policy")] };
}

function transactionThatMustNotBeUsed() {
  const fail = async () => {
    throw new Error("database touched before legal evidence validation");
  };
  return { $executeRaw: fail, $queryRaw: fail } as unknown as Prisma.TransactionClient;
}

function record(legalAcceptance: MemberSignupAcceptanceEvidence) {
  return recordMemberSignupLegalEvidence(transactionThatMustNotBeUsed(), {
    accountId: "account-test",
    personId: "person-test",
    email: "person@example.test",
    sessionId: "session-test",
    legalAcceptance,
  });
}

describe("member signup legal evidence validation", () => {
  it("requires exactly one Website Terms agreement and one Privacy Policy notice", async () => {
    const terms = document("website_terms");
    await expect(record({ documents: [terms] })).rejects.toThrow(
      /exactly the Website Terms and Privacy Policy/i,
    );
    await expect(record({ documents: [terms, terms] })).rejects.toThrow(
      /exactly the Website Terms and Privacy Policy/i,
    );
  });

  it("rejects a document kind that does not match the governed document key", async () => {
    const invalid = evidence();
    const terms = { ...invalid.documents[0], kind: "notice" as const };
    await expect(record({ documents: [terms, invalid.documents[1]] })).rejects.toThrow(
      /Website Terms.*agreement/i,
    );
  });

  it("rejects a version other than the current governed registry version", async () => {
    const invalid = evidence();
    const privacy = { ...invalid.documents[1], documentVersion: "stale-version" };
    await expect(record({ documents: [invalid.documents[0], privacy] })).rejects.toThrow(
      /version.*does not match/i,
    );
  });

  it("recomputes each SHA-256 digest instead of trusting supplied evidence", async () => {
    const invalid = evidence();
    const terms = { ...invalid.documents[0], documentSha256: "0".repeat(64) };
    await expect(record({ documents: [terms, invalid.documents[1]] })).rejects.toThrow(
      /SHA-256.*does not match/i,
    );
  });
});
