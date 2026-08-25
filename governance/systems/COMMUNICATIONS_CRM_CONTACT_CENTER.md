# Communications, CRM & Contact Center Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P1/P2

## Purpose

Replace fragmented clinic communications, lead management, reminders, missed-call recovery and routine contact-center work with one governed communication layer that respects privacy, consent and message sensitivity.

## Personas

- prospective patient/customer
- front desk
- scheduler
- clinic owner/manager
- patient
- provider/staff
- sales/marketing
- support

## Channel abstraction

Supported/target rails:

- in-app secure messaging
- SMS
- email
- voice/phone
- fax

The product chooses an allowed rail based on message type, consent, sensitivity, urgency, cost and delivery capability.

## Message classes

- clinical
- operational
- transactional
- financial
- marketing
- support

Do not send sensitive clinical details through ordinary SMS/email merely because the user supplied a phone/email address.

## Frontend surfaces

- unified communications inbox
- patient/lead conversation timeline
- missed-call queue
- callback queue
- appointment reminders
- referral follow-up
- lead pipeline
- campaign/audience management where lawful
- call summary
- delivery status
- consent/preferences

## CRM lifecycle

`INQUIRY → CONTACTED → QUALIFIED → CONSULT/APPOINTMENT → BOOKED → SHOWED → TREATED/ACTIVATED → REBOOKED/RETAINED → REACTIVATED`

For B2B Klinikos sales, Digital Business CRM uses a parallel buyer lifecycle. Do not mix clinic-patient CRM with Klinikos corporate sales records.

## Backend services

- CommunicationService
- CommunicationPolicyEngine
- ChannelRouter
- DeliveryEvidenceService
- SuppressionService
- PreferenceService
- LeadService
- PatientLeadConversionService
- MissedCallRecoveryService
- ReminderService
- ContactCenterRoutingService
- CallSummaryService
- CampaignService
- FaxAdapterService

## Canonical data

CommunicationThread, Message, MessageClass, ChannelAttempt, DeliveryEvidence, CommunicationPreference, ConsentReference, SuppressionRecord, Lead, LeadStage, CallEvent, CallbackObligation, Campaign, AudienceRule.

## Commands

- send approved message
- choose/retry permitted channel
- create/update lead
- schedule callback
- mark deterministic lead stage from real event
- create reminder
- transfer/escalate call
- create campaign under policy
- suppress destination

## Events produced

MessageQueued, MessageSent, MessageDelivered, MessageFailed, CommunicationSuppressed, LeadCreated, LeadStageChanged, MissedCallDetected, CallbackRequired, AppointmentReminderSent, CallTransferred, CampaignStarted, CampaignCompleted.

## Events consumed

Appointment events, referral obligations, patient action requirements, payment reminders, Digital Business sales events, consent/preferences, bounce/suppression evidence.

## Zumi

May answer routine operational questions, qualify leads, schedule/request appointments, prepare responses, summarize calls, recover missed leads, perform permitted follow-up and route humans when uncertain or sensitive.

Autonomy: L0-L4 depending message class and explicit organization policy. Marketing and sensitive/clinical communication must honor specific consent/policy gates.

## Fax abstraction

Fax should be a transport fallback, not the user workflow.

`USER ACTION → COMMUNICATION/INTEGRATION POLICY → BEST AUTHORIZED RAIL → FAX ONLY WHEN NEEDED`

Inbound fax requires document classification, tenant/patient matching/reconciliation and safe review before becoming chart truth.

## Voice/contact center

Potential capabilities:

- inbound routing
- AI receptionist for approved operational tasks
- appointment request/scheduling
- common FAQ
- lead capture
- missed-call recovery
- human transfer
- call summary
- CRM update

Do not disclose PHI before identity/purpose is established.

## Security/privacy

- message classification
- consent/preference enforcement
- suppression/bounce handling
- destination validation
- no sensitive PHI in subject lines or ordinary SMS
- audit consequential communications
- recording/audio consent where required

## Customer value

Reduces separate texting/CRM/contact-center tools, missed leads, manual callbacks and fragmented communication history.

## Monetization

Growth/Scale plans, usage-based SMS/voice/fax, contact-center automation, CRM/growth products. Variable communication cost must be bounded/customer-funded.

## Tests

- consent/preferences
- message classification/channel policy
- bounce/suppression
- missed-call recovery
- lead stage truth
- appointment reminder event
- PHI-safe message templates
- fax reconciliation
- AI transfer/escalation

## Definition of done

A clinic can handle routine patient/lead communication from one governed timeline, with truthful delivery evidence, correct consent/channel policy and Zumi automation that never exposes sensitive information or fabricates contact outcomes.