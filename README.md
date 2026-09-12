# Insight Graph 🕸️ shield

> **Enterprise Compliance Intelligence Platform powered by GraphRAG**

Insight Graph is a production-grade enterprise compliance and risk intelligence platform. By unifying **Graph Retrieval-Augmented Generation (GraphRAG)** with vector similarity search, Insight Graph ingests complex corporate documents, builds dynamic knowledge graphs, detects policy non-compliance, and delivers accurate, cited answers to compliance queries while strictly guarding against hallucinations.

---

## 🚀 Key Features

- **🌐 GraphRAG Intelligence Engine**: Merges graph traversals with vector similarity search to map relationships between entities (People, Policies, Laws, Vendors, Departments, Invoices).
- **📊 Interactive Knowledge Graph Visualizer**: Fully interactive node-edge graph renderer with zooming, searching, node filtering by entity type, and depth inspection.
- **📄 Multi-Format Ingestion Pipeline**: Ingests PDFs, Excel, CSVs, Images (OCR), and Audio transcripts with real-time parsing progress tracking.
- **🛡️ Hallucination Guard & Citation System**: Verifies evidence confidence before answering. Every insight includes line-level citations, source document previews, and page confidence scores.
- **📈 Compliance & Risk Analytics**: Enterprise dashboard tracking overall compliance scores, top policy violations, high-risk departments, and violation timelines.
- **💬 Conversational Audit Assistant**: ChatGPT-style interface with streaming AI responses, suggested prompts, graph context tracking, and exportable audit logs.

---

## 🛠️ Tech Stack

### Frontend & App Framework
- **Framework**: [TanStack Start](https://tanstack.com/start) / React 19 / TypeScript
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS v4, Framer Motion, Radix UI (shadcn/ui), Lucide Icons
- **Data Visualization**: Recharts, Custom Canvas Graph Rendering

### AI & Data Engine
- **AI SDK**: Vercel AI SDK (`@ai-sdk/react`), Gemini Pro / OpenAI-compatible models
- **Vector & Data Storage**: Supabase Vector / Qdrant, Neo4j Graph DB
- **Document Processing**: `pdfjs-dist`, `xlsx`, Tesseract OCR, Speech-to-Text

---

## 🏗️ System Architecture & GraphRAG Flow

```
                                  ┌──────────────────────┐
                                  │ Multi-Format Ingest  │
                                  │  (PDF, Excel, Audio) │
                                  └──────────┬───────────┘
                                             │
                                  ┌──────────▼───────────┐
                                  │ Entity & Relation    │
                                  │ Extraction (Gemini)  │
                                  └─────┬──────────┬─────┘
                                        │          │
                     ┌──────────────────┘          └──────────────────┐
                     ▼                                                ▼
       ┌───────────────────────────┐                    ┌───────────────────────────┐
       │     Knowledge Graph       │                    │      Vector Database      │
       │      (Neo4j Engine)       │                    │    (Embeddings Search)    │
       └─────────────┬─────────────┘                    └─────────────┬─────────────┘
                     │                                                │
                     └──────────────────┐          ┌──────────────────┘
                                        ▼          ▼
                                 ┌───────────────────────┐
                                 │   GraphRAG Retrieval  │
                                 │  (Hybrid Vector+Graph)│
                                 └──────────┬────────────┘
                                            │
                                 ┌──────────▼────────────┐
                                 │ Hallucination Guard & │
                                 │ Citation Generator    │
                                 └──────────┬────────────┘
                                            │
                                 ┌──────────▼────────────┐
                                 │ Interactive Response  │
                                 │  & Audit Assistant    │
                                 └───────────────────────┘
```

---

## 📁 Repository Structure

```
sentient-graph/
├── src/
│   ├── components/         # Reusable UI components (Graph Viewer, Ingest, Charts)
│   ├── hooks/              # Custom React hooks & state management
│   ├── integrations/       # Supabase, Vector DB, and Neo4j connectors
│   ├── lib/                # Utility helpers, API clients, and document parsers
│   ├── routes/             # App routes (TanStack Router)
│   │   ├── index.tsx       # Main Enterprise Dashboard
│   │   ├── ingest.tsx      # Multi-format Document Ingestion
│   │   ├── graph.tsx       # Interactive Knowledge Graph Explorer
│   │   ├── compliance.tsx  # Risk & Compliance Analytics
│   │   └── chat.tsx        # AI Audit Assistant Interface
│   ├── server.ts           # Server entry point
│   └── styles.css          # Global design system styles
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
└── vite.config.ts          # Vite build configuration
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm`, `pnpm`, or `bun`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/sentient-graph.git
   cd sentient-graph
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and fill in your service keys:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   OPENAI_API_KEY=your-llm-api-key
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your-password
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Deployment link: https://sentient-graph-project.vercel.app/
   Open `http://localhost:3000` (or the port specified by Vite) in your browser.

---

## 📜 Available Scripts

- `npm run dev` – Starts the development server with Vite hot reloading.
- `npm run build` – Builds the application for production.
- `npm run preview` – Previews the production build locally.
- `npm run lint` – Runs ESLint code quality checks.
- `npm run format` – Formats code with Prettier.

---

## 🔒 Security & Compliance Controls

- **Zero Hallucination Tolerance**: Responses require verified evidence confidence scores before output generation.
- **Upload Sanitization**: Client & server-side validation for file types, size limits, and sanitization.
- **Role-Based Audit Trail**: Every AI generation is traceable back to source documents, page numbers, and specific graph nodes.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
