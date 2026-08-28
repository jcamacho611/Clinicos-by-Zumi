import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";
import { requireClinicSession } from "@/lib/auth/session";

export default async function PersonalHomePage() {
  await requireClinicSession();
  return <PublicLivingGateway personalExperience />;
}
