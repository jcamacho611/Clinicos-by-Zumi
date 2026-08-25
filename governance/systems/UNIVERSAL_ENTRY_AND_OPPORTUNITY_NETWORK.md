# Universal Entry & Opportunity Network Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P0/P1/P3

## Purpose

Make Grid and opportunity discovery a native capability of every Klinikos account so the ecosystem acquires traffic, supply, demand, professional identity and repeat engagement without forcing users to create a second marketplace account.

## Core product law

> **Every Klinikos account is Grid-capable by default. Public visibility, professional claims, regulated activity and transaction eligibility are not automatic.**

This means account creation automatically creates the minimum internal Grid participation identity/context required for discovery and future matching. It does not automatically publish the user, expose personal information, claim credentials, or advertise services.

## Universal signup model

`VISITOR → ACCOUNT → IDENTITY CONTEXT → GOALS / PERSONA → NATIVE GRID CAPABILITY → PERSONALIZED OPPORTUNITY FEED → OPTIONAL PROFILE / LISTING / DEMAND → VERIFICATION / ELIGIBILITY AS REQUIRED → TRANSACTION / FULFILLMENT → NETWORK`

No separate Grid registration wall.

## Account personas and automatic opportunity experience

### Healthcare student / learner

Immediately receives relevant categories such as:

- EDU programs
- training opportunities
- internships/externships where appropriate
- clinical placements
- preceptor opportunities
- entry-level jobs
- career-readiness tasks
- organizations to follow
- future credential requirements

After education/completion evidence:

`EDU EVIDENCE → IDENTITY PROFILE → GRID ELIGIBILITY → JOB/PLACEMENT DISCOVERY`

Klinikos must never imply graduation automatically creates licensure or eligibility.

### Healthcare professional

Opportunity feed may include:

- jobs
- shifts
- temporary coverage
- contract work
- organizations
- rooms/space
- equipment/services
- continuing education
- preceptor/teaching opportunities
- business services
- practice-launch opportunities

### Clinic / practice owner

Opportunity feed may include:

- professionals
- shifts/coverage
- rooms/equipment
- diagnostic/business services
- software replacement opportunities
- implementation services
- education/workforce programs
- referral/capacity relationships where lawful
- procurement opportunities

### Organization / employer

May discover:

- talent
- services
- workforce programs
- facilities/capacity
- vendors
- education partners
- implementation partners

### Student becoming professional

The account does not restart.

`STUDENT → COMPLETION EVIDENCE → PROFESSIONAL PROFILE → VERIFIED REQUIREMENTS → GRID OPPORTUNITIES → WORK → EXPERIENCE → NETWORK → ADVANCEMENT`

### Patient

Patient accounts do not become public professional marketplace identities merely because every account is Grid-capable. Patient-mode Grid use, if any, must be designed around safe service/capacity discovery without exposing patient identity or health conditions publicly.

## Opportunity taxonomy

Grid should support extensible opportunity/resource classes rather than hard-code only jobs.

Initial/target taxonomy:

### Work

- full-time job
- part-time job
- per diem
- shift
- temporary coverage
- contract/project
- internship/externship
- apprenticeship where lawful
- clinical placement
- preceptor relationship

### Professional services

- billing/RCM
- credentialing
- compliance
- IT/security
- bookkeeping/accounting
- recruiting
- marketing
- translation
- implementation
- training
- consulting
- other lawful business services

### Space / capacity

- office
- treatment room
- chair
- procedure room
- conference/training room
- provider availability
- diagnostic capacity

### Equipment / resources

- equipment availability
- supplies/procurement
- technology/services
- approved resource sharing/rental categories

### Education

- programs
- cohorts
- continuing education
- workforce programs
- simulations
- preceptors
- placements
- employer-sponsored training

### Business opportunity

- practice launch
- partnership opportunities where appropriate
- implementation projects
- vendor opportunities
- procurement requests
- institutional programs
- grants/funding/procurement discovery as a non-clinical opportunity layer

### Organization discovery

- clinics
- health systems
- schools
- employers
- labs
- imaging
- service vendors
- workforce organizations

## Personalized Opportunity Feed

Every eligible account receives a home/feed projection based on:

- declared goals
- profession/student state
- verified skills/credentials
- location/radius
- availability
- organization relationships
- EDU evidence
- Grid activity
- saved preferences
- legal/eligibility requirements

Ranking is server-side and may use proprietary weights. Eligibility gates precede ranking.

The frontend explains why an opportunity appears in normal words, for example:

> **You are seeing this because it is within 10 miles and matches your stated medical-assistant work preference. License verification is not required for this listing.**

or:

> **You match the experience requirement, but this opportunity still requires a New York RN license before you can apply.**

## Zero-friction posting

Users should be able to create opportunities/resources from natural language through Zumi.

Examples:

> **I need an RN this Friday from 8 AM to 4 PM in Brooklyn.**

Zumi converts this to structured demand, asks only missing required details, evaluates policy/eligibility requirements and publishes only after authorized confirmation.

> **I have a treatment room available Tuesdays.**

Zumi prepares a resource listing with location/privacy controls, availability, price or inquiry model, requirements and policy classification.

> **I offer medical billing services for small practices.**

Zumi prepares a business-service profile/listing, but public claims must remain user-supplied/verified as appropriate.

## Automatic Grid capability versus public opt-in

Automatic:

- internal Grid identity/context
- opportunity discovery
- saved preferences
- personalized feed
- ability to create draft Need/Have
- eligibility/readiness calculation

Requires explicit user/organization action:

