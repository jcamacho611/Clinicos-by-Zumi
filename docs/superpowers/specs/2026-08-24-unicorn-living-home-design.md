# Klinikos Unicorn Living Home Design

## Goal

Transform the authenticated `/dashboard` experience into the first production slice of the approved outcome-first Klinikos operating ecosystem without replacing existing domain authorities or creating new backend state.

## Scope

This tranche is intentionally presentation-first and additive. It uses the current `DashboardPage` data and the existing `LivingHome` behavior as authoritative runtime input.

The visible result must make the difference between Klinikos Marble and Obsidian obvious while preserving the same truth, permissions, routes, Path behavior, Zumi behavior, Grid signals, schedule data, and role boundaries.

## Product experience

The authenticated user should experience:

`IDENTITY + ORGANIZATION CONTEXT → OPERATING BRIEF → WHAT NEEDS TO HAPPEN → ZUMI/PATH → OBJECT/WORK SURFACE → EVIDENCE-BACKED EXISTING OPERATIONS`

The shell must feel like a living operating environment, not a generic dashboard.

## Current authority preserved

- `requireClinicSession()` remains identity and tenant authority.
- `getHomeOperatingRail()` remains role-aware destination authority.
- `listActivePathSnapshots()` and `resolvePathGuidanceList()` remain Path truth.
- `listAppointmentsForOrganization()` remains schedule truth.
- `detectClinicGridSignals()` remains Grid signal truth.
- `resolveEduGridReadiness()` remains EDU readiness truth.
- `zumiGatewayStatus()` remains provider availability truth.
- `LivingHome` remains the working composer, phase rail, Path creation, materialized workspace and operations surface.
- Appearance remains controlled by the existing System / Light / Dark atmosphere authority.

No new schema, migration, payment behavior, clinical behavior, Grid eligibility behavior, EDU completion behavior, authorization behavior or AI authority is introduced.

## Visual system

### Obsidian

Obsidian is a command/intelligence environment: layered graphite and black-red materials, restrained rose atmosphere, luminous but controlled brand accent, high contrast, deep spatial separation and an embedded Zumi presence.

### Marble

Marble is sustained operational work: warm stone/off-white base, ink typography, restrained rose/bronze accents, hairline structure, editorial spacing and almost no decorative glow.

Theme changes material only. It must not change information hierarchy, states, routes, permissions or functionality.

## New dashboard context band

The server-rendered dashboard will expose a compact real-context band using only current loaded data:

- organization name;
- active clinic role;
- active Path count;
- loaded schedule count;
- current Grid signal count when non-zero;
- truthful Zumi state (`Zumi connected` when provider availability is true, otherwise `Deterministic command mode`).

No fake urgency, revenue, unread counts, eligibility, verification or completion claims are permitted.

## Living Home presentation contract

The dashboard wraps the existing `LivingHome` in a new `unicorn-living-shell` presentation boundary. CSS may transform layout and material but must not hide required content or move actionable elements outside keyboard/screen-reader reach.

The experience should visually emphasize:

1. current operating context;
2. the `What needs to happen?` intent prompt;
3. the existing deterministic phase rail;
4. the existing role-derived destination rail;
5. the existing composer and Zumi state;
6. the existing materialized working surface;
7. the existing operations content below.

## Responsive contract

- >= 1120px: three-zone command composition with left phase rail, center intent/Zumi stage and right role destinations.
- 768px-1119px: rails recompose into horizontal structured bands.
- <= 767px: single-column intent-first flow, 44px minimum interactive targets, no horizontal overflow.
- <= 430px: reduce atmospheric decoration, preserve composer, labels and role context.
- 200% zoom must remain usable.

## Accessibility

- Do not remove semantic headings, labels, live regions or navigation labels.
- Do not rely on color alone for state.
- Preserve keyboard focus and existing `Enter` / `Shift+Enter` behavior.
- Respect `prefers-reduced-motion`.
- Decorative atmospheric layers must be pointer-inert.

## Performance

The tranche adds CSS and small server-rendered markup only. It must not add a client provider, network request, image prefetch requirement, animation library or JavaScript dependency.

## Acceptance criteria

1. `/dashboard` has a distinct `unicorn-dashboard` and `unicorn-living-shell` boundary.
2. The context band renders only values derived from current server data.
3. Marble and Obsidian have visibly distinct material treatments for the same dashboard.
4. The existing Living Home composer, phase rail, destination rail and working state remain intact.
5. Mobile has a native recomposed layout rather than squeezed desktop columns.
6. Reduced-motion behavior disables decorative motion.
7. Public `/` remains reference-locked Obsidian and is not changed by this tranche.
8. No domain authority, schema or API is modified.
