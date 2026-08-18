# KLINIKOS — COMPETITOR INTELLIGENCE & SIMPLICITY CANON

Version: `2026-08-18.1`
Status: `AUTHORITATIVE PRODUCT / GTM GUIDANCE`

This document defines how Klinikos studies competitors, avoids wasting outbound effort on direct competitors, and converts public market observations into a simpler buyer and operator experience without copying competitor branding, proprietary content, workflows, code, or trade secrets.

Public research is market intelligence only. Runtime truth, product law, security, healthcare governance, pricing evidence, and customer evidence remain authoritative.

## 1. Core strategic law

**Research competitors. Do not prospect them by default.**

A company should be treated as a **direct or near-direct competitor** when a meaningful portion of its commercial product overlaps with several of the following Klinikos surfaces:

- EHR / clinical documentation;
- practice management;
- scheduling / patient intake;
- billing / claims / revenue-cycle management;
- patient engagement / portal;
- clinic operations;
- healthcare workflow automation;
- embedded clinical or administrative AI;
- multi-role healthcare operating software;
- workforce / capacity orchestration where it competes with Grid;
- an integrated healthcare operating platform positioned as an all-in-one system.

Direct competitors belong in a **research-only market-intelligence lane** unless there is a specific, explicit strategic reason to contact them, such as:

- an interoperability relationship;
- a marketplace/data integration;
- a formal channel/reseller opportunity;
- a standards or ecosystem partnership;
- a narrowly defined enterprise integration where they are not the buyer for the overlapping product;
- an explicitly approved founder-to-founder strategic discussion.

Do not send ordinary clinic-sales, pilot, audit, onboarding, or implementation outreach to direct competitors.

## 2. Current competitor classification examples

### Direct / near-direct — research first, no ordinary sales outreach

**CharmHealth**

Public positioning combines EHR, practice management, medical billing, patient engagement and embedded AI. Its 2026 product direction also includes CharmCopilot, AI-assisted clinical workflows and an MCP server for governed access to EHR data. That degree of overlap makes CharmHealth a direct / near-direct competitor for product-strategy purposes.

**Tebra**

Public positioning combines EHR, billing, telehealth, patient engagement and practice automation for independent practices, with bundled and single-solution pricing. It is a direct / near-direct competitor for Clinic OS and practice-operations buyer attention.

**athenahealth / athenaOne**

Public positioning combines EHR, medical billing, practice management, patient engagement and native AI in one integrated platform. It is a direct / near-direct competitor for larger-practice and enterprise buyer attention.

These classifications do **not** mean Klinikos should copy their product scope. They mean we should understand why buyers find them easy or difficult to evaluate, buy, activate and use.

## 3. What competitors are teaching us

The useful lesson is not “add more features.” The useful lesson is that mature healthcare platforms repeatedly compress complexity at the surface.

Public competitor patterns include:

- **one system / one view / one partner** positioning rather than exposing internal modules as separate technical products;
- **bundled outcomes** such as EHR + billing + patient engagement instead of requiring buyers to understand architecture;
- **role-aware work** so front desk, provider, billing and operations users see the work relevant to them;
- **usage- or provider-based pricing** that makes the economic unit understandable;
- **progressive add-ons** for expensive or specialized capabilities;
- **embedded AI** inside existing workflows rather than a disconnected AI novelty;
- **reduced system hopping** as an explicit value proposition;
- **simple public language**, even when the underlying product is operationally complex.

Klinikos should outperform these patterns through a stronger principle:

> **One intent surface above. Governed cross-engine orchestration below.**

The buyer or operator should not have to know whether a result came from Clinic OS, Billing, Grid, EDU, Care, Insights, identity, an external connector, or Klinikos Intelligence.

## 4. Simplicity behind the paywall

The authenticated / paid product should feel **simpler than the public website**, not more complicated.

The wrong pattern is:

`BUY → LOGIN → MODULE WALL → DASHBOARD SPRAWL → MANY TABS → USER FIGURES OUT THE SYSTEM`

The Klinikos target is:

`BUY / ACTIVATE → RESUME INTENT → ROLE + ORG CONTEXT → WHAT NEEDS TO HAPPEN? → ONE RELEVANT WORKSPACE → NEXT USEFUL ACTION`

### 4.1 First paid-session law

The first paid/authenticated session should answer four questions immediately:

