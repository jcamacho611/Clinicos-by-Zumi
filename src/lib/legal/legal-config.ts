import "server-only";

export interface LegalPublicConfig {
  entityName: string;
  legalContactEmail: string;
  governingLaw: string;
  forum: string;
}

export function isLegalGateEnforcementEnabled() {
  return process.env.LEGAL_GATE_ENFORCEMENT_ENABLED === "true";
}

export function isEntryGateEnforcementEnabled() {
  return process.env.KLINIKOS_ENTRY_GATE_ENFORCEMENT_ENABLED === "true";
}

function configuredValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getLegalConfigurationStatus() {
  const entityName = configuredValue("KLINIKOS_LEGAL_ENTITY_NAME");
  const governingLaw = configuredValue("KLINIKOS_GOVERNING_LAW");
  const forum = configuredValue("KLINIKOS_LEGAL_FORUM");
  const legalContactEmail = configuredValue("KLINIKOS_LEGAL_CONTACT_EMAIL") ?? "hello@klinikos.io";
  const missing = [
    !entityName ? "KLINIKOS_LEGAL_ENTITY_NAME" : null,
    !governingLaw ? "KLINIKOS_GOVERNING_LAW" : null,
    !forum ? "KLINIKOS_LEGAL_FORUM" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    ready: missing.length === 0,
    missing,
    config: {
      entityName: entityName ?? "Klinikos (contracting entity configuration pending)",
      legalContactEmail,
      governingLaw: governingLaw ?? "the governing law stated in the applicable signed business agreement or mandatory local law",
      forum: forum ?? "the forum stated in the applicable signed business agreement or otherwise required by applicable law",
    } satisfies LegalPublicConfig,
  };
}

export function assertLegalExecutionConfigured(): LegalPublicConfig {
  const status = getLegalConfigurationStatus();
  if (!status.ready) {
    throw new Error(`Legal execution configuration is incomplete: ${status.missing.join(", ")}`);
  }
  return status.config;
}
