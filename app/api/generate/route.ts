import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { R2RChannel, R2RResponse } from "@/types/r2r";

const MAX_ROWS = 300;

function ensureEnv() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your environment variables."
    );
  }
  return apiKey;
}

function parseCsvReviews(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_ROWS)
    .map((line) => {
      const firstComma = line.indexOf(",");
      if (firstComma === -1) {
        return line;
      }
      const text = line.slice(firstComma + 1).trim();
      return text.replace(/^"|"$/g, "");
    })
    .filter((line) => line.length > 0);
}

function buildPrompt(params: {
  brand: string;
  product: string;
  tone: string;
  channels: R2RChannel[];
  reviews: string[];
}): string {
  const { brand, product, tone, channels, reviews } = params;
  const channelList = channels.join(", ") || "none";
  const joinedReviews = reviews
    .map((review, idx) => `${idx + 1}. ${review}`)
    .join("\n");

  return `You are Review-to-Revenue (R2R), a strategist that converts customer reviews into objection-driven creative.
Follow these rules strictly:
- Only respond with valid JSON matching the provided schema.
- Derive objections by clustering paraphrases across the review texts.
- Count frequency as the number of clustered mentions and severity from 1 (minor) to 5 (dealbreaker).
- Ground every claim, objection, and proof point in the supplied review quotes. If you cannot ground it, acknowledge the gap or use neutral phrasing.
- Respect the character/word limits: meta_ads primary_text <= 125 characters, headline <= 40 characters, description <= 60 characters; email subjects <= 60 characters, previews <= 90 characters, bodies <= 220 words.
- Only include channel packs for the channels explicitly requested: ${channelList}.
- Provide at least one quote per objection and claim; quotes should be direct excerpts.
- Use concise, clear language consistent with the tone "${tone}".

Context:
Brand: ${brand}
Product: ${product}
Requested Channels: ${channelList}

Customer review excerpts (rating ignored):
${joinedReviews}

Return JSON only in the following TypeScript type shape:
${JSON.stringify(
    {
      objection_heatmap: [
        {
          objection: "string",
          frequency: 0,
          severity: 1,
          example_quotes: ["string"]
        }
      ],
      claims_proof_cards: [
        {
          claim: "string",
          supporting_quotes: ["string"],
          counter_objection: "string",
          headline: "string",
          subheadline: "string"
        }
      ],
      channel_packs: {
        meta_ads: [
          {
            hook: "string",
            primary_text: "string",
            headline: "string",
            description: "string",
            cta: "string"
          }
        ],
        reels_scripts: [
          {
            hook: "string",
            beats: ["string"],
            cta: "string"
          }
        ],
        email_flows: {
          welcome: [
            {
              subject: "string",
              preview: "string",
              body: "string"
            }
          ],
          abandon_cart: [
            {
              subject: "string",
              preview: "string",
              body: "string"
            }
          ]
        },
        landing_page: {
          hero_headline: "string",
          subhead: "string",
          bullet_claims: ["string"],
          social_proof: ["string"],
          faq: [
            {
              q: "string",
              a: "string"
            }
          ]
        }
      }
    },
    null,
    2
  )}
`;
}

export async function POST(request: Request) {
  try {
    const apiKey = ensureEnv();
    const { brand, product, csv, tone, channels } = (await request.json()) as {
      brand?: string;
      product?: string;
      csv?: string;
      tone?: string;
      channels?: R2RChannel[];
    };

    if (!brand || !product || !csv || !tone || !channels?.length) {
      return NextResponse.json(
        { error: "Missing required fields. Ensure brand, product, tone, channels, and csv are provided." },
        { status: 400 }
      );
    }

    const reviews = parseCsvReviews(csv);

    if (!reviews.length) {
      return NextResponse.json(
        { error: "No review text found in the CSV." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt({ brand, product, tone, channels, reviews });
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent(prompt);
    const raw = response.response.text();

    try {
      const parsed = JSON.parse(raw) as R2RResponse;
      return NextResponse.json(parsed, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Gemini returned an unexpected response. Please try again.",
          raw
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("/api/generate", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error. Please try again later."
      },
      { status: 500 }
    );
  }
}
