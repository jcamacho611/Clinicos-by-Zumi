-- Neutralize only the exact legacy synthetic Grid fixtures that used person-specific
-- contractor/applicant labels. Primary keys stay unchanged so existing relationships,
-- audit history, requests, and payout records remain intact. Fresh seeds use neutral IDs.

UPDATE "users"
SET
  "name" = 'Independent Grid Provider',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'user-tiffany-grid';

UPDATE "users" AS target
SET
  "email" = 'grid.provider@example.test',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE target."id" = 'user-tiffany-grid'
  AND target."email" <> 'grid.provider@example.test'
  AND NOT EXISTS (
    SELECT 1
    FROM "users" AS existing
    WHERE existing."email" = 'grid.provider@example.test'
      AND existing."id" <> target."id"
  );

UPDATE "providers"
SET
  "name" = 'Independent Grid Provider',
  "displayName" = 'Independent Grid Provider',
  "legalName" = 'Independent Grid Provider · synthetic',
  "contactEmail" = 'grid.provider@example.test',
  "malpracticePolicyNumber" = 'SYNTH-PROVIDER-RN-001',
  "malpracticeEvidenceReference" = 'SYNTHETIC-POLICY-PROVIDER-001',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'provider-tiffany-grid';

UPDATE "providers"
SET
  "name" = 'Grid Provider Applicant',
  "displayName" = 'Grid Provider Applicant',
  "legalName" = 'Grid Provider Applicant · synthetic',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'provider-alex-grid';

UPDATE "provider_credentials"
SET
  "number" = 'SYNTH-NY-RN-PROVIDER',
  "evidenceReference" = 'SYNTHETIC-LICENSE-PROVIDER-001',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'credential-tiffany-grid-license';

UPDATE "grid_requests"
SET
  "syntheticClientReference" = 'GRID-PROVIDER-001',
  "notes" = 'Synthetic contractor booking request for the selected provider to accept, counter, or decline before clinic review.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'grid-request-tiffany-on-call';

UPDATE "grid_request_events"
SET "note" = 'Synthetic contractor request created for a documented provider workflow demonstration.'
WHERE "id" = 'grid-event-tiffany-requested';

UPDATE "tasks"
SET
  "title" = 'Provider response requested',
  "details" = 'Grid request grid-request-tiffany-on-call is waiting for the independent contractor to accept, counter, or decline.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'task-grid-tiffany-request';
