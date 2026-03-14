export const CANCELLATION_POLICY = {
  fullRefundHours: 48,
  halfRefundHours: 24,
  minNoticeHours: 24,
} as const;

export type RefundTier = 'full' | 'half' | 'none';

export function getRefundTierLabel(tier: RefundTier): string {
  if (tier === 'full') return 'Full refund';
  if (tier === 'half') return '50% refund';
  return 'No refund';
}

export function getRefundPolicyText(): string {
  return `Cancel at least ${CANCELLATION_POLICY.minNoticeHours} hours before start. Full refund >${CANCELLATION_POLICY.fullRefundHours}h, 50% refund ${CANCELLATION_POLICY.halfRefundHours}-${CANCELLATION_POLICY.fullRefundHours}h, no refund <${CANCELLATION_POLICY.halfRefundHours}h.`;
}
