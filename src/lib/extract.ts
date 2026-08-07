// Browser-only text extraction helpers. Import dynamically from event handlers.
export type ExtractResult = { text: string; pages: number; kind: string };

async function pdfToText(file: File): Promise<ExtractResult> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ") + "\n";
  }
  return { text: text.trim(), pages: doc.numPages, kind: "PDF" };
}

export async function extractText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return pdfToText(file);
  }
  if (file.type.startsWith("audio/")) {
    return { text: "", pages: 0, kind: "Audio" };
  }
  if (file.type.startsWith("image/")) {
    return { text: "", pages: 1, kind: "Scan" };
  }
  const text = await file.text();
  return {
    text: text.replace(/\u0000/g, "").trim(),
    pages: Math.max(1, Math.ceil(text.length / 3000)),
    kind: name.endsWith(".csv") || name.endsWith(".xlsx") ? "Table" : "Text",
  };
}