import type { Metadata } from "next";
import { EcosystemFlywheel } from "@/components/marketing/ecosystem-flywheel";

export const metadata: Metadata = {
  title: "Ecosystem | Klinikos",
  description: "See how Klinikos connects learning, readiness, opportunity, work, clinic operations, capacity, and network value.",
};

export default function KlinikosEcosystemPage() {
  return <EcosystemFlywheel />;
}
