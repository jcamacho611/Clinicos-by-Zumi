# KLINIKOS — DESIGN & WIRING CANON

Version: `2026-08-16.2`
Status: `AUTHORITATIVE EXPERIENCE DIRECTION`

This document defines the newest frontend, Living Home, design-system and wiring direction. It does not replace runtime truth or security boundaries.

The approved page-by-page reference notes are recorded in `docs/APPROVED_LIVING_HOME_REFERENCE_2026-08-16.md` and must be used together with this canon.

## 1. Core design law

**Simple above. Powerful below.**

The user should feel one calm, premium, intelligent healthcare operating environment while the backend coordinates many engines.

The interface should be:

- cinematic
- premium
- calm
- intelligent
- spacious
- fast
- obvious
- trustworthy
- healthcare-appropriate
- conversational
- task-first

Do not expose internal architecture merely because it exists.

## 2. Approved visual direction

The converted experience is reference-locked to the approved Klinikos Living Home composition.

Core palette:

- obsidian / near-black
- black cherry
- oxblood / deep burgundy
- dusty rose
- muted coral / ember pink
- warm ivory
- muted rose-gray

Avoid cyan/teal dominance on converted surfaces except where semantically required.

## 3. Production visual assets

The design should use the approved transparent production assets where present:

- `public/klinikos-orbital-k-transparent.png`
- `public/klinikos-wordmark-transparent.png`
- `public/klinikos-rose-wide-transparent.png`
- `public/klinikos-rose-centered-transparent.png`

The wide rose is the primary Living Home atmosphere. The centered rose may support secondary cinematic surfaces.

The site background, vignette, glow and responsive composition belong to CSS/layout, not baked black image canvases.

Do not replace approved assets with generic text, CSS-drawn roses, opaque image rectangles, screenshot slices, or arbitrary SVG approximations when the production asset exists.

## 4. Header

Primary navigation:

- DASHBOARDS
- GRID
- CARE
- EDU
- INTELLIGENCE
- PROFILE / AUTH

Every item must map to a real governed experience. No decorative navigation.

The orbital K and wordmark must render as clean artwork with no black-box padding, clipping, stretching or inconsistent branding.

## 5. Living Home

Living Home is the operating front door, not a static dashboard.

Primary question:

> **WHAT NEEDS TO HAPPEN?**

The user should express an outcome in ordinary language. The interface then transforms into useful work without unnecessary navigation.

Preferred interaction:

`IDLE → USER INTENT → TRUTHFUL INTELLIGENCE STATE → AUTHORIZED CONTEXT → ROUTE RESOLUTION → INLINE RESULT / WORKSPACE → ACTIONS → DEEP WORKSPACE ONLY WHEN NEEDED`

Keep the composer available for multi-turn continuation.

## 6. Intelligence rail

Visible states:

- LISTENING
- UNDERSTANDING
- CONNECTING
- PREPARING
- READY

Additional truthful states should exist where needed:

- WAITING
- BLOCKED
- REVIEW REQUIRED
- ERROR

CONNECTING only appears for actual retrieval/tool/connector activity. READY only appears when a usable result exists. Never animate fake work.

## 7. Operating rail

Primary operating destinations:

- PATIENTS
- GRID
- CARE
- BILLING
- INSIGHTS

The active destination should reflect resolved context, not decorative keyword matching.

Examples:

- follow-up request → Patients/operations context
- staffing/capacity request → Grid
- result-review request → Care
- claim/readiness request → Billing
- revenue leakage request → Insights

## 8. Composer

The composer is the command surface.

Required behavior:

- text input
- Enter submit
- Shift+Enter newline
- multi-turn conversation
- truthful progress
- keyboard focus management
- accessible live status
- attachment/voice controls only when real/authorized
- disabled send when empty

Submission must resolve through real intent/routing infrastructure rather than hard-coded decorative responses.

## 9. Zumi orb

Zumi is the intelligence presence, not a floating gimmick.

Visual behavior should correspond to state:

- idle: restrained dark/warm glow
- listening: subtle activity
- understanding: controlled internal activity
- connecting: only during real connection/retrieval
- preparing: stronger but restrained activity
- ready: settled clear state
- blocked/error: distinct without alarmist styling

No neon cyberpunk treatment.

## 10. Operational cards

Core Living Home cards:

- TODAY'S PRIORITIES
- REVENUE OPPORTUNITIES
- TEAM WORKFLOW
- GRID NETWORK

These must use real data or truthful empty/unavailable states. Do not invent counts or revenue.

Prefer card → inline contextual workspace → optional OPEN FULL WORKSPACE rather than immediate page hopping for every action.

## 11. Dynamic workspace architecture

