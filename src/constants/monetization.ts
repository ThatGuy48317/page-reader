export interface UserTier {
  id: 'free' | 'pro' | 'unlimited';
  name: string;
  maxConcurrentBooks: number;
}

export const TIERS: Record<string, UserTier> = {
  free: {
    id: 'free',
    name: 'Free Tier',
    maxConcurrentBooks: 5,
  },
  pro: {
    id: 'pro',
    name: 'Pro Tier',
    maxConcurrentBooks: 25,
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited Tier',
    maxConcurrentBooks: 9999,
  },
};

export const DEFAULT_USER_TIER = TIERS.free;
