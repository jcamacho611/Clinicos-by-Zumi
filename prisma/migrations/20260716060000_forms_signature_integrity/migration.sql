-- Form attestations must remain cryptographically shaped and provider signatures must identify a provider.
ALTER TABLE "signatures"
  ADD CONSTRAINT "signatures_form_attestation_check" CHECK (
    "entityType" <> 'form_submission'
    OR (
      "signerType" IN ('submitter', 'witness', 'provider')
      AND length(coalesce("attestation", '')) >= 20
      AND "signatureHash" ~ '^[a-f0-9]{64}$'
    )
  ),
  ADD CONSTRAINT "signatures_provider_identity_check" CHECK (
    "signerType" <> 'provider' OR "providerId" IS NOT NULL
  );
