# Klinikos Action-First Living Universe — Wave 1 Design

**Date:** 2026-09-01
**Status:** Founder approved for implementation
**Authority:** Subordinate to `docs/KLINIKOS_MASTER_CANON.md` and current verified runtime truth
**Extends:** `docs/superpowers/specs/2026-08-31-klinikos-living-universe-entry-grid-design.md`

## Goal

Turn the public root from a clinic/product-heavy gateway into the first production projection of the Action-First Living Universe without changing server-side Zumi authority, private-data boundaries, clinic authentication, Grid authority, EDU authority, or the merged Person-account foundation.

## Permanent frontend question

> **What do you need today?**

A visitor should be able to begin in everyday language without knowing Klinikos module names.

## Wave 1 user-visible intents

The root must expose quick ordinary-language starting points that feed the existing public Zumi request path:

- I need care
- I need work
- I need someone
- I have work available
- I have my own client
- I need a room
- I have space available
- I want to learn
- I need a placement
- Help me run my practice
- I need to get paid
- I want to grow my healthcare business
- I am not sure — ask Zumi

These are prompts, not new client-side routing authority. Clicking one must call the existing `sendPrompt` path, which posts to `/api/zumi/public`.

## Public navigation

The public header stops leading with product/module names. Primary public navigation becomes:

- How Klinikos helps
- Join free
- Sign in

The composer remains the dominant way to search/ask.

`Join free` in Wave 1 routes to the existing real Grid participant entry `/grid/join`; Wave 2 will converge this onto the merged person-first Account/session substrate instead of inventing a new signup system.

## Page composition

The public root should be one dominant living gateway plus a minimal trust/legal footer. Remove `ProductEvidenceSection` and `EcosystemHierarchy` from `/` so the landing experience no longer falls back into stacked brochure sections.

Those routes/components may remain elsewhere; Wave 1 does not delete them.

## Visual direction

Primary surface becomes warm ivory / white rather than near-black full-screen. Use black/obsidian typography, restrained rose/oxblood accents, generous whitespace, and a spatial/action-first composition. Existing brand assets remain untouched.

## Copy

Hero:

> **What do you need today?**

Supporting line:

> **Tell Klinikos what you need. Zumi will help you find the next useful step.**

Public disclosure remains explicit that public Zumi cannot open private clinic records or make changes and users should not enter patient information.

## Existing authority that must remain unchanged

- `/api/zumi/public`
- `resolvePublicZumiTurn`
- deterministic fallback `resolvePublicLivingIntent`
- safe protected continuation behavior
- current patient portal routing
- current clinic authentication/authority
- merged Person-owned Account/session foundation
- confidentiality/browser-boundary rules

## Accessibility

- quick intents are real buttons;
- at least 44px target height;
- keyboard accessible;
- visible focus;
- live response status remains;
- reduced motion behavior remains;
- mobile navigation remains equivalent;
- public disclosure remains associated with the composer.

## Non-goals

Wave 1 does not:

- create a new backend;
- use Supabase as a second identity/data authority;
- create a Lovable/Replit production fork;
- rewrite Grid;
- rewrite Current Visit;
- add regulated product commerce;
- add patient public profiles;
- create new payment logic;
- create a separate Zumi;
- claim PHI production readiness;
- fabricate live supply, availability, ratings, or customers.

## Acceptance

Wave 1 is acceptable only when tests prove:

1. root copy leads with `What do you need today?`;
2. quick everyday intents exist and call `sendPrompt`;
3. the root no longer renders the stacked `ProductEvidenceSection` / `EcosystemHierarchy` brochure sections;
4. the public Zumi server boundary and privacy disclosure remain;
5. public navigation no longer requires understanding `Grid`, `EDU`, `Pricing`, or `Trust` as top-level product choices;
6. `Join free` points to an existing safe participant entry rather than a fabricated route;
7. mobile/keyboard/accessibility contracts are preserved;
8. current tests, type-check, lint, security/confidentiality gates, and build remain green before merge.
