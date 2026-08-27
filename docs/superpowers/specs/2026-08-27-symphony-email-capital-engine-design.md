# Symphony Email-First Company Execution Engine

Status: DESIGN APPROVED IN CHAT / IMPLEMENTATION NOT STARTED
Date: 2026-08-27
Basis main SHA: `b08c81f41b2101a4b63f94ecf1a5b61d1f1c7fd4`
Repository: `jcamacho611/Clinicos-by-Zumi`

## 1. Purpose

Symphony is the company-execution orchestration layer for Klinikos. It is not a second CRM, a second Zumi, a second funding database, or a bulk-mail system.

Its first implementation goal is to turn the existing company-control, funding, outreach, communications, and evidence infrastructure into one governed email-first execution loop that can:

- discover or receive a company opportunity;
- classify it into the correct capital, revenue, procurement, partnership, accelerator, investor, incentive, or lender lane;
- determine whether direct professional email is the best first move;
- select or generate the correct truthful outreach message;
- deduplicate against existing outreach history;
- send only when a real approved outbound rail is available;
- record provider evidence before claiming delivery;
- schedule deliberate follow-up;
- prioritize replies and referrals over additional cold outreach;
- route an opportunity into an application, diligence, proposal, meeting, or user-action state only when the evidence supports that transition;
- stop at non-delegable actions such as identity verification, signatures, hard credit pulls, personal guarantees, binding financial/legal acceptance, or securities issuance.

The operator outcome is simple:

> Symphony should move each qualified opportunity as far as safely possible and show the founder only the small set of actions that legally, financially, or personally require the founder.

## 2. Repository authority and non-duplication

Symphony MUST extend current Klinikos company infrastructure rather than introducing parallel business truth.

Authoritative existing sources include:

- `src/lib/company-execution-control-plane.ts` for company registers, stage gates, revenue engines, decision classes, and Zumi company-authority definitions;
- `docs/business/KLINIKOS_SBA_FUNDING_CONTROL_PLANE_2026-08-25.md` for current capital/funding truth and lender-readiness evidence;
- `docs/business/funding/KLINIKOS_CAPITAL_OUTREACH_EXECUTION_2026-08-26.md` for executed outreach and response-harvest truth;
- `docs/business/KLINIKOS_DECISION_MAKER_FIRST_OUTREACH_REGISTER_2026-08-25.md` where applicable for existing decision-maker outreach history;
- `src/lib/communications/outbound.ts` for provider-backed outbound message truth;
- `docs/EXTERNAL_DEPENDENCY_MATRIX.md` for the current truth of email/connectors and other external rails;
- current Outlook or other mailbox evidence only when retrieved through an authorized connector or imported through a governed adapter. A ChatGPT-connected mailbox is not automatically a production dependency of the deployed Klinikos application.

Symphony must not create a second authoritative register for capital, customers, partnerships, lender readiness, or institutional pipeline. If additional persistence becomes necessary, new records must project into or reference the existing company register model rather than replace it.

## 3. Architectural thesis

The canonical execution chain is:

`OPPORTUNITY → CLASSIFY → VERIFY FIT → CHECK HISTORY → SELECT EMAIL PATH → PREPARE → POLICY CHECK → SEND OR QUEUE → PROVIDER EVIDENCE → FOLLOW-UP WINDOW → RESPONSE/REFERRAL → NEXT GOVERNED ACTION → USER GATE IF REQUIRED → OUTCOME EVIDENCE`

The browser, if a dashboard is added later, receives a minimum-necessary projection of this state. The decision logic, deduplication rules, targeting rules, proprietary prioritization, risk rules, and message-generation context remain server-side.

Symphony may propose and execute routine reversible company actions when explicitly permitted by policy. It may not create legal, financial, clinical, credential, identity, or securities authority.

## 4. Initial opportunity classes

Symphony v1 must support these typed classes:

- `CUSTOMER_REVENUE`
- `GRANT_NON_DILUTIVE`
- `GOVERNMENT_CONTRACT`
- `WORKFORCE_INSTITUTIONAL`
- `ACCELERATOR_PROGRAM`
- `INVESTOR`
- `PARTNERSHIP`
- `CREDIT_INCENTIVE`
- `LENDER_CDFI`
- `OTHER_REVIEW_REQUIRED`

These are orchestration classes, not new product taxonomies. Each maps to one or more existing company registers and revenue/capital lanes.

