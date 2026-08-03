import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { CaseRoom } from "@/lib/repositories/case-repository";

function ascii(value: unknown) {
  return String(value ?? "Not recorded").normalize("NFKD").replace(/[^\x20-\x7E]/g, "?");
}

function wrap(value: unknown, max = 94) {
  const words = ascii(value).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= max) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function buildCasePacketPdf(input: {
  organizationName: string;
  room: CaseRoom;
  packet: CaseRoom["packets"][number];
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [612, 792];
  let page = pdf.addPage(pageSize);
  let y = 748;

  function nextPage() {
    page = pdf.addPage(pageSize);
    y = 748;
  }

  function line(value: unknown, options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {}) {
    const font = options.font ?? regular;
    const size = options.size ?? 9;
    const gap = options.gap ?? size + 4;
    for (const text of wrap(value, size >= 14 ? 70 : 96)) {
      if (y < 58) nextPage();
      page.drawText(text, { x: 46, y, size, font, color: options.color ?? rgb(0.1, 0.14, 0.2) });
      y -= gap;
    }
  }

  function divider() {
    if (y < 65) nextPage();
    page.drawLine({ start: { x: 46, y }, end: { x: 566, y }, thickness: 0.7, color: rgb(0.8, 0.83, 0.86) });
    y -= 16;
  }

  const { room, packet } = input;
  const generatedAt = packet.generatedAt ? new Date(packet.generatedAt) : new Date();
  pdf.setTitle(`${room.case.caseLabel} packet - ${room.case.patientName}`);
  pdf.setAuthor(input.organizationName);
  pdf.setSubject("ClinicOS manual case packet cover sheet");
  pdf.setKeywords(["ClinicOS", "manual packet", `case:${room.case.id}`, `packet:${packet.id}`]);
  pdf.setCreationDate(generatedAt);

  line("CLINICOS MANUAL CASE PACKET", { font: bold, size: 8, color: rgb(0.04, 0.44, 0.48), gap: 16 });
  line(`${room.case.caseLabel} | ${packet.type.replaceAll("_", " ")}`, { font: bold, size: 21, gap: 28 });
  line(`${input.organizationName} | Generated ${generatedAt.toISOString()}`, { size: 8, color: rgb(0.38, 0.42, 0.48), gap: 18 });
  divider();
  line(`Patient: ${room.case.patientName} | MRN: ${room.case.patientMrn}`, { font: bold, size: 10 });
  line(`Claim: ${room.case.claimNumber} | Carrier: ${room.case.carrier}`);
  line(`Accident date: ${room.case.accidentDate.slice(0, 10)} | Case status: ${room.case.status}`);
  line(`Packet: ${packet.id} | Status: ${packet.status} | Required readiness: ${packet.readiness}%`);
  y -= 8;

  line("CASE FACTS", { font: bold, size: 11, color: rgb(0.04, 0.44, 0.48), gap: 18 });
  line(`Injured body parts: ${room.case.injuredBodyParts.join(", ") || "Not recorded"}`);
  line(`Diagnosis codes: ${room.case.diagnosisCodes.join(", ") || "Not recorded"}`);
  line(`Treatment plan: ${room.case.treatmentPlan ?? "Not recorded"}`);
  line(`Authorization: ${room.case.authorizationStatus ?? "Not recorded"}`);
  line(`IME: ${room.case.imeStatus ?? "Not recorded"}`);
  if (room.case.caseType === "workers_comp") {
    line(`Work status: ${room.case.workStatus ?? "Not recorded"} | Return-to-work: ${room.case.returnToWorkStatus ?? "Not recorded"}`);
  } else {
    line(`Policy: ${room.case.policyNumber ?? "Not recorded"} | Assignment of benefits: ${room.case.assignmentBenefitsStatus ?? "Not recorded"}`);
  }

  divider();
  line("REVIEWED CHECKLIST", { font: bold, size: 11, color: rgb(0.04, 0.44, 0.48), gap: 18 });
  for (const item of packet.checklist) {
    line(`${item.complete ? "[COMPLETE]" : "[MISSING]"} ${item.label}${item.required ? " (required)" : " (optional)"}`, { font: item.complete ? regular : bold, size: 9 });
    if (item.note) line(`Review note: ${item.note}`, { size: 8, color: rgb(0.38, 0.42, 0.48), gap: 12 });
  }

  divider();
  line("LINKED DOCUMENT LEDGER", { font: bold, size: 11, color: rgb(0.04, 0.44, 0.48), gap: 18 });
  if (!room.documents.length) line("No documents are linked to this case. This packet should not be transmitted until required evidence is attached and reviewed.");
  for (const document of room.documents) {
    line(`${document.name} | ${document.originalFileName} | ${document.reviewStatus} | ${document.linkStatus}`, { size: 8 });
  }

  divider();
  line("MANUAL FALLBACK NOTICE", { font: bold, size: 10, color: rgb(0.72, 0.28, 0.08), gap: 17 });
  line("This artifact is a manually generated cover sheet and checklist. ClinicOS did not electronically submit it to a carrier, attorney, payer, clearinghouse, or government system. Authorized staff must validate the destination, required forms, included records, consent, and delivery confirmation before external transmission.", { size: 8, color: rgb(0.36, 0.39, 0.44), gap: 11 });
  line("Patient-level financial records are intentionally excluded because they have not been reviewed and attributed to this legal case.", { size: 8, color: rgb(0.36, 0.39, 0.44), gap: 11 });

  const pages = pdf.getPages();
  pages.forEach((current, index) => {
    current.drawText(`ClinicOS | ${room.case.id} | ${packet.id} | Page ${index + 1} of ${pages.length}`, { x: 46, y: 24, size: 7, font: regular, color: rgb(0.5, 0.54, 0.59) });
  });
  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}
