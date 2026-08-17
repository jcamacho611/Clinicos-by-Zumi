# KLINIKOS — APPROVED LIVING HOME REFERENCE

Date: `2026-08-16`
Status: `AUTHORITATIVE VISUAL REFERENCE NOTES`

This document records the visual hierarchy and composition represented by the approved Living Home reference supplied in `Klinikos design screens.zip` on 2026-08-16. The canonical source frame is `klinikos-living-home-approved-reference-1402x1122.png`. It complements, but does not replace, `docs/KLINIKOS_DESIGN_AND_WIRING_CANON.md`.

## Page 1 — Approved composition

The first page is the authoritative visual composition.

### Header

- compact framed orbital K at top left;
- KLINIKOS wordmark immediately beside the mark;
- centered navigation: DASHBOARDS, GRID, CARE, EDU, INTELLIGENCE;
- circular profile/avatar at top right;
- dark obsidian header with minimal visual noise.

### Hero / intelligence surface

- large burgundy/black-cherry rose dominates the center of the first fold;
- eyebrow: `KLINIKOS INTELLIGENCE`;
- headline: `What needs to happen?` in large thin warm-ivory typography;
- supporting copy: Klinikos understands the ecosystem, connects what matters, and gets the right things moving;
- hero remains spacious and cinematic rather than dashboard-dense.

### Left intelligence rail

The left rail appears vertically aligned beside the hero and expresses:

`LISTENING → UNDERSTANDING → CONNECTING → PREPARING → READY`

A vertical line, nodes/dots, active-state emphasis and muted inactive typography establish progress. These labels must remain truthful projections of actual interface/system state.

### Right operating rail

The right rail presents compact circular icon controls for:

- PATIENTS
- GRID
- CARE
- BILLING
- INSIGHTS

Each control must map to a real governed operating destination or truthful unavailable/setup state.

### Composer

The composer is a wide translucent black-cherry surface centered over the rose.

Reference characteristics:

- large rounded rectangular field;
- placeholder: `Ask Klinikos anything...`;
- attachment control at lower left;
- voice control and send control grouped at lower right;
- rose/coral send accent;
- thin restrained border and dark translucency;
- composer remains the primary command surface.

### Zumi

The Zumi orb overlaps the lower center of the composer.

Reference characteristics:

- circular dark orb;
- label `zumi`;
- subtitle beneath: `Your AI Operating Partner`;
- visible state label beneath that, shown as `LISTENING` in the reference;
- warm restrained intelligence glow, not neon.

### Operational cards

Below the hero, shallow card geometry continues the same black-cherry/rose system. The reference includes the Grid Network card with supporting text about providers, space and real-time capacity. The canonical card set remains:

- Today's Priorities
- Revenue Opportunities
- Team Workflow
- Grid Network

Cards must use real data or truthful empty/unavailable states.

### Lower cinematic strip

A wide lower strip follows the cards.

Reference characteristics:

- left visual area with dark rose-native/cinematic imagery;
- small eyebrow `START HERE`;
- statement about a clinic operating analysis and connected workflow;
- right-side headline: `Built for speed. Designed for care.`;
- supporting copy;
- real CTA: `Explore Klinikos`;
- strong horizontal geometry with restrained border and black-cherry surface.

The strip is a supporting brand/value layer and should recede when active work begins.

## Page 2

The second page is intentionally almost entirely black/empty. It does not introduce a second content layout. Treat it as continuation/overflow rather than a separate page design.

## Design interpretation law

The reference is not permission to bake UI into screenshots or static images. The live product must produce the composition with real components, real routing, real state, real data, role-aware behavior, accessible controls and truthful connector states.

Visual similarity must be achieved with the approved production assets, layout, CSS, typography, spacing and real component composition.

## Approved asset requirement

Use the approved production assets extracted from the design handoff:

- `public/klinikos-orbital-k-production.png`
- `public/klinikos-wordmark-production.png`
- `public/klinikos-rose-hero-production.png`
- `public/klinikos-rose-wide-production.png`

Do not substitute generated placeholders, missing `transparent.webp` paths, or static screenshots for these component-ready assets.

## Reference-lock verification

The implemented desktop target is the reference's native `1402 × 1122` composition. At that viewport the live component geometry is locked to:

- `102px` header;
- centered `780 × 112px` composer at `y=535`;
- overlapping `92 × 92px` Zumi orb;
- one `1244 × 132px` four-card row;
- one `1244 × 158px` lower cinematic strip.

The implementation must also remain usable without horizontal overflow at 390, 768, 1024, 1440 and 1920 pixel widths. Desktop visual fidelity does not authorize inaccessible fixed-screen behavior on smaller devices.

## Functional acceptance

The reference is considered realized only when:

- header destinations are real;
- rails are real and role-aware;
- composer supports multi-turn interaction;
- Zumi state corresponds to real work;
- cards reflect legitimate state;
- lower CTA reaches a real destination;
- same-surface workspaces can project Clinic OS, Grid, EDU, Care, Billing, Insights and Network;
- mobile/tablet equivalents preserve hierarchy without shrinking desktop blindly;
- accessibility and keyboard behavior remain intact;
- no fake counts, fake external completion, fake payment, fake eligibility, fake distance or fake availability are introduced.
