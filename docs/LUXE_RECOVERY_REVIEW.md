# Luxe recovery review

Status: **HUMAN REVIEW READY / AUTOMATIC OUTREACH DISALLOWED**

The Luxe acquisition engine should not let old opportunities disappear, but it also must not turn a stale CRM record into permission to message someone.

## Purpose

Surface lost or stale, non-booked opportunities that may deserve a human follow-up review.

```text
lost / stale non-booked lead
→ recovery review queue
→ human checks context + channel permission
→ optional internal reactivation task
→ human outreach only through governed communications
```

No recovery candidate is auto-messaged.

## Candidate rules

Default stale threshold:

`LUXE_MEDI_REACTIVATION_REVIEW_DAYS=7`

The value is configurable and clamped to 1–365 days.

Candidates include:

- lost leads that are not obviously invalid/test/spam/duplicate records;
- non-booked, non-completed leads whose CRM record has been stale for the configured period.

The queue excludes:

- completed leads;
- booked leads;
- explicit blocked/suppressed consent states;
- obvious spam/test/duplicate/invalid/wrong-number/fake lost reasons.

## Consent boundary

Every actionable row is labeled:

`Consent review required`

The queue does not infer that `not_recorded`, historical contact, or prior customer status means marketing permission.

Suppressed consent states are excluded from the actionable queue. Current recognized blocked states are:

- opted_out
- do_not_contact
- denied
- revoked
- suppressed

The communications subsystem remains authoritative for actual channel eligibility and delivery truth.

## Reactivation action

Authorized operational staff may choose **Review for reactivation**.

That action reuses the existing CRM `reactivate` transition and requires:

- a human-written reason;
- a future review/follow-up due time.

It creates internal work only.

The UI explicitly reports:

`Moved to reactivation review. No message was sent.`

The existing CRM transition can create a `lead_reactivation` task. It does not itself send an outbound message.

## Revenue truth

The recovery view reports only **estimated opportunity** for candidates and suppressed records.

It does not call recoverable opportunity collected revenue.

A recovery should count as collected revenue only after actual payment evidence is linked through the Luxe payment-evidence system.

## Productization

This is intentionally implemented from the existing CRM lead lifecycle rather than as a Luxe-only database.

The reusable pattern for Klinikos clinics is:

```text
stale/lost CRM opportunity
→ policy + consent suppression
→ human recovery review
→ owned task
→ governed communication
→ booking
→ payment evidence
→ attributable recovered revenue
```

Future work can add organization-specific inactivity windows and service-specific rebooking policies without changing the safety rule that outreach permission is never inferred from age or value alone.
