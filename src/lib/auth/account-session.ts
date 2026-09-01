import "server-only";

import type { PersonAccountSession } from "@/lib/auth/account-types";

export const ACCOUNT_SESSION_COOKIE_NAME = "klinikos_person_session";
export const ACCOUNT_SESSION_TTL_SECONDS = 60 * 60 * 8;

export type { PersonAccountSession };
