# KLINIKOS — EDU CANON

Version: `2026-08-18.1`
Status: `AUTHORITATIVE SPECIALIST CANON`

## 1. Definition

**Klinikos EDU is the education, simulation, competency-evidence, and career-progression engine of the Klinikos ecosystem.**

It is not merely an LMS. It prepares people for governed opportunities while remaining separate from production clinical authority.

## 2. Lifecycle connection

Canonical direction:

`LEARN → PRACTICE / SIMULATE → EVIDENCE → INSTRUCTOR DETERMINATION → COMPETENCY RECORD → COMPLETION / COMPETENCY EVIDENCE → PLACEMENT → CREDENTIAL EVIDENCE → GRID ELIGIBILITY WHEN POLICY PERMITS → WORK → EXPERIENCE → CONTINUING EDUCATION`

EDU may feed Grid and career routes through evidence. It does not grant licensure, scope of practice, board/professional certification, clinical authority, privileges, employment eligibility, or automatic Grid eligibility.

## 3. Participants

- student;
- instructor/educator;
- institution/program;
- preceptor;
- clinical/training site;
- authorized administrator/operator.

One persistent Klinikos identity may hold EDU and non-EDU roles, but active context and permissions remain explicit.

## 4. Experiences

### Student
Courses, synthetic scenarios, assigned roles, task/evidence workspace, submissions, released grades, completion, human-determined competency evidence, and issued EDU certificates visible within the student's own scope.

### Instructor
Courses, cohorts, enrollment, scenario assignment, rubric/evidence inspection, grading, release, interventions, competency determination, governed certificate issuance, and audit history.

### Institution
Program requirements, cohorts, placement requirements, reporting, certificate governance, and governed integrations where contracted.

### Placement
EDU owns learning/program requirements. Grid owns opportunity/capacity matching and transactions. A placement route may compose student + program + preceptor + site + hours + required evidence without creating a second marketplace.

## 5. Data boundary

Default EDU data is synthetic and labeled:

- synthetic training data;
- educational simulation;
- instructor review required;
- not for real patient care.

Students must not receive production clinic data or private instructor answer keys. Institutional FERPA/privacy posture and real-world placement data require separate legal, contractual, and security review.

## 6. AI boundary

Zumi may draft synthetic scenarios, variations, explanations, feedback, and workflow observations through the governed gateway.

AI may not diagnose, prescribe, establish competence, release a grade, issue or revoke education evidence, grant credentials, use real PHI in ordinary EDU mode, or bypass instructor review.

Grades are evidence. A grade does not automatically establish competency. Competency is an explicit human determination tied to an allowed rubric competency area.

## 7. Certificate law

Native certificate evidence is intentionally narrow:

- `completion` requires the EDU enrollment itself to be completed;
- `competency_evidence` requires every named competency area to already have a human determination of `demonstrated`.

Every certificate carries server-owned language stating that the evidence is not professional licensure, board certification, clinical credentialing, authorization to practice, scope-of-practice approval, clinical privileges, employment eligibility, or automatic Klinikos Grid eligibility.

Students may read only evidence in their own EDU identity scope. Instructors may issue only within cohorts they teach. EDU administrators may issue institution-wide and are the only current role allowed to revoke certificate evidence. Revocation preserves the record and reason rather than deleting history.

## 8. Current truth

The repository contains EDU models and synthetic-safety boundaries, student scenario/submission paths, grading and release APIs, and an existing human-owned competency write path in `POST /api/edu/grades`. Human-demonstrated competency can contribute bounded readiness evidence without bypassing Grid policy.

The current native-completion candidate adds governed certificate read/issue/revoke APIs and an authorized certificate workspace. Instructor UX beyond those paths remains partial. Placement composition, institutional SSO/LTI, governed EDU AI, and legal/institutional readiness remain incomplete or externally gated.

## 9. Commercial direction

EDU may support individual training, simulation access, institutional licensing, placement/network economics where lawful, continuing education, and institutional analytics. Public prices require deliberate approval and current delivery evidence.

## 10. Acceptance

An EDU capability is launchable only when role separation, synthetic/real-data boundaries, assignment and grade audit, instructor review, competency provenance, truthful certificate language, accessibility, and institution/privacy requirements are satisfied for that exact use case.
