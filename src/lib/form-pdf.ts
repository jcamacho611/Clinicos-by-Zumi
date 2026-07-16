import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { evaluateFormAnswers, type FormDefinition } from "@/lib/form-rules";

function ascii(value: unknown) {
  const text = Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value ?? "Not answered");
  return text.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?");
}

function wrap(text: string, max = 92) {
  const words = ascii(text).split(/\s+/);
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

export async function buildLockedFormPdf(input: {
  organizationName: string;
  patientName: string;
  patientMrn: string;
  templateName: string;
  templateVersion: number;
  definition: FormDefinition;
  answers: unknown;
  submissionId: string;
  completionMode: string;
  submittedAt: Date | null;
  lockedAt: Date;
  signatures: Array<{ signerType: string; signerName: string; signerRelationship: string | null; signedAt: Date; signatureHash: string }>;
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

  function line(text: string, options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {}) {
    const font = options.font ?? regular;
    const size = options.size ?? 9;
    const gap = options.gap ?? size + 4;
    for (const wrapped of wrap(text, size >= 14 ? 70 : 96)) {
      if (y < 55) nextPage();
      page.drawText(wrapped, { x: 46, y, size, font, color: options.color ?? rgb(0.12, 0.15, 0.2) });
      y -= gap;
    }
  }

  function divider() {
    if (y < 65) nextPage();
    page.drawLine({ start: { x: 46, y }, end: { x: 566, y }, thickness: 0.7, color: rgb(0.82, 0.84, 0.86) });
    y -= 16;
  }

  pdf.setTitle(`${input.templateName} - ${input.patientName}`);
  pdf.setAuthor(input.organizationName);
  pdf.setSubject("ClinicOS locked form submission artifact");
  pdf.setKeywords(["ClinicOS", "form", "locked", `submission:${input.submissionId}`]);
  pdf.setCreationDate(input.lockedAt);

  line("CLINICOS LOCKED FORM ARTIFACT", { font: bold, size: 8, color: rgb(0.05, 0.45, 0.5), gap: 16 });
  line(input.templateName, { font: bold, size: 22, gap: 28 });
  line(`${input.organizationName} | Template version ${input.templateVersion}`, { size: 9, color: rgb(0.35, 0.39, 0.45), gap: 18 });
  divider();
  line(`Patient: ${input.patientName} | MRN: ${input.patientMrn}`, { font: bold, size: 10 });
  line(`Submission: ${input.submissionId} | Completion mode: ${input.completionMode}`);
  line(`Submitted: ${input.submittedAt?.toISOString() ?? "Not recorded"} | Locked: ${input.lockedAt.toISOString()}`);
  y -= 8;

  const evaluated = evaluateFormAnswers(input.definition, input.answers);
  const answers = evaluated.answers;
  line("RESPONSES", { font: bold, size: 11, color: rgb(0.05, 0.45, 0.5), gap: 18 });
  for (const field of evaluated.visibleFields) {
    line(field.label, { font: bold, size: 9, gap: 12 });
    line(ascii(answers[field.id]), { size: 9, color: rgb(0.25, 0.29, 0.34), gap: 14 });
    y -= 3;
  }

  divider();
  line("ATTESTED SIGNATURES", { font: bold, size: 11, color: rgb(0.05, 0.45, 0.5), gap: 18 });
  for (const signature of input.signatures) {
    line(`${signature.signerType.toUpperCase()}: ${signature.signerName}${signature.signerRelationship ? ` (${signature.signerRelationship})` : ""}`, { font: bold, size: 9 });
    line(`Signed ${signature.signedAt.toISOString()} | SHA-256 ${signature.signatureHash}`,
      { size: 7, color: rgb(0.42, 0.45, 0.5), gap: 12 });
  }
  if (!input.signatures.length) line("No signature was required by this template version.");

  divider();
  line("This PDF is a generated representation of a locked ClinicOS submission. Its source answers, template version, signatures, review decisions, checksum, and custody events remain the authoritative audit record.", { size: 8, color: rgb(0.42, 0.45, 0.5), gap: 11 });

  const pages = pdf.getPages();
  pages.forEach((current, index) => {
    current.drawText(`ClinicOS | ${input.submissionId} | Page ${index + 1} of ${pages.length}`, { x: 46, y: 24, size: 7, font: regular, color: rgb(0.52, 0.55, 0.6) });
  });
  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}
