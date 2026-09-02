import type { ReactNode } from "react";
import { PublicHeader } from "@/components/marketing/public-header";
import { PublicTrustFooter } from "@/components/marketing/public-trust-footer";

export function PublicExperienceShell({ children, contextLabel }: { children: ReactNode; contextLabel?: string }) {
  return (
    <div className="min-h-screen bg-[var(--k-public-bg)] text-[var(--k-text)]" data-public-experience-shell="true">
      <PublicHeader contextLabel={contextLabel} />
      {children}
      <PublicTrustFooter />
    </div>
  );
}
