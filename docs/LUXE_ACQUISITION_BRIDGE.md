# Luxe Medi → Klinikos Acquisition Bridge

Status: **ADAPTER READY / EXTERNAL WEBSITE WIRING PENDING**

This document records the first production-oriented bridge between the public Luxe Medi acquisition surface and the existing Klinikos CRM/Luxe Medi workspace. It does not create a second CRM and it does not claim that the current GoDaddy Website Builder forms are already connected.

## Business path

```text
luxe-medi.com
→ public inquiry
→ Klinikos public Luxe ingress
→ fixed Luxe tenant
→ validation / normalization
→ open-lead deduplication
→ current Luxe service lookup
→ Lead + LeadEvent
→ human follow-up Task
→ existing CRM / Luxe workspace
```

The first slice intentionally stops before booking, payment verification, patient conversion, or clinical eligibility.

## Endpoint

`POST /api/public/luxe-medi/leads`

The route accepts browser requests only from the exact configured Luxe origins, or a trusted server-to-server request bearing the configured ingestion token. CORS/origin checks are a browser boundary, not proof that an arbitrary non-browser caller is trustworthy. The server token must never be embedded in public browser JavaScript.

Default browser origins:

- `https://luxe-medi.com`
- `https://www.luxe-medi.com`

## Environment

Optional:

- `LUXE_MEDI_ORGANIZATION_SLUG` — defaults to `luxe-medi`. The browser never supplies the tenant.
- `LUXE_MEDI_LEAD_SLA_MINUTES` — defaults to 15 and is clamped to 5–1440 minutes.
- `LUXE_MEDI_ALLOWED_ORIGINS` — comma-separated additional exact origins for approved previews/staging.
- `LUXE_MEDI_INGEST_TOKEN` — server-to-server credential. Do not expose this in browser code.

Existing `DATABASE_URL` remains required.

## Public payload

```json
{
  "name": "Maria Example",
  "email": "maria@example.com",
  "phone": "+15165550199",
  "serviceInterest": "Botox",
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
    "bookingSource": "website",
    "referralSource": null,
    "socialSource": null,
    "qrSource": null
  },
  "website": ""
}
```

`website` is a honeypot and must remain empty.

At least one of email or phone is required.

## What the browser cannot set

The public payload cannot choose:

- organization/tenant ID
- estimated opportunity value
- payment status
- booking status
- patient identity
- provider assignment
- clinical eligibility
- treatment approval

Estimated opportunity is derived only from an active server-side `LuxeService` exact-name match. If no active service matches, the estimate remains zero rather than inventing money.

## Attribution policy

The canonical lead preserves its existing first-touch `source` / `campaignSource` when a returning inquiry deduplicates into an open lead.

Every new website touch is appended as a `LeadEvent` with bounded attribution metadata. This lets later analytics distinguish the original acquisition source from later conversion touches without overwriting history.

Do not put diagnoses, medical histories, medications, ID images, insurance cards, clinical photographs, or other unnecessary health information into attribution metadata.

## Deduplication

Current MVP behavior:

- exact normalized email match OR normalized phone match
- same organization only
- open leads only (`lost` and `completed` are treated as terminal)
- ambiguous identity is not merged into a Patient record

A returning inquiry updates missing contact/service context and creates a new touch event. It does not erase first-touch attribution.

## Human follow-up

A captured lead attempts to create one open `luxe_lead_follow_up` task using the existing task table and an active Luxe user.

Task copy explicitly states that capture does **not** confirm:

- appointment
- payment
- treatment eligibility

If the organization has no active user to own a task, lead capture still succeeds and `followUpCreated` is false. That state must be surfaced operationally rather than silently treated as handled.

## Consent truth

`contactConsent` and `marketingConsent` are stored as lead-event metadata for operational evidence. The canonical `Lead.consentStatus` remains `not_recorded` in this first slice because a checkbox in an unverified public adapter is not automatically promoted into a governed communication authorization.

Formal channel-specific consent/STOP logic remains governed by the communications subsystem.

