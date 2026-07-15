import { parseDocumentBoolean, parseDocumentTags } from "@/lib/document-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function parseDocumentUploadRequest(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new NetworkAccessError("A document file is required.", 400);
  return {
    metadata: {
      patientId: optionalString(formData.get("patientId")),
      encounterId: optionalString(formData.get("encounterId")),
      referralId: optionalString(formData.get("referralId")),
      caseType: optionalString(formData.get("caseType")),
      caseId: optionalString(formData.get("caseId")),
      categoryId: optionalString(formData.get("categoryId")),
      name: optionalString(formData.get("name")) ?? file.name,
      description: optionalString(formData.get("description")),
      tags: parseDocumentTags(formData.get("tags")),
      sourceType: optionalString(formData.get("sourceType")) ?? "upload",
      requestPatientRelease: parseDocumentBoolean(formData.get("requestPatientRelease")),
      expiresAt: optionalString(formData.get("expiresAt")),
    },
    file: { buffer: Buffer.from(await file.arrayBuffer()), fileName: file.name, mimeType: file.type, sizeBytes: file.size },
  };
}

export async function parseDocumentVersionRequest(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new NetworkAccessError("A replacement document file is required.", 400);
  return {
    metadata: {
      name: optionalString(formData.get("name")) ?? file.name,
      reason: optionalString(formData.get("reason")),
      sourceType: optionalString(formData.get("sourceType")) ?? "upload",
    },
    file: { buffer: Buffer.from(await file.arrayBuffer()), fileName: file.name, mimeType: file.type, sizeBytes: file.size },
  };
}
