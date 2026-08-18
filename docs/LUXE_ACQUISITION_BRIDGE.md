# Luxe Medi → Klinikos Acquisition Bridge

Status: **ADAPTER READY / EXTERNAL WEBSITE WIRING PENDING**

This document records the production-oriented bridge between the public Luxe Medi acquisition surface and the existing Klinikos CRM/Luxe Medi workspace. It does not create a second CRM and it does not claim the current GoDaddy Website Builder forms are already connected.

## Business path

```text
luxe-medi.com
→ public inquiry / GoDaddy Conversations event
→ Klinikos Luxe acquisition ingress
→ fixed Luxe tenant
→ validation / normalization
→ open-lead deduplication
→ canonical Luxe service resolution
→ Lead + LeadEvent
→ unassigned human follow-up Task
→ existing CRM / Luxe workspace
```

This slice intentionally stops before verified booking, verified payment, patient conversion, or clinical eligibility.

## Direct public endpoint

`POST /api/public/luxe-medi/leads`

Browser requests are accepted only from exact configured Luxe origins. Trusted server-to-server callers may use the configured token. CORS/origin checks are a browser boundary, not proof that an arbitrary non-browser caller is trustworthy. Never embed the server token in public browser JavaScript.

Default browser origins:

- `https://luxe-medi.com`
- `https://www.luxe-medi.com`

### Environment

- `DATABASE_URL` — required existing application configuration.
- `LUXE_MEDI_ORGANIZATION_SLUG` — optional; defaults to `luxe-medi`. The browser never supplies the tenant.
- `LUXE_MEDI_LEAD_SLA_MINUTES` — optional; defaults to 15 and is clamped to 5–1440 minutes.
- `LUXE_MEDI_ALLOWED_ORIGINS` — optional comma-separated exact origins for approved previews/staging.
- `LUXE_MEDI_INGEST_TOKEN` — optional server-to-server credential. Never expose it in browser code.

## Public payload

```json
{
  "name": "Maria Example",
  "email": "maria@example.com",
  "phone": "+15165550199",
  "serviceInterest": "Luxe Rejuvenation Infusion (Botox)",
  "appointmentInterest": "Consultation this week",
  "preferredContactMethod": "sms",
  "preferredTiming": "Afternoon",
  "message": "I would like pricing and availability.",
  "contactConsent": true,
  "marketingConsent": false,
  "attribution": {
    "firstTouchSource": "instagram",
    "lastTouchSource": "google",
    "landingPage": "https://luxe-medi.com/botox",
    "referrer": "https://www.google.com/",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "summer-botox",
    "utmTerm": "botox brooklyn",
    "utmContent": "hero-book-consult",
    "campaignId": "campaign-optional",
    "originatingPage": "https://luxe-medi.com/botox",
    "cta": "Book consultation",
    "bookingSource": "website"
  },
  "website": ""
}
```

`website` is a honeypot and must remain empty. At least one of email or phone is required.

## What public intake cannot set

The public payload cannot choose:

- organization/tenant ID
- estimated opportunity value
- payment status
- booking status
- patient identity
- provider assignment
- clinical eligibility
- treatment approval

Estimated opportunity is derived only from the active server-side Luxe service catalog. Customer-facing labels are normalized to the current canonical service names before lookup. If a service cannot be resolved, estimated opportunity remains zero rather than inventing money.

Current normalization covers known public labels for Botox, Juvederm/fillers, body contouring, weight-loss services, pre/post-operative care, lymphatic drainage, IV hydration, teeth whitening, and tooth gems. Unknown future labels pass through unchanged and therefore do not receive an invented catalog value.

## Attribution

The canonical open lead preserves its existing first-touch `source` and `campaignSource` when a returning inquiry deduplicates into it.

Each new website touch is appended as bounded `LeadEvent` metadata so later analytics can distinguish original acquisition from later conversion touches without erasing history.

Do not place diagnoses, medical histories, medications, IDs, insurance cards, clinical photographs, or other unnecessary health information into attribution metadata.

## Deduplication

Current MVP behavior:

- normalized exact email OR normalized phone
- same organization only
- open leads only
- `lost` and `completed` are treated as terminal
- ambiguous identity is never auto-merged into a Patient record

A returning inquiry may fill missing contact/service context and append a touch event. First-touch attribution is not overwritten.

## Follow-up routing

A captured inquiry creates at most one open `luxe_lead_follow_up` task for that lead.

The task is deliberately **unassigned** until explicit Luxe lead-routing policy exists. The system does not guess the responsible staff member by query order or role name.

Task copy explicitly states that capture does not confirm:

- appointment
- payment
- treatment eligibility

The owner/front-desk experience must surface unassigned acquisition work so it can be claimed intentionally.

## Consent truth

`contactConsent` and `marketingConsent` are stored as acquisition-event evidence. The canonical `Lead.consentStatus` remains `not_recorded` in this slice because an arbitrary public checkbox must not silently become governed communication authorization.

Channel-specific consent, STOP/START suppression, and message-delivery truth remain governed by the communications subsystem.

## Abuse controls

Current direct-ingress controls:

- exact browser origin allowlist
- bounded 16 KB body
- strict Zod payload
- honeypot
- process-local rate brake
- optional constant-time server token comparison
- server-controlled tenant
- no browser-controlled money/payment state

