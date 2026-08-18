-- Inbound SMS resolves a signed provider source number to a patient only after the
-- destination has resolved to one organization. Preserve duplicate contact numbers as
-- valid data (no UNIQUE constraint); the application fails closed when >1 patient
-- matches. Index the exact normalization expression used by inbound-sms-service so
-- legacy formatted numbers do not require an unindexed tenant scan.
CREATE INDEX IF NOT EXISTS "patients_org_sms_phone_normalized_idx"
ON "patients" (
  "organizationId",
  (
    CASE
      WHEN LEFT(TRIM("phone"), 1) = '+' THEN
        '+' || regexp_replace(SUBSTRING(TRIM("phone") FROM 2), '[^0-9]', '', 'g')
      WHEN regexp_replace(TRIM("phone"), '[^0-9]', '', 'g') ~ '^[0-9]{10}$' THEN
        '+1' || regexp_replace(TRIM("phone"), '[^0-9]', '', 'g')
      ELSE NULL
    END
  )
)
WHERE "phone" IS NOT NULL;
