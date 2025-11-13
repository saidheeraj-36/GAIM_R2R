# Review-to-Revenue (R2R)

Review-to-Revenue (R2R) turns raw customer reviews into objection-driven creative packs using Google Gemini 1.5 Flash. Paste a CSV of reviews, pick your tone and channels, and export a PDF-ready creative pack that your team can ship.

## Features

- ✨ **Objection Heatmap** – Clustered objections with frequency, severity, and verbatim quotes.
- 🧠 **Claims & Proof Cards** – Headline + subheadline copy grounded in real customer language.
- 📦 **Channel Packs** – Meta ads, reels scripts, email flows, and landing page copy. Only the channels you pick will appear.
- 🖨️ **One-click PDF Export** – Capture the generated pack into an A4 PDF using html2canvas + jsPDF.
- ⚙️ **Extendable Architecture** – No database now, but the structure supports dropping in persistence later.

## Tech Stack

- [Next.js 14 App Router](https://nextjs.org/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Gemini 1.5 Flash](https://ai.google.dev/) via `@google/generative-ai`
- [html2canvas](https://github.com/niklasvh/html2canvas) + [jsPDF](https://github.com/parallax/jsPDF) for PDF export

## Getting Started Locally

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Add environment variables**
   - Create `.env.local` in the project root:
     ```bash
     echo "GEMINI_API_KEY=your-key" > .env.local
     ```
     Replace `your-key` with the provided key.
3. **Run the dev server**
   ```bash
   npm run dev
   ```
4. Visit [http://localhost:3000](http://localhost:3000) to access the landing page. Use the CTA to open `/generate`.

### Connecting the pieces

- **UI ➜ API**: `/generate` calls `/api/generate` with `{ brand, product, tone, channels, csv }`.
- **API ➜ Gemini**: The API route validates inputs, parses CSV (ignores rating column, max 300 rows), and calls Gemini 1.5 Flash with a JSON-only prompt.
- **Gemini ➜ UI**: If Gemini returns valid JSON, the UI renders the heatmap, proof cards, and selected channel packs. Non-JSON responses are bubbled up with a readable error and raw payload for debugging.
- **PDF Export**: The output section is wrapped in a ref and exported using html2canvas + jsPDF into an A4 PDF.

### Scope for improvement

- 🔐 **Authentication & Quotas** – Add auth + rate limiting for production teams or client workspaces.
- 💾 **Persistence** – Introduce a database (e.g., Prisma + Postgres) to save review uploads and generated packs.
- 📊 **Analytics** – Track objection trends over time and compare across product lines.
- 🤖 **Post-processing** – Auto-trim generations to character limits and run toxicity checks before display.
- 🧩 **Integrations** – Pipe assets directly into ad managers, ESPs, or Notion docs.

## Deploying to Vercel

1. Push this repository to GitHub.
2. Create a new project in [Vercel](https://vercel.com/) and import the repo.
3. In the **Environment Variables** section, add `GEMINI_API_KEY` with your Gemini key.
4. Deploy. Vercel will run `npm install` and `npm run build` automatically.

> **Note:** The free tier of Gemini enforces quotas. Handle errors gracefully when you start seeing `429` responses.
