"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, ChevronDown, MapPin, Network, PanelsTopLeft } from "lucide-react";
import type { ResolvedNetworkContext } from "@/lib/network-context";

function workspaceFromPath(pathname: string) {
  return pathname.split("/").filter(Boolean)[0] ?? "dashboard";
}

export function NetworkContextSelector({ resolved }: { resolved: ResolvedNetworkContext }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const currentWorkspace = workspaceFromPath(pathname);
  const selectedLocationId = resolved.context.locationId ?? "";
  const selectedDepartmentId = resolved.context.departmentId ?? "";

  const departments = useMemo(() => {
    if (!selectedLocationId) return resolved.options.departments;
    return resolved.options.departments.filter((entry) => !entry.parentId || entry.parentId === selectedLocationId);
  }, [resolved.options.departments, selectedLocationId]);

  async function updateContext(patch: Record<string, string | null>) {
    setError(null);
    const response = await fetch("/api/context", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId: resolved.context.organizationId, ...patch }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Context could not be updated.");
  }

  function commit(patch: Record<string, string | null>, navigateTo?: string) {
    startTransition(async () => {
      try {
        await updateContext(patch);
        setOpen(false);
        if (navigateTo) router.push(navigateTo);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Context could not be updated.");
      }
    });
  }

  const currentWorkspaceLabel =
    resolved.options.workspaces.find((workspace) => workspace.id === currentWorkspace)?.label ?? "Workspace";
  const currentLocationLabel =
    resolved.options.locations.find((location) => location.id === selectedLocationId)?.label ?? "All locations";

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-3 border border-white/12 bg-white/[.04] px-3 py-2.5 text-left transition hover:bg-white/[.07]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="grid size-8 shrink-0 place-items-center bg-[#1677a8] text-white"><Network className="size-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-white">{resolved.options.organization.label}</span>
          <span className="block truncate text-[10px] text-white/45">{currentLocationLabel} · {currentWorkspaceLabel}</span>
        </span>
        <ChevronDown className={`size-4 text-white/35 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 border border-white/12 bg-[#0d2443] p-3 shadow-2xl">
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.18em] text-[#43d9ff]"><Network className="size-3" /> Context</div>
            <p className="mt-1 text-[10px] leading-4 text-white/45">
              Klinikos → Network → Organization → Location → Department → Workspace
            </p>
          </div>

          <label className="mt-3 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-white/38"><Building2 className="size-3" /> Organization</span>
            <span className="block w-full border border-white/10 bg-white/[.04] px-2.5 py-2 text-[11px] font-semibold text-white/80">{resolved.options.organization.label}</span>
          </label>

          <label className="mt-3 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-white/38"><MapPin className="size-3" /> Location</span>
            <select
              className="w-full border border-white/10 bg-[#102b4f] px-2.5 py-2 text-[11px] font-semibold text-white outline-none"
              disabled={pending}
              onChange={(event) => commit({ locationId: event.target.value || null, departmentId: null, workspaceId: currentWorkspace })}
              value={selectedLocationId}
            >
              <option value="">All locations</option>
              {resolved.options.locations.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[.14em] text-white/38">Department</span>
            <select
              className="w-full border border-white/10 bg-[#102b4f] px-2.5 py-2 text-[11px] font-semibold text-white outline-none"
              disabled={pending}
              onChange={(event) => commit({ departmentId: event.target.value || null, workspaceId: currentWorkspace })}
              value={selectedDepartmentId}
            >
              <option value="">All departments</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.label}</option>)}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-white/38"><PanelsTopLeft className="size-3" /> Workspace</span>
            <select
              className="w-full border border-white/10 bg-[#102b4f] px-2.5 py-2 text-[11px] font-semibold text-white outline-none"
              disabled={pending}
              onChange={(event) => {
                const workspaceId = event.target.value;
                if (workspaceId) commit({ workspaceId }, `/${workspaceId}`);
              }}
              value={currentWorkspace}
            >
              {resolved.options.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.label}</option>)}
            </select>
          </label>

          {!resolved.options.networkSwitchingAvailable ? (
            <p className="mt-3 border-t border-white/10 pt-3 text-[9px] leading-4 text-white/35">
              Network switching stays locked until network membership is a persisted, audited tenant relationship.
            </p>
          ) : null}
          {error ? <p className="mt-2 text-[9px] leading-4 text-rose-300">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
