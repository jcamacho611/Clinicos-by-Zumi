# Klinikos Render MCP Production Operations

Date: 2026-08-25
Status: OPERATING AUTHORITY

## Purpose

Klinikos production hosting is Render unless the founder explicitly changes the hosting authority.

This document establishes the official Render Model Context Protocol (MCP) server as the preferred agentic operations interface for Render-aware Claude Code, Codex, Cursor, and other compatible MCP hosts.

The official hosted Render MCP endpoint is:

`https://mcp.render.com/mcp`

Do not commit Render API keys, bearer tokens, service credentials, database connection strings, or OAuth artifacts to this repository.

## Current repository deployment contract

`render.yaml` is the current repository deployment contract.

Current service declaration:

- service type: web
- service name: `zumi`
- runtime: Node
- build command: `npm ci --include=dev --ignore-scripts && npm run render:build`
- start command: `npm start`
- health check: `/api/health`
- automatic deploy trigger: commit

Repository configuration is not deployment evidence. A merge, a Render configuration file, or an MCP command does not by itself prove production-live state.

## Release-truth hierarchy

Use this sequence:

`CURRENT MAIN SHA → VERIFIED CANDIDATE → MERGE → RENDER DEPLOY → RENDER DEPLOY STATUS → /api/health RELEASE IDENTITY → CRITICAL ROUTE SMOKE → PRODUCTION-LIVE CLAIM`

Never collapse these states.

- `merged` does not mean `deployed`.
- `deploy triggered` does not mean `deploy successful`.
- `deploy successful` does not mean critical routes are healthy.
- a healthy hostname without release identity does not prove the intended SHA is live.

## Preferred authentication

Use OAuth where the MCP host supports it. Do not place long-lived API keys in prompts, shell history, source files, issues, pull requests, logs, or chat transcripts when OAuth is available.

### Codex Desktop / Codex CLI

Official OAuth setup:

```bash
codex mcp add render --url https://mcp.render.com/mcp --oauth-client-id codex
```

Complete the browser authorization flow, then set the active Render workspace before performing service operations.

### Claude Code

Preferred plugin setup:

```text
/plugin install render@claude-plugins-official
```

Then reload plugins and complete the browser authorization flow the first time Render is used.

For non-interactive environments only, Render also supports an API-key authenticated HTTP MCP configuration. Treat the API key as a secret and never commit it.

### Cursor

Preferred plugin setup:

```text
/add-plugin render
```

Authenticate through the MCP/plugin settings when prompted.

## Workspace selection

Render MCP actions are scoped to a selected workspace.

Before reading or mutating production infrastructure:

1. list available Render workspaces;
2. select the intended Klinikos workspace;
3. confirm the selected workspace;
4. list services and identify the service corresponding to the repository `render.yaml` contract;
5. do not infer the correct workspace or service from a similar name alone.

## Safe operating sequence

For ordinary release verification:

1. Read current GitHub `main` SHA.
2. Read the exact candidate/merge SHA.
3. In Render MCP, confirm the active workspace.
4. List services and identify the Klinikos web service.
5. List recent deploys.
6. Match deploy metadata to the intended repository commit/ref when available.
7. Inspect the deploy result.
8. If failed, read Render logs before taking another action.
9. If successful, query `/api/health` and verify release identity.
10. Smoke-test the smallest set of critical routes relevant to the change.
11. Only then record production-live evidence.

For a manual redeploy:

1. establish why a redeploy is required;
2. confirm the exact service and workspace;
3. inspect the most recent deploy first;
4. trigger a deploy only when doing so cannot overwrite or bypass a safer in-flight release;
5. do not clear build cache unless the failure diagnosis supports it;
6. inspect deploy logs and `/api/health` afterward.

## Supported Render MCP operational classes

The official Render MCP server currently supports, among other actions:

- list/set/fetch workspaces;
- create/list/get supported services;
- update service environment variables;
- trigger deploys;
- list deploy history;
- get deploy details;
- query logs;
- query service/datastore metrics;
- create/list/get Render Postgres databases;
- run read-only SQL against Render Postgres;
- create/list/get Render Key Value instances.

Support for an MCP action does not grant permission to use it without the appropriate Klinikos authority and change-control context.

## Consequential-action rules

Treat the following as consequential operations:

- changing environment variables;
- triggering production deploys outside the normal Git commit flow;
- clearing build cache;
- creating production databases or key-value stores;
- changing production infrastructure state;
- querying sensitive production data;
- any operation that could alter PHI handling, authentication, payments, tenant boundaries, or customer availability.

Before consequential actions:

1. establish current truth;
2. identify the intended change and rollback path;
3. preserve exact service/workspace identifiers;
4. avoid exposing secrets in model context;
5. use minimum necessary access;
6. verify the resulting state from Render and the application itself.

## Database boundary

Render MCP can run read-only SQL against Render Postgres, but database provider truth must be checked before assuming Klinikos production data lives in Render Postgres.

Do not move, migrate, copy, repair, or mutate Klinikos production database state merely because Render MCP exposes database actions.

Prisma migration history, production database reconciliation, and provider-specific operational truth remain governed by their existing repository runbooks and human/engineering gates.

## Logs and sensitive information

Render states that its MCP server attempts to minimize exposure of sensitive information but does not guarantee that sensitive values can never appear.

Therefore:

- request the narrowest log window and filter possible;
- avoid pasting raw PHI or credentials into prompts;
- do not copy secrets from logs into issues or PRs;
- redact customer/patient-sensitive output before broader analysis;
- prefer IDs/references over full sensitive payloads;
- do not treat model context as a secret vault.

## Render capacity and billing truth

Render MCP provides operational access; it does not create free build capacity or bypass account limits.

If a Render deploy cannot start because of exhausted build-pipeline minutes, account spending limits, billing restrictions, or another account-level capacity control:

- record that as an external hosting/account blocker;
- do not repeatedly trigger deploys expecting MCP to bypass it;
- resolve the Render account limitation or use an explicitly approved failover plan;
- do not silently change production hosting authority.

## Relationship to Vercel failover work

Render remains the primary production authority.

Any Vercel failover work is contingency architecture only until explicitly activated and proven. Its existence must not cause agents to treat Vercel as current production, change canonical production claims, or perform a domain cutover without explicit authorization and controlled evidence.

If Render capacity becomes available again, prefer the normal Render path unless a separately approved hosting decision changes the architecture.

## Required evidence record after a production action

Record at minimum:

- GitHub main SHA;
- candidate/merge SHA;
- Render workspace;
- Render service;
- Render deploy identifier;
- deploy status;
- release identity returned by `/api/health`;
- routes smoked;
- observed errors/warnings;
- rollback state;
- timestamp;
- operator/agent;
- remaining blockers.

Never record `production verified` without enough evidence for another engineer to independently reproduce the conclusion.

## Source

This runbook is based on Render's official MCP documentation supplied on 2026-08-25. The hosted endpoint and setup commands above should be rechecked against current Render documentation if they later stop working or Render changes its MCP interface.
