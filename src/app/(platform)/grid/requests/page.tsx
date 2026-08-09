import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Requests" };

export default function GridRequestsPage() {
  return <GridRoute view="requests" />;
}
