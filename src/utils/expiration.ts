export interface ExpirationInfo {
  isExpired: boolean;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  urgency: 'normal' | 'warning' | 'expired';
}

/**
 * Calculates human-readable expiration details for 7-day audiobook retention.
 */
export function getExpirationInfo(expiresAt?: number): ExpirationInfo {
  if (!expiresAt) {
    return {
      isExpired: false,
      label: '7 days retention',
      badgeBg: 'rgba(59, 130, 246, 0.1)',
      badgeBorder: 'rgba(59, 130, 246, 0.3)',
      badgeTextColor: '#60a5fa',
      urgency: 'normal',
    };
  }

  const now = Date.now();
  const msRemaining = expiresAt - now;

  if (msRemaining <= 0) {
    return {
      isExpired: true,
      label: '⏰ Audio Expired',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      badgeBorder: 'rgba(239, 68, 68, 0.4)',
      badgeTextColor: '#f87171',
      urgency: 'expired',
    };
  }

  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));

  if (hoursRemaining < 24) {
    const hrs = hoursRemaining <= 0 ? 1 : hoursRemaining;
    return {
      isExpired: false,
      label: `⚠️ ${hrs} ${hrs === 1 ? 'hour' : 'hours'} left`,
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.4)',
      badgeTextColor: '#fbbf24',
      urgency: 'warning',
    };
  }

  const daysRemaining = Math.ceil(hoursRemaining / 24);

  return {
    isExpired: false,
    label: `⏳ ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`,
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeBorder: 'rgba(59, 130, 246, 0.25)',
    badgeTextColor: '#93c5fd',
    urgency: 'normal',
  };
}
