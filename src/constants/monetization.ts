export interface UserTier {
  id: 'free' | 'pro';
  name: string;
  maxConcurrentBooks: number;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  features: string[];
}

export const TIERS: Record<string, UserTier> = {
  free: {
    id: 'free',
    name: 'Free Starter',
    maxConcurrentBooks: 5,
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    features: [
      '5 Active audiobooks on bookshelf',
      'Standard Gemini text extraction & speech',
      '7-Day audio ephemeral retention',
      'Basic voice narrator library',
    ],
  },
  pro: {
    id: 'pro',
    name: 'PaperEcho Pro',
    maxConcurrentBooks: 9999,
    monthlyPriceUsd: 9.99,
    annualPriceUsd: 89.99,
    features: [
      'Unlimited active audiobooks',
      'Priority Gemini 3.6 Flash processing',
      'Ensemble Cast multi-narrator graphic novel voices',
      'Board Book & Tactile Accessibility Audio mode',
      'Re-narrate saved books with custom reading styles',
    ],
  },
};

export const DEFAULT_USER_TIER = TIERS.free;
