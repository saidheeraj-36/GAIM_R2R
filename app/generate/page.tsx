"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { R2RChannel, R2RResponse } from "@/types/r2r";

const sampleCsv = `5, Absolutely love the fit and fabric!
3, Color is slightly different than photos.
1, Arrived late and customer support was slow.
4, Great value for the price.
2, Sizing runs small for me.`;

const tones = [
  "Bold", "Confident", "Friendly", "Playful", "Premium", "Empathetic"
];

const channelOptions: Array<{ id: R2RChannel; label: string; helper: string }> = [
  {
    id: "meta_ads",
    label: "Meta Ads",
    helper: "Paid social variants with hooks, primary text, and CTAs"
  },
  {
    id: "reels_scripts",
    label: "Reels Scripts",
    helper: "Short-form video beats for creators or founders"
  },
  {
    id: "email_flows",
    label: "Email Flows",
    helper: "Welcome + abandon cart flows with copy"
  },
  {
    id: "landing_page",
    label: "Landing Page",
    helper: "Hero copy, claims, proof, and FAQ"
  }
];

interface FetchError {
  error: string;
  raw?: string;
}

export default function GeneratePage() {
  const [brand, setBrand] = useState("Aurora Athletica");
  const [product, setProduct] = useState("Performance leggings");
  const [tone, setTone] = useState<string>(tones[0]);
  const [channels, setChannels] = useState<R2RChannel[]>(["meta_ads", "landing_page"]);
  const [csv, setCsv] = useState(sampleCsv);
  const [result, setResult] = useState<R2RResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawDebug, setRawDebug] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const toggleChannel = useCallback((channel: R2RChannel) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  }, []);

  const hasChannelsSelected = useMemo(() => channels.length > 0, [channels]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setRawDebug(null);
    setIsGenerating(true);
    setResult(null);

    if (!csv.trim()) {
      setError("Please paste at least one review.");
      setIsGenerating(false);
      return;
    }

    if (!hasChannelsSelected) {
      setError("Select at least one channel to generate.");
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ brand, product, tone, channels, csv })
      });

      const data = (await response.json()) as R2RResponse | FetchError;

      if (!response.ok) {
        const message = "error" in data ? data.error : "Failed to generate packs.";
        setError(message);
        if ("raw" in data && data.raw) {
          setRawDebug(data.raw);
        }
        return;
      }

      setResult(data as R2RResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error while contacting the generator."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [brand, product, tone, channels, csv, hasChannelsSelected]);

  const handleExportPdf = useCallback(async () => {
    if (!exportRef.current) {
      return;
    }
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf")
    ]);

    const element = exportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#020617"
    });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imageData);
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

    let position = 0;
    let remainingHeight = imgHeight;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imageData, "PNG", 0, 0, pageWidth, imgHeight);
    } else {
      const canvasHeight = canvas.height;
      const pageCanvas = document.createElement("canvas");
      const pageContext = pageCanvas.getContext("2d");
      const pageHeightPx = (pageHeight * canvas.height) / imgHeight;

      pageCanvas.width = canvas.width;
      pageCanvas.height = pageHeightPx;

      while (remainingHeight > 0) {
        const sourceY = (position * canvas.height) / imgHeight;
        pageContext?.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageContext?.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          Math.min(pageHeightPx, canvasHeight - sourceY),
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        const pageData = pageCanvas.toDataURL("image/png");
        const renderedHeight = Math.min(pageHeight, remainingHeight);
        pdf.addImage(pageData, "PNG", 0, 0, pageWidth, renderedHeight);

        remainingHeight -= pageHeight;
        position += pageHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
        }
      }
    }

    pdf.save(`r2r-${brand.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }, [brand]);

  return (
    <main className="flex flex-1 flex-col gap-10 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Generate creative packs</h1>
          <p className="text-sm text-slate-300">
            Feed in review CSVs and craft objection-driven creative with Gemini.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => router.push("/")}>
          Back to overview
        </button>
      </header>

      <section className="card">
        <h2 className="section-title">Inputs</h2>
        <p className="mb-6 text-sm text-slate-400">
          Paste your reviews (rating,text). We cap at 300 rows and ignore the rating column.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <label className="label" htmlFor="brand">
                Brand
              </label>
              <input
                id="brand"
                className="input"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="Brand name"
              />
            </div>
            <div>
              <label className="label" htmlFor="product">
                Product
              </label>
              <input
                id="product"
                className="input"
                value={product}
                onChange={(event) => setProduct(event.target.value)}
                placeholder="Product description"
              />
            </div>
            <div>
              <label className="label" htmlFor="tone">
                Tone
              </label>
              <select
                id="tone"
                className="input"
                value={tone}
                onChange={(event) => setTone(event.target.value)}
              >
                {tones.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <span className="label">Channels</span>
            <div className="grid gap-3">
              {channelOptions.map((channelOption) => {
                const isActive = channels.includes(channelOption.id);
                return (
                  <button
                    key={channelOption.id}
                    type="button"
                    onClick={() => toggleChannel(channelOption.id)}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      isActive
                        ? "border-accent bg-slate-900/80"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-sm font-semibold text-white">
                      {channelOption.label}
                    </span>
                    <span className="mt-1 text-xs text-slate-400">
                      {channelOption.helper}
                    </span>
                    <span className="mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold text-slate-200">
                      {isActive ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            {!hasChannelsSelected && (
              <p className="mt-2 error-text">Select at least one channel.</p>
            )}
          </div>
        </div>
        <div className="mt-6">
          <label className="label" htmlFor="csv">
            Reviews CSV
          </label>
          <textarea
            id="csv"
            className="input min-h-[200px] font-mono"
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            placeholder="rating,text"
          />
          <p className="mt-2 text-xs text-slate-500">
            Tip: include as many rows as you like. We only keep the first 300 lines and focus on the text column.
          </p>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
            {rawDebug && (
              <details className="mt-2 text-xs text-rose-200/80">
                <summary>Show raw response</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">{rawDebug}</pre>
              </details>
            )}
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button className="btn" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Packs"}
          </button>
          <span className="text-xs text-slate-500">
            We call Gemini 1.5 Flash via a serverless function. Keep this tab open while we craft your pack.
          </span>
        </div>
      </section>

      <section className="card" ref={exportRef}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Output</h2>
            <p className="text-xs text-slate-400">
              Objection heatmap, claims & proof, plus channel-specific packs.
            </p>
          </div>
          <button
            className="btn"
            onClick={handleExportPdf}
            disabled={!result || isGenerating}
          >
            Export PDF
          </button>
        </div>

        {!result && !isGenerating && (
          <div className="empty-state mt-8">
            <span role="img" aria-label="sparkles" className="text-2xl">
              ✨
            </span>
            <p>Generated content will appear here once you run a batch.</p>
            <p className="text-xs text-slate-500">Use the sample CSV to test quickly.</p>
          </div>
        )}

        {isGenerating && (
          <div className="empty-state mt-8">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p>Summarising objections and crafting creative…</p>
          </div>
        )}

        {result && !isGenerating && (
          <div className="mt-10 space-y-10 text-sm text-slate-200">
            <div>
              <h3 className="text-xl font-semibold text-white">Objection Heatmap</h3>
              <div className="mt-4 grid gap-4">
                {result.objection_heatmap.map((item) => (
                  <div key={item.objection} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-semibold text-white">{item.objection}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="badge">Severity {item.severity}/5</span>
                        <span className="badge">Frequency {item.frequency}</span>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2 text-xs text-slate-300">
                      {item.example_quotes.map((quote, index) => (
                        <li key={index} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 italic">
                          “{quote}”
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white">Claims & Proof Cards</h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {result.claims_proof_cards.map((card, index) => (
                  <div key={`${card.claim}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <p className="text-xs uppercase tracking-wide text-accent">Claim</p>
                    <h4 className="mt-2 text-lg font-semibold text-white">{card.headline}</h4>
                    <p className="mt-1 text-sm text-slate-300">{card.subheadline}</p>
                    <p className="mt-4 text-xs font-semibold text-slate-400">Counter objection</p>
                    <p className="text-sm text-slate-200">{card.counter_objection}</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Supporting quotes
                      </p>
                      {card.supporting_quotes.map((quote, quoteIndex) => (
                        <p key={quoteIndex} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs italic">
                          “{quote}”
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.channel_packs.meta_ads && (
              <div>
                <h3 className="text-xl font-semibold text-white">Meta Ads</h3>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {result.channel_packs.meta_ads.map((variant, index) => (
                    <div key={index} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                      <p className="text-xs uppercase tracking-wide text-accent">Variant {index + 1}</p>
                      <p className="mt-2 text-sm font-semibold text-white">Hook</p>
                      <p className="text-sm text-slate-300">{variant.hook}</p>
                      <p className="mt-3 text-sm font-semibold text-white">Primary text</p>
                      <p className="text-sm text-slate-300">{variant.primary_text}</p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-300">
                        <p><span className="font-semibold text-white">Headline:</span> {variant.headline}</p>
                        <p><span className="font-semibold text-white">Description:</span> {variant.description}</p>
                        <p><span className="font-semibold text-white">CTA:</span> {variant.cta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.channel_packs.reels_scripts && (
              <div>
                <h3 className="text-xl font-semibold text-white">Reels Scripts</h3>
                <div className="mt-4 space-y-4">
                  {result.channel_packs.reels_scripts.map((script, index) => (
                    <div key={index} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                      <p className="text-xs uppercase tracking-wide text-accent">Script {index + 1}</p>
                      <p className="mt-2 text-sm font-semibold text-white">Hook</p>
                      <p className="text-sm text-slate-300">{script.hook}</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-300">
                        <p className="font-semibold text-white">Beats</p>
                        <ol className="list-decimal space-y-1 pl-5">
                          {script.beats.map((beat, beatIndex) => (
                            <li key={beatIndex}>{beat}</li>
                          ))}
                        </ol>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">
                        <span className="font-semibold text-white">CTA:</span> {script.cta}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.channel_packs.email_flows && (
              <div>
                <h3 className="text-xl font-semibold text-white">Email Flows</h3>
                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                  {Object.entries(result.channel_packs.email_flows).map(([flow, emails]) => (
                    <div key={flow} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                      <p className="text-xs uppercase tracking-wide text-accent">
                        {flow.replace(/_/g, " ")}
                      </p>
                      <div className="mt-3 space-y-4">
                        {emails.map((email, index) => (
                          <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Email {index + 1}
                            </p>
                            <p className="mt-2 text-sm text-slate-200">
                              <span className="font-semibold text-white">Subject:</span> {email.subject}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="font-semibold text-white">Preview:</span> {email.preview}
                            </p>
                            <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
                              {email.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.channel_packs.landing_page && (
              <div>
                <h3 className="text-xl font-semibold text-white">Landing Page Pack</h3>
                <div className="mt-4 grid gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <p className="text-sm font-semibold text-white">Hero headline</p>
                    <p className="text-sm text-slate-300">{result.channel_packs.landing_page.hero_headline}</p>
                    <p className="mt-2 text-sm font-semibold text-white">Subhead</p>
                    <p className="text-sm text-slate-300">{result.channel_packs.landing_page.subhead}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <p className="text-sm font-semibold text-white">Bullet claims</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                      {result.channel_packs.landing_page.bullet_claims.map((claim, index) => (
                        <li key={index}>{claim}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <p className="text-sm font-semibold text-white">Social proof</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      {result.channel_packs.landing_page.social_proof.map((proof, index) => (
                        <li key={index} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                          {proof}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <p className="text-sm font-semibold text-white">FAQ</p>
                    <div className="mt-2 space-y-3 text-sm text-slate-300">
                      {result.channel_packs.landing_page.faq.map((item, index) => (
                        <div key={index}>
                          <p className="font-semibold text-white">Q: {item.q}</p>
                          <p className="text-slate-300">A: {item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
