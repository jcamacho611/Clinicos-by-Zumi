import type { Metadata } from "next";

/**
 * Canonical metadata for authenticated, patient-private, setup, and access-control
 * surfaces. This is indexing policy only; it never replaces authentication or RBAC.
 */
export const PRIVATE_PAGE_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};