Living Home should host adaptable workspaces for:

- patients
- operations/tasks/follow-up
- Grid
- Care
- Billing
- Insights
- EDU
- Network
- commercial/activation
- credential/setup states

Do not make one giant monolithic component. Prefer composition and domain adapters.

## 12. Wiring law

For every visible control verify the complete functional chain:

`UI → ACTION → ROUTE / SERVER ACTION / API → AUTH → ROLE / TENANT CONTEXT → BUSINESS LOGIC → DATA / PERSISTENCE → TRUTHFUL STATE → AUDIT / EVENT WHERE CONSEQUENTIAL → NEXT ACTION`

A clickable button is not automatically wired.

## 13. Global navigation and auth

Protected actions must preserve intent through authentication:

`SIGNED OUT ACTION → LOGIN → SUCCESSFUL AUTH → RETURN TO INTENDED SAFE DESTINATION / WORKFLOW`

Preserve safe return URL, selected Grid need/resource, chosen operation and relevant context.

Same-origin redirect protection is mandatory.

## 14. Role-aware experience

The shell may adapt to:

- owner
- administrator
- front desk
- provider
- patient
- Grid participant
- student
- educator
- founder/platform admin where authorized

Never render controls merely because the route exists. Server-side/backend authorization remains authoritative.

## 15. Cross-engine design behavior

The frontend should project ecosystem routes, not module silos.

Examples:

- Clinic OS staffing gap → Grid demand → match → operational follow-up.
- EDU placement requirement → Grid placement capacity → progression.
- Grid fulfillment → Clinic OS work + Financial OS obligation + Insights.
- Revenue question → Clinic OS + Billing + Insights workspace.

The user should not need to know which engine supplied each piece.

## 16. Responsive law

Desktop target includes 1440 and 1920. Also verify 1024, 768 and 390.

Mobile is not desktop squeezed smaller.

Mobile priority:

`HEADER → INTELLIGENCE HERO → COMPOSER → CURRENT RESULT → PRIMARY ACTION → SECONDARY NAV`

Side rails should collapse into compact controls rather than consume the screen.

## 17. Accessibility

Preserve:

- semantic headings
- keyboard operation
- visible focus
- accessible composer
- live status region
- reduced-motion support
- adequate contrast
- usable touch targets
- descriptive labels

Cinematic design cannot reduce usability.

## 18. Performance

The rose/hero must not destroy performance.

Prefer responsive optimized assets, minimal client JS for static shell, lazy deeper surfaces, and localized rerenders during intelligence progression.

## 19. Dead UI law

User-visible dead UI must be:

- wired,
- removed, or
- represented as a truthful unavailable/setup state.

Audit patterns such as `href="#"`, `javascript:void`, empty click handlers, console-only handlers, stale routes, fake demo CTAs, disabled controls without explanation and router pushes to nonexistent pages.

## 20. External state truth

If an external connector is absent, preserve useful work but state the limitation.

Example:

User asks to send a text; messaging is not configured.

Allowed result:

- message prepared
- save/copy task
- connect messaging

Not allowed:

- "Text sent" without delivery evidence.

Same law applies to payments, payouts, credential verification, labs, fax, email, voice, clearinghouse and other external rails.

## 21. Visual acceptance

At the target desktop viewport, compare against the approved reference for:

- header geometry
- brand asset scale/placement
- rose scale/crop
- hero typography
- rails
- composer
- Zumi
- cards
- lower strip
- darkness and rose/coral atmosphere
- first-fold composition

The current approved reference specifically includes a compact top-left orbital K + wordmark, centered DASHBOARDS/GRID/CARE/EDU/INTELLIGENCE navigation, a right-side circular profile control, a central rose-backed `What needs to happen?` hero, the vertical LISTENING→READY rail, PATIENTS/GRID/CARE/BILLING/INSIGHTS operating rail, the overlapping Zumi composer treatment, shallow operational cards, and the `Built for speed. Designed for care.` lower strip. See `docs/APPROVED_LIVING_HOME_REFERENCE_2026-08-16.md`.

Do not achieve similarity by baking UI into images or using fake static data.

## 22. Functional acceptance

The experience is not finished until:

- every visible navigation item works
- every operating-rail item works
- composer/multi-turn behavior works
- state rail represents real work
- contextual workspace renders real/truthful state
- operational cards are real
- auth/return flow works
- role boundaries work
- cross-engine handoffs work where implemented
- mobile/keyboard/accessibility work
- disconnected connectors remain truthful
- CI/build/journey/browser gates pass

## 23. North star

**The screenshot is not a decorative homepage target. It is the operating shell through which the entire Klinikos ecosystem becomes simple to use.**
