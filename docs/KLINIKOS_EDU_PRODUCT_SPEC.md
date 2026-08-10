# Klinikos EDU

## Product

**Klinikos EDU** is the education division of Klinikos. Its flagship product is **Klinikos Virtual Clinic Lab**: a synthetic, role-based clinic operations simulator that lets students practice how a modern clinic actually runs without using real PHI.

Tagline: **Learn healthcare operations by running them.**

## Product thesis

Production Klinikos helps a clinic operate. Klinikos EDU uses the same workflow ideas to teach students how to operate a clinic safely.

The education product must remain clearly separated from production clinical use. All student scenarios are synthetic unless an institution has a separately approved, legally reviewed deployment model. EDU does not grant clinical authority, credentialing, licensure, certification, scope-of-practice approval, or permission to treat real patients.

## Initial markets

- Nursing
- Medical assisting
- Health administration
- Health information management
- Medical billing and coding
- Allied health
- Healthcare informatics
- Healthcare entrepreneurship and practice management
- AI in healthcare operations

## Core experiences

### Student

Students enter a simulated clinic and are assigned a role such as:

- Front Desk
- Medical Assistant
- Nurse
- Provider
- Biller
- Coder
- Practice Manager
- Compliance Officer

They complete scenario-based work such as:

- patient intake and readiness
- scheduling and no-show recovery
- document and consent workflows
- referral coordination
- result-review routing
- billing-readiness checks
- coding practice with human/instructor review
- privacy and security response
- staff task ownership
- revenue-leakage detection
- AI-assisted workflow review

### Instructor

The instructor receives a command center for:

- courses
- cohorts
- assignments
- students
- scenario templates
- role assignments
- rubric configuration
- simulation resets
- completion tracking
- competency reports
- intervention flags

### AI Simulation Engine

Instructors can describe a synthetic scenario in natural language. Example:

> Create a primary-care scenario involving a 57-year-old patient with diabetes, a missing referral, an abnormal A1C result, an insurance eligibility problem and an overdue follow-up.

The AI gateway may help draft scenario artifacts, but every generated educational scenario is marked **Synthetic** and instructor-reviewable before assignment.

AI may:

- draft synthetic patient data
- draft clinic tasks
- draft simulated messages
- create scenario variations
- generate instructor explanations
- provide structured feedback
- identify missed workflow steps

AI must not:

- provide autonomous diagnosis or treatment instructions
- claim a student is clinically competent or licensed
- submit real claims
- use real patient data in normal EDU mode
- infer credentialing or scope authority

## First curriculum packages

1. Medical Office Operations
2. Introduction to EHR and Clinical Systems
3. Medical Billing and Claims Workflow
4. Clinical Documentation Lab
5. Referral and Care Coordination
6. Healthcare Privacy, Security and HIPAA Operations
7. AI in Healthcare Operations
8. Healthcare Entrepreneurship and Practice Management

Each package should eventually include instructor guide, lesson plans, synthetic cases, assignments, rubrics, simulations, assessments, completion evidence and optional certificate of completion.

## First sellable MVP

The first EDU MVP should contain:

- public EDU landing page
- instructor course workspace
- course/cohort creation
- student enrollment by email or join code
- role assignment
- synthetic scenario library
- scenario assignment
- student simulation workspace
- task checklist
- timeline/events
- rubric scoring
- instructor notes
- completion state
- basic competency report
- audit trail for grading changes

## UX architecture

Do not build EDU as a wall of cards. Use task-native work surfaces.

- Courses: table/list
- Cohort: roster table
- Scenario library: searchable table with filters
- Student lab: split view with scenario context, work queue and evidence timeline
- Instructor grading: rubric + evidence inspector
- Analytics: competency matrix and completion table
- Settings: nested forms

## Data boundaries

EDU defaults to synthetic-only data.

Required labels:

- Synthetic training data
- Educational simulation
- Instructor review required
- Not for real patient care

Do not encourage students or instructors to enter real PHI.

## Certification positioning

Klinikos may later offer private educational credentials such as **Klinikos Certified AI-Enabled Healthcare Operations Specialist**. Any credential must be presented as a private educational certificate, not a professional license, board certification, clinical credential or authorization to practice.

## Commercial packaging

Initial pricing should remain configurable and institution-specific. Recommended internal test bands, not public commitments:

- course pilot: $2,500–$5,000 per semester
- small program: $10,000–$25,000 per year
- department: $25,000–$75,000 per year
- large/multi-program: custom
- optional student license: $25–$100 per student per semester

Validate willingness-to-pay before publishing fixed pricing.

## Expansion

The same simulation engine can later support **Klinikos Workforce**, allowing clinics to train staff in a synthetic version of their operating workflows before they receive production access.

## Definition of safe EDU launch

- synthetic-only default
- clear educational disclaimers
- no real PHI requirement
- institution/instructor/student roles separated
- assignment and grade changes audited
- no clinical-authority claims
- no production clinic data access by students
- accessible keyboard-first learning flows
- instructor review for AI-generated scenarios
- privacy and institutional data terms reviewed before school deployment
