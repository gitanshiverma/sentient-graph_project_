import * as React from "react";

export type Chunk = {
  id: string;
  docId: string;
  docName: string;
  page: number;
  text: string;
  tokens: Set<string>;
};

export type EntityType =
  | "org"
  | "obligation"
  | "date"
  | "amount"
  | "control"
  | "person"
  | "topic";

export type Entity = {
  id: string;
  label: string;
  type: EntityType;
  docIds: string[];
  mentions: number;
};

export type Edge = { source: string; target: string; relation: string; weight: number };

export type PipelineStage = "queued" | "parsing" | "chunking" | "embedding" | "graphing" | "done" | "failed";

export type Doc = {
  id: string;
  name: string;
  size: number;
  kind: string;
  pages: number;
  chars: number;
  chunks: number;
  stage: PipelineStage;
  progress: number;
  error?: string;
  ingestedAt: number;
  risk: number;
};

const STOP = new Set(
  "the a an and or of to in for on with by as at from is are was were be been this that these those shall will may must not it its their our your we you they he she i if then than so such any all each other into under over out up down no nor but do does did done have has had can could should would about which who whom what when where how".split(
    " ",
  ),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function chunkText(text: string, size = 900, overlap = 120) {
  const out: string[] = [];
  if (!text) return out;
  let i = 0;
  while (i < text.length) {
    out.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}

const OBLIGATION_WORDS =
  /\b(shall|must|required to|obligated to|obliged to|may not|shall not|is responsible for|are responsible for|shall ensure|ensure that|comply with|prohibited from|agrees to|undertakes to|will not|no later than|within \d+ (?:days|business days|months))\b/i;
const AMOUNT_RE = /(?:USD|EUR|GBP|INR|\$|€|£|₹)\s?[\d,]+(?:\.\d+)?(?:\s?(?:million|bn|billion|k))?/gi;
const DATE_RE =
  /\b(?:\d{1,2}\s)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2}?,?\s?\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi;
const ORG_RE =
  /\b([A-Z][A-Za-z&.'-]+(?:\s[A-Z][A-Za-z&.'-]+){0,3}\s(?:Inc|LLC|Ltd|Limited|GmbH|Corp|Corporation|Company|Holdings|Group|Bank|Partners|Technologies|Systems)\b\.?)/g;
// Fallback: capitalised multi-word proper nouns and acronyms (e.g. "Acme Health", "IRS")
const PROPER_RE = /\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,}){1,3})\b/g;
const ACRONYM_RE = /\b([A-Z]{2,6})\b/g;
const CONTROL_RE =
  /\b(GDPR|HIPAA|SOC\s?2|ISO\s?27001|ISO\s?9001|PCI[- ]DSS|SOX|Sarbanes[- ]Oxley|CCPA|CPRA|NIST(?:\s?CSF)?|DORA|NIS2|MiFID\s?II|AML|KYC|Basel\s?III|FERPA|GLBA|CMMC|FedRAMP|HITRUST|PIPEDA|LGPD|DPDP(?:\s?Act)?|Privacy Shield|Data Protection Act)\b/gi;
const PERSON_RE = /\b(?:Mr\.|Ms\.|Mrs\.|Dr\.)\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?/g;