Examples:

- `CUSTOMER_REVENUE` → customer-prospect + offer-pricing + contract/customer-value evidence as appropriate;
- `GRANT_NON_DILUTIVE` → capital-opportunity;
- `GOVERNMENT_CONTRACT` → capital-opportunity and/or partnership/customer/institutional pipeline depending the actual opportunity;
- `WORKFORCE_INSTITUTIONAL` → edu-institutional-pipeline;
- `INVESTOR` → capital-opportunity + investor-evidence;
- `LENDER_CDFI` → capital-opportunity + lender-readiness.

Loans remain lower priority unless repayment capacity and business value justify them.

## 5. Priority model

The first implementation should use an explainable deterministic priority model, not an opaque AI score.

Recommended factors:

1. deadline urgency;
2. direct fit with current Klinikos evidence and current product truth;
3. expected cash/non-dilutive/contract value range when known;
4. probability/eligibility confidence;
5. application or outreach effort;
6. strategic multiplier such as customer proof, government past performance, state matching eligibility, distribution, hospital access, or cloud cost reduction;
7. current relationship state;
8. reply/warm-introduction status;
9. debt cost/dilution/commitment burden;
10. founder-only action burden.

Priority must strongly favor a substantive reply, referral, requested proposal, or requested diligence response over sending another unrelated cold email.

Priority must never infer eligibility from company ambition alone.

## 6. Contact and target classification

Before ordinary outbound, Symphony must classify each target as:

- `BUYER`
- `FUNDER`
- `GOVERNMENT_PROGRAM`
- `LENDER`
- `INVESTOR`
- `PARTNER`
- `ACCELERATOR`
- `RESOURCE_PARTNER`
- `COMPETITOR`
- `UNKNOWN`

Existing repository competitor/outbound law remains controlling.

`COMPETITOR` is research-only by default unless there is an explicit approved strategic partnership/interoperability reason.

`UNKNOWN` must be researched/classified before send.

For direct human contacts, Symphony should prefer professional/official business addresses and official program contacts over private/personal channels.

## 7. Email-first decision rule

For every opportunity, Symphony should first ask:

> Can a real professional contact confirm fit, route the company, make an introduction, or reduce application burden before a full application is started?

If yes, direct email is normally the first move.

Email-first is especially appropriate for:

- SBA district and resource-partner routing;
- SBDC/APEX assistance;
- NIH/NSF/state SBIR program officers;
- state health/workforce/economic-development offices;
- procurement and small-business offices;
- accelerator program managers;
- CDFI/pre-screen requests;
- investor thesis-fit outreach;
- strategic partnership and prime-contractor introductions;
- customer discovery and paid-pilot outreach.

Email-first does not override a program whose official rules require a portal-only submission or prohibit pre-application contact.

## 8. Message architecture

Symphony should use a server-side message-builder with message families rather than one generic template.

Initial families:

- funding/program routing;
- government procurement/vendor;
- workforce/institutional;
- customer/pilot;
- accelerator/program-fit;
- investor thesis-fit;
- lender pre-screen;
- partnership/teaming;
- referral follow-up;
- response-to-requested-information.

Each message is assembled from:

- verified company facts;
- current opportunity class;
- recipient class;
- allowed non-confidential product positioning;
- relevant evidence-backed current product state;
- explicit ask;
- safe website/contact signature;
- optional approved attachment references.

Message generation must never fabricate:

- revenue;
- customers;
- contracts;
- awards;
- certifications;
- compliance status;
- production deployment;
- integrations;
- employees;
- partnerships;
- past performance;
- clinical evidence;
- application eligibility.

The full Klinikos vision may be described, but current built/deployed/verified state must remain distinct from roadmap or design intent.

## 9. Outbound delivery truth

Symphony must reuse `src/lib/communications/outbound.ts` rather than create a second sender.

The existing port already distinguishes truthful delivery states. Symphony may only mark an outbound message as provider-accepted when `deliverOutbound(...)` returns `ok: true` with a provider reference.

Initial execution rule:

- if the approved email adapter is configured and the provider returns a reference, transition to `PROVIDER_ACCEPTED`;
- if no sender/connector is configured, transition to `READY_TO_SEND_CONNECTION_REQUIRED`;
- if the provider rejects or cannot be reached, transition to `DELIVERY_FAILED` with a sanitized reason;
- never infer send success from clicking a button, preparing a draft, or having credentials configured.

