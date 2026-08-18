import type { ReactNode } from "react";
import { LuxeRecoveryPanel } from "@/components/clinic/luxe-recovery-panel";

export default function LuxeAcquisitionLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div className="mt-6">
        <LuxeRecoveryPanel />
      </div>
    </>
  );
}
