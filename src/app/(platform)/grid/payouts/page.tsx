import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "GRID payouts" };

export default function GridPayoutsPage() {
  return <GridRoute view="payouts" />;
}
