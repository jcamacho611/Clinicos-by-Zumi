# Recovered Claude Browser corrections — 2026-08-23

The founder-supplied `Klinikos Browser.dc.html` was inspected after Claude Design reached its session limit. The recovered source was corrected locally and verified before this handoff was merged.

Corrections:

- valid Obsidian success-line token instead of self-reference;
- production Klinikos Orbital K / wordmark / rose references;
- visible type floor raised to approximately 12px;
- explicit control and map-marker target floor raised to 44px;
- Explore Klinikos made an `aria-modal` keyboard-managed surface;
- focus enters, traps within and returns from the palette;
- scripted smooth scrolling respects reduced-motion preference;
- inert attachment and voice actions are disabled and labeled as unavailable in the preview;
- profile action routes to settings in the prototype;
- attention count derives from briefing state instead of a hard-coded number;
- role switching remains labeled as preview-only.

Recovered corrected source SHA-256:

`6e471a857cb13ce68d67a29249db5e19825ba0e738df209c92f4dd4bbb626b01`

Local verification performed on the recovered corrected source:

- Black Label static contract: PASS
- extracted Design Component JavaScript `node --check`: PASS

These checks validate the recovered design artifact. They are not a substitute for the Klinikos production release gate when the design is converted into live application code.