1. **Where am I?**
   - current organization / location / role;
2. **What needs attention?**
   - real priorities, setup blockers or unresolved work;
3. **What can I do now?**
   - the smallest set of authorized actions that produce value;
4. **What happens next?**
   - one obvious next route, not a catalog of everything the system can eventually do.

### 4.2 No module-wall law

Do not make the user choose between ten products before they can work.

Internal engines may remain architecturally distinct, but the paid UX should project a coherent operating environment.

Use modules only when they help orientation or deep work. They are not the default mental model.

### 4.3 Progressive disclosure law

Show complexity only when the current task requires it.

Examples:

- a clinic owner asking about lost revenue should see the relevant operating and billing evidence, not every claim-management control;
- a front-desk user handling follow-up should see the follow-up queue and communication state, not enterprise configuration;
- a Grid participant should see the opportunity, requirements, eligibility and next action, not the full internal policy engine;
- a student should see the next competency / placement route, not the entire organization graph;
- a provider should see patient / care work relevant to the current context, not administrative rails they cannot use.

### 4.4 Contextual upgrade law

Do not litter the paid product with locked cards, disabled premium tabs, upgrade badges and artificial scarcity.

An upgrade or paid add-on should appear **only when the current user intent reaches a real entitlement boundary**.

Preferred pattern:

`USER INTENT → USEFUL CURRENT RESULT → REAL ENTITLEMENT BOUNDARY → EXPLAIN VALUE → PRICE / ALLOWANCE → UPGRADE / REQUEST ACCESS → RESUME SAME INTENT`

Avoid:

`LOGIN → WALL OF LOCKED FEATURES → UPGRADE EVERYWHERE`

### 4.5 Paywall continuity law

A paywall must preserve context.

If a user reaches a paid boundary from a workflow, Klinikos must preserve:

- organization / tenant;
- active role;
- current task;
- relevant record / opportunity / workflow identifier where safe;
- selected plan or add-on;
- intended next action;
- safe return destination.

After verified entitlement, return the user to the exact governed workflow whenever possible.

### 4.6 Entitlement truth law

**Visible access is not payment proof. Browser return is not payment proof.**

Entitlement must come from server-owned payment / contract / admin evidence according to Financial OS law.

A locked feature may become usable only after the required entitlement evidence exists.

## 5. Public pricing should be simpler than internal pricing

Competitors often succeed at evaluation because they present buyers with a small number of commercial choices even when backend billing is complex.

Klinikos should use the same principle without copying competitor pricing.

The public buyer should generally see:

- the outcome;
- who it is for;
- what is included;
- the setup / activation expectation;
- the recurring price or pricing basis when approved;
- included usage where relevant;
- optional add-ons;
- what requires external connection;
- the next step.

The buyer should **not** see internal cost ledgers, vendor routing, adapter names, transaction-state machinery, policy-engine internals, or implementation jargon.

## 6. Better-than-competitor simplicity doctrine

Klinikos should compete on **coordination simplicity**, not “more features.”

### Competitor-style value

“Everything in one platform.”

### Klinikos target value

“Tell Klinikos what needs to happen. It coordinates the authorized work underneath.”

That requires the product to do more than hide navigation. It must actually resolve intent, context, permissions, data, engine routing, external state and next action.

The simplicity must therefore be **earned by backend orchestration**.

## 7. Product acceptance test for paid surfaces

For every authenticated / entitled workflow, test:

1. Can a first-time user understand the screen in under 10 seconds?
2. Is the primary action obvious without reading documentation?
3. Does the interface show only the role-relevant work needed now?
4. Can the user complete the core task without understanding internal architecture?
5. Does the user remain in context instead of bouncing through unrelated pages?
6. Are advanced controls progressively disclosed?
7. Are unavailable / disconnected / unpaid states truthful?
8. Does an entitlement boundary explain value instead of merely saying “upgrade”?
9. Does payment / activation return the user to the originating workflow?
10. Is there a clear next useful action after success?
11. Does mobile preserve the same task priority?
12. Can Klinikos Intelligence continue the task conversationally without widening permissions?

If several answers are “no,” the surface is not simple even if it looks minimal.

## 8. Outreach guardrail

Before sending outbound sales, pilot, audit, onboarding or partnership mail, classify the target:

### BUYER

