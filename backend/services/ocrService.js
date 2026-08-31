/**
 * ocrService.js
 *
 * Screen 5 (DOCUMENT SCANNING) needs OCR to turn a photographed/scanned
 * prescription, lab report, or discharge summary into structured data.
 *
 * This is a MOCK extractor: it does not run real OCR. It simulates the
 * shape of what a production OCR/NLU pipeline (e.g. Tesseract, Google
 * Document AI, AWS Textract, or a fine-tuned medical-document parser)
 * would return, keyed off the declared doc_type, so the rest of the app
 * (review screen, doctor timeline, drug-interaction checks) has something
 * real to render against.
 *
 * SWAP-IN POINT: replace `runOcr()` body with a real OCR call. Keep the
 * same return shape so nothing else needs to change.
 */

function runOcr(docType, originalFilename) {
  const base = {
    confidence: 0.86,
    processedAt: new Date().toISOString(),
    sourceFile: originalFilename,
  };

  switch (docType) {
    case "prescription":
      return {
        ...base,
        documentType: "prescription",
        doctorName: "Dr. (extracted)",
        date: null,
        medications: [
          { name: "(extracted medicine name)", dosage: "(extracted dosage)", frequency: "(extracted frequency)" },
        ],
        diagnosis: "(extracted diagnosis, if present)",
        notes: "Extraction is a placeholder — connect a real OCR/NLU provider in ocrService.js to populate this from the actual image.",
      };
    case "lab_report":
      return {
        ...base,
        documentType: "lab_report",
        labName: "(extracted lab name)",
        date: null,
        tests: [
          { name: "(extracted test name)", value: null, unit: null, referenceRange: null, abnormal: false },
        ],
        notes: "Extraction is a placeholder — connect a real OCR/NLU provider in ocrService.js to populate this from the actual image.",
      };
    case "discharge_summary":
      return {
        ...base,
        documentType: "discharge_summary",
        hospitalName: "(extracted hospital name)",
        admissionDate: null,
        dischargeDate: null,
        diagnosis: "(extracted diagnosis)",
        proceduresDone: [],
        dischargeMedications: [],
        notes: "Extraction is a placeholder — connect a real OCR/NLU provider in ocrService.js to populate this from the actual image.",
      };
    default:
      return {
        ...base,
        documentType: "other",
        rawTextPreview: "(extracted raw text would appear here)",
      };
  }
}

module.exports = { runOcr };