The current external-dependency matrix describes transactional email as configurable/pending connection. Therefore implementation must fail closed unless fresh environment/runtime evidence proves the sender is available.

A future Microsoft Graph/Outlook adapter may be added behind the same outbound port if production credentials, permissions, security review, and environment truth support it. Symphony must not hard-code Outlook as a guaranteed production rail merely because Outlook is connected to ChatGPT in an operator session.

## 10. Execution state model

The first Symphony state model should be explicit and monotonic where possible.

Core states:

- `DISCOVERED`
- `FIT_REVIEWED`
- `NOT_A_FIT`
- `EMAIL_PREPARED`
- `READY_TO_SEND_CONNECTION_REQUIRED`
- `SEND_BLOCKED_POLICY`
- `PROVIDER_ACCEPTED`
- `DELIVERY_FAILED`
- `AWAITING_RESPONSE`
- `RESPONSE_RECEIVED`
- `REFERRED`
- `MEETING_REQUESTED`
- `DOCUMENTS_REQUESTED`
- `APPLICATION_INVITED`
- `PROPOSAL_REQUESTED`
- `DILIGENCE`
- `USER_ACTION_REQUIRED`
- `SUBMITTED`
- `CLOSED`
- `FUNDED_OR_CONTRACTED`

Important truth rule:

`PROVIDER_ACCEPTED ≠ RESPONSE_RECEIVED ≠ APPLICATION_SUBMITTED ≠ AWARD ≠ CASH RECEIVED`

`FUNDED_OR_CONTRACTED` must require evidence from the governing financial/contract source, not a positive email alone.

## 11. Deduplication and contact-safety policy

Before any send, Symphony must check:

- exact recipient email;
- normalized organization/domain;
- opportunity/program identifier when known;
- existing open response thread;
- previous first-touch date;
- scheduled follow-up date;
- hard-bounce/suppression state;
- competitor classification;
- founder-existing-personal-network restriction where applicable.

Default first-touch rule:

- do not send the same recipient another generic first-touch for the same purpose;
- do not send another generic first-touch to the same organization when an active substantive thread already exists unless a distinct decision-maker and purpose are justified;
- hard bounces are suppressed immediately;
- referral-introduced contacts are separate contacts but must preserve referral provenance;
- follow-up cadence is deliberate, not open-ended.

Recommended default cadence for ordinary cold routing:

- Day 0: first contact;
- Day 3: concise follow-up;
- Day 7: fit/value-specific follow-up;
- Day 14: final routing request;
- then stop unless new evidence justifies reactivation.

Cadence must be configurable by opportunity type and explicit deadline.

## 12. Reply and referral handling

Replies outrank new outbound.

Symphony v1 must define a mailbox-ingestion boundary without pretending a production mailbox reader exists.

Recommended interface:

`MailboxEventAdapter → normalized inbound business event → Symphony response classifier → register update → next action`

Inbound event types may include:

- human positive reply;
- referral/wrong-person routing;
- request for information;
- request for deck/capability statement;
- request to apply;
- meeting request;
- lender/document request;
- automated acknowledgment;
- hard bounce;
- out-of-office;
- rejection/no-fit.

If no authorized production mailbox adapter is available, replies may be imported by an authenticated operator/connector workflow and processed through the same normalization function. The application must label the ingestion source and may not claim continuous automated mailbox monitoring.

Automated acknowledgments must remain distinguishable from substantive human interest.

## 13. Founder/user action gates

Symphony may autonomously perform routine, reversible, evidence-backed actions such as:

- research and classification;
- contact discovery from public/official sources;
- drafting and tailoring messages;
- sending allowed non-binding outreach through a verified sender;
- follow-ups within policy;
- responding to ordinary factual questions using verified company truth;
- preparing application answers;
- preparing proposal/capability materials;
- organizing requested non-sensitive documents;
- booking or requesting non-binding fit calls where an approved scheduling path exists;
- updating company register status and next action.

Symphony must stop at:

- SSN or highly sensitive personal identity fields;
- government-ID submission;
- personal bank login;
- MFA/device confirmation;
- personal financial attestations;
- hard credit pull authorization;
- personal guarantee;
- collateral pledge;
- binding legal certification;
- contract signature;
- final loan acceptance;
- binding commercial terms outside existing approved authority;
- equity issuance;
- SAFE/note/warrant/options acceptance;
- valuation/investor-rights/final securities terms;
- irreversible external commitments.

