export type R2RChannel = "meta_ads" | "reels_scripts" | "email_flows" | "landing_page";

export interface ObjectionHeatmapItem {
  objection: string;
  frequency: number;
  severity: number;
  example_quotes: string[];
}

export interface ClaimsProofCard {
  claim: string;
  supporting_quotes: string[];
  counter_objection: string;
  headline: string;
  subheadline: string;
}

export interface MetaAdVariant {
  hook: string;
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
}

export interface ReelsScript {
  hook: string;
  beats: string[];
  cta: string;
}

export interface EmailAsset {
  subject: string;
  preview: string;
  body: string;
}

export interface LandingPagePack {
  hero_headline: string;
  subhead: string;
  bullet_claims: string[];
  social_proof: string[];
  faq: Array<{ q: string; a: string }>;
}

export interface ChannelPacks {
  meta_ads?: MetaAdVariant[];
  reels_scripts?: ReelsScript[];
  email_flows?: {
    welcome: EmailAsset[];
    abandon_cart: EmailAsset[];
  };
  landing_page?: LandingPagePack;
}

export interface R2RResponse {
  objection_heatmap: ObjectionHeatmapItem[];
  claims_proof_cards: ClaimsProofCard[];
  channel_packs: ChannelPacks;
}
