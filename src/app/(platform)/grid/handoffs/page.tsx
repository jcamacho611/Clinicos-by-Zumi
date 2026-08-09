import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Handoffs" };

export default function GridHandoffsPage() {
  return <GridRoute view="handoffs" />;
}
