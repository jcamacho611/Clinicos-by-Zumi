# Luxe hosted conversion path

Status: **CODE READY / DEPLOYMENT + LIVE CTA SWITCH NOT YET VERIFIED**

The lowest-cost path around the current GoDaddy Websites + Marketing write limitation is to let Klinikos host the actual short Luxe service inquiry while Luxe keeps owning the marketing pages.

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

First touch is stored separately from the later touch for bounded commercial attribution fields including source, campaign, landing path, and referrer path. Later visits may add new UTM/current-touch values without overwriting the canonical first-touch acquisition campaign on a new lead.

Do not place names, emails, phone numbers, diagnoses, medication data, IDs, insurance information, or clinical details into UTM/query parameters.

## Public response boundary

The public lead endpoint returns only:

```json
{"received":true}
```

for an accepted inquiry. It does not disclose:

- lead IDs;
- dedupe state;
- internal workflow status;
- service-match internals;
- estimated opportunity;
- task IDs;
- validation internals.

## Security truth

Browser Origin/CORS allowlisting is a useful browser-source boundary, not authentication. Non-browser callers can forge `Origin`.

The public intake therefore remains deliberately bounded and relies on:

- strict payload limits;
- a honeypot;
- rate limiting;
- fixed server-owned Luxe tenant resolution;
- no browser-controlled money/booking/clinical state;
- optional server-to-server secret for trusted integrations.

Before material paid-traffic scale, add a distributed rate limiter and/or an approved bot challenge at the edge. Do not claim the current process-local limiter is enterprise anti-abuse protection.

## Live acceptance test

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
10. submit the same identity again and verify open-lead dedupe;
11. mark the QA lead intentionally lost/test rather than deleting audit history;
12. only then switch one real Luxe primary CTA to the hosted URL;
13. browser-test that live Luxe → Klinikos handoff on mobile.

## Next conversion slice

Once the first real CTA is sending qualified demand into Klinikos, instrument booking-start / booking-abandonment evidence and connect authoritative booking/deposit evidence back to the originating lead. A redirect or booking email remains insufficient proof of payment.
