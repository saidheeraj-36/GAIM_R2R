import Link from "next/link";

const highlights = [
  "Cluster objections from messy customer feedback",
  "Spin up channel-ready creative assets in minutes",
  "Ground every claim in real customer proof"
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col gap-16">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <span className="badge self-start">R2R Platform</span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Turn raw reviews into revenue-driving creative packs.
          </h1>
          <p className="text-lg text-slate-300">
            Review-to-Revenue (R2R) ingests your customer feedback, clusters the
            most painful objections, and spins up channel-ready creative
            narratives with Gemini 1.5 Flash.
          </p>
          <ul className="grid gap-3 text-slate-300">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/generate" className="btn">
              Launch the Generator
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary"
            >
              Explore how it works
            </a>
          </div>
        </div>
        <div className="card border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white">
            Why objection-driven creative?
          </h2>
          <p className="mt-4 text-sm text-slate-300">
            Because the fastest way to unlock revenue is to remove friction. R2R
            surfaces what&apos;s blocking conversions and equips every channel with
            claims and proof that customers already believe.
          </p>
          <div className="mt-6 grid gap-4 text-sm text-slate-200">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="font-semibold text-accent">Gemini-powered synthesis</p>
              <p className="mt-2 text-slate-300">
                Gemini 1.5 Flash clusters paraphrased objections, ensuring every
                insight is backed by verbatim customer language.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="font-semibold text-accent">Channel-native assets</p>
              <p className="mt-2 text-slate-300">
                Get ad hooks, email flows, script beats, and page copy that stay
                within each platform&apos;s guardrails.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="card">
        <h2 className="text-2xl font-semibold text-white">How it works</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Drop your reviews",
              body: "Paste a CSV export of ratings + text. We focus on the verbatim feedback."
            },
            {
              title: "Select tones & channels",
              body: "Choose the creative vibes and distribution surfaces you care about."
            },
            {
              title: "Generate & export",
              body: "Review objection heatmaps, proof-backed claims, and export to PDF."
            }
          ].map((step) => (
            <div key={step.title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/generate" className="btn">
            Start creating packs
          </Link>
        </div>
      </section>
    </main>
  );
}