The operator projection should reduce these to a short instruction such as:

`ACTION REQUIRED: Review certification and submit.`

rather than sending the founder back to complete an entire workflow manually.

## 14. Persistence strategy

The first implementation should avoid a new Prisma migration if the existing company-register/customer/prospect/outreach persistence can represent the required state safely.

Implementation must first inspect current schema and register persistence before choosing storage.

Preferred order:

1. reuse existing persisted records and execution/control-plane structures;
2. add a focused adapter/projection if the information already exists in separate authoritative sources;
3. only add additive schema when a required durable fact cannot be represented without ambiguity.

If new persistence is required, the design must preserve:

- organization/company scope;
- normalized recipient identity;
- opportunity identity;
- outreach purpose;
- state/history;
- source/provenance;
- delivery provider/reference;
- first-contact/follow-up timestamps;
- suppression/bounce state;
- response classification;
- next action and owner;
- truth class;
- evidence reference.

No secrets, personal identity documents, tax returns, bank credentials, or other sensitive private financial documents belong in GitHub or ordinary outreach records.

## 15. Initial module boundaries

Recommended first implementation modules:

`src/lib/company/symphony-opportunity-types.ts`
- opportunity/target/state vocabulary and mapping into current company registers.

`src/lib/company/symphony-policy.ts`
- authority boundaries, send eligibility, target classification requirements, user-action gates, suppression rules.

`src/lib/company/symphony-priority.ts`
- deterministic explainable prioritization.

`src/lib/company/symphony-message-builder.ts`
- message family selection and safe variable assembly from verified company truth.

`src/lib/company/symphony-execution.ts`
- orchestration of history check, policy, message preparation, outbound port invocation, status transition, and next-action scheduling.

Potential later modules, not required to prove the first tranche:

`src/lib/company/symphony-mailbox.ts`
- normalized mailbox event ingestion once a production mailbox adapter is available.

`src/lib/company/symphony-application.ts`
- application workflow orchestration after the email-first loop proves value.

## 16. Error handling

All external failures must produce truthful internal state.

Examples:

- no email connector → prepared/connection-required, not sent;
- provider HTTP failure → delivery failed, retry policy applies;
- invalid recipient → suppress/needs-contact-repair;
- unknown target type → research required, no send;
- contradictory company facts → manual review required;
- ambiguous existing thread → hold and request operator review rather than risk duplicate outreach;
- stale deadline → close/monitor rather than send misleading urgency;
- mailbox unavailable → reply state unknown, do not claim no reply;
- automated acknowledgment → acknowledgment only, not human interest;
- application portal required → application-invited/user-action as appropriate, not submitted until evidence exists.

Errors shown to a future browser surface must be sanitized and minimum-necessary.

## 17. Security and privacy

Symphony is server-side company operations infrastructure.

It must follow repository-wide confidentiality law:

- no secrets in client code;
- no raw private business strategy or proprietary prioritization rules delivered to browser clients;
- no sensitive private financial documents in email unless explicitly required and sent through an approved secure route;
- SSNs, government ID, bank credentials, tax returns, bank statements, credit reports, and personal financial statements must never be casually emailed;
- when a lender/program requests sensitive documents, Symphony should direct them to a secure portal/data-room process;
- public research is not a destination for private company/customer data;
- no PHI should enter Symphony outreach unless an independently governed, approved use case exists. The default Symphony funding/sales engine is non-PHI.

## 18. Operator experience

A later operator dashboard should be simple and should not expose the internal complexity of the engine.

Primary views:

- `NEEDS ATTENTION`
- `READY TO SEND`
- `AWAITING RESPONSE`
- `RESPONSES`
- `APPLICATION/PROPOSAL NEXT`
- `USER ACTION REQUIRED`
- `WON / CLOSED`

Each item should answer:

- who/what is this;
- why it matters;
- current truthful state;
- last action;
- next action;
- deadline;
- why the next action is allowed;
- whether the founder is required.

No raw hidden scoring weights, private prompt context, or confidential strategy needs to be shipped to the browser.

The first implementation tranche does not require a new dashboard. The server-side execution substrate and tests should land first.

## 19. Testing strategy

