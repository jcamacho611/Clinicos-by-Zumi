import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Workspace" };

export default function GridWorkspacePage() {
  return <GridRoute view="overview" />;
}