## Abuse controls

Current first slice:

- exact CORS allowlist
- bounded 16 KB body
- strict Zod payload
- honeypot
- process-local rate brake
- optional constant-time server token comparison
- no browser-supplied tenant
- no browser-supplied money/payment state

The process-local limiter is a **basic abuse brake, not a distributed anti-bot service**. Before significant paid traffic, use a durable/distributed limiter and/or approved bot challenge if the production architecture supports it.

## Browser integration example

This example is safe for public browser code because it contains **no server token**. It relies only on the exact Luxe browser origin and the public validation/abuse boundary.

```js
const params = new URLSearchParams(window.location.search);

await fetch("https://www.klinikos.io/api/public/luxe-medi/leads", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name,
    email,
    phone,
    serviceInterest,
    appointmentInterest,
    preferredContactMethod,
    preferredTiming,
    message,
    contactConsent,
    marketingConsent,
    attribution: {
      firstTouchSource,
      lastTouchSource,
      landingPage: firstLandingPage,
      referrer: document.referrer || null,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      utmTerm: params.get("utm_term"),
      utmContent: params.get("utm_content"),
      originatingPage: window.location.href,
      cta,
      bookingSource: "website"
    },
    website: ""
  })
});
```

A real implementation should persist first-touch values in a privacy-appropriate first-party mechanism instead of recomputing first touch on every page.

## Preferred server-to-server integration

If the Luxe hosting platform later exposes a secure backend/webhook mechanism, prefer server-to-server ingestion with:

`X-Klinikos-Luxe-Token: <secret>`

The token belongs only in secret server configuration. Do not store it in GoDaddy client-side custom HTML, analytics, tag managers, page source, or public JavaScript.

## Current external wiring gap

The available GoDaddy connector in the current execution environment exposes domain discovery/availability, not Website Builder page/form mutation. Therefore this repository can truthfully reach **ADAPTER READY**, but the live `luxe-medi.com` form/CTA cannot be claimed connected until one of these is completed and verified:

1. edit the existing GoDaddy form/custom-code layer to post to this endpoint;
2. configure a supported GoDaddy server/webhook integration if available;
3. replace the relevant CTA with a Klinikos-hosted acquisition form while preserving Luxe branding and attribution.

Do not mark this bridge LIVE from repository code alone.

## Live-site conversion issues discovered during the audit

These should be resolved in the website layer when edit access is available:

- duplicated contact forms/sections create competing conversion paths;
- the generic public contact form currently allows attachment upload, which is inappropriate as a default marketing intake surface for unnecessary sensitive material;
- booking/account flow and lead capture are separate;
- the published $150 booking deposit is a separate step from Klinikos attribution/payment evidence;
- stale/location-inconsistent copy exists on at least one service surface;
- repeated headings/copy and duplicated prompts reduce conversion clarity;
- each service page needs one clear primary CTA with service context carried into the acquisition payload.

## Next implementation slices

In revenue order:

1. wire one live Luxe high-intent form/CTA to the endpoint;
2. verify a real inquiry lands in the correct Luxe tenant with service/source attribution;
3. show first/latest touch and response SLA in the existing Luxe/CRM workspace;
4. instrument booking start/abandonment without claiming a booking occurred;
5. connect verified deposit/payment evidence to the originating lead;
6. link qualified/booked leads to patient/client identity without erasing acquisition history;
7. build no-show, rebooking, and reactivation cohorts;
8. report source → lead → booking → verified collected revenue;
9. generalize organization configuration so another Klinikos clinic can connect its own website without Luxe-specific code.

## Acceptance rule

This bridge is not successful because an endpoint returns 201.

It is successful when a real Luxe inquiry can be traced truthfully through:

```text
traffic source
→ service intent
→ lead
→ assigned human action
→ contact
→ booking
→ verified payment
→ service outcome
→ follow-up/rebooking
→ verified revenue attribution
```

No invisible leakage. No fake delivery. No fake booking. No fake payment. No fake revenue.
