import type { ClinicRole } from "@/lib/auth/rbac";
import type { CommercialProductKey } from "@/lib/commercial/product-catalog";

const clinicBuyerRoles = new Set<ClinicRole>(["clinic_owner", "administrator"]);
const gridProfessionalBuyerRoles = new Set<ClinicRole>(["clinic_owner", "administrator", "provider", "contractor"]);
const gridFacilityBuyerRoles = new Set<ClinicRole>(["clinic_owner", "administrator"]);

export function roleMayPurchaseCommercialProduct(role: ClinicRole, productKey: CommercialProductKey) {
  if (productKey === "clinic_operator") return clinicBuyerRoles.has(role);
  if (productKey === "grid_professional") return gridProfessionalBuyerRoles.has(role);
  if (productKey === "grid_facility") return gridFacilityBuyerRoles.has(role);
  return false;
}

export function roleMayReconcileCommercialPayment(role: ClinicRole) {
  return role === "clinic_owner" || role === "administrator";
}