- public professional profile
- public service listing
- public availability
- publishing demand
- applying/responding where terms/consent are required
- payment/transaction
- sharing contact details

Requires verification/eligibility where applicable:

- regulated professional role
- clinical work
- credential-dependent opportunity
- organization-verified services

## Growth flywheel

`SEO / SOCIAL / REFERRAL / SCHOOL / CLINIC → FREE ACCOUNT → GRID OPPORTUNITY VALUE → PROFILE/ACTIVITY → MORE SUPPLY/DEMAND → BETTER MATCHING → FULFILLMENT → NETWORK RELATIONSHIP → REPEAT USE → ORGANIZATION ADOPTION → PAID KLINIKOS PLATFORM`

The user does not need to buy Clinic OS to receive initial Grid value.

This creates a distribution wedge into organizations:

1. professional finds opportunity through Grid
2. organization uses Grid to hire/source/rent/find service
3. organization creates free profile
4. Zumi/Operating Map exposes broader operating needs
5. organization sees Care/Revenue/automation value
6. qualified organization enters paid implementation/software path

## College / EDU distribution loop

`SCHOOL / WORKFORCE PROGRAM → EDU ACCOUNT → LEARNER PROFILE → EDUCATION EVIDENCE → GRID OPPORTUNITY FEED → PLACEMENT/JOB → EMPLOYER JOINS → NETWORK RELATIONSHIP → CONTINUING EDU / FUTURE WORK → PRACTICE OWNER PATH`

This should be a permanent product-led growth strategy.

## Public SEO / acquisition surfaces

Where privacy and quality allow, create indexable public discovery pages for categories/geographies such as:

- healthcare jobs
- healthcare professionals/services
- healthcare spaces
- business services for clinics
- education/workforce programs
- organizations

Do not expose sensitive personal information, private contact details, patient identity or unverified professional claims.

Use structured data only when truthful and appropriate.

## Referral / invite growth

Allow participants to share public opportunity/resource pages and invite trusted colleagues/organizations.

Potential loops:

- invite a professional
- invite an employer
- invite a clinic
- share a job
- share a room/resource
- share a program
- invite a preceptor

Do not turn referrals into spam. Track consent/suppression and abuse.

## Free account economics

Free Grid entry should be broad enough to create network liquidity but bounded against variable cost abuse.

Potential free capabilities:

- browse opportunities
- native Grid profile shell
- selected profile fields
- saved searches/preferences
- limited alerts
- limited posting/responding depending category
- EDU discovery
- organization discovery

Paid upgrades can monetize high-value tools, not basic participation alone.

## Potential monetization

- organization recruiting subscriptions
- job/opportunity campaigns
- premium professional tools
- promoted listings where appropriate
- business-services transactions
- space/capacity booking fees where lawful
- verification/onboarding services
- employer/workforce products
- EDU/institutional contracts
- Clinic OS / Revenue OS conversion
- enterprise/network products

Do not put a transaction fee on every category by default.

## Backend services

- UniversalGridEnrollmentService
- OpportunityFeedService
- OpportunityPreferenceService
- OpportunityTaxonomyService
- UniversalProfileProjection
- OpportunityRecommendationService
- SavedSearchService
- AlertSubscriptionService
- ReferralInviteService
- GridGrowthAttributionService
- PublicOpportunityProjectionService

Reconcile with current Grid/identity architecture before creating new classes.

## Canonical data

GridParticipation, OpportunityPreference, OpportunityTaxonomyNode, SavedSearch, AlertSubscription, PublicProfileProjection, Invite, ReferralAttribution, OpportunityRecommendationEvidence.

## Events produced

- GridParticipationActivated
- OpportunityPreferenceUpdated
- OpportunityFeedViewed
- SavedSearchCreated
- OpportunityAlertCreated
- PublicProfilePublished
- PublicProfileUnpublished
- OpportunityShared
- GridInviteSent
- GridInviteAccepted
- EducationToGridTransitionRecorded

## Events consumed

AccountCreated, AccountVerified, ProfessionalProfileUpdated, CredentialVerified/Expired, EduCompletionRecorded, OrganizationCreated, GridDemandCreated, GridResourcePublished, NetworkRelationshipCreated, SchedulingAvailabilityChanged.

## Zumi

Zumi should be a primary Grid input layer.

May:

- translate natural-language Need/Have
- complete structured listing drafts
- ask only missing required details
- recommend opportunities
- explain match/eligibility
- create saved search/alerts
- suggest profile improvements based on real gaps
- route learner to education when not eligible yet
- route organization to paid Klinikos when operational needs emerge

Zumi cannot invent credentials, employment history, service capability, salary, eligibility or public claims.

## Trust / safety / privacy

Required from the beginning:

- default private/minimal profile until user publishes
- precise public-field controls
- location privacy controls
- report/block/suspend
- anti-spam/rate limits
- anti-impersonation
- credential evidence where relevant
- organization verification where relevant
- content moderation
- prohibited category policy
- scam/fraud monitoring
- no public patient identity

## Analytics

Measure:

- free accounts
- Grid activation rate
- feed engagement
- profile publication
- demand/resource creation
- response rate
- eligible candidate count
- time to match
- fulfillment
- repeat interaction
- EDU-to-Grid conversion
- professional-to-employer invite
- Grid-to-Clinic-OS conversion
- organization-to-paid conversion
- referral coefficient
- market-cell density

## Definition of done

Every non-patient Klinikos account can enter a useful personalized opportunity experience without a second signup, while public visibility and regulated participation remain explicit and governed. EDU, professional identity, organization discovery, Grid transactions and paid Klinikos conversion form one measurable product-led growth loop.