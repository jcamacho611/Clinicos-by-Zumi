"use client";

import { useState } from "react";
import { ArrowRightLeft, LoaderCircle, Plus, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InventoryWorkspace } from "@/lib/repositories/inventory-repository";

const control = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100";
const area = "min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

async function post(body: unknown) {
  const response = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Inventory action failed.");
}

export function InventoryCreateAction({ locations, enabled }: { locations: InventoryWorkspace["locations"]; enabled: boolean }) {
  const [sku, setSku] = useState("DEMO-SUPPLY-001");
  const [name, setName] = useState("Clinical supply demo lot");
  const [category, setCategory] = useState("clinical_supply");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [lotNumber, setLotNumber] = useState("LOT-DEMO-001");
  const [expiresAt, setExpiresAt] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [reorderPoint, setReorderPoint] = useState("3");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post({ sku, name, category, locationId: locationId || null, lotNumber: lotNumber || null, expiresAt: expiresAt ? `${expiresAt}T00:00:00.000Z` : null, quantityOnHand: Number(quantity), quantityReserved: 0, reorderPoint: Number(reorderPoint), controlledItem: false, coldChain: false }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Inventory item creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Your role can view inventory but cannot create catalog items.</p>;
  return <div className="space-y-3 p-5"><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Inventory SKU" onChange={(event) => setSku(event.target.value)} placeholder="SKU" value={sku} /><Input aria-label="Inventory item name" onChange={(event) => setName(event.target.value)} placeholder="Item name" value={name} /></div><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Inventory category" onChange={(event) => setCategory(event.target.value)} placeholder="Category" value={category} /><select aria-label="Inventory location" className={control} onChange={(event) => setLocationId(event.target.value)} value={locationId}><option value="">Unassigned location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div><div className="grid gap-3 sm:grid-cols-3"><Input aria-label="Lot number" onChange={(event) => setLotNumber(event.target.value)} placeholder="Lot number" value={lotNumber} /><Input aria-label="Expiration date" onChange={(event) => setExpiresAt(event.target.value)} type="date" value={expiresAt} /><Input aria-label="Quantity on hand" min="0" onChange={(event) => setQuantity(event.target.value)} type="number" value={quantity} /></div><div className="flex items-center justify-between gap-3"><Input aria-label="Reorder point" className="max-w-40" min="0" onChange={(event) => setReorderPoint(event.target.value)} type="number" value={reorderPoint} /><Button disabled={busy || sku.trim().length < 2 || name.trim().length < 3} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add item</Button></div>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function InventoryTransactionAction({ item, locations, patients, enabled }: { item: InventoryWorkspace["items"][number]; locations: InventoryWorkspace["locations"]; patients: InventoryWorkspace["patients"]; enabled: boolean }) {
  const [type, setType] = useState("receipt");
  const [quantity, setQuantity] = useState("1");
  const [direction, setDirection] = useState("increase");
  const [patientId, setPatientId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [note, setNote] = useState("Recorded by authorized staff with manual source evidence.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post({ action: "transaction", inventoryItemId: item.id, type, quantity: Number(quantity), direction: ["adjustment", "reconciliation"].includes(type) ? direction : undefined, note, patientId: type === "procedure_use" ? patientId || null : null, toLocationId: type === "transfer" ? toLocationId || null : null }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Inventory transaction failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-[10px] font-extrabold text-slate-700">Record transaction</summary><div className="mt-3 space-y-2"><div className="grid gap-2 sm:grid-cols-3"><select aria-label={`Transaction type for ${item.name}`} className={control} onChange={(event) => setType(event.target.value)} value={type}><option value="receipt">Receipt</option><option value="adjustment">Adjustment</option><option value="procedure_use">Procedure use</option><option value="waste">Waste</option><option value="transfer">Transfer</option><option value="recall">Recall</option><option value="reconciliation">Reconciliation</option></select><Input aria-label="Transaction quantity" min="0.001" onChange={(event) => setQuantity(event.target.value)} type="number" value={quantity} /><select aria-label="Transaction direction" className={control} disabled={!['adjustment', 'reconciliation'].includes(type)} onChange={(event) => setDirection(event.target.value)} value={direction}><option value="increase">Increase</option><option value="decrease">Decrease</option></select></div>{type === "procedure_use" && <select aria-label="Procedure use patient" className={control} onChange={(event) => setPatientId(event.target.value)} value={patientId}><option value="">Select patient if permitted</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.mrn}</option>)}</select>}{type === "transfer" && <select aria-label="Transfer destination" className={control} onChange={(event) => setToLocationId(event.target.value)} value={toLocationId}><option value="">Select destination location</option>{locations.filter((location) => location.id !== item.locationId).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>}<textarea aria-label="Inventory transaction note" className={area} onChange={(event) => setNote(event.target.value)} value={note} /><Button disabled={busy || Number(quantity) <= 0 || note.trim().length < 12 || (type === "transfer" && !toLocationId)} onClick={submit} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : type === "transfer" ? <ArrowRightLeft className="size-3.5" /> : <ReceiptText className="size-3.5" />} Save transaction</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div></details>;
}