The process-local limiter is a basic abuse brake, not a distributed anti-bot service. Before material paid traffic, add a durable/distributed limiter and/or approved bot challenge appropriate to the production architecture.

## Browser integration

A public browser integration may post to:

`https://www.klinikos.io/api/public/luxe-medi/leads`

It must not contain a server secret. First-touch UTM/source values should be persisted in an appropriate first-party mechanism instead of recomputed on every page.

## Preferred server-to-server integration

If the Luxe hosting platform exposes a secure backend/webhook mechanism, prefer server-to-server ingestion using:

`X-Klinikos-Luxe-Token: <secret>`

Never store that token in GoDaddy client-side custom HTML, tag managers, page source, analytics, or other public JavaScript.

# GoDaddy Conversations adapter

A second adapter is available for GoDaddy Conversations notification envelopes:

`POST /api/integrations/luxe-medi/godaddy-conversations`

This route is server-to-server only and requires:

`X-Klinikos-GoDaddy-Token: <secret>`

configured with:

`LUXE_GODADDY_CONVERSATIONS_TOKEN`

The adapter parses recognized Luxe notification formats into one of:

- `inquiry`
- `booking_observed`
- `cancellation_observed`
- `unknown`

Recognized customer-facing service labels are normalized to the same canonical Klinikos service catalog used by direct web intake.

### Booking/payment truth

A GoDaddy email or notification can prove that a booking-related message was observed. It does **not** prove that Klinikos independently verified the appointment or payment state.

Therefore the adapter never promotes notification text into:

- verified booking
- verified payment
- completed service
- clinical eligibility

Those states require their authoritative evidence source.

### Cancellation truth

Cancellation notifications are classified but remain `manual_review` unless stable identity/order linkage is sufficient for a deterministic state transition. The adapter does not guess which lead/patient to cancel.

### Replay evidence

Recognized GoDaddy notifications persist an `IntegrationEvent` keyed by the source message identity, resource type, and event type. Sequential retries are therefore detected as duplicates instead of generating another normal acquisition action.

The current schema does not enforce a database uniqueness constraint across that provider event tuple, so this is durable replay evidence rather than a claim of mathematically strict concurrent exactly-once processing. If concurrent webhook delivery becomes material, add an atomic uniqueness boundary in a migration.

The raw notification body is not copied into `IntegrationEvent` metadata.

# Current external wiring gap

The GoDaddy connector available to the agent exposes domain discovery/availability, not Websites + Marketing page/form mutation. The repository can therefore truthfully reach **ADAPTER READY**, but the live `luxe-medi.com` form/CTA is not considered connected until a published website path is changed and browser-verified.

Practical routes:

1. edit the existing GoDaddy form/custom-code layer to post to the public endpoint;
2. route GoDaddy form notification email to a secure inbound processor that calls the GoDaddy adapter;
3. use an available secure GoDaddy backend/webhook mechanism if supported;
4. replace the primary CTA with a Klinikos-hosted Luxe-branded acquisition form.

Do not mark the bridge LIVE from repository code alone.

# Live-site conversion issues discovered

Current site work still required:

- duplicated contact sections/forms create competing conversion paths;
- generic marketing contact forms expose attachment upload and should not invite unnecessary sensitive documents;
- booking/account flow and CRM attribution are separate;
- the published $150 booking deposit is separate from Klinikos payment evidence;
- stale/location-inconsistent copy exists on at least one service surface;
- public phone presentation is inconsistent;
- repeated headings/prompts reduce conversion clarity;
- each service page needs one clear primary CTA carrying service context into acquisition;
- SEO audit notifications show canonical, orphan-page, performance, and ranking/traffic issues that should be corrected before scaling spend.

# Production data boundary

The current connected Neon production project has a material hardening review open in GitHub issue #162 before expanding this acquisition rail into broader patient/clinical history or historic backfill.

Until that review is closed with real evidence, keep the public acquisition surface marketing-oriented and do not use generic public intake for clinical documents/PHI.

# Next implementation slices

Revenue order:

1. wire one live high-intent Luxe form/CTA;
2. submit a controlled non-PHI test inquiry and verify correct Luxe tenant, service, attribution, task, and dedupe behavior;
3. surface unassigned/speed-to-lead and first/latest touch in the existing Luxe/CRM workspace;
4. instrument booking start/abandonment without claiming completion;
5. connect authoritative deposit/payment evidence to the originating lead;
6. link qualified/booked leads to patient/client identity without erasing acquisition history;
7. build cancellation/no-show recovery, rebooking, and reactivation cohorts;
8. report source → lead → booking → verified collected revenue;
9. generalize organization configuration so another Klinikos clinic can connect its website without Luxe-specific code.

# Acceptance rule

An HTTP 201 is not success.

The bridge is successful when a real Luxe inquiry can be traced truthfully through:

```text
traffic source
→ service intent
→ lead
→ claimed human action
→ contact
→ booking evidence
→ verified payment
→ service outcome
→ follow-up / rebooking
→ verified revenue attribution
```

No invisible leakage. No fake delivery. No fake booking. No fake payment. No fake revenue.
