# Klinikos Pixel-Reference Reconstruction Pass

Status: ACTIVE IMPLEMENTATION DIRECTIVE

Reference: the approved rose/obsidian Klinikos reference supplied by the owner on 2026-08-14.

## Acceptance law

"Exact" means visually identical to the approved reference as far as a responsive functional web product can reasonably be made. Do not interpret, modernize, simplify, substitute generic equivalents, or stop at matching the vibe.

The only intentional departure is the lower car/speedster section. It must NOT be restored. It must be replaced by the approved first-visit starting surface while preserving the reference's low horizontal footprint, cinematic integration, width, border treatment, and visual rhythm.

## Measured visual contract

Treat the reference as a composition map, not a mood board.

### Header

- Left: orbital K tile + stylized KLINIKOS wordmark.
- Center: DASHBOARDS / GRID / CARE / EDU / INTELLIGENCE.
- Right: profile/auth state.
- Header remains visually light and nearly floating over the black field.

### Rose

The rose is the central visual environment, not a decorative glow.

Required traits:
- recognizable real rose silhouette and petal structure;
- centered slightly above the composer;
- occupies most of the central desktop composition;
- deep burgundy/red with darker petal edges and central shadow;
- warm highlights concentrated around upper/inner petals;
- black vignette aggressively absorbs outer edges;
- foreground surfaces remain legible without flattening the rose into a blurred red disk.

The current generic/vector approximation is insufficient if its petal structure does not visibly match the approved reference.

### Typography

Hero hierarchy:
- small uppercase KLINIKOS INTELLIGENCE eyebrow;
- extremely thin editorial two-line headline;
- line break exactly between `What needs` and `to happen?`;
- headline visually dominates without becoming bold;
- supporting line is compact, centered, warm off-white/rose-gray.

Do not reuse one generic typography treatment for wordmark, nav, rails, hero, cards, and CTAs.

### Left rail

LISTENING / UNDERSTANDING / CONNECTING / PREPARING / READY

- narrow vertical rose line;
- small nodes;
- active node glows warm coral/rose;
- inactive labels and nodes are substantially dimmer;
- spacing and label offset follow the reference.
- application state remains truthful.

### Right rail

PATIENTS / GRID / CARE / BILLING / INSIGHTS

- circular outline icons;
- thin warm-rose stroke treatment;
- compact uppercase labels;
- vertically even rhythm;
- hover/focus may clarify interaction but must not alter the reference composition.

### Composer + Zumi

- wide, shallow black-cherry translucent composer;
- reference-like border and depth;
- attachment at left;
- text/placeholder starts close to reference position;
- right affordances remain functional;
- send is warm coral;
- Zumi overlaps bottom edge of composer at center;
- Zumi halo is rose, not cyan;
- word/subtitle placement must match the reference rhythm.

### Cards

Desktop is one row of four.

- shallow equal cards;
- compact icon tile;
- restrained border;
- concise title/description scale;
- arrow aligned toward lower/right content region;
- no tall dashboard-card treatment.

### Lower first-visit strip

The approved reference contains a car/speedster strip. Klinikos intentionally replaces that subject matter.

Preserve only:
- horizontal footprint;
- height class;
- cinematic darkness;
- border rhythm;
- relationship to the four cards above.

Replace content with the already-approved first-visit starting surface. Do not leave or regenerate a car/speedster image.

## Color family

The rose surface should draw from:

- obsidian black
- near-black
- black cherry
- oxblood
- deep burgundy
- dusty rose
- muted coral
- ember pink
- warm ivory
- muted rose-gray

Converted rose-reference surfaces must not drift back to dominant cyan, teal, or cool blue.

## Asset law

Use/prepare only assets genuinely needed for fidelity:

- high-resolution rose source suitable for 1920px+ displays;
- orbital K as SVG/vector;
- KLINIKOS wordmark as SVG/vector if ordinary text cannot reproduce the approved lettering;
- other non-font brand lettering only when required.

Do not slice structural UI out of the screenshot.

`public/klinikos-approved-rose.svg` is currently a placeholder and MUST NOT be treated as a finished production asset.

## Difference loop

For every implementation cycle:

1. Render at 1440px desktop.
2. Capture implementation screenshot.
3. Place against the approved reference.
4. Identify the largest obvious visual differences.
5. Correct them.
6. Repeat.

Priority:

1. rose
2. logo + wordmark
3. hero typography
4. geometry
5. composer + Zumi
6. rails
7. cards
8. color/lighting micro-adjustments

Then repeat at a larger desktop width and mobile.

## Current known gaps on main at activation of this pass

- `public/klinikos-approved-rose.svg` is literally `__PLACEHOLDER__`.
- the current reference surface uses `public/klinikos-rose-bg.svg`, a generated approximation rather than the approved high-resolution rose asset.
- the current public Living Home still includes the `speedster-panel` lower section, which violates the approved departure from the reference.
- the current KLINIKOS wordmark is rendered as generic uppercase text in `KlinikosWordmark`; if it visibly differs from the reference, replace it with an accurate vector wordmark.
- global Aegean/cyan tokens may remain elsewhere in the product, but they must not dominate this reconstructed rose surface.

## Functional invariants

Do not weaken:

- real intent routing;
- truthful intelligence state progression;
- keyboard handling;
- reduced-motion behavior;
- real links/actions;
- auth boundaries;
- tenant isolation;
- PHI/privacy boundaries;
- deterministic permission/eligibility/payment/clinical governance.

Fidelity does not justify fake functionality.

## Done definition

The pass is not complete if side-by-side inspection immediately reveals obvious differences in:

- rose
- orbital K
- KLINIKOS lettering
- hero typography
- color
- geometry
- composer
- Zumi
- rails
- cards

Do not report `close enough`.