const PROPER_STOP = new Set(
  ["The", "This", "That", "These", "Those", "Page", "Section", "Article", "Chapter", "Table", "Figure", "Appendix", "Exhibit", "Schedule", "Annex"].map((w) =>
    w.toLowerCase(),
  ),
);
const ACRONYM_STOP = new Set(["AND", "THE", "FOR", "NOT", "ALL", "ANY", "PDF", "III", "II", "IV"]);

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.;:!?])\s+(?=[A-Z(“"']|\d)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 400);
}

export function findObligations(text: string): string[] {
  return splitSentences(text).filter((s) => OBLIGATION_WORDS.test(s));
}

function topTerms(text: string, n = 14): string[] {
  const counts = new Map<string, number>();
  for (const t of tokenize(text)) {
    if (t.length < 4) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w[0]!.toUpperCase() + w.slice(1));
}

function pushMatches(
  map: Map<string, Entity>,
  matches: string[],
  type: EntityType,
  docId: string,
  cap = 40,
) {
  for (const raw of matches.slice(0, cap)) {
    const label = raw.trim().replace(/\s+/g, " ").slice(0, 90);
    if (!label) continue;
    const id = `${type}:${label.toLowerCase()}`;
    const existing = map.get(id);
    if (existing) {
      existing.mentions += 1;
      if (!existing.docIds.includes(docId)) existing.docIds.push(docId);
    } else {
      map.set(id, { id, label, type, docIds: [docId], mentions: 1 });
    }
  }
}

export function extractEntities(text: string, docId: string, map: Map<string, Entity>) {
  const orgs = text.match(ORG_RE) ?? [];
  pushMatches(map, orgs, "org", docId);
  pushMatches(map, text.match(CONTROL_RE) ?? [], "control", docId);
  pushMatches(map, text.match(DATE_RE) ?? [], "date", docId, 20);
  pushMatches(map, text.match(AMOUNT_RE) ?? [], "amount", docId, 20);
  pushMatches(map, text.match(PERSON_RE) ?? [], "person", docId, 20);
  pushMatches(map, findObligations(text), "obligation", docId, 40);

  // Fallback org detection so the graph is never empty for ordinary documents.
  if (orgs.length < 3) {
    const proper = (text.match(PROPER_RE) ?? []).filter(
      (m) => !PROPER_STOP.has(m.split(" ")[0]!.toLowerCase()),
    );
    const acronyms = (text.match(ACRONYM_RE) ?? []).filter((a) => !ACRONYM_STOP.has(a));
    pushMatches(map, dedupeByFrequency(proper, 8), "org", docId, 8);
    pushMatches(map, dedupeByFrequency(acronyms, 6), "org", docId, 6);
  }

  pushMatches(map, topTerms(text), "topic", docId, 14);
}

function dedupeByFrequency(items: string[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

export function buildEdges(entities: Entity[]): Edge[] {
  const edges: Edge[] = [];
  const byDoc = new Map<string, Entity[]>();
  for (const e of entities) {
    for (const d of e.docIds) {
      const list = byDoc.get(d) ?? [];
      list.push(e);
      byDoc.set(d, list);
    }
  }
  const seen = new Map<string, Edge>();
  for (const list of byDoc.values()) {
    let anchors = list.filter((e) => e.type === "org" || e.type === "control").slice(0, 8);
    if (anchors.length === 0) anchors = list.filter((e) => e.type === "topic").slice(0, 5);
    const anchorIds = new Set(anchors.map((a) => a.id));
    const rest = list.filter((e) => !anchorIds.has(e.id)).slice(0, 26);
    for (const a of anchors) {
      for (const b of rest) {
        const key = `${a.id}->${b.id}`;
        const relation =
          b.type === "obligation"
            ? "obliged_by"
            : b.type === "date"
              ? "effective_on"
              : b.type === "amount"
                ? "valued_at"
                : b.type === "topic"
                  ? "mentions"
                  : "involves";
        const found = seen.get(key);
        if (found) found.weight += 1;
        else seen.set(key, { source: a.id, target: b.id, relation, weight: 1 });
      }
      for (const b of anchors) {
        if (a.id === b.id) continue;
        const key = `${a.id}~${b.id}`;
        const rev = `${b.id}~${a.id}`;
        if (seen.has(rev)) continue;
        seen.set(key, { source: a.id, target: b.id, relation: "co_governs", weight: 1 });
      }
    }
  }
  edges.push(...seen.values());
  return edges;
}

export function riskScore(text: string) {
  const t = text.toLowerCase();
  const flags = [
    "penalty",
    "terminate",
    "breach",
    "indemnif",
    "liabilit",
    "non-compliance",
    "audit",
    "sanction",
    "shall not",
  ];
  const hits = flags.reduce((n, f) => n + (t.split(f).length - 1), 0);
  const obligations = findObligations(text).length;
  const base = Math.round((hits / Math.max(1, text.length / 4000)) * 12);
  return Math.max(5, Math.min(100, base + Math.min(35, obligations * 3)));
}

type State = {
  docs: Doc[];
  chunks: Chunk[];
  entities: Entity[];
  edges: Edge[];
};

type Ctx = State & {
  ingest: (files: File[]) => Promise<void>;
  reset: () => void;
  search: (query: string, k?: number) => { chunk: Chunk; score: number }[];
};

const CorpusContext = React.createContext<Ctx | null>(null);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STORAGE_KEY = "lumen-corpus-v1";

function loadState(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      docs: Doc[];
      chunks: (Omit<Chunk, "tokens"> & { tokens: string[] })[];
      entities: Entity[];
      edges: Edge[];
    };
    return {
      docs: parsed.docs ?? [],
      entities: parsed.entities ?? [],
      edges: parsed.edges ?? [],
      chunks: (parsed.chunks ?? []).map((c) => ({ ...c, tokens: new Set(c.tokens) })),
    };
  } catch {
    return null;
  }
}

function saveState(state: State) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        chunks: state.chunks.map((c) => ({ ...c, tokens: [...c.tokens] })),
      }),
    );
  } catch {
    /* quota exceeded — keep working in memory */
  }
}

