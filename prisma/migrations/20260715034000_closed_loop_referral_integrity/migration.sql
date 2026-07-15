ALTER TABLE "referral_events"
ADD CONSTRAINT "referral_events_referralId_fkey"
FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referrals"
ADD CONSTRAINT "referrals_destination_type_check"
CHECK ("destinationType" IN ('connected', 'external')),
ADD CONSTRAINT "referrals_delivery_method_check"
CHECK ("deliveryMethod" IN ('connected_network', 'manual', 'fax', 'direct_secure_message')),
ADD CONSTRAINT "referrals_delivery_status_check"
CHECK ("deliveryStatus" IN ('not_started', 'pending_manual', 'delivered', 'failed')),
ADD CONSTRAINT "referrals_priority_check"
CHECK ("priority" IN ('routine', 'urgent', 'stat')),
ADD CONSTRAINT "referrals_authorization_status_check"
CHECK ("authorizationStatus" IN ('not_required', 'pending', 'approved', 'denied')),
ADD CONSTRAINT "referrals_status_check"
CHECK ("status" IN ('draft', 'ready_to_send', 'sent', 'received', 'accepted', 'declined', 'scheduled', 'completed', 'consultation_received', 'closed', 'cancelled')),
ADD CONSTRAINT "referrals_connected_destination_check"
CHECK ("destinationType" <> 'connected' OR "destinationOrganizationId" IS NOT NULL),
ADD CONSTRAINT "referrals_external_destination_check"
CHECK ("destinationType" <> 'external' OR "destination" IS NOT NULL);
