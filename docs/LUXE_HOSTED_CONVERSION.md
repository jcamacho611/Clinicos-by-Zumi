# Luxe hosted conversion path

Status: **LEAD CAPTURE MERGED / RENDER DEPLOYMENT UNPROVEN / BOOKING-INTENT ADAPTER IN PROGRESS**

The lowest-cost path around the current GoDaddy Websites + Marketing write limitation is to let Klinikos host the short Luxe service inquiry while Luxe keeps owning the marketing pages.

Lead-capture implementation merged to `main` in:

`1d095a6280ca10918e03f1f1e1ee27ac7765b2e3`

A repository merge is not deployment evidence. Render is the production host, but no Render deployment-control connector is available in this environment. Do not mark the path LIVE until the deployed route and one controlled inquiry are verified.

## Runtime path

`GET /luxe/consult`

The page:

- reads the active Luxe service catalog server-side;
- asks only for name, phone/email, service interest, contact preference, timing, and a general question;
- does not accept attachments or medical-record intake;
- preserves bounded first-touch and current-touch acquisition context;
- posts to the existing `POST /api/public/luxe-medi/leads` acquisition engine;
- never confirms an appointment, payment, or treatment eligibility;
- enters the existing Luxe tenant CRM/follow-up workflow.

No separate Luxe CRM is created.

## GoDaddy CTA contract

A normal Luxe service page can point its single primary CTA directly to the hosted conversion page.

Generic:

```text
https://klinikos.io/luxe/consult?source=luxe_website&cta=Book%20consultation
```

Service-specific example:

```text
https://klinikos.io/luxe/consult?service=Botox&source=luxe_website&originating_page=https%3A%2F%2Fluxe-medi.com%2Fbotox&cta=Book%20consultation
```

Campaign example:

```text
https://klinikos.io/luxe/consult?service=Botox&utm_source=instagram&utm_medium=social&utm_campaign=summer_glow&originating_page=https%3A%2F%2Fluxe-medi.com%2Fbotox&cta=Check%20availability
```

Use the current canonical service name from the active Klinikos Luxe catalog when pre-selecting `service`.

## Attribution rules

First touch is stored separately from later touch for bounded commercial attribution fields including source, campaign, landing path, and referrer path. Later visits may add new UTM/current-touch values without overwriting the canonical first-touch acquisition campaign on a new lead.

Attribution URL context is reduced to origin + pathname before CRM capture so unrelated query-string data does not silently enter analytics metadata.

Do not place names, emails, phone numbers, diagnoses, medication data, IDs, insurance information, or clinical details into UTM/query parameters.

## Public response boundary

Accepted public submissions receive the same external response whether a new lead was created or an existing open lead was deduplicated:

```http
202 Accepted
```

```json
{"received":true}
```

The endpoint does not disclose:

- lead IDs;
- dedupe state;
- internal workflow state;
- service-match internals;
- estimated opportunity;
- task IDs;
- validation internals.

## Security truth

Browser Origin/CORS allowlisting is a browser-source boundary, not authentication. Non-browser callers can forge `Origin`.

The public intake therefore remains deliberately bounded and relies on:

- strict payload limits;
- a honeypot;
- rate limiting;
- fixed server-owned Luxe tenant resolution;
- no browser-controlled money/booking/clinical state;
- optional server-to-server secret for trusted integrations.

Before material paid-traffic scale, add a distributed rate limiter and/or an approved bot challenge at the edge. Do not claim the current process-local limiter is enterprise anti-abuse protection.

# Booking-intent continuation

The next slice adds a server-owned continuation from an accepted Luxe inquiry into the existing external booking rail.

Required environment configuration:

- `LUXE_MEDI_BOOKING_URL` — approved HTTPS booking destination.
- `LUXE_MEDI_JOURNEY_SECRET` — separate secret of at least 32 characters used to encrypt the short-lived acquisition journey cookie. Do not reuse or expose it client-side.
- `LUXE_MEDI_BOOKING_REVIEW_MINUTES` — optional human verification window, default 30 minutes, clamped to 10–1440 minutes.

When both booking configuration and journey sealing are available, the success state may offer **Continue to booking**.

Flow:

```text
accepted Luxe inquiry
→ opaque HttpOnly journey cookie
→ customer chooses Continue to booking
→ POST /api/public/luxe-medi/booking/start
→ server decrypts journey reference
→ booking_started LeadEvent
→ Lead.bookingStatus = started
→ lead_booking human verification task
→ server-controlled 303 redirect to configured external booking rail
```

The encrypted browser token does not expose the internal lead ID in page source, client JavaScript, or URL parameters.

## Booking truth

`booking_started` means only:

> the customer opened the configured external booking flow from a valid acquisition journey.

It does **not** mean:

- an appointment exists;
- a provider accepted anything;
- a deposit was paid;
- treatment is appropriate;
- service was completed.

The external booking/provider evidence remains authoritative.

A booking-start task is due after the configured review window. If authoritative completion cannot be verified, the lead becomes human verification/recovery work. The task wording explicitly requires evidence before staff mark the lead booked or paid.

Analytics may show:

- booking started;
- booking verification due;
- booking in progress;
- verify booking.

Those states remain separate from booked estimated value and evidence-backed collected revenue.

## Revenue-first failure behavior

If attribution recording fails while the approved booking URL is available, Klinikos should not prevent the customer from reaching the booking rail. Analytics failure is not allowed to destroy a legitimate revenue opportunity.

If the booking URL itself is not configured, the hosted page does not advertise a booking continuation and staff follow-up remains the truthful fallback.

# Live acceptance test

Do not call this live from repository code alone.

After the exact merged SHA is deployed:

1. open `/luxe/consult` on approximately 390px mobile and desktop;
2. verify active service options render from the Luxe tenant;
3. submit one controlled non-PHI QA inquiry;
4. verify it lands only in the Luxe organization;
5. verify service intent survives;
6. verify first/current attribution survives;
7. verify estimated opportunity comes from the server-side service catalog;
8. verify an unassigned follow-up task exists;
9. claim the lead from Luxe acquisition operations;
10. submit the same identity again and verify open-lead dedupe without public dedupe disclosure;
11. if booking config is enabled, choose Continue to booking;
12. verify `booking_started` exists but booking/payment remain unverified;
13. verify a `lead_booking` human review task exists and cannot be pushed later by another booking-start event;
14. verify the server redirects only to the configured HTTPS destination;
15. mark the QA lead intentionally lost/test rather than deleting audit history;
16. only then switch one real Luxe primary CTA to the hosted URL;
17. browser-test the live Luxe → Klinikos handoff on mobile.

# Next conversion slice

After live capture and booking-start are proven, connect authoritative booking/deposit completion evidence back to the originating lead and auto-close the booking verification task only from real evidence. A redirect or booking email remains insufficient proof of payment.
