# Klinikos security architecture

Version: `2026-08-12.1`
Status: engineering architecture, not a compliance certification

## Objective

Build security as a layered control system that assumes individual controls can fail.

The design goal is not "one super lock." It is that a compromised browser session, malicious document, model mistake, stolen token, buggy route, or misconfigured connector still encounters independent controls before it can become a consequential breach.

## Layer 1 — Identity

Current foundation:
- authenticated identity;
- signed session tokens;
- persisted sessions for database identities;
- server-side role normalization;
- session revocation.

Target additions:
- MFA;
- passkeys/WebAuthn;
- verified email/phone policy where appropriate;
- identity-provider federation/SSO for larger organizations;
- recovery controls resistant to social engineering.

## Layer 2 — Session assurance

Current/new foundation:
- session IDs;
- database-backed revocation;
- expiry;
- login IP/user-agent metadata;
- current-request IP/user-agent drift signals;
- short-lived purpose-bound step-up proof contract.

Target additions:
- actual password re-auth/MFA/passkey step-up ceremony;
- device trust;
- impossible-travel input from trusted geo telemetry;
- session rotation after privilege changes;
- risk-driven reauthentication.

## Layer 3 — Tenant and authorization

Current foundation:
- organization ID from authenticated server session;
- RBAC resource/action vocabulary;
- API permission helper;
- authorization-denial audit events.

Rule:
A request body, model output, URL parameter, external connector, uploaded document, or webpage can never grant tenant membership or authorization.

Target additions:
- resource-level/relationship-level authorization where role-level rules are too broad;
- automatic cross-tenant test coverage for every sensitive repository/route family.

## Layer 4 — Sensitive action risk

New foundation:
High-impact operations are classified independently from ordinary RBAC.

Classes include:
- private-data export;
- access/identity changes;
- security configuration changes;
- records release;
- credential decisions;
- financial commitments;
- payouts/refunds;
- consequential external writes;
- high-impact clinical actions.

HIGH/CRITICAL actions can require:
- fresh step-up proof;
- explicit human approval;
- clean session-risk state;
- domain-specific deterministic policy.

## Layer 5 — AI / agent security

New foundation:
- conversation profile != authorization;
- founder profile activated only by server-side user IDs;
- private/public context separation;
- tool/data-class policy;
- prompt-injection detection;
- retrieved content treated as data, not authority;
- secrets barred from general tool payloads;
- patient data barred from general public-research tools;
- consequential external writes require explicit approval;
- model output cannot override deterministic gates.

Target additions:
- typed internal function registry with declared input/output sensitivity;
- per-tool allowlists and schema validation;
- remote MCP approval handshake;
- tool-output taint/provenance propagation;
- automated red-team prompt-injection corpus;
- model/provider isolation tiers.

## Layer 6 — Request and browser hardening

New/current foundation:
- global anti-clickjacking headers;
- MIME sniffing prevention;
- restrictive referrer policy;
- conservative CSP directives;
- Permissions-Policy;
- HSTS in production;
- Zumi request body cap;
- Zumi per-process request throttling;
- private/no-store AI responses.

Target additions:
- shared/distributed rate limiting;
- WAF/edge bot protection;
- nonce/hash CSP for scripts/styles after compatibility validation;
- CSRF/origin enforcement audit across every mutating cookie-authenticated route;
- route-specific upload/content-type limits.

## Layer 7 — Secrets and cryptography

Current foundation includes environment-backed secrets and document encryption configuration.

Rules:
- never expose secrets to the browser;
- never place secrets in model prompts or public tools;
- separate signing purposes where practical;
- rotate compromised keys;
- use managed secret storage in production;
- keep payment/webhook signing secrets separated by provider and environment.

Target additions:
- managed KMS/HSM-backed key lifecycle for production-sensitive encryption;
- automated secret scanning and rotation runbooks;
- envelope encryption for high-sensitivity object storage where appropriate.

## Layer 8 — Audit and detection

Current/new foundation:
- authorization-denial audit rows;
- Zumi invocation audit/metering;
- `security.*` audit namespace;
- session drift event;
- rate-limit abuse event;
- oversized Zumi request event;
- invalid continuation-token event.

Target additions:
- SIEM export;
- alert thresholds;
- security dashboard;
- incident correlation across identities/IPs/organizations;
- anomaly/credential-stuffing detection;
- immutable/off-platform audit retention for defined high-risk records.

## Layer 9 — Data protection and privacy

Rules:
- minimum necessary data;
- no public research with private/PHI payloads by default;
- explicit provider assurance before PHI egress;
- tenant-scoped repositories;
- no sensitive data in ordinary analytics/log strings;
- secure object storage and retention policies.

Target additions:
- formal data classification inventory;
- automated retention/deletion policies;
- DLP scans for exports/logs/object storage;
- backup restore drills.

## Layer 10 — Software supply chain

Target controls:
- dependency lockfiles;
- dependency vulnerability scanning;
- secret scanning;
- static analysis;
- branch protection;
- mandatory green schema/type/lint/test/build gates;
- signed/provenance-aware releases where practical;
- dependency update process;
- SBOM generation for production releases.

## Layer 11 — Incident response

Target lifecycle:

`DETECT → CONTAIN → REVOKE/HOLD → INVESTIGATE → RECOVER → NOTIFY/ESCALATE AS REQUIRED → LEARN`

Potential automated containment primitives:
- revoke session;
- suspend account;
- pause Grid participant/resource;
- disable Zumi globally through `ZUMI_DISABLED`;
- disable a connector;
- hold payout;
- rotate credentials;
- switch product into manual fallback.

Clinical/safety incidents and cyber/security incidents are distinct workflows even when one event can trigger both.

## Current limitations / truthful status

This architecture does **not** mean Klinikos currently has:
- completed HIPAA production assurance;
- MFA/passkeys deployed;
- distributed rate limiting;
- a production WAF;
- a connected SIEM/SOC;
- impossible-travel telemetry;
- automated DLP;
- managed KMS/HSM architecture;
- completed penetration testing;
- completed incident exercises;
- PHI-approved Zumi inference.

Those remain production gates and should be implemented and verified deliberately.