Healthcare delivery organization, clinic, practice, health system, operator, provider organization, education institution, workforce/capacity participant, payer-adjacent buyer or other entity that can use Klinikos without primarily selling a directly overlapping platform.

**Action:** normal qualification and tailored outreach permitted.

### PARTNER

Vendor or platform that may provide data, infrastructure, distribution, payments, communications, interoperability, implementation capacity or another complementary rail.

**Action:** partnership-specific outreach only; do not pitch them as an ordinary clinic buyer.

### COMPETITOR

Vendor whose core commercial product materially overlaps with EHR, practice management, billing/RCM, healthcare operations, embedded healthcare AI, patient engagement or Grid-like orchestration.

**Action:** research-only by default. Do not send ordinary sales outreach.

### UNKNOWN

Insufficient evidence to classify safely.

**Action:** research first. Do not send until classification is resolved.

## 9. Competitor research workflow

Use only public, lawful sources for competitive intelligence.

Preferred source order:

1. official product pages;
2. official pricing pages;
3. official release notes / documentation;
4. official security / compliance / integration documentation;
5. customer-facing demos and public help centers;
6. reputable independent market/review evidence when needed.

Record:

- target buyer;
- entry product;
- pricing unit;
- onboarding path;
- first-session mental model;
- navigation model;
- task completion path;
- AI placement;
- billing / payment model;
- integration model;
- obvious friction;
- obvious simplicity pattern;
- what Klinikos should learn;
- what Klinikos should explicitly avoid.

Do not collect, solicit or use confidential competitor information, credentials, private customer data, leaked materials or trade secrets.

## 10. CharmHealth public-market notes — 2026-08-18 snapshot

CharmHealth publicly presents itself as an all-in-one healthcare platform spanning EHR, practice management and medical billing, with patient-facing and AI-enabled capabilities.

Relevant public observations:

- EHR pricing includes a free tier, encounter-based pricing and provider-based pricing;
- some specialized capabilities are separately priced add-ons;
- practice-management capabilities include scheduling, documents, role-based access, secure messaging, inventory, payments, analytics, check-in, invoicing, eligibility, claims and ERA;
- CharmCopilot is positioned as embedded AI supporting clinical workflow;
- CharmHealth publicly promotes “one login / one view” patterns in billing;
- its 2026 AI direction includes MCP infrastructure for structured AI access to EHR data.

**Klinikos implication:** do not compete by simply listing the same categories. Compete by making cross-domain work materially easier to initiate and complete, with one conversational intent surface, persistent identity, Grid/EDU/Clinic OS continuity, governed routing and clearer truth about what is live.

## 11. Tebra public-market notes — 2026-08-18 snapshot

Tebra publicly positions around independent-practice automation, combining clinical EHR, billing, telehealth and patient experience in bundles while allowing some single-solution entry points.

**Klinikos implication:** buyers understand bundles when the bundle maps to a real operating outcome. Klinikos public offers should therefore be small in number and outcome-defined even when internal entitlements are more granular.

## 12. athenaOne public-market notes — 2026-08-18 snapshot

athenaOne publicly positions EHR, medical billing / practice management, patient engagement and native AI as one integrated solution.

**Klinikos implication:** “one platform” is table stakes. Klinikos must make the experience feel more adaptive by resolving the user’s immediate intent across engines rather than requiring users to navigate a traditional suite.

## 13. Official public research sources

CharmHealth:

- https://www.charmhealth.com/
- https://www.charmhealth.com/ehr/
- https://www.charmhealth.com/ehr/ehr-pricing-us.html
- https://www.charmhealth.com/practice-management/
- https://www.charmhealth.com/medical-billing-platform/
- https://www.charmhealth.com/resources/release-notes/ehr/index.html
- https://www.charmhealth.com/ehr/press-releases/charmhealth-advances-its-ai-strategy-with-mcp-server.html

Tebra:

- https://www.tebra.com/pricing/overview
- https://www.tebra.com/features

athenahealth:

- https://www.athenahealth.com/solutions/athenaone
- https://www.athenahealth.com/solutions/practice-management
- https://www.athenahealth.com/solutions/patient-engagement

## 14. North star

**Klinikos should know competitors deeply while making users think about competitors less.**

The paid product wins when the user sees one calm operating environment, states what needs to happen, gets the relevant authorized work immediately, and never has to understand the machinery underneath.
