import "server-only";

import { deliverOutbound } from "@/lib/communications/outbound";
import type { SymphonySender } from "@/lib/company/symphony-execution";

export function createKlinikosSymphonySender(): SymphonySender {
  return (message) => deliverOutbound(message);
}
