ALTER TABLE "referrals"
ADD CONSTRAINT "referrals_patient_outreach_status_check"
CHECK ("patientOutreachStatus" IN ('not_started', 'attempted', 'notified', 'declined')),
ADD CONSTRAINT "referrals_delivery_attempts_check"
CHECK ("deliveryAttempts" >= 0);