TDD is mandatory.

Focused tests should include at least:

### Opportunity policy
- maps all supported opportunity classes to existing company registers;
- loans remain lower-priority than comparable non-dilutive/customer routes unless explicit factors justify otherwise;
- competitor/unknown targets fail closed;
- non-delegable user gates cannot be executed by Symphony.

### Deduplication
- blocks duplicate same-purpose first touch;
- allows a valid referral-introduced new decision maker;
- blocks hard-bounced recipients;
- respects follow-up timing;
- prioritizes an existing human reply over new cold outbound.

### Message truth
- generated messages contain only provided/verified facts;
- planned features are not rendered as verified-live claims;
- target-specific message families contain the correct ask;
- lender email asks for pre-screen before hard inquiry when appropriate;
- sensitive-document requests direct to secure channels.

### Delivery truth
- no connector yields connection-required state;
- provider rejection yields delivery-failed state;
- provider acceptance with reference yields provider-accepted state;
- no path can mark response/application/award/cash from provider acceptance alone.

### Reply classification
- automated acknowledgment does not become human interest;
- referral generates a linked new-contact next action;
- application invitation does not become submission;
- funding/contract state requires governing external evidence.

### Authority
- hard pull, PG, signature, binding terms, SSN/identity, and securities issuance always produce `USER_ACTION_REQUIRED` or equivalent blocked state.

## 20. First implementation tranche

The first implementation should be deliberately narrow and mergeable:

1. typed opportunity/target/state vocabulary;
2. deterministic policy and founder-action gates;
3. deterministic prioritization;
4. message-family builder using verified company facts;
5. history/deduplication adapter over existing company/outreach truth;
6. orchestration into the existing outbound email port;
7. truthful provider-result state transitions;
8. focused TDD contracts;
9. human-readable Symphony operating canon documenting the exact email-only execution law.

This first tranche should NOT:

- build a second CRM;
- add a new dashboard unless required to prove the server path;
- add Microsoft Graph credentials or claim Outlook runtime connectivity;
- automate portal submissions;
- issue securities;
- authorize hard credit pulls;
- accept binding legal/financial terms;
- introduce autonomous mass-mail loops without qualification/dedupe/follow-up controls;
- migrate schema unless current storage cannot truthfully support required durable state.

## 21. Success criteria

The first tranche is successful when all of the following are true:

1. A qualified opportunity can be represented and mapped to the correct current company register.
2. Symphony can determine whether email-first is permitted and useful.
3. Symphony can select/build the correct truthful message family.
4. A duplicate or unsafe contact is blocked before send.
5. A valid contact can be passed through the existing outbound port.
6. The state reflects the real provider result rather than intent.
7. A follow-up next action is created only when policy permits.
8. Founder-only decisions are surfaced as explicit non-delegable gates.
9. No message can turn planned product capability into a verified-live claim.
10. No sent email can be mistaken for a reply, application, award, contract, or cash.
11. Existing company registers remain authoritative.
12. No LWA repository code or business truth is imported into Klinikos.

## 22. Deferred expansion

After the first tranche is proven, later Symphony tranches may add:

- authorized Microsoft Graph/Outlook outbound adapter behind the existing communication port;
- mailbox ingestion and threaded reply harvesting;
- application answer-bank and portal execution support;
- direct official-source opportunity ingestion;
- investor/contact enrichment integrations;
- government procurement/RFP capture;
- application document assembly;
- scheduling/meeting coordination;
- operator dashboard;
- analytics on response rate, referral rate, application conversion, contract conversion, capital secured, and cash received;
- automated recommendation of which money lane to push next based on verified company stage and evidence.

Each later tranche must preserve the same truth, authority, security, deduplication, and evidence boundaries.

## 23. Final law

Symphony optimizes for qualified progress and money outcomes, not email volume.

The governing loop is:

`READ COMPANY TRUTH → FIND/RECEIVE OPPORTUNITY → VERIFY FIT → CONTACT THE RIGHT HUMAN → MOVE THE THREAD FORWARD → REDUCE FOUNDER WORK → STOP AT NON-DELEGABLE AUTHORITY → RECORD EVIDENCE → CONTINUE`

A single qualified introduction, requested proposal, application invitation, customer contract, or funding outcome is more valuable than hundreds of unqualified sends.

Symphony may automate execution. It may not automate fiction.
