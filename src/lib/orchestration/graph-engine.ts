export type GraphNodeKind = "person" | "organization" | "clinic" | "provider" | "patient" | "credential" | "course" | "competency" | "availability" | "grid" | "opportunity" | "appointment" | "encounter" | "referral" | "result" | "document" | "task" | "transaction" | "payment" | "claim" | "resource";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  fromId: string;
  toId: string;
  type: string;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
};

export type GraphSnapshot = { nodes: GraphNode[]; edges: GraphEdge[] };

export function neighbors(graph: GraphSnapshot, nodeId: string, edgeTypes?: readonly string[]) {
  const allowed = edgeTypes ? new Set(edgeTypes) : null;
  const edges = graph.edges.filter((edge) =>
    (!allowed || allowed.has(edge.type)) && (edge.fromId === nodeId || edge.toId === nodeId),
  );
  const ids = new Set(edges.map((edge) => edge.fromId === nodeId ? edge.toId : edge.fromId));
  return graph.nodes.filter((node) => ids.has(node.id));
}

export function shortestPath(graph: GraphSnapshot, startId: string, goal: (node: GraphNode) => boolean) {
  const queue: Array<{ id: string; path: string[] }> = [{ id: startId, path: [startId] }];
  const seen = new Set<string>([startId]);
  while (queue.length) {
    const current = queue.shift()!;
    const node = graph.nodes.find((entry) => entry.id === current.id);
    if (node && goal(node)) return current.path.map((id) => graph.nodes.find((entry) => entry.id === id)).filter(Boolean) as GraphNode[];
    for (const neighbor of neighbors(graph, current.id)) {
      if (seen.has(neighbor.id)) continue;
      seen.add(neighbor.id);
      queue.push({ id: neighbor.id, path: [...current.path, neighbor.id] });
    }
  }
  return [];
}

export function scopeGraphToOrganization(graph: GraphSnapshot, organizationId: string) {
  const nodes = graph.nodes.filter((node) => !node.organizationId || node.organizationId === organizationId);
  const ids = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => ids.has(edge.fromId) && ids.has(edge.toId) && (!edge.organizationId || edge.organizationId === organizationId));
  return { nodes, edges };
}
