import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { UploadCloud, FileText, Table2, ScanLine, AudioLines, CheckCircle2, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useCorpus } from "@/lib/corpus";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ingestion")({
  head: () => ({
    meta: [
      { title: "Document Ingestion — Lumen GraphRAG" },
      {
        name: "description",
        content:
          "Upload contracts, policies and vendor lists. Lumen parses, chunks, embeds and graphs every file in the browser.",
      },
      { property: "og:title", content: "Document Ingestion — Lumen GraphRAG" },
      {
        property: "og:description",
        content: "Parse, chunk, embed and graph compliance documents.",
      },
    ],
  }),
  component: Ingestion,
});

const kinds = [
  { icon: FileText, label: "PDF / TXT" },
  { icon: Table2, label: "CSV / XLSX" },
  { icon: ScanLine, label: "Scans (OCR)" },
  { icon: AudioLines, label: "Audio (transcribed)" },
];

function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Ingestion() {
  const { docs, ingest, reset, chunks, entities } = useCorpus();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const handle = (list: FileList | null) => {
    if (!list?.length) return;
    void ingest([...list]);
  };

  const active = docs.filter((d) => d.stage !== "done" && d.stage !== "failed");
  const done = docs.filter((d) => d.stage === "done");

  return (
    <AppShell
      title="Document Ingestion"
      subtitle="PDFs, spreadsheets, text, scanned images and audio are parsed, embedded and graphed."
      action={
        <Button onClick={() => inputRef.current?.click()}>
          <UploadCloud className="size-4" /> Select files
        </Button>
      }
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.csv,.json,.xml,.html,image/*,audio/*"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />

      <section
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border bg-background px-6 py-14 text-center transition-colors ${
          dragging ? "border-foreground bg-muted" : "border-border"
        }`}
      >
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-muted">
          <UploadCloud className="size-6" />
        </span>
        <p className="text-base font-medium">Drop files here or click to browse</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Contracts, policy manuals, vendor lists, invoices, scanned pages and meeting recordings.
          Each file is chunked, embedded and turned into graph entities and relationships.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {kinds.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              <Icon className="size-3.5" /> {label}
            </span>
          ))}
        </div>
      </section>

      {docs.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-background p-6">
          <h2 className="text-sm font-semibold">Pipeline</h2>
          <ul className="mt-4 space-y-4">
            {docs.slice(0, 6).map((d) => (
              <li key={d.id}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate font-medium">{d.name}</span>
                  <span
                    className={`shrink-0 text-xs ${
                      d.stage === "failed" ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {d.stage}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      d.stage === "failed" ? "bg-destructive" : "bg-foreground"
                    }`}
                    style={{ width: `${d.progress}%` }}
                  />
                </div>
                {d.error && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="size-3.5" /> {d.error}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {active.length === 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              {chunks.length} chunks embedded · {entities.length} entities extracted
            </p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold">Corpus</h2>
            <p className="text-xs text-muted-foreground">{done.length} documents ingested</p>
          </div>
          {docs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Clear corpus
            </Button>
          )}
        </div>
        {done.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted-foreground">Nothing ingested yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Document</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Pages</th>
                <th className="px-6 py-3 font-medium">Chunks</th>
                <th className="px-6 py-3 font-medium">Risk</th>
                <th className="px-6 py-3 font-medium">Size</th>
              </tr>
            </thead>
            <tbody>
              {done.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="max-w-[280px] truncate px-6 py-3 font-medium">
                    <CheckCircle2 className="mr-2 inline size-4 text-muted-foreground" />
                    {d.name}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{d.kind}</td>
                  <td className="px-6 py-3 text-muted-foreground">{d.pages}</td>
                  <td className="px-6 py-3 text-muted-foreground">{d.chunks}</td>
                  <td className="px-6 py-3 text-muted-foreground">{d.risk}</td>
                  <td className="px-6 py-3 text-muted-foreground">{bytes(d.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppShell>
  );
}