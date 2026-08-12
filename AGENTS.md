# Klinikos Agent Operating Instructions

Before modifying this repository, read **`docs/SOURCE_OF_TRUTH.md`** in full.

That file is the authoritative product, architecture, engineering-process, and delivery doctrine for Klinikos by Zumi.

## Mandatory rules

1. Do not infer current product direction from old prompts, stale branches, route names, or historical status docs when they conflict with `docs/SOURCE_OF_TRUTH.md`.
2. Do not begin broad implementation with another general audit. Use the canonical source of truth, inspect only the specific implementation area required, and build the approved vertical milestone.
3. Prefer vertical end-to-end completion over horizontal feature breadth.
4. Never report a feature complete because a route, component, schema model, or adapter exists.
5. Never present fake success states. `executed`, `sent`, `paid`, `connected`, `verified`, `provisioned`, and similar states must reflect real underlying events.
6. Preserve tenant isolation, authorization, auditability, idempotency, and healthcare safety boundaries.
7. Never run concurrent Prisma schema/migration edits from multiple agents.
8. Keep schema changes sequential and migration-safe against representative existing data.
9. Use the best-fit programming language per subsystem. Do not rewrite stable code merely to change language.
10. Run automated tests plus browser/visual verification for customer-facing milestones.
11. Review current PR threads and CI before merging. A previous green run does not validate later commits.
12. If a material product/architecture decision changes, update `docs/SOURCE_OF_TRUTH.md` in the same workstream.

## Current sequencing

The active milestone is PR #11, the first sale-ready vertical slice. Do not start the next milestone until PR #11 is cleanly merged.

The next planned milestone is:

**Zero-Data Clinic → First Operating Patient**

See `docs/SOURCE_OF_TRUTH.md` for the full definition and acceptance principles.
