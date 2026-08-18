import { redirect } from "next/navigation";

/**
 * Compatibility entry for the historical Provider Network workspace.
 * The governed provider discovery surface now lives in Grid, where eligibility,
 * availability, offers, and transaction state share one authority.
 */
export default function ProviderNetworkPage() {
  redirect("/grid/providers");
}