export function CorpusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>({
    docs: [],
    chunks: [],
    entities: [],
    edges: [],
  });
  const entityMap = React.useRef(new Map<string, Entity>());
  const hydrated = React.useRef(false);

  // Restore after mount so SSR and client markup match.
  React.useEffect(() => {
    const saved = loadState();
    if (saved) {
      entityMap.current = new Map(saved.entities.map((e) => [e.id, e]));
      setState(saved);
    }
    hydrated.current = true;
  }, []);

  React.useEffect(() => {
    if (!hydrated.current) return;
    saveState(state);
  }, [state]);

  const patchDoc = React.useCallback((id: string, patch: Partial<Doc>) => {
    setState((s) => ({ ...s, docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  }, []);

  const ingest = React.useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const doc: Doc = {
          id,
          name: file.name,
          size: file.size,
          kind: "…",
          pages: 0,
          chars: 0,
          chunks: 0,
          stage: "queued",
          progress: 4,
          ingestedAt: Date.now(),
          risk: 0,
        };
        setState((s) => ({ ...s, docs: [doc, ...s.docs] }));

        try {
          patchDoc(id, { stage: "parsing", progress: 18 });
          await wait(120);
          const { extractText } = await import("./extract");
          const parsed = await extractText(file);
          if (!parsed.text) {
            throw new Error(
              parsed.kind === "Audio"
                ? "No transcript could be produced from this audio file."
                : parsed.kind === "Scan"
                  ? "No selectable text found — this scan needs OCR."
                  : "No readable text found in this file.",
            );
          }

          patchDoc(id, {
            stage: "chunking",
            progress: 46,
            kind: parsed.kind,
            pages: parsed.pages,
            chars: parsed.text.length,
          });
          await wait(160);
          const parts = chunkText(parsed.text);
          const newChunks: Chunk[] = parts.map((text, i) => ({
            id: `${id}-c${i}`,
            docId: id,
            docName: file.name,
            page: Math.min(parsed.pages || 1, Math.floor((i / Math.max(1, parts.length)) * (parsed.pages || 1)) + 1),
            text,
            tokens: new Set(tokenize(text)),
          }));

          patchDoc(id, { stage: "embedding", progress: 72, chunks: newChunks.length });
          await wait(220);

          patchDoc(id, { stage: "graphing", progress: 90 });
          extractEntities(parsed.text, id, entityMap.current);
          const entities = [...entityMap.current.values()];
          const edges = buildEdges(entities);
          await wait(160);

          setState((s) => ({
            ...s,
            chunks: [...s.chunks, ...newChunks],
            entities,
            edges,
            docs: s.docs.map((d) =>
              d.id === id
                ? { ...d, stage: "done", progress: 100, risk: riskScore(parsed.text) }
                : d,
            ),
          }));
        } catch (err) {
          patchDoc(id, {
            stage: "failed",
            progress: 100,
            error: err instanceof Error ? err.message : "Ingestion failed.",
          });
        }
      }
    },
    [patchDoc],
  );

  const reset = React.useCallback(() => {
    entityMap.current = new Map();
    setState({ docs: [], chunks: [], entities: [], edges: [] });
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const search = React.useCallback(
    (query: string, k = 4) => {
      const q = tokenize(query);
      if (!q.length) return [];
      return state.chunks
        .map((chunk) => {
          let score = 0;
          for (const t of q) if (chunk.tokens.has(t)) score += 1;
          return { chunk, score: score / q.length };
        })
        .filter((r) => r.score > 0.15)
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
    },
    [state.chunks],
  );

  const value = React.useMemo(() => ({ ...state, ingest, reset, search }), [state, ingest, reset, search]);

  return <CorpusContext.Provider value={value}>{children}</CorpusContext.Provider>;
}

export function useCorpus() {
  const ctx = React.useContext(CorpusContext);
  if (!ctx) throw new Error("useCorpus must be used inside CorpusProvider");
  return ctx;
}